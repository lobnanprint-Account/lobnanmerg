import { DataRow, FieldElement, GridSetup, PaperDimensions, PaperOrientation, PaperSize, RowRange } from '../types';

export interface SavedProjectState {
  version: '1.0';
  timestamp: string;
  projectName?: string;
  orientation: PaperOrientation;
  paperSize: PaperSize;
  paperDimensions: PaperDimensions;
  grid: GridSetup;
  bgImageUrl: string;
  elements: FieldElement[];
  dataRows?: DataRow[];
  headers?: string[];
  fileName?: string;
  sheetNames?: string[];
  activeSheet?: string;
  activeRecordIndex?: number;
  rowRange?: RowRange;
  activePresetId?: string;
}

const LOCAL_STORAGE_KEY = 'smart_mail_merge_project_v1';

/**
 * Saves current workspace state to browser's LocalStorage automatically
 */
export function saveToLocalStorage(state: Omit<SavedProjectState, 'version' | 'timestamp'>) {
  try {
    const payload: SavedProjectState = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      ...state,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Could not save workspace state to localStorage (Quota or disabled):', err);
  }
}

/**
 * Restores workspace state from browser's LocalStorage
 */
export function loadFromLocalStorage(): SavedProjectState | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedProjectState;
    if (data && Array.isArray(data.elements)) {
      return data;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse localStorage project state:', err);
    return null;
  }
}

/**
 * Clears LocalStorage saved state
 */
export function clearLocalStorageState() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear localStorage state:', err);
  }
}

/**
 * Export full project design template to a downloadable JSON file on the computer
 */
export function exportProjectToFile(state: Omit<SavedProjectState, 'version' | 'timestamp'>, filenameOverride?: string) {
  const payload: SavedProjectState = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    ...state,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanName = filenameOverride
    ? filenameOverride.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')
    : `قالب_تصميم_${new Date().toISOString().slice(0, 10)}`;

  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.mrg.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read and parse a JSON project template file uploaded by user
 */
export function importProjectFromFile(file: File): Promise<SavedProjectState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as SavedProjectState;
        if (!parsed || !Array.isArray(parsed.elements)) {
          throw new Error('ملف القالب غير صالح أو لا يحتوي على عناصر تصميم.');
        }
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(err.message || 'فشل في قراءة ملف القالب. يرجى التأكد من اختيار ملف .mrg.json صحيح.'));
      }
    };
    reader.onerror = () => reject(new Error('حدث خطأ أثناء قراءة ملف القالب.'));
    reader.readAsText(file);
  });
}
