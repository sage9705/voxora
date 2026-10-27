'use client';

import { useState } from 'react';
import Add from '@mui/icons-material/Add';
import Autorenew from '@mui/icons-material/Autorenew';
import Check from '@mui/icons-material/Check';
import Code from '@mui/icons-material/Code';
import Description from '@mui/icons-material/Description';
import Layers from '@mui/icons-material/Layers';
import Memory from '@mui/icons-material/Memory';
import Mic from '@mui/icons-material/Mic';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Search from '@mui/icons-material/Search';
import TableChart from '@mui/icons-material/TableChart';
import UploadFile from '@mui/icons-material/UploadFile';

type WelcomeGridProps = {
  uploading: boolean;
  onUploadFiles: (files: FileList | File[]) => void;
  onOpenFileInput: () => void;
};

export function WelcomeGrid({
  uploading,
  onUploadFiles,
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
            <UploadFile style={{ fontSize: 26 }} />
          </div>
          <h2 className="font-heading font-semibold text-lg tracking-[-0.4px] mt-0 mb-2">
            Bring your documents
          </h2>
          <p className="text-[13.5px] text-muted leading-[1.6] mt-0 mb-[18px]">
            Drop your PDFs, Word, Markdown, Text, or Sheets here.
          </p>
          <button
            className="h-[42px] rounded-lg flex items-center justify-center gap-2 px-4 text-[13.5px] font-bold transition-[transform,background,filter] duration-150 bg-accent text-accent-ink border border-accent hover:brightness-[1.06] hover:-translate-y-px disabled:opacity-65 disabled:cursor-not-allowed"
            onClick={onOpenFileInput}
            disabled={uploading}
          >
            {uploading ? (
              <Autorenew style={{ fontSize: 18 }} className="animate-spin" />
            ) : (
              <Add style={{ fontSize: 18 }} />
            )}
            {uploading ? 'Reading documents…' : 'Choose files'}
          </button>
          <span className="text-[11.5px] text-muted-2 mt-3.5 [&>span]:px-1">
            PDF, Word, TXT, MD, CSV &amp; Excel <span>·</span> Multi-file support{' '}
            <span>·</span> Persistent workspace
          </span>
        </div>
        <div className="border-t border-line h-12 flex items-center justify-center gap-5 text-muted text-xs">
          <div className="flex items-center gap-[7px] [&>svg]:text-cyan">
            <Memory style={{ fontSize: 17 }} />
            <span>Persistent local storage</span>
          </div>
          <span className="h-4 w-px bg-line" />
          <div className="flex items-center gap-[7px] [&>svg]:text-cyan">
            <Description style={{ fontSize: 17 }} />
            <span>Multi-format intelligence</span>
          </div>
        </div>
      </div>

      <div className="border border-line bg-panel rounded-xl overflow-hidden min-h-[300px] max-[760px]:min-h-[290px] p-[22px_21px_16px] max-[1050px]:p-[18px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-[15px]">
            <div className="w-9 h-9 border border-[color-mix(in_srgb,var(--purple)_30%,var(--line))] rounded-[10px] bg-[color-mix(in_srgb,var(--purple)_10%,var(--panel))] text-purple grid place-items-center">
              <Layers style={{ fontSize: 19 }} />
            </div>
            <span className="font-mono font-semibold text-[11px] tracking-[0.8px] text-purple py-[5px] px-2 border border-[color-mix(in_srgb,var(--purple)_30%,var(--line))] rounded-[5px]">
              CAPABILITIES
            </span>
          </div>
          <h2 className="font-heading font-semibold text-lg tracking-[-0.4px] mt-0 mb-1.5">
            Multi-format intelligence
          </h2>
          <p className="text-[13px] text-muted leading-[1.5] mt-0 mb-3.5">
            Voxora parses and connects insights across your personal or team files.
          </p>

          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-2.5 border border-line rounded-lg p-[8px_10px] bg-panel-soft/40">
              <div className="h-7 w-7 rounded-[6px] grid place-items-center bg-[#ee8b8b18] text-[#e99494] flex-shrink-0">
                <PictureAsPdf style={{ fontSize: 16 }} />
              </div>
              <div className="flex flex-col flex-1 text-left min-w-0">
                <strong className="text-[12.5px] font-medium text-text">PDFs &amp; Documents</strong>
                <span className="text-[11px] text-muted truncate">Exact page &amp; section citations</span>
              </div>
              <Check style={{ fontSize: 16 }} className="text-muted-2" />
            </div>

            <div className="flex items-center gap-2.5 border border-line rounded-lg p-[8px_10px] bg-panel-soft/40">
              <div className="h-7 w-7 rounded-[6px] grid place-items-center bg-[#3b82f618] text-[#60a5fa] flex-shrink-0">
                <Description style={{ fontSize: 16 }} />
              </div>
              <div className="flex flex-col flex-1 text-left min-w-0">
                <strong className="text-[12.5px] font-medium text-text">Word &amp; Office Docs</strong>
                <span className="text-[11px] text-muted truncate">Formatted headings &amp; structured text</span>
              </div>
              <Check style={{ fontSize: 16 }} className="text-muted-2" />
            </div>

            <div className="flex items-center gap-2.5 border border-line rounded-lg p-[8px_10px] bg-panel-soft/40">
              <div className="h-7 w-7 rounded-[6px] grid place-items-center bg-[#10b98118] text-[#34d399] flex-shrink-0">
                <TableChart style={{ fontSize: 16 }} />
              </div>
              <div className="flex flex-col flex-1 text-left min-w-0">
                <strong className="text-[12.5px] font-medium text-text">Spreadsheets &amp; Data</strong>
                <span className="text-[11px] text-muted truncate">Excel &amp; CSV rows, tables and trends</span>
              </div>
              <Check style={{ fontSize: 16 }} className="text-muted-2" />
            </div>

            <div className="flex items-center gap-2.5 border border-line rounded-lg p-[8px_10px] bg-panel-soft/40">
              <div className="h-7 w-7 rounded-[6px] grid place-items-center bg-[#a855f718] text-[#c084fc] flex-shrink-0">
                <Code style={{ fontSize: 16 }} />
              </div>
              <div className="flex flex-col flex-1 text-left min-w-0">
                <strong className="text-[12.5px] font-medium text-text">Markdown &amp; Text Notes</strong>
                <span className="text-[11px] text-muted truncate">Developer documentation &amp; plain notes</span>
              </div>
              <Check style={{ fontSize: 16 }} className="text-muted-2" />
            </div>
          </div>
        </div>

        <div className="text-[11.5px] text-muted-2 pt-2 border-t border-line">
          <span>Local workspace privacy &amp; persistent storage</span>
        </div>
      </div>

      <div className="border border-line rounded-[10px] bg-panel flex items-start gap-3 p-4 min-h-[88px] max-[760px]:min-h-[80px]">
        <div className="w-[34px] h-[34px] grid place-items-center rounded-[9px] bg-[color-mix(in_srgb,var(--cyan)_10%,var(--panel))] text-cyan flex-[0_0_34px]">
          <Mic style={{ fontSize: 19 }} />
        </div>
        <div className="flex-1">
          <strong className="text-[13px] font-semibold">
            Ask by voice or text
          </strong>
          <p className="text-xs leading-[1.55] text-muted mt-1.5 mb-0">
            Speak naturally. Listen to the answer when you need hands-free
            guidance.
          </p>
        </div>
        <div className="font-mono text-[11px] text-muted-2">01</div>
      </div>

      <div className="border border-line rounded-[10px] bg-panel flex items-start gap-3 p-4 min-h-[88px] max-[760px]:min-h-[80px]">
        <div className="w-[34px] h-[34px] grid place-items-center rounded-[9px] bg-[color-mix(in_srgb,var(--purple)_10%,var(--panel))] text-purple flex-[0_0_34px]">
          <Search style={{ fontSize: 19 }} />
        </div>
        <div className="flex-1">
          <strong className="text-[13px] font-semibold">
            See where answers came from
          </strong>
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
