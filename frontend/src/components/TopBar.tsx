import React from 'react';
import { RotateCcw, BookOpen } from 'lucide-react';
import type { HealthStatus } from '../services/api';

interface TopBarProps {
  health: HealthStatus | null;
  turnCount: number;
  onNewSession: () => void;
  onToggleReference: () => void;
  isReferenceOpen: boolean;
  activeSource: 'idle' | 'camera' | 'screen';
}

export const TopBar: React.FC<TopBarProps> = ({
  health,
  turnCount,
  onNewSession,
  onToggleReference,
  isReferenceOpen,
  activeSource,
}) => {
  return (
    <header className="h-14 border-b border-border-subtle bg-surface-1/90 backdrop-blur-md px-5 flex items-center justify-between z-30 select-none">
      {/* Left: Geometric Icon + Wordmark + Label */}
      <div className="flex items-center gap-3">
        {/* Geometric SkillPilot aperture icon */}
        <div className="w-7 h-7 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center relative shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="#90949E" strokeWidth="1.5" />
            <path d="M12 3V21M3 12H21" stroke="#90949E" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="12" cy="12" r="3" fill="#C8FF55" />
          </svg>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-text-primary">
            skillpilot<span className="text-accent-lime font-mono text-xs ml-0.5">AI</span>
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted">
            VISUAL COACH
          </span>
        </div>
      </div>

      {/* Center/Near Right: Connection & Model Status (Unobtrusive) */}
      <div className="hidden sm:flex items-center gap-2 text-xs">
        {health ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-2 border border-border-subtle text-text-secondary">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health.apiKeyConfigured
                  ? 'bg-accent-lime shadow-[0_0_6px_rgba(200,255,85,0.6)]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px] text-text-muted">model:</span>
            <span className="font-mono text-[11px] text-text-primary">{health.model}</span>
            <span className="text-text-muted">·</span>
            <span className="text-[11px]">
              {health.apiKeyConfigured ? (
                <span className="text-accent-lime">Live</span>
              ) : (
                <span className="text-amber-400">Key Required</span>
              )}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-2 border border-border-subtle text-text-muted text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse" />
            <span>Connecting...</span>
          </div>
        )}
      </div>

      {/* Right: Session Status, Reference Button, New Session Control */}
      <div className="flex items-center gap-2.5">
        {/* Source & Session status tag */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-2 border border-border-subtle text-[11px] text-text-secondary">
          {activeSource !== 'idle' ? (
            <span className="flex items-center gap-1.5 text-accent-lime">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
              <span className="capitalize">{activeSource} Active</span>
            </span>
          ) : (
            <span className="text-text-muted">Workspace Ready</span>
          )}
          {turnCount > 0 && (
            <>
              <span className="text-text-muted">·</span>
              <span className="font-mono text-text-muted">Step {turnCount}</span>
            </>
          )}
        </div>

        {/* Reference Button */}
        <button
          onClick={onToggleReference}
          className={`h-8 px-2.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-all ${
            isReferenceOpen
              ? 'bg-surface-3 text-text-primary border-accent-lime'
              : 'bg-surface-2 text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-hover'
          }`}
          title="Open reference materials and checklists"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reference</span>
        </button>

        {/* New Session Control */}
        <button
          onClick={onNewSession}
          className="h-8 px-3 rounded-md text-xs font-medium bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle hover:border-border-hover transition-all flex items-center gap-1.5 active:scale-98"
          title="Clear current question, result, and conversation context"
        >
          <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
          <span>New Session</span>
        </button>
      </div>
    </header>
  );
};
