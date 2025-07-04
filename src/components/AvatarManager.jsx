import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, storage } from '../firebase/config.js';
import { Icons } from './Icons.jsx';

export default function AvatarManager({ user, userData }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        if ((userData?.avatars?.length || 0) >= 10) {
            setError("Bạn đã đạt đến giới hạn 10 ảnh.");
            return;
        }

        setUploading(true);
        setError(null);
        const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                avatars: arrayUnion({ url: downloadURL, path: storageRef.fullPath })
            });

            setFile(null); // Clear file input after upload
        } catch (err) {
            console.error("Lỗi khi tải ảnh lên:", err);
            setError("Không thể tải ảnh lên. Vui lòng thử lại.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (avatar) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;

        const imageRef = ref(storage, avatar.path);
        try {
            await deleteObject(imageRef);

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                avatars: arrayRemove(avatar)
            });
        } catch (err) {
            console.error("Lỗi khi xóa ảnh:", err);
            setError("Không thể xóa ảnh. Vui lòng thử lại.");
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-900">Ảnh đại diện</h2>
            
            <div className="grid grid-cols-3 gap-2">
                {userData?.avatars?.map((avatar, index) => (
                    <div key={index} className="relative group">
                        <img src={avatar.url} alt={`Avatar ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                        <button 
                            onClick={() => handleDelete(avatar)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Icons.delete className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"/>
                <button onClick={handleUpload} disabled={!file || uploading || (userData?.avatars?.length || 0) >= 10} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400">
                    {uploading ? 'Đang tải lên...' : 'Tải ảnh mới'}
                </button>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
             {(userData?.avatars?.length || 0) >= 10 && <p className="text-yellow-600 text-sm">Đã đạt giới hạn 10 ảnh.</p>}
        </div>
    );
}
