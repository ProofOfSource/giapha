import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const PersonsTable = ({ 
    persons, 
    allPersons, 
    openGroups, 
    setOpenGroups, 
    fatherFilter, 
    visibleColumns,
    highlightedNodeId,
    setHighlightedNodeId,
    rowRefs
}) => {
    const personMap = useMemo(() => new Map(allPersons.map(p => [p.id, p])), [allPersons]);

    if (!persons || persons.length === 0) {
        return <p className="p-8 text-center">Không có dữ liệu để hiển thị.</p>;
    }

    const filteredPersons = persons.filter(person => {
        if (!fatherFilter) return true;
        const father = person.fatherId ? personMap.get(person.fatherId) : null;
        return father && father.name.toLowerCase().includes(fatherFilter.toLowerCase());
    });

    const groupedByGeneration = filteredPersons.reduce((acc, person) => {
        const generation = person.generation || 'Không rõ';
        if (!acc[generation]) {
            acc[generation] = [];
        }
        acc[generation].push(person);
        return acc;
    }, {});

    const sortedGenerations = Object.keys(groupedByGeneration).sort((a, b) => {
        if (a === 'Không rõ') return 1;
        if (b === 'Không rõ') return -1;
        return a - b;
    });

    const toggleGroup = (generation) => {
        setOpenGroups(prev => ({ ...prev, [generation]: !prev[generation] }));
    };

    const renderPersonCard = (person) => {
        const father = person.fatherId ? personMap.get(person.fatherId) : null;
        const isHighlighted = person.id === highlightedNodeId;
        const highlightClass = isHighlighted ? 'border-yellow-400' : 'bg-white border-gray-200';
        const highlightStyle = isHighlighted ? { backgroundColor: '#FEF9C3' } : {}; // bg-yellow-100

        return (
            <div
                key={person.id}
                ref={el => rowRefs.current[person.id] = el}
                style={highlightStyle}
                onClick={() => setHighlightedNodeId(person.id)}
                className={`p-3 border rounded-lg shadow-sm cursor-pointer ${highlightClass}`}
            >
                <div className="font-bold text-md text-gray-900 truncate">{person.name}</div>
                <div className="mt-2 space-y-1 text-sm">
                    {visibleColumns.fatherName && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Cha:</span>
                            <span className="text-gray-700 font-medium">{father ? father.name : 'Không rõ'}</span>
                        </div>
                    )}
                    {visibleColumns.birthDate && (
                         <div className="flex justify-between">
                            <span className="text-gray-500">Ngày sinh:</span>
                            <span className="text-gray-700">{person.birthDate || 'Không rõ'}</span>
                        </div>
                    )}
                    {visibleColumns.status && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Tình trạng:</span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                person.isDeceased ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'
                            }`}>
                                {person.isDeceased ? 'Đã mất' : 'Còn sống'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-2 sm:p-4 md:p-6">
            <div className="space-y-4">
                {sortedGenerations.map(generation => (
                    <div key={generation} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                        <div
                            className="flex items-center justify-between p-3 sm:p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                            onClick={() => toggleGroup(generation)}
                        >
                            <h3 className="text-md sm:text-lg font-semibold">
                                Đời {generation} ({groupedByGeneration[generation].length} người)
                            </h3>
                            {openGroups[generation] ? <ChevronDown /> : <ChevronRight />}
                        </div>
                        {openGroups[generation] && (
                            <div>
                                {/* Mobile Card View */}
                                <div className="md:hidden p-3 space-y-3 bg-gray-50">
                                    {groupedByGeneration[generation].map(renderPersonCard)}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                                                {visibleColumns.fatherName && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Cha</th>}
                                                {visibleColumns.birthDate && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>}
                                                {visibleColumns.status && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedByGeneration[generation].map(person => {
                                                const father = person.fatherId ? personMap.get(person.fatherId) : null;
                                                const isHighlighted = person.id === highlightedNodeId;
                                            return (
                                                <tr
                                                    key={person.id}
                                                    ref={el => rowRefs.current[person.id] = el}
                                                    style={isHighlighted ? { backgroundColor: '#FEF9C3' } : {}}
                                                    onClick={() => setHighlightedNodeId(person.id)}
                                                    className={`cursor-pointer border-b border-gray-200 ${isHighlighted ? '' : 'bg-white hover:bg-gray-50'}`}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 truncate">{person.name}</td>
                                                    {visibleColumns.fatherName && <td className="px-6 py-4 whitespace-nowrap text-gray-600">{father ? father.name : 'Không rõ'}</td>}
                                                    {visibleColumns.birthDate && <td className="px-6 py-4 whitespace-nowrap text-gray-600">{person.birthDate || 'Không rõ'}</td>}
                                                    {visibleColumns.status && <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            person.isDeceased ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {person.isDeceased ? 'Đã mất' : 'Còn sống'}
                                                        </span>
                                                    </td>}
                                                </tr>
                                            );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PersonsTable;
