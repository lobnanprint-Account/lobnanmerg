import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Bold,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Grid,
  LayoutGrid,
  Plus,
  QrCode,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DataRow, FieldElement, GridSetup, PaperOrientation, PaperSize, TextEffect } from '../types';
import { getElementTextValue, getRowForElement, getShadowRgba, getSlotConfig, REFERENCE_CARD_WIDTH } from '../utils/elementUtils';

interface EditorCanvasProps {
  bgImageUrl: string;
  elements: FieldElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementPosition: (id: string, xPercent: number, yPercent: number) => void;
  onChangeElementStyle?: (elementId: string, updatedStyle: TextEffect) => void;
  onChangeElementProp?: (elementId: string, updates: Partial<FieldElement>) => void;
  onDeleteElement?: (elementId: string) => void;
  onDuplicateElement?: (elementId: string) => void;
  hoverPreviewFont?: string | null;
  dataRows: DataRow[];
  activeRecord: DataRow;
  activeRecordIndex: number;
  totalRecords: number;
  onSelectRecordIndex: (index: number) => void;
  onAddManualTextBox?: () => void;
  paperOrientation: PaperOrientation;
  paperSize: PaperSize;
  paperWidthMm: number;
  paperHeightMm: number;
  grid: GridSetup;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  bgImageUrl,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElementPosition,
  onChangeElementStyle,
  onChangeElementProp,
  onDeleteElement,
  onDuplicateElement,
  hoverPreviewFont,
  dataRows,
  activeRecordIndex,
  totalRecords,
  onSelectRecordIndex,
  onAddManualTextBox,
  paperOrientation,
  paperWidthMm,
  paperHeightMm,
  grid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState<number>(600);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState<number>(100);
  const [canvasViewMode, setCanvasViewMode] = useState<'single_card' | 'full_sheet'>('single_card');

  // Measure rendered card width dynamically to scale fonts proportionally
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setCardWidth(containerRef.current.clientWidth || 600);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canvasViewMode, grid, paperOrientation, paperWidthMm, paperHeightMm]);

  const fontScale = (cardWidth || 600) / REFERENCE_CARD_WIDTH;

  const actualPaperWidthMm =
    paperOrientation === 'landscape' ? Math.max(paperWidthMm, paperHeightMm) : Math.min(paperWidthMm, paperHeightMm);
  const actualPaperHeightMm =
    paperOrientation === 'landscape' ? Math.min(paperWidthMm, paperHeightMm) : Math.max(paperWidthMm, paperHeightMm);
  const sheetAspectRatio = actualPaperWidthMm / actualPaperHeightMm;

  const printableWidthMm =
    paperWidthMm - grid.marginLeftMm - grid.marginRightMm - (grid.cols - 1) * grid.gapHorizontalMm;
  const printableHeightMm =
    paperHeightMm - grid.marginTopMm - grid.marginBottomMm - (grid.rows - 1) * grid.gapVerticalMm;

  const itemWidthMm = Math.max(10, printableWidthMm / grid.cols);
  const itemHeightMm = Math.max(10, printableHeightMm / grid.rows);
  const aspectRatio = itemWidthMm / itemHeightMm;

  const activeSlotRef = useRef<HTMLDivElement | null>(null);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, id: string, slotContainer?: HTMLDivElement | null) => {
    e.stopPropagation();
    onSelectElement(id);
    setIsDragging(true);
    setDraggedElementId(id);
    activeSlotRef.current = slotContainer || containerRef.current;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedElementId) return;

    const targetContainer = activeSlotRef.current || containerRef.current;
    if (!targetContainer) return;

    const rect = targetContainer.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const xPercent = Math.min(100, Math.max(0, (xPx / rect.width) * 100));
    const yPercent = Math.min(100, Math.max(0, (yPx / rect.height) * 100));

    onUpdateElementPosition(draggedElementId, Number(xPercent.toFixed(1)), Number(yPercent.toFixed(1)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedElementId(null);
    activeSlotRef.current = null;
  };

  // Keyboard Movement for Selected Element
  useEffect(() => {
    if (!selectedElementId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const activeElTag = document.activeElement?.tagName?.toLowerCase();
      const isInput =
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        targetTag === 'select' ||
        activeElTag === 'input' ||
        activeElTag === 'textarea' ||
        activeElTag === 'select' ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const activeEl = elements.find((el) => el.id === selectedElementId);
      if (!activeEl) return;

      let step = 0.5;
      if (e.shiftKey) {
        step = 2.0;
      } else if (e.altKey || e.ctrlKey) {
        step = 0.1;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateElementPosition(selectedElementId, activeEl.xPercent, Math.max(0, Number((activeEl.yPercent - step).toFixed(2))));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateElementPosition(selectedElementId, activeEl.xPercent, Math.min(100, Number((activeEl.yPercent + step).toFixed(2))));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateElementPosition(selectedElementId, Math.max(0, Number((activeEl.xPercent - step).toFixed(2))), activeEl.yPercent);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateElementPosition(selectedElementId, Math.min(100, Number((activeEl.xPercent + step).toFixed(2))), activeEl.yPercent);
      } else if (e.key === 'Delete' && onDeleteElement) {
        onDeleteElement(selectedElementId);
      } else if (e.key === 'Escape') {
        onSelectElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, onUpdateElementPosition, onDeleteElement, onSelectElement]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden relative border-t border-slate-300">
      {/* Canvas Top Bar */}
      <div className="bg-white border-b border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs z-10 flex-wrap gap-2 select-none shadow-2xs">
        {/* Record Navigator & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Canvas Mode Switcher */}
          <div className="flex items-center bg-slate-100 border border-slate-300 rounded p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setCanvasViewMode('single_card')}
              className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition ${
                canvasViewMode === 'single_card'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              تصميم نسخة فردية
            </button>
            <button
              type="button"
              onClick={() => setCanvasViewMode('full_sheet')}
              className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition ${
                canvasViewMode === 'full_sheet'
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              الورقة كاملة ({grid.rows * grid.cols})
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300"></div>

          {/* Record Navigator */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">السجل:</span>
            <div className="flex items-center bg-white border border-slate-300 rounded p-0.5">
              <button
                type="button"
                disabled={activeRecordIndex <= 0}
                onClick={() => onSelectRecordIndex(activeRecordIndex - 1)}
                className="p-1 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition"
                title="السجل السابق"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-bold text-slate-900">
                {activeRecordIndex + 1} / {totalRecords || 1}
              </span>
              <button
                type="button"
                disabled={activeRecordIndex >= totalRecords - 1}
                onClick={() => onSelectRecordIndex(activeRecordIndex + 1)}
                className="p-1 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition"
                title="السجل التالي"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {onAddManualTextBox && (
            <button
              type="button"
              onClick={onAddManualTextBox}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
            >
              <Plus className="w-3 h-3 text-indigo-600" />
              إضافة نص
            </button>
          )}
        </div>

        {/* Zoom Controls & Grid overlay toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-300 rounded p-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCanvasZoom((prev) => Math.max(30, prev - 10));
              }}
              className="p-1 rounded text-slate-700 hover:bg-slate-100 transition"
              title="تصغير (-10%)"
            >
              <ZoomOut className="w-3 h-3 text-slate-600" />
            </button>

            <span className="px-1.5 font-mono text-[10px] font-bold text-slate-800 min-w-[34px] text-center">
              {canvasZoom}%
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCanvasZoom((prev) => Math.min(300, prev + 10));
              }}
              className="p-1 rounded text-slate-700 hover:bg-slate-100 transition"
              title="تكبير (+10%)"
            >
              <ZoomIn className="w-3 h-3 text-slate-600" />
            </button>

            {canvasZoom !== 100 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCanvasZoom(100);
                }}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-slate-500 hover:bg-slate-100 transition border-r border-slate-200"
              >
                100%
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowGridOverlay(!showGridOverlay)}
            className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 transition ${
              showGridOverlay
                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Grid className="w-3 h-3" />
            خطوط الشبكة
          </button>

          <span className="bg-white border border-slate-300 text-slate-600 px-2 py-1 rounded font-mono text-[10px] hidden md:block">
            {itemWidthMm.toFixed(0)} × {itemHeightMm.toFixed(0)} مم
          </span>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div
        className="flex-1 p-4 sm:p-6 overflow-auto flex items-center justify-center select-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
        onClick={() => onSelectElement(null)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `scale(${canvasZoom / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="flex items-center justify-center shrink-0 my-auto mx-auto"
        >
          {canvasViewMode === 'full_sheet' ? (
            /* Full Sheet Canvas Mode */
            <div
              ref={containerRef}
              style={{
                aspectRatio: `${sheetAspectRatio}`,
                width: '780px',
                maxWidth: '92vw',
                paddingTop: `${(grid.marginTopMm / actualPaperHeightMm) * 100}%`,
                paddingBottom: `${(grid.marginBottomMm / actualPaperHeightMm) * 100}%`,
                paddingLeft: `${(grid.marginLeftMm / actualPaperWidthMm) * 100}%`,
                paddingRight: `${(grid.marginRightMm / actualPaperWidthMm) * 100}%`,
              }}
              className="relative bg-white shadow-xl rounded-sm border border-slate-300 overflow-hidden shrink-0"
            >
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
                {Array.from({ length: grid.rows * grid.cols }).map((_, slotIdx) => {
                  const slotCfg = getSlotConfig(grid, slotIdx);
                  const hasCustomRanges = slotCfg.customRange?.enabled || elements.some((e) => e.customRowConfig?.enabled);
                  const cardOrPageIndex = hasCustomRanges ? activeRecordIndex : (activeRecordIndex + slotIdx);

                  if (!slotCfg.enabled) {
                    return (
                      <div
                        key={slotIdx}
                        className="relative bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center opacity-40"
                      >
                        <span className="text-[10px] font-mono text-slate-400">قسم مخفي #{slotIdx + 1}</span>
                      </div>
                    );
                  }

                  const slotTransform = `rotate(${slotCfg.rotation}deg) scale(${slotCfg.scale}) translate(${slotCfg.offsetX}mm, ${slotCfg.offsetY}mm)`;

                  return (
                    <div
                      key={slotIdx}
                      style={{
                        transform: slotTransform,
                        transformOrigin: 'center center',
                      }}
                      className="relative bg-white border border-slate-200 overflow-hidden shadow-2xs flex items-center justify-center"
                    >
                      {/* Slot badge header */}
                      <div className="absolute top-1 left-1 z-20 bg-slate-800 text-white font-mono text-[9px] px-1.5 py-0.5 rounded pointer-events-none">
                        قسم #{slotIdx + 1}
                      </div>

                      {bgImageUrl && (
                        <img src={bgImageUrl} alt="قالب" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
                      )}

                      {elements.map((el) => {
                        if (!el.visible) return null;

                        if (
                          el.targetSlotIndex !== undefined &&
                          el.targetSlotIndex !== null &&
                          el.targetSlotIndex !== -1 &&
                          el.targetSlotIndex !== slotIdx
                        ) {
                          return null;
                        }

                        const style = el.style;
                        const isSelected = el.id === selectedElementId;

                        if (el.type === 'qr_code') {
                          const targetRow = getRowForElement(el, dataRows, cardOrPageIndex, slotCfg);
                          const qrVal = targetRow && el.fieldName ? String(targetRow[el.fieldName] || 'QR') : 'QR';
                          return (
                            <div
                              key={el.id}
                              onMouseDown={(e) => handleMouseDown(e, el.id, e.currentTarget.parentElement as HTMLDivElement)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectElement(el.id);
                              }}
                              style={{
                                left: `${el.xPercent}%`,
                                top: `${el.yPercent}%`,
                                transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
                                opacity: style.opacity ?? 1,
                              }}
                              className={`absolute cursor-move select-none p-1 transition-shadow ${
                                isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/80 rounded' : 'hover:ring-1 hover:ring-indigo-300'
                              }`}
                            >
                              <div className="bg-white p-1 rounded border border-slate-300 shadow-2xs flex flex-col items-center">
                                <QrCode className="w-8 h-8 text-slate-800" />
                                <span className="text-[8px] font-mono text-slate-500 max-w-[60px] truncate">{qrVal}</span>
                              </div>
                            </div>
                          );
                        }

                        const text = getElementTextValue(el, dataRows, cardOrPageIndex, slotCfg);
                        const scaledFontSize = Math.max(6, Math.round(style.fontSize * fontScale * 0.5));
                        const activeFont = isSelected && hoverPreviewFont ? hoverPreviewFont : (style.fontFamily || 'Cairo');

                        const shadowStyle = style.shadow?.enabled
                          ? `${style.shadow.offsetX ?? 2}px ${style.shadow.offsetY ?? 2}px ${style.shadow.blur ?? 4}px ${getShadowRgba(style.shadow.color || '#000000', style.shadow.opacity ?? 0.6)}`
                          : undefined;

                        const strokeStyle = style.stroke?.enabled
                          ? `${Math.max(1, Math.round((style.stroke.width || 1) * fontScale * 0.5))}px ${style.stroke.color || '#000000'}`
                          : undefined;

                        return (
                          <div
                            key={el.id}
                            onMouseDown={(e) => handleMouseDown(e, el.id, e.currentTarget.parentElement as HTMLDivElement)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectElement(el.id);
                            }}
                            style={{
                              left: `${el.xPercent}%`,
                              top: `${el.yPercent}%`,
                              transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
                              fontFamily: activeFont,
                              fontSize: `${scaledFontSize}px`,
                              fontWeight: style.fontWeight || 'normal',
                              color: style.color || '#000000',
                              textAlign: style.textAlign || 'right',
                              textShadow: shadowStyle,
                              WebkitTextStroke: strokeStyle,
                              backgroundColor: style.bg?.enabled ? style.bg.color : undefined,
                              padding: style.bg?.enabled ? `${style.bg.padding || 2}px` : undefined,
                              borderRadius: style.bg?.enabled ? `${style.bg.borderRadius || 2}px` : undefined,
                              opacity: style.opacity ?? 1,
                            }}
                            className={`absolute cursor-move select-none whitespace-nowrap leading-tight transition-shadow ${
                              isSelected ? 'ring-2 ring-indigo-500 rounded px-1' : 'hover:ring-1 hover:ring-indigo-300'
                            }`}
                          >
                            {text}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Single Card Editor Mode */
            <div
              ref={containerRef}
              style={{
                aspectRatio: `${aspectRatio}`,
                width: '600px',
                maxWidth: '90vw',
              }}
              className="relative bg-white shadow-xl rounded-sm border border-slate-300 overflow-hidden shrink-0"
            >
              {bgImageUrl ? (
                <img src={bgImageUrl} alt="قالب" className="absolute inset-0 w-full h-full object-fill pointer-events-none" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none">
                  <div className="text-center space-y-1">
                    <Grid className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">مساحة تصميم النسخة</p>
                  </div>
                </div>
              )}

              {/* Grid overlay */}
              {showGridOverlay && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-4 grid-rows-4 border border-dashed border-indigo-200 opacity-40">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="border border-dashed border-indigo-100" />
                  ))}
                </div>
              )}

              {/* Render Elements */}
              {elements.map((el) => {
                if (!el.visible) return null;

                const style = el.style;
                const isSelected = el.id === selectedElementId;

                if (el.type === 'qr_code') {
                  const targetRow = getRowForElement(el, dataRows, activeRecordIndex);
                  const qrVal = targetRow && el.fieldName ? String(targetRow[el.fieldName] || 'QR') : 'QR';
                  return (
                    <div
                      key={el.id}
                      onMouseDown={(e) => handleMouseDown(e, el.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(el.id);
                      }}
                      style={{
                        left: `${el.xPercent}%`,
                        top: `${el.yPercent}%`,
                        transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
                        opacity: style.opacity ?? 1,
                      }}
                      className={`absolute cursor-move select-none p-1.5 transition-shadow ${
                        isSelected
                          ? 'ring-2 ring-indigo-600 bg-indigo-50/90 rounded shadow-md'
                          : 'hover:ring-1 hover:ring-indigo-300'
                      }`}
                    >
                      <div className="bg-white p-2 rounded border border-slate-300 shadow-2xs flex flex-col items-center">
                        <QrCode className="w-12 h-12 text-slate-800" />
                        <span className="text-[10px] font-mono text-slate-600 max-w-[80px] truncate mt-0.5">{qrVal}</span>
                      </div>
                    </div>
                  );
                }

                const text = getElementTextValue(el, dataRows, activeRecordIndex);
                const scaledFontSize = Math.max(8, Math.round(style.fontSize * fontScale));
                const activeFont = isSelected && hoverPreviewFont ? hoverPreviewFont : (style.fontFamily || 'Cairo');

                const shadowStyle = style.shadow?.enabled
                  ? `${style.shadow.offsetX ?? 3}px ${style.shadow.offsetY ?? 3}px ${style.shadow.blur ?? 4}px ${getShadowRgba(style.shadow.color || '#000000', style.shadow.opacity ?? 0.6)}`
                  : undefined;

                const strokeStyle = style.stroke?.enabled
                  ? `${Math.max(1, Math.round((style.stroke.width || 1) * fontScale))}px ${style.stroke.color || '#000000'}`
                  : undefined;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(el.id);
                    }}
                    style={{
                      left: `${el.xPercent}%`,
                      top: `${el.yPercent}%`,
                      transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
                      fontFamily: activeFont,
                      fontSize: `${scaledFontSize}px`,
                      fontWeight: style.fontWeight || 'normal',
                      color: style.color || '#000000',
                      textAlign: style.textAlign || 'right',
                      textShadow: shadowStyle,
                      WebkitTextStroke: strokeStyle,
                      backgroundColor: style.bg?.enabled ? style.bg.color : undefined,
                      padding: style.bg?.enabled ? `${(style.bg.padding || 4) * fontScale}px` : undefined,
                      borderRadius: style.bg?.enabled ? `${style.bg.borderRadius || 4}px` : undefined,
                      opacity: style.opacity ?? 1,
                    }}
                    className={`absolute cursor-move select-none whitespace-nowrap leading-tight transition-all ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 rounded px-1.5 py-0.5 shadow-md bg-white/70'
                        : 'hover:ring-1 hover:ring-indigo-300'
                    }`}
                  >
                    {text}

                    {/* Floating Quick Action Toolbar for selected element */}
                    {isSelected && (
                      <div
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-slate-300 rounded px-1.5 py-1 shadow-md flex items-center gap-1 z-30 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Font size +/- */}
                        {onChangeElementStyle && (
                          <div className="flex items-center bg-slate-100 rounded border border-slate-300 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                onChangeElementStyle(el.id, { ...style, fontSize: Math.max(8, style.fontSize - 1) })
                              }
                              className="px-1 py-0.5 text-slate-700 hover:bg-white rounded font-bold text-[11px]"
                              title="تصغير"
                            >
                              -
                            </button>
                            <span className="px-1 font-mono text-[10px] font-bold text-slate-900 min-w-[24px] text-center">
                              {style.fontSize}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onChangeElementStyle(el.id, { ...style, fontSize: Math.min(120, style.fontSize + 1) })
                              }
                              className="px-1 py-0.5 text-slate-700 hover:bg-white rounded font-bold text-[11px]"
                              title="تكبير"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {/* Text Color Picker */}
                        {onChangeElementStyle && (
                          <label
                            className="flex items-center justify-center p-1 bg-slate-100 border border-slate-300 rounded cursor-pointer hover:bg-slate-200 transition"
                            title="لون النص"
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-400 block"
                              style={{ backgroundColor: style.color || '#000000' }}
                            ></span>
                            <input
                              type="color"
                              value={style.color || '#000000'}
                              onChange={(e) =>
                                onChangeElementStyle(el.id, { ...style, color: e.target.value })
                              }
                              className="sr-only"
                            />
                          </label>
                        )}

                        {/* Bold Toggle */}
                        {onChangeElementStyle && (
                          <button
                            type="button"
                            onClick={() =>
                              onChangeElementStyle(el.id, {
                                ...style,
                                fontWeight: style.fontWeight === 'bold' || style.fontWeight === '700' ? '400' : '700',
                              })
                            }
                            className={`p-1 rounded border text-[11px] font-bold transition ${
                              style.fontWeight === 'bold' || style.fontWeight === '700'
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="عريض (Bold)"
                          >
                            <Bold className="w-3 h-3" />
                          </button>
                        )}

                        {/* Rotation Quick 90 deg */}
                        {onChangeElementStyle && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextRot = ((style.rotation || 0) + 90) % 360;
                              onChangeElementStyle(el.id, { ...style, rotation: nextRot });
                            }}
                            className="p-1 rounded bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition"
                            title="تدوير +90°"
                          >
                            <RotateCw className="w-3 h-3 text-indigo-600" />
                          </button>
                        )}

                        {/* Duplicate element button */}
                        {onDuplicateElement && (
                          <button
                            type="button"
                            onClick={() => onDuplicateElement(el.id)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition"
                            title="تكرار المربع"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}

                        {/* Delete element button */}
                        {onDeleteElement && (
                          <button
                            type="button"
                            onClick={() => onDeleteElement(el.id)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600 transition"
                            title="حذف"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
