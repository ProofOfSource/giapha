import React from 'react';
import { Network, List } from 'lucide-react';

const Footer = ({ currentView, onViewChange }) => {
    const buttonStyle = "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-24";
    const activeStyle = "text-orange-500";
    const inactiveStyle = "text-gray-500 hover:bg-gray-100";

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-t-md border-t z-10">
            <div className="flex justify-center items-center h-16 gap-8">
                <button
                    onClick={() => onViewChange('tree')}
                    className={`${buttonStyle} ${currentView === 'tree' ? activeStyle : inactiveStyle}`}
                >
                    <Network size={24} />
                    <span className="text-xs font-semibold">Cây Gia Phả</span>
                </button>
                <button
                    onClick={() => onViewChange('table')}
                    className={`${buttonStyle} ${currentView === 'table' ? activeStyle : inactiveStyle}`}
                >
                    <List size={24} />
                    <span className="text-xs font-semibold">Danh Sách</span>
                </button>
            </div>
        </footer>
    );
};

export default Footer;
