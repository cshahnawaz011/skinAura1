import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Check } from 'lucide-react';

const SLOTS = [
  { id: 'front', label: 'Front Face', emoji: '😊', hint: 'Look straight at camera' },
  { id: 'left',  label: 'Left Side',  emoji: '👈', hint: 'Turn head left ~45°' },
  { id: 'right', label: 'Right Side', emoji: '👉', hint: 'Turn head right ~45°' },
];

export default function ThreePhotoUploader({ photos, onPhotoChange, disabled }) {
  const refs = { front: useRef(), left: useRef(), right: useRef() };

  const handleFile = (slotId, file) => {
    if (!file) return;
    onPhotoChange(slotId, { file, url: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {SLOTS.map((slot) => {
          const photo = photos[slot.id];
          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <input
                ref={refs[slot.id]}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => handleFile(slot.id, e.target.files[0])}
              />
              <div
                onClick={() => !disabled && refs[slot.id].current?.click()}
                className={`relative border-2 border-dashed rounded-2xl overflow-hidden transition-all cursor-pointer
                  ${photo ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-pink-400 bg-white/40 dark:bg-white/5'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{ aspectRatio: '3/4' }}
              >
                {photo ? (
                  <>
                    <img src={photo.url} alt={slot.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                      <span className="text-white text-xs font-bold bg-emerald-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {slot.label}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPhotoChange(slot.id, null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-3 text-center gap-1">
                    <span className="text-2xl">{slot.emoji}</span>
                    <Camera className="w-5 h-5 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{slot.label}</p>
                    <p className="text-[10px] text-gray-400">{slot.hint}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {['Good lighting', 'No makeup', 'Clean skin', 'Neutral expression'].map(tip => (
          <span key={tip} className="flex items-center gap-1 text-xs text-gray-500">
            <Check className="w-3 h-3 text-emerald-500" /> {tip}
          </span>
        ))}
      </div>
    </div>
  );
}