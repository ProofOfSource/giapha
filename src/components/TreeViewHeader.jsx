import React, { useState, useMemo } from 'react';
import SearchBar from './SearchBar.jsx';
import ActionButton from './common/ActionButton.jsx';
import SearchableDropdown from './SearchableDropdown.jsx';
import { List, Network, ArrowDownUp, ArrowLeftRight, Settings, Filter, ChevronDown, ArrowUpNarrowWide, X } from 'lucide-react';
import { Icons } from './Icons.jsx';

// --- Redesigned Components ---

const ControlGroup = ({ label, children }) => (
    <fieldset className="border-2 border-dashed border-gray-300 rounded-lg p-2 h-full">
        <legend className="px-2 text-sm font-semibold text-gray-600">{label}</legend>
        <div className="flex items-center justify-center flex-wrap gap-2 h-full">
            {children}
        </div>
    </fieldset>
);

const ViewModeToggle = ({ currentView, onViewChange }) => {
    const isTreeView = currentView === 'tree';
    return (
        <ActionButton
            onClick={() => onViewChange(isTreeView ? 'table' : 'tree')}
            title={isTreeView ? "Chuyển sang chế độ Bảng" : "Chuyển sang chế độ Cây"}
            className="w-10 h-10 flex items-center justify-center"
        >
            {isTreeView ? <List size={20} /> : <Network size={20} />}
        </ActionButton>
    );
};

const TreeOrientationToggle = ({ currentOrientation, onOrientationChange }) => {
    const isVertical = currentOrientation === 'vertical';
    return (
        <ActionButton
            onClick={() => onOrientationChange(isVertical ? 'horizontal' : 'vertical')}
            title={isVertical ? "Chuyển sang cây ngang" : "Chuyển sang cây dọc"}
            className="w-10 h-10 flex items-center justify-center"
        >
            {isVertical ? <ArrowLeftRight size={20} /> : <ArrowDownUp size={20} />}
        </ActionButton>
    );
};

// --- Sub-component for Table Controls ---
const TableControls = ({ persons, fatherFilter, setFatherFilter, toggleAllGroups, allGroupsOpen, visibleColumns, setVisibleColumns }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showFatherFilter, setShowFatherFilter] = useState(false);

    const fatherOptions = useMemo(() => {
        const fatherIds = new Set(persons.map(p => p.fatherId).filter(Boolean));
        return persons.filter(p => fatherIds.has(p.id));
    }, [persons]);

    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    return (
        <>
            <div className="relative">
                <ActionButton onClick={() => setShowSettings(!showSettings)} title="Tùy chỉnh cột" className="w-10 h-10 flex items-center justify-center">
                    <Settings size={20} />
                </ActionButton>
                {showSettings && (
                    <div className="absolute mt-2 w-max bg-white rounded-lg shadow-xl z-20 border right-0">
                        <div className="p-2">
                            <p className="text-sm font-semibold px-2 pb-1 text-gray-600">Hiện các cột</p>
                            {Object.keys(visibleColumns).map(col => (
                                <label key={col} className="flex items-center px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns[col]}
                                        onChange={() => toggleColumn(col)}
                                        className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="whitespace-nowrap text-sm text-gray-700">
                                        {col === 'fatherName' && 'Tên Cha'}
                                        {col === 'birthDate' && 'Ngày sinh'}
                                        {col === 'status' && 'Tình trạng'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
             <div className="relative">
                <ActionButton onClick={() => setShowFatherFilter(!showFatherFilter)} title="Lọc theo tên cha" className="w-10 h-10 flex items-center justify-center">
                    <Icons.user className="h-5 w-5" />
                </ActionButton>
                {showFatherFilter && (
                    <div className="absolute mt-2 w-48 bg-white rounded-lg shadow-xl z-20 border right-0 p-2">
                        <SearchableDropdown
                            options={fatherOptions}
                            value={fatherFilter}
                            onSelect={(value) => {
                                setFatherFilter(value);
                                setShowFatherFilter(false);
                            }}
                            placeholder="Lọc theo tên cha..."
                            displayField="name"
                        />
                    </div>
                )}
            </div>
            <ActionButton onClick={toggleAllGroups} title={allGroupsOpen ? "Thu gọn tất cả" : "Mở rộng tất cả"} className="w-10 h-10 flex items-center justify-center">
                <Icons.compress className={`h-5 w-5 ${!allGroupsOpen ? 'hidden' : ''}`} />
                <Icons.expand className={`h-5 w-5 ${allGroupsOpen ? 'hidden' : ''}`} />
            </ActionButton>
        </>
    );
};

// --- Sub-component for Global Filters ---
const GlobalFilters = ({ generations, onGenerationChange, onDirectLineToggle, directLineActive, onShowAll }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <ActionButton onClick={onShowAll} title="Hiển thị tất cả thành viên" className="w-10 h-10 flex items-center justify-center">
                <Icons.users className="h-5 w-5" />
            </ActionButton>
            <div className="relative">
                 <ActionButton onClick={() => setIsOpen(!isOpen)} title="Lọc theo đời" className="w-10 h-10 flex items-center justify-center">
                    <Filter size={20} />
                </ActionButton>
                {isOpen && (
                    <div className="absolute left-0 mt-2 w-max min-w-full bg-white rounded-lg shadow-xl z-10 border">
                        <div
                            onClick={() => { onGenerationChange('all'); setIsOpen(false); }}
                            className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                            Tất cả
                        </div>
                        {generations.map(gen => (
                            <div
                                key={gen}
                                onClick={() => { onGenerationChange(gen); setIsOpen(false); }}
                                className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                Đời {gen}
                            </div>
                        ))}
                    </div>
                )}
            </div>
             <ActionButton onClick={onDirectLineToggle} title="Chỉ hiển thị tổ tiên và con cháu của người được chọn" isActive={directLineActive} className="w-10 h-10 flex items-center justify-center">
                <ArrowUpNarrowWide size={20} />
            </ActionButton>
        </>
    );
};


const TreeViewHeader = (props) => {
    const {
        persons, onSelect, searchTerm, setSearchTerm,
        currentView, onViewChange,
        currentOrientation, onOrientationChange,
        generations, onGenerationChange,
        directLineActive, onDirectLineToggle,
        fatherFilter, setFatherFilter,
        toggleAllGroups, allGroupsOpen,
        visibleColumns, setVisibleColumns,
        onShowAll,
        shrink = false,
        onHideHeader,
        showAdvancedFilters = false,
        setShowAdvancedFilters = () => {}
    } = props;

    // Responsive: gom các nút vào 1 hàng trên mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const headerClass = `bg-white shadow-md rounded-lg transition-all duration-300 ${shrink ? 'py-1 sm:py-2' : 'p-3 sm:p-4'}`;
    const logoClass = `font-bold text-amber-700 ${shrink ? 'text-lg' : 'text-2xl'}`;

    return (
        <div className={headerClass} style={{position: 'sticky', top: 0, zIndex: 30}}>
            <div className={`flex ${isMobile ? 'flex-row items-center gap-2' : 'flex-row items-center gap-4'}`}>
                {/* Logo và tên trang */}
                <span className={logoClass}>Gia Phả</span>
                {/* Nút ẩn header */}
                <button onClick={onHideHeader} title="Ẩn header" className="ml-2 p-1 rounded hover:bg-gray-100"><X size={20} /></button>
                {/* Popup bộ lọc nâng cao */}
                {showAdvancedFilters && (
                    <div className="fixed top-20 right-8 z-50 bg-white border rounded-lg shadow-xl p-4 min-w-[220px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-700">Bộ lọc nâng cao</span>
                            <button onClick={() => setShowAdvancedFilters(false)} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        {/* Các bộ lọc nâng cao: lọc theo cha, cột, v.v. */}
                        <div className="mb-2">
                            <span className="text-xs text-gray-500">Lọc theo tên cha</span>
                            <div className="mt-1">
                                <SearchableDropdown
                                    options={persons.filter(p => p.fatherId)}
                                    value={fatherFilter}
                                    onSelect={setFatherFilter}
                                    placeholder="Chọn tên cha..."
                                    displayField="name"
                                />
                            </div>
                        </div>
                        <div className="mb-2">
                            <span className="text-xs text-gray-500">Tùy chỉnh cột</span>
                            <div className="flex flex-col gap-1 mt-1">
                                {Object.keys(visibleColumns).map(col => (
                                    <label key={col} className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={visibleColumns[col]} onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))} />
                                        {col === 'fatherName' && 'Tên Cha'}
                                        {col === 'birthDate' && 'Ngày sinh'}
                                        {col === 'status' && 'Tình trạng'}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setShowAdvancedFilters(false)} className="mt-2 w-full py-1 rounded bg-amber-600 text-white text-sm">Đóng</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TreeViewHeader;
