import React, { useState, useRef } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function ReminderSection({ routine, onSave, routineType }) {
  const [scheduledTime, setScheduledTime] = useState(
    routine?.reminder_time || (routineType === 'morning' ? '07:00' : '21:00')
  );
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const timerRef = useRef(null);

  const isEnabled = routine?.reminder_enabled || false;

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const scheduleNext = (timeStr) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;
    timerRef.current = setTimeout(() => {
      new Notification('🌟 GlowAI Reminder', {
        body: `Time for your ${routineType} skincare routine! ✨`,
        icon: '/favicon.ico',
      });
      scheduleNext(timeStr);
    }, delay);
  };

  const handleToggle = async (enabled) => {
    let perm = permission;
    if (enabled && perm !== 'granted') {
      perm = await requestPermission();
      if (perm !== 'granted') {
        alert('Please allow notifications in your browser settings, then try again.');
        return;
      }
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) scheduleNext(scheduledTime);
    onSave({ ...routine, reminder_enabled: enabled, reminder_time: scheduledTime });
  };

  const handleTimeChange = (e) => {
    const t = e.target.value;
    setScheduledTime(t);
    onSave({ ...routine, reminder_time: t });
    if (isEnabled && permission === 'granted') scheduleNext(t);
  };

  const testNotification = async () => {
    let perm = permission;
    if (perm !== 'granted') perm = await requestPermission();
    if (perm === 'granted') {
      new Notification('🌟 GlowAI Reminder', {
        body: `This is a test for your ${routineType} skincare routine! ✨`,
        icon: '/favicon.ico',
      });
    } else {
      alert('Notifications blocked. Please allow them in your browser settings.');
    }
  };

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
            ✅ Reminder set for <strong>{scheduledTime}</strong> daily. Keep the app open or add it to your home screen for persistent notifications.
          </p>
        </div>
      )}
    </div>
  );
}