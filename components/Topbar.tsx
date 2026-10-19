'use client';

import Chat from '@mui/icons-material/Chat';
import DarkMode from '@mui/icons-material/DarkMode';
import HelpOutline from '@mui/icons-material/HelpOutlineOutlined';
import LightMode from '@mui/icons-material/LightMode';
import MenuBook from '@mui/icons-material/MenuBook';
import VerticalSplit from '@mui/icons-material/VerticalSplit';
import ViewSidebar from '@mui/icons-material/ViewSidebar';

type TopbarProps = {
  dark: boolean;
  onToggleTheme: () => void;
  onShowHelp: () => void;
  workspaceMode?: 'chat' | 'split' | 'reader';
  onChangeWorkspaceMode?: (mode: 'chat' | 'split' | 'reader') => void;
  documentsCount?: number;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
};

export function Topbar({
  dark,
  onToggleTheme,
  onShowHelp,
  workspaceMode = 'chat',
  onChangeWorkspaceMode,
  documentsCount = 0,
  sidebarCollapsed = false,
  onToggleSidebar,
}: TopbarProps) {
  return (
    <header className="h-16 flex-[0_0_64px] border-b border-line flex items-center justify-between px-6 max-[1050px]:px-4 max-[760px]:h-[52px] max-[760px]:px-3.5 transition-all">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-md border border-line text-muted hover:text-text hover:bg-panel-soft transition-colors cursor-pointer ${
              sidebarCollapsed ? 'bg-panel-raised text-accent' : 'bg-transparent'
            }`}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            <ViewSidebar style={{ fontSize: 18 }} />
          </button>
        )}
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <span className="hidden sm:inline">Workspace</span>
          <span className="text-muted-2 hidden sm:inline">/</span>
          <strong className="font-semibold text-text">
            {workspaceMode === 'reader'
              ? 'Document reader'
              : workspaceMode === 'split'
                ? 'Split workspace'
                : 'Document chat'}
          </strong>
        </div>
      </div>

      {/* Middle View Switcher (when documents exist) */}
      {documentsCount > 0 && onChangeWorkspaceMode && (
        <div className="flex items-center bg-panel-soft border border-line rounded-lg p-0.5 text-xs max-[640px]:hidden">
          <button
            onClick={() => onChangeWorkspaceMode('chat')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              workspaceMode === 'chat'
                ? 'bg-panel-raised border border-line-strong text-text font-semibold shadow-xs'
                : 'text-muted hover:text-text border border-transparent'
            }`}
            title="Chat only view"
          >
            <Chat style={{ fontSize: 14 }} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => onChangeWorkspaceMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              workspaceMode === 'split'
                ? 'bg-panel-raised border border-line-strong text-accent font-semibold shadow-xs'
                : 'text-muted hover:text-text border border-transparent'
            }`}
            title="Side-by-side chat and document reader"
          >
            <VerticalSplit style={{ fontSize: 14 }} />
            <span>Split View</span>
          </button>
          <button
            onClick={() => onChangeWorkspaceMode('reader')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              workspaceMode === 'reader'
                ? 'bg-panel-raised border border-line-strong text-accent font-semibold shadow-xs'
                : 'text-muted hover:text-text border border-transparent'
            }`}
            title="Full document reader view"
          >
            <MenuBook style={{ fontSize: 14 }} />
            <span>Reader</span>
          </button>
        </div>
      )}

      {/* Right Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="flex items-center justify-center gap-[7px] border-0 bg-transparent text-muted h-[34px] px-[7px] text-[12.5px] rounded-md transition-[color,background] duration-150 hover:text-text hover:bg-panel-raised cursor-pointer"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {dark ? <LightMode style={{ fontSize: 18 }} /> : <DarkMode style={{ fontSize: 18 }} />}
        </button>
        <button
          className="flex items-center justify-center gap-[7px] border-0 bg-transparent text-muted h-[34px] px-[7px] text-[12.5px] rounded-md transition-[color,background] duration-150 hover:text-text hover:bg-panel-raised cursor-pointer"
          onClick={onShowHelp}
        >
          <HelpOutline style={{ fontSize: 18 }} />
          <span className="max-[760px]:hidden">Help</span>
        </button>
      </div>
    </header>
  );
}
