import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";


const functions = getFunctions();
const updateFamilyMember = httpsCallable(functions, 'updateFamilyMember');
const proposeChange = httpsCallable(functions, 'proposeChange');
const auth = getAuth();


export default function EditPersonModal({ person, onClose, onSave, submissionMode = 'direct' }) {
    const [formData, setFormData] = useState({});
    const [proposerNote, setProposerNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (person) {
            setFormData({
                name: person.name || '',
                nickname: person.nickname || '',
                birthDate: person.birthDate || '',
                lunarBirthDate: person.lunarBirthDate || '',
                deathDate: person.deathDate || '',
                lunarDeathDate: person.lunarDeathDate || '',
                gender: person.gender || 'other',
                isDeceased: person.isDeceased || false,
                biography: person.biography || '',
                currentAddress: person.currentAddress || '',
                facebook: person.contact?.facebook || '',
                achievements: person.achievements || '',
            });
        }
    }, [person]);

    if (!person) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (submissionMode === 'propose') {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    throw new Error("Bạn phải đăng nhập để đề xuất thay đổi.");
                }
                await proposeChange({
                    targetPersonId: person.id,
                    changedData: formData,
                    proposerNote: proposerNote,
                    proposerId: currentUser.uid
                });
                // Don't call onSave directly, as change is pending
                alert("Đề xuất của bạn đã được gửi để xem xét!");
            } else {
                // Direct update for admins
                await updateFamilyMember({ personId: person.id, updatedData: formData });
                onSave({ ...person, ...formData });
            }
            onClose();
        } catch (err) {
            console.error("Lỗi khi gửi:", err);
            setError(err.message || "Không thể gửi yêu cầu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transform-gpu">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Chỉnh sửa: {person.name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tên thường gọi</label>
                            <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày sinh (Dương)</label>
                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày sinh (Âm)</label>
                            <input type="text" name="lunarBirthDate" placeholder="VD: 15/10/Nhâm Dần" value={formData.lunarBirthDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày mất (Dương)</label>
                            <input type="date" name="deathDate" value={formData.deathDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ngày mất (Âm)</label>
                            <input type="text" name="lunarDeathDate" placeholder="VD: 01/01/Giáp Thìn" value={formData.lunarDeathDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giới tính</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md">
                                <option value="other">Khác</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nơi sinh sống hiện tại</label>
                        <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="Địa chỉ cụ thể..." />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Tài khoản Facebook</label>
                        <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="https://facebook.com/username" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tiểu sử</label>
                        <textarea name="biography" value={formData.biography} onChange={handleChange} rows="3" className="mt-1 w-full p-2 border rounded-md"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Thành tựu, thành tích nổi bật</label>
                        <textarea name="achievements" value={formData.achievements} onChange={handleChange} rows="3" className="mt-1 w-full p-2 border rounded-md"></textarea>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="isDeceased" checked={formData.isDeceased} onChange={handleChange} className="h-4 w-4 rounded" />
                        <label className="text-sm font-medium text-gray-700">Đã qua đời</label>
                    </div>

                    {submissionMode === 'propose' && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Ghi chú (giải thích lý do thay đổi)</label>
                            <textarea name="proposerNote" value={proposerNote} onChange={(e) => setProposerNote(e.target.value)} rows="2" className="mt-1 w-full p-2 border rounded-md"></textarea>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
                            Hủy
                        </button>
                        <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                            {loading ? (submissionMode === 'propose' ? 'Đang gửi...' : 'Đang lưu...') : (submissionMode === 'propose' ? 'Gửi đề xuất' : 'Lưu thay đổi')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
