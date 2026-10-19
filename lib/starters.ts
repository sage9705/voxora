import type { DocumentRecord } from './types';
import { STARTERS } from './constants';

export type StarterQuestion = {
  label: string;
  question: string;
};

function cleanDocName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dynamically generates relevant starter questions based on the uploaded document(s).
 *
 * - If sample NX-300 manuals are loaded, returns the core technical validation questions.
 * - For any uploaded document, extracts real headings, chapters, sections, and thematic
 *   topics from the parsed text chunks to generate tailored, grounded starter cards.
 * - If multiple documents are uploaded, includes comparative questions between them.
 */
export function getDynamicStarters(
  documents: DocumentRecord[],
): StarterQuestion[] {
  if (!documents || documents.length === 0) {
    return [];
  }

  // If all loaded documents are the sample NX-300 manuals, use the verified manual starters
  const isSampleSet = documents.every((d) => /nexgen|nx-?300/i.test(d.name));
  if (isSampleSet) {
    return STARTERS;
  }

  const starters: StarterQuestion[] = [];
  const primaryDoc = documents[0];
  const primaryName = cleanDocName(primaryDoc.name);

  // 1. Comparison question if multiple documents are uploaded
  if (documents.length > 1) {
    const secondName = cleanDocName(documents[1].name);
    starters.push({
      label: 'Compare documents',
      question: `How do ${primaryName} and ${secondName} compare in their main points and differences?`,
    });
  }

  // 2. Executive summary / purpose starter
  starters.push({
    label: 'Document summary',
    question: `What are the primary objectives, scope, and key takeaways from ${primaryName}?`,
  });

  // 3. Extract real headings / sections from document chunks
  const headingCandidates: string[] = [];
  const headingRegex =
    /(?:^|\n)\s*(?:(\d+[\.\)]\s+[A-Z][A-Za-z0-9 ,'\-–]{2,45})|((?:Section|Chapter|Part)\s+\d+[\.\d]*\s*[:\-–]?\s*[A-Z][A-Za-z0-9 ,'\-–]{2,45})|([A-Z][A-Z0-9\s,&'\-–]{4,40}))(?:\n|$)/gm;

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      let match: RegExpExecArray | null;
      while ((match = headingRegex.exec(chunk.text)) !== null) {
        const rawTitle = (match[1] || match[2] || match[3] || '').trim();
        const cleanTitle = rawTitle
          .replace(/^\d+[\.\)]\s*/, '')
          .replace(/^(?:section|chapter|part)\s+\d+[\.\d]*\s*[:\-–]?\s*/i, '')
          .trim();

        if (
          cleanTitle &&
          cleanTitle.length >= 4 &&
          cleanTitle.length <= 40 &&
          !/page\s*\d+|table of contents|contents|copyright|all rights reserved|user manual|document control|document ID|fielddetails|intended audience/i.test(
            cleanTitle,
          ) &&
          !headingCandidates.some(
            (h) => h.toLowerCase() === cleanTitle.toLowerCase(),
          )
        ) {
          headingCandidates.push(cleanTitle);
        }
        if (headingCandidates.length >= 8) break;
      }
      if (headingCandidates.length >= 8) break;
    }
    if (headingCandidates.length >= 8) break;
  }

  // Turn extracted headings into specific questions
  for (const heading of headingCandidates) {
    if (starters.length >= 6) break;
    starters.push({
      label: heading.length > 24 ? `${heading.slice(0, 24)}…` : heading,
      question: `What does ${primaryName} explain about ${heading.toLowerCase()}?`,
    });
  }

  // 4. Thematic fallbacks based on text presence to ensure 4-6 rich starters
  const combinedText = documents
    .map((d) =>
      d.chunks
        .slice(0, 6)
        .map((c) => c.text)
        .join(' '),
    )
    .join(' ')
    .toLowerCase();

  if (
    starters.length < 5 &&
    /step|procedure|process|install|setup|instruction|method/i.test(
      combinedText,
    )
  ) {
    starters.push({
      label: 'Key procedures',
      question: `What step-by-step procedures or operational instructions are specified in ${primaryName}?`,
    });
  }

  if (
    starters.length < 5 &&
    /spec|specification|limit|rating|parameter|voltage|pressure|dimension|requirement/i.test(
      combinedText,
    )
  ) {
    starters.push({
      label: 'Specifications & limits',
      question: `What are the technical specifications, operating limits, and parameters listed in ${primaryName}?`,
    });
  }

  if (
    starters.length < 5 &&
    /warning|caution|danger|safety|hazard|precaution|prohibited/i.test(
      combinedText,
    )
  ) {
    starters.push({
      label: 'Safety & precautions',
      question: `What safety warnings, hazards, or critical precautions are highlighted in ${primaryName}?`,
    });
  }

  if (
    starters.length < 5 &&
    /troubleshoot|fault|error|diagnostic|leak|issue|defect/i.test(combinedText)
  ) {
    starters.push({
      label: 'Troubleshooting',
      question: `What troubleshooting steps and common issues are covered in ${primaryName}?`,
    });
  }

  if (
    starters.length < 6 &&
    /faq|warranty|contact|maintenance|schedule|audit|compliance/i.test(
      combinedText,
    )
  ) {
    starters.push({
      label: 'Maintenance & rules',
      question: `What maintenance requirements, schedules, or rules are outlined in ${primaryName}?`,
    });
  }

  // Guaranteed minimum cards
  if (starters.length < 3) {
    starters.push({
      label: 'Key findings',
      question: `What are the most important facts, findings, and details mentioned in ${primaryName}?`,
    });
  }

  return starters.slice(0, 6);
}
