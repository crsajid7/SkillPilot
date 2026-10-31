import React, { useState } from 'react';
import { X, ExternalLink, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';

interface ReferencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  userReferenceImage: string | null;
  onSetUserReferenceImage: (img: string | null) => void;
}

export const ReferencePanel: React.FC<ReferencePanelProps> = ({
  isOpen,
  onClose,
  userReferenceImage,
  onSetUserReferenceImage,
}) => {
  const [customUrl, setCustomUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onSetUserReferenceImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    let url = customUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md rounded-xl bg-surface-1 border border-border-subtle shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 border-b border-border-subtle px-4 flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary tracking-tight">Reference Material</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-text-secondary">
          {/* User Reference Blueprint / Image */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block">
              Workpiece Reference Image
            </label>
            {userReferenceImage ? (
              <div className="space-y-2">
                <div className="max-h-48 rounded-lg border border-border-subtle bg-canvas overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={userReferenceImage}
                    alt="User reference"
                    className="max-h-44 object-contain rounded"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onSetUserReferenceImage(null)}
                  className="px-2.5 py-1 rounded bg-surface-2 hover:bg-rose-950/40 text-text-muted hover:text-rose-400 border border-border-subtle text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove reference image</span>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-5 border border-dashed border-border-subtle hover:border-accent-lime rounded-lg cursor-pointer bg-surface-2/40 hover:bg-surface-2 transition-all">
                <ImageIcon className="w-5 h-5 text-text-muted mb-1.5" />
                <span className="text-[11px] text-text-primary font-medium">Attach reference image or schematic</span>
                <span className="text-[10px] text-text-muted">PNG, JPG, or WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* User External Documentation Link */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block">
              External Documentation or Task URL
            </label>
            <form onSubmit={handleOpenUrl} className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://docs.blender.org/..."
                className="flex-1 bg-surface-2 border border-border-subtle focus:border-accent-lime rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none"
              />
              <button
                type="submit"
                disabled={!customUrl.trim()}
                className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle disabled:opacity-50 text-xs flex items-center gap-1"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </form>
          </div>

          {/* Clean status note */}
          <div className="p-3 rounded-lg bg-surface-2/60 border border-border-subtle text-[11px] text-text-muted flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime shrink-0 mt-0.5" />
            <span>
              Real reference mode active. No artificial or fabricated search links are displayed.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="h-11 border-t border-border-subtle px-4 flex items-center justify-end bg-surface-2/40">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md text-xs font-medium bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
