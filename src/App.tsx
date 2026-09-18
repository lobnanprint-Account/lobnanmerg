import React, { useEffect, useState } from 'react';
import {
  Award,
  CreditCard,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  Grid,
  Layers,
  Printer,
  Sliders,
  Sparkles,
  Tag,
  Type,
  Upload,
} from 'lucide-react';

import { DataPanel } from './components/DataPanel';
import { EditorCanvas } from './components/EditorCanvas';
import { ExportModal } from './components/ExportModal';
import { Navbar } from './components/Navbar';
import { PreviewSheetModal } from './components/PreviewSheetModal';
import { SetupPanel } from './components/SetupPanel';
import { StylePanel } from './components/StylePanel';
import { DuplicateLineModal } from './components/DuplicateLineModal';

import { PRESET_TEMPLATES } from './data/presetTemplates';
import {
  DataRow,
  FieldElement,
  GridSetup,
  PaperDimensions,
  PaperOrientation,
  PaperSize,
  RowRange,
  TemplatePreset,
  TextEffect,
} from './types';
import { downloadSampleExcel, parseExcelFile } from './utils/excelParser';
import {
  clearLocalStorageState,
  exportProjectToFile,
  importProjectFromFile,
  loadFromLocalStorage,
  saveToLocalStorage,
} from './utils/projectStorage';
import { getSlotConfig } from './utils/elementUtils';

export default function App() {
  // Preset default (Blank Zeroed Preset)
  const defaultPreset = PRESET_TEMPLATES[0];

  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);
  const [orientation, setOrientation] = useState<PaperOrientation>('landscape');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [paperDimensions, setPaperDimensions] = useState<PaperDimensions>({ widthMm: 297, heightMm: 210 });
  const [grid, setGrid] = useState<GridSetup>({
    rows: 1,
    cols: 1,
    marginTopMm: 0,
    marginBottomMm: 0,
    marginLeftMm: 0,
    marginRightMm: 0,
    gapHorizontalMm: 0,
    gapVerticalMm: 0,
  });
  const [bgImageUrl, setBgImageUrl] = useState<string>('');
  const [elements, setElements] = useState<FieldElement[]>([]);

  // Data State - starts zeroed out
  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>(['الورقة الأولى']);
  const [activeSheet, setActiveSheet] = useState<string>('الورقة الأولى');
  const [allSheetsData, setAllSheetsData] = useState<Record<string, { headers: string[]; rows: DataRow[] }>>({});
  const [fileName, setFileName] = useState<string>('');
  const [activeRecordIndex, setActiveRecordIndex] = useState<number>(0);

  // Range Slicing State
  const [rowRange, setRowRange] = useState<RowRange>({
    startRow: 1,
    endRow: 1,
    enabled: false,
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'setup' | 'data' | 'style'>('setup');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [hoverPreviewFont, setHoverPreviewFont] = useState<string | null>(null);
  const [duplicateModalElement, setDuplicateModalElement] = useState<FieldElement | null>(null);

  // Initial Load: Restore from LocalStorage if user previously worked on a project
  useEffect(() => {
    const saved = loadFromLocalStorage();
    if (saved) {
      if (saved.orientation) setOrientation(saved.orientation);
      if (saved.paperSize) setPaperSize(saved.paperSize);
      if (saved.paperDimensions) setPaperDimensions(saved.paperDimensions);
      if (saved.grid) setGrid(saved.grid);
      if (saved.bgImageUrl !== undefined) setBgImageUrl(saved.bgImageUrl);
      if (Array.isArray(saved.elements)) setElements(saved.elements);
      if (Array.isArray(saved.dataRows)) setDataRows(saved.dataRows);
      if (Array.isArray(saved.headers)) setHeaders(saved.headers);
      if (Array.isArray(saved.sheetNames)) setSheetNames(saved.sheetNames);
      if (saved.activeSheet) setActiveSheet(saved.activeSheet);
      if (saved.fileName) setFileName(saved.fileName);
      if (typeof saved.activeRecordIndex === 'number') setActiveRecordIndex(saved.activeRecordIndex);
      if (saved.rowRange) setRowRange(saved.rowRange);
      if (saved.activePresetId) setActivePresetId(saved.activePresetId);
    }
  }, []);

  // Auto-Save to LocalStorage on changes
  useEffect(() => {
    saveToLocalStorage({
      orientation,
      paperSize,
      paperDimensions,
      grid,
      bgImageUrl,
      elements,
      dataRows,
      headers,
      sheetNames,
      activeSheet,
      fileName,
      activeRecordIndex,
      rowRange,
      activePresetId,
    });
  }, [
    orientation,
    paperSize,
    paperDimensions,
    grid,
    bgImageUrl,
    elements,
    dataRows,
    headers,
    sheetNames,
    activeSheet,
    fileName,
    activeRecordIndex,
    rowRange,
    activePresetId,
  ]);

  // Export Project File (.mrg.json)
  const handleExportProject = () => {
    exportProjectToFile(
      {
        orientation,
        paperSize,
        paperDimensions,
        grid,
        bgImageUrl,
        elements,
        dataRows,
        headers,
        fileName,
        sheetNames,
        activeSheet,
        activeRecordIndex,
        rowRange,
        activePresetId,
      },
      fileName ? `قالب_${fileName.replace(/\.[^/.]+$/, '')}` : undefined
    );
  };

  // Import Project File (.mrg.json)
  const handleImportProjectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProjectFromFile(file);
      if (imported.orientation) setOrientation(imported.orientation);
      if (imported.paperSize) setPaperSize(imported.paperSize);
      if (imported.paperDimensions) setPaperDimensions(imported.paperDimensions);
      if (imported.grid) setGrid(imported.grid);
      if (imported.bgImageUrl !== undefined) setBgImageUrl(imported.bgImageUrl);
      if (Array.isArray(imported.elements)) setElements(imported.elements);
      if (Array.isArray(imported.dataRows) && imported.dataRows.length > 0) setDataRows(imported.dataRows);
      if (Array.isArray(imported.headers) && imported.headers.length > 0) setHeaders(imported.headers);
      if (Array.isArray(imported.sheetNames)) setSheetNames(imported.sheetNames);
      if (imported.activeSheet) setActiveSheet(imported.activeSheet);
      if (imported.fileName) setFileName(imported.fileName);
      if (typeof imported.activeRecordIndex === 'number') setActiveRecordIndex(imported.activeRecordIndex);
      if (imported.rowRange) setRowRange(imported.rowRange);
      if (imported.activePresetId) setActivePresetId(imported.activePresetId);

      // Feedback notification
      alert('تم استرجاع قالب التصميم المحفوظ بنجاح بجميع أشكال ومربعات النص والقياسات!');
    } catch (err: any) {
      alert(err.message || 'فشل استرجاع قالب التصميم.');
    } finally {
      e.target.value = '';
    }
  };

  // Zero out / Reset entire workspace
  const handleResetAll = () => {
    if (window.confirm('هل أنت تأكد من تصفير الكانفاس وحذف عناصر التصميم الحالية؟')) {
      clearLocalStorageState();
      setBgImageUrl('');
      setElements([]);
      setDataRows([]);
      setHeaders([]);
      setFileName('');
      setSelectedElementId(null);
      setActiveRecordIndex(0);
      setRowRange({
        startRow: 1,
        endRow: 1,
        enabled: false,
      });
    }
  };

  // Switch Template Preset
  const handleSelectPreset = (preset: TemplatePreset) => {
    setActivePresetId(preset.id);
    setOrientation(preset.orientation);
    setPaperSize(preset.paperSize);
    setPaperDimensions(preset.paperDimensions);
    setGrid(preset.grid);
    setBgImageUrl(preset.bgImageUrl);
    setElements(preset.elements);
    setDataRows(preset.sampleData);
    if (preset.sampleData.length > 0) {
      setHeaders(Object.keys(preset.sampleData[0]).filter((k) => k !== '_id'));
    }
    setActiveRecordIndex(0);
    setRowRange({
      startRow: 1,
      endRow: Math.max(1, preset.sampleData.length),
      enabled: false,
    });
  };

  // Upload Excel / CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelFile(file);
      setFileName(parsed.fileName);
      setSheetNames(parsed.sheetNames);
      setActiveSheet(parsed.activeSheet);
      setHeaders(parsed.headers);
      setDataRows(parsed.rows);
      setAllSheetsData(parsed.allSheets);
      setActiveRecordIndex(0);
      setRowRange({
        startRow: 1,
        endRow: parsed.rows.length,
        enabled: false,
      });

      // Switch tab to data tab for feedback
      setActiveTab('data');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ عند قراءة الملف');
    }
  };

  // Switch Sheet handler
  const handleSelectSheet = (sheetName: string) => {
    setActiveSheet(sheetName);
    if (allSheetsData[sheetName]) {
      const sheetInfo = allSheetsData[sheetName];
      setHeaders(sheetInfo.headers);
      setDataRows(sheetInfo.rows);
      setActiveRecordIndex(0);
      setRowRange({
        startRow: 1,
        endRow: sheetInfo.rows.length,
        enabled: false,
      });
    }
  };

  // Download Sample Excel
  const handleDownloadSample = () => {
    downloadSampleExcel(headers, dataRows, `نموذج_إكسل_${activePresetId}.xlsx`);
  };

  // Add field to canvas
  const handleAddFieldToCanvas = (fieldName: string) => {
    const newId = `el-${Date.now()}`;
    const newElement: FieldElement = {
      id: newId,
      type: 'field',
      fieldName,
      xPercent: 50,
      yPercent: 50,
      visible: true,
      style: {
        fontFamily: 'Cairo',
        fontSize: 24,
        fontWeight: '700',
        fontStyle: 'normal',
        color: '#1e293b',
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        lineHeight: 1.2,
        letterSpacing: 0,
        shadow: { enabled: false, color: 'rgba(0,0,0,0.3)', offsetX: 2, offsetY: 2, blur: 4 },
        stroke: { enabled: false, color: '#000000', width: 1 },
        bg: { enabled: false, color: '#ffffff', padding: 4, borderRadius: 4 },
      },
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newId);
    setActiveTab('style');
  };

  // Add Static Text
  const handleAddStaticText = () => {
    const newId = `el-${Date.now()}`;
    const newElement: FieldElement = {
      id: newId,
      type: 'static_text',
      staticText: 'نص جديد ثابت',
      xPercent: 50,
      yPercent: 50,
      visible: true,
      style: {
        fontFamily: 'Cairo',
        fontSize: 20,
        fontWeight: '600',
        fontStyle: 'normal',
        color: '#475569',
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        lineHeight: 1.2,
        letterSpacing: 0,
        shadow: { enabled: false, color: 'rgba(0,0,0,0.3)', offsetX: 2, offsetY: 2, blur: 4 },
        stroke: { enabled: false, color: '#000000', width: 1 },
        bg: { enabled: false, color: '#ffffff', padding: 4, borderRadius: 4 },
      },
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newId);
    setActiveTab('style');
  };

  // Add QR code
  const handleAddQrCode = () => {
    if (headers.length === 0) return;
    const newId = `el-${Date.now()}`;
    const newElement: FieldElement = {
      id: newId,
      type: 'qr_code',
      fieldName: headers[0],
      xPercent: 80,
      yPercent: 80,
      visible: true,
      style: {
        fontFamily: 'Cairo',
        fontSize: 14,
        fontWeight: '400',
        fontStyle: 'normal',
        color: '#000000',
        textAlign: 'center',
        rotation: 0,
        opacity: 1,
        lineHeight: 1,
        letterSpacing: 0,
        shadow: { enabled: false, color: '', offsetX: 0, offsetY: 0, blur: 0 },
        stroke: { enabled: false, color: '', width: 0 },
        bg: { enabled: false, color: '', padding: 0, borderRadius: 0 },
      },
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newId);
    setActiveTab('style');
  };

  // Update Element Position
  const handleUpdateElementPosition = (id: string, xPercent: number, yPercent: number) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, xPercent, yPercent } : el))
    );
  };

  // Update Element Style
  const handleChangeElementStyle = (id: string, updatedStyle: TextEffect) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, style: updatedStyle } : el))
    );
  };

  // Update Element Prop
  const handleChangeElementProp = (id: string, updates: Partial<FieldElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  // Delete Element
  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Open modal for duplication & line range selection
  const handleOpenDuplicateModal = (id: string) => {
    const original = elements.find((el) => el.id === id);
    if (original) {
      setDuplicateModalElement(original);
    }
  };

  // Confirm duplication with configured lines
  const handleConfirmDuplicateWithConfig = (
    sourceId: string,
    customRowConfig: any,
    positionOffset: { deltaX: number; deltaY: number }
  ) => {
    const original = elements.find((el) => el.id === sourceId);
    if (!original) return;

    const newId = `field-${Date.now()}`;
    const newElement: FieldElement = {
      ...original,
      id: newId,
      xPercent: Math.min(95, Math.max(5, original.xPercent + positionOffset.deltaX)),
      yPercent: Math.min(95, Math.max(5, original.yPercent + positionOffset.deltaY)),
      customRowConfig,
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newId);
    setActiveTab('style');
  };

  // Replicate a specific layer or column across all sheet slots (e.g. 4 copies for 2x2 grid with customizable row spans)
  const handleReplicateLayerAcrossSlots = (
    sourceElementId?: string,
    spanPerSlot: number = 20,
    targetFieldName?: string
  ) => {
    const totalSlots = (grid.rows || 2) * (grid.cols || 2);
    let baseElement = sourceElementId ? elements.find((e) => e.id === sourceElementId) : null;

    if (!baseElement && targetFieldName) {
      baseElement = elements.find((e) => e.fieldName === targetFieldName) || null;
    }

    if (!baseElement && elements.length > 0) {
      baseElement = elements.find((e) => e.type === 'field') || elements[0];
    }

    const fieldName = targetFieldName || baseElement?.fieldName || headers[0] || 'العمود A';

    // Create base template if none exists
    const template: FieldElement = baseElement
      ? { ...baseElement }
      : {
          id: `field-auto-${Date.now()}`,
          type: 'field',
          fieldName,
          label: `حقل: [ ${fieldName} ]`,
          xPercent: 50,
          yPercent: 50,
          style: {
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: '600',
            fontStyle: 'normal',
            color: '#1e293b',
            textAlign: 'center',
            rotation: 0,
            opacity: 1,
            lineHeight: 1.2,
            letterSpacing: 0,
            shadow: { enabled: false, color: 'rgba(0,0,0,0.3)', offsetX: 2, offsetY: 2, blur: 4 },
            stroke: { enabled: false, color: '#000000', width: 1 },
            bg: { enabled: false, color: '#ffffff', padding: 4, borderRadius: 4 },
          },
          visible: true,
        };

    const cleanName = (template.fieldName || template.label || fieldName)
      .replace(/\s*\(قسم\s*\d+:.*?\)/g, '')
      .trim();

    const newLayers: FieldElement[] = [];
    for (let slotIdx = 0; slotIdx < totalSlots; slotIdx++) {
      const startRow = slotIdx * spanPerSlot + 1;
      const endRow = (slotIdx + 1) * spanPerSlot;

      newLayers.push({
        ...template,
        id: `layer-slot-${slotIdx + 1}-${Date.now()}-${slotIdx}`,
        type: template.type || 'field',
        fieldName: fieldName,
        label: `${cleanName} (قسم ${slotIdx + 1}: ${startRow}-${endRow})`,
        targetSlotIndex: slotIdx,
        visible: true,
        customRowConfig: {
          enabled: true,
          mode: 'range',
          startRow,
          endRow,
          fixedRow: 1,
          offset: 0,
        },
      });
    }

    setElements((prev) => {
      const others = baseElement ? prev.filter((e) => e.id !== baseElement!.id) : prev;
      return [...others, ...newLayers];
    });

    if (newLayers.length > 0) {
      setSelectedElementId(newLayers[0].id);
    }
    setActiveTab('style');
  };

  // Reset Layout
  const handleResetLayout = () => {
    setGrid(defaultPreset.grid);
    setOrientation(defaultPreset.orientation);
    setPaperSize(defaultPreset.paperSize);
    setPaperDimensions(defaultPreset.paperDimensions);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;
  const activeRecord = dataRows[activeRecordIndex] || ({} as DataRow);

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden select-none">
      {/* Header Bar (Fixed at Top) */}
      <Navbar
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onResetAll={handleResetAll}
        onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onDownloadSampleExcel={handleDownloadSample}
        onTriggerFileUpload={() => {
          const fileInput = document.getElementById('global-excel-input');
          if (fileInput) fileInput.click();
        }}
        onExportProject={handleExportProject}
        onTriggerImportProject={() => {
          const projectInput = document.getElementById('global-project-input');
          if (projectInput) projectInput.click();
        }}
        totalRecords={dataRows.length}
        fileName={fileName}
        onAddManualTextBox={handleAddStaticText}
        onAutoPartitionLayers={() => handleReplicateLayerAcrossSlots(selectedElementId || undefined)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        elementsCount={elements.length}
      />

      {/* Hidden Global File Inputs */}
      <input
        id="global-excel-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        id="global-project-input"
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportProjectFile}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-200">
        {/* Left Sidebar Controls Panel (Docked Inspector / Toolbox) */}
        <aside className="w-full md:w-[410px] bg-white border-l border-slate-300 flex flex-col shrink-0 z-20 shadow-sm">
          {/* Main Sidebar Navigation Tabs (Light Desktop Studio Style) */}
          <div className="flex border-b border-slate-200 bg-slate-100 p-1 text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1.5 transition border ${
                activeTab === 'setup'
                  ? 'bg-white text-indigo-700 border-slate-300 shadow-2xs font-bold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              1. القياسات والتقسيم
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1.5 transition border ${
                activeTab === 'data'
                  ? 'bg-white text-indigo-700 border-slate-300 shadow-2xs font-bold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              2. الإكسل والبيانات
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1.5 transition border relative ${
                activeTab === 'style'
                  ? 'bg-white text-indigo-700 border-slate-300 shadow-2xs font-bold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              3. الطبقات والخصائص
              {elements.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {elements.length}
                </span>
              )}
            </button>
          </div>

          {/* Sidebar Tab Content Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50">
            {activeTab === 'setup' && (
              <SetupPanel
                orientation={orientation}
                onChangeOrientation={setOrientation}
                paperSize={paperSize}
                onChangePaperSize={setPaperSize}
                paperDimensions={paperDimensions}
                onChangePaperDimensions={setPaperDimensions}
                grid={grid}
                onChangeGrid={setGrid}
                bgImageUrl={bgImageUrl}
                onChangeBgImage={setBgImageUrl}
                onResetLayout={handleResetLayout}
                onExportProject={handleExportProject}
                onTriggerImportProject={() => {
                  const projectInput = document.getElementById('global-project-input');
                  if (projectInput) projectInput.click();
                }}
                totalRecordsCount={dataRows.length}
              />
            )}

            {activeTab === 'data' && (
              <DataPanel
                fileName={fileName}
                sheetNames={sheetNames}
                activeSheet={activeSheet}
                onSelectSheet={handleSelectSheet}
                headers={headers}
                rows={dataRows}
                onUploadFile={handleFileUpload}
                onAddFieldToCanvas={handleAddFieldToCanvas}
                rowRange={rowRange}
                onChangeRowRange={setRowRange}
                activeRecordIndex={activeRecordIndex}
                onSelectRecordIndex={setActiveRecordIndex}
              />
            )}

            {activeTab === 'style' && (
              <StylePanel
                elements={elements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                selectedElement={selectedElement}
                onChangeElementStyle={handleChangeElementStyle}
                onChangeElementProp={handleChangeElementProp}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleOpenDuplicateModal}
                onHoverPreviewFont={setHoverPreviewFont}
                onAddStaticText={handleAddStaticText}
                onAddQrCode={handleAddQrCode}
                headers={headers}
                grid={grid}
                totalRecordsCount={dataRows.length}
                onReplicateLayerAcrossSlots={handleReplicateLayerAcrossSlots}
              />
            )}
          </div>
        </aside>

        {/* Center Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-200">
          <EditorCanvas
            bgImageUrl={bgImageUrl}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={(id) => {
              setSelectedElementId(id);
              if (id) setActiveTab('style');
            }}
            onUpdateElementPosition={handleUpdateElementPosition}
            onChangeElementStyle={handleChangeElementStyle}
            onChangeElementProp={handleChangeElementProp}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleOpenDuplicateModal}
            hoverPreviewFont={hoverPreviewFont}
            dataRows={dataRows}
            activeRecord={activeRecord}
            activeRecordIndex={activeRecordIndex}
            totalRecords={dataRows.length}
            onSelectRecordIndex={setActiveRecordIndex}
            onAddManualTextBox={handleAddStaticText}
            paperOrientation={orientation}
            paperSize={paperSize}
            paperWidthMm={paperDimensions.widthMm}
            paperHeightMm={paperDimensions.heightMm}
            grid={grid}
          />
        </main>
      </div>

      {/* 4. Desktop IDE Bottom Status Bar (Light Mode) */}
      <footer className="h-6 bg-slate-100 border-t border-slate-300 px-3 flex items-center justify-between text-[11px] text-slate-600 font-mono select-none shrink-0 z-30">
        {/* Left items: System readiness & Dimensions */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-700 font-sans font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            جاهز
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700 font-sans">
            الورقة: <span className="font-mono font-bold">{paperSize}</span> ({paperDimensions.widthMm} × {paperDimensions.heightMm} مم)
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700 font-sans">
            التقسيم: <span className="font-mono font-bold">{grid.cols} × {grid.rows}</span> ({grid.cols * grid.rows} أقسام)
          </span>
        </div>

        {/* Center/Right items: Layer coordinates & Data status */}
        <div className="flex items-center gap-3">
          {selectedElement ? (
            <span className="text-indigo-800 font-bold bg-indigo-50 px-2 py-0.2 rounded border border-indigo-200">
              اللير: {selectedElement.label || selectedElement.fieldName || 'نص'} [X: {selectedElement.xPercent}% Y: {selectedElement.yPercent}%]
            </span>
          ) : (
            <span className="text-slate-400">لا يوجد لير محدد</span>
          )}
          <span className="text-slate-300">|</span>
          <span className="text-slate-700 font-sans">
            السجلات: <span className="font-mono font-bold">{dataRows.length > 0 ? `${activeRecordIndex + 1} / ${dataRows.length}` : '0'}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 text-[10px]">
            v3.5
          </span>
        </div>
      </footer>

      {/* Duplicate Line Range Modal */}
      <DuplicateLineModal
        isOpen={!!duplicateModalElement}
        onClose={() => setDuplicateModalElement(null)}
        element={duplicateModalElement}
        onConfirmDuplicate={handleConfirmDuplicateWithConfig}
        totalRecordsCount={dataRows.length || 200}
      />

      {/* Preview Sheet Modal */}
      <PreviewSheetModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        orientation={orientation}
        paperSize={paperSize}
        paperWidthMm={paperDimensions.widthMm}
        paperHeightMm={paperDimensions.heightMm}
        grid={grid}
        bgImageUrl={bgImageUrl}
        elements={elements}
        dataRows={dataRows}
        activeRecordIndex={activeRecordIndex}
        onTriggerPdfExport={() => setIsExportModalOpen(true)}
      />

      {/* Export PDF Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        orientation={orientation}
        paperSize={paperSize}
        paperWidthMm={paperDimensions.widthMm}
        paperHeightMm={paperDimensions.heightMm}
        grid={grid}
        bgImageUrl={bgImageUrl}
        elements={elements}
        dataRows={dataRows}
        rowRange={rowRange}
      />
    </div>
  );
}
