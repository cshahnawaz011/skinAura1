import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const PERM_KEY = 'glowai-notif-permission';

function msUntilTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

export default function ReminderSection({ routine, onSave, routineType }) {
  const [scheduledTime, setScheduledTime] = useState(
    routine?.reminder_time || (routineType === 'morning' ? '07:00' : '21:00')
  );
  const [permission, setPermission] = useState('default');
  const timerRef = useRef(null);

  // Check real permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  // Auto-schedule when enabled + permission granted
  useEffect(() => {
    if (routine?.reminder_enabled && permission === 'granted') {
      schedule(routine.reminder_time || scheduledTime);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [routine?.reminder_enabled, permission]);

  // Re-schedule when tab becomes visible again (handles tab switching / sleep)
  useEffect(() => {
    const onVisible = () => {
      if (routine?.reminder_enabled && permission === 'granted') {
        schedule(routine.reminder_time || scheduledTime);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [routine?.reminder_enabled, permission, scheduledTime]);

  const schedule = (timeStr) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = msUntilTime(timeStr);
    timerRef.current = setTimeout(() => {
      new Notification('🌟 GlowAI Reminder', {
        body: `Time for your ${routineType} skincare routine! ✨`,
        icon: '/favicon.ico',
      });
      schedule(timeStr); // reschedule for next day
    }, delay);
  };

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const handleToggle = async (enabled) => {
    let perm = permission;
    if (enabled && perm !== 'granted') {
      perm = await requestPermission();
      if (perm !== 'granted') {
        alert('Please allow notifications in your browser/phone settings, then try again.');
        return;
      }
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled && perm === 'granted') schedule(scheduledTime);
    onSave({ ...routine, reminder_enabled: enabled, reminder_time: scheduledTime });
  };

  const handleTimeChange = (e) => {
    const t = e.target.value;
    setScheduledTime(t);
    onSave({ ...routine, reminder_time: t });
    if (routine?.reminder_enabled && permission === 'granted') schedule(t);
  };

  const testNotification = async () => {
    let perm = permission;
    if (perm !== 'granted') perm = await requestPermission();
    if (perm === 'granted') {
      new Notification('🌟 GlowAI Test', {
        body: `Test for your ${routineType} skincare reminder! ✨`,
        icon: '/favicon.ico',
      });
    } else {
      alert('Notifications are blocked. Please allow them in your browser/system settings.');
    }
  };

  const isEnabled = routine?.reminder_enabled || false;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {isEnabled ? <BellRing className="w-5 h-5 text-pink-500" /> : <BellOff className="w-5 h-5 text-gray-400" />}
          <div>
            <p className="font-medium">Daily Reminder</p>
            <p className="text-sm text-gray-500">
              {permission === 'denied'
                ? '⚠️ Notifications blocked — allow in browser settings'
                : `Browser notification at ${scheduledTime}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input type="time" value={scheduledTime} onChange={handleTimeChange} className="w-28" />
          <Switch checked={isEnabled} onCheckedChange={handleToggle} />
          <Button variant="outline" size="sm" onClick={testNotification} className="text-xs">
            <Bell className="w-3 h-3 mr-1" /> Test
          </Button>
        </div>
      </div>
      {isEnabled && permission === 'granted' && (
        <div className="mt-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <p className="text-xs text-green-700 dark:text-green-400">
            ✅ Reminder set for <strong>{scheduledTime}</strong> daily. Keep the app open for notifications (add to home screen for best results).
          </p>
        </div>
      )}
    </div>
  );
}