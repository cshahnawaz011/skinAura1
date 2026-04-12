import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Clock, Sun, Moon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NOTIFICATION_TIPS = {
  morning: [
    "Time for your morning glow routine! ☀️ Your skin repaired overnight — now protect it.",
    "Rise & glow! Don't skip SPF today — UV damages even through windows 🌞",
    "Morning check-in: Have you had your water? Hydrated skin = plump skin 💧",
  ],
  night: [
    "Time to remove the day 🌙 Double-cleanse to let your actives work overnight.",
    "Night routine reminder: Apply retinol/peptides now for skin repair while you sleep ✨",
    "10-minute glow ritual time 🌸 Your skin does 80% of its repair while you sleep.",
  ],
};

function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('denied');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  return Notification.requestPermission();
}

function scheduleNotification(time, type, routineId) {
  const key = `routine-notif-${routineId}-${type}`;
  const existingId = localStorage.getItem(key);
  if (existingId) clearTimeout(parseInt(existingId));

  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const msUntil = next - now;

  const tips = NOTIFICATION_TIPS[type] || NOTIFICATION_TIPS.morning;
  const tip = tips[Math.floor(Math.random() * tips.length)];

  const timeoutId = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('GlowAI Routine Reminder', {
        body: tip,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `glowai-${type}`,
      });
    }
    scheduleNotification(time, type, routineId);
  }, msUntil);

  localStorage.setItem(key, timeoutId.toString());
}

export default function SmartNotifications({ routine, routineType, onSave }) {
  const [enabled, setEnabled] = useState(routine?.reminder_enabled || false);
  const [time, setTime] = useState(routine?.reminder_time || (routineType === 'morning' ? '07:00' : '21:00'));
  const [permission, setPermission] = useState(Notification.permission || 'default');
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setEnabled(routine?.reminder_enabled || false);
    setTime(routine?.reminder_time || (routineType === 'morning' ? '07:00' : '21:00'));
  }, [routine?.id, routineType]);

  useEffect(() => {
    if (enabled && permission === 'granted' && routine?.id) {
      scheduleNotification(time, routineType, routine.id);
    }
  }, [enabled, time, permission, routine?.id]);

  const handleToggle = async () => {
    if (!enabled) {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== 'granted') return;
    }
    const next = !enabled;
    setEnabled(next);
    if (onSave) onSave({ ...routine, reminder_enabled: next, reminder_time: time });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTimeChange = (newTime) => {
    setTime(newTime);
    if (enabled) {
      if (onSave) onSave({ ...routine, reminder_enabled: true, reminder_time: newTime });
      if (permission === 'granted' && routine?.id) scheduleNotification(newTime, routineType, routine.id);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ede8e3', background: '#faf6f2' }}>
      <button onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {enabled
            ? <Bell className="w-4 h-4 text-rose-400" />
            : <BellOff className="w-4 h-4 text-gray-400" />}
          <span className="text-sm font-semibold" style={{ color: '#3d2a2a' }}>Smart Routine Reminder</span>
          {enabled && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: '#fce8ec', color: '#c07080' }}>
              {time}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && <Check className="w-4 h-4 text-emerald-500" />}
          <div className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-rose-400' : 'bg-gray-300'}`}
            onClick={e => { e.stopPropagation(); handleToggle(); }}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: '#ede8e3' }}>

            <div className="flex items-center gap-3 pt-3">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium mb-1" style={{ color: '#7a6060' }}>Reminder Time</p>
                <input type="time" value={time}
                  onChange={e => handleTimeChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm"
                  style={{ border: '1px solid #ede8e3', background: '#fff', color: '#3d2a2a' }} />
              </div>
            </div>

            {permission === 'denied' && (
              <div className="text-xs p-3 rounded-xl" style={{ background: '#fff5e8', color: '#c07030' }}>
                ⚠️ Notifications are blocked. Please enable them in your browser settings → Site Settings → Notifications.
              </div>
            )}

            {!enabled && permission !== 'denied' && (
              <button onClick={handleToggle}
                className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#e8a0b0,#c98bc4)' }}>
                <Bell className="w-4 h-4 inline mr-1.5" /> Enable Reminder
              </button>
            )}

            {enabled && (
              <div className="text-xs p-3 rounded-xl space-y-1" style={{ background: '#f0faf5', border: '1px solid #c0e8d0' }}>
                <p className="font-semibold text-green-700">✅ Reminder active!</p>
                <p className="text-green-600">You'll get a notification at {time} every day for your {routineType} routine.</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-semibold" style={{ color: '#7a6060' }}>Sample reminders you'll get:</p>
              {NOTIFICATION_TIPS[routineType]?.slice(0, 2).map((tip, i) => (
                <p key={i} className="text-xs p-2 rounded-lg" style={{ background: '#fff', color: '#5a3a3a' }}>"{tip}"</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}