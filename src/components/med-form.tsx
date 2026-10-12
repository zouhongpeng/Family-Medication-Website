'use client';

import React from 'react';
import { Plus, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Medicine, Route, MedicineForm } from '@/lib/types';

const ROUTES: Route[] = ['口服', '外用', '其他'];
const UNITS: MedicineForm[] = ['片', '粒', '胶囊', '袋', '包', '毫克(mg)', '毫升(ml)', '滴', '喷', '贴', '支', '勺', '无'];

export interface MedDraft {
  name: string;
  route: Route;
  dose: string;
  unit: MedicineForm;
  frequency: string;
  times: string[];
  note: string;
}

export const EMPTY_DRAFT: MedDraft = {
  name: '',
  route: '口服',
  dose: '1',
  unit: '片',
  frequency: '每日1次',
  times: ['08:00'],
  note: '',
};

export function TimeEditor({
  times,
  onChange,
}: {
  times: string[];
  onChange: (t: string[]) => void;
}) {
  const update = (i: number, val: string) => {
    const next = [...times];
    next[i] = val;
    onChange(next);
  };
  const remove = (i: number) => {
    if (times.length <= 1) return;
    onChange(times.filter((_, idx) => idx !== i));
  };
  const add = () => {
    if (times.length >= 6) return;
    onChange([...times, '08:00']);
  };

  return (
    <div>
      <label className="text-xs font-medium text-stone-500">服药时间</label>
      <div className="mt-2 space-y-2">
        {times.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="time"
              value={t}
              onChange={(e) => update(i, e.target.value)}
              className="w-32 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-center text-base tabular-nums text-stone-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
            {times.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-300 transition hover:bg-rose-50 hover:text-rose-500"
                aria-label="删除该时刻"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {times.length < 6 && (
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition active:scale-95"
          >
            <Plus className="h-3 w-3" /> 添加服药时刻
          </button>
        )}
      </div>
    </div>
  );
}

export function AddMedDialog({
  open,
  onOpenChange,
  initial,
  fromRecognition,
  onConfirm,
  title,
  subtitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: MedDraft;
  fromRecognition?: boolean;
  onConfirm: (draft: MedDraft) => void;
  title?: string;
  subtitle?: string;
}) {
  const [draft, setDraft] = React.useState<MedDraft>(initial);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const set = (patch: Partial<MedDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error('请填写药品名称');
      return;
    }
    const times = draft.times.map((t) => t || '08:00');
    setSaving(true);
    setTimeout(() => {
      onConfirm({ ...draft, name, times });
      setSaving(false);
      onOpenChange(false);
    }, 120);
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
        <div className="overflow-y-auto px-6 pb-6 pt-4">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
          <h3 className="text-lg font-bold text-stone-900">{title || '添加药品'}</h3>
          <p className="mt-0.5 text-xs text-stone-400">
            {subtitle || '填写用药信息，用于整理与提醒'}
          </p>

          {fromRecognition && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-xs text-teal-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                已识别出以下信息（AI 识别，非医疗建议），请逐项核对、修改后确认保存。
              </span>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-stone-500">药品名称</label>
              <input
                autoFocus={!fromRecognition}
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="如：阿司匹林肠溶片"
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500">给药途径</label>
              <div className="mt-2 flex gap-1 rounded-xl bg-stone-100 p-1">
                {ROUTES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set({ route: r })}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                      draft.route === r ? 'bg-white text-teal-700 shadow-sm' : 'text-stone-500'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-stone-500">单次用量</label>
                <input
                  value={draft.dose}
                  onChange={(e) => set({ dose: e.target.value })}
                  placeholder="1"
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-stone-500">单位</label>
                <select
                  value={draft.unit}
                  onChange={(e) => set({ unit: e.target.value as MedicineForm })}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-2 py-2.5 text-base text-stone-900 outline-none transition focus:border-teal-400 focus:bg-white"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500">用药频次</label>
              <input
                value={draft.frequency}
                onChange={(e) => set({ frequency: e.target.value })}
                placeholder="如：每日3次"
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <TimeEditor times={draft.times} onChange={(t) => set({ times: t })} />

            <div>
              <label className="text-xs font-medium text-stone-500">备注（可选）</label>
              <textarea
                value={draft.note}
                onChange={(e) => set({ note: e.target.value })}
                placeholder="如：饭后服用、一天最多4粒"
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-stone-100 px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl bg-stone-100 py-3 text-sm font-semibold text-stone-600 transition active:scale-[0.98]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex-1 rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-600/30 transition active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 将识别结果转换为表单草稿
export function medFromDraft(draft: MedDraft): Omit<Medicine, 'id' | 'createdAt' | 'profileId'> {
  return {
    name: draft.name,
    route: draft.route,
    dose: draft.dose || '1',
    unit: draft.unit,
    frequency: draft.frequency || '按说明书',
    times: draft.times,
    note: draft.note,
  };
}