import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const functions = getFunctions();
const auth = getAuth();

// TODO: Implement approve/reject callable functions in Cloud Functions
// const approveProposal = httpsCallable(functions, 'approveProposal');
// const rejectProposal = httpsCallable(functions, 'rejectProposal');

export default function AdminProposals() {
    const [pendingProposals, setPendingProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch pending proposals
        const q = query(collection(db, 'proposals'), where('status', '==', 'pending'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const proposals = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPendingProposals(proposals);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching pending proposals:", err);
            setError("Không thể tải danh sách đề xuất.");
            setLoading(false);
        });

        // Clean up the listener
        return () => unsubscribe();
    }, []);

    const handleApprove = async (proposal) => {
        // TODO: Implement approval logic using Cloud Function
        console.log("Approve proposal:", proposal.id);
        // Example placeholder:
        // try {
        //     await approveProposal({ proposalId: proposal.id });
        // } catch (err) {
        //     console.error("Error approving proposal:", err);
        //     alert("Lỗi khi phê duyệt đề xuất.");
        // }
    };

    const handleReject = async (proposal) => {
        // TODO: Implement rejection logic using Cloud Function
        console.log("Reject proposal:", proposal.id);
         // Example placeholder:
        // try {
        //     await rejectProposal({ proposalId: proposal.id });
        // } catch (err) {
        //     console.error("Error rejecting proposal:", err);
        //     alert("Lỗi khi từ chối đề xuất.");
        // }
    };

    if (loading) {
        return <div>Đang tải đề xuất...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Đề xuất đang chờ duyệt</h2>
            {pendingProposals.length === 0 ? (
                <p>Không có đề xuất nào đang chờ duyệt.</p>
            ) : (
                <ul className="space-y-4">
                    {pendingProposals.map(proposal => (
                        <li key={proposal.id} className="border p-4 rounded-md shadow-sm">
                            <p><strong>Loại đề xuất:</strong> {proposal.type}</p>
                            <p><strong>Người đề xuất ID:</strong> {proposal.proposerId}</p>
                            <p><strong>Người bị ảnh hưởng ID:</strong> {proposal.targetPersonId}</p>
                            {proposal.relationshipType && <p><strong>Loại mối quan hệ:</strong> {proposal.relationshipType}</p>}
                            {proposal.linkedPersonId && <p><strong>Người liên kết ID:</strong> {proposal.linkedPersonId}</p>}
                            {proposal.newPersonData && (
                                <div>
                                    <strong>Thông tin người mới:</strong>
                                    <pre className="bg-gray-100 p-2 rounded mt-1">{JSON.stringify(proposal.newPersonData, null, 2)}</pre>
                                </div>
                            )}
                             {proposal.changedData && (
                                <div>
                                    <strong>Dữ liệu thay đổi:</strong>
                                    <pre className="bg-gray-100 p-2 rounded mt-1">{JSON.stringify(proposal.changedData, null, 2)}</pre>
                                </div>
                            )}
                            {proposal.proposerNote && <p><strong>Ghi chú:</strong> {proposal.proposerNote}</p>}
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => handleApprove(proposal)}
                                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md"
                                >
                                    Phê duyệt
                                </button>
                                <button
                                    onClick={() => handleReject(proposal)}
                                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md"
                                >
                                    Từ chối
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
