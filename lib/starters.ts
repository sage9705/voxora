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
 * Dynamically provides relevant starter questions based on the uploaded document(s).
 *
 * Priority:
 * 1. AI-generated questions (from Groq API during ingestion or via /api/starters)
 * 2. If sample NX-300 manuals are loaded, returns the verified technical validation questions
 * 3. Smart contextual fallback based on detected document domain (CV/Resume, Contract, Report, Manual)
 */
export function getDynamicStarters(
  documents: DocumentRecord[],
): StarterQuestion[] {
  if (!documents || documents.length === 0) {
    return [];
  }

  // 1. If any documents have AI-generated suggested questions, prioritize and use them!
  const aiQuestions = documents.flatMap((d) => d.suggestedQuestions || []);
  if (aiQuestions.length > 0) {
    if (documents.length > 1) {
      const primaryName = cleanDocName(documents[0].name);
      const secondName = cleanDocName(documents[1].name);
      return [
        {
          label: 'Compare documents',
          question: `How do ${primaryName} and ${secondName} compare in their main points and qualifications?`,
        },
        ...aiQuestions.slice(0, 5),
      ];
    }
    return aiQuestions.slice(0, 6);
  }

  // 2. If all loaded documents are the sample NX-300 manuals, use the verified manual starters
  const isSampleSet = documents.every((d) => /nexgen|nx-?300/i.test(d.name));
  if (isSampleSet) {
    return STARTERS;
  }

  const starters: StarterQuestion[] = [];
  const primaryDoc = documents[0];
  const primaryName = cleanDocName(primaryDoc.name);
  const combinedText = documents
    .map((d) =>
      d.text
        ? d.text.slice(0, 4000)
        : d.chunks
            .slice(0, 6)
            .map((c) => c.text)
            .join(' '),
    )
    .join(' ')
    .toLowerCase();
  const lowerDocName = primaryDoc.name.toLowerCase();

  // Multi-document comparison if applicable
  if (documents.length > 1) {
    const secondName = cleanDocName(documents[1].name);
    starters.push({
      label: 'Compare documents',
      question: `How do ${primaryName} and ${secondName} compare in their main points and content?`,
    });
  }

  // Domain detection: CV / Resume
  const isResume =
    /cv|resume|curriculum vitae|biodata/i.test(lowerDocName) ||
    (/experience|education|skills|employment|projects|certifications/i.test(
      combinedText,
    ) &&
      /candidate|developer|engineer|manager|graduate|university|bachelor|master|bsc|msc|software|work/i.test(
        combinedText,
      ));

  if (isResume) {
    starters.push({
      label: 'Professional background',
      question: `What is the candidate's professional background and primary area of expertise in ${primaryName}?`,
    });
    starters.push({
      label: 'Work experience',
      question: `What are the candidate's key roles, companies, and major accomplishments listed in ${primaryName}?`,
    });
    starters.push({
      label: 'Technical skills',
      question: `What programming languages, frameworks, and core technical skills are documented in ${primaryName}?`,
    });
    starters.push({
      label: 'Education & credentials',
      question: `What degrees, academic institutions, or certifications are held according to ${primaryName}?`,
    });
    return starters.slice(0, 6);
  }

  // Domain detection: Contract / Legal Agreement
  const isLegal =
    /agreement|contract|nda|terms|clause|mou|lease/i.test(lowerDocName) ||
    /indemnif|confidential|breach|termination clause|governing law|warranties/i.test(
      combinedText,
    );

  if (isLegal) {
    starters.push({
      label: 'Key obligations',
      question: `What are the primary obligations and responsibilities of the parties in ${primaryName}?`,
    });
    starters.push({
      label: 'Terms & duration',
      question: `What are the effective dates, duration, renewal conditions, and termination clauses in ${primaryName}?`,
    });
    starters.push({
      label: 'Payment terms',
      question: `What payment terms, fees, or compensation schedules are specified in ${primaryName}?`,
    });
    starters.push({
      label: 'Liability & indemnity',
      question: `What liability limitations, indemnifications, or dispute resolution terms are outlined in ${primaryName}?`,
    });
    return starters.slice(0, 6);
  }

  // Domain detection: Financial / Business Report
  const isFinancial =
    /financial|quarter|q[1-4]|annual report|earnings|audit|revenue|balance sheet|profit/i.test(
      lowerDocName,
    ) ||
    /ebitda|gross margin|fiscal year|cash flow|net income|shareholders/i.test(
      combinedText,
    );

  if (isFinancial) {
    starters.push({
      label: 'Financial performance',
      question: `What are the primary financial results, revenue, and margins reported in ${primaryName}?`,
    });
    starters.push({
      label: 'Key growth drivers',
      question: `What growth drivers and performance metrics are highlighted in ${primaryName}?`,
    });
    starters.push({
      label: 'Risk factors',
      question: `What market risks or financial headwinds are discussed in ${primaryName}?`,
    });
    starters.push({
      label: 'Outlook & forecast',
      question: `What future outlook and strategic guidance is provided in ${primaryName}?`,
    });
    return starters.slice(0, 6);
  }

  // General Document
  starters.push({
    label: 'Document summary',
    question: `What are the primary objectives, key topics, and takeaways from ${primaryName}?`,
  });

  // Extract headings from chunks
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
        if (headingCandidates.length >= 6) break;
      }
      if (headingCandidates.length >= 6) break;
    }
    if (headingCandidates.length >= 6) break;
  }

  for (const heading of headingCandidates) {
    if (starters.length >= 5) break;
    starters.push({
      label: heading.length > 24 ? `${heading.slice(0, 24)}…` : heading,
      question: `What does ${primaryName} explain about ${heading.toLowerCase()}?`,
    });
  }

  if (starters.length < 3) {
    starters.push({
      label: 'Key details',
      question: `What are the most notable findings, instructions, or facts presented in ${primaryName}?`,
    });
  }

  return starters.slice(0, 6);
}
