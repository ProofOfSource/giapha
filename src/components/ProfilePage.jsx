import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { auth } from '../firebase/config.js';

const ProfilePage = ({ personId, onBack }) => {
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

            const privateRef = doc(db, 'private_person_data', personId);
            const privateSnap = await getDoc(privateRef);
            if (privateSnap.exists()) {
                const pData = privateSnap.data();
                setPrivateData(pData);
                setFormData(prev => ({ ...prev, ...pData }));
            }
        };
        fetchPersonData();
    }, [personId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const { name, birthDate, deathDate, biography, achievements, burialLocation, ...privateFields } = formData;
        const publicData = { name, birthDate, deathDate, biography, achievements, burialLocation };
        
        try {
            if (personId === auth.currentUser.uid) {
                await setDoc(doc(db, 'persons', personId), publicData, { merge: true });
                await setDoc(doc(db, 'private_person_data', personId), privateFields, { merge: true });
                alert('Cập nhật thành công!');
            } else {
                const editRequest = {
                    requesterId: auth.currentUser.uid,
                    personId: personId,
                    fieldToUpdate: 'profile', // A generic field for profile updates
                    newValue: formData,
                    status: 'pending',
                    createdAt: new Date(),
                };
                await addDoc(collection(db, 'edit_requests'), editRequest);
                alert('Yêu cầu chỉnh sửa của bạn đã được gửi để xét duyệt.');
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            alert('Đã có lỗi xảy ra.');
        }
    };

    if (!person) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <div className="p-8">
            <button onClick={onBack} className="mb-4 bg-gray-200 px-4 py-2 rounded">Quay lại</button>
            <div className="bg-white p-6 rounded-lg shadow-xl">
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
                        <h2 className="text-2xl font-bold mb-4">{person.name}</h2>
                        <p><strong>Ngày sinh:</strong> {person.birthDate || 'N/A'}</p>
                        <p><strong>Ngày mất:</strong> {person.deathDate || 'N/A'}</p>
                        <p><strong>Tiểu sử:</strong> {person.biography || 'N/A'}</p>
                        <p><strong>Thành tích:</strong> {person.achievements || 'N/A'}</p>
                        <p><strong>Nơi chôn cất:</strong> {person.burialLocation || 'N/A'}</p>
                        {privateData && (
                            <div className="mt-4 pt-4 border-t">
                                <h3 className="font-bold">Thông tin cá nhân</h3>
                                <p><strong>SĐT:</strong> {privateData.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> {privateData.email || 'N/A'}</p>
                                <p><strong>Địa chỉ:</strong> {privateData.address || 'N/A'}</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-4 mt-4">
                            <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Sửa</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
