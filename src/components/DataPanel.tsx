import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Layers,
  Plus,
  Search,
  Upload,
} from 'lucide-react';
import { DataRow, RowRange } from '../types';

interface DataPanelProps {
  fileName?: string;
  sheetNames: string[];
  activeSheet: string;
  onSelectSheet: (sheetName: string) => void;
  headers: string[];
  rows: DataRow[];
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddFieldToCanvas: (fieldName: string) => void;
  rowRange?: RowRange;
  onChangeRowRange?: (range: RowRange) => void;
  activeRecordIndex: number;
  onSelectRecordIndex: (index: number) => void;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  fileName,
  sheetNames,
  activeSheet,
  onSelectSheet,
  headers,
  rows,
  onUploadFile,
  onAddFieldToCanvas,
  activeRecordIndex,
  onSelectRecordIndex,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'fields' | 'table'>('fields');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter rows by search term
  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return headers.some((h) => String(r[h] || '').toLowerCase().includes(term));
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4 text-slate-800">
      {/* File Source Header */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-300 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-xs text-slate-900">مصدر بيانات الإكسل</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                {fileName ? fileName : 'بيانات افتراضية جاهزة'}
              </p>
            </div>
          </div>

          <label className="cursor-pointer text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded flex items-center gap-1.5 shadow-2xs transition">
            <Upload className="w-3.5 h-3.5" />
            استيراد ملف
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUploadFile} />
          </label>
        </div>

        {/* Sheet Switcher */}
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
            <span className="text-[11px] text-slate-500 font-medium shrink-0">ورقة العمل:</span>
            {sheetNames.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSelectSheet(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap transition ${
                  activeSheet === s
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Quick stats */}
        <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-slate-600">
            إجمالي السجلات: <strong className="text-slate-900 font-mono">{rows.length}</strong>
          </span>
          <span className="text-slate-600">
            الأعمدة: <strong className="text-emerald-700 font-mono">{headers.length}</strong>
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-200 p-0.5 rounded border border-slate-300 text-xs font-bold gap-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 transition ${
            activeTab === 'fields'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          الحقول
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 transition ${
            activeTab === 'table'
              ? 'bg-white text-indigo-700 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          الجدول
        </button>
      </div>

      {/* TAB 1: Fields Insertion */}
      {activeTab === 'fields' && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 gap-1.5">
            {headers.map((h) => {
              const currentValue = rows[activeRecordIndex]?.[h] || '';
              return (
                <div
                  key={h}
                  onClick={() => onAddFieldToCanvas(h)}
                  className="group bg-white hover:bg-slate-50 p-2.5 rounded-lg border border-slate-300 cursor-pointer flex items-center justify-between transition hover:border-indigo-400 shadow-2xs"
                >
                  <div className="space-y-0.5 overflow-hidden">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      {h}
                    </span>
                    <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                      القيمة: <span className="text-slate-800 font-mono font-medium">{String(currentValue) || '---'}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition border border-indigo-200"
                  >
                    <Plus className="w-3 h-3" />
                    إدراج
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Full Table View */}
      {activeTab === 'table' && (
        <div className="space-y-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              placeholder="بحث في البيانات..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white border border-slate-300 rounded pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Table Container */}
          <div className="bg-white rounded border border-slate-300 overflow-x-auto max-h-[300px] shadow-2xs">
            <table className="w-full text-xs text-right text-slate-800">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-300">
                <tr>
                  <th className="p-2 text-center w-10">#</th>
                  {headers.map((h) => (
                    <th key={h} className="p-2 font-bold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageRows.map((r, idx) => {
                  const actualIdx = (currentPage - 1) * pageSize + idx;
                  const isSelected = actualIdx === activeRecordIndex;
                  return (
                    <tr
                      key={r._id || idx}
                      onClick={() => onSelectRecordIndex(actualIdx)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-2 text-center text-slate-400 font-mono">{actualIdx + 1}</td>
                      {headers.map((h) => (
                        <td key={h} className="p-2 whitespace-nowrap">
                          {String(r[h] || '')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
            <span>
              الصفحة {currentPage} من {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
