import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase/config.js';

const StoriesFeed = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const q = query(collection(db, 'stories'), where('isPublic', '==', true));
                const snapshot = await getDocs(q);
                const publicStories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStories(publicStories);
            } catch (error) {
                console.error("Lỗi khi tải tin tức:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, []);

    if (loading) {
        return <p className="p-8 text-center">Đang tải tin tức...</p>;
    }

    if (stories.length === 0) {
        return <p className="p-8 text-center">Không có tin tức nào để hiển thị.</p>;
    }

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl font-bold mb-4">Tin tức & Sự kiện</h2>
            <div className="space-y-4">
                {stories.map(story => (
                    <div key={story.id} className="p-4 border rounded-lg shadow">
                        <h3 className="text-xl font-semibold">{story.title}</h3>
                        <p className="text-gray-600 mt-2">{story.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StoriesFeed;
