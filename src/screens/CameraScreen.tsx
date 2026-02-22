import { useRef, useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';

type CamState = 'loading' | 'active' | 'captured' | 'error';

export default function CameraScreen() {
  const { goTo, setPhoto } = useApp();
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>('loading');
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [supportsZoom, setSupportsZoom] = useState(false);
  const startedRef = useRef(false);

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCam = useCallback(async () => {
    // Prevent duplicate starts
    if (streamRef.current) return;
    setState('loading');
    startedRef.current = true;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1440 } },
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }

      // Check if track ended unexpectedly (e.g. camera taken by another app)
      const track = s.getVideoTracks()[0];
      if (track) {
        track.addEventListener('ended', () => {
          // Track was killed externally — try to restart
          streamRef.current = null;
          if (startedRef.current) setState('loading');
          setTimeout(() => {
            if (startedRef.current && state !== 'captured') startCam();
          }, 1500);
        });

        try {
          const caps = track.getCapabilities?.() as any;
          if (caps?.zoom) setSupportsZoom(true);
        } catch {}
      }

      setState('active');
    } catch {
      setState('error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start camera on mount
  useEffect(() => {
    startCam();
    return () => {
      startedRef.current = false;
      stopCam();
    };
  }, [startCam, stopCam]);

  // Lifecycle hardening: resume camera when page becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && state === 'loading' && !streamRef.current && startedRef.current) {
        startCam();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [state, startCam]);

  const handleZoom = useCallback((value: number) => {
    setZoom(value);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track && supportsZoom) {
      try {
        track.applyConstraints({ advanced: [{ zoom: value } as any] });
      } catch {}
    }
  }, [supportsZoom]);

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
    setZoom(1);
    streamRef.current = null; // allow startCam to restart
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
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-14 pb-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <button
          onClick={() => { stopCam(); goTo('home'); }}
          className="w-9 h-9 rounded-full bg-black/35 flex items-center justify-center"
        >
          <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-white">{t('takePhoto')}</span>

        {/* Camera active indicator */}
        {state === 'active' && (
          <div className="flex items-center gap-1.5 bg-black/35 px-2 py-1 rounded-md">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-white/70 font-medium">LIVE</span>
          </div>
        )}
        {state !== 'active' && <div className="w-9" />}
      </div>

      {/* Viewfinder / Preview */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {state === 'loading' && (
          <div className="text-center anim-fade-in">
            <div className="w-12 h-12 border-[3px] border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-white/60">{t('startingCamera')}</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center px-10 anim-fade-in">
            <svg className="w-6 h-6 text-white/40 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-lg font-semibold text-white mb-2">{t('cameraUnavailable')}</p>
            <p className="text-sm text-white/50 mb-8 leading-relaxed">{t('cameraUnavailableDesc')}</p>
            <button
              onClick={skip}
              className="bg-white text-[#0a0a0a] font-semibold px-8 py-3.5 rounded-xl"
            >
              {t('continueWithout')}
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${state === 'active' ? '' : 'hidden'}`}
          style={!supportsZoom && zoom > 1 ? { transform: `scale(${zoom})` } : undefined}
        />

        {state === 'captured' && preview && (
          <img src={preview} alt="Captured" className="w-full h-full object-cover anim-fade-in" />
        )}

        {/* Frame overlay */}
        {state === 'active' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-60 h-60 relative">
              {[
                'top-0 left-0 border-t-2 border-l-2 rounded-tl-[10px]',
                'top-0 right-0 border-t-2 border-r-2 rounded-tr-[10px]',
                'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-[10px]',
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-[10px]',
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} border-white/70 w-8 h-8`} />
              ))}
            </div>
            <p className="absolute bottom-36 text-xs text-white/40">{t('placeInFrame')}</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-20 pb-10 pt-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {state === 'active' && (
          <div className="flex flex-col items-center gap-3">
            {/* Camera tips */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-1 px-6">
              {[
                { icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', text: t('cameraTip1') },
                { icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z', text: t('cameraTip2') },
                { icon: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4', text: t('cameraTip3') },
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-1 bg-black/45 px-2 py-1.5 rounded-md">
                  <svg className="w-[11px] h-[11px] text-white/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tip.icon} />
                  </svg>
                  <span className="text-[10px] font-medium text-white/70">{tip.text}</span>
                </div>
              ))}
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-2 px-10 w-full max-w-xs">
              <span className="text-[10px] text-white/50">{t('zoom')}</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => handleZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-white appearance-none bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <span className="text-[10px] text-white/50 min-w-[28px] text-right">{zoom.toFixed(1)}x</span>
            </div>

            {/* Shutter */}
            <button
              onClick={capture}
              className="w-[66px] h-[66px] rounded-full border-[3px] border-white p-1 active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white" />
            </button>

            {/* Skip */}
            <button onClick={skip} className="flex items-center gap-1 mt-1">
              <span className="text-xs text-white/50">{t('skip')}</span>
              <svg className="w-[13px] h-[13px] text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {state === 'captured' && (
          <div className="flex gap-2.5 px-6 anim-fade-in-up">
            <button
              onClick={retake}
              className="flex-1 flex items-center justify-center gap-2 bg-white/15 text-white font-medium py-3 rounded-lg"
            >
              <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('retake')}
            </button>
            <button
              onClick={proceed}
              className="flex-1 flex items-center justify-center gap-2 bg-[#171717] text-white font-semibold py-3 rounded-lg"
            >
              <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t('usePhoto')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
