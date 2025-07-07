import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from './firebase/config.js';
import { ChevronUp, ChevronDown } from 'lucide-react';

import AuthScreen from './components/AuthScreen.jsx';
import LandingPage from './components/LandingPage.jsx';
import PublicTreeView from './components/PublicTreeView.jsx';
import StoriesFeed from './components/StoriesFeed.jsx';
import { AdminPage } from './components/Admin.jsx';
import { UserDashboard, PendingApprovalScreen } from './components/UserDashboard.jsx';

export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState('tree');
    const [adminSubPage, setAdminSubPage] = useState('dashboard');
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    // Effect for handling Firebase Auth state changes
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setUserData(null);
                // setPage('landing'); // On logout, always return to landing page
            }
        }, (err) => {
            setError(err);
            setLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    // Effect for fetching user data from Firestore when user object is available
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                setUserData(doc.data());
            } else {
                // This case can happen briefly after registration before the user doc is created
                setUserData({ role: 'pending' }); 
            }
            setLoading(false);
        }, (err) => {
            setError(err);
            setLoading(false);
        });
        return () => unsubscribeUser();
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
        // The onAuthStateChanged listener will handle setting the page to 'landing'
    };
    
    // On successful login, determine where to navigate
    useEffect(() => {
        if (user && userData) {
            if (userData.role === 'admin' || userData.role === 'root_admin') {
                setPage('admin');
            } else {
                setPage('dashboard');
            }
        }
    }, [user, userData]);


    const renderContent = () => {
        if (loading) {
            return <div className="p-8 text-center">Đang tải...</div>;
        }
        if (error) {
            return <div className="p-8 text-center text-red-600">Lỗi: {error.message}</div>;
        }

        if (user) {
            if (userData?.role === 'admin' || userData?.role === 'root_admin') {
                return <AdminPage adminSubPage={adminSubPage} setAdminSubPage={setAdminSubPage} />;
            }
            if (userData?.role === 'pending') {
                return <PendingApprovalScreen />;
            }
            // Default to the user dashboard for any other authenticated user ('member', etc.)
            return <UserDashboard user={user} />;
        }

        // Public pages for non-authenticated users
        if (page === 'auth') {
            return <AuthScreen />;
        }
        if (page === 'tree') {
            return <PublicTreeView />;
        }
        if (page === 'stories') {
            return <StoriesFeed />;
        }
        return <LandingPage />;
    };

    return (
        <div className="bg-amber-50 h-screen flex flex-col relative">
            {isHeaderVisible && (
                <header className="bg-white shadow p-4 flex justify-between items-center flex-shrink-0 z-10">
                    <h1 className="text-xl font-bold text-amber-900 cursor-pointer" onClick={() => setPage('landing')}>
                        Gia Phả Dòng Họ Phạm
                    </h1>
                    <nav className="flex items-center gap-4">
                        {user ? (
                            <>
                                {(userData?.role === 'admin' || userData?.role === 'root_admin') && (
                                    <button onClick={() => { setPage('admin'); setAdminSubPage('dashboard'); }} className="font-semibold text-red-600 hover:text-red-800">Bảng điều khiển Admin</button>
                                )}
                                 {(userData?.role === 'member') && (
                                    <button onClick={() => setPage('dashboard')} className="font-semibold text-amber-700 hover:text-amber-900">Bảng điều khiển</button>
                                )}
                                <p className="font-semibold text-gray-800">Xin chào, {userData?.displayName || user.email}</p>
                                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors">
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => {console.log('Xem Gia Pha button clicked'); setPage('tree')}} className="font-semibold text-amber-700 hover:text-amber-900">Xem Gia Phả</button>
                                <button onClick={() => setPage('stories')} className="font-semibold text-amber-700 hover:text-amber-900">Tin tức</button>
                                <button onClick={() => setPage('auth')} className="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded-full">Đăng nhập / Đăng ký</button>
                            </>
                        )}
                    </nav>
                </header>
            )}
            
            {/* NÚT ẨN/HIỆN ĐƯỢC DI CHUYỂN RA NGOÀI */}
            {/* Nó sẽ luôn hiển thị khi ở trang 'tree', bất kể header ẩn hay hiện */}
            {page === 'tree' && (
                <button 
                    onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                    className="absolute top-2 right-5 bg-green-700 bg-opacity-50 text-white p-1 rounded-full shadow-lg z-30 hover:bg-opacity-75 transition-colors"
                    title={isHeaderVisible ? "Ẩn header" : "Hiện header"}
                >
                    {isHeaderVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            )}
            <main className="flex-grow overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}
