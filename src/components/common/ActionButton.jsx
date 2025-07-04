import React from 'react';

const ActionButton = ({ onClick, title, isActive, children, disabled }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

export default ActionButton;
