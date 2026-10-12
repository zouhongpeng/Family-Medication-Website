'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ChevronRight, Pill, Camera, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

const AVATARS = ['👩', '👨', '👵', '👴', '👧', '👦', '🧓', '🧔', '👶', '🦸'];
const COLORS = [
  'bg-teal-500/15 text-teal-700',
  'bg-sky-500/15 text-sky-700',
  'bg-amber-500/15 text-amber-700',
  'bg-rose-500/15 text-rose-600',
  'bg-violet-500/15 text-violet-700',
  'bg-emerald-500/15 text-emerald-700',
];

export function HomeView({ onEnter }: { onEnter: () => void }) {
  const { state, setActiveProfile, deleteProfile } = useStore();
  const [open, setOpen] = useState(false);

  const totalMeds = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of state.medicines) map[m.profileId] = (map[m.profileId] || 0) + 1;
    return map;
  }, [state.medicines]);

  const enter = (id: string) => {
    setActiveProfile(id);
    onEnter();
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`确定删除「${name}」的档案及其用药清单吗？`)) {
      deleteProfile(id);
      toast.info(`已删除「${name}」的档案`);
    }
  };

  return (
    <div className="anim-fade">
      <div className="py-4">
        <h2 className="text-2xl font-black tracking-tight text-stone-900">家人档案</h2>
        <p className="mt-1 text-xs text-stone-400">
          为每位家人建立独立档案，用药清单互不影响。数据仅保存在本机。
        </p>
      </div>

      {state.profiles.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-teal-200 bg-white/60 px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600/10 text-teal-600">
            <Users className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-bold text-stone-800">还没有家人档案</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-400">
            添加第一位家人，开始整理 TA 的用药吧。
            <br />
            可从拍照识别药盒快速建档，也可手动填写。
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/30 transition active:scale-95"
          >
            <Plus className="h-4 w-4" /> 添加家人
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {state.profiles.map((p, idx) => {
              const meds = totalMeds[p.id] || 0;
              const active = state.activeProfileId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => enter(p.id)}
                  className="anim-fade w-full rounded-2xl border border-stone-200/70 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${COLORS[idx % COLORS.length]}`}
                    >
                      {p.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-stone-900">{p.name}</span>
                        {active && (
                          <span className="rounded-full bg-teal-600/10 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                            当前
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                        <Pill className="h-3 w-3" />
                        {meds} 种药品
                        {meds > 0 && (
                          <span className="ml-1 inline-flex items-center gap-1 text-stone-300">
                            · <Camera className="h-3 w-3" />
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      role="button"
                      aria-label="删除档案"
                      onClick={(e) => handleDelete(e, p.id, p.name)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-300 transition hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </span>
                    <ChevronRight className="h-4 w-4 text-stone-300" />
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-300 bg-teal-50/50 py-3.5 text-sm font-semibold text-teal-700 transition active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" /> 添加家人档案
          </button>
          <p className="mt-4 text-center text-[11px] text-stone-300">
            点卡片进入该家人的用药清单
          </p>
        </>
      )}

      <AddProfileDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

export function AddProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addProfile, setActiveProfile } = useStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [color, setColor] = useState(COLORS[1]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('请填写称呼（如“妈妈”）');
      return;
    }
    const p = addProfile(trimmed, avatar, color);
    setActiveProfile(p.id);
    setName('');
    setAvatar(AVATARS[0]);
    setColor(COLORS[1]);
    onOpenChange(false);
    toast.success(`已为「${trimmed}」建档`);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center ${open ? '' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute inset-0 bg-stone-900/30 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl transition-transform duration-300 sm:rounded-3xl ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200 sm:hidden" />
        <h3 className="text-lg font-bold text-stone-900">添加家人</h3>
        <p className="mt-0.5 text-xs text-stone-400">为家人取个称呼，比如“妈妈”“爷爷”</p>

        {/* 头像预览 + 称呼 */}
        <div className="mt-5 flex items-center gap-4">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-4xl transition ${color}`}
          >
            {avatar}
          </span>
          <div className="flex-1 gap-1">
            <label className="text-xs font-medium text-stone-500">称呼</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：妈妈"
              maxLength={8}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {/* 头像选择 */}
        <div className="mt-4">
          <label className="text-xs font-medium text-stone-500">头像</label>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`flex h-11 items-center justify-center rounded-xl text-2xl transition ${
                  avatar === a ? 'bg-teal-600/10 ring-2 ring-teal-400' : 'bg-stone-50'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* 颜色选择 */}
        <div className="mt-4">
          <label className="text-xs font-medium text-stone-500">头像底色</label>
          <div className="mt-2 flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ${c} transition ${
                  color === c ? 'ring-2 ring-teal-500 ring-offset-2' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
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
            className="flex-1 rounded-2xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-600/30 transition active:scale-[0.98]"
          >
            添加并进入
          </button>
        </div>
      </div>
    </div>
  );
}