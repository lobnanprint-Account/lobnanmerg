import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { TextEffect } from '../types';

interface CanvaEffectsModuleProps {
  style: TextEffect;
  updateStyle: (updates: Partial<TextEffect>) => void;
}

export type CanvaEffectType =
  | 'none'
  | 'shadow'
  | 'lift'
  | 'hollow'
  | 'splice'
  | 'outline'
  | 'neon'
  | 'bg_box'
  | '3d_crimson'
  | 'choice_red';

export const CanvaEffectsModule: React.FC<CanvaEffectsModuleProps> = ({
  style,
  updateStyle,
}) => {
  const [activeEffect, setActiveEffect] = useState<CanvaEffectType>('none');

  const applyEffect = (type: CanvaEffectType) => {
    setActiveEffect(type);

    switch (type) {
      case 'none':
        updateStyle({
          stroke: { enabled: false, color: '#000000', width: 1, align: 'outside' },
          shadow: { enabled: false, color: '#000000', opacity: 0.5, blur: 4, offsetX: 2, offsetY: 2 },
          bg: { enabled: false, color: '#ffffff', padding: 4, borderRadius: 4 },
        });
        break;

      case 'shadow':
        updateStyle({
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.6,
            angle: 135,
            distance: 4,
            blur: 6,
            offsetX: 3,
            offsetY: 3,
          },
        });
        break;

      case 'lift':
        updateStyle({
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.65,
            angle: 90,
            distance: 0,
            blur: 14,
            offsetX: 0,
            offsetY: 0,
          },
        });
        break;

      case 'hollow':
        updateStyle({
          color: '#FFFFFF',
          stroke: {
            enabled: true,
            color: style.stroke?.color || '#3B82F6',
            width: 3,
            align: 'outside',
          },
          shadow: { enabled: false, color: '#000000', opacity: 0.5, blur: 4, offsetX: 2, offsetY: 2 },
        });
        break;

      case 'splice':
        updateStyle({
          color: '#06B6D4',
          stroke: {
            enabled: true,
            color: '#0F172A',
            width: 3,
            align: 'outside',
          },
          shadow: {
            enabled: true,
            color: '#EC4899',
            opacity: 0.9,
            angle: 135,
            distance: 5,
            blur: 0,
            offsetX: 4,
            offsetY: 4,
          },
        });
        break;

      case 'outline':
        updateStyle({
          stroke: {
            enabled: true,
            color: style.stroke?.color || '#FFFFFF',
            width: 5,
            align: 'outside',
          },
          shadow: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            angle: 135,
            distance: 3,
            blur: 6,
            offsetX: 2,
            offsetY: 2,
          },
        });
        break;

      case 'neon':
        updateStyle({
          color: '#FFFFFF',
          stroke: {
            enabled: true,
            color: '#06B6D4',
            width: 1.5,
            align: 'outside',
          },
          shadow: {
            enabled: true,
            color: '#06B6D4',
            opacity: 0.95,
            angle: 0,
            distance: 0,
            blur: 18,
            offsetX: 0,
            offsetY: 0,
          },
        });
        break;

      case 'bg_box':
        updateStyle({
          bg: {
            enabled: true,
            color: style.bg?.color || '#4F46E5',
            padding: 8,
            borderRadius: 8,
          },
        });
        break;

      case '3d_crimson':
        updateStyle({
          color: '#E11D48',
          fontWeight: '800',
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 3,
            align: 'outside',
          },
          shadow: {
            enabled: true,
            color: '#4C0519',
            opacity: 0.95,
            angle: 135,
            distance: 7,
            blur: 0,
            offsetX: 5,
            offsetY: 5,
          },
        });
        break;

      case 'choice_red':
        updateStyle({
          color: '#EF4444',
          fontWeight: '900',
          stroke: {
            enabled: true,
            color: '#FFFFFF',
            width: 6,
            align: 'outside',
          },
          shadow: {
            enabled: true,
            color: '#7F1D1D',
            opacity: 0.95,
            angle: 135,
            distance: 8,
            blur: 0,
            offsetX: 6,
            offsetY: 6,
            extendBeyondStroke: true,
            extraOffsetPx: 2,
          },
        });
        break;
    }
  };

  const effectsList = [
    { id: 'choice_red' as CanvaEffectType, name: '🎯 3D أحمر بارز', desc: 'بارز كارتوني أحمر بحد أبيض' },
    { id: 'none' as CanvaEffectType, name: 'بدون', desc: 'نص عادي بدون تأثيرات' },
    { id: 'shadow' as CanvaEffectType, name: 'ظل (Shadow)', desc: 'إضافة ظل خلف النص' },
    { id: 'lift' as CanvaEffectType, name: 'رفع (Lift)', desc: 'توهج محيطي دافئ' },
    { id: 'hollow' as CanvaEffectType, name: 'مفرغ (Hollow)', desc: 'إطار مفرغ بدون تعبئة' },
    { id: 'splice' as CanvaEffectType, name: 'سبلايس (Splice)', desc: 'إطار مع ظل إزاحة متباين' },
    { id: 'outline' as CanvaEffectType, name: 'مخطط (Outline)', desc: 'حد خارجي عريض' },
    { id: 'neon' as CanvaEffectType, name: 'نيون (Neon)', desc: 'توهج نيون مضيء' },
    { id: 'bg_box' as CanvaEffectType, name: 'خلفية (Box)', desc: 'صندوق خلفية ملون' },
    { id: '3d_crimson' as CanvaEffectType, name: '🔴 3D كرمزي', desc: 'نص مجسم 3D كرمزي' },
  ];

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-300 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          تأثيرات النصوص السريعة
        </h5>
      </div>

      {/* Visual Effect Cards Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {effectsList.map((eff) => {
          const isSelected = activeEffect === eff.id;
          return (
            <button
              type="button"
              key={eff.id}
              onClick={() => applyEffect(eff.id)}
              className={`p-2 rounded text-right transition border flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold block truncate">{eff.name}</span>
              <span className="text-[10px] text-slate-500 truncate">{eff.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
