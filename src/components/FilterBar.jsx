import React, { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

const FilterBar = ({ generations, onGenerationChange, onDirectLineToggle, directLineActive, viewMode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex items-center gap-4">
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    <Filter size={18} />
                    <span>Lọc theo đời</span>
                    <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10">
                        <div
                            onClick={() => { onGenerationChange('all'); setIsOpen(false); }}
                            className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                        >
                            Tất cả
                        </div>
                        {generations.map(gen => (
                            <div
                                key={gen}
                                onClick={() => { onGenerationChange(gen); setIsOpen(false); }}
                                className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                            >
                                Đời {gen}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {viewMode === 'tree' && (
                <button
                    onClick={onDirectLineToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        directLineActive 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                    <span>Nhánh trực hệ</span>
                </button>
            )}
        </div>
    );
};

export default FilterBar;
