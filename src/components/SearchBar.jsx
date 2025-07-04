import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ persons, onSelect, searchTerm, setSearchTerm }) => {
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const handleInputChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        if (newSearchTerm.length > 1) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }

    useEffect(() => {
        if (searchTerm.length > 1) {
            const normalizedSearchTerm = removeAccents(searchTerm.toLowerCase());
            const filteredPersons = persons.filter(person =>
                removeAccents(person.name.toLowerCase()).includes(normalizedSearchTerm)
            );
            setResults(filteredPersons);
        } else {
            setResults([]);
        }
    }, [searchTerm, persons]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchRef]);

    const handleSelect = (person) => {
        setSearchTerm(person.name);
        setIsOpen(false);
        onSelect(person.id);
    };

    const handleClear = () => {
        setSearchTerm('');
        setResults([]);
        setIsOpen(false);
    }

    return (
        <div ref={searchRef} className="relative">
            <div className="flex items-center space-x-2">
                <div className="flex-grow">
                    <input
                        type="text"
                        placeholder="Tìm kiếm thành viên theo tên..."
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={() => searchTerm.length > 1 && results.length > 0 && setIsOpen(true)}
                        className="p-2 border rounded w-full"
                    />
                </div>
                <div className="flex-shrink-0">
                    <button 
                        onClick={handleClear}
                        className="px-4 py-2 rounded border bg-gray-200 hover:bg-gray-300 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Xóa"
                        disabled={!searchTerm}
                    >
                        Xóa
                    </button>
                </div>
            </div>
            {isOpen && results.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {results.map(person => (
                        <li
                            key={person.id}
                            onClick={() => handleSelect(person)}
                            className="p-2 hover:bg-gray-200 cursor-pointer"
                        >
                            {person.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;
