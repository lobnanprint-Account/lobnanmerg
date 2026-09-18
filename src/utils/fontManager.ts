// System & Windows Font Helper Utility

export interface FontOption {
  name: string;
  value: string;
  category?: 'windows' | 'web' | 'custom' | 'system';
}

export const STANDARD_FONTS: FontOption[] = [
  // Common Windows Installed Arabic Fonts
  { name: 'Traditional Arabic (تراديشنال أرابيك - ويندوز)', value: 'Traditional Arabic', category: 'windows' },
  { name: 'Simplified Arabic (سيمبليفيد أرابيك - ويندوز)', value: 'Simplified Arabic', category: 'windows' },
  { name: 'Sakkal Majalla (صقال مجلة - ويندوز)', value: 'Sakkal Majalla', category: 'windows' },
  { name: 'Andalus (خط الأندلس - ويندوز)', value: 'Andalus', category: 'windows' },
  { name: 'Arabic Typesetting (الطباعة العربية - ويندوز)', value: 'Arabic Typesetting', category: 'windows' },
  { name: 'Tahoma (تاهوما - ويندوز)', value: 'Tahoma', category: 'windows' },
  { name: 'Segoe UI (سيجو يو آي - ويندوز)', value: 'Segoe UI', category: 'windows' },
  { name: 'Arial (أريال السريع)', value: 'Arial', category: 'windows' },
  { name: 'Calibri (كالايبري)', value: 'Calibri', category: 'windows' },
  { name: 'Times New Roman (تايمز نيو رومان)', value: 'Times New Roman', category: 'windows' },
  { name: 'Courier New', value: 'Courier New', category: 'windows' },

  // Web & Graphic Arabic Fonts
  { name: 'Cairo (القاهرة)', value: 'Cairo', category: 'web' },
  { name: 'Tajawal (تاجويل)', value: 'Tajawal', category: 'web' },
  { name: 'Amiri (أميري الكلاسيكي)', value: 'Amiri', category: 'web' },
  { name: 'Almarai (المراعي)', value: 'Almarai', category: 'web' },
  { name: 'Changa (شانجا)', value: 'Changa', category: 'web' },
  { name: 'El Messiri (المسيري)', value: 'El Messiri', category: 'web' },
  { name: 'Alexandria (الإسكندرية)', value: 'Alexandria', category: 'web' },
  { name: 'Readex Pro (ريديكس برو)', value: 'Readex Pro', category: 'web' },
  { name: 'Kufam (كوفام)', value: 'Kufam', category: 'web' },
  { name: 'Reem Kufi (ريم كوفي)', value: 'Reem Kufi', category: 'web' },
  { name: 'Aref Ruqaa (عارف رقعة)', value: 'Aref Ruqaa', category: 'web' },
  { name: 'Lalezar (لاليجار البارز)', value: 'Lalezar', category: 'web' },
  { name: 'Scheherazade New (شهرزاد)', value: 'Scheherazade New', category: 'web' },
  { name: 'Noto Naskh Arabic (نسخ نوتو)', value: 'Noto Naskh Arabic', category: 'web' },
  { name: 'Noto Kufi Arabic (كوفي نوتو)', value: 'Noto Kufi Arabic', category: 'web' },
];

/**
 * Loads font files (.ttf, .otf, .woff, .woff2) into the document dynamically
 */
export async function loadFontFile(file: File): Promise<FontOption | null> {
  try {
    const fontName = file.name.replace(/\.[^/.]+$/, '').trim();
    const arrayBuffer = await file.arrayBuffer();

    const fontFace = new FontFace(fontName, arrayBuffer);
    const loadedFont = await fontFace.load();
    document.fonts.add(loadedFont);

    return {
      name: `✨ ${fontName} (مرفوع من المجلد)`,
      value: fontName,
      category: 'custom',
    };
  } catch (err) {
    console.error('Error loading custom font file:', err);
    return null;
  }
}

/**
 * Queries Windows local installed fonts using the browser's Local Font Access API if available
 */
export async function queryWindowsLocalFonts(): Promise<FontOption[]> {
  if (typeof window === 'undefined' || !('queryLocalFonts' in window)) {
    throw new Error('ميزة Local Font Access غير مدعومة في هذا المتصفح.');
  }

  try {
    const localFonts = await (window as any).queryLocalFonts();
    const uniqueFamilies = new Set<string>();
    const results: FontOption[] = [];

    if (Array.isArray(localFonts)) {
      for (const font of localFonts) {
        if (font && font.family && !uniqueFamilies.has(font.family)) {
          uniqueFamilies.add(font.family);
          results.push({
            name: `💻 ${font.family}`,
            value: font.family,
            category: 'windows',
          });
        }
      }
    }

    // Sort alphabetically
    results.sort((a, b) => a.value.localeCompare(b.value));
    return results;
  } catch (err: any) {
    // Catch permissions policy error gracefully
    throw new Error('لا يمكن استدعاء الخطوط المحلية بسبب قيود الأمان في الإطار. يرجى رفع الخطوط مباشرة (.ttf / .otf).');
  }
}
