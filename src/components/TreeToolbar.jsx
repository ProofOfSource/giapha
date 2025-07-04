import React from 'react';
import { List, GitFork, ArrowDownUp, ArrowLeftRight } from 'lucide-react';

const TreeToolbar = ({ onOrientationChange, onViewChange, currentView, currentOrientation }) => {
    const viewOptions = [
        { value: 'tree', label: 'Cây', icon: <GitFork size={18} />, tip: 'Xem dạng cây' },
        { value: 'table', label: 'Bảng', icon: <List size={18} />, tip: 'Xem dạng bảng' },
    ];

    const orientationOptions = [
        { value: 'vertical', label: 'Dọc', icon: <ArrowDownUp size={18} />, tip: 'Cây dạng dọc' },
        { value: 'horizontal', label: 'Ngang', icon: <ArrowLeftRight size={18} />, tip: 'Cây dạng ngang' },
    ];

    const ToggleButton = ({ options, selectedValue, onChange }) => (
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {options.map(({ value, label, icon, tip }) => (
                <button
                    key={value}
                    onClick={() => onChange(value)}
                    title={tip}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                        selectedValue === value
                            ? 'bg-gray-800 text-white shadow-sm'
                            : 'bg-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );

    return (
        <div className="flex items-center gap-4">
            <ToggleButton options={viewOptions} selectedValue={currentView} onChange={onViewChange} />
            {currentView === 'tree' && (
                <ToggleButton options={orientationOptions} selectedValue={currentOrientation} onChange={onOrientationChange} />
            )}
        </div>
    );
};

export default TreeToolbar;
