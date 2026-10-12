'use client';

import React from 'react';
import { Copy, Check, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import type { Medicine, Profile } from '@/lib/types';

export function buildSummary(profile: Profile, meds: Medicine[]): string {
  const lines: string[] = [];
  lines.push(`【${profile.name} 的用药清单】`);
  lines.push('整理自「全家用药小管家」（仅供就医参考，AI 整理，非医疗建议）');
  lines.push('');
  if (meds.length === 0) {
    lines.push('（暂无用药记录）');
  } else {
    meds.forEach((m, i) => {
      const timeText = m.times.length ? `（${m.times.join('、')}）` : '';
      lines.push(
        `${i + 1}. ${m.name} · ${m.route} · 每次${m.dose}${m.unit} · ${m.frequency}${timeText}`,
      );
      if (m.note) lines.push(`   （备注：${m.note}）`);
    });
  }
  lines.push('');
  lines.push('—— 请以药品说明书及医师指导为准 ——');
  return lines.join('\n');
}

export function DoctorModal({
  open,
  onOpenChange,
  profile,
  meds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile | null;
  meds: Medicine[];
}) {
  const [copied, setCopied] = React.useState(false);

  if (!profile) return null;
  const text = buildSummary(profile, meds);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('复制失败，请手动选择复制');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center ${open ? '' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute inset-0 bg-stone-900/30 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="px-6 pb-4 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
              <Stethoscope className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-stone-900">就医出示</h3>
              <p className="text-xs text-stone-400">给医生看的用药摘要，可一键复制</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 pb-2">
          <pre className="whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 font-sans text-[13px] leading-relaxed text-stone-700">
            {text}
          </pre>
        </div>

        <div className="border-t border-stone-100 px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl bg-stone-100 py-3 text-sm font-semibold text-stone-600 transition active:scale-[0.98]"
            >
              关闭
            </button>
            <button
              type="button"
              onClick={copy}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-600/30 transition active:scale-[0.98]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? '已复制' : '复制摘要'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}