import React, { useState, useRef, useEffect } from 'react';
import { Filter, List, Network, ArrowLeftRight, ArrowDownUp, Settings, Search, ChevronRight, ChevronLeft, X, ArrowUpNarrowWide, Users } from 'lucide-react';
import ActionButton from './common/ActionButton.jsx';
import SearchBar from './SearchBar.jsx';

const FloatingToolbar = ({
  currentView,
  onViewChange,
  currentOrientation,
  onOrientationChange,
  onShowAll,
  onDirectLineToggle,
  directLineActive,
  generations,
  onGenerationChange,
  searchTerm,
  setSearchTerm,
  onOpenAdvancedFilters,
  isMobile
}) => {
  const [expanded, setExpanded] = useState(!isMobile);
  const [fade, setFade] = useState(false);
  const fadeTimeout = useRef(null);

  // Tự động mờ đi khi không thao tác
  useEffect(() => {
    if (!expanded) return;
    setFade(false);
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    fadeTimeout.current = setTimeout(() => setFade(true), 3500);
    return () => clearTimeout(fadeTimeout.current);
  }, [expanded, searchTerm]);

  // Ẩn/hiện toolbar trên mobile
  useEffect(() => {
    if (isMobile) setExpanded(false);
  }, [isMobile]);

  return (
    <div
      className={`fixed top-4 right-4 z-40 transition-all duration-300 ${fade ? 'opacity-40' : 'opacity-100'} ${expanded ? 'w-auto' : 'w-12 h-12'} flex flex-col items-end`}
      onMouseEnter={() => setFade(false)}
      onMouseLeave={() => setFade(false)}
      style={{ pointerEvents: 'auto' }}
    >
      {expanded ? (
        <div className="bg-white shadow-xl rounded-2xl flex flex-col gap-2 p-3 border border-gray-200 min-w-[44px]">
          <div className="flex items-center gap-2">
            <ActionButton onClick={() => setExpanded(false)} title="Thu gọn" className="w-8 h-8"><ChevronRight size={18} /></ActionButton>
            <ActionButton onClick={onShowAll} title="Hiện tất cả" className="w-8 h-8"><Users size={18} /></ActionButton>
            <ActionButton onClick={onDirectLineToggle} title="Lọc trực hệ" isActive={directLineActive} className="w-8 h-8"><ArrowUpNarrowWide size={18} /></ActionButton>
            <ActionButton onClick={onOpenAdvancedFilters} title="Bộ lọc nâng cao" className="w-8 h-8"><Settings size={18} /></ActionButton>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton onClick={() => onViewChange(currentView === 'tree' ? 'table' : 'tree')} title={currentView === 'tree' ? 'Chế độ bảng' : 'Chế độ cây'} className="w-8 h-8">
              {currentView === 'tree' ? <List size={18} /> : <Network size={18} />}
            </ActionButton>
            {currentView === 'tree' && (
              <ActionButton onClick={() => onOrientationChange(currentOrientation === 'vertical' ? 'horizontal' : 'vertical')} title={currentOrientation === 'vertical' ? 'Cây ngang' : 'Cây dọc'} className="w-8 h-8">
                {currentOrientation === 'vertical' ? <ArrowLeftRight size={18} /> : <ArrowDownUp size={18} />}
              </ActionButton>
            )}
            {/* Bộ lọc đời */}
            <div className="relative group">
              <ActionButton title="Lọc theo đời" className="w-8 h-8"><Filter size={18} /></ActionButton>
              <div className="absolute right-0 top-10 bg-white border rounded shadow-lg p-1 hidden group-hover:block z-50 min-w-[80px]">
                <div className="px-2 py-1 text-xs text-gray-500 cursor-pointer" onClick={() => onGenerationChange('all')}>Tất cả</div>
                {generations.map(gen => (
                  <div key={gen} className="px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer" onClick={() => onGenerationChange(gen)}>Đời {gen}</div>
                ))}
              </div>
            </div>
          </div>
          {/* Tìm kiếm */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[120px]">
              <SearchBar
                persons={typeof window !== 'undefined' && window.allPersonsForSearch ? window.allPersonsForSearch : []}
                onSelect={typeof window !== 'undefined' && window.handleSearchSelectForToolbar ? window.handleSearchSelectForToolbar : () => {}}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-xl border border-gray-200"
          onClick={() => setExpanded(true)}
          title="Mở thanh công cụ"
        >
          <ChevronLeft size={28} />
        </button>
      )}
    </div>
  );
};

export default FloatingToolbar;
