import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { DataRow, FieldElement, GridSetup, PaperOrientation, PaperSize } from '../types';
import { getRowForElement, getShadowRgba, getSlotConfig, REFERENCE_CARD_WIDTH } from './elementUtils';

export interface PDFExportConfig {
  paperSize: PaperSize;
  orientation: PaperOrientation;
  widthMm: number;
  heightMm: number;
  grid: GridSetup;
  bgImageUrl: string;
  elements: FieldElement[];
  dataRows: DataRow[];
  rangeStart?: number; // 1-indexed
  rangeEnd?: number; // 1-indexed
  onProgress?: (progressPercent: number, currentPage: number, totalPages: number) => void;
}

// Convert MM to PX at 300 DPI for ultra-high print quality
const MM_TO_PX_300DPI = 300 / 25.4; // approx 11.811 px per mm

/**
 * Render single element (text, field, QR) onto 2D canvas context
 */
async function drawElementOnCanvas(
  ctx: CanvasRenderingContext2D,
  element: FieldElement,
  currentRow: DataRow,
  allDataRows: DataRow[],
  cardOrPageIndex: number,
  cardWidthPx: number,
  cardHeightPx: number,
  scale: number,
  slotConfig?: any
) {
  if (!element.visible) return;

  // Resolve target row for this element (respecting per-element or slot custom row config if enabled)
  const resolvedRow = getRowForElement(element, allDataRows, cardOrPageIndex, slotConfig) || currentRow;

  // Determine text content
  let text = '';
  if (element.type === 'field' && element.fieldName) {
    const rawVal = resolvedRow[element.fieldName] !== undefined ? String(resolvedRow[element.fieldName]) : '';
    text = `${element.prefix || ''}${rawVal}${element.suffix || ''}`;
  } else if (element.type === 'static_text') {
    text = `${element.prefix || ''}${element.staticText || ''}${element.suffix || ''}`;
  }

  // Calculate coordinates on card
  const posX = (element.xPercent / 100) * cardWidthPx;
  const posY = (element.yPercent / 100) * cardHeightPx;

  // Handle QR code
  if (element.type === 'qr_code' && element.fieldName) {
    const qrData = String(resolvedRow[element.fieldName] || 'QR Code');
    try {
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 120 * scale });
      const img = new Image();
      img.src = qrDataUrl;
      await new Promise((res) => {
        img.onload = res;
      });
      const qrSize = Math.min(cardWidthPx, cardHeightPx) * 0.22;
      ctx.drawImage(img, posX - qrSize / 2, posY - qrSize / 2, qrSize, qrSize);
    } catch {
      // ignore qr error
    }
    return;
  }

  if (!text) return;

  const style = element.style;
  ctx.save();

  // Translate to element position for rotation & styling
  ctx.translate(posX, posY);
  if (style.rotation) {
    ctx.rotate((style.rotation * Math.PI) / 180);
  }

  // Calculate proportional scale ratio based on REFERENCE_CARD_WIDTH (600px baseline)
  const fontScale = cardWidthPx / REFERENCE_CARD_WIDTH;
  const fontSizePx = style.fontSize * fontScale;
  const fontWeight = style.fontWeight || '400';
  const fontFamily = style.fontFamily || 'Cairo';
  const fontStyle = style.fontStyle === 'italic' ? 'italic ' : '';

  ctx.font = `${fontStyle}${fontWeight} ${fontSizePx}px "${fontFamily}", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = style.textAlign || 'center';
  ctx.globalAlpha = style.opacity ?? 1;

  // Measure text width for background box & stroke
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSizePx;

  // 1. Draw Background Box if enabled
  if (style.bg?.enabled) {
    const padding = (style.bg.padding || 4) * fontScale;
    const borderRadius = (style.bg.borderRadius || 4) * fontScale;

    let bgX = -textWidth / 2 - padding;
    if (style.textAlign === 'right') bgX = -textWidth - padding;
    if (style.textAlign === 'left') bgX = -padding;

    const bgY = -textHeight / 2 - padding;
    const bgW = textWidth + padding * 2;
    const bgH = textHeight + padding * 2;

    ctx.fillStyle = style.bg.color || '#ffffff';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bgX, bgY, bgW, bgH, borderRadius);
    } else {
      ctx.rect(bgX, bgY, bgW, bgH);
    }
    ctx.fill();
  }

  const strokeAlign = style.stroke?.align || 'outside';
  const strokeWidth = (style.stroke?.width || 1) * fontScale;
  const hasStroke = style.stroke?.enabled && strokeWidth > 0;
  const hasShadow = style.shadow?.enabled;

  // Calculate shadow offsets (extending beyond stroke if enabled)
  let baseDistance = style.shadow?.distance ?? 4;
  if (hasStroke && (style.shadow?.extendBeyondStroke ?? true)) {
    baseDistance += (style.stroke?.width || 1) + (style.shadow?.extraOffsetPx || 0);
  }

  let shadowX = style.shadow?.offsetX ?? 2;
  let shadowY = style.shadow?.offsetY ?? 2;
  if (style.shadow?.enabled && style.shadow.angle !== undefined) {
    const rad = (style.shadow.angle * Math.PI) / 180;
    shadowX = Math.cos(rad) * baseDistance;
    shadowY = Math.sin(rad) * baseDistance;
  }

  // Set Shadow Parameters on Canvas context with Opacity support
  if (hasShadow) {
    ctx.shadowColor = getShadowRgba(style.shadow.color || '#000000', style.shadow.opacity ?? 0.6);
    ctx.shadowOffsetX = shadowX * fontScale;
    ctx.shadowOffsetY = shadowY * fontScale;
    ctx.shadowBlur = (style.shadow.blur ?? 4) * fontScale;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
  }

  // Draw Stroke and Fill with alignment & round anti-spiking joins
  if (hasStroke) {
    ctx.strokeStyle = style.stroke.color || '#000000';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;

    if (strokeAlign === 'outside') {
      // OUTSIDE STROKE: Draw stroke with double width first (shadow applied here)
      ctx.lineWidth = strokeWidth * 2;
      ctx.strokeText(text, 0, 0);

      // Disable shadow for text fill on top
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = style.color || '#000000';
      ctx.fillText(text, 0, 0);
    } else if (strokeAlign === 'inside') {
      // INSIDE STROKE: Fill text first with shadow
      ctx.fillStyle = style.color || '#000000';
      ctx.fillText(text, 0, 0);

      // Draw inside stroke using composite operation
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.globalCompositeOperation = 'source-atop';
      ctx.lineWidth = strokeWidth * 2;
      ctx.strokeText(text, 0, 0);
      ctx.restore();
    } else {
      // CENTER STROKE: Standard stroke and fill
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, 0, 0);

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = style.color || '#000000';
      ctx.fillText(text, 0, 0);
    }
  } else {
    // NO STROKE: Fill text with shadow
    ctx.fillStyle = style.color || '#000000';
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

/**
 * Generate PDF document with complete grid layouts
 */
export async function generateMailMergePDF(config: PDFExportConfig): Promise<jsPDF> {
  const {
    orientation,
    widthMm,
    heightMm,
    grid,
    bgImageUrl,
    elements,
    dataRows,
    rangeStart = 1,
    rangeEnd = dataRows.length,
    onProgress,
  } = config;

  // 1. Filter rows by specified range (e.g., 1-50, 51-100)
  const startIndex = Math.max(0, rangeStart - 1);
  const endIndex = Math.min(dataRows.length, rangeEnd);
  const selectedRows = dataRows.slice(startIndex, endIndex);

  if (selectedRows.length === 0) {
    throw new Error('لا توجد بيانات ضمن النطاق المحدد للمراسلات');
  }

  // 2. Load Template Background Image (if present)
  let bgImage: HTMLImageElement | null = null;
  if (bgImageUrl && bgImageUrl.trim().length > 0) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgImageUrl;
      await new Promise((res) => {
        img.onload = res;
        img.onerror = () => res(null); // safely continue if image fails
      });
      bgImage = img;
    } catch {
      bgImage = null;
    }
  }

  // 3. Calculate Grid Geometry (in MM & PX at 300 DPI)
  const scale = 2.5; // High resolution scale factor
  const paperWidthPx = Math.round(widthMm * MM_TO_PX_300DPI);
  const paperHeightPx = Math.round(heightMm * MM_TO_PX_300DPI);

  const marginTopPx = grid.marginTopMm * MM_TO_PX_300DPI;
  const marginLeftPx = grid.marginLeftMm * MM_TO_PX_300DPI;
  const gapHorizPx = grid.gapHorizontalMm * MM_TO_PX_300DPI;
  const gapVertPx = grid.gapVerticalMm * MM_TO_PX_300DPI;

  const printableWidthPx =
    paperWidthPx - grid.marginLeftMm * MM_TO_PX_300DPI - grid.marginRightMm * MM_TO_PX_300DPI - (grid.cols - 1) * gapHorizPx;
  const printableHeightPx =
    paperHeightPx - grid.marginTopMm * MM_TO_PX_300DPI - grid.marginBottomMm * MM_TO_PX_300DPI - (grid.rows - 1) * gapVertPx;

  const itemWidthPx = printableWidthPx / grid.cols;
  const itemHeightPx = printableHeightPx / grid.rows;

  const itemsPerPage = grid.rows * grid.cols;

  // Check if any slot has custom range (Cut & Stack mode)
  const activeSlotConfigs = Array.from({ length: itemsPerPage }).map((_, i) => getSlotConfig(grid, i));
  const hasSlotCustomRanges = activeSlotConfigs.some((cfg) => cfg.enabled && cfg.customRange?.enabled);

  // Check if any element has custom range (Multiple boxes on canvas mode)
  const rangeSpans = elements
    .filter((e) => e.visible && e.customRowConfig?.enabled && e.customRowConfig.mode === 'range')
    .map((e) => Math.max(1, (e.customRowConfig!.endRow || 1) - (e.customRowConfig!.startRow || 1) + 1));

  let totalPages = Math.max(1, Math.ceil(selectedRows.length / itemsPerPage));

  if (hasSlotCustomRanges) {
    const slotSpans = activeSlotConfigs
      .filter((s) => s.enabled && s.customRange?.enabled)
      .map((s) => Math.max(1, (s.customRange!.endRow || 1) - (s.customRange!.startRow || 1) + 1));
    const maxSlotSpan = slotSpans.length > 0 ? Math.max(...slotSpans) : 1;
    totalPages = maxSlotSpan;
  } else if (rangeSpans.length > 0) {
    const maxSpan = Math.max(...rangeSpans);
    totalPages = maxSpan;
  }

  // Initialize jsPDF document
  const pdf = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  // Render Page by Page
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage([widthMm, heightMm], orientation === 'landscape' ? 'l' : 'p');
    }

    // Create Page Canvas
    const canvas = document.createElement('canvas');
    canvas.width = paperWidthPx;
    canvas.height = paperHeightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Background paper fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

    // Items for current page
    const pageItemsStart = pageIdx * itemsPerPage;
    const pageItems = selectedRows.slice(pageItemsStart, pageItemsStart + itemsPerPage);

    for (let i = 0; i < itemsPerPage; i++) {
      const row = pageItems[i] || selectedRows[0] || ({} as DataRow);
      const r = Math.floor(i / grid.cols);
      const c = i % grid.cols;

      const slotCfg = getSlotConfig(grid, i);
      if (!slotCfg.enabled) continue;

      const itemX = marginLeftPx + c * (itemWidthPx + gapHorizPx);
      const itemY = marginTopPx + r * (itemHeightPx + gapVertPx);

      // Draw Item Card with Slot Transforms (Rotation, Scale, Offsets)
      ctx.save();
      const centerX = itemX + itemWidthPx / 2;
      const centerY = itemY + itemHeightPx / 2;
      const offsetXPx = (slotCfg.offsetX || 0) * MM_TO_PX_300DPI;
      const offsetYPx = (slotCfg.offsetY || 0) * MM_TO_PX_300DPI;

      ctx.translate(centerX + offsetXPx, centerY + offsetYPx);
      if (slotCfg.rotation) {
        ctx.rotate((slotCfg.rotation * Math.PI) / 180);
      }
      if (slotCfg.scale && slotCfg.scale !== 1) {
        ctx.scale(slotCfg.scale, slotCfg.scale);
      }
      ctx.translate(-itemWidthPx / 2, -itemHeightPx / 2);

      // Draw background template image stretched to item card if present
      if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, itemWidthPx, itemHeightPx);
      }

      // Pass pageIdx if slot has customRange or element has custom range; otherwise globalCardIndex
      const cardOrPageIndex = hasSlotCustomRanges || rangeSpans.length > 0
        ? pageIdx
        : (startIndex + pageIdx * itemsPerPage + i);

      // Draw all fields onto item card
      for (const el of elements) {
        if (!el.visible) continue;
        if (
          el.targetSlotIndex !== undefined &&
          el.targetSlotIndex !== null &&
          el.targetSlotIndex !== -1 &&
          el.targetSlotIndex !== i
        ) {
          continue;
        }
        await drawElementOnCanvas(ctx, el, row, dataRows, cardOrPageIndex, itemWidthPx, itemHeightPx, scale, slotCfg);
      }

      ctx.restore();
    }

    // Convert Canvas to High Quality Image JPEG/PNG and add to PDF
    const pageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(pageDataUrl, 'JPEG', 0, 0, widthMm, heightMm);

    // Progress Callback
    if (onProgress) {
      const percent = Math.round(((pageIdx + 1) / totalPages) * 100);
      onProgress(percent, pageIdx + 1, totalPages);
    }
  }

  return pdf;
}
