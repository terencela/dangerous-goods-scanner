import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';

type CamState = 'loading' | 'active' | 'captured' | 'error';

export default function CameraScreen() {
  const { goTo, setPhoto } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>('loading');
  const [preview, setPreview] = useState<string | null>(null);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCam = useCallback(async () => {
    setState('loading');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setState('active');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    startCam();
    return stopCam;
  }, [startCam, stopCam]);

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const url = c.toDataURL('image/jpeg', 0.85);
    setPreview(url);
    setPhoto(url);
    stopCam();
    setState('captured');
  };

  const retake = () => {
    setPreview(null);
    startCam();
  };

  const proceed = () => goTo('identify');

  const skip = () => {
    stopCam();
    goTo('identify');
  };

  return (
    <div className="min-h-full flex flex-col bg-black relative">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 pt-14 pb-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <button
          onClick={() => { stopCam(); goTo('home'); }}
          className="text-white/90 text-sm font-medium backdrop-blur-md bg-white/10 px-4 py-2 rounded-full"
        >
          ← Back
        </button>
        <button
          onClick={skip}
          className="text-white/90 text-sm font-medium backdrop-blur-md bg-white/10 px-4 py-2 rounded-full"
        >
          Skip Photo
        </button>
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {state === 'loading' && (
          <div className="text-center anim-fade-in">
            <div className="w-12 h-12 border-[3px] border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/60">Starting camera…</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center px-10 anim-fade-in">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl">📷</span>
            </div>
            <p className="text-lg font-bold text-white mb-2">Camera Unavailable</p>
            <p className="text-sm text-white/50 mb-8 leading-relaxed">
              Allow camera access, or continue without a photo and select your item manually.
            </p>
            <button
              onClick={skip}
              className="bg-white text-slate-800 font-semibold px-8 py-3.5 rounded-2xl shadow-xl"
            >
              Continue Without Photo
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${state === 'active' ? '' : 'hidden'}`}
        />

        {state === 'captured' && preview && (
          <img src={preview} alt="Captured" className="w-full h-full object-cover anim-fade-in" />
        )}

        {/* Targeting overlay */}
        {state === 'active' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 rounded-3xl border-2 border-white/30 relative">
              {['-top-px -left-px rounded-tl-3xl border-t-[3px] border-l-[3px]',
                '-top-px -right-px rounded-tr-3xl border-t-[3px] border-r-[3px]',
                '-bottom-px -left-px rounded-bl-3xl border-b-[3px] border-l-[3px]',
                '-bottom-px -right-px rounded-br-3xl border-b-[3px] border-r-[3px]',
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} border-white w-10 h-10`} />
              ))}
            </div>
            <p className="absolute bottom-28 text-white/60 text-sm font-medium">
              Place your item in the frame
            </p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-20 pb-12 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {state === 'active' && (
          <div className="flex justify-center">
            <button
              onClick={capture}
              className="w-[76px] h-[76px] rounded-full border-[4px] border-white/40 p-1 active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white" />
            </button>
          </div>
        )}

        {state === 'captured' && (
          <div className="flex gap-3 px-6 anim-fade-in-up">
            <button
              onClick={retake}
              className="flex-1 backdrop-blur-md bg-white/15 text-white font-semibold py-4 rounded-2xl"
            >
              Retake
            </button>
            <button
              onClick={proceed}
              className="flex-1 bg-white text-slate-800 font-bold py-4 rounded-2xl shadow-xl"
            >
              Analyze Item →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
