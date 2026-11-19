import type { ChatMessage, DocumentRecord } from './types';

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function getFileDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateMarkdownReport(
  messages: ChatMessage[],
  documents: DocumentRecord[] = [],
): string {
  const generatedAt = formatDate(Date.now());
  const docNames = documents.map((d) => d.name).join(', ') || 'Uploaded session files';
  const totalQuestions = messages.filter((m) => m.role === 'user').length;
  const totalAnswers = messages.filter((m) => m.role === 'assistant').length;

  let report = `# Voxora Intelligence Report\n\n`;
  report += `**Generated:** ${generatedAt}\n`;
  report += `**Source Documents:** ${docNames}\n`;
  report += `**Conversation Summary:** ${totalQuestions} Questions, ${totalAnswers} Answers\n\n`;
  report += `---\n\n`;

  for (const msg of messages) {
    if (msg.role === 'user') {
      report += `## User Question\n\n`;
      report += `> ${msg.content}\n\n`;
      report += `*Asked at ${formatDate(msg.createdAt)}*\n\n`;
    } else if (msg.role === 'assistant') {
      report += `### Assistant Answer\n\n`;
      report += `${msg.content}\n\n`;

      if (msg.sources && msg.sources.length > 0) {
        report += `#### Grounded Sources & Citations:\n\n`;
        for (const src of msg.sources) {
          const relevance = Math.round((src.relevance || 0) * 100);
          report += `- **${src.documentName}** (Page ${src.page}) — *${relevance}% relevance score*\n`;
          if (src.excerpt) {
            report += `  > "${src.excerpt.trim()}"\n`;
          }
        }
        report += `\n`;
      }

      if (msg.latencyMs) {
        report += `*Response Latency: ${msg.latencyMs}ms*\n\n`;
      }

      report += `---\n\n`;
    }
  }

  report += `\n*Report compiled by Voxora Document Assistant*\n`;
  return report;
}

export function downloadMarkdownReport(
  messages: ChatMessage[],
  documents: DocumentRecord[] = [],
): void {
  if (typeof window === 'undefined' || !messages.length) return;

  const markdown = generateMarkdownReport(messages, documents);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `voxora-report-${getFileDateString()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPdfReport(
  messages: ChatMessage[],
  documents: DocumentRecord[] = [],
): void {
  if (typeof window === 'undefined' || !messages.length) return;

  const generatedAt = formatDate(Date.now());
  const docNames = documents.map((d) => d.name).join(', ') || 'Uploaded documents';
  const totalQuestions = messages.filter((m) => m.role === 'user').length;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export the PDF report.');
    return;
  }

  let turnsHtml = '';
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user') {
      turnsHtml += `
        <div class="turn-block">
          <div class="user-bubble">
            <span class="role-badge user-badge">USER QUESTION</span>
            <div class="prompt-text">${escapeHtml(msg.content)}</div>
            <div class="turn-time">${formatDate(msg.createdAt)}</div>
          </div>
      `;
    } else if (msg.role === 'assistant') {
      let sourcesHtml = '';
      if (msg.sources && msg.sources.length > 0) {
        sourcesHtml = `
          <div class="sources-box">
            <div class="sources-title">Verified Sources &amp; Citations:</div>
            ${msg.sources
              .map(
                (s) => `
              <div class="source-item">
                <span class="source-doc">${escapeHtml(s.documentName)}</span>
                <span class="source-page">Page ${s.page}</span>
                <span class="source-rel">${Math.round((s.relevance || 0) * 100)}% match</span>
                ${s.excerpt ? `<div class="source-quote">&ldquo;${escapeHtml(s.excerpt)}&rdquo;</div>` : ''}
              </div>
            `,
              )
              .join('')}
          </div>
        `;
      }

      turnsHtml += `
          <div class="assistant-bubble">
            <span class="role-badge assistant-badge">VOXORA ANSWER</span>
            <div class="answer-text">${formatAnswerToHtml(msg.content)}</div>
            ${sourcesHtml}
          </div>
        </div>
      `;
    }
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Voxora Intelligence Report - ${getFileDateString()}</title>
  <style>
    @page {
      margin: 18mm 16mm;
      size: A4 portrait;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.55;
      font-size: 13.5px;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 4px 16px;
      font-size: 12px;
      color: #4b5563;
    }
    .meta-label {
      font-weight: 600;
      color: #374151;
    }
    .turn-block {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .user-bubble {
      background: #f3f4f6;
      border-left: 3px solid #6366f1;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .role-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.6px;
      margin-bottom: 6px;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .user-badge {
      background: #e0e7ff;
      color: #4338ca;
    }
    .assistant-badge {
      background: #ecfdf5;
      color: #065f46;
    }
    .prompt-text {
      font-weight: 600;
      font-size: 14.5px;
      color: #111827;
    }
    .turn-time {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }
    .assistant-bubble {
      padding: 4px 16px 12px 16px;
    }
    .answer-text {
      color: #1f2937;
      font-size: 13.5px;
    }
    .answer-text p {
      margin: 8px 0;
    }
    .sources-box {
      margin-top: 14px;
      padding: 10px 14px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }
    .sources-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .source-item {
      font-size: 12px;
      padding: 4px 0;
      border-bottom: 1px dashed #e5e7eb;
    }
    .source-item:last-child {
      border-bottom: 0;
    }
    .source-doc {
      font-weight: 600;
      color: #111827;
    }
    .source-page {
      margin: 0 6px;
      background: #e5e7eb;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 11px;
    }
    .source-rel {
      color: #059669;
      font-weight: 600;
      font-size: 11px;
    }
    .source-quote {
      font-style: italic;
      color: #4b5563;
      margin-top: 3px;
      font-size: 11.5px;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      margin-top: 36px;
      padding-top: 12px;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Voxora Intelligence Report</h1>
    <div class="meta-grid">
      <div class="meta-label">Generated:</div>
      <div>${generatedAt}</div>
      <div class="meta-label">Documents:</div>
      <div>${escapeHtml(docNames)}</div>
      <div class="meta-label">Inquiries:</div>
      <div>${totalQuestions} Questions Documented</div>
    </div>
  </div>

  <div class="content">
    ${turnsHtml}
  </div>

  <div class="footer">
    Compiled by Voxora Document Assistant &middot; Complete Conversation &amp; Reference Audit
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatAnswerToHtml(content: string): string {
  const paragraphs = content.split('\n\n');
  return paragraphs
    .map((p) => {
      let text = escapeHtml(p.trim());
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      text = text.replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:12px;">$1</code>');
      text = text.replace(/\n/g, '<br />');
      return `<p>${text}</p>`;
    })
    .join('');
}
