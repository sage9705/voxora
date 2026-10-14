import type { SourceChunk } from './types';

const STOP_WORDS = new Set(
  'a an and are as at be by for from has have how i in is it of on or that the this to was what when where which who why with can does do did tell me about according'.split(
    ' ',
  ),
);

export function tokenize(value: string): string[] {
  return (
    value
      .toLowerCase()
      .match(/[a-z0-9]+(?:[.'’-][a-z0-9]+)*/g)
      ?.filter((word) => word.length > 1 && !STOP_WORDS.has(word)) ?? []
  );
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
      if (phrase.length > 5 && chunk.text.toLowerCase().includes(phrase))
        score += 2;
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function makeLocalAnswer(
  question: string,
  matches: ReturnType<typeof rankChunks>,
): string {
  if (!matches.length || matches[0].score < 0.3)
    return 'The uploaded documents do not contain information to answer that question.';
  const best = matches.slice(0, 3);
  const lead = best[0].text;
  const supporting = best
    .slice(1)
    .filter((item) => item.text !== lead)
    .map((item) => item.text);
  return `${lead}${supporting.length ? `\n\nAdditional context: ${supporting.join(' ')}` : ''}\n\n(Local retrieval result grounded in source passages)`;
}
