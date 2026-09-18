import React, { useState, useRef, useEffect } from 'react';
import { Search, Type, Check, Monitor, Upload, X, ChevronDown } from 'lucide-react';
import { FontOption } from '../utils/fontManager';

interface SearchableFontPickerProps {
  value: string;
  onChange: (fontValue: string) => void;
  onHoverPreview?: (fontValue: string | null) => void;
  fontList: FontOption[];
  onQueryWindowsFonts?: () => void;
  onUploadFontFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingFonts?: boolean;
  fontStatus?: string;
  className?: string;
}

export const SearchableFontPicker: React.FC<SearchableFontPickerProps> = ({
  value,
  onChange,
  onHoverPreview,
  fontList,
  onQueryWindowsFonts,
  onUploadFontFile,
  isLoadingFonts,
  fontStatus,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'windows' | 'web' | 'custom'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onHoverPreview) onHoverPreview(null);
        setHoveredFont(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onHoverPreview]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const currentFontObj = fontList.find((f) => f.value === value) || {
    name: value,
    value: value,
    category: 'windows' as const,
  };

  const filteredFonts = fontList.filter((f) => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleItemHover = (fontVal: string) => {
    setHoveredFont(fontVal);
    if (onHoverPreview) {
      onHoverPreview(fontVal);
    }
  };

  const handleItemLeave = () => {
    setHoveredFont(null);
    if (onHoverPreview) {
      onHoverPreview(null);
    }
  };

  const handleSelect = (fontVal: string) => {
    onChange(fontVal);
    if (onHoverPreview) {
      onHoverPreview(null);
    }
    setHoveredFont(null);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white hover:bg-slate-50 border border-slate-300 hover:border-indigo-500 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 flex items-center justify-between gap-2 transition"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Type className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate font-sans" style={{ fontFamily: value }}>
            {currentFontObj.name}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-300 rounded shadow-lg z-50 overflow-hidden flex flex-col max-h-96 w-full min-w-[260px]">
          {/* Header & Search Bar */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 space-y-1.5 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث عن خط..."
                className="w-full bg-white border border-slate-300 rounded pr-8 pl-7 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-0.5 rounded shrink-0 transition ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل ({fontList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('windows')}
                className={`px-2 py-0.5 rounded shrink-0 flex items-center gap-1 transition ${
                  activeCategory === 'windows'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-2.5 h-2.5" />
                ويندوز ({fontList.filter((f) => f.category === 'windows').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('web')}
                className={`px-2 py-0.5 rounded shrink-0 transition ${
                  activeCategory === 'web'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                ويب ({fontList.filter((f) => f.category === 'web').length})
              </button>
              {fontList.some((f) => f.category === 'custom') && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('custom')}
                  className={`px-2 py-0.5 rounded shrink-0 transition ${
                    activeCategory === 'custom'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مرفوعة ({fontList.filter((f) => f.category === 'custom').length})
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Font Options List */}
          <div
            className="overflow-y-auto p-1 space-y-0.5 flex-1 max-h-52"
            onMouseLeave={handleItemLeave}
          >
            {filteredFonts.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                لم يتم العثور على خط يطابق "{searchQuery}"
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isSelected = font.value === value;
                const isHovered = font.value === hoveredFont;

                return (
                  <button
                    type="button"
                    key={font.value}
                    onMouseEnter={() => handleItemHover(font.value)}
                    onClick={() => handleSelect(font.value)}
                    className={`w-full text-right px-2.5 py-1.5 rounded transition flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-300 text-indigo-900 font-bold'
                        : isHovered
                        ? 'bg-slate-100 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <span className="text-xs font-semibold truncate block">
                        {font.name}
                      </span>
                      <p
                        className="text-xs truncate text-slate-500 font-normal leading-tight mt-0.5"
                        style={{ fontFamily: font.value }}
                      >
                        أبجد هوز 123 (Sample Text)
                      </p>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mr-1" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Action Footer */}
          {(onQueryWindowsFonts || onUploadFontFile) && (
            <div className="p-1.5 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-1 shrink-0 text-xs font-medium">
              {onQueryWindowsFonts && (
                <button
                  type="button"
                  onClick={onQueryWindowsFonts}
                  disabled={isLoadingFonts}
                  className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 flex items-center justify-center gap-1 transition"
                >
                  <Monitor className="w-3 h-3 text-indigo-600" />
                  جلب خطوط ويندوز
                </button>
              )}

              {onUploadFontFile && (
                <label className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 flex items-center justify-center gap-1 cursor-pointer transition">
                  <Upload className="w-3 h-3 text-emerald-600" />
                  <span>رفع خط من الجهاز</span>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    multiple
                    onChange={onUploadFontFile}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {fontStatus && (
            <div className="p-1 bg-amber-50 text-[10px] text-amber-800 text-center border-t border-amber-200 truncate">
              {fontStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
