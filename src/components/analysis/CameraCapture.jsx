import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RotateCcw, Check, X, Flashlight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SLOTS = [
  { id: 'front', label: 'Front Face',  emoji: '😊', hint: 'Look straight at the camera', icon: '⬛' },
  { id: 'left',  label: 'Left Profile', emoji: '👈', hint: 'Turn head ~45° to the left', icon: '◀' },
  { id: 'right', label: 'Right Profile', emoji: '👉', hint: 'Turn head ~45° to the right', icon: '▶' },
];

export default function CameraCapture({ photos, onPhotoChange, disabled }) {
  const [activeSlot, setActiveSlot] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRefs = { front: useRef(), left: useRef(), right: useRef() };

  const openCamera = async (slotId) => {
    setActiveSlot(slotId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      // fallback to file input
      fileRefs[slotId]?.current?.click();
      setActiveSlot(null);
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `${activeSlot}.jpg`, { type: 'image/jpeg' });
      onPhotoChange(activeSlot, { file, url: URL.createObjectURL(blob) });
      closeCamera();
      // auto-advance to next slot
      const idx = SLOTS.findIndex(s => s.id === activeSlot);
      if (idx < SLOTS.length - 1) {
        setTimeout(() => openCamera(SLOTS[idx + 1].id), 300);
      }
    }, 'image/jpeg', 0.92);
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setActiveSlot(null);
  };

  const handleFileChange = (slotId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    onPhotoChange(slotId, { file, url: URL.createObjectURL(file) });
  };

  const allDone = SLOTS.every(s => photos[s.id]);

  return (
    <div className="space-y-4">
      {/* Hidden file inputs as fallback */}
      {SLOTS.map(slot => (
        <input key={slot.id} ref={fileRefs[slot.id]} type="file" accept="image/*" capture="user" className="hidden"
          onChange={e => handleFileChange(slot.id, e)} />
      ))}

      {/* Camera modal */}
      <AnimatePresence>
        {activeSlot && cameraStream && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-safe">
              <button onClick={closeCamera} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="text-center">
                <p className="text-white font-black text-lg">{SLOTS.find(s => s.id === activeSlot)?.label}</p>
                <p className="text-white/60 text-xs">{SLOTS.find(s => s.id === activeSlot)?.hint}</p>
              </div>
              <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pb-2">
              {SLOTS.map(s => (
                <div key={s.id} className="w-2 h-2 rounded-full transition-all"
                  style={{ background: s.id === activeSlot ? '#f472b6' : photos[s.id] ? '#34d399' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>

            {/* Viewfinder */}
            <div className="flex-1 relative overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
              {/* Face overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-pink-400/70 rounded-full"
                  style={{ width: '60vw', height: '75vw', maxWidth: 280, maxHeight: 350, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
              </div>
              {/* Corner guides */}
              {['top-[12%] left-[18%]', 'top-[12%] right-[18%]', 'bottom-[22%] left-[18%]', 'bottom-[22%] right-[18%]'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 border-pink-400 opacity-80`}
                  style={{ borderWidth: '2px 0 0 2px', transform: i % 2 === 1 ? 'scaleX(-1)' : '', ...(i >= 2 ? { borderTopWidth: 0, borderBottomWidth: '2px' } : {}) }} />
              ))}
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs font-semibold">
                {SLOTS.find(s => s.id === activeSlot)?.hint}
              </p>
            </div>

            {/* Capture button */}
            <div className="p-8 flex justify-center">
              <button onClick={capture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-2xl"
                style={{ background: 'linear-gradient(135deg,#f472b6,#a78bfa)' }}>
                <Camera className="w-8 h-8 text-white" />
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot cards */}
      <div className="grid grid-cols-3 gap-3">
        {SLOTS.map((slot, idx) => {
          const photo = photos[slot.id];
          const isNext = !photo && SLOTS.slice(0, idx).every(s => photos[s.id]);
          return (
            <motion.div key={slot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <div onClick={() => !disabled && openCamera(slot.id)}
                className="relative rounded-2xl overflow-hidden cursor-pointer transition-all"
                style={{
                  aspectRatio: '3/4',
                  border: photo ? '2px solid #34d399' : isNext ? '2px solid #f472b6' : '2px dashed rgba(0,0,0,0.15)',
                  background: photo ? 'transparent' : isNext ? 'rgba(244,114,182,0.06)' : 'rgba(0,0,0,0.03)',
                }}>
                {photo ? (
                  <>
                    <img src={photo.url} alt={slot.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-white text-[10px] font-black bg-emerald-500 rounded-full px-2 py-0.5 flex items-center gap-1 w-fit">
                        <Check className="w-2.5 h-2.5" /> {slot.label}
                      </span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); onPhotoChange(slot.id, null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1.5 p-2">
                    <span className="text-3xl">{slot.emoji}</span>
                    <Camera className="w-5 h-5" style={{ color: isNext ? '#f472b6' : '#9ca3af' }} />
                    <p className="text-[10px] font-bold text-center" style={{ color: isNext ? '#f472b6' : '#6b7280' }}>{slot.label}</p>
                    <p className="text-[9px] text-gray-400 text-center leading-tight">{slot.hint}</p>
                    {isNext && (
                      <span className="text-[9px] font-black text-white bg-pink-500 px-2 py-0.5 rounded-full mt-1">TAP TO SHOOT</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {['Good lighting', 'No makeup', 'Clean skin', 'Neutral expression'].map(tip => (
          <span key={tip} className="flex items-center gap-1 text-[11px] text-gray-500">
            <Check className="w-3 h-3 text-emerald-500" /> {tip}
          </span>
        ))}
      </div>

      {/* Start flow button */}
      {!photos.front && (
        <Button onClick={() => openCamera('front')} disabled={disabled}
          className="w-full py-5 text-base font-black bg-gradient-to-r from-pink-500 to-violet-500">
          <Camera className="w-5 h-5 mr-2" /> Open Camera & Start Capture
        </Button>
      )}
    </div>
  );
}