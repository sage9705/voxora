'use client';

import { CircleHelp, Moon, Sun } from 'lucide-react';

type TopbarProps = {
  dark: boolean;
  onToggleTheme: () => void;
  onShowHelp: () => void;
};

export function Topbar({ dark, onToggleTheme, onShowHelp }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <span className="crumb-slash">/</span>
        <strong>Document chat</strong>
      </div>
      <div className="topbar-actions">
        <div className="connection-status">
          <span /> Workspace ready
        </div>
        <button
          className="theme-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="help-button" onClick={onShowHelp}>
          <CircleHelp size={17} />
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}
