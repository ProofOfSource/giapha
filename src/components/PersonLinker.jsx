import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from '../firebase/config.js';
import SearchableDropdown from './SearchableDropdown.jsx';

export default function PersonLinker({ user, userData, personData }) {
    const [persons, setPersons] = useState([]);
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUnlinkedPersons = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Get all users to find out which personIds are already linked
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const linkedPersonIds = usersSnapshot.docs
                    .map(doc => doc.data().personId)
                    .filter(Boolean); // Filter out null/undefined

                // 2. Get all persons
                const personsSnapshot = await getDocs(collection(db, 'persons'));
                const allPersons = personsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 3. Filter out persons who are already linked
                const unlinkedPersons = allPersons.filter(p => !linkedPersonIds.includes(p.id));
                
                setPersons(unlinkedPersons);
            } catch (err) {
                console.error("Lỗi khi tải danh sách person:", err);
                setError("Không thể tải danh sách người trong gia phả.");
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if the user is not currently linked
        if (!personData) {
            fetchUnlinkedPersons();
        }
    }, [userData, personData]); // Refetch when user data changes

    const handleLink = async () => {
        if (!selectedPersonId) {
            setError("Vui lòng chọn một người để liên kết.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                personId: selectedPersonId
            });
            // The parent UserDashboard will refetch data, causing this component to re-render with the new state.
        } catch (err) {
            console.error("Lỗi khi liên kết:", err);
            setError("Đã có lỗi xảy ra khi thực hiện liên kết.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy liên kết với người này?")) return;
        setLoading(true);
        setError(null);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                personId: null
            });
        } catch (err) {
            console.error("Lỗi khi hủy liên kết:", err);
            setError("Đã có lỗi xảy ra khi hủy liên kết.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-900">Liên kết Gia phả</h2>
            {personData ? (
                <div>
                    <p className="text-gray-700">
                        Tài khoản của bạn đang được liên kết với: <br />
                        <span className="font-bold">{personData.name}</span>
                    </p>
                    <button onClick={handleUnlink} disabled={loading} className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                        {loading ? 'Đang xử lý...' : 'Hủy liên kết'}
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">Chọn một người trong gia phả để liên kết với tài khoản của bạn.</p>
                    <SearchableDropdown
                        options={persons}
                        onSelect={setSelectedPersonId}
                        placeholder={loading ? "Đang tải..." : "Tìm kiếm theo tên..."}
                        displayField="name"
                        disabled={loading}
                    />
                    <button onClick={handleLink} disabled={loading || !selectedPersonId} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                        {loading ? 'Đang liên kết...' : 'Xác nhận Liên kết'}
                    </button>
                </div>
            )}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
    );
}
