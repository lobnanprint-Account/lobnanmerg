import React, { useState } from 'react';
import { Copy, Layers, X, SlidersHorizontal, Grid } from 'lucide-react';
import { CustomRowConfig, FieldElement } from '../types';

interface DuplicateLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: FieldElement | null;
  onConfirmDuplicate: (
    sourceElementId: string,
    customRowConfig: CustomRowConfig,
    positionOffset: { deltaX: number; deltaY: number },
    targetSlotIndex?: number | null
  ) => void;
  totalRecordsCount?: number;
  totalSlotsCount?: number;
}

export const DuplicateLineModal: React.FC<DuplicateLineModalProps> = ({
  isOpen,
  onClose,
  element,
  onConfirmDuplicate,
  totalRecordsCount = 200,
  totalSlotsCount = 4,
}) => {
  if (!isOpen || !element) return null;

  const origStart = element.customRowConfig?.startRow || 1;
  const origEnd = element.customRowConfig?.endRow || 20;
  const currentSpan = Math.max(1, origEnd - origStart + 1);

  const [mode, setMode] = useState<'range' | 'fixed' | 'offset'>(
    element.customRowConfig?.mode || 'range'
  );

  const [startRow, setStartRow] = useState<number>(origStart + currentSpan);
  const [endRow, setEndRow] = useState<number>(origEnd + currentSpan);
  const [fixedRow, setFixedRow] = useState<number>(element.customRowConfig?.fixedRow || 1);
  const [offset, setOffset] = useState<number>((element.customRowConfig?.offset || 0) + currentSpan);

  const nextSlotDefault =
    element.targetSlotIndex !== undefined && element.targetSlotIndex !== null && element.targetSlotIndex !== -1
      ? (element.targetSlotIndex + 1) % totalSlotsCount
      : 1;

  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(nextSlotDefault);
  const [positionMode, setPositionMode] = useState<'below' | 'right' | 'same'>('same');

  const handleApplyPresetRange = (start: number, end: number, slotIdx?: number) => {
    setMode('range');
    setStartRow(start);
    setEndRow(end);
    if (slotIdx !== undefined) {
      setTargetSlotIndex(slotIdx);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: CustomRowConfig = {
      enabled: true,
      mode,
      startRow,
      endRow,
      fixedRow,
      offset,
    };

    let deltaX = 0;
    let deltaY = 0;
    if (positionMode === 'below') {
      deltaY = 8;
    } else if (positionMode === 'right') {
      deltaX = 12;
    }

    onConfirmDuplicate(element.id, config, { deltaX, deltaY }, targetSlotIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-lg overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded border border-indigo-200 text-indigo-700">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                تكرار طبقة وتخصيص نطاق الأسطر والقسم
              </h3>
              <p className="text-[11px] text-slate-500">
                تخصيص أسطر الإكسل لهذا اللير وربطه بالقسم في الورقة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Active Element Info Banner */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">العنصر المراد تكراره:</span>
            <span className="font-bold text-indigo-700 font-mono bg-white px-2 py-0.5 rounded border border-slate-300">
              {element.fieldName ? `حقل: [ ${element.fieldName} ]` : element.staticText || 'مربع نص'}
            </span>
          </div>

          {/* Target Slot on Sheet Selection */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <Grid className="w-3.5 h-3.5 text-indigo-600" />
              الظهور على القسم في الورقة:
            </label>
            <div className="grid grid-cols-3 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTargetSlotIndex(null)}
                className={`py-1.5 px-2 rounded border transition ${
                  targetSlotIndex === null || targetSlotIndex === -1
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                جميع الأقسام
              </button>
              {Array.from({ length: totalSlotsCount }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTargetSlotIndex(idx)}
                  className={`py-1.5 px-2 rounded border transition ${
                    targetSlotIndex === idx
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  قسم #{idx + 1} فقط
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              نظام تحديد الأسطر:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded border border-slate-300 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`py-1.5 rounded transition flex items-center justify-center gap-1 ${
                  mode === 'range'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                نطاق أسطر
              </button>
              <button
                type="button"
                onClick={() => setMode('fixed')}
                className={`py-1.5 rounded transition flex items-center justify-center gap-1 ${
                  mode === 'fixed'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                سطر محدد
              </button>
              <button
                type="button"
                onClick={() => setMode('offset')}
                className={`py-1.5 rounded transition flex items-center justify-center gap-1 ${
                  mode === 'offset'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                إزاحة (+ Offset)
              </button>
            </div>
          </div>

          {/* Mode Details Section */}
          {mode === 'range' && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    من السطر رقم:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalRecordsCount}
                    value={startRow}
                    onChange={(e) => setStartRow(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono font-bold focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    إلى السطر رقم:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={totalRecordsCount}
                    value={endRow}
                    onChange={(e) => setEndRow(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono font-bold focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-600 block font-semibold">
                  اختصارات سريعة:
                </span>
                <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetRange(1, 20, 0)}
                    className="py-1 px-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 transition"
                  >
                    1 - 20 (ق1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetRange(21, 40, 1)}
                    className="py-1 px-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 transition"
                  >
                    21 - 40 (ق2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetRange(41, 60, 2)}
                    className="py-1 px-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 transition"
                  >
                    41 - 60 (ق3)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetRange(61, 80, 3)}
                    className="py-1 px-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 transition"
                  >
                    61 - 80 (ق4)
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 'fixed' && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                تثبيت السطر رقم:
              </label>
              <input
                type="number"
                min="1"
                max={totalRecordsCount}
                value={fixedRow}
                onChange={(e) => setFixedRow(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono font-bold focus:border-indigo-500"
              />
            </div>
          )}

          {mode === 'offset' && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                مقدار الإزاحة (+ Offset):
              </label>
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono font-bold focus:border-indigo-500"
              />
            </div>
          )}

          {/* Position Offset Mode */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              موضع المربع المكرر:
            </label>
            <div className="grid grid-cols-3 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPositionMode('same')}
                className={`py-1.5 rounded border transition ${
                  positionMode === 'same'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                نفس الموقع
              </button>
              <button
                type="button"
                onClick={() => setPositionMode('below')}
                className={`py-1.5 rounded border transition ${
                  positionMode === 'below'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                أسفل المربع
              </button>
              <button
                type="button"
                onClick={() => setPositionMode('right')}
                className={`py-1.5 rounded border transition ${
                  positionMode === 'right'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                إلى اليمين
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-2xs transition"
            >
              <Copy className="w-3.5 h-3.5" />
              تكرار اللير
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
