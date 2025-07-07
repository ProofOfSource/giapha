import React, { useState } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../firebase/config.js';

export default function AddOrLinkPersonModal({ onClose, onProposeChange, relationshipType, currentPersonId }) {
    const [mode, setMode] = useState('add'); // 'add' or 'link'
    const [formData, setFormData] = useState({ name: '', gender: '', birthDate: '' }); // For 'add' mode
    const [searchQuery, setSearchQuery] = useState(''); // For 'link' mode
    const [searchResults, setSearchResults] = useState([]); // For 'link' mode
    const [selectedPerson, setSelectedPerson] = useState(null); // For 'link' mode
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleModeChange = (newMode) => {
        setMode(newMode);
        // Reset state when changing mode
        setFormData({ name: '', gender: '', birthDate: '' });
        setSearchQuery('');
        setSearchResults([]);
        setSelectedPerson(null);
        setError(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) { // Only search if query is at least 3 characters
            setLoading(true);
            setError(null);
            try {
                const personsRef = collection(db, 'persons');
                // Simple search by name - can be improved later
                const q = query(personsRef, where('name', '>=', query), where('name', '<=', query + '\uf8ff'));
                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(person => person.id !== currentPersonId); // Exclude the current person
                setSearchResults(results);
            } catch (err) {
                console.error("Error searching persons:", err);
                setError("Lỗi khi tìm kiếm.");
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectPerson = (person) => {
        setSelectedPerson(person);
        setSearchResults([]); // Hide results after selection
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const proposalData = {
                type: 'relationship',
                relationshipType: relationshipType, // e.g., 'father', 'mother', 'spouse', 'child'
                targetPersonId: currentPersonId,
            };

            if (mode === 'add') {
                // Data for creating a new person
                proposalData.newPersonData = formData;
            } else { // mode === 'link'
                if (!selectedPerson) {
                    throw new Error("Vui lòng chọn một người để liên kết.");
                }
                // ID of the existing person to link
                proposalData.linkedPersonId = selectedPerson.id;
            }

            // Call the function passed from FamilyManager to propose the change
            await onProposeChange(proposalData);

            onClose(); // Close modal on success
        } catch (err) {
            console.error("Error submitting proposal:", err);
            setError(err.message || "Không thể gửi đề xuất.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 50,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem', // p-4 in tailwind
            transform: 'translateZ(0)', // transform-gpu hint
            border: '2px solid blue'
        }} onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {relationshipType === 'father' ? 'Thêm Cha' :
                     relationshipType === 'mother' ? 'Thêm Mẹ' :
                     relationshipType === 'spouse' ? 'Thêm Vợ/Chồng' :
                     relationshipType === 'child' ? 'Thêm Con' : 'Thêm Người liên quan'}
                </h2>

                <div className="flex mb-4">
                    <button
                        className={`flex-1 py-2 px-4 text-center rounded-l-md ${mode === 'add' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => handleModeChange('add')}
                    >
                        Thêm người mới
                    </button>
                    <button
                         className={`flex-1 py-2 px-4 text-center rounded-r-md ${mode === 'link' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => handleModeChange('link')}
                    >
                        Liên kết người có sẵn
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'add' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                                <select name="gender" value={formData.gender} onChange={handleFormChange} required className="mt-1 w-full p-2 border rounded-md">
                                    <option value="">Chọn giới tính</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ngày sinh (Dương)</label>
                                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleFormChange} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                            {/* Add other relevant fields for a new person if needed */}
                        </>
                    )}

                    {mode === 'link' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tìm kiếm người có sẵn</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Nhập tên để tìm kiếm..."
                                    className="mt-1 w-full p-2 border rounded-md shadow-sm"
                                />
                                {loading && <p className="text-sm text-gray-500 mt-1">Đang tìm kiếm...</p>}
                                {error && <p className="text-red-500 mt-1">{error}</p>}
                                {searchResults.length > 0 && (
                                    <ul className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                                        {searchResults.map(person => (
                                            <li
                                                key={person.id}
                                                className="p-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                                                onClick={() => handleSelectPerson(person)}
                                            >
                                                {person.name} ({person.birthDate || 'Không rõ ngày sinh'})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {selectedPerson && (
                                    <p className="mt-2 text-sm text-green-700">Đã chọn: {selectedPerson.name}</p>
                                )}
                            </div>
                        </>
                    )}

                    {error && <p className="text-red-500">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
                            Hủy
                        </button>
                        <button type="submit" disabled={loading || (mode === 'link' && !selectedPerson)} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                            {loading ? 'Đang gửi...' : 'Gửi đề xuất'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
