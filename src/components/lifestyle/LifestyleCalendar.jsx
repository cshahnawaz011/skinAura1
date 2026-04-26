import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';

function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil((diff / oneDay + getDay(start) + 1) / 7);
}

export default function LifestyleCalendar({ selectedDate, onSelectDate, logs = [] }) {
  const [viewDate, setViewDate] = useState(new Date());

  const logDates = new Set(logs.map(l => l.log_date));

  const firstDay = startOfMonth(viewDate);
  const lastDay = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startPad = (getDay(firstDay) + 6) % 7; // Monday-first

  const prev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid rgba(244,114,182,0.18)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="font-black text-sm">{format(viewDate, 'MMMM yyyy')}</p>
          <p className="text-[10px] text-gray-400">WK {getWeekNumber(viewDate)}</p>
        </div>
        <button onClick={next} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={'pad' + i} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const hasLog = logDates.has(dateStr);
          const todayFlag = isToday(day);
          return (
            <button key={dateStr} onClick={() => onSelectDate(dateStr)}
              className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-xs font-bold transition-all ${
                isSelected ? 'bg-pink-500 text-white shadow-md' :
                todayFlag ? 'bg-pink-100 text-pink-600 ring-2 ring-pink-400' :
                'hover:bg-gray-100 text-gray-700'
              }`}>
              {format(day, 'd')}
              {hasLog && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 text-center mt-2">● = day logged</p>
    </div>
  );
}