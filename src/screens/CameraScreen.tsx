import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';

type CameraState = 'loading' | 'active' | 'captured' | 'error';

export default function CameraScreen() {
  const { goTo, setPhoto } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('loading');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setState('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('active');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.8);
    setPreviewUrl(url);
    setPhoto(url);
    stopCamera();
    setState('captured');
  };

  const retake = () => {
    setPreviewUrl(null);
    startCamera();
  };

  const proceed = () => {
    goTo('identify');
  };

  const skip = () => {
    stopCamera();
    goTo('identify');
  };

  return (
    <div className="min-h-full flex flex-col bg-black relative">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => { stopCamera(); goTo('home'); }}
          className="text-white text-sm font-medium px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm"
        >
          ← Back
        </button>
        <button
          onClick={skip}
          className="text-white text-sm font-medium px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm"
        >
          Skip Photo
        </button>
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 flex items-center justify-center relative">
        {state === 'loading' && (
          <div className="text-white text-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-white/70">Starting camera...</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-white text-center px-8">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-lg font-semibold mb-2">Camera not available</p>
            <p className="text-sm text-white/60 mb-6">
              Please allow camera access or use the skip option to select your item manually.
            </p>
            <button
              onClick={skip}
              className="bg-white text-slate-800 font-semibold px-6 py-3 rounded-xl"
            >
              Continue without photo
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${state === 'active' ? 'block' : 'hidden'}`}
        />

        {state === 'captured' && previewUrl && (
          <img src={previewUrl} alt="Captured item" className="w-full h-full object-cover" />
        )}

        {/* Targeting overlay */}
        {state === 'active' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
              <div className="absolute -top-px -left-px w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-3xl" />
              <div className="absolute -top-px -right-px w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-3xl" />
              <div className="absolute -bottom-px -left-px w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-3xl" />
              <div className="absolute -bottom-px -right-px w-8 h-8 border-b-3 border-r-3 border-white rounded-br-3xl" />
            </div>
            <p className="absolute bottom-32 text-white/70 text-sm">Place item in frame</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-10 pt-6 bg-gradient-to-t from-black/80 to-transparent">
        {state === 'active' && (
          <div className="flex justify-center">
            <button
              onClick={capture}
              className="w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-xl active:scale-95 transition-transform"
            >
              <div className="w-full h-full rounded-full border-2 border-slate-200" />
            </button>
          </div>
        )}

        {state === 'captured' && (
          <div className="flex justify-center gap-4 px-6">
            <button
              onClick={retake}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white font-semibold py-3.5 rounded-xl"
            >
              Retake
            </button>
            <button
              onClick={proceed}
              className="flex-1 bg-white text-slate-800 font-semibold py-3.5 rounded-xl"
            >
              Use Photo →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
