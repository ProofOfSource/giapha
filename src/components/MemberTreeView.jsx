import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from '../firebase/config.js';
import Tree from 'react-d3-tree';
import useWindowSize from '../hooks/useWindowSize.js';
import PersonDetailsModal from './PersonDetailsModal.jsx';

const db = getFirestore(app);

const buildTree = (persons, unions, privateData) => {
    const privateDataMap = new Map(privateData.map(d => [d.id, d]));
    const personMap = new Map(persons.map(p => {
        const personUnions = unions.filter(u => u.husbandId === p.id || u.wifeId === p.id);
        const spouses = personUnions.map(u => {
            const spouseId = u.husbandId === p.id ? u.wifeId : u.husbandId;
            return persons.find(sp => sp.id === spouseId);
        }).filter(Boolean);
        return [p.id, { ...p, spouses, attributes: { ...privateDataMap.get(p.id) }, children: [] }];
    }));

    const rootNodes = [];
    personMap.forEach(node => {
        const parentId = node.fatherId || node.motherId;
        if (parentId && personMap.has(parentId)) {
            personMap.get(parentId).children.push(node);
        } else {
            rootNodes.push(node);
        }
    });

    const assignGeneration = (nodes, generation) => {
        nodes.forEach(node => {
            node.generation = generation;
            if (node.children.length > 0) {
                assignGeneration(node.children, generation + 1);
            }
        });
    };

    assignGeneration(rootNodes, 1);

    if (rootNodes.length > 1) {
        return { name: 'Gia Phả', children: rootNodes, generation: 0 };
    }
    return rootNodes[0] || null;
};

const TreeNode = ({ nodeDatum }) => (
    <div className="p-2 bg-white border-2 border-green-700 rounded-lg shadow text-center w-48">
        <p className="font-bold text-green-900">{nodeDatum.name}</p>
        {nodeDatum.generation && <p className="text-xs font-semibold text-gray-500">Đời thứ: {nodeDatum.generation}</p>}
        <p className="text-xs">{nodeDatum.birthDate || 'Không rõ'}</p>
        <p className="text-xs text-blue-600">{nodeDatum.attributes?.email}</p>
        <p className="text-xs text-gray-600">{nodeDatum.attributes?.phone}</p>
        <p className="text-xs text-gray-600">{nodeDatum.attributes?.address}</p>
        {nodeDatum.spouses && nodeDatum.spouses.map(spouse => (
            <div key={spouse.id} className="mt-1 pt-1 border-t border-dashed">
                <p className="font-bold text-blue-900">{spouse.name}</p>
                <p className="text-xs text-gray-600">{spouse.birthDate || 'Không rõ'}</p>
            </div>
        ))}
    </div>
);

const MemberTreeView = ({ onNodeClick }) => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const size = useWindowSize();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const personsSnapshot = await getDocs(collection(db, 'persons'));
                const persons = personsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const unionsSnapshot = await getDocs(collection(db, 'unions'));
                const unions = unionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const privateDataSnapshot = await getDocs(collection(db, 'private_person_data'));
                const privateData = privateDataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const hierarchicalData = buildTree(persons, unions, privateData);
                setTreeData(hierarchicalData);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu gia phả:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const renderForeignObjectNode = ({ nodeDatum, toggleNode, foreignObjectProps }) => (
        <g onClick={() => onNodeClick(nodeDatum.id)}>
            <foreignObject {...foreignObjectProps}>
                <TreeNode nodeDatum={nodeDatum} />
            </foreignObject>
        </g>
    );

    if (loading) return <p className="p-8 text-center">Đang tải cây gia phả...</p>;
    if (!treeData) return <p className="p-8 text-center">Không có dữ liệu để hiển thị.</p>;

    const foreignObjectProps = { width: 200, height: 200, x: -100, y: -50 };

    return (
        <div className="w-full h-full" style={{ height: 'calc(100vh - 64px)' }}>
            <Tree
                data={treeData}
                renderCustomNodeElement={(rd3tProps) =>
                    renderForeignObjectNode({ ...rd3tProps, foreignObjectProps })
                }
                translate={{ x: size.width / 2, y: 50 }}
                orientation="vertical"
                pathFunc="step"
                collapsible={true}
                zoomable={true}
                separation={{ siblings: 2, nonSiblings: 2 }}
                nodeSize={{ x: 250, y: 180 }}
            />
        </div>
    );
};

export default MemberTreeView;
