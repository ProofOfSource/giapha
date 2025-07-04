import React, { useState, useEffect } from 'react';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, app } from '../firebase/config.js';
import { GoogleIcon, FacebookIcon } from './Icons.jsx';
import { Mail, Lock } from 'lucide-react';

const db = getFirestore(app);

const AuthScreen = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const createUserProfileDocument = async (userAuth) => {
        if (!userAuth) return;
        const userRef = doc(db, 'users', userAuth.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
            const { email, displayName } = userAuth;
            const createdAt = serverTimestamp();
            try {
                await setDoc(userRef, {
                    displayName,
                    email,
                    createdAt,
                    role: 'pending'
                });
            } catch (error) {
                console.error("Lỗi khi tạo user profile:", error);
            }
        }
    };

    const handleSocialLogin = async (provider) => {
        try {
            setError('');
            await signInWithRedirect(auth, provider);
        } catch (err) {
            setError(`Đã có lỗi xảy ra: ${err.code}`);
        }
    };

    // Handle the redirect result
    useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    await createUserProfileDocument(result.user);
                }
            } catch (err) {
                setError(`Đã có lỗi xảy ra: ${err.code}`);
            }
        };
        handleRedirectResult();
    }, []);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }
        try {
            if (isRegister) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(`Đã có lỗi xảy ra: ${err.code}`);
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-amber-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-amber-900">{isRegister ? 'Đăng ký Tài khoản' : 'Đăng nhập Gia phả'}</h2>
                <div className="space-y-4">
                    <button onClick={() => handleSocialLogin(new GoogleAuthProvider())} className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                        <GoogleIcon />
                        <span className="font-semibold text-gray-700">Đăng nhập với Google</span>
                    </button>
                    <button onClick={() => handleSocialLogin(new FacebookAuthProvider())} className="w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-lg text-white bg-[#1877F2] hover:bg-[#166fe5] transition-colors">
                        <FacebookIcon />
                        <span className="font-semibold">Đăng nhập với Facebook</span>
                    </button>
                </div>
                <div className="flex items-center">
                    <hr className="flex-grow border-gray-300" />
                    <span className="mx-4 text-gray-500">hoặc</span>
                    <hr className="flex-grow border-gray-300" />
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"/>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"/>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <button type="submit" className="w-full py-3 text-white bg-amber-800 rounded-lg hover:bg-amber-900 transition-colors font-semibold">{isRegister ? 'Đăng ký' : 'Đăng nhập'}</button>
                </form>
                <p className="text-center text-sm text-gray-600">
                    {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                    <button onClick={() => setIsRegister(!isRegister)} className="font-semibold text-amber-700 hover:underline ml-1">
                        {isRegister ? 'Đăng nhập ngay' : 'Đăng ký tại đây'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthScreen;
