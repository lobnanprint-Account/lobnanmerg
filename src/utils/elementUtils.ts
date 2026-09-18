import { DataRow, FieldElement, GridSetup, GridSlotConfig } from '../types';
import { formatCellValue } from './excelParser';

/** Standard reference width in pixels for scaling proportional elements */
export const REFERENCE_CARD_WIDTH = 600;

/**
 * Returns normalized slot config or default values
 */
export function getSlotConfig(grid: GridSetup, slotIndex: number): GridSlotConfig {
  const custom = grid.slotConfigs?.[slotIndex];
  return {
    slotIndex,
    rotation: custom?.rotation ?? 0,
    scale: custom?.scale ?? 1,
    offsetX: custom?.offsetX ?? 0,
    offsetY: custom?.offsetY ?? 0,
    enabled: custom?.enabled ?? true,
    customRange: custom?.customRange,
  };
}

/**
 * Converts color string and opacity (0-1) into valid rgba(...) format
 */
export function getShadowRgba(colorStr: string, opacity: number = 0.6): string {
  if (!colorStr) return `rgba(0, 0, 0, ${opacity})`;

  if (colorStr.startsWith('#')) {
    let hex = colorStr.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  if (colorStr.startsWith('rgb(')) {
    return colorStr.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }

  if (colorStr.startsWith('rgba(')) {
    return colorStr.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }

  return colorStr;
}

/**
 * Resolves the target DataRow for a specific FieldElement or Slot based on custom row config
 * or falls back to the default record index for the current card.
 */
export function getRowForElement(
  element: FieldElement,
  dataRows: DataRow[],
  defaultCardIndex: number,
  slotConfig?: GridSlotConfig
): DataRow | undefined {
  if (!dataRows || dataRows.length === 0) return undefined;

  // 1. If element itself has a custom row config enabled
  const config = element.customRowConfig;
  if (config && config.enabled) {
    if (config.mode === 'fixed') {
      const fixedIdx = Math.max(0, (config.fixedRow || 1) - 1);
      const clampedIdx = Math.min(fixedIdx, dataRows.length - 1);
      return dataRows[clampedIdx];
    }

    if (config.mode === 'offset') {
      const offsetIdx = defaultCardIndex + (config.offset || 0);
      const clampedIdx = Math.min(Math.max(0, offsetIdx), dataRows.length - 1);
      return dataRows[clampedIdx];
    }

    // mode === 'range' (من سطر X إلى سطر Y)
    const startRowIdx = Math.max(0, (config.startRow || 1) - 1);
    const endRowIdx = Math.min(dataRows.length - 1, (config.endRow || dataRows.length) - 1);
    const span = Math.max(1, endRowIdx - startRowIdx + 1);

    // defaultCardIndex represents the card/page iteration index (0, 1, 2, ...)
    const step = defaultCardIndex % span;
    const targetIdx = Math.min(startRowIdx + step, endRowIdx);
    return dataRows[targetIdx];
  }

  // 2. If the slot has a custom range enabled (e.g. Slot 1 = 1-20, Slot 2 = 21-40)
  if (slotConfig?.customRange?.enabled) {
    const startRowIdx = Math.max(0, (slotConfig.customRange.startRow || 1) - 1);
    const endRowIdx = Math.min(dataRows.length - 1, (slotConfig.customRange.endRow || dataRows.length) - 1);
    const span = Math.max(1, endRowIdx - startRowIdx + 1);

    const step = defaultCardIndex % span;
    const targetIdx = Math.min(startRowIdx + step, endRowIdx);
    return dataRows[targetIdx];
  }

  // 3. Default sequential indexing
  const idx = Math.min(Math.max(0, defaultCardIndex), dataRows.length - 1);
  return dataRows[idx];
}

/**
 * Gets the evaluated text or string value for a FieldElement
 */
export function getElementTextValue(
  element: FieldElement,
  dataRows: DataRow[],
  defaultCardIndex: number,
  slotConfig?: GridSlotConfig
): string {
  const prefix = element.prefix || '';
  const suffix = element.suffix || '';

  if (element.type === 'static_text') {
    return `${prefix}${element.staticText || ''}${suffix}`;
  }

  if (element.type === 'field' || element.type === 'qr_code') {
    const row = getRowForElement(element, dataRows, defaultCardIndex, slotConfig);
    if (!row || !element.fieldName) {
      return `${prefix}${suffix}`;
    }
    const rawVal = row[element.fieldName] !== undefined ? formatCellValue(row[element.fieldName]) : '';
    return `${prefix}${rawVal}${suffix}`;
  }

  return '';
}
