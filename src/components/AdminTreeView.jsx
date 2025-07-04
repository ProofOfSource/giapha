import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import { app } from '../firebase/config.js';
import Tree from 'react-d3-tree';
import useWindowSize from '../hooks/useWindowSize.js';
import PersonDetailsModal from './PersonDetailsModal.jsx';
import { buildTree } from '../utils/treeUtils.js';

const db = getFirestore(app);

const AdminTreeView = () => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectingParentFor, setSelectingParentFor] = useState(null);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const size = useWindowSize();

    const fetchData = async () => {
        try {
            const personsSnapshot = await getDocs(collection(db, 'persons'));
            const persons = personsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const unionsSnapshot = await getDocs(collection(db, 'unions'));
            const unions = unionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const hierarchicalData = buildTree(persons, unions);
            setTreeData(hierarchicalData);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu gia phả:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleNodeClick = async (nodeDatum) => {
        if (selectingParentFor) {
            const { childId, parentType } = selectingParentFor;
            const parentId = nodeDatum.id;

            if (childId === parentId) {
                alert("Bạn không thể chọn một người làm cha/mẹ của chính họ.");
                return;
            }

            const childRef = doc(db, 'persons', childId);
            try {
                await setDoc(childRef, { [`${parentType}Id`]: parentId }, { merge: true });
                alert(`Đã cập nhật ${parentType === 'father' ? 'cha' : 'mẹ'} thành công!`);
                setSelectingParentFor(null);
                setLoading(true);
                fetchData();
            } catch (error) {
                console.error("Lỗi khi cập nhật quan hệ:", error);
                alert("Đã có lỗi xảy ra.");
            }
        } else {
            setSelectedPerson(nodeDatum.id);
        }
    };

    const renderForeignObjectNode = ({ nodeDatum, toggleNode }) => (
        <g onClick={() => handleNodeClick(nodeDatum)}>
            <circle r={15} fill={selectingParentFor ? 'lightgray' : 'white'}></circle>
            <foreignObject x={-100} y={-50} width={200} height={100}>
                <div className="p-2 bg-white border border-amber-700 rounded-lg text-center shadow">
                    <p className="font-bold text-amber-900">{nodeDatum.name}</p>
                    {nodeDatum.generation && <p className="text-xs font-semibold text-gray-500">Đời thứ: {nodeDatum.generation}</p>}
                    {nodeDatum.spouses && nodeDatum.spouses.map(spouse => (
                        <p key={spouse.id} className="text-xs text-blue-900">{spouse.name}</p>
                    ))}
                    <div className="mt-1 text-xs space-x-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelectingParentFor({ childId: nodeDatum.id, parentType: 'father' }); }} className="px-1 py-0.5 bg-blue-100 hover:bg-blue-200 rounded">Sửa Cha</button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectingParentFor({ childId: nodeDatum.id, parentType: 'mother' }); }} className="px-1 py-0.5 bg-pink-100 hover:bg-pink-200 rounded">Sửa Mẹ</button>
                    </div>
                </div>
            </foreignObject>
        </g>
    );

    if (loading) return <p className="p-8 text-center">Đang tải cây gia phả...</p>;
    if (!treeData) return <p className="p-8 text-center">Không có dữ liệu để hiển thị.</p>;

    return (
        <div className="w-full h-full" style={{ height: 'calc(100vh - 200px)' }}>
            {selectingParentFor && (
                <div className="p-2 bg-yellow-200 text-center font-bold">
                    Đang chọn {selectingParentFor.parentType === 'father' ? 'CHA' : 'MẸ'} cho {persons.find(p => p.id === selectingParentFor.childId)?.name}. Nhấp vào một người để chọn hoặc
                    <button onClick={() => setSelectingParentFor(null)} className="ml-2 text-sm text-red-600 underline">Hủy</button>
                </div>
            )}
            <Tree
                data={treeData}
                renderCustomNodeElement={renderForeignObjectNode}
                translate={{ x: size.width / 2, y: 50 }}
                orientation="vertical"
                pathFunc="step"
                collapsible={true}
                zoomable={true}
                separation={{ siblings: 2, nonSiblings: 2 }}
                nodeSize={{ x: 250, y: 180 }}
            />
            {selectedPerson && <PersonDetailsModal personId={selectedPerson} onClose={() => setSelectedPerson(null)} canEdit={true} />}
        </div>
    );
};

export default AdminTreeView;
