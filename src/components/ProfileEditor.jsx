import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase/config.js';

export default function ProfileEditor({ user, userData, personData }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        // Combine data from user and person into a single form state
        const initialData = {
            // From 'users' collection
            displayName: userData?.displayName || '',
            email: user?.email || '', // Email is from auth, but can be displayed
            // From 'persons' collection
            name: personData?.name || '',
            nickname: personData?.nickname || '',
            biography: personData?.biography || '',
            birthDate: personData?.birthDate || '',
            lunarBirthDate: personData?.lunarBirthDate || '',
            deathDate: personData?.deathDate || '',
            lunarDeathDate: personData?.lunarDeathDate || '',
            currentAddress: personData?.currentAddress || '',
            facebook: personData?.contact?.facebook || '',
            personalEmail: personData?.contact?.personalEmail || '',
            phone: personData?.contact?.phone || '',
            achievements: personData?.achievements || '',
            gender: personData?.gender || 'other',
            isDeceased: personData?.isDeceased || false,
        };
        setFormData(initialData);
    }, [user, userData, personData]);

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
        setSuccess(null);

        try {
            // 1. Update 'users' document
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
            });

            // 2. Update 'persons' document if linked
            if (personData?.id) {
                const personRef = doc(db, 'persons', personData.id);
                
                // Construct the data to be updated
                const updatedData = {
                    name: formData.name,
                    nickname: formData.nickname,
                    biography: formData.biography,
                    birthDate: formData.birthDate,
                    lunarBirthDate: formData.lunarBirthDate,
                    deathDate: formData.deathDate,
                    lunarDeathDate: formData.lunarDeathDate,
                    currentAddress: formData.currentAddress,
                    contact: {
                        ...(personData.contact || {}), // Preserve other contact fields
                        facebook: formData.facebook,
                        personalEmail: formData.personalEmail,
                        phone: formData.phone,
                    },
                    achievements: formData.achievements,
                    gender: formData.gender,
                    isDeceased: formData.isDeceased,
                };

                await updateDoc(personRef, updatedData);
            }
            setSuccess("Cập nhật thông tin thành công!");
        } catch (err) {
            console.error("Lỗi khi cập nhật:", err);
            setError("Đã có lỗi xảy ra khi cập nhật thông tin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-amber-900 border-b pb-2">Chỉnh sửa thông tin cá nhân</h2>
            
            {/* User Information */}
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-gray-700">Thông tin tài khoản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Tên hiển thị</label>
                        <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Email Đăng nhập</label>
                        <input type="email" name="email" value={formData.email} disabled className="mt-1 w-full p-2 border rounded-md bg-gray-100" />
                    </div>
                </div>
            </div>

            {/* Person Information */}
            {personData ? (
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-gray-700">Thông tin Gia phả</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Họ và tên trong Gia phả</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Tên thường gọi</label>
                            <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600">Ngày sinh (Dương)</label>
                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Ngày sinh (Âm)</label>
                            <input type="text" name="lunarBirthDate" placeholder="VD: 15/10/Nhâm Dần" value={formData.lunarBirthDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Ngày mất (Dương)</label>
                            <input type="date" name="deathDate" value={formData.deathDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Ngày mất (Âm)</label>
                            <input type="text" name="lunarDeathDate" placeholder="VD: 01/01/Giáp Thìn" value={formData.lunarDeathDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Giới tính</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md">
                                <option value="other">Khác</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Nơi sinh sống hiện tại</label>
                            <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Email cá nhân</label>
                            <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-600">Số điện thoại</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Tài khoản Facebook</label>
                            <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600">Tiểu sử</label>
                            <textarea name="biography" value={formData.biography} onChange={handleChange} rows="3" className="mt-1 w-full p-2 border rounded-md"></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600">Thành tựu, thành tích nổi bật</label>
                            <textarea name="achievements" value={formData.achievements} onChange={handleChange} rows="3" className="mt-1 w-full p-2 border rounded-md"></textarea>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="isDeceased" checked={formData.isDeceased} onChange={handleChange} className="h-4 w-4 rounded" />
                            <label className="text-sm font-medium text-gray-600">Đã qua đời</label>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 border rounded-lg bg-yellow-50 text-yellow-800">
                    Tài khoản của bạn chưa được liên kết với bất kỳ ai trong cây gia phả. Vui lòng sử dụng mục "Liên kết" để kết nối.
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
                {error && <p className="text-red-600">{error}</p>}
                {success && <p className="text-green-600">{success}</p>}
                <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400">
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
}
