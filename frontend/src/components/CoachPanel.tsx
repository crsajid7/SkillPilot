import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Sparkles, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import type { CoachAnalysisData, SessionTurn } from '../types/coach';
import { isSpeechRecognitionSupported, SpeechHandler } from '../utils/speech';

interface CoachPanelProps {
  currentQuestion: string;
  onQuestionChange: (q: string) => void;
  onSubmit: (question: string) => void;
  isAnalyzing: boolean;
  latestTurn: SessionTurn | null;
  historyTurns: SessionTurn[];
  hasActiveVisualSource: boolean;
  apiKeyConfigured: boolean;
  errorMessage: string | null;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  currentQuestion,
  onQuestionChange,
  onSubmit,
  isAnalyzing,
  latestTurn,
  historyTurns,
  hasActiveVisualSource,
  apiKeyConfigured,
  errorMessage,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechSupported = isSpeechRecognitionSupported();
  const speechHandlerRef = useRef<SpeechHandler | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    speechHandlerRef.current = new SpeechHandler(
      (transcript, isFinal) => {
        if (isFinal) {
          onQuestionChange(
            currentQuestion.trim()
              ? `${currentQuestion.trim()} ${transcript}`
              : transcript
          );
        }
      },
      (errorMsg) => {
        setSpeechError(errorMsg);
        setIsListening(false);
      },
      (listeningState) => {
        setIsListening(listeningState);
      }
    );

    return () => {
      if (speechHandlerRef.current) {
        speechHandlerRef.current.stop();
      }
    };
  }, [currentQuestion, onQuestionChange]);

  const toggleMic = () => {
    setSpeechError(null);
    if (!speechSupported) {
      setSpeechError('Speech recognition is not supported in this browser. Please type below.');
      return;
    }
    if (speechHandlerRef.current) {
      speechHandlerRef.current.toggle();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!currentQuestion.trim() || isAnalyzing) return;
    if (isListening && speechHandlerRef.current) {
      speechHandlerRef.current.stop();
    }
    onSubmit(currentQuestion.trim());
  };

  const analysis: CoachAnalysisData | undefined = latestTurn?.response;

  return (
    <section className="w-full lg:w-[380px] xl:w-[440px] flex flex-col h-full bg-surface-1 select-none border-t lg:border-t-0 border-border-subtle">
      {/* Panel Header */}
      <div className="h-11 border-b border-border-subtle px-4 flex items-center justify-between bg-surface-1/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest uppercase text-text-muted">
            COACHING
          </span>
          {historyTurns.length > 0 && (
            <span className="text-[11px] font-mono text-text-muted">
              · {historyTurns.length} {historyTurns.length === 1 ? 'step' : 'steps'}
            </span>
          )}
        </div>

        {/* Coach Readiness State */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
          {isAnalyzing ? (
            <span className="flex items-center gap-1 text-accent-lime">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
              <span>Analyzing</span>
            </span>
          ) : !apiKeyConfigured ? (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Key Required</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
              <span>Ready</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Response Area: Compact Structured Action Card (NOT chat bubbles) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Error Notification if server or API call failed */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-surface-2 border border-border-subtle text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Notice</span>
            </div>
            <p className="text-text-secondary leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Missing API Key Guidance Card */}
        {!apiKeyConfigured && (
          <div className="p-4 rounded-lg bg-surface-2 border border-border-subtle space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <AlertCircle className="w-4 h-4" />
              <span>API Key Required for Live Visual AI</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Add your Google AI Studio key to <code className="text-text-primary px-1 py-0.5 rounded bg-surface-3 font-mono text-[11px]">backend/.env</code>:
            </p>
            <pre className="p-2.5 rounded-md bg-canvas border border-border-subtle font-mono text-[11px] text-accent-lime overflow-x-auto">
              GEMINI_API_KEY=your_key_here
            </pre>
            <p className="text-[11px] text-text-muted">
              Model: <span className="font-mono text-text-secondary">gemma-4-26b-a4b-it</span> (or configure <code className="font-mono text-text-secondary">GEMINI_MODEL</code>).
            </p>
          </div>
        )}

        {/* Structured Action Card */}
        {analysis ? (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* User Question Anchor */}
            {latestTurn && (
              <div className="text-xs text-text-muted font-mono flex items-center gap-1.5 pb-1 border-b border-border-subtle">
                <ArrowRight className="w-3 h-3 text-accent-lime shrink-0" />
                <span className="truncate">"{latestTurn.question}"</span>
              </div>
            )}

            {/* 1. Observation */}
            <div className="p-3.5 rounded-lg bg-surface-2 border border-border-subtle space-y-1">
              <div className="text-[10px] font-mono tracking-wider uppercase text-text-muted">
                Observation
              </div>
              <p className="text-xs font-medium text-text-primary leading-relaxed">
                {analysis.observation}
              </p>
            </div>

            {/* 2. Try This (Up to 5 imperative steps) */}
            <div className="p-3.5 rounded-lg bg-surface-2 border border-border-subtle space-y-2.5">
              <div className="text-[10px] font-mono tracking-wider uppercase text-accent-lime">
                Try This
              </div>
              <ol className="space-y-2">
                {analysis.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-text-primary leading-relaxed">
                    <span className="font-mono text-[11px] text-accent-lime shrink-0 font-semibold mt-0.5">
                      {idx + 1}.
                    </span>
                    <span>{step.replace(/^\d+[\.\)]\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 3. Expected Outcome (if present) */}
            {analysis.expectedOutcome && (
              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle space-y-1">
                <div className="text-[10px] font-mono tracking-wider uppercase text-text-muted">
                  Expected Outcome
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {analysis.expectedOutcome}
                </p>
              </div>
            )}

            {/* 4. Uncertainty (if present) */}
            {analysis.uncertainty && (
              <div className="p-3 rounded-lg bg-surface-2 border border-border-subtle space-y-1">
                <div className="text-[10px] font-mono tracking-wider uppercase text-amber-400 flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  <span>Uncertainty</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {analysis.uncertainty}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Standby State */
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center text-text-muted mb-3">
              <Sparkles className="w-4 h-4 text-accent-lime" />
            </div>
            <p className="text-xs font-medium text-text-secondary mb-1">
              Ask for visual guidance
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed max-w-xs">
              Show your work on screen or camera, then ask a concrete question using speech or text.
            </p>
          </div>
        )}
      </div>

      {/* Input Action Bar */}
      <div className="p-3.5 border-t border-border-subtle bg-surface-1/90 space-y-2">
        {/* Visual source reminder if idle */}
        {!hasActiveVisualSource && (
          <div className="text-[11px] text-text-muted flex items-center gap-1.5 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>No video source active. Turn on camera or share screen for visual context.</span>
          </div>
        )}

        <div className="flex items-end gap-2 bg-surface-2 border border-border-subtle focus-within:border-accent-lime rounded-lg p-2 transition-colors">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={toggleMic}
            disabled={isAnalyzing}
            className={`p-2 rounded-md transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-3'
            }`}
            title={
              !speechSupported
                ? 'Speech recognition not supported in this browser'
                : isListening
                ? 'Listening... Click to stop'
                : 'Click to speak question'
            }
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={2}
            value={currentQuestion}
            onChange={(e) => onQuestionChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnalyzing}
            placeholder={
              isListening
                ? 'Listening to speech... Speak clearly...'
                : hasActiveVisualSource
                ? 'Ask what to do next or how to fix an issue...'
                : 'Type your question...'
            }
            className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none resize-none leading-relaxed py-1"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!currentQuestion.trim() || isAnalyzing}
            className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              !currentQuestion.trim() || isAnalyzing
                ? 'bg-surface-3 text-text-muted cursor-not-allowed border border-transparent'
                : 'bg-accent-lime text-canvas hover:bg-[#d6ff73] active:scale-98 shadow-sm'
            }`}
            title="Submit question and analyze frame (Ctrl+Enter)"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* Speech error indicator if any */}
        {speechError && (
          <p className="text-[11px] text-amber-400 px-1">{speechError}</p>
        )}
      </div>
    </section>
  );
};
