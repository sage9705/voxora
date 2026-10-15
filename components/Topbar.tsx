'use client';

import { MdDarkMode, MdHelpOutline, MdLightMode } from 'react-icons/md';

type TopbarProps = {
  dark: boolean;
  onToggleTheme: () => void;
  onShowHelp: () => void;
};

export function Topbar({ dark, onToggleTheme, onShowHelp }: TopbarProps) {
  return (
    <header className="h-16 flex-[0_0_64px] border-b border-line flex items-center justify-between px-[42px] max-[1050px]:px-[26px] max-[760px]:h-[52px] max-[760px]:px-[18px]">
      <div className="flex items-center gap-2.5 text-[13px] text-muted">
        <span>Workspace</span>
        <span className="text-muted-2">/</span>
        <strong className="font-semibold text-text">Document chat</strong>
      </div>
      <div className="flex items-center gap-[15px]">
        <button
          className="flex items-center justify-center gap-[7px] border-0 bg-transparent text-muted h-[34px] px-[7px] text-[12.5px] rounded-md transition-[color,background] duration-150 hover:text-text hover:bg-panel-raised"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {dark ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
        </button>
        <button
          className="flex items-center justify-center gap-[7px] border-0 bg-transparent text-muted h-[34px] px-[7px] text-[12.5px] rounded-md transition-[color,background] duration-150 hover:text-text hover:bg-panel-raised"
          onClick={onShowHelp}
        >
          <MdHelpOutline size={18} />
          <span className="max-[760px]:hidden">Help</span>
        </button>
      </div>
    </header>
  );
}
