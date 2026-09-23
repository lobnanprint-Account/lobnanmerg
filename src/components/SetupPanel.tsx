import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  FolderOpen,
  Grid,
  Image as ImageIcon,
  Layers,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Save,
  Sliders,
  Sparkles,
  Split,
  Trash2,
  Upload,
} from 'lucide-react';
import { GridSetup, GridSlotConfig, PaperDimensions, PaperOrientation, PaperSize } from '../types';
import { getSlotConfig } from '../utils/elementUtils';

interface SetupPanelProps {
  orientation: PaperOrientation;
  onChangeOrientation: (orientation: PaperOrientation) => void;
  paperSize: PaperSize;
  onChangePaperSize: (size: PaperSize) => void;
  paperDimensions: PaperDimensions;
  onChangePaperDimensions: (dims: PaperDimensions) => void;
  grid: GridSetup;
  onChangeGrid: (grid: GridSetup) => void;
  bgImageUrl: string;
  onChangeBgImage: (url: string) => void;
  onResetLayout: () => void;
  onExportProject?: () => void;
  onTriggerImportProject?: () => void;
  totalRecordsCount?: number;
}

const PREDEFINED_SIZES: Record<Exclude<PaperSize, 'Custom'>, PaperDimensions> = {
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  A5: { widthMm: 148, heightMm: 210 },
  Letter: { widthMm: 216, heightMm: 279 },
  Legal: { widthMm: 216, heightMm: 356 },
};

export const SetupPanel: React.FC<SetupPanelProps> = ({
  orientation,
  onChangeOrientation,
  paperSize,
  onChangePaperSize,
  paperDimensions,
  onChangePaperDimensions,
  grid,
  onChangeGrid,
  bgImageUrl,
  onChangeBgImage,
  onResetLayout,
  onExportProject,
  onTriggerImportProject,
  totalRecordsCount = 80,
}) => {
  // Compute paper width & height considering orientation
  const actualPaperWidthMm =
    orientation === 'landscape'
      ? Math.max(paperDimensions.widthMm, paperDimensions.heightMm)
      : Math.min(paperDimensions.widthMm, paperDimensions.heightMm);

  const actualPaperHeightMm =
    orientation === 'landscape'
      ? Math.min(paperDimensions.widthMm, paperDimensions.heightMm)
      : Math.max(paperDimensions.widthMm, paperDimensions.heightMm);

  // Compute Printable area & single item dimensions
  const printableWidthMm =
    actualPaperWidthMm - grid.marginLeftMm - grid.marginRightMm - (grid.cols - 1) * grid.gapHorizontalMm;
  const printableHeightMm =
    actualPaperHeightMm - grid.marginTopMm - grid.marginBottomMm - (grid.rows - 1) * grid.gapVerticalMm;

  const itemWidthMm = Math.max(5, (printableWidthMm / grid.cols).toFixed(1) as any);
  const itemHeightMm = Math.max(5, (printableHeightMm / grid.rows).toFixed(1) as any);
  const totalPerSheet = grid.rows * grid.cols;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChangeBgImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrientationChange = (newOrientation: PaperOrientation) => {
    onChangeOrientation(newOrientation);
    const w =
      newOrientation === 'landscape'
        ? Math.max(paperDimensions.widthMm, paperDimensions.heightMm)
        : Math.min(paperDimensions.widthMm, paperDimensions.heightMm);
    const h =
      newOrientation === 'landscape'
        ? Math.min(paperDimensions.widthMm, paperDimensions.heightMm)
        : Math.max(paperDimensions.widthMm, paperDimensions.heightMm);
    onChangePaperDimensions({ widthMm: w, heightMm: h });
  };

  const handleSelectPaperSize = (size: PaperSize) => {
    onChangePaperSize(size);
    if (size !== 'Custom') {
      const base = PREDEFINED_SIZES[size];
      const w =
        orientation === 'landscape'
          ? Math.max(base.widthMm, base.heightMm)
          : Math.min(base.widthMm, base.heightMm);
      const h =
        orientation === 'landscape'
          ? Math.min(base.widthMm, base.heightMm)
          : Math.max(base.widthMm, base.heightMm);
      onChangePaperDimensions({ widthMm: w, heightMm: h });
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. Background Template Image */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            1. صورة الخلفية / القالب
          </h3>
          <div className="flex items-center gap-1.5">
            {bgImageUrl && (
              <button
                type="button"
                onClick={() => onChangeBgImage('')}
                className="cursor-pointer text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded font-medium flex items-center gap-1 transition border border-rose-200"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                حذف الصورة
              </button>
            )}
            <label className="cursor-pointer text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded font-medium flex items-center gap-1 transition shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              {bgImageUrl ? 'استبدال' : 'رفع خلفية'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Image Preview */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded border border-slate-200">
          <div className="w-14 h-11 rounded bg-white overflow-hidden border border-slate-300 flex items-center justify-center shrink-0">
            {bgImageUrl ? (
              <img src={bgImageUrl} alt="قالب خلفية" className="w-full h-full object-contain" />
            ) : (
              <span className="text-[10px] text-slate-400">لا توجد</span>
            )}
          </div>
          <div className="text-xs">
            <p className="font-semibold text-slate-700 text-[11px]">
              {bgImageUrl ? 'تم تحميل صورة القالب بنجاح' : 'لم يتم تحديد خلفية (مساحة بيضاء فارغة)'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Paper Setup & Orientation */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs space-y-3">
        <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-indigo-600" />
          2. حجم الورقة والاتجاه
        </h3>

        {/* Orientation Toggle */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">اتجاه الورقة:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOrientationChange('landscape')}
              className={`py-1.5 px-2 rounded text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                orientation === 'landscape'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
              عرضي (Landscape)
            </button>
            <button
              type="button"
              onClick={() => handleOrientationChange('portrait')}
              className={`py-1.5 px-2 rounded text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                orientation === 'portrait'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MoveVertical className="w-3.5 h-3.5" />
              طولي (Portrait)
            </button>
          </div>
        </div>

        {/* Paper Size selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">قياس الورقة:</label>
          <div className="flex flex-wrap gap-1">
            {(['A4', 'A3', 'A5', 'Letter', 'Legal', 'Custom'] as PaperSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSelectPaperSize(size)}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                  paperSize === size
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {size === 'Custom' ? 'مخصص' : size}
              </button>
            ))}
          </div>
        </div>

        {/* Custom dimensions if paperSize === 'Custom' */}
        {paperSize === 'Custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5">العرض (مم)</label>
              <input
                type="number"
                min="50"
                max="1000"
                value={paperDimensions.widthMm}
                onChange={(e) =>
                  onChangePaperDimensions({ ...paperDimensions, widthMm: Number(e.target.value) || 210 })
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 block mb-0.5">الارتفاع (مم)</label>
              <input
                type="number"
                min="50"
                max="1000"
                value={paperDimensions.heightMm}
                onChange={(e) =>
                  onChangePaperDimensions({ ...paperDimensions, heightMm: Number(e.target.value) || 297 })
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Grid Division & Multi-Up Copy Count */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-indigo-600" />
            3. تقسيم الورقة (Multi-Up Grid)
          </h3>
          <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded">
            {totalPerSheet} نسخة / ورقة
          </span>
        </div>

        {/* Columns & Rows Grid Controls */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">الأعمدة (Cols)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={grid.cols}
              onChange={(e) => onChangeGrid({ ...grid, cols: Math.max(1, Number(e.target.value) || 1) })}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">الصفوف (Rows)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={grid.rows}
              onChange={(e) => onChangeGrid({ ...grid, rows: Math.max(1, Number(e.target.value) || 1) })}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Margins */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 block">الهوامش الخارجية (مم):</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500">أعلى (Top)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={grid.marginTopMm}
                onChange={(e) => onChangeGrid({ ...grid, marginTopMm: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">أسفل (Bottom)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={grid.marginBottomMm}
                onChange={(e) => onChangeGrid({ ...grid, marginBottomMm: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">يمين (Right)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={grid.marginRightMm}
                onChange={(e) => onChangeGrid({ ...grid, marginRightMm: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">يسار (Left)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={grid.marginLeftMm}
                onChange={(e) => onChangeGrid({ ...grid, marginLeftMm: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Gaps */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 block">المسافة بين النسخ (مم):</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500">أفقية (Horizontal)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={grid.gapHorizontalMm}
                onChange={(e) => onChangeGrid({ ...grid, gapHorizontalMm: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">رأسية (Vertical)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={grid.gapVerticalMm}
                onChange={(e) => onChangeGrid({ ...grid, gapVerticalMm: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Column Numbering Direction (RTL / LTR) */}
        <div className="space-y-1.5 pt-1 border-t border-slate-200">
          <label className="text-[11px] font-semibold text-slate-600 block">ترتيب أقسام الترقيم على الورقة:</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onChangeGrid({ ...grid, direction: 'rtl' })}
              className={`py-1.5 px-2 rounded text-[11px] font-bold border transition ${
                grid.direction !== 'ltr'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              يمين ← يسار (عربي)
            </button>
            <button
              type="button"
              onClick={() => onChangeGrid({ ...grid, direction: 'ltr' })}
              className={`py-1.5 px-2 rounded text-[11px] font-bold border transition ${
                grid.direction === 'ltr'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              يسار ← يمين (إنجليزي)
            </button>
          </div>
        </div>

        {/* Calculated item dimensions box */}
        <div className="bg-slate-50 border border-slate-300 rounded p-2.5 text-xs">
          <div className="flex justify-between items-center font-mono text-slate-700">
            <span>
              عرض النسخة: <strong className="text-indigo-700">{itemWidthMm} مم</strong>
            </span>
            <span>
              ارتفاع النسخة: <strong className="text-indigo-700">{itemHeightMm} مم</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Reset Layout */}
      <button
        type="button"
        onClick={onResetLayout}
        className="w-full py-2 rounded bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-300 transition shadow-2xs"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        إعادة ضبط قياسات الورقة افتراضياً
      </button>
    </div>
  );
};
