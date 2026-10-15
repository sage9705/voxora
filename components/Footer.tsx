import { MdHelpOutline } from 'react-icons/md';

interface FooterProps {
  onShowHowItWorks: () => void;
}

export function Footer({ onShowHowItWorks }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-line min-h-[52px] flex items-center gap-[18px] text-muted-2 font-mono text-[11.5px] tracking-[0.5px] max-[760px]:text-[10.5px] max-[760px]:gap-2">
      <span>
        VOXORA <span className="text-accent text-[8px] px-1">●</span> DOCUMENT INTELLIGENCE
      </span>
      <span className="ml-auto font-sans text-xs tracking-normal text-muted max-[760px]:hidden">
        Read less. Understand more.
      </span>
      <button
        className="flex items-center gap-1.5 text-muted bg-transparent border-0 font-sans text-xs hover:text-text max-[760px]:ml-auto max-[760px]:text-[11.5px]"
        onClick={onShowHowItWorks}
      >
        <MdHelpOutline size={14} /> How it works
      </button>
    </footer>
  );
}
