/**
 * Types for Mail Merge Application
 */

export type PaperOrientation = 'landscape' | 'portrait';

export type PaperSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'Custom';

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
}

export interface SlotRangeConfig {
  enabled: boolean;
  startRow: number; // 1-indexed (e.g. 1)
  endRow: number; // 1-indexed (e.g. 20)
}

export interface GridSlotConfig {
  slotIndex: number;
  rotation: number; // 0, 90, 180, 270 degrees
  scale?: number; // scale multiplier (default 1)
  offsetX?: number; // horizontal offset in mm
  offsetY?: number; // vertical offset in mm
  enabled?: boolean; // true = visible, false = hidden
  customRange?: SlotRangeConfig;
}

export interface GridSetup {
  rows: number; // Number of rows per page
  cols: number; // Number of columns per page
  marginTopMm: number; // Margin from top edge
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapHorizontalMm: number; // Distance between items horizontally
  gapVerticalMm: number; // Distance between items vertically
  direction?: 'rtl' | 'ltr'; // Column numbering direction ('rtl' for Arabic, 'ltr' for English)
  slotConfigs?: Record<number, GridSlotConfig>; // Custom per-slot configs (key = slotIndex 0..N-1)
}

export type ElementType = 'field' | 'static_text' | 'qr_code' | 'barcode' | 'image';

export interface TextShadow {
  enabled: boolean;
  color: string;
  offsetX: number; // in px
  offsetY: number; // in px
  blur: number; // in px
  angle?: number; // degrees (0 - 360)
  distance?: number; // in px
  opacity?: number; // shadow opacity 0 to 1 (0% - 100%)
  extendBeyondStroke?: boolean; // automatically extend shadow beyond outer stroke
  extraOffsetPx?: number; // additional offset in px from stroke edge
}

export interface TextStroke {
  enabled: boolean;
  color: string;
  width: number; // in px
  align?: 'outside' | 'inside' | 'center'; // stroke alignment
}

export interface TextBackground {
  enabled: boolean;
  color: string;
  padding: number;
  borderRadius: number;
}

export interface TextEffect {
  fontFamily: string;
  fontSize: number; // in px or pt
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  color: string;
  textAlign: 'right' | 'center' | 'left';
  rotation: number; // degrees
  opacity: number; // 0 to 1
  lineHeight: number;
  letterSpacing: number;
  shadow: TextShadow;
  stroke: TextStroke;
  bg: TextBackground;
}

export interface CustomRowConfig {
  enabled: boolean;
  mode: 'range' | 'fixed' | 'offset';
  startRow?: number; // 1-indexed (e.g., 1)
  endRow?: number; // 1-indexed (e.g., 50)
  fixedRow?: number; // 1-indexed fixed row number (e.g. 1)
  offset?: number; // row offset (e.g., +10)
}

export interface FieldElement {
  id: string;
  type: ElementType;
  fieldName?: string; // Excel header column name
  staticText?: string;
  label?: string; // Custom display label for the layer
  xPercent: number; // 0-100% position on item card
  yPercent: number; // 0-100% position on item card
  widthPercent?: number; // Optional width
  style: TextEffect;
  prefix?: string;
  suffix?: string;
  visible: boolean;
  customRowConfig?: CustomRowConfig;
  targetSlotIndex?: number | null; // null or undefined or -1 = all slots, 0 = slot #1, 1 = slot #2, 2 = slot #3, 3 = slot #4
}

export interface DataRow {
  _id: string;
  [key: string]: string | number;
}

export interface RowRange {
  startRow: number; // 1-indexed
  endRow: number; // 1-indexed
  enabled: boolean;
}

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  iconName: string;
  orientation: PaperOrientation;
  paperSize: PaperSize;
  paperDimensions: PaperDimensions;
  grid: GridSetup;
  bgImageUrl: string;
  elements: FieldElement[];
  sampleData: DataRow[];
}
