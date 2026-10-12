'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Bell, BellOff, Sunrise, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Medicine } from '@/lib/types';

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtNow(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function periodIcon(h: number) {
  if (h < 6) return { Icon: Moon, label: '凌晨' };
  if (h < 11) return { Icon: Sunrise, label: '早晨' };
  if (h < 14) return { Icon: Sun, label: '中午' };
  if (h < 18) return { Icon: Sunset, label: '下午' };
  return { Icon: Moon, label: '晚上' };
}

interface Item {
  med: Medicine;
  time: string;
  key: string;
}

export function TodayView({ activeId }: { activeId: string | null }) {
  const { state, toggleTaken, isTaken } = useStore();
  const [now, setNow] = useState('');

  useEffect(() => {
    setNow(fmtNow());
    const t = setInterval(() => setNow(fmtNow()), 30000);
    return () => clearInterval(t);
  }, []);

  const profile = state.profiles.find((p) => p.id === activeId) || null;
  const dateStr = todayStr();

  const schedule: Item[] = useMemo(() => {
    if (!activeId) return [];
    return state.medicines
      .filter((m) => m.profileId === activeId && m.times.length > 0)
      .flatMap((med) => med.times.map((time) => ({ med, time, key: `${med.id}|${time}` })))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [state.medicines, activeId]);

  const doneCount = schedule.filter((it) => isTaken(dateStr, it.key)).length;

  // 浏览器到点提醒
  useMedicationReminder(schedule, dateStr, isTaken);

  if (!activeId) {
    return <EmptyHint title="请先在「家人」页选择一位家人" />;
  }
  if (!profile) {
    return <EmptyHint title="请先在「家人」页选择一位家人" />;
  }

  const noMeds = state.medicines.filter((m) => m.profileId === activeId).length === 0;

  return (
    <div className="anim-fade">
      <div className="py-4">
        <h2 className="text-2xl font-black tracking-tight text-stone-900">
          {profile.avatar} {profile.name}·今日
        </h2>
        <div className="mt-1 flex items-center gap-2 text-xs text-stone-400">
          <span>{dateStr}</span>
          <span className="text-stone-300">·</span>
          <span>
            已服 {doneCount} / {schedule.length}
          </span>
        </div>
      </div>

      <NotifyBar />

      {noMeds ? (
        <EmptyHint title="还没有添加用药，去「清单」页添加吧" />
      ) : schedule.length === 0 ? (
        <EmptyHint title="已添加的药品还没有设置服药时间" />
      ) : (
        <div className="space-y-2">
          {schedule.map((it, idx) => {
            const key = it.key;
            const taken = isTaken(dateStr, key);
            const [h] = it.time.split(':').map(Number);
            const { Icon, label } = periodIcon(h);
            const late = it.time < now && !taken;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleTaken(dateStr, key)}
                className={`anim-fade flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition active:scale-[0.99] ${
                  taken
                    ? 'border-teal-100 bg-teal-50/60'
                    : late
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-stone-200/70 bg-white'
                }`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl ${
                    taken
                      ? 'bg-teal-600/10 text-teal-600'
                      : late
                        ? 'bg-amber-500/15 text-amber-600'
                        : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="mt-0.5 text-[9px] font-semibold">{label}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold tabular-nums ${taken ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                      {it.time}
                    </span>
                    {late && !taken && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        待服药
                      </span>
                    )}
                    {taken && (
                      <span className="rounded-full bg-teal-600/10 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                        已服
                      </span>
                    )}
                  </div>
                  <p className={`mt-0.5 truncate text-sm font-semibold ${taken ? 'text-stone-400' : 'text-stone-700'}`}>
                    {it.med.name}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    {it.med.dose}
                    {it.med.unit} · {it.med.frequency}
                  </p>
                </div>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    taken
                      ? 'anim-check border-teal-500 bg-teal-500 text-white'
                      : 'border-stone-300 text-transparent'
                  }`}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-5 flex items-center justify-center gap-1 text-center text-[11px] text-stone-300">
        <Sparkles className="h-3 w-3" /> 点击打勾标记已服药，状态会自动保存在本机
      </p>
    </div>
  );
}

function NotifyBar() {
  const [perm, setPerm] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) setPerm(Notification.permission);
  }, []);

  const ask = async () => {
    if (!('Notification' in window)) {
      alert('当前浏览器不支持通知功能');
      return;
    }
    const p = await Notification.requestPermission();
    setPerm(p);
  };

  const granted = perm === 'granted';

  return (
    <button
      type="button"
      onClick={ask}
      className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/80 px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
        {granted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-teal-800">
          {granted ? '到点提醒已开启' : '开启到点提醒'}
        </p>
        <p className="text-[11px] text-teal-600/70">
          {granted ? '到点会弹出「该吃药了」通知' : '授权后，到点提醒吃药'}
        </p>
      </div>
      {!granted && (
        <span className="rounded-full bg-teal-600 px-3 py-1 text-[11px] font-semibold text-white">
          去开启
        </span>
      )}
    </button>
  );
}

function useMedicationReminder(
  schedule: Item[],
  dateStr: string,
  isTaken: (d: string, k: string) => boolean,
) {
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (schedule.length === 0) return;

    const timers: number[] = [];
    const nowDate = new Date();
    const nowMsOfDay = nowDate.getHours() * 3600000 + nowDate.getMinutes() * 60000 + nowDate.getSeconds() * 1000;

    for (const it of schedule) {
      if (isTaken(dateStr, it.key)) continue;
      const [h, m] = it.time.split(':').map(Number);
      const targetMsOfDay = h * 3600000 + m * 60000;
      const delta = targetMsOfDay - nowMsOfDay;
      if (delta > 0 && delta < 4 * 3600000) {
        const t = window.setTimeout(() => {
          new Notification(`该吃药了：${it.med.name}`, {
            body: `${it.time} ${it.med.name} ${it.med.dose}${it.med.unit}`,
            tag: it.key,
          });
        }, delta);
        timers.push(t);
      }
    }
    return () => timers.forEach((t) => clearTimeout(t));
  }, [schedule, dateStr, isTaken]);
}

function EmptyHint({ title }: { title: string }) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-white/50 px-6 py-14 text-center">
      <span className="text-4xl">💊</span>
      <p className="mt-3 text-sm font-medium text-stone-500">{title}</p>
    </div>
  );
}