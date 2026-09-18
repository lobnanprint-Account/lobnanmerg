import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, X } from 'lucide-react';
import { DataRow, FieldElement, GridSetup, PaperOrientation, PaperSize } from '../types';
import { getElementTextValue, getRowForElement, getShadowRgba, getSlotConfig, REFERENCE_CARD_WIDTH } from '../utils/elementUtils';
import { QrCode } from 'lucide-react';

interface PreviewSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  orientation: PaperOrientation;
  paperSize: PaperSize;
  paperWidthMm: number;
  paperHeightMm: number;
  grid: GridSetup;
  bgImageUrl: string;
  elements: FieldElement[];
  dataRows: DataRow[];
  activeRecordIndex?: number;
  onTriggerPdfExport: () => void;
}

export const PreviewSheetModal: React.FC<PreviewSheetModalProps> = ({
  isOpen,
  onClose,
  orientation,
  paperSize,
  paperWidthMm,
  paperHeightMm,
  grid,
  bgImageUrl,
  elements,
  dataRows,
  activeRecordIndex = 0,
  onTriggerPdfExport,
}) => {
  const [sheetPageIndex, setSheetPageIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState<number>(600);
  const firstCardRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = grid.rows * grid.cols;

  useEffect(() => {
    if (isOpen) {
      const initialPage = Math.floor((activeRecordIndex || 0) / itemsPerPage);
      setSheetPageIndex(initialPage);
    }
  }, [isOpen, activeRecordIndex, itemsPerPage]);

  useLayoutEffect(() => {
    if (!isOpen || !firstCardRef.current) return;
    const updateSize = () => {
      if (firstCardRef.current) {
        setCardWidth(firstCardRef.current.clientWidth);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(firstCardRef.current);
    return () => observer.disconnect();
  }, [isOpen, grid, orientation]);

  if (!isOpen) return null;

  const fontScale = (cardWidth || 600) / REFERENCE_CARD_WIDTH;

  const actualPaperWidthMm =
    orientation === 'landscape' ? Math.max(paperWidthMm, paperHeightMm) : Math.min(paperWidthMm, paperHeightMm);
  const actualPaperHeightMm =
    orientation === 'landscape' ? Math.min(paperWidthMm, paperHeightMm) : Math.max(paperWidthMm, paperHeightMm);
  const sheetAspectRatio = actualPaperWidthMm / actualPaperHeightMm;

  const rangeSpans = elements
    .filter((e) => e.customRowConfig?.enabled && e.customRowConfig.mode === 'range')
    .map((e) => Math.max(1, (e.customRowConfig!.endRow || 20) - (e.customRowConfig!.startRow || 1) + 1));

  const hasSlotCustomRanges =
    grid.slotsConfig &&
    Object.values(grid.slotsConfig).some((s: any) => s?.customRange?.enabled);

  let totalPages = Math.ceil(Math.max(1, dataRows.length) / itemsPerPage);
  if (hasSlotCustomRanges) {
    const slotSpans = Object.values(grid.slotsConfig || {})
      .filter((s: any) => s?.customRange?.enabled)
      .map((s: any) => Math.max(1, (s.customRange!.endRow || 20) - (s.customRange!.startRow || 1) + 1));
    if (slotSpans.length > 0) {
      totalPages = Math.max(...slotSpans);
    }
  } else if (rangeSpans.length > 0) {
    totalPages = Math.max(...rangeSpans);
  }

  const startIdx = sheetPageIndex * itemsPerPage;
  const currentSheetRows = Array.from({ length: itemsPerPage }).map((_, i) => {
    return dataRows[startIdx + i] || dataRows[0] || ({} as DataRow);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      <div className="bg-white border border-slate-300 rounded-lg w-full max-w-4xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">معاينة ورقة الطباعة (Sheet Preview)</h3>
              <p className="text-[11px] text-slate-500">
                {paperSize} ({orientation === 'landscape' ? 'عرضي' : 'طولي'}) — {grid.rows} صفوف × {grid.cols} أعمدة ({itemsPerPage} نسخة بالورقة)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Controls & Sheet Pagination */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">صفحة الطباعة:</span>
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5 font-mono">
              <button
                type="button"
                disabled={sheetPageIndex <= 0}
                onClick={() => setSheetPageIndex((p) => Math.max(0, p - 1))}
                className="p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-slate-900">
                {sheetPageIndex + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={sheetPageIndex >= totalPages - 1}
                onClick={() => setSheetPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-30 rounded"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onTriggerPdfExport();
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            طباعة وتصدير PDF
          </button>
        </div>

        {/* Paper Sheet Rendering Stage */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto bg-slate-100 flex items-center justify-center">
          <div
            style={{
              aspectRatio: `${sheetAspectRatio}`,
              maxHeight: '62vh',
              width: orientation === 'landscape' ? '85%' : '60%',
              paddingTop: `${(grid.marginTopMm / actualPaperHeightMm) * 100}%`,
              paddingBottom: `${(grid.marginBottomMm / actualPaperHeightMm) * 100}%`,
              paddingLeft: `${(grid.marginLeftMm / actualPaperWidthMm) * 100}%`,
              paddingRight: `${(grid.marginRightMm / actualPaperWidthMm) * 100}%`,
            }}
            className="bg-white shadow-xl rounded-sm border border-slate-300 relative overflow-hidden transition-all"
          >
            {/* Grid Container */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
                columnGap: `${grid.gapHorizontalMm}mm`,
                rowGap: `${grid.gapVerticalMm}mm`,
                width: '100%',
                height: '100%',
              }}
            >
              {currentSheetRows.map((row, idx) => {
                const isFirst = idx === 0;
                const slotCfg = getSlotConfig(grid, idx);
                const cardOrPageIndex = hasSlotCustomRanges || rangeSpans.length > 0
                  ? sheetPageIndex
                  : (sheetPageIndex * itemsPerPage + idx);

                if (!slotCfg.enabled) {
                  return (
                    <div
                      key={row._id || idx}
                      ref={isFirst ? firstCardRef : null}
                      className="relative bg-slate-100 border border-dashed border-slate-300 overflow-hidden flex items-center justify-center opacity-40"
                    >
                      <span className="text-[10px] font-mono text-slate-400">قسم مخفي #{idx + 1}</span>
                    </div>
                  );
                }

                const slotTransform = `rotate(${slotCfg.rotation}deg) scale(${slotCfg.scale}) translate(${slotCfg.offsetX}mm, ${slotCfg.offsetY}mm)`;

                return (
                  <div
                    key={row._id || idx}
                    ref={isFirst ? firstCardRef : null}
                    style={{
                      transform: slotTransform,
                      transformOrigin: 'center center',
                    }}
                    className="relative bg-white border border-slate-200 overflow-hidden shadow-2xs flex items-center justify-center"
                  >
                    {/* Item card background */}
                    {bgImageUrl && (
                      <img src={bgImageUrl} alt="قالب" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
                    )}

                    {/* Item card elements */}
                    {elements.map((el) => {
                      if (!el.visible) return null;

                      if (
                        el.targetSlotIndex !== undefined &&
                        el.targetSlotIndex !== null &&
                        el.targetSlotIndex !== -1 &&
                        el.targetSlotIndex !== idx
                      ) {
                        return null;
                      }

                      const style = el.style;

                      if (el.type === 'qr_code') {
                        const targetRow = getRowForElement(el, dataRows, cardOrPageIndex, slotCfg);
                        const qrVal = targetRow && el.fieldName ? String(targetRow[el.fieldName] || 'QR') : 'QR';
                        return (
                          <div
                            key={el.id}
                            style={{
                              left: `${el.xPercent}%`,
                              top: `${el.yPercent}%`,
                              transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
                              opacity: style.opacity ?? 1,
                            }}
                            className="absolute bg-white border border-slate-300 rounded p-1 flex flex-col items-center justify-center shadow-2xs"
                          >
                            <QrCode className="w-8 h-8 text-slate-800" />
                            <span className="text-[7px] font-mono text-slate-600 truncate max-w-[50px]">{qrVal}</span>
                          </div>
                        );
                      }

                      const textVal =
                        getElementTextValue(el, dataRows, cardOrPageIndex, slotCfg) || el.label || `[${el.fieldName || 'مربع نص'}]`;

                      const renderedFontSize = Math.max(6, style.fontSize * fontScale);
                      const rawStrokeWidth = style.stroke?.width || 1;
                      const renderedStrokeWidth = rawStrokeWidth * fontScale;
                      const strokeColor = style.stroke?.color || '#000000';
                      const hasStroke = style.stroke?.enabled && renderedStrokeWidth > 0;

                      let baseDistance = style.shadow?.distance ?? 4;
                      if (hasStroke && (style.shadow?.extendBeyondStroke ?? true)) {
                        baseDistance += rawStrokeWidth + (style.shadow?.extraOffsetPx || 0);
                      }

                      let shadowX = (style.shadow?.offsetX ?? 2) * fontScale;
                      let shadowY = (style.shadow?.offsetY ?? 2) * fontScale;
                      if (style.shadow?.enabled && style.shadow.angle !== undefined) {
                        const rad = (style.shadow.angle * Math.PI) / 180;
                        shadowX = Math.cos(rad) * baseDistance * fontScale;
                        shadowY = Math.sin(rad) * baseDistance * fontScale;
                      }
                      const shadowBlur = (style.shadow?.blur ?? 4) * fontScale;
                      const shadowColorRgba = getShadowRgba(style.shadow?.color || '#000000', style.shadow?.opacity ?? 0.6);

                      const textShadowStyle = style.shadow?.enabled
                        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColorRgba}`
                        : 'none';

                      const strokeStyle = hasStroke
                        ? `${Math.max(1, Math.round(renderedStrokeWidth))}px ${strokeColor}`
                        : undefined;

                      return (
                        <div
                          key={el.id}
                          style={{
                            left: `${el.xPercent}%`,
                            top: `${el.yPercent}%`,
                            transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
                            fontFamily: style.fontFamily || 'Cairo',
                            fontSize: `${renderedFontSize}px`,
                            fontWeight: style.fontWeight || 'normal',
                            color: style.color || '#000000',
                            textAlign: style.textAlign || 'right',
                            textShadow: textShadowStyle,
                            WebkitTextStroke: strokeStyle,
                            backgroundColor: style.bg?.enabled ? style.bg.color : undefined,
                            padding: style.bg?.enabled ? `${(style.bg.padding || 4) * fontScale}px` : undefined,
                            borderRadius: style.bg?.enabled ? `${(style.bg.borderRadius || 4) * fontScale}px` : undefined,
                            opacity: style.opacity ?? 1,
                          }}
                          className="absolute whitespace-nowrap leading-tight pointer-events-none"
                        >
                          {textVal}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
