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
    <div className="welcome-grid">
      <div
        className="upload-card"
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
        <div className={`upload-zone ${dragging ? 'dragging' : ''}`}>
          <div className="upload-symbol">
            <FileUp size={25} />
          </div>
          <h2>Bring your documents</h2>
          <p>Drop your PDFs here, or browse your computer.</p>
          <button
            className="primary-button"
            onClick={onOpenFileInput}
            disabled={uploading}
          >
            {uploading ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Plus size={16} />
            )}
            {uploading ? 'Reading document…' : 'Choose PDF files'}
          </button>
          <span className="file-limit">
            PDF only <span>·</span> Up to 2 files &amp; 10 pages total <span>·</span> 8 MB limit
          </span>
        </div>
        <div className="upload-footer">
          <div className="footer-check">
            <Cpu size={16} />
            <span>Session-based processing</span>
          </div>
          <span className="footer-separator" />
          <div className="footer-check">
            <FileText size={16} />
            <span>Text-based PDFs</span>
          </div>
        </div>
      </div>

      <div className="sample-card">
        <div className="sample-top">
          <div className="sample-icon">
            <BookOpen size={18} />
          </div>
          <span className="sample-tag">SAMPLE MANUALS</span>
        </div>
        <h2>Prefer to explore first?</h2>
        <p>
          Use two fictional technical manuals to test questions, source
          references and version comparisons.
        </p>
        <div className="sample-files">
          <div className="sample-file">
            <div className="mini-pdf">PDF</div>
            <div>
              <strong>NX-300 Manual</strong>
              <span>Version 1.0 · March 2024</span>
            </div>
            <Check size={15} />
          </div>
          <div className="sample-file">
            <div className="mini-pdf">PDF</div>
            <div>
              <strong>NX-300 Manual</strong>
              <span>Version 2.0 · September 2024</span>
            </div>
            <Check size={15} />
          </div>
        </div>
        <button
          className="secondary-button"
          onClick={onLoadSamples}
          disabled={uploading}
        >
          {uploading ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <ArrowUpRight size={16} />
          )}{' '}
          Load sample documents
        </button>
        <div className="sample-note">
          <span className="note-dot" /> Fictional product data for demonstration
        </div>
      </div>

      <div className="how-card">
        <div className="how-icon">
          <Mic size={17} />
        </div>
        <div>
          <strong>Ask by voice or text</strong>
          <p>
            Speak naturally. Listen to the answer when you need hands-free
            guidance.
          </p>
        </div>
        <div className="how-step">01</div>
      </div>

      <div className="how-card">
        <div className="how-icon violet">
          <Search size={17} />
        </div>
        <div>
          <strong>See where answers came from</strong>
          <p>
            Every response includes relevant passages and page references when
            available.
          </p>
        </div>
        <div className="how-step">02</div>
      </div>
    </div>
  );
}
