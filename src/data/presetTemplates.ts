import { TemplatePreset } from '../types';

export const BLANK_TEMPLATE: TemplatePreset = {
  id: 'blank',
  name: 'تصميم فارغ (مصفر)',
  description: 'مساحة عمل فارغة مصفرة بدون أي عناصر أو خلفيات مسبقة',
  iconName: 'FileText',
  orientation: 'landscape',
  paperSize: 'A4',
  paperDimensions: { widthMm: 297, heightMm: 210 },
  grid: {
    rows: 1,
    cols: 1,
    marginTopMm: 0,
    marginBottomMm: 0,
    marginLeftMm: 0,
    marginRightMm: 0,
    gapHorizontalMm: 0,
    gapVerticalMm: 0,
  },
  bgImageUrl: '',
  sampleData: [],
  elements: [],
};

export const PRESET_TEMPLATES: TemplatePreset[] = [
  BLANK_TEMPLATE,
];
