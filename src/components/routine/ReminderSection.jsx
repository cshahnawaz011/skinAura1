import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

function scheduleNotification(label, timeStr) {
  if (Notification.permission !== 'granted') return;

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target - now;
  setTimeout(() => {
    new Notification(`🌟 GlowAI Reminder`, {
      body: `Time for your ${label} skincare routine! ✨`,
      icon: '/favicon.ico',
    });
    // Re-schedule for next day
    scheduleNotification(label, timeStr);
  }, delay);
}

export default function ReminderSection({ routine, onSave, routineType }) {
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [scheduledTime, setScheduledTime] = useState(routine?.reminder_time || (routineType === 'morning' ? '07:00' : '21:00'));

  // Schedule on mount if already enabled
  useEffect(() => {
    if (routine?.reminder_enabled && notifPermission === 'granted') {
      scheduleNotification(routineType, scheduledTime);
    }
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    return result;
  };

  const handleToggle = async (enabled) => {
    let permission = notifPermission;
    if (enabled && permission !== 'granted') {
      permission = await requestPermission();
      if (permission !== 'granted') return;
    }
    onSave({ ...routine, reminder_enabled: enabled, reminder_time: scheduledTime });
    if (enabled && permission === 'granted') {
      scheduleNotification(routineType, scheduledTime);
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setScheduledTime(newTime);
    onSave({ ...routine, reminder_time: newTime });
    if (routine?.reminder_enabled && notifPermission === 'granted') {
      scheduleNotification(routineType, newTime);
    }
  };

  const testNotification = async () => {
    let permission = notifPermission;
    if (permission !== 'granted') {
      permission = await requestPermission();
    }
    if (permission === 'granted') {
      new Notification(`🌟 GlowAI Reminder`, {
        body: `Time for your ${routineType} skincare routine! ✨`,
        icon: '/favicon.ico',
      });
    }
  };

  const isEnabled = routine?.reminder_enabled || false;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {isEnabled
            ? <BellRing className="w-5 h-5 text-pink-500" />
            : <BellOff className="w-5 h-5 text-gray-400" />}
          <div>
            <p className="font-medium">Daily Reminder</p>
            <p className="text-sm text-gray-500">
              {notifPermission === 'denied'
                ? '⚠️ Notifications blocked in browser settings'
                : `Browser notification at ${scheduledTime}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="time"
            value={scheduledTime}
            onChange={handleTimeChange}
            className="w-28"
          />
          <Switch checked={isEnabled} onCheckedChange={handleToggle} />
          <Button
            variant="outline"
            size="sm"
            onClick={testNotification}
            className="text-xs"
          >
            <Bell className="w-3 h-3 mr-1" /> Test
          </Button>
        </div>
      </div>

      {isEnabled && notifPermission === 'granted' && (
        <div className="mt-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <p className="text-xs text-green-700 dark:text-green-400">
            ✅ Reminder set for <strong>{scheduledTime}</strong> daily. Keep this tab open or enable browser notifications persistently.
          </p>
        </div>
      )}
    </div>
  );
}