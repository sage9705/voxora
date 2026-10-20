'use client';

import Article from '@mui/icons-material/Article';
import Code from '@mui/icons-material/Code';
import Description from '@mui/icons-material/Description';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import TableChart from '@mui/icons-material/TableChart';
import type { DocumentFormat } from '@/lib/types';

export function getFormatFromFilename(filename: string): DocumentFormat {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt') return 'txt';
  if (ext === 'md' || ext === 'markdown') return 'md';
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  return 'pdf';
}

export function DocumentIcon({
  format,
  filename,
  size = 18,
  className = '',
}: {
  format?: DocumentFormat;
  filename?: string;
  size?: number;
  className?: string;
}) {
  const resolvedFormat =
    format || (filename ? getFormatFromFilename(filename) : 'pdf');

  switch (resolvedFormat) {
    case 'docx':
      return <Description style={{ fontSize: size }} className={className || 'text-blue-400'} />;
    case 'txt':
      return <Article style={{ fontSize: size }} className={className || 'text-slate-400'} />;
    case 'md':
      return <Code style={{ fontSize: size }} className={className || 'text-purple-400'} />;
    case 'csv':
    case 'xlsx':
      return <TableChart style={{ fontSize: size }} className={className || 'text-emerald-400'} />;
    case 'pdf':
    default:
      return <PictureAsPdf style={{ fontSize: size }} className={className || 'text-[#e99494]'} />;
  }
}

export function getFormatBadgeColor(format?: DocumentFormat, filename?: string) {
  const resolved = format || (filename ? getFormatFromFilename(filename) : 'pdf');
  switch (resolved) {
    case 'docx':
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/25',
        text: 'text-blue-400',
        label: 'DOCX',
      };
    case 'txt':
      return {
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/25',
        text: 'text-slate-400',
        label: 'TXT',
      };
    case 'md':
      return {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/25',
        text: 'text-purple-400',
        label: 'MD',
      };
    case 'csv':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        text: 'text-emerald-400',
        label: 'CSV',
      };
    case 'xlsx':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        text: 'text-emerald-400',
        label: 'XLSX',
      };
    case 'pdf':
    default:
      return {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/25',
        text: 'text-rose-400',
        label: 'PDF',
      };
  }
}
