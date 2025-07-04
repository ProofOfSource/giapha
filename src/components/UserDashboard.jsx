import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase/config.js';
import { Icons } from './Icons.jsx';

import ProfileEditor from './ProfileEditor.jsx';
import AvatarManager from './AvatarManager.jsx';
import PersonLinker from './PersonLinker.jsx';
import MemberTreeView from './MemberTreeView.jsx';
import FamilyManager from './FamilyManager.jsx';

export const PendingApprovalScreen = () => (
    <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-400">Tài khoản đang chờ duyệt</h1>
        <div className="mt-4 max-w-md mx-auto">
            <p className="text-gray-700 dark:text-gray-300">Cảm ơn bạn đã đăng ký! Tài khoản của bạn đã được tạo thành công và đang chờ quản trị viên của dòng họ phê duyệt.</p>
            <p className="mt-2 text-gray-700 dark:text-gray-300">Bạn sẽ nhận được thông báo khi tài khoản được kích hoạt. Vui lòng quay lại sau.</p>
        </div>
    </div>
);

const TabButton = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 font-semibold rounded-lg transition-all duration-200 ${
            isActive
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-gray-700 hover:text-amber-800 dark:hover:text-amber-300'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export const UserDashboard = ({ user }) => {
    const [userData, setUserData] = useState(null);
    const [personData, setPersonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'tree'
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'avatar', 'link', 'family'

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            setError(null);
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const fetchedUserData = userSnap.data();
                    setUserData(fetchedUserData);
                    if (fetchedUserData.personId) {
                        const personRef = doc(db, 'persons', fetchedUserData.personId);
                        const personSnap = await getDoc(personRef);
                        setPersonData(personSnap.exists() ? { id: personSnap.id, ...personSnap.data() } : null);
                    } else {
                        setPersonData(null);
                    }
                } else {
                    setError(new Error("Không tìm thấy thông tin người dùng."));
                }
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, activeTab]); // Reload data when user changes or tab changes to get fresh info

    if (view === 'tree') {
        return (
            <div className="relative h-screen">
                <button 
                    onClick={() => setView('dashboard')} 
                    className="absolute top-4 left-4 z-20 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2"
                >
                    <Icons.user className="h-5 w-5" />
                    Quay về Bảng điều khiển
                </button>
                <MemberTreeView onNodeClick={() => {}} />
            </div>
        );
    }

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileEditor user={user} userData={userData} personData={personData} />;
            case 'avatar':
                return <AvatarManager user={user} userData={userData} />;
            case 'link':
                return <PersonLinker user={user} userData={userData} personData={personData} />;
            case 'family':
                return <FamilyManager user={user} personData={personData} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bảng điều khiển</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý thông tin cá nhân và gia phả của bạn.</p>
                    </div>
                    <button 
                        onClick={() => setView('tree')} 
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-md flex items-center gap-2 transition-transform transform hover:scale-105"
                    >
                        <Icons.tree className="h-5 w-5" />
                        Xem Cây Gia Phả
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="text-center p-8 dark:text-gray-300">Đang tải...</div>
                ) : error ? (
                    <div className="text-center p-8 text-red-600">Lỗi: {error.message}</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <aside className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-2">
                                <TabButton label="Thông tin cá nhân" icon={<Icons.user className="h-5 w-5" />} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                                <TabButton label="Ảnh đại diện" icon={<Icons.image className="h-5 w-5" />} isActive={activeTab === 'avatar'} onClick={() => setActiveTab('avatar')} />
                                <TabButton label="Liên kết Gia phả" icon={<Icons.link className="h-5 w-5" />} isActive={activeTab === 'link'} onClick={() => setActiveTab('link')} />
                                <TabButton label="Quản lý Gia đình" icon={<Icons.users className="h-5 w-5" />} isActive={activeTab === 'family'} onClick={() => setActiveTab('family')} />
                            </div>
                        </aside>
                        <div className="lg:col-span-3">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 min-h-[300px] overflow-y-auto">
                                {renderActiveTab()}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
