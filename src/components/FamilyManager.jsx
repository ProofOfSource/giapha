import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from '../firebase/config.js';
import EditPersonModal from './EditPersonModal.jsx';
import AddOrLinkPersonModal from './AddOrLinkPersonModal.jsx'; // Import the new modal

const RelationshipCard = ({ title, people, onEdit }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold text-lg text-amber-800 mb-2">{title}</h3>
        {people.length > 0 ? (
            <ul className="space-y-2">
                {people.map(p => (
                    <li key={p.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                        <span>{p.name}</span>
                        <button onClick={() => { console.log('Editing person:', p); onEdit(p); }} className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded">
                            Chỉnh sửa
                        </button>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-500">Không có dữ liệu.</p>
        )}
    </div>
);

import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

const functions = getFunctions();
const proposeRelationshipChange = httpsCallable(functions, 'proposeRelationshipChange'); // Assuming a new function for relationship changes
const auth = getAuth();

export default function FamilyManager({ user, personData }) {
    const [relatives, setRelatives] = useState({ parents: [], spouse: [], children: [], siblings: [] });
    const [loading, setLoading] = useState(true);
    const [editingPerson, setEditingPerson] = useState(null);

    // State for managing add/link forms visibility
    const [isAddingFather, setIsAddingFather] = useState(false);
    const [isAddingMother, setIsAddingMother] = useState(false);
    const [isAddingSpouse, setIsAddingSpouse] = useState(false);
    const [isAddingChild, setIsAddingChild] = useState(false);

    // Handlers for button clicks (placeholders for now)
    const handleAddFatherClick = () => {
        setIsAddingFather(true);
        // TODO: Open form/modal to add/link father
    };

    const handleAddMotherClick = () => {
        setIsAddingMother(true);
        // TODO: Open form/modal to add/link mother
    };

    const handleAddSpouseClick = () => {
        setIsAddingSpouse(true);
        // TODO: Open form/modal to add/link spouse
    };

    const handleAddChildClick = () => {
        setIsAddingChild(true);
        // TODO: Open form/modal to add/link child
    };

    // Handler for proposing relationship changes
    const handleProposeRelationshipChange = async (proposalData) => {
        setLoading(true); // Set loading state while proposing
        setError(null);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("Bạn phải đăng nhập để đề xuất thay đổi.");
            }
            // Call the Cloud Function to propose the relationship change
            await proposeRelationshipChange({
                ...proposalData,
                proposerId: currentUser.uid
            });
            alert("Đề xuất thay đổi mối quan hệ đã được gửi để xem xét!");
            // Optionally, refetch relatives after a successful proposal (might not be needed immediately as it's a proposal)
            // fetchRelatives();
        } catch (err) {
            console.error("Lỗi khi gửi đề xuất mối quan hệ:", err);
            setError(err.message || "Không thể gửi đề xuất mối quan hệ.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const fetchRelatives = async () => {
            if (!personData) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const fetchedRelatives = { parents: [], spouse: [], children: [], siblings: [] };

            // Fetch Parents
            if (personData.fatherId) {
                const fatherSnap = await getDoc(doc(db, 'persons', personData.fatherId));
                if (fatherSnap.exists()) fetchedRelatives.parents.push({ id: fatherSnap.id, ...fatherSnap.data() });
            }
            if (personData.motherId) {
                const motherSnap = await getDoc(doc(db, 'persons', personData.motherId));
                if (motherSnap.exists()) fetchedRelatives.parents.push({ id: motherSnap.id, ...motherSnap.data() });
            }

            // Fetch Spouse
            const unionQuery = query(collection(db, 'unions'), where(personData.gender === 'male' ? 'husbandId' : 'wifeId', '==', personData.id));
            const unionSnapshot = await getDocs(unionQuery);
            if (!unionSnapshot.empty) {
                const union = unionSnapshot.docs[0].data();
                const spouseId = personData.gender === 'male' ? union.wifeId : union.husbandId;
                if (spouseId) {
                    const spouseSnap = await getDoc(doc(db, 'persons', spouseId));
                    if (spouseSnap.exists()) fetchedRelatives.spouse.push({ id: spouseSnap.id, ...spouseSnap.data() });
                }
            }

            // Fetch Children
            const childrenQuery = query(collection(db, 'persons'), where(personData.gender === 'male' ? 'fatherId' : 'motherId', '==', personData.id));
            const childrenSnapshot = await getDocs(childrenQuery);
            fetchedRelatives.children = childrenSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Fetch Siblings (more robustly)
            const siblingMap = new Map();
            if (personData.fatherId) {
                const paternalSiblingsQuery = query(collection(db, 'persons'), where('fatherId', '==', personData.fatherId));
                const paternalSnapshot = await getDocs(paternalSiblingsQuery);
                paternalSnapshot.docs.forEach(doc => {
                    if (doc.id !== personData.id) siblingMap.set(doc.id, { id: doc.id, ...doc.data() });
                });
            }
            if (personData.motherId) {
                const maternalSiblingsQuery = query(collection(db, 'persons'), where('motherId', '==', personData.motherId));
                const maternalSnapshot = await getDocs(maternalSiblingsQuery);
                maternalSnapshot.docs.forEach(doc => {
                    if (doc.id !== personData.id) siblingMap.set(doc.id, { id: doc.id, ...doc.data() });
                });
            }
            fetchedRelatives.siblings = Array.from(siblingMap.values());

            setRelatives(fetchedRelatives);
            setLoading(false);
        };

        fetchRelatives();
    }, [personData]);

    const handleSave = (updatedPerson) => {
        // Update the state to reflect the changes immediately
        const updateList = (list) => list.map(p => p.id === updatedPerson.id ? updatedPerson : p);
        setRelatives(prev => ({
            parents: updateList(prev.parents),
            spouse: updateList(prev.spouse),
            children: updateList(prev.children),
            siblings: updateList(prev.siblings),
        }));
    };

    if (loading) {
        return <p>Đang tải thông tin gia đình...</p>;
    }

    if (!personData) {
        return <p className="text-center text-gray-600">Vui lòng liên kết tài khoản của bạn với một người trong gia phả để sử dụng chức năng này.</p>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quản lý Gia đình</h2>
            {personData ? (
                <div className="space-y-6">
                    {/* Parents Section */}
                    <div>
                        <RelationshipCard title="Cha Mẹ" people={relatives.parents} onEdit={setEditingPerson} />
                        <div className="mt-2 flex gap-4">
                            {relatives.parents.find(p => p.gender === 'male') ? null : ( // Only show "Thêm Cha" if no father is listed
                                <button onClick={handleAddFatherClick} className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded">Thêm Cha</button>
                            )}
                             {relatives.parents.find(p => p.gender === 'female') ? null : ( // Only show "Thêm Mẹ" if no mother is listed
                                <button onClick={handleAddMotherClick} className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded">Thêm Mẹ</button>
                            )}
                        </div>
                    </div>

                    {/* Spouse Section */}
                    <div>
                        <RelationshipCard title="Vợ/Chồng" people={relatives.spouse} onEdit={setEditingPerson} />
                        {relatives.spouse.length === 0 && ( // Only show "Thêm Vợ/Chồng" if no spouse is listed
                            <div className="mt-2">
                                <button onClick={handleAddSpouseClick} className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded">Thêm Vợ/Chồng</button>
                            </div>
                        )}
                    </div>

                    {/* Children Section */}
                    <div>
                        <RelationshipCard title="Con Cái" people={relatives.children} onEdit={setEditingPerson} />
                        <div className="mt-2">
                             <button onClick={handleAddChildClick} className="text-sm bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded">Thêm Con</button>
                        </div>
                    </div>

                    {/* Siblings Section (Display only, no add/link for siblings directly here) */}
                    <div>
                        <RelationshipCard title="Anh Chị Em" people={relatives.siblings} onEdit={setEditingPerson} />
                    </div>

                </div>
            ) : (
                 <p className="text-center text-gray-600">Vui lòng liên kết tài khoản của bạn với một người trong gia phả để sử dụng chức năng này.</p>
            )}


            {editingPerson && (
                <EditPersonModal
                    person={editingPerson}
                    onClose={() => setEditingPerson(null)}
                    onSave={handleSave}
                    submissionMode="propose"
                />
            )}

            {/* Modals for adding/linking family members */}
            {isAddingFather && (
                <AddOrLinkPersonModal
                    onClose={() => setIsAddingFather(false)}
                    onProposeChange={handleProposeRelationshipChange}
                    relationshipType="father"
                    currentPersonId={personData.id}
                />
            )}
            {isAddingMother && (
                <AddOrLinkPersonModal
                    onClose={() => setIsAddingMother(false)}
                    onProposeChange={handleProposeRelationshipChange}
                    relationshipType="mother"
                    currentPersonId={personData.id}
                />
            )}
            {isAddingSpouse && (
                <AddOrLinkPersonModal
                    onClose={() => setIsAddingSpouse(false)}
                    onProposeChange={handleProposeRelationshipChange}
                    relationshipType="spouse"
                    currentPersonId={personData.id}
                />
            )}
            {isAddingChild && (
                <AddOrLinkPersonModal
                    onClose={() => setIsAddingChild(false)}
                    onProposeChange={handleProposeRelationshipChange}
                    relationshipType="child"
                    currentPersonId={personData.id}
                />
            )}

        </div>
    );
}
