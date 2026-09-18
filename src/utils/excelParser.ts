import * as XLSX from 'xlsx';
import { DataRow } from '../types';

export interface ParsedSheetData {
  sheetName: string;
  headers: string[];
  rows: DataRow[];
}

export interface ParsedExcelData {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rows: DataRow[];
  allSheets: Record<string, ParsedSheetData>;
}

/**
 * Format cell value respecting Excel cell formatting, removing trailing .0 zeros if not formatted
 */
export function formatCellValue(val: any): string {
  if (val === undefined || val === null) return '';

  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return val.toString();
    }
    // Clean up float noise
    const cleaned = parseFloat(val.toFixed(8)).toString();
    return cleaned;
  }

  let strVal = String(val).trim();

  // If value is a number string with trailing .0 or .00 (e.g. "12.0", "12.00"), convert to clean integer string "12"
  if (/^-?\d+\.0+$/.test(strVal)) {
    strVal = strVal.replace(/\.0+$/, '');
  }

  return strVal;
}

/**
 * Extract headers and formatted row values from a SheetJS worksheet respecting Excel's exact Cell Formatting (cell.w / cell.z)
 */
export function parseWorksheet(worksheet: XLSX.WorkSheet): { headers: string[]; rows: DataRow[] } {
  if (!worksheet || !worksheet['!ref']) {
    return { headers: [], rows: [] };
  }

  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const headers: string[] = [];

  // 1. Read Headers from Row 0 (or first row in range)
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
    const cell = worksheet[cellAddress];
    let headerName = '';
    if (cell) {
      if (cell.w !== undefined && cell.w !== null && String(cell.w).trim().length > 0) {
        headerName = String(cell.w).trim();
      } else if (cell.v !== undefined && cell.v !== null) {
        headerName = String(cell.v).trim();
      }
    }
    if (!headerName) {
      headerName = `عمود_${C - range.s.c + 1}`;
    }
    headers.push(headerName);
  }

  const rows: DataRow[] = [];
  let rowIdx = 1;

  // 2. Read Data Rows starting from Row 1
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const rowObj: DataRow = { _id: rowIdx.toString() };
    let hasData = false;

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const header = headers[C - range.s.c];
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];

      let cellFormattedText = '';
      if (cell) {
        // 1. Strict Priority: cell.w is the EXACT rendered text formatted in Excel by Format Cells!
        if (cell.w !== undefined && cell.w !== null) {
          cellFormattedText = String(cell.w).trim();
        }
        // 2. Format with XLSX format_cell if cell.z format pattern exists
        else if (cell.z && cell.v !== undefined && (XLSX.utils as any).format_cell) {
          try {
            cellFormattedText = (XLSX.utils as any).format_cell(cell).trim();
          } catch {
            cellFormattedText = String(cell.v).trim();
          }
        }
        // 3. Fallback to raw value cell.v
        else if (cell.v !== undefined && cell.v !== null) {
          cellFormattedText = String(cell.v).trim();
        }
      }

      // Cleanup any trailing .0 if not explicitly formatted
      cellFormattedText = formatCellValue(cellFormattedText);

      rowObj[header] = cellFormattedText;
      if (cellFormattedText.length > 0) {
        hasData = true;
      }
    }

    if (hasData) {
      rows.push(rowObj);
      rowIdx++;
    }
  }

  return { headers, rows };
}

/**
 * Parse uploaded Excel or CSV File
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellNF: true,
          cellText: true,
          cellDates: true,
        });

        const sheetNames = workbook.SheetNames;
        if (sheetNames.length === 0) {
          throw new Error('الملف لا يحتوي على أوراق عمل (Sheets)');
        }

        const allSheets: Record<string, ParsedSheetData> = {};

        sheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const { headers, rows } = parseWorksheet(worksheet);

          allSheets[sheetName] = {
            sheetName,
            headers,
            rows,
          };
        });

        const activeSheet = sheetNames[0];
        const activeData = allSheets[activeSheet] || {
          sheetName: activeSheet,
          headers: [],
          rows: [],
        };

        if (activeData.rows.length === 0 && sheetNames.length === 1) {
          throw new Error('ورقة العمل فارغة');
        }

        resolve({
          fileName: file.name,
          sheetNames,
          activeSheet,
          headers: activeData.headers,
          rows: activeData.rows,
          allSheets,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'حدث خطأ أثناء قراءة ملف الإكسل'));
      }
    };

    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate sample Excel template download for user
 */
export function downloadSampleExcel(headers: string[], rows: DataRow[], filename = 'Mail_Merge_Data.xlsx') {
  const cleanRows = rows.map((r) => {
    const copy = { ...r };
    delete (copy as any)._id;
    return copy;
  });

  const worksheet = XLSX.utils.json_to_sheet(cleanRows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
  XLSX.writeFile(workbook, filename);
}
