import { CircleHelp } from 'lucide-react';

interface FooterProps {
  onShowHowItWorks: () => void;
}

export function Footer({ onShowHowItWorks }: FooterProps) {
  return (
    <footer className="page-footer">
      <span>
        VOXORA <span className="footer-dot">●</span> DOCUMENT INTELLIGENCE
      </span>
      <span>Read less. Understand more.</span>
      <button onClick={onShowHowItWorks}>
        <CircleHelp size={13} /> How it works
      </button>
    </footer>
  );
}
