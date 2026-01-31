
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App = () => {
  const [step, setStep] = useState<'splash' | 'home' | 'tutorial' | 'captureA' | 'captureB' | 'processing' | 'result' | 'gallery'>('splash');
  const [shotA, setShotA] = useState<string | null>(null);
  const [shotB, setShotB] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [opacity, setOpacity] = useState(0.5);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-hide splash
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => setStep('home'), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions in settings.");
      setStep('home');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Maintain aspect ratio
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setFlash(true);
      setTimeout(() => setFlash(false), 100);
      triggerHaptic();
      return canvas.toDataURL('image/jpeg', 0.92);
    }
    return null;
  };

  const handleCaptureA = () => {
    const data = capturePhoto();
    if (data) {
      setShotA(data);
      setStep('captureB');
    }
  };

  const handleCaptureB = async () => {
    const data = capturePhoto();
    if (data) {
      setShotB(data);
      setStep('processing');
      processMerge(shotA!, data);
    }
  };

  const processMerge = async (imgA: string, imgB: string) => {
    try {
      const base64A = imgA.split(',')[1];
      const base64B = imgB.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64A, mimeType: 'image/jpeg' } },
            { inlineData: { data: base64B, mimeType: 'image/jpeg' } },
            { text: "Merge these two photos. Photo A is the static background. Photo B has a new person added. Seamlessly extract the added person from B and place them into A. Match lighting, perspective, and depth. Return only the resulting image bytes." }
          ]
        }
      });

      let foundImage = false;
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          const resultUrl = `data:image/png;base64,${part.inlineData.data}`;
          setResultImage(resultUrl);
          setGallery(prev => [resultUrl, ...prev]);
          setStep('result');
          foundImage = true;
          break;
        }
      }

      if (!foundImage) throw new Error("Processing timed out. Please try again with better lighting.");

    } catch (err: any) {
      setError(err.message || "Failed to merge photos.");
      setStep('home');
    }
  };

  useEffect(() => {
    if (step === 'captureA' || step === 'captureB') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [step]);

  // Screens
  if (step === 'splash') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 animate-pulse">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-6">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2V7h2v10z" /></svg>
        </div>
        <h1 className="text-4xl font-black tracking-tighter italic">ADD ME</h1>
      </div>
    );
  }

  if (step === 'home') {
    return (
      <div className="flex flex-col min-h-screen bg-[#050505] text-white p-8">
        <div className="flex-grow flex flex-col justify-center items-center text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <svg className="w-20 h-20 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight uppercase italic">Add Me</h1>
          <p className="text-zinc-400 max-w-[280px] leading-relaxed mb-12">Capture everyone in the group, including the photographer. Magic merge, powered by AI.</p>
          
          <div className="w-full space-y-4 max-w-sm">
            <button 
              onClick={() => setStep('tutorial')}
              className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              START PROJECT
            </button>
            <button 
              onClick={() => setStep('gallery')}
              className="w-full py-5 border border-zinc-800 text-white font-bold rounded-2xl flex items-center justify-center gap-3 active:bg-zinc-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
              VIEW GALLERY
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (step === 'tutorial') {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white p-10 justify-center">
        <h2 className="text-3xl font-black mb-8 italic">HOW IT WORKS</h2>
        <div className="space-y-12">
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold">1</div>
            <div>
              <h3 className="font-bold mb-1">Capture Group</h3>
              <p className="text-zinc-500 text-sm">Take a photo of the group. Leave space for yourself.</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold">2</div>
            <div>
              <h3 className="font-bold mb-1">Swap & Align</h3>
              <p className="text-zinc-500 text-sm">Switch roles. Use the transparent overlay to match the background.</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-bold">3</div>
            <div>
              <h3 className="font-bold mb-1">Magic Merge</h3>
              <p className="text-zinc-500 text-sm">AI adds you to the scene automatically. Perfect lighting every time.</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setStep('captureA')}
          className="mt-16 w-full py-5 bg-blue-600 text-white font-black rounded-2xl active:scale-95 transition-transform"
        >
          GOT IT
        </button>
      </div>
    );
  }

  if (step === 'captureA' || step === 'captureB') {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
        <div className="relative flex-grow">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          
          {step === 'captureB' && shotA && (
            <img src={shotA} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity }} alt="Ghost Overlay" />
          )}

          {flash && <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-100" />}

          <div className="absolute top-0 left-0 w-full pt-14 px-6 pb-10 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-40">
            <button onClick={() => setStep('home')} className="w-12 h-12 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="px-5 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/10">
              {step === 'captureA' ? 'Shot 1: Group' : 'Shot 2: You'}
            </div>
            <div className="w-12"></div>
          </div>
        </div>

        <div className="w-full bg-black/90 px-8 pb-12 pt-6 border-t border-white/5 z-40">
          {step === 'captureB' && (
            <div className="mb-6 flex items-center gap-6">
              <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={opacity} 
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="flex-grow accent-white h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer"
              />
            </div>
          )}
          
          <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-center mb-6 text-zinc-300">
              {step === 'captureA' ? "Capture the background group..." : "Align yourself with the transparent overlay."}
            </p>
            <button 
              onClick={step === 'captureA' ? handleCaptureA : handleCaptureB}
              className="w-20 h-20 rounded-full border-[6px] border-white/20 flex items-center justify-center active:scale-90 transition-transform p-1"
            >
              <div className="w-full h-full rounded-full bg-white"></div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-10 text-center">
        <div className="relative w-32 h-32 mb-10">
          <div className="absolute inset-0 border-[6px] border-white/5 rounded-full"></div>
          <div className="absolute inset-0 border-[6px] border-t-white rounded-full animate-spin"></div>
          <div className="absolute inset-4 bg-zinc-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 animate-pulse text-zinc-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
          </div>
        </div>
        <h2 className="text-3xl font-black mb-3 italic">PROCESSING</h2>
        <p className="text-zinc-500 text-sm max-w-[200px]">Segmenting person and matching scene lighting...</p>
      </div>
    );
  }

  if (step === 'result' && resultImage) {
    return (
      <div className="flex flex-col min-h-screen bg-black">
        <div className="flex-grow flex items-center justify-center p-6 bg-[#0a0a0a]">
          <div className="relative group">
            <img src={resultImage} className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/5" alt="Result" />
            <div className="absolute -top-4 -right-4 bg-green-500 text-white p-2 rounded-full shadow-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </div>
          </div>
        </div>
        <div className="p-10 bg-[#111] rounded-t-[40px] space-y-6 border-t border-white/5">
          <div className="flex gap-4">
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = resultImage;
                link.download = `AddMe_${Date.now()}.png`;
                link.click();
              }}
              className="flex-grow py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              SAVE PHOTO
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  fetch(resultImage).then(res => res.blob()).then(blob => {
                    const file = new File([blob], 'addme.png', { type: 'image/png' });
                    navigator.share({ files: [file], title: 'AddMe Photo' });
                  });
                }
              }}
              className="w-16 h-16 bg-zinc-800 text-white rounded-2xl flex items-center justify-center active:bg-zinc-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
          <button 
            onClick={() => { setShotA(null); setShotB(null); setStep('home'); }}
            className="w-full py-4 text-zinc-500 font-bold hover:text-white transition-colors"
          >
            CREATE ANOTHER
          </button>
        </div>
      </div>
    );
  }

  if (step === 'gallery') {
    return (
      <div className="flex flex-col min-h-screen bg-black p-8 pt-16">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black italic uppercase">Gallery</h2>
          <button onClick={() => setStep('home')} className="w-10 h-10 flex items-center justify-center bg-zinc-800 rounded-full">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {gallery.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-zinc-700">
            <svg className="w-20 h-20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
            <p className="font-bold">EMPTY GALLERY</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gallery.map((img, i) => (
              <div key={i} className="aspect-square relative group active:scale-95 transition-transform" onClick={() => { setResultImage(img); setStep('result'); }}>
                <img src={img} className="w-full h-full object-cover rounded-2xl border border-white/5" alt={`Merge ${i}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

createRoot(document.getElementById('root')!).render(<App />);
