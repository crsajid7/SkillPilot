import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { VisualWorkspace } from './components/VisualWorkspace';
import { CoachPanel } from './components/CoachPanel';
import { ReferencePanel } from './components/ReferencePanel';
import { checkServerHealth, submitCoachRequest } from './services/api';
import type { HealthStatus } from './services/api';
import type { VisualSourceMode, SessionTurn } from './types/coach';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sourceMode, setSourceMode] = useState<VisualSourceMode>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionTurns, setSessionTurns] = useState<SessionTurn[]>([]);
  const [frozenSnapshot, setFrozenSnapshot] = useState<string | null>(null);
  const [isReferenceOpen, setIsReferenceOpen] = useState<boolean>(false);
  const [userReferenceImage, setUserReferenceImage] = useState<string | null>(null);

  // Poll server health
  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      try {
        const h = await checkServerHealth();
        if (isMounted) setHealth(h);
      } catch (err: any) {
        console.warn('Backend check error:', err?.message || err);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // New Session resets all context cleanly
  const handleNewSession = () => {
    setSessionTurns([]);
    setCurrentQuestion('');
    setFrozenSnapshot(null);
    setErrorMessage(null);
  };

  // Submit question and capture current visual frame
  const handleSubmit = useCallback(async (question: string) => {
    if (!question.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    // Capture visual snapshot if a video source is live
    let frameDataUri: string | null = frozenSnapshot;

    if (!frameDataUri && sourceMode !== 'idle') {
      await new Promise<void>((resolve) => {
        const evt = new CustomEvent('skillpilot:capture-snapshot', {
          detail: {
            callback: (captured: string | null) => {
              frameDataUri = captured;
              resolve();
            },
          },
        });
        window.dispatchEvent(evt);
        // Timeout safeguard
        setTimeout(resolve, 250);
      });
    }

    // Include user reference image if no frame was captured
    const finalImage = frameDataUri || userReferenceImage || undefined;
    if (finalImage) {
      setFrozenSnapshot(finalImage);
    }

    // Format minimal conversational history (up to last 3 steps)
    const historyPayload = sessionTurns.slice(-3).flatMap((turn) => [
      { role: 'user' as const, text: turn.question },
      { role: 'model' as const, text: `${turn.response.observation} Steps: ${turn.response.steps.join('; ')}` },
    ]);

    try {
      const response = await submitCoachRequest({
        image: finalImage,
        question: question.trim(),
        history: historyPayload,
      });

      if (!response.success || !response.data) {
        setErrorMessage(
          response.error ||
          'The AI coach could not process this request. Please check that GEMINI_API_KEY is configured in backend/.env.'
        );
      } else {
        const newTurn: SessionTurn = {
          id: `step-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          question: question.trim(),
          snapshotImage: finalImage,
          response: response.data,
          modelUsed: response.modelUsed,
        };

        setSessionTurns((prev) => [...prev, newTurn]);
        setCurrentQuestion('');
      }
    } catch (err: any) {
      console.error('Coaching request failed:', err);
      setErrorMessage(err.message || 'Connection to coaching server failed.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [frozenSnapshot, isAnalyzing, sessionTurns, sourceMode, userReferenceImage]);

  const latestTurn = sessionTurns.length > 0 ? sessionTurns[sessionTurns.length - 1] : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-textured text-text-primary overflow-hidden font-sans select-none">
      {/* Minimal Top Bar */}
      <TopBar
        health={health}
        turnCount={sessionTurns.length}
        onNewSession={handleNewSession}
        onToggleReference={() => setIsReferenceOpen((prev) => !prev)}
        isReferenceOpen={isReferenceOpen}
        activeSource={sourceMode}
      />

      {/* Main Single-Screen Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Visual Workspace (~65-70% width on desktop) */}
        <VisualWorkspace
          sourceMode={sourceMode}
          onSourceChange={setSourceMode}
          isAnalyzing={isAnalyzing}
          onSnapshotReady={(dataUrl) => setFrozenSnapshot(dataUrl)}
          frozenSnapshot={frozenSnapshot}
          onClearSnapshot={() => setFrozenSnapshot(null)}
        />

        {/* AI Coaching Panel (~30-35% width on desktop) */}
        <CoachPanel
          currentQuestion={currentQuestion}
          onQuestionChange={setCurrentQuestion}
          onSubmit={handleSubmit}
          isAnalyzing={isAnalyzing}
          latestTurn={latestTurn}
          historyTurns={sessionTurns}
          hasActiveVisualSource={sourceMode !== 'idle' || Boolean(frozenSnapshot || userReferenceImage)}
          apiKeyConfigured={Boolean(health?.apiKeyConfigured)}
          errorMessage={errorMessage}
        />
      </main>

      {/* Reference Modal / Side Drawer */}
      <ReferencePanel
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
        userReferenceImage={userReferenceImage}
        onSetUserReferenceImage={setUserReferenceImage}
      />
    </div>
  );
};

export default App;
