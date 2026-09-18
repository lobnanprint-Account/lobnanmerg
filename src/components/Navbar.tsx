import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FolderOpen,
  HelpCircle,
  Info,
  Layers,
  Printer,
  RotateCcw,
  Save,
  Settings,
  Type,
  Upload,
  Zap,
  Eye,
} from 'lucide-react';
import { TemplatePreset } from '../types';

interface NavbarProps {
  activePresetId: string;
  onSelectPreset: (preset: TemplatePreset) => void;
  onResetAll?: () => void;
  onOpenPreviewModal: () => void;
  onOpenExportModal: () => void;
  onDownloadSampleExcel: () => void;
  onTriggerFileUpload: () => void;
  onExportProject: () => void;
  onTriggerImportProject: () => void;
  totalRecords: number;
  fileName?: string;
  onAddManualTextBox?: () => void;
  onAutoPartitionLayers?: () => void;
  activeTab: 'setup' | 'data' | 'style';
  onChangeTab: (tab: 'setup' | 'data' | 'style') => void;
  elementsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onResetAll,
  onOpenPreviewModal,
  onOpenExportModal,
  onDownloadSampleExcel,
  onTriggerFileUpload,
  onExportProject,
  onTriggerImportProject,
  totalRecords,
  fileName,
  onAddManualTextBox,
  onAutoPartitionLayers,
  activeTab,
  onChangeTab,
  elementsCount,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const toggleDropdown = (menu: string) => {
    setActiveDropdown((prev) => (prev === menu ? null : menu));
  };

  const closeDropdowns = () => setActiveDropdown(null);

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 select-none z-40 sticky top-0 shadow-xs">
      {/* 1. Official Desktop Title Bar (Light Theme) */}
      <div className="h-8 bg-slate-100 border-b border-slate-200 px-3 flex items-center justify-between text-xs text-slate-600 font-mono">
        {/* Left: App Title and Document Info */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-800 shadow-2xs">
            <img src="/alayham_logo.svg" alt="شعار" className="w-3.5 h-3.5 object-contain" />
            <span className="font-sans font-bold text-slate-900 text-[11px]">برنامج الأيهم للطباعة والدمج</span>
            <span className="text-[9px] text-slate-500 font-mono">v3.5</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700 text-[11px] font-sans truncate max-w-xs font-medium">
            {fileName ? `ملف: ${fileName}` : 'مشروع جديد'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            جاهز
          </span>
        </div>

        {/* Right: Author / License note */}
        <div className="flex items-center gap-3 text-[11px] font-sans">
          <span className="text-slate-500 hidden md:inline">
            مطبعة ومكتبة لبنان • م. رائد صالحة
          </span>
        </div>
      </div>

      {/* 2. Menu Bar (ملف / تحرير / عرض / مساعدة) */}
      <div className="h-7 bg-slate-50 border-b border-slate-200 px-2 flex items-center gap-1 text-[11px] font-sans text-slate-700 relative">
        {/* ملف File Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('file')}
            className={`px-2 py-0.5 rounded hover:bg-slate-200 transition ${
              activeDropdown === 'file' ? 'bg-slate-200 text-slate-900 font-bold' : ''
            }`}
          >
            ملف (File)
          </button>
          {activeDropdown === 'file' && (
            <div
              onMouseLeave={closeDropdowns}
              className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-300 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800 divide-y divide-slate-100"
            >
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onTriggerImportProject();
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                    فتح مشروع سابق (.json)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+O</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onExportProject();
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 text-amber-600" />
                    حفظ القالب والمشروع (.json)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+S</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onTriggerFileUpload();
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    استيراد ملف إكسل...
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onDownloadSampleExcel();
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                    تحميل نموذج إكسل تجريبي
                  </span>
                </button>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onOpenExportModal();
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-indigo-50 flex items-center justify-between transition text-indigo-700 font-bold"
                >
                  <span className="flex items-center gap-2">
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    تصدير وطباعة PDF
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ctrl+P</span>
                </button>
              </div>

              {onResetAll && (
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeDropdowns();
                      onResetAll();
                    }}
                    className="w-full text-right px-3 py-1.5 hover:bg-rose-50 text-rose-700 flex items-center justify-between transition text-[11px]"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5" />
                      تصفير وبدء مشروع جديد
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* تحرير Edit Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('edit')}
            className={`px-2 py-0.5 rounded hover:bg-slate-200 transition ${
              activeDropdown === 'edit' ? 'bg-slate-200 text-slate-900 font-bold' : ''
            }`}
          >
            تحرير (Edit)
          </button>
          {activeDropdown === 'edit' && (
            <div
              onMouseLeave={closeDropdowns}
              className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-300 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800"
            >
              {onAddManualTextBox && (
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onAddManualTextBox();
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-indigo-600" />
                    إضافة مربع نص جديد
                  </span>
                </button>
              )}
              {onAutoPartitionLayers && (
                <button
                  type="button"
                  onClick={() => {
                    closeDropdowns();
                    onAutoPartitionLayers();
                  }}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    توليد وتقسيم الليرات تلقائياً
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* عرض View Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('view')}
            className={`px-2 py-0.5 rounded hover:bg-slate-200 transition ${
              activeDropdown === 'view' ? 'bg-slate-200 text-slate-900 font-bold' : ''
            }`}
          >
            عرض (View)
          </button>
          {activeDropdown === 'view' && (
            <div
              onMouseLeave={closeDropdowns}
              className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-300 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800"
            >
              <button
                type="button"
                onClick={() => {
                  closeDropdowns();
                  onOpenPreviewModal();
                }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  معاينة الورقة بالكامل
                </span>
                <span className="text-[10px] text-slate-400 font-mono">F5</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeDropdowns();
                  onChangeTab('setup');
                }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
              >
                <span>إعدادات القياسات والتقسيم</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeDropdowns();
                  onChangeTab('data');
                }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
              >
                <span>مصدر بيانات الإكسل</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeDropdowns();
                  onChangeTab('style');
                }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition"
              >
                <span>مستكشف الطبقات والخصائص</span>
              </button>
            </div>
          )}
        </div>

        {/* مساعدة Help Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('help')}
            className={`px-2 py-0.5 rounded hover:bg-slate-200 transition ${
              activeDropdown === 'help' ? 'bg-slate-200 text-slate-900 font-bold' : ''
            }`}
          >
            مساعدة (Help)
          </button>
          {activeDropdown === 'help' && (
            <div
              onMouseLeave={closeDropdowns}
              className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-300 rounded-md shadow-xl py-1 z-50 text-xs text-slate-800"
            >
              <button
                type="button"
                onClick={() => {
                  closeDropdowns();
                  setShowShortcutsModal(true);
                }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                اختصارات لوحة المفاتيح
              </button>
              <button
                type="button"
                onClick={() => {
                  closeDropdowns();
                  setShowAboutModal(true);
                }}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" />
                حول البرنامج
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Official Desktop Command Ribbon / Toolbar (Light Mode) */}
      <div className="h-10 bg-white border-b border-slate-200 px-3 flex items-center justify-between gap-3 text-xs">
        {/* Right side in RTL: Workspace status info */}
        <div className="flex items-center gap-2">
          {fileName && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[11px]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium truncate max-w-[200px]">{fileName}</span>
              <span className="text-slate-400">({totalRecords} سجل)</span>
            </div>
          )}
        </div>

        {/* Left side in RTL (أقصى اليسار): Four primary action buttons side by side */}
        <div className="flex items-center gap-1.5">
          {/* فتح قالب */}
          <button
            type="button"
            onClick={onTriggerImportProject}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition shadow-2xs"
            title="فتح قالب أو مشروع (.json) من جهازك"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>فتح قالب</span>
          </button>

          {/* حفظ قالب */}
          <button
            type="button"
            onClick={onExportProject}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-amber-800 rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition shadow-2xs"
            title="حفظ القالب والمشروع الحالي في ملف (.json)"
          >
            <Save className="w-3.5 h-3.5 text-amber-600" />
            <span>حفظ قالب</span>
          </button>

          {/* المعاينة */}
          <button
            type="button"
            onClick={onOpenPreviewModal}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition shadow-2xs"
            title="معاينة الورقة المطبوعة بالكامل مع بيانات الإكسل"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>المعاينة</span>
          </button>

          {/* التصدير */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 border border-indigo-700"
            title="توليد وتصدير ملف PDF عالي الجودة للطباعة"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>التصدير</span>
            {totalRecords > 0 && (
              <span className="bg-indigo-800 text-white text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                {totalRecords}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-300 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <img src="/alayham_logo.svg" alt="شعار" className="h-7 w-auto" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">برنامج الأيهم للطباعة والدمج v3.5</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Enterprise Printing & Mail Merge Engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                برنامج متخصص لدمج وطباعة الشهادات والبطاقات وقسائم السحب مع ملفات الإكسل بدقة متوافقة مع المطابع.
              </p>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">المطور:</span>
                  <span className="font-bold text-slate-800">مطبعة ومكتبة لبنان</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الإشراف:</span>
                  <span className="font-bold text-slate-800">م. رائد صالحة</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-300 rounded-lg max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                اختصارات لوحة المفاتيح
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
                  <span className="text-slate-700">تحريك اللير</span>
                  <span className="font-mono text-slate-900 font-bold">↑ ↓ ← →</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
                  <span className="text-slate-700">تحريك سريع</span>
                  <span className="font-mono text-slate-900 font-bold">Shift + الأسهم</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
                  <span className="text-slate-700">تحريك مجهري</span>
                  <span className="font-mono text-slate-900 font-bold">Alt + الأسهم</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200 flex justify-between">
                  <span className="text-slate-700">حفظ القالب</span>
                  <span className="font-mono text-indigo-700 font-bold">Ctrl + S</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold"
              >
                موافق
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
