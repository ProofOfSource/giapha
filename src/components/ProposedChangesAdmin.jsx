import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '../firebase/config.js';
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
// We will create this function later
// const handleApproval = httpsCallable(functions, 'handleApproval'); 

const ProposedChangeCard = ({ change, onApprove, onReject }) => {
    const [proposer, setProposer] = useState(null);
    const [targetPerson, setTargetPerson] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch proposer info
            const proposerRef = doc(db, 'users', change.proposerId);
            const proposerSnap = await getDoc(proposerRef);
            if (proposerSnap.exists()) {
                setProposer(proposerSnap.data());
            }
            // Fetch target person info
            const targetRef = doc(db, 'persons', change.targetPersonId);
            const targetSnap = await getDoc(targetRef);
            if (targetSnap.exists()) {
                setTargetPerson(targetSnap.data());
            }
        };
        fetchData();
    }, [change]);

    return (
        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <div className="border-b pb-2 mb-2">
                <p><strong>Người đề xuất:</strong> {proposer?.displayName || change.proposerId}</p>
                <p><strong>Đối tượng thay đổi:</strong> {targetPerson?.name || change.targetPersonId}</p>
                <p className="text-sm text-gray-500"><strong>Thời gian:</strong> {new Date(change.createdAt.seconds * 1000).toLocaleString()}</p>
            </div>
            <div className="my-4">
                <h4 className="font-semibold">Các thay đổi được đề xuất:</h4>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
                    {JSON.stringify(change.changedData, null, 2)}
                </pre>
                {change.proposerNote && (
                    <div className="mt-2">
                        <h4 className="font-semibold">Ghi chú:</h4>
                        <p className="italic text-gray-700">{change.proposerNote}</p>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4">
                <button onClick={() => onReject(change.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                    Từ chối
                </button>
                <button onClick={() => onApprove(change.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                    Phê duyệt
                </button>
            </div>
        </div>
    );
};


export default function ProposedChangesAdmin() {
    const [changes, setChanges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "proposed_changes"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const pendingChanges = [];
            querySnapshot.forEach((doc) => {
                pendingChanges.push({ id: doc.id, ...doc.data() });
            });
            setChanges(pendingChanges);
            setLoading(false);
        }, (err) => {
            console.error("Lỗi khi lắng nghe thay đổi:", err);
            setError("Không thể tải danh sách đề xuất.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDecision = async (changeId, newStatus) => {
        try {
            const changeRef = doc(db, 'proposed_changes', changeId);
            await updateDoc(changeRef, { status: newStatus });
            // The actual data merge will be handled by a Cloud Function Trigger
            alert(`Đề xuất đã được ${newStatus === 'approved' ? 'phê duyệt' : 'từ chối'}.`);
        } catch (err) {
            console.error(`Lỗi khi ${newStatus}:`, err);
            alert("Đã có lỗi xảy ra.");
        }
    };


    if (loading) return <p>Đang tải các đề xuất...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Duyệt các thay đổi được đề xuất</h1>
            {changes.length > 0 ? (
                changes.map(change => (
                    <ProposedChangeCard 
                        key={change.id} 
                        change={change} 
                        onApprove={() => handleDecision(change.id, 'approved')}
                        onReject={() => handleDecision(change.id, 'rejected')}
                    />
                ))
            ) : (
                <p>Không có đề xuất nào đang chờ xử lý.</p>
            )}
        </div>
    );
}
