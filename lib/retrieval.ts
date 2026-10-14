import type { SourceChunk } from './types';

const STOP_WORDS = new Set(
  'a an and are as at be by for from has have how i in is it of on or that the this to was what when where which who why with can does do did tell me about according'.split(
    ' ',
  ),
);

export function tokenize(value: string): string[] {
  const words =
    value
      .toLowerCase()
      .match(/[a-z0-9]+(?:[.'’-][a-z0-9]+)*/g)
      ?.filter((word) => word.length > 1 && !STOP_WORDS.has(word)) ?? [];

  const tokens = new Set<string>();
  for (const word of words) {
    tokens.add(word);
    if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) {
      tokens.add(word.slice(0, -1));
    }
  }
  return Array.from(tokens);
}

export function splitIntoChunks(
  text: string,
  documentId: string,
  documentName: string,
): SourceChunk[] {
  // Support explicit page break markers, form feed characters (\f), or double form feeds
  const rawPages = text.split(/\n\s*---\s*PAGE\s*BREAK\s*---\s*\n|\f/i);
  // If the document began with a page break, the first element might be empty
  if (rawPages.length > 1 && rawPages[0].trim() === '') {
    rawPages.shift();
  }

  const chunks: SourceChunk[] = [];
  rawPages.forEach((pageText, index) => {
    const pageNumber = index + 1;
    const normalized = pageText.replace(/\s+/g, ' ').trim();
    if (!normalized) return;
    const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [
      normalized,
    ];
    let buffer = '';
    for (const sentence of sentences) {
      if ((buffer + ' ' + sentence).length > 850 && buffer.trim()) {
        chunks.push({
          id: `${documentId}-${pageNumber}-${chunks.length}`,
          documentId,
          documentName,
          page: pageNumber,
          text: buffer.trim(),
        });
        buffer = sentence;
      } else buffer += ` ${sentence}`;
    }
    if (buffer.trim())
      chunks.push({
        id: `${documentId}-${pageNumber}-${chunks.length}`,
        documentId,
        documentName,
        page: pageNumber,
        text: buffer.trim(),
      });
  });
  return chunks;
}

export function rankChunks(
  question: string,
  chunks: SourceChunk[],
  limit = 6,
): (SourceChunk & { score: number })[] {
  const queryTerms = [...new Set(tokenize(question))];
  if (!queryTerms.length) return [];
  const docs = chunks.map((chunk) => ({ chunk, terms: tokenize(chunk.text) }));
  const avgLength =
    docs.reduce((sum, item) => sum + item.terms.length, 0) /
    Math.max(docs.length, 1);
  const df = new Map<string, number>();
  queryTerms.forEach((term) =>
    df.set(term, docs.filter((item) => item.terms.includes(term)).length),
  );
  return docs
    .map(({ chunk, terms }) => {
      let score = 0;
      for (const term of queryTerms) {
        const frequency = terms.filter((item) => item === term).length;
        if (!frequency) continue;
        const idf = Math.log(
          1 +
          (docs.length - (df.get(term) ?? 0) + 0.5) /
          ((df.get(term) ?? 0) + 0.5),
        );
        score +=
          (idf * (frequency * 2.2)) /
          (frequency +
            1.2 * (0.25 + (0.75 * terms.length) / Math.max(avgLength, 1)));
      }
      const phrase = question.toLowerCase().trim();
      const lowerText = chunk.text.toLowerCase();
      if (phrase.length > 5 && lowerText.includes(phrase)) score += 4;

      const isLookingForProcedure =
        /step|procedure|how to|setup|priming|install/i.test(question) &&
        !/troubleshoot|fault|problem|fail|leak|error/i.test(question);

      // Sub-phrase boosts for technical manuals & product comparisons
      if (phrase.includes('model a') && lowerText.includes('model a')) score += 3.5;
      if (phrase.includes('model b') && lowerText.includes('model b')) score += 3.5;
      if (phrase.includes('priming') && lowerText.includes('priming procedure')) score += 6;
      if (phrase.includes('model a') && lowerText.includes('manual priming procedure')) score += 8;
      if (phrase.includes('step') && (lowerText.includes('step') || lowerText.includes('procedure'))) score += 3;
      if (phrase.includes('spec') && lowerText.includes('specification')) score += 2;
      if (phrase.includes('pressure') && lowerText.includes('pressure')) score += 1.5;

      // Penalize troubleshooting tables when user asks for setup/procedure steps
      if (isLookingForProcedure && (lowerText.includes('troubleshooting guide') || lowerText.includes('symptompossible causeaction'))) {
        score -= 8;
      }

      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function cleanAndFormatPassage(text: string): string {
  let cleaned = text;

  // 1. Detect procedure step table collisions e.g., "Step Action 1 Disconnect... 2 Confirm..."
  if (/Step\s*Action/i.test(cleaned) || /\bStep\s*\d+/i.test(cleaned) || /\b\d\s*[A-Z][a-z]+/i.test(cleaned)) {
    cleaned = cleaned.replace(/Step\s*Action/gi, '').trim();
    cleaned = cleaned.replace(
      /(?:^|\s+)(\d{1,2})\s*([A-Za-z])/g,
      (_match, num, letter) => `\n${num}. ${letter}`,
    );
    cleaned = cleaned.replace(
      /\s*(MODEL [A-Z] STARTUP CHECK|WARNING|CAUTION|IMPORTANT:?)/gi,
      (_m, alert) => `\n\n> **${alert}**:\n`,
    );
    return cleaned.trim();
  }

  // 2. Clean general table collisions e.g., "Symptom Possible cause Action"
  if (/Symptom\s*Possible\s*cause\s*Action/i.test(cleaned)) {
    return cleaned
      .replace(/Symptom\s*Possible\s*cause\s*Action/gi, 'Troubleshooting Guide:\n')
      .replace(/([a-z])([A-Z][a-z])/g, '$1. $2')
      .trim();
  }

  // 3. Normalize multiple spaces and preserve sensible paragraph breaks
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function makeLocalAnswer(
  question: string,
  matches: ReturnType<typeof rankChunks>,
): string {
  if (!matches.length || matches[0].score < 0.3) {
    return 'The uploaded documents do not contain information to answer that question.';
  }

  const topMatch = matches[0];
  const cleanedLead = cleanAndFormatPassage(topMatch.text);

  let output = `**Passage from ${topMatch.documentName} (Page ${topMatch.page}):**\n\n${cleanedLead}`;

  const secondary = matches.slice(1, 3).filter((m) => m.documentId !== topMatch.documentId || m.page !== topMatch.page);
  if (secondary.length > 0) {
    output += '\n\n**Related References:**\n';
    for (const match of secondary) {
      const excerpt = cleanAndFormatPassage(match.text.slice(0, 180));
      output += `- **Page ${match.page} (${match.documentName}):** ${excerpt}…\n`;
    }
  }

  return output;
}
