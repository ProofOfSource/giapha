import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../firebase/config.js';
import SearchableDropdown from './SearchableDropdown.jsx'; // Import SearchableDropdown

export default function ProfileEditor({ user, userData, personData, allPersons }) { // Accept allPersons prop
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
            // Contact info (nested)
            contact: {
                facebook: personData?.contact?.facebook || '',
                personalEmail: personData?.contact?.personalEmail || '',
                phone: personData?.contact?.phone || '',
            },
            achievements: personData?.achievements || '',
            gender: personData?.gender || 'other',
            isDeceased: personData?.isDeceased || false,
            fatherId: personData?.fatherId || '', // Add fatherId
            motherId: personData?.motherId || '', // Add motherId
        };
        setFormData(initialData);
    }, [user, userData, personData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Handle nested contact fields
        if (name.startsWith("contact.")) {
            const field = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, [field]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    // Handle changes for SearchableDropdown (fatherId, motherId)
    const handleDropdownChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
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
                    contact: formData.contact, // Use the updated contact object
                    achievements: formData.achievements,
                    gender: formData.gender,
                    isDeceased: formData.isDeceased,
                    fatherId: formData.fatherId, // Include fatherId
                    motherId: formData.motherId, // Include motherId
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

    const inputStyle = "mt-1 w-full p-2 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200";
    const labelStyle = "block text-sm font-medium text-gray-600 dark:text-gray-300";


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-400 border-b pb-2">Chỉnh sửa thông tin cá nhân</h2>
            
            {/* User Information */}
            <div className="p-4 border rounded-lg dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-2 text-gray-700 dark:text-gray-200">Thông tin tài khoản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelStyle}>Tên hiển thị</label>
                        <input type="text" name="displayName" value={formData.displayName || ''} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>Email Đăng nhập</label>
                        <input type="email" name="email" value={formData.email || ''} disabled className={`${inputStyle} bg-gray-100 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed`} />
                    </div>
                </div>
            </div>

            {/* Person Information */}
            {personData ? (
                <div className="p-4 border rounded-lg dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-2 text-gray-700 dark:text-gray-200">Thông tin Gia phả</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelStyle}>Họ và tên trong Gia phả</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Tên thường gọi</label>
                            <input type="text" name="nickname" value={formData.nickname || ''} onChange={handleChange} className={inputStyle} />
                        </div>
                         <div>
                            <label className={labelStyle}>Ngày sinh (Dương)</label>
                            <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Ngày sinh (Âm)</label>
                            <input type="text" name="lunarBirthDate" placeholder="VD: 15/10/Nhâm Dần" value={formData.lunarBirthDate || ''} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Ngày mất (Dương)</label>
                            <input type="date" name="deathDate" value={formData.deathDate || ''} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Ngày mất (Âm)</label>
                            <input type="text" name="lunarDeathDate" placeholder="VD: 01/01/Giáp Thìn" value={formData.lunarDeathDate || ''} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>Giới tính</label>
                            <select name="gender" value={formData.gender || 'other'} onChange={handleChange} className={inputStyle}>
                                <option value="other">Khác</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelStyle}>Nơi sinh sống hiện tại</label>
                            <input type="text" name="currentAddress" value={formData.currentAddress || ''} onChange={handleChange} className={inputStyle} />
                        </div>
                        
                        {/* Cha and Mẹ dropdowns */}
                        <div>
                            <label className={labelStyle}>Cha</label>
                            <SearchableDropdown
                                options={allPersons.filter(p => p.gender !== 'female')} // Filter for male persons
                                value={formData.fatherId}
                                onChange={(value) => handleDropdownChange('fatherId', value)}
                                placeholder="Chọn cha..."
                            />
                        </div>
                        <div>
                            <label className={labelStyle}>Mẹ</label>
                            <SearchableDropdown
                                options={allPersons.filter(p => p.gender !== 'male')} // Filter for female persons
                                value={formData.motherId}
                                onChange={(value) => handleDropdownChange('motherId', value)}
                                placeholder="Chọn mẹ..."
                            />
                        </div>

                        {/* Contact Information */}
                        <div className="md:col-span-2 border-t pt-4 mt-4">
                             <h4 className="font-semibold text-md mb-2 text-gray-700 dark:text-gray-200">Thông tin liên hệ</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyle}>Email cá nhân</label>
                                    <input type="email" name="contact.personalEmail" value={formData.contact?.personalEmail || ''} onChange={handleChange} className={inputStyle} />
                                </div>
                                 <div>
                                    <label className={labelStyle}>Số điện thoại</label>
                                    <input type="tel" name="contact.phone" value={formData.contact?.phone || ''} onChange={handleChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Tài khoản Facebook</label>
                                    <input type="text" name="contact.facebook" value={formData.contact?.facebook || ''} onChange={handleChange} className={inputStyle} />
                                </div>
                             </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelStyle}>Tiểu sử</label>
                            <textarea name="biography" value={formData.biography || ''} onChange={handleChange} rows="3" className={inputStyle}></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelStyle}>Thành tựu, thành tích nổi bật</label>
                            <textarea name="achievements" value={formData.achievements || ''} onChange={handleChange} rows="3" className={inputStyle}></textarea>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <input type="checkbox" name="isDeceased" checked={formData.isDeceased || false} onChange={handleChange} className="h-4 w-4 rounded" />
                            <label className={labelStyle}>Đã qua đời</label>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 border rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700">
                    Tài khoản của bạn chưa được liên kết với bất kỳ ai trong cây gia phả. Vui lòng sử dụng mục "Liên kết" để kết nối.
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
                {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
                {success && <p className="text-green-600 dark:text-green-400">{success}</p>}
                <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600">
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
}
