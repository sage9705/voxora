'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  FileText,
  FileUp,
  LoaderCircle,
  Mic,
  Plus,
  BookOpen,
  Search,
  Cpu,
} from 'lucide-react';

type WelcomeGridProps = {
  uploading: boolean;
  onUploadFiles: (files: FileList | File[]) => void;
  onLoadSamples: () => void;
  onOpenFileInput: () => void;
};

export function WelcomeGrid({
  uploading,
  onUploadFiles,
  onLoadSamples,
  onOpenFileInput,
}: WelcomeGridProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 pb-8 max-[1050px]:grid-cols-2 max-[760px]:grid-cols-1 max-[760px]:gap-3.5">
      <div
        className="border border-line bg-panel rounded-xl overflow-hidden min-h-[300px] max-[760px]:min-h-[280px]"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void onUploadFiles(event.dataTransfer.files);
        }}
      >
        <div
          className={`min-h-[242px] max-[760px]:min-h-[220px] p-[26px_20px] flex flex-col items-center justify-center text-center border border-dashed m-2.5 rounded-lg transition-colors duration-200 ${
            dragging
              ? 'border-accent bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]'
              : 'border-transparent'
          }`}
        >
          <div className="w-[52px] h-[52px] border border-line-strong rounded-2xl grid place-items-center text-accent bg-panel-raised mb-4">
            <FileUp size={25} />
          </div>
          <h2 className="font-heading font-semibold text-lg tracking-[-0.4px] mt-0 mb-2">
            Bring your documents
          </h2>
          <p className="text-[13.5px] text-muted leading-[1.6] mt-0 mb-[18px]">
            Drop your PDFs here, or browse your computer.
          </p>
          <button
            className="h-[42px] rounded-lg flex items-center justify-center gap-2 px-4 text-[13.5px] font-bold transition-[transform,background,filter] duration-150 bg-accent text-accent-ink border border-accent hover:brightness-[1.06] hover:-translate-y-px disabled:opacity-65 disabled:cursor-not-allowed"
            onClick={onOpenFileInput}
            disabled={uploading}
          >
            {uploading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            {uploading ? 'Reading document…' : 'Choose PDF files'}
          </button>
          <span className="text-[11.5px] text-muted-2 mt-3.5 [&>span]:px-1">
            PDF only <span>·</span> Up to 2 files &amp; 10 pages total <span>·</span> 8 MB limit
          </span>
        </div>
        <div className="border-t border-line h-12 flex items-center justify-center gap-5 text-muted text-xs">
          <div className="flex items-center gap-[7px] [&>svg]:text-cyan">
            <Cpu size={16} />
            <span>Session-based processing</span>
          </div>
          <span className="h-4 w-px bg-line" />
          <div className="flex items-center gap-[7px] [&>svg]:text-cyan">
            <FileText size={16} />
            <span>Text-based PDFs</span>
          </div>
        </div>
      </div>

      <div className="border border-line bg-panel rounded-xl overflow-hidden min-h-[300px] max-[760px]:min-h-[290px] p-[22px_21px_16px] max-[1050px]:p-[18px] flex flex-col">
        <div className="flex items-center justify-between mb-[15px]">
          <div className="w-9 h-9 border border-[color-mix(in_srgb,var(--purple)_30%,var(--line))] rounded-[10px] bg-[color-mix(in_srgb,var(--purple)_10%,var(--panel))] text-purple grid place-items-center">
            <BookOpen size={18} />
          </div>
          <span className="font-mono font-semibold text-[11px] tracking-[0.8px] text-purple py-[5px] px-2 border border-[color-mix(in_srgb,var(--purple)_30%,var(--line))] rounded-[5px]">
            SAMPLE MANUALS
          </span>
        </div>
        <h2 className="font-heading font-semibold text-lg tracking-[-0.4px] mt-0 mb-2">
          Prefer to explore first?
        </h2>
        <p className="text-[13.5px] text-muted leading-[1.6] mt-0 mb-[18px]">
          Use two fictional technical manuals to test questions, source
          references and version comparisons.
        </p>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2.5 border border-line rounded-lg p-[9px_10px] [&>svg]:text-muted-2">
            <div className="h-[30px] w-[30px] rounded-[6px] grid place-items-center bg-[#ee8b8b16] text-[#e99494] font-mono font-semibold text-[10.5px]">
              PDF
            </div>
            <div className="flex flex-col gap-[3px] flex-1 text-left">
              <strong className="text-[13px] font-semibold text-text">NX-300 Manual</strong>
              <span className="text-[11.5px] text-muted">Version 1.0 · March 2024</span>
            </div>
            <Check size={15} />
          </div>
          <div className="flex items-center gap-2.5 border border-line rounded-lg p-[9px_10px] [&>svg]:text-muted-2">
            <div className="h-[30px] w-[30px] rounded-[6px] grid place-items-center bg-[#ee8b8b16] text-[#e99494] font-mono font-semibold text-[10.5px]">
              PDF
            </div>
            <div className="flex flex-col gap-[3px] flex-1 text-left">
              <strong className="text-[13px] font-semibold text-text">NX-300 Manual</strong>
              <span className="text-[11.5px] text-muted">Version 2.0 · September 2024</span>
            </div>
            <Check size={15} />
          </div>
        </div>
        <button
          className="w-full h-[42px] rounded-lg flex items-center justify-center gap-2 px-4 text-[13.5px] font-bold transition-[transform,background,filter,border-color] duration-150 bg-transparent border border-line-strong text-text mt-auto hover:border-muted-2 hover:bg-panel-soft disabled:opacity-65 disabled:cursor-not-allowed [&>svg]:text-accent"
          onClick={onLoadSamples}
          disabled={uploading}
        >
          {uploading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <ArrowUpRight size={16} />
          )}{' '}
          Load sample documents
        </button>
        <div className="text-[11.5px] text-muted-2 flex items-center gap-1.5 mt-3">
          <span className="w-[5px] h-[5px] rounded-full bg-purple" /> Fictional product data for demonstration
        </div>
      </div>

      <div className="border border-line rounded-[10px] bg-panel flex items-start gap-3 p-4 min-h-[88px] max-[760px]:min-h-[80px]">
        <div className="w-[34px] h-[34px] grid place-items-center rounded-[9px] bg-[color-mix(in_srgb,var(--cyan)_10%,var(--panel))] text-cyan flex-[0_0_34px]">
          <Mic size={17} />
        </div>
        <div className="flex-1">
          <strong className="text-[13px] font-semibold">Ask by voice or text</strong>
          <p className="text-xs leading-[1.55] text-muted mt-1.5 mb-0">
            Speak naturally. Listen to the answer when you need hands-free
            guidance.
          </p>
        </div>
        <div className="font-mono text-[11px] text-muted-2">01</div>
      </div>

      <div className="border border-line rounded-[10px] bg-panel flex items-start gap-3 p-4 min-h-[88px] max-[760px]:min-h-[80px]">
        <div className="w-[34px] h-[34px] grid place-items-center rounded-[9px] bg-[color-mix(in_srgb,var(--purple)_10%,var(--panel))] text-purple flex-[0_0_34px]">
          <Search size={17} />
        </div>
        <div className="flex-1">
          <strong className="text-[13px] font-semibold">See where answers came from</strong>
          <p className="text-xs leading-[1.55] text-muted mt-1.5 mb-0">
            Every response includes relevant passages and page references when
            available.
          </p>
        </div>
        <div className="font-mono text-[11px] text-muted-2">02</div>
      </div>
    </div>
  );
}
