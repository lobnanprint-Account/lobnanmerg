import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Download, Loader2, Sparkles, X } from 'lucide-react';
import { DataRow, FieldElement, GridSetup, PaperOrientation, PaperSize, RowRange } from '../types';
import { generateMailMergePDF } from '../utils/pdfGenerator';

interface ExportModalProps {
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
  rowRange: RowRange;
}

export const ExportModal: React.FC<ExportModalProps> = ({
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
  rowRange,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'range'>('all');
  const [customStart, setCustomStart] = useState(rowRange.startRow || 1);
  const [customEnd, setCustomEnd] = useState(rowRange.endRow || dataRows.length);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsFinished(false);
      setIsExporting(false);
      setPdfBlobUrl(null);
      setCustomStart(rowRange.enabled ? rowRange.startRow : 1);
      setCustomEnd(rowRange.enabled ? rowRange.endRow : dataRows.length || 1);
    }
  }, [isOpen, dataRows, rowRange]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      setIsFinished(false);
      setExportProgress(0);
      setPdfBlobUrl(null);

      const start = exportMode === 'all' ? 1 : customStart;
      const end = exportMode === 'all' ? dataRows.length : customEnd;

      const pdf = await generateMailMergePDF({
        paperSize,
        orientation,
        widthMm: paperWidthMm,
        heightMm: paperHeightMm,
        grid,
        bgImageUrl,
        elements,
        dataRows,
        rangeStart: start,
        rangeEnd: end,
        onProgress: (percent, currentP, totalP) => {
          setExportProgress(percent);
          setCurrentPage(currentP);
          setTotalPages(totalP);
        },
      });

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);

      setIsExporting(false);
      setIsFinished(true);

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تصدير ملف PDF');
      setIsExporting(false);
    }
  };

  const handleDownloadFile = () => {
    if (pdfBlobUrl) {
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = `Al_Ayhem_Studio_${paperSize}_${Date.now()}.pdf`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-lg w-full max-w-lg overflow-hidden shadow-xl space-y-4 p-5 relative text-slate-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute left-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-indigo-600" />
            تصدير المراسلات كملف PDF
          </h3>
          <p className="text-[11px] text-slate-500">
            دمج البيانات وإنشاء مستند PDF عالي الجودة جاهز للطباعة.
          </p>
        </div>

        {!isFinished ? (
          <div className="space-y-3.5">
            {/* Range Selection */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">حدد السجلات المراد تصديرها:</span>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'all'}
                    onChange={() => setExportMode('all')}
                    className="w-3.5 h-3.5 text-indigo-600"
                  />
                  <span className="text-slate-700">
                    جميع السجلات (من 1 إلى {dataRows.length})
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="exportMode"
                    checked={exportMode === 'range'}
                    onChange={() => setExportMode('range')}
                    className="w-3.5 h-3.5 text-indigo-600"
                  />
                  <span className="text-slate-700">تحديد نطاق مخصص</span>
                </label>
              </div>

              {exportMode === 'range' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">من سطر:</label>
                    <input
                      type="number"
                      min="1"
                      max={dataRows.length}
                      value={customStart}
                      onChange={(e) => setCustomStart(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">إلى سطر:</label>
                    <input
                      type="number"
                      min="1"
                      max={dataRows.length}
                      value={customEnd}
                      onChange={(e) => setCustomEnd(Math.min(dataRows.length, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Progress indicator during exporting */}
            {isExporting && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-700">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    جاري توليد ملف PDF...
                  </span>
                  <span className="font-mono text-indigo-700 font-bold">{exportProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${exportProgress}%` }}
                    className="h-full bg-indigo-600 transition-all duration-300"
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 text-center font-mono">
                  معالجة الصفحة {currentPage} من {totalPages}
                </p>
              </div>
            )}

            {/* Start export button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleStartExport}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded text-xs shadow-2xs flex items-center justify-center gap-1.5 transition"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  بدء التصدير والتنزيل
                </>
              )}
            </button>
          </div>
        ) : (
          /* Finished State */
          <div className="text-center space-y-3 py-1">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-slate-900">تم إنشاء ملف PDF بنجاح!</h4>
              <p className="text-[11px] text-slate-500">
                المستند جاهز الآن للتحميل والطباعة.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadFile}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs shadow-2xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                تحميل ملف PDF
              </button>

              <button
                type="button"
                onClick={() => setIsFinished(false)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition"
              >
                تصدير دفعة أخرى
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
