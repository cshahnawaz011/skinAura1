import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Check, Plus, Trash2, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'glowai-family-consistency';
const today = () => new Date().toLocaleDateString('en-CA');

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function getStreak(member, data) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toLocaleDateString('en-CA');
    if (data[member]?.days?.[key]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

export default function FamilyConsistency() {
  const [data, setData] = useState(loadData);
  const [members, setMembers] = useState(() => {
    const d = loadData();
    return d.__members__ || ['You'];
  });
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const todayKey = today();

  const toggle = (member, type) => {
    setData(prev => {
      const next = { ...prev };
      if (!next[member]) next[member] = { days: {} };
      if (!next[member].days[todayKey]) next[member].days[todayKey] = {};
      next[member].days[todayKey][type] = !next[member].days[todayKey]?.[type];
      saveData(next);
      return { ...next };
    });
  };

  const addMember = () => {
    if (!newName.trim()) return;
    const updated = [...members, newName.trim()];
    setMembers(updated);
    setData(prev => {
      const next = { ...prev, __members__: updated };
      saveData(next);
      return next;
    });
    setNewName('');
    setAdding(false);
  };

  const removeMember = (name) => {
    if (name === 'You') return;
    const updated = members.filter(m => m !== name);
    setMembers(updated);
    setData(prev => {
      const next = { ...prev, __members__: updated };
      delete next[name];
      saveData(next);
      return next;
    });
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,250,246,0.9)', border: '1px solid #ede8e3' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#3d2a2a' }}>
          <Users className="w-4 h-4 text-pink-400" /> Family Skincare Consistency
        </h2>
        <button onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
          style={{ background: '#fde8f0', color: '#c07080' }}>
          <Plus className="w-3.5 h-3.5" /> Add Member
        </button>
      </div>

      {adding && (
        <div className="flex gap-2 mb-3">
          <Input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Member name..." className="text-sm h-8"
            onKeyDown={e => e.key === 'Enter' && addMember()} />
          <Button size="sm" onClick={addMember} className="h-8 bg-pink-500 hover:bg-pink-600">Add</Button>
        </div>
      )}

      <div className="space-y-3">
        {members.map((member, i) => {
          const dayData = data[member]?.days?.[todayKey] || {};
          const streak = getStreak(member, data);
          const done = dayData.morning && dayData.night;

          return (
            <motion.div key={member}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: done ? 'rgba(134,239,172,0.15)' : 'rgba(255,255,255,0.6)', border: `1px solid ${done ? '#86efac' : '#ede8e3'}` }}>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                style={{ background: done ? 'linear-gradient(135deg,#86efac,#34d399)' : 'linear-gradient(135deg,#fde8cc,#f9d5a7)', color: done ? '#065f46' : '#c07030' }}>
                {member[0].toUpperCase()}
              </div>

              {/* Name + streak */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: '#3d2a2a' }}>{member}</span>
                  {streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#fff3cd', color: '#c07030' }}>
                      <Flame className="w-3 h-3" /> {streak}d
                    </span>
                  )}
                  {done && <Star className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="flex gap-3 mt-1">
                  {/* Morning toggle */}
                  <button onClick={() => toggle(member, 'morning')}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all"
                    style={{
                      background: dayData.morning ? '#fde68a' : '#f0ebe6',
                      color: dayData.morning ? '#92400e' : '#9a7e78'
                    }}>
                    {dayData.morning ? <Check className="w-3 h-3" /> : null} ☀️ Morning
                  </button>
                  {/* Night toggle */}
                  <button onClick={() => toggle(member, 'night')}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all"
                    style={{
                      background: dayData.night ? '#c7d2fe' : '#f0ebe6',
                      color: dayData.night ? '#3730a3' : '#9a7e78'
                    }}>
                    {dayData.night ? <Check className="w-3 h-3" /> : null} 🌙 Night
                  </button>
                </div>
              </div>

              {member !== 'You' && (
                <button onClick={() => removeMember(member)}
                  className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs" style={{ color: '#9a7e78' }}>
        <span>{members.filter(m => data[m]?.days?.[todayKey]?.morning && data[m]?.days?.[todayKey]?.night).length}/{members.length} completed both routines today</span>
        <span>Tap to mark done ✓</span>
      </div>
    </div>
  );
}