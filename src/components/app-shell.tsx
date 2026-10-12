'use client';

import React, { useState } from 'react';
import { Users, CalendarCheck2, Pill, Sparkles } from 'lucide-react';
import { Toaster } from 'sonner';
import { useStore } from '@/lib/store';
import { HomeView } from './home-view';
import { TodayView } from './today-view';
import { MedsView } from './meds-view';

type Tab = 'home' | 'today' | 'meds';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'home', label: '家人', icon: Users },
  { key: 'today', label: '今日', icon: CalendarCheck2 },
  { key: 'meds', label: '清单', icon: Pill },
];

export function AppShell() {
  const [tab, setTab] = useState<Tab>('home');
  const { state, mounted } = useStore();
  const hasProfile = state.profiles.length > 0;
  const activeId = state.activeProfileId && state.profiles.some((p) => p.id === state.activeProfileId)
    ? state.activeProfileId
    : null;

  const goMeds = () => setTab('meds');

  // 在底部导航上，若当前无档案，则只允许在「家人」页添加
  const visibleTabs = hasProfile ? TABS : TABS.filter((t) => t.key === 'home');

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-transparent">
      {/* 顶部区域 */}
      <header className="px-5 pb-1 pt-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600/10 text-teal-700">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight text-stone-900">
              全家用药小管家
            </h1>
            <p className="mt-1 text-[11px] text-stone-400">整理 + 提醒，不替代医嘱</p>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 px-4 pb-24">
        {!mounted ? (
          <div className="flex items-center justify-center py-24 text-sm text-stone-400">
            正在加载…
          </div>
        ) : tab === 'home' ? (
          <HomeView onEnter={goMeds} />
        ) : tab === 'today' ? (
          <TodayView activeId={activeId} />
        ) : (
          <MedsView activeId={activeId} />
        )}
      </main>

      {/* 底部导航 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md">
        <div className="mx-3 mb-3 rounded-2xl border border-stone-200/70 bg-white/85 px-2 py-2 shadow-lg shadow-stone-200/60 backdrop-blur-xl">
          <div className="flex items-center justify-around">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors ${
                    active ? 'text-teal-700' : 'text-stone-400'
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 2} />
                  <span className={`text-[11px] ${active ? 'font-semibold' : ''}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <Toaster position="top-center" richColors />
    </div>
  );
}