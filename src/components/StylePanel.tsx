import React, { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Monitor,
  Move,
  Plus,
  QrCode,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  Split,
  Type,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { FieldElement, GridSetup, TextEffect } from '../types';
import { TEXT_PRESETS } from '../data/textPresets';
import { SearchableFontPicker } from './SearchableFontPicker';
import { CanvaEffectsModule } from './CanvaEffectsModule';
import {
  FontOption,
  STANDARD_FONTS,
  queryWindowsLocalFonts,
} from '../utils/fontManager';

interface StylePanelProps {
  elements: FieldElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  selectedElement: FieldElement | null;
  onChangeElementStyle: (elementId: string, updatedStyle: TextEffect) => void;
  onChangeElementProp: (elementId: string, updates: Partial<FieldElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement?: (elementId: string) => void;
  onHoverPreviewFont?: (fontValue: string | null) => void;
  onAddStaticText: () => void;
  onAddQrCode: () => void;
  headers: string[];
  grid?: GridSetup;
  totalRecordsCount?: number;
  onReplicateLayerAcrossSlots?: (sourceElementId?: string, spanPerSlot?: number, targetFieldName?: string) => void;
  onAutoPartitionLayers?: (sourceElementId?: string, spanPerSlot?: number) => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onChangeElementStyle,
  onChangeElementProp,
  onDeleteElement,
  onDuplicateElement,
  onHoverPreviewFont,
  onAddStaticText,
  onAddQrCode,
  headers,
  grid,
  totalRecordsCount = 200,
  onReplicateLayerAcrossSlots,
  onAutoPartitionLayers,
}) => {
  const [fontList, setFontList] = useState<FontOption[]>(STANDARD_FONTS);
  const [fontStatus, setFontStatus] = useState<string>('');
  const [isLoadingFonts, setIsLoadingFonts] = useState<boolean>(false);
  const [customPartitionSpan, setCustomPartitionSpan] = useState<number>(20);
  const [selectedHeaderToReplicate, setSelectedHeaderToReplicate] = useState<string>('');

  const totalSlots = (grid?.rows || 2) * (grid?.cols || 2);
  const equalSpan = Math.max(1, Math.ceil(totalRecordsCount / totalSlots));

  const replicateAction = onReplicateLayerAcrossSlots || onAutoPartitionLayers;

  const handleQueryWindowsFonts = async () => {
    setIsLoadingFonts(true);
    setFontStatus('جاري استدعاء خطوط نظام ويندوز...');
    try {
      const winFonts = await queryWindowsLocalFonts();
      if (winFonts.length > 0) {
        const existingValues = new Set(fontList.map((f) => f.value));
        const newFonts = winFonts.filter((f) => !existingValues.has(f.value));
        setFontList((prev) => [...newFonts, ...prev]);
        setFontStatus(`تم جلب ${winFonts.length} خط بنجاح`);
      } else {
        setFontStatus('لم يتم العثور على خطوط.');
      }
    } catch {
      setFontStatus('استخدم زر "رفع خط من الجهاز" لاختيار خطوط من جهازك.');
    } finally {
      setIsLoadingFonts(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoadingFonts(true);
    setFontStatus('جاري تحميل الخطوط...');
    let addedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fontName = file.name.replace(/\.[^/.]+$/, '');
      try {
        const fontFace = new FontFace(fontName, await file.arrayBuffer());
        await fontFace.load();
        document.fonts.add(fontFace);

        setFontList((prev) => {
          if (prev.some((f) => f.value === fontName)) return prev;
          return [{ name: fontName, value: fontName, category: 'custom' }, ...prev];
        });
        addedCount++;
      } catch (error) {
        console.error('Error loading font:', error);
      }
    }

    setFontStatus(`تم تثبيت ${addedCount} خط جديد`);
    setIsLoadingFonts(false);
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Panel Top Header & Quick Add Buttons */}
      <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-indigo-50 rounded text-indigo-700 border border-indigo-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">طبقات النص والكائنات</h3>
              <p className="text-[11px] text-slate-500">إدارة خصائص ومواقع النصوص والخطوط</p>
            </div>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-300">
            {elements.length} عنصر
          </span>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            onClick={onAddStaticText}
            className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة نص
          </button>
          <button
            type="button"
            onClick={onAddQrCode}
            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-bold flex items-center justify-center gap-1 border border-slate-300 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            إضافة كود QR
          </button>
        </div>

        {/* Dedicated Replicate Layer Per Slot Feature */}
        {replicateAction && (
          <div className="bg-gradient-to-r from-indigo-50/90 to-blue-50/90 p-3 rounded-lg border border-indigo-200 space-y-2.5 mt-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Split className="w-4 h-4 text-indigo-600" />
                تكرار لير منفصل لكل قسم (توزيع عمود الإكسل)
              </span>
              <span className="text-[10px] bg-white text-indigo-800 font-mono px-2 py-0.5 rounded border border-indigo-200 font-bold">
                {totalSlots} أقسام
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-700 block mb-1 font-bold">اختر العامود المستهدف:</label>
                <select
                  value={selectedHeaderToReplicate || (headers[0] || '')}
                  onChange={(e) => setSelectedHeaderToReplicate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-bold focus:border-indigo-500 focus:outline-none"
                >
                  {headers.length === 0 ? (
                    <option value="">العمود A</option>
                  ) : (
                    headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-700 block mb-1 font-bold">عدد الأسطر لكل قسم:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max={totalRecordsCount || 500}
                    value={customPartitionSpan}
                    onChange={(e) => setCustomPartitionSpan(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono font-bold text-center text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomPartitionSpan(equalSpan)}
                    className="text-[10px] bg-white hover:bg-indigo-50 text-indigo-700 px-1.5 py-1 rounded border border-indigo-200 whitespace-nowrap font-bold"
                    title={`تقسيم متساوي (${equalSpan} سطر)`}
                  >
                    تلقائي ({equalSpan})
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const targetHeader = selectedHeaderToReplicate || headers[0] || 'العمود A';
                if (onReplicateLayerAcrossSlots) {
                  onReplicateLayerAcrossSlots(undefined, customPartitionSpan, targetHeader);
                } else if (onAutoPartitionLayers) {
                  onAutoPartitionLayers(selectedElementId || undefined, customPartitionSpan);
                }
              }}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>توليد ({totalSlots}) ليرات منفصلة لعمود [ {selectedHeaderToReplicate || headers[0] || 'العمود A'} ]</span>
            </button>

            <p className="text-[10px] text-slate-500 leading-relaxed bg-white/70 p-1.5 rounded border border-indigo-100">
              💡 <strong>النتيجة:</strong> ينتج {totalSlots} ليرات مستقلة لكل قسم (مثال: سطر 1-20 للقسم 1، سطر 21-40 للقسم 2، ...) مع إمكانية تحريك وتعديل نطاق كل لير بحرية.
            </p>
          </div>
        )}
      </div>

      {/* List of Text Box Layers */}
      {elements.length === 0 ? (
        <div className="bg-white rounded-lg p-6 border border-slate-300 text-center space-y-2 shadow-2xs">
          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500">
            لا توجد عناصر مدرجة. أضف نصاً أو اختر حقلاً من قائمة البيانات.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {elements.map((element, index) => {
            const isExpanded = selectedElementId === element.id;

            return (
              <div
                key={element.id}
                className={`rounded-lg border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-white border-indigo-500 ring-1 ring-indigo-300 shadow-sm'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                {/* Layer Card Header */}
                <div
                  onClick={() => onSelectElement(isExpanded ? null : element.id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer select-none gap-2 bg-slate-50/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 rounded shrink-0 transition ${
                        isExpanded
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {element.type === 'qr_code' ? (
                        <QrCode className="w-3.5 h-3.5" />
                      ) : element.type === 'static_text' ? (
                        <Type className="w-3.5 h-3.5" />
                      ) : (
                        <Database className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-mono">#{index + 1}</span>
                        <h4 className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                          {element.type === 'field'
                            ? `حقل: [ ${element.fieldName || '---'} ]`
                            : element.type === 'static_text'
                            ? element.staticText || 'نص'
                            : `QR: [ ${element.fieldName || '---'} ]`}
                        </h4>

                        {element.targetSlotIndex !== undefined && element.targetSlotIndex !== null && element.targetSlotIndex !== -1 ? (
                          <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 py-0.2 rounded font-bold">
                            قسم #{element.targetSlotIndex + 1}
                          </span>
                        ) : null}

                        {element.customRowConfig?.enabled && (
                          <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-300 px-1 py-0.2 rounded font-mono font-bold">
                            سطر {element.customRowConfig.startRow || 1}-{element.customRowConfig.endRow || 20}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {element.style.fontFamily || 'Cairo'} • {element.style.fontSize}px
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {onReplicateLayerAcrossSlots && (
                      <button
                        type="button"
                        onClick={() => onReplicateLayerAcrossSlots(element.id, customPartitionSpan, element.fieldName)}
                        className="p-1 rounded bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-indigo-600 transition"
                        title={`تكرار هذا اللير كـ ${totalSlots} ليرات منفصلة لجميع الأقسام`}
                      >
                        <Split className="w-3 h-3" />
                      </button>
                    )}
                    {onDuplicateElement && (
                      <button
                        type="button"
                        onClick={() => onDuplicateElement(element.id)}
                        className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 transition"
                        title="تكرار بسيط"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onChangeElementProp(element.id, { visible: !element.visible })}
                      className={`p-1 rounded border transition ${
                        element.visible
                          ? 'bg-white border-slate-300 text-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                      title={element.visible ? 'إخفاء' : 'إظهار'}
                    >
                      {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteElement(element.id)}
                      className="p-1 rounded bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectElement(isExpanded ? null : element.id)}
                      className={`p-1 rounded border transition ${
                        isExpanded
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-white border-slate-300 text-slate-700'
                      }`}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Inline Font & Effects Panel */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-200 space-y-3 bg-white">
                    <SingleElementControls
                      element={element}
                      onChangeElementStyle={onChangeElementStyle}
                      onChangeElementProp={onChangeElementProp}
                      onDuplicateElement={onDuplicateElement}
                      onHoverPreviewFont={onHoverPreviewFont}
                      fontList={fontList}
                      handleQueryWindowsFonts={handleQueryWindowsFonts}
                      handleFileUpload={handleFileUpload}
                      isLoadingFonts={isLoadingFonts}
                      fontStatus={fontStatus}
                      headers={headers}
                      totalSlotsCount={totalSlots}
                      totalRecordsCount={totalRecordsCount}
                      onReplicateLayerAcrossSlots={onReplicateLayerAcrossSlots}
                    />

                    <div className="pt-2 border-t border-slate-200 flex justify-center">
                      <button
                        type="button"
                        onClick={() => onSelectElement(null)}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-bold flex items-center justify-center gap-1 transition"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        إغلاق الخصائص
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* Component for Single Element Style & Property Controls */
interface SingleElementControlsProps {
  element: FieldElement;
  onChangeElementStyle: (elementId: string, updatedStyle: TextEffect) => void;
  onChangeElementProp: (elementId: string, updates: Partial<FieldElement>) => void;
  onDuplicateElement?: (elementId: string) => void;
  onHoverPreviewFont?: (fontValue: string | null) => void;
  fontList: FontOption[];
  handleQueryWindowsFonts: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingFonts: boolean;
  fontStatus: string;
  headers: string[];
  totalSlotsCount?: number;
  totalRecordsCount?: number;
  onReplicateLayerAcrossSlots?: (sourceElementId?: string, spanPerSlot?: number, targetFieldName?: string) => void;
}

const SingleElementControls: React.FC<SingleElementControlsProps> = ({
  element,
  onChangeElementStyle,
  onChangeElementProp,
  onHoverPreviewFont,
  fontList,
  handleQueryWindowsFonts,
  handleFileUpload,
  isLoadingFonts,
  fontStatus,
  headers,
  totalSlotsCount = 4,
  totalRecordsCount = 200,
  onReplicateLayerAcrossSlots,
}) => {
  const [presetCategory, setPresetCategory] = useState<string>('Lighting Pack 03');
  const style = element.style;

  const updateStyle = (updates: Partial<TextEffect>) => {
    onChangeElementStyle(element.id, {
      ...style,
      ...updates,
    });
  };

  const applyPresetRange = (start: number, end: number, slotIdx?: number) => {
    onChangeElementProp(element.id, {
      customRowConfig: {
        enabled: true,
        mode: 'range',
        startRow: start,
        endRow: end,
        fixedRow: element.customRowConfig?.fixedRow || 1,
        offset: element.customRowConfig?.offset || 0,
      },
      targetSlotIndex: slotIdx !== undefined ? slotIdx : element.targetSlotIndex,
    });
  };

  return (
    <div className="space-y-3.5 text-xs text-slate-800">
      {/* Element Type & Data Mapping */}
      <div className="bg-slate-50 p-2.5 rounded border border-slate-300 space-y-2">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">نوع المربع:</label>
          <div className="grid grid-cols-3 gap-1 bg-white p-0.5 rounded border border-slate-300 font-bold text-xs">
            <button
              type="button"
              onClick={() => onChangeElementProp(element.id, { type: 'field' })}
              className={`py-1 rounded transition ${
                element.type === 'field' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              حقل إكسل
            </button>
            <button
              type="button"
              onClick={() => onChangeElementProp(element.id, { type: 'static_text' })}
              className={`py-1 rounded transition ${
                element.type === 'static_text' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              نص ثابت
            </button>
            <button
              type="button"
              onClick={() => onChangeElementProp(element.id, { type: 'qr_code' })}
              className={`py-1 rounded transition ${
                element.type === 'qr_code' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كود QR
            </button>
          </div>
        </div>

        {/* Dynamic Field Selector */}
        {(element.type === 'field' || element.type === 'qr_code') && (
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">عامود الإكسل:</label>
            <select
              value={element.fieldName || ''}
              onChange={(e) => onChangeElementProp(element.id, { fieldName: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-bold focus:border-indigo-500"
            >
              {headers.length === 0 ? (
                <option value="">لا توجد أعمدة</option>
              ) : (
                headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Static Text Input */}
        {element.type === 'static_text' && (
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">النص:</label>
            <input
              type="text"
              value={element.staticText || ''}
              onChange={(e) => onChangeElementProp(element.id, { staticText: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-bold focus:border-indigo-500"
              placeholder="أدخل النص..."
            />
          </div>
        )}

        {/* Prefix & Suffix */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">سابقة (Prefix)</label>
            <input
              type="text"
              placeholder="مثال: السيد/ "
              value={element.prefix || ''}
              onChange={(e) => onChangeElementProp(element.id, { prefix: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">لاحقة (Suffix)</label>
            <input
              type="text"
              placeholder="مثال: المحترم"
              value={element.suffix || ''}
              onChange={(e) => onChangeElementProp(element.id, { suffix: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
            />
          </div>
        </div>

        {/* Per-Element Custom Row Selection & Target Slot */}
        {(element.type === 'field' || element.type === 'qr_code') && (
          <div className="bg-white p-2.5 rounded border border-slate-300 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
                توزيع الصفوف للقسم
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-[10px] text-slate-600">تفعيل</span>
                <input
                  type="checkbox"
                  checked={element.customRowConfig?.enabled || false}
                  onChange={(e) =>
                    onChangeElementProp(element.id, {
                      customRowConfig: {
                        enabled: e.target.checked,
                        mode: element.customRowConfig?.mode || 'range',
                        startRow: element.customRowConfig?.startRow || 1,
                        endRow: element.customRowConfig?.endRow || 20,
                        fixedRow: element.customRowConfig?.fixedRow || 1,
                        offset: element.customRowConfig?.offset || 0,
                      },
                    })
                  }
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
              </label>
            </div>

            {/* Target Slot on Sheet Selection */}
            <div className="space-y-1 pt-1 border-t border-slate-200">
              <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                <Grid className="w-2.5 h-2.5" />
                الظهور على القسم:
              </label>
              <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => onChangeElementProp(element.id, { targetSlotIndex: null })}
                  className={`py-0.5 px-2 rounded border transition ${
                    element.targetSlotIndex === null || element.targetSlotIndex === undefined || element.targetSlotIndex === -1
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الكل
                </button>
                {Array.from({ length: totalSlotsCount }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChangeElementProp(element.id, { targetSlotIndex: idx })}
                    className={`py-0.5 px-2 rounded border transition ${
                      element.targetSlotIndex === idx
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    قسم #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {element.customRowConfig?.enabled && (
              <div className="space-y-2 pt-1.5 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-bold">من سطر:</label>
                    <input
                      type="number"
                      min="1"
                      max={totalRecordsCount}
                      value={element.customRowConfig.startRow ?? 1}
                      onChange={(e) =>
                        onChangeElementProp(element.id, {
                          customRowConfig: {
                            ...element.customRowConfig!,
                            startRow: Math.max(1, Number(e.target.value) || 1),
                          },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-800 font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5 font-bold">إلى سطر:</label>
                    <input
                      type="number"
                      min="1"
                      max={totalRecordsCount}
                      value={element.customRowConfig.endRow ?? 20}
                      onChange={(e) =>
                        onChangeElementProp(element.id, {
                          customRowConfig: {
                            ...element.customRowConfig!,
                            endRow: Math.max(1, Number(e.target.value) || 1),
                          },
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-800 font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px] font-bold">
                  {Array.from({ length: totalSlotsCount }).map((_, slotI) => {
                    const s = slotI * 20 + 1;
                    const e = (slotI + 1) * 20;
                    return (
                      <button
                        key={slotI}
                        type="button"
                        onClick={() => applyPresetRange(s, e, slotI)}
                        className="py-0.5 px-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 transition"
                      >
                        {s}-{e} (ق{slotI + 1})
                      </button>
                    );
                  })}
                </div>

                {onReplicateLayerAcrossSlots && (
                  <button
                    type="button"
                    onClick={() => onReplicateLayerAcrossSlots(element.id, (element.customRowConfig?.endRow && element.customRowConfig?.startRow) ? Math.max(1, element.customRowConfig.endRow - element.customRowConfig.startRow + 1) : 20, element.fieldName)}
                    className="w-full mt-1.5 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>تكرار هذا اللير كـ {totalSlotsCount} ليرات منفصلة لجميع الأقسام</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Position, Movement & Alignment Section */}
      <div className="bg-slate-50 p-2.5 rounded border border-slate-300 space-y-2.5">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1">
            <Move className="w-3.5 h-3.5 text-indigo-600" />
            الموقع والتحريك الحر
          </h5>
          <span className="text-[10px] font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold">
            X: {element.xPercent}% | Y: {element.yPercent}%
          </span>
        </div>

        {/* X & Y Direct Control Sliders */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-2 rounded border border-slate-300">
            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
              <span>أفقي (X):</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={element.xPercent}
                onChange={(e) =>
                  onChangeElementProp(element.id, {
                    xPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  })
                }
                className="w-11 bg-slate-50 border border-slate-300 rounded px-1 text-center text-xs font-mono font-bold text-slate-800 focus:outline-none"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={element.xPercent}
              onChange={(e) => onChangeElementProp(element.id, { xPercent: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="bg-white p-2 rounded border border-slate-300">
            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
              <span>عمودي (Y):</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={element.yPercent}
                onChange={(e) =>
                  onChangeElementProp(element.id, {
                    yPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  })
                }
                className="w-11 bg-slate-50 border border-slate-300 rounded px-1 text-center text-xs font-mono font-bold text-slate-800 focus:outline-none"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={element.yPercent}
              onChange={(e) => onChangeElementProp(element.id, { yPercent: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Nudge D-Pad & Alignment Shortcuts */}
        <div className="grid grid-cols-2 gap-2 items-center pt-0.5">
          {/* D-Pad Buttons for precision nudge */}
          <div className="bg-white p-1.5 rounded border border-slate-300 flex flex-col items-center gap-1">
            <span className="text-[9px] text-slate-500 font-bold">أزرار الإزاحة:</span>
            <button
              type="button"
              onClick={() =>
                onChangeElementProp(element.id, {
                  yPercent: Math.max(0, Number((element.yPercent - 1).toFixed(1))),
                })
              }
              className="p-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded border border-slate-300 transition"
              title="أعلى"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onChangeElementProp(element.id, {
                    xPercent: Math.max(0, Number((element.xPercent - 1).toFixed(1))),
                  })
                }
                className="p-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded border border-slate-300 transition"
                title="يسار"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeElementProp(element.id, {
                    xPercent: 50,
                    yPercent: 50,
                  })
                }
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 text-[9px] font-bold rounded border border-slate-300"
                title="توسيط"
              >
                توسيط
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeElementProp(element.id, {
                    xPercent: Math.min(100, Number((element.xPercent + 1).toFixed(1))),
                  })
                }
                className="p-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded border border-slate-300 transition"
                title="يمين"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                onChangeElementProp(element.id, {
                  yPercent: Math.min(100, Number((element.yPercent + 1).toFixed(1))),
                })
              }
              className="p-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded border border-slate-300 transition"
              title="أسفل"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Position Anchors */}
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 font-bold block">محاذاة سريعة:</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => onChangeElementProp(element.id, { xPercent: 50 })}
                className="py-1 px-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-bold text-center"
              >
                توسيط X
              </button>
              <button
                type="button"
                onClick={() => onChangeElementProp(element.id, { yPercent: 50 })}
                className="py-1 px-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 font-bold text-center"
              >
                توسيط Y
              </button>
              <button
                type="button"
                onClick={() => onChangeElementProp(element.id, { xPercent: 10, yPercent: 10 })}
                className="py-1 px-1 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-300 text-center"
              >
                أعلى يسار
              </button>
              <button
                type="button"
                onClick={() => onChangeElementProp(element.id, { xPercent: 90, yPercent: 10 })}
                className="py-1 px-1 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-300 text-center"
              >
                أعلى يمين
              </button>
            </div>
          </div>
        </div>

        {/* Rotation Controls */}
        <div className="bg-white p-2 rounded border border-slate-300 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <RotateCw className="w-3 h-3 text-indigo-600" />
              تدوير (Rotation):
            </span>
            <span className="font-mono text-indigo-700 font-bold">{style.rotation || 0}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={style.rotation || 0}
            onChange={(e) => updateStyle({ rotation: Number(e.target.value) })}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between gap-1 text-[9px] font-mono">
            {[0, 90, 180, 270, -90].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => updateStyle({ rotation: deg })}
                className={`flex-1 py-0.5 rounded border transition ${
                  (style.rotation || 0) === deg
                    ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                    : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography Section */}
      <div className="bg-slate-50 p-2.5 rounded border border-slate-300 space-y-2.5">
        <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1">
          <Type className="w-3.5 h-3.5 text-indigo-600" />
          الخط والطباعة
        </h5>

        <div className="space-y-2">
          <SearchableFontPicker
            value={style.fontFamily || 'Cairo'}
            onChange={(fontVal) => updateStyle({ fontFamily: fontVal })}
            onHoverPreview={onHoverPreviewFont}
            fontList={fontList}
            onQueryWindowsFonts={handleQueryWindowsFonts}
            onUploadFontFile={handleFileUpload}
            isLoadingFonts={isLoadingFonts}
            fontStatus={fontStatus}
          />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500 shrink-0">اسم الخط:</span>
            <input
              type="text"
              placeholder="مثال: Traditional Arabic"
              value={style.fontFamily || ''}
              onChange={(e) => updateStyle({ fontFamily: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={handleQueryWindowsFonts}
              disabled={isLoadingFonts}
              className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded text-[11px] font-bold border border-slate-300 flex items-center justify-center gap-1 transition"
            >
              <Monitor className="w-3 h-3 text-indigo-600" />
              جلب خطوط ويندوز
            </button>

            <label className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded text-[11px] font-bold border border-slate-300 flex items-center justify-center gap-1 cursor-pointer transition">
              <Upload className="w-3 h-3 text-emerald-600" />
              <span>رفع خط من الجهاز</span>
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Font Size & Weight */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
              <span>الحجم:</span>
              <span className="font-mono text-indigo-700 font-bold">{style.fontSize}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={style.fontSize}
              onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">سمك الخط</label>
            <select
              value={style.fontWeight}
              onChange={(e) => updateStyle({ fontWeight: e.target.value as any })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-medium"
            >
              <option value="300">خفيف (300)</option>
              <option value="400">عادي (400)</option>
              <option value="600">متوسط (600)</option>
              <option value="700">عريض (700 Bold)</option>
              <option value="900">عريض جداً (900)</option>
            </select>
          </div>
        </div>

        {/* Align & Color Row */}
        <div className="grid grid-cols-2 gap-2 items-center">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">المحاذاة</label>
            <div className="flex bg-white p-0.5 rounded border border-slate-300 justify-around">
              <button
                type="button"
                onClick={() => updateStyle({ textAlign: 'right' })}
                className={`p-1 rounded transition ${
                  style.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle({ textAlign: 'center' })}
                className={`p-1 rounded transition ${
                  style.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle({ textAlign: 'left' })}
                className={`p-1 rounded transition ${
                  style.textAlign === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">لون النص</label>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded border border-slate-300">
              <input
                type="color"
                value={style.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-[10px] text-slate-700 uppercase">{style.color}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canva Effects Module */}
      <CanvaEffectsModule style={style} updateStyle={updateStyle} />

      {/* Text Effects Section */}
      <div className="bg-slate-50 p-2.5 rounded border border-slate-300 space-y-2.5">
        <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          تأثيرات النص والحدود
        </h5>

        {/* Presets Gallery */}
        <div className="space-y-1.5 bg-white p-2 rounded border border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 block">نماذج جاهزة:</span>
            <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {TEXT_PRESETS.length} تأثير
            </span>
          </div>

          <div className="flex gap-1 text-[9px] overflow-x-auto pb-0.5">
            {['Lighting Pack 03', 'كانفا', 'فاخر', 'الكل'].map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setPresetCategory(cat)}
                className={`px-2 py-0.5 rounded font-bold shrink-0 transition ${
                  presetCategory === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto p-0.5">
            {TEXT_PRESETS.filter((p) => presetCategory === 'الكل' || p.category === presetCategory).map((p) => (
              <button
                type="button"
                key={p.id}
                title={p.description}
                onClick={() => {
                  updateStyle({
                    ...p.effect,
                    stroke: p.effect.stroke ? { ...style.stroke, ...p.effect.stroke } : style.stroke,
                    shadow: p.effect.shadow ? { ...style.shadow, ...p.effect.shadow } : style.shadow,
                    bg: p.effect.bg ? { ...style.bg, ...p.effect.bg } : style.bg,
                  });
                }}
                className="text-right p-1.5 rounded border border-slate-200 hover:border-indigo-400 bg-slate-50 transition"
              >
                <span className="text-[10px] font-bold text-slate-800 block truncate">
                  {p.name}
                </span>
                <span className="text-[9px] text-slate-500 block truncate">
                  {p.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stroke / Outline */}
        <div className="bg-white p-2 rounded border border-slate-300 space-y-1.5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] font-bold text-slate-700">حدود النص (Stroke)</span>
            <input
              type="checkbox"
              checked={style.stroke?.enabled || false}
              onChange={(e) =>
                updateStyle({
                  stroke: {
                    enabled: e.target.checked,
                    color: style.stroke?.color || '#000000',
                    width: style.stroke?.width ?? 2,
                    align: style.stroke?.align || 'outside',
                  },
                })
              }
              className="w-3.5 h-3.5 text-indigo-600 rounded"
            />
          </label>

          {style.stroke?.enabled && (
            <div className="space-y-1.5 pt-1 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">اللون</span>
                  <input
                    type="color"
                    value={style.stroke.color || '#000000'}
                    onChange={(e) => updateStyle({ stroke: { ...style.stroke, color: e.target.value } })}
                    className="w-full h-5 rounded cursor-pointer bg-transparent border-0"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                    <span>السمك:</span>
                    <span className="font-mono text-indigo-700 font-bold">{style.stroke.width || 1}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={style.stroke.width || 1}
                    onChange={(e) => updateStyle({ stroke: { ...style.stroke, width: Number(e.target.value) } })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Shadow */}
        <div className="bg-white p-2 rounded border border-slate-300 space-y-1.5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] font-bold text-slate-700">ظل النص (Shadow)</span>
            <input
              type="checkbox"
              checked={style.shadow?.enabled || false}
              onChange={(e) =>
                updateStyle({
                  shadow: {
                    enabled: e.target.checked,
                    color: style.shadow?.color || '#000000',
                    opacity: style.shadow?.opacity ?? 0.6,
                    offsetX: style.shadow?.offsetX ?? 3,
                    offsetY: style.shadow?.offsetY ?? 3,
                    blur: style.shadow?.blur ?? 4,
                    angle: style.shadow?.angle ?? 135,
                    distance: style.shadow?.distance ?? 4,
                  },
                })
              }
              className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
            />
          </label>

          {style.shadow?.enabled && (
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">لون الظل</span>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded border border-slate-200">
                    <input
                      type="color"
                      value={style.shadow.color?.startsWith('#') ? style.shadow.color : '#000000'}
                      onChange={(e) => updateStyle({ shadow: { ...style.shadow, color: e.target.value } })}
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <span className="font-mono text-[10px] text-slate-700 uppercase truncate">
                      {style.shadow.color?.startsWith('#') ? style.shadow.color : '#000000'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                    <span>الشفافية:</span>
                    <span className="font-mono text-indigo-700 font-bold">
                      {Math.round((style.shadow.opacity ?? 0.6) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={style.shadow.opacity ?? 0.6}
                    onChange={(e) =>
                      updateStyle({
                        shadow: {
                          ...style.shadow,
                          opacity: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                    <span>الزاوية:</span>
                    <span className="font-mono text-indigo-700 font-bold">{style.shadow.angle ?? 135}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={style.shadow.angle ?? 135}
                    onChange={(e) =>
                      updateStyle({
                        shadow: {
                          ...style.shadow,
                          angle: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-0.5">
                    <span>المسافة:</span>
                    <span className="font-mono text-indigo-700 font-bold">{style.shadow.distance ?? 4}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={style.shadow.distance ?? 4}
                    onChange={(e) =>
                      updateStyle({
                        shadow: {
                          ...style.shadow,
                          distance: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Box Fill */}
        <div className="bg-white p-2 rounded border border-slate-300 space-y-1.5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] font-bold text-slate-700">خلفية الصندوق (Fill)</span>
            <input
              type="checkbox"
              checked={style.bg?.enabled || false}
              onChange={(e) =>
                updateStyle({
                  bg: {
                    enabled: e.target.checked,
                    color: style.bg?.color || '#ffffff',
                    padding: style.bg?.padding ?? 4,
                    borderRadius: style.bg?.borderRadius ?? 4,
                  },
                })
              }
              className="w-3.5 h-3.5 text-indigo-600 rounded"
            />
          </label>

          {style.bg?.enabled && (
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">لون الخلفية</span>
                <input
                  type="color"
                  value={style.bg.color || '#ffffff'}
                  onChange={(e) => updateStyle({ bg: { ...style.bg, color: e.target.value } })}
                  className="w-full h-5 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5">تدوير الزوايا</span>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={style.bg.borderRadius}
                  onChange={(e) => updateStyle({ bg: { ...style.bg, borderRadius: Number(e.target.value) } })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-slate-800 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
