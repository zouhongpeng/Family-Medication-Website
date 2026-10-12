'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Camera, Plus, Trash2, Loader2, Stethoscope, Clock, StickyNote, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { AddMedDialog, EMPTY_DRAFT, type MedDraft } from './med-form';
import { InteractionPanel } from './interaction-panel';
import { DoctorModal } from './doctor-modal';

interface RecognizeData {
  name: string;
  route: string;
  dose: string;
  unit: string;
  frequency: string;
  times: string[];
  note: string;
}

export function MedsView({ activeId }: { activeId: string | null }) {
  const { state, addMedicine, deleteMedicine } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fromRecognition, setFromRecognition] = useState(false);
  const [initial, setInitial] = useState<MedDraft>(EMPTY_DRAFT);
  const [recognizing, setRecognizing] = useState(false);
  const [doctorOpen, setDoctorOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = state.profiles.find((p) => p.id === activeId) || null;
  const meds = useMemo(
    () => state.medicines.filter((m) => m.profileId === activeId).sort((a, b) => a.createdAt - b.createdAt),
    [state.medicines, activeId],
  );

  if (!activeId) return <EmptyHint title="请先在「家人」页选择一位家人" />;
  if (!profile) return <EmptyHint title="请先在「家人」页选择一位家人" />;

  const openManual = () => {
    setInitial({ ...EMPTY_DRAFT });
    setFromRecognition(false);
    setDialogOpen(true);
  };

  const openPhoto = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result as string;
      setRecognizing(true);
      try {
        const res = await fetch('/api/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUri }),
        });
        const body = (await res.json()) as { ok?: boolean; data?: RecognizeData; error?: string };
        if (!res.ok || !body.ok || !body.data) {
          toast.error(body.error || '识别失败，请重试或手动填写');
          return;
        }
        setInitial({
          name: body.data.name,
          route: (['口服', '外用', '其他'].includes(body.data.route) ? body.data.route : '口服') as MedDraft['route'],
          dose: body.data.dose || '1',
          unit: (body.data.unit as MedDraft['unit']) || '片',
          frequency: body.data.frequency || '按说明书',
          times: body.data.times?.length ? body.data.times : ['08:00'],
          note: body.data.note || '',
        });
        setFromRecognition(true);
        setDialogOpen(true);
      } catch {
        toast.error('识别服务异常，请稍后重试或手动填写');
      } finally {
        setRecognizing(false);
      }
    };
    reader.onerror = () => toast.error('读取图片失败');
    reader.readAsDataURL(file);
  };

  const handleConfirm = (draft: MedDraft) => {
    addMedicine({ ...draft, profileId: activeId });
    toast.success(`已保存「${draft.name}」`);
  };

  return (
    <div className="anim-fade">
      <div className="py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-stone-900">
            {profile.avatar} {profile.name}·用药清单
          </h2>
          <button
            type="button"
            onClick={() => setDoctorOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-teal-600/30 transition active:scale-95"
          >
            <Stethoscope className="h-3.5 w-3.5" /> 就医出示
          </button>
        </div>
        <p className="mt-1 text-xs text-stone-400">
          {meds.length} 种药品 · 打勾记录在今日安排里
        </p>
      </div>

      {/* 操作区 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={openPhoto}
          disabled={recognizing}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-teal-200 bg-teal-50/70 py-4 text-teal-700 transition active:scale-[0.98] disabled:opacity-60"
        >
          {recognizing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          <span className="text-xs font-semibold">
            {recognizing ? '识别中…' : '拍照添加药盒'}
          </span>
        </button>
        <button
          type="button"
          onClick={openManual}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-stone-200 bg-white py-4 text-stone-600 transition active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-semibold">手动添加药品</span>
        </button>
      </div>

      {/* 相互作用提示 */}
      <InteractionPanel meds={meds} profileName={profile.name} />

      {/* 药品列表 */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-stone-800">我的药品</h3>
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
            {meds.length}
          </span>
        </div>

        {meds.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-white/50 px-6 py-12 text-center">
            <span className="text-4xl">💊</span>
            <p className="mt-3 text-sm font-medium text-stone-500">清单还是空的</p>
            <p className="mt-1 text-xs text-stone-400">拍个药盒照，或手动添加第一盒药</p>
          </div>
        ) : (
          meds.map((m, i) => (
            <div
              key={m.id}
              className="anim-fade rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                  <Plus className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-stone-900">{m.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        m.route === '口服'
                          ? 'bg-teal-600/10 text-teal-700'
                          : m.route === '外用'
                            ? 'bg-sky-500/10 text-sky-700'
                            : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {m.route}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-stone-600">
                    每次 {m.dose}
                    {m.unit} · {m.frequency}
                  </p>
                  {m.times.length > 0 && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-stone-500">
                      <Clock className="h-3 w-3 text-stone-400" />
                      {m.times.map((t) => (
                        <span key={t} className="rounded-md bg-stone-100 px-1.5 py-0.5 tabular-nums">
                          {t}
                        </span>
                      ))}
                    </p>
                  )}
                  {m.note && (
                    <p className="mt-1.5 flex items-start gap-1 text-xs text-stone-400">
                      <StickyNote className="mt-0.5 h-3 w-3 shrink-0" /> {m.note}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="删除药品"
                  onClick={() => {
                    if (window.confirm(`确定删除「${m.name}」吗？`)) {
                      deleteMedicine(m.id);
                      toast.info(`已删除「${m.name}」`);
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-300 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {meds.some((m) => m.route === '口服') && (
        <p className="mt-5 flex items-center justify-center gap-1 text-center text-[11px] text-stone-300">
          <AlertTriangle className="h-3 w-3" /> 用药信息为整理与提醒，如有疑问请遵医嘱
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      <AddMedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={initial}
        fromRecognition={fromRecognition}
        onConfirm={handleConfirm}
        title={fromRecognition ? '确认识别结果' : '手动添加药品'}
        subtitle={
          fromRecognition
            ? '核对下方信息并保存'
            : '填写用药信息，用于整理与提醒'
        }
      />

      <DoctorModal open={doctorOpen} onOpenChange={setDoctorOpen} profile={profile} meds={meds} />
    </div>
  );
}

function EmptyHint({ title }: { title: string }) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-stone-300 bg-white/50 px-6 py-14 text-center">
      <span className="text-4xl">👤</span>
      <p className="mt-3 text-sm font-medium text-stone-500">{title}</p>
    </div>
  );
}