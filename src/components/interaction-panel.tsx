'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShieldAlert, Loader2, AlertCircle } from 'lucide-react';
import type { Medicine, InteractionItem } from '@/lib/types';

export function InteractionPanel({ meds, profileName }: { meds: Medicine[]; profileName: string }) {
  const oral = useMemo(() => meds.filter((m) => m.route === '口服'), [meds]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InteractionItem[]>([]);
  const [error, setError] = useState('');
  const sigRef = useRef('');

  const sig = oral.map((m) => m.name + m.dose + m.unit + m.frequency).join('|');

  useEffect(() => {
    if (oral.length < 2) {
      sigRef.current = '';
      setItems([]);
      setError('');
      setLoading(false);
      return;
    }
    if (sig === sigRef.current) return;
    sigRef.current = sig;

    let alive = true;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const res = await fetch('/api/interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meds: oral.map((m) => ({
              name: m.name,
              route: m.route,
              dose: m.dose,
              unit: m.unit,
              frequency: m.frequency,
            })),
          }),
        });
        const body = (await res.json()) as { ok?: boolean; data?: InteractionItem[]; error?: string };
        if (!alive) return;
        if (!res.ok || !body.ok) {
          setError(body.error || '分析失败，请稍后重试');
          setItems([]);
        } else {
          setItems(body.data || []);
        }
      } catch {
        if (alive) {
          setError('网络异常，无法获取同服提示');
          setItems([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [oral, sig]);

  if (oral.length < 2) return null;

  return (
    <section className="anim-fade mt-6">
      <div className="mb-2 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-stone-800">多药同服提示</h3>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-4 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          正在为 {profileName} 整理同服注意事项…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-4 text-sm text-teal-700">
          这份口服药组合暂无明显的同服需要特别注意之处，仍请遵医嘱按时服药。
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div
              key={i}
              className="anim-fade rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <p className="text-sm font-bold text-stone-800">{it.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{it.content}</p>
              <p className="mt-3 rounded-lg bg-stone-50 px-2.5 py-1.5 text-[11px] text-stone-400">
                AI 参考信息，非医疗建议，请遵医嘱
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}