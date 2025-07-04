import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const PersonDetailsModal = ({ personId, onClose, canEdit }) => {
    const [person, setPerson] = useState(null);
    const [privateData, setPrivateData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchPersonData = async () => {
            const personRef = doc(db, 'persons', personId);
            const personSnap = await getDoc(personRef);
            if (personSnap.exists()) {
                const data = personSnap.data();
                setPerson(data);
                setFormData(data);
            }

            if (canEdit) {
                const privateRef = doc(db, 'private_person_data', personId);
                const privateSnap = await getDoc(privateRef);
                if (privateSnap.exists()) {
                    const pData = privateSnap.data();
                    setPrivateData(pData);
                    setFormData(prev => ({ ...prev, ...pData }));
                }
            }
        };
        fetchPersonData();
    }, [personId, canEdit]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const { name, birthDate, deathDate, biography, achievements, burialLocation, ...privateFields } = formData;
        const publicData = { name, birthDate, deathDate, biography, achievements, burialLocation };
        
        try {
            await setDoc(doc(db, 'persons', personId), publicData, { merge: true });
            if (canEdit) {
                await setDoc(doc(db, 'private_person_data', personId), privateFields, { merge: true });
            }
            alert('Cập nhật thành công!');
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            alert('Đã có lỗi xảy ra.');
        }
    };

    if (!person) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                {isEditing ? (
                    <div className="space-y-4">
                        <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} placeholder="Tên" className="w-full p-2 border rounded" />
                        <input type="text" name="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} placeholder="Ngày sinh" className="w-full p-2 border rounded" />
                        <input type="text" name="deathDate" value={formData.deathDate || ''} onChange={handleInputChange} placeholder="Ngày mất" className="w-full p-2 border rounded" />
                        <textarea name="biography" value={formData.biography || ''} onChange={handleInputChange} placeholder="Tiểu sử" className="w-full p-2 border rounded"></textarea>
                        <textarea name="achievements" value={formData.achievements || ''} onChange={handleInputChange} placeholder="Thành tích" className="w-full p-2 border rounded"></textarea>
                        <input type="text" name="phone" value={formData.phone || ''} onChange={handleInputChange} placeholder="SĐT" className="w-full p-2 border rounded" />
                        <input type="text" name="email" value={formData.email || ''} onChange={handleInputChange} placeholder="Email" className="w-full p-2 border rounded" />
                        <input type="text" name="address" value={formData.address || ''} onChange={handleInputChange} placeholder="Địa chỉ" className="w-full p-2 border rounded" />
                        <input type="text" name="burialLocation" value={formData.burialLocation || ''} onChange={handleInputChange} placeholder="Nơi chôn cất" className="w-full p-2 border rounded" />
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Hủy</button>
                            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Lưu</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{person.name}</h2>
                        {person.nickname && <p className="text-lg text-gray-600 mb-4">({person.nickname})</p>}
                        
                        <div className="space-y-2">
                            <p><strong>Ngày sinh:</strong> {person.birthDate || 'Chưa có thông tin'}</p>
                            {person.isDeceased && <p><strong>Ngày mất:</strong> {person.deathDate || 'Chưa có thông tin'}</p>}
                            <p><strong>Nơi ở hiện tại:</strong> {person.currentAddress || 'Chưa có thông tin'}</p>
                            
                            {person.biography && <p className="pt-2"><strong>Tiểu sử:</strong> {person.biography}</p>}
                            {person.achievements && <p className="pt-2"><strong>Thành tựu:</strong> {person.achievements}</p>}

                            {person.contact?.facebook && (
                                <p className="pt-2">
                                    <strong>Facebook:</strong> 
                                    <a href={person.contact.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                                        {person.contact.facebook}
                                    </a>
                                </p>
                            )}
                        </div>

                        {privateData && (
                            <div className="mt-4 pt-4 border-t">
                                <h3 className="font-bold">Thông tin cá nhân (Chỉ thành viên thấy)</h3>
                                <p><strong>SĐT:</strong> {privateData.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> {privateData.email || 'N/A'}</p>
                                <p><strong>Địa chỉ:</strong> {privateData.address || 'N/A'}</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-4 mt-6">
                            {/* Nút sửa ở đây bị vô hiệu hóa vì logic chỉnh sửa đã được chuyển sang các component chuyên dụng */}
                            {/* {canEdit && <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Sửa</button>} */}
                            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Đóng</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonDetailsModal;
