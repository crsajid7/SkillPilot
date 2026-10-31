import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Monitor, CameraOff, RefreshCw, AlertCircle, Eye, Disc } from 'lucide-react';
import type { VisualSourceMode } from '../types/coach';

interface VisualWorkspaceProps {
  sourceMode: VisualSourceMode;
  onSourceChange: (mode: VisualSourceMode) => void;
  isAnalyzing: boolean;
  onSnapshotReady?: (dataUrl: string) => void;
  frozenSnapshot: string | null;
  onClearSnapshot: () => void;
}

export const VisualWorkspace: React.FC<VisualWorkspaceProps> = ({
  sourceMode,
  onSourceChange,
  isAnalyzing,
  onSnapshotReady,
  frozenSnapshot,
  onClearSnapshot,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleanly stop any active stream and release tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setResolution(null);
  }, []);

  // Start hardware camera stream
  const startCamera = useCallback(async () => {
    stopStream();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
            setResolution({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            setStreamActive(true);
            onSourceChange('camera');
          }
        };
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser URL bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device was found on this system.');
      } else {
        setErrorMessage(err.message || 'Unable to access camera.');
      }
      setStreamActive(false);
      onSourceChange('idle');
    }
  }, [stopStream, onSourceChange]);

  // Start screen share stream
  const startScreenShare = useCallback(async () => {
    stopStream();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported by your current browser.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        } as any,
        audio: false,
      });

      streamRef.current = stream;

      // Handle user stopping share via native browser floating UI
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopStream();
          onSourceChange('idle');
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
            setResolution({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            setStreamActive(true);
            onSourceChange('screen');
          }
        };
      }
    } catch (err: any) {
      console.warn('Screen share error:', err);
      if (err.name === 'NotAllowedError') {
        // User cancelled picker
        setErrorMessage(null);
      } else {
        setErrorMessage(err.message || 'Unable to share screen.');
      }
      setStreamActive(false);
      onSourceChange('idle');
    }
  }, [stopStream, onSourceChange]);

  // Capture single frame to canvas as compressed JPEG
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current || !streamActive) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    // Compressed JPEG snapshot: 0.85 quality provides high detail without excess token weight
    const jpegData = canvas.toDataURL('image/jpeg', 0.85);

    if (onSnapshotReady) {
      onSnapshotReady(jpegData);
    }

    return jpegData;
  }, [streamActive, onSnapshotReady]);

  // Listen to capture requests triggered by asking coach
  useEffect(() => {
    const handleCaptureTrigger = (e: any) => {
      const frame = captureFrame();
      if (e.detail?.callback) {
        e.detail.callback(frame);
      }
    };

    window.addEventListener('skillpilot:capture-snapshot', handleCaptureTrigger);
    return () => {
      window.removeEventListener('skillpilot:capture-snapshot', handleCaptureTrigger);
    };
  }, [captureFrame]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleStop = () => {
    stopStream();
    onSourceChange('idle');
    onClearSnapshot();
  };

  return (
    <section className="flex-1 flex flex-col h-full bg-canvas relative overflow-hidden select-none border-r border-border-subtle">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Workspace Bar */}
      <div className="h-11 border-b border-border-subtle px-4 flex items-center justify-between bg-surface-1/60 z-20">
        <div className="flex items-center gap-3">
          {streamActive ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-lime opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-lime" />
              </span>
              <span className="text-xs font-medium text-text-primary capitalize">
                {sourceMode === 'camera' ? 'Camera Live' : 'Screen Share Live'}
              </span>
              {resolution && (
                <span className="text-[11px] font-mono text-text-muted hidden sm:inline">
                  [{resolution.width}×{resolution.height}]
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-text-secondary">Visual Workspace</span>
          )}
        </div>

        {/* Workspace Controls */}
        <div className="flex items-center gap-2">
          {streamActive ? (
            <>
              {/* Snapshot Button */}
              <button
                type="button"
                onClick={() => captureFrame()}
                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle hover:border-border-hover transition-all flex items-center gap-1.5 active:scale-98"
                title="Capture a snapshot frame"
              >
                <Disc className="w-3 h-3 text-accent-lime" />
                <span>Capture Frame</span>
              </button>

              {/* Stop Stream Button */}
              <button
                type="button"
                onClick={handleStop}
                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-surface-2 hover:bg-rose-950/40 text-text-secondary hover:text-rose-400 border border-border-subtle hover:border-rose-900/60 transition-all flex items-center gap-1.5"
                title="Stop video feed"
              >
                <CameraOff className="w-3 h-3" />
                <span>Stop</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={startCamera}
                className="h-7 px-3 rounded-md text-xs font-medium bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle hover:border-border-hover transition-all flex items-center gap-1.5 active:scale-98"
              >
                <Camera className="w-3.5 h-3.5 text-accent-lime" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={startScreenShare}
                className="h-7 px-3 rounded-md text-xs font-medium bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle hover:border-border-hover transition-all flex items-center gap-1.5 active:scale-98"
              >
                <Monitor className="w-3.5 h-3.5 text-accent-lime" />
                <span>Share Screen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Video & Viewfinder Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 bg-canvas overflow-hidden">
        {/* Actual Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-contain max-h-[calc(100vh-140px)] rounded-lg transition-opacity duration-200 ${
            streamActive ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
          }`}
        />

        {/* Minimalist Empty State when Idle */}
        {!streamActive && (
          <div className="max-w-md w-full flex flex-col items-center justify-center text-center p-8 rounded-xl border border-border-subtle bg-surface-1/40 backdrop-blur-sm z-10 animate-in fade-in duration-300">
            {/* Thin-line viewfinder icon */}
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border-subtle flex items-center justify-center text-text-muted mb-5 relative group">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Viewfinder brackets */}
                <path d="M4 8V5C4 4.44772 4.44772 4 5 4H8" stroke="#90949E" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 4H19C19.5523 4 20 4.44772 20 5V8" stroke="#90949E" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M20 16V19C20 19.5523 19.5523 20 19 20H16" stroke="#90949E" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M8 20H5C4.44772 20 4 19.5523 4 19V16" stroke="#90949E" strokeWidth="1.5" strokeLinecap="round" />
                {/* Center crosshair */}
                <circle cx="12" cy="12" r="2" fill="#C8FF55" />
              </svg>
            </div>

            <h2 className="text-base font-semibold text-text-primary tracking-tight mb-1.5">
              Your workspace is ready.
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm mb-6">
              Turn on your camera or share your screen to get contextual guidance.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="h-9 px-4 rounded-md text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle hover:border-accent-lime transition-all flex items-center gap-2 active:scale-98"
              >
                <Camera className="w-4 h-4 text-accent-lime" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={startScreenShare}
                className="h-9 px-4 rounded-md text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-text-primary border border-border-subtle hover:border-accent-lime transition-all flex items-center gap-2 active:scale-98"
              >
                <Monitor className="w-4 h-4 text-accent-lime" />
                <span>Share Screen</span>
              </button>
            </div>

            {/* Error / Permission message if any */}
            {errorMessage && (
              <div className="mt-5 p-2.5 rounded-lg bg-surface-2 border border-border-subtle flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300">{errorMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* Snapshot Armed Badge Overlay */}
        {frozenSnapshot && (
          <div className="absolute top-7 right-7 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-1/90 backdrop-blur-md border border-border-subtle shadow-xl">
            <span className="w-2 h-2 rounded-full bg-accent-lime" />
            <span className="text-xs text-text-primary font-medium">Snapshot Ready</span>
            <button
              onClick={onClearSnapshot}
              className="text-[11px] text-text-muted hover:text-text-primary underline ml-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Discreet Analysis Indicator Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-canvas/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-30 pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-subtle flex items-center justify-center mb-3 shadow-lg">
              <RefreshCw className="w-5 h-5 text-accent-lime animate-spin" />
            </div>
            <div className="px-3 py-1 rounded-md bg-surface-2 border border-border-subtle text-xs text-text-primary font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
              <span>Analyzing captured frame with Gemma 4...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Explanatory Caption */}
      <div className="h-8 border-t border-border-subtle px-4 flex items-center justify-between text-[11px] text-text-muted bg-surface-1/40">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-text-muted" />
          <span>Frame snapshot protocol: Analyzes a single frame upon submission. Continuous video is not transmitted.</span>
        </div>
      </div>
    </section>
  );
};
