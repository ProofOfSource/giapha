import React from 'react';
import Select from 'react-select';

const SearchableDropdown = ({ options, value, onChange, placeholder, displayField, disabled }) => {
    const selectOptions = options.map(opt => {
        const name = opt[displayField] || opt.name;
        const nickname = opt.nickname ? `(${opt.nickname})` : '';
        return {
            value: opt.id,
            label: `${name} ${nickname}`.trim()
        };
    });

    const handleChange = (selectedOption) => {
        if (onChange) {
            onChange(selectedOption ? selectedOption.value : '');
        }
    };

    // Find the full option object that matches the current value
    const selectedValue = selectOptions.find(option => option.value === value);

    return (
        <Select
            options={selectOptions}
            value={selectedValue}
            onChange={handleChange}
            placeholder={placeholder}
            isClearable
            isSearchable
            isDisabled={disabled}
        />
    );
};

export default SearchableDropdown;
