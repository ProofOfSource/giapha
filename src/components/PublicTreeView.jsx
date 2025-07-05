import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase/config.js';
import Tree from 'react-d3-tree';
import useWindowSize from '../hooks/useWindowSize.js';
import { buildTree } from '../utils/treeUtils.js';
import { Icons } from './Icons.jsx';
import { ChevronUp, ChevronDown } from 'lucide-react';
import TreeViewHeader from './TreeViewHeader.jsx';
import PersonsTable from './PersonsTable.jsx';
import FilterBar from './FilterBar.jsx';

const LeafIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 bg-white rounded-full p-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.293a1 1 0 00-1.414-1.414L9 9.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" fillRule="evenodd" />
    </svg>
);


const branchColorMap = {
    0: '#f59e0b', // amber-600
    1: '#2563eb', // blue-600
    2: '#16a34a', // green-600
    3: '#9333ea', // purple-600
    4: '#db2777', // pink-600
    5: '#4f46e5', // indigo-600
};

const getResizedImageUrl = (url, size) => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname.split('/');
        const fileName = path.pop();
        const [name, ext] = fileName.split('.');
        if (!ext) return url; // Not a file with an extension
        const resizedFileName = `${name}_${size}.${ext}`;
        path.push(resizedFileName);
        urlObj.pathname = path.join('/');
        return urlObj.toString();
    } catch (error) {
        console.error("Invalid URL for resizing:", url, error);
        return url; // Fallback to original URL if parsing fails
    }
};

const TreeNode = ({ nodeDatum, onNodeClick, isExpanded, size, nodeSize, isHighlighted }) => {
    const isDeceased = !!nodeDatum.deathDate;
    const fullName = `${nodeDatum.name} ${nodeDatum.nickname ? `(${nodeDatum.nickname})` : ''}`.trim();
    const generation = nodeDatum.generation || 0;
    const branchColor = branchColorMap[generation % 6] || '#6b7280';

    const nodeStyle = {
        borderRadius: '8px',
        backgroundColor: 'white',
        cursor: 'pointer',
        borderTop: `4px solid ${branchColor}`,
        boxShadow: isHighlighted ? '0 0 15px 3px #f59e0b' : '0 2px 8px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        borderLeft: isDeceased ? '4px solid #343434' : 'none',
        borderRight: isHighlighted ? '3px solid #f59e0b' : 'none',
    };

    // Expanded View
    if (isExpanded) {
        const [imageUrl, setImageUrl] = useState(getResizedImageUrl(nodeDatum.profilePictureUrl, '200x200'));

        useEffect(() => {
            const resizedUrl = getResizedImageUrl(nodeDatum.profilePictureUrl, '200x200');
            if (resizedUrl) {
                const img = new Image();
                img.src = resizedUrl;
                img.onload = () => setImageUrl(resizedUrl);
                img.onerror = () => setImageUrl(nodeDatum.profilePictureUrl); // Fallback to original
            } else {
                setImageUrl(null);
            }
        }, [nodeDatum.profilePictureUrl]);

        const expandedNodeStyle = {
            ...nodeStyle,
            width: nodeSize.x,
            height: nodeSize.y,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
        };

        return (
            <div style={expandedNodeStyle} onClick={() => onNodeClick(nodeDatum.id)}>
                <div
                    style={{
                        flexGrow: 1,
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                    }}
                >
                    {!imageUrl && (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-t-lg">
                            <Icons.user className="w-16 h-16 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="bg-white p-2 text-center rounded-b-lg">
                    <p className="font-bold truncate w-full text-sm text-green-600">{fullName}</p>
                </div>
            </div>
        );
    }

    // Compact View
    const compactAvatarUrl = getResizedImageUrl(nodeDatum.profilePictureUrl, '20x20');
    const spouseAvatarUrl = (spouse) => getResizedImageUrl(spouse.profilePictureUrl, '20x20');

    return (
        <div style={nodeStyle} className="p-2 w-52" onClick={() => onNodeClick(nodeDatum.id)}>
            <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                    {nodeDatum.profilePictureUrl ? (
                        <img 
                            src={compactAvatarUrl} 
                            onError={(e) => { e.target.onerror = null; e.target.src = nodeDatum.profilePictureUrl; }}
                            alt={nodeDatum.name} 
                            className="w-5 h-5 rounded-full object-cover" 
                        />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                            <Icons.user className="w-3 h-3 text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="text-left flex-grow overflow-hidden">
                    <p className="font-bold text-gray-800 text-sm truncate" title={fullName}>{fullName}</p>
                    {nodeDatum.birthDate && <p className="text-xs text-gray-600">NS: {nodeDatum.birthDate}</p>}
                    {isDeceased && <p className="text-xs text-gray-600">NM: {nodeDatum.deathDate}</p>}
                    {nodeDatum.generation && <p className="text-xs font-semibold text-gray-500">Đời {nodeDatum.generation}</p>}
                </div>
            </div>
            {nodeDatum.spouses && nodeDatum.spouses.length > 0 && (
                <div className="mt-1 pt-1 border-t border-dashed">
                    {nodeDatum.spouses.map(spouse => {
                        const resizedSpouseAvatar = spouseAvatarUrl(spouse);
                        return (
                            <div key={spouse.id} className="flex items-center space-x-1.5 mt-1">
                                {spouse.profilePictureUrl ? (
                                    <img 
                                        src={resizedSpouseAvatar} 
                                        onError={(e) => { e.target.onerror = null; e.target.src = spouse.profilePictureUrl; }}
                                        alt={spouse.name} 
                                        className="w-5 h-5 rounded-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Icons.user className="w-3 h-3 text-gray-400" />
                                    </div>
                                )}
                                <p className="font-semibold text-blue-800 text-xs truncate">{spouse.name}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const renderForeignObjectNode = ({ nodeDatum, toggleNode, foreignObjectProps, onNodeClick, expandedNodeId, size, nodeSize, highlightedNodeId }) => (
    <g>
        <foreignObject {...foreignObjectProps}>
            <TreeNode 
                nodeDatum={nodeDatum} 
                isExpanded={nodeDatum.id === expandedNodeId}
                isHighlighted={nodeDatum.id === highlightedNodeId}
                onNodeClick={onNodeClick}
                size={size}
                nodeSize={nodeSize}
            />
        </foreignObject>
    </g>
);

const PublicTreeView = () => {
    const [allPersons, setAllPersons] = useState([]);
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'table'
    const [orientation, setOrientation] = useState('vertical');
    const [zoom, setZoom] = useState(1);
    const [highlightedNodeId, setHighlightedNodeId] = useState(null);
    const [expandedNodeId, setExpandedNodeId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [generations, setGenerations] = useState([]);
    const [activeFilters, setActiveFilters] = useState({ generation: null, directLine: null });
    const [openGroups, setOpenGroups] = useState({});

    // State lifted from PersonsTable
    const [fatherFilter, setFatherFilter] = useState('');
    const [visibleColumns, setVisibleColumns] = useState({
        fatherName: true,
        birthDate: false,
        status: false,
    });

    const treeRef = React.useRef(null);
    const rowRefs = React.useRef({});
    const size = useWindowSize();
    const headerRef = React.useRef(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    const getTreeContainerStyle = () => ({
        height: `calc(100vh - ${headerHeight}px)`,
    });

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, [size.width]); // Recalculate on width change
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const personsSnapshot = await getDocs(collection(db, 'persons'));
                const personsFromDb = personsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const unionsSnapshot = await getDocs(collection(db, 'unions'));
                const unions = unionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Use the new buildTree function
                const { tree, personsWithGenerations } = buildTree(personsFromDb, unions);
                
                setTreeData(tree);
                setAllPersons(personsWithGenerations); // Use the calculated list

                const uniqueGenerations = [...new Set(personsWithGenerations.map(p => p.generation).filter(Boolean))].sort((a, b) => a - b);
                setGenerations(uniqueGenerations);

                if (tree) {
                    setHighlightedNodeId(tree.id);
                }

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu gia phả:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleNodeToggle = async (nodeId, isExpanded) => {
        if (!isExpanded) return; // Only fetch when expanding

        // A proper implementation would fetch children of `nodeId` and update the tree data.
        // This is a placeholder to show where the logic would go.
        console.log("Toggling node:", nodeId, " - Lazy loading would be implemented here.");
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.1));

    const findNodeById = (node, id) => {
        if (!node) return undefined;
        if (node.id === id) {
            return node;
        }
        if (node.children) {
            for (const child of node.children) {
                const found = findNodeById(child, id);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    };

    const getAncestors = (personId, personMap, ancestors = new Set()) => {
        const person = personMap.get(personId);
        if (!person) return ancestors;

        ancestors.add(person.id);
        if (person.fatherId) {
            getAncestors(person.fatherId, personMap, ancestors);
        }
        if (person.motherId) {
            getAncestors(person.motherId, personMap, ancestors);
        }
        return ancestors;
    };

    const getDescendants = (node, descendants = new Set()) => {
        if (!node) return descendants;
        descendants.add(node.id);
        if (node.children) {
            node.children.forEach(child => getDescendants(child, descendants));
        }
        return descendants;
    };

    const handleNodeClick = (nodeId) => {
        setHighlightedNodeId(nodeId);
        setExpandedNodeId(prev => (prev === nodeId ? null : nodeId));
    };

    const handleSearchSelect = (nodeId) => {
        handleNodeClick(nodeId);

        if (viewMode === 'tree') {
            if (!treeData) return;
            const targetNode = findNodeById(treeData, nodeId);
            if (targetNode && treeRef.current) {
                treeRef.current.centerNode(targetNode);
            } else {
                console.warn(`Node with ID ${nodeId} not found in tree data.`);
            }
        } else if (viewMode === 'table') {
            const person = allPersons.find(p => p.id === nodeId);
            if (person) {
                const generation = person.generation || 'Không rõ';
                // Ensure the group is open before scrolling
                setOpenGroups(prev => ({ ...prev, [generation]: true }));

                // Scroll after a short delay to allow the DOM to update
                setTimeout(() => {
                    const rowRef = rowRefs.current[nodeId];
                    if (rowRef) {
                        rowRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        }
    };

    const handleGenerationChange = (generation) => {
        setActiveFilters(prev => ({ ...prev, generation: generation === 'all' ? null : parseInt(generation) }));
    };

    const handleDirectLineToggle = () => {
        if (activeFilters.directLine) {
            setActiveFilters(prev => ({ ...prev, directLine: null }));
            return;
        }

        if (!highlightedNodeId || !treeData) {
            alert("Vui lòng chọn một người để lọc theo nhánh trực hệ.");
            return;
        }

        const personMap = new Map(allPersons.map(p => [p.id, p]));
        const highlightedNode = findNodeById(treeData, highlightedNodeId);

        if (!highlightedNode) return;

        const ancestors = getAncestors(highlightedNodeId, personMap);
        const descendants = getDescendants(highlightedNode);
        
        const directLineIds = new Set([...ancestors, ...descendants]);
        
        setActiveFilters(prev => ({ ...prev, directLine: directLineIds }));
    };

    const handleShowAll = () => {
        setActiveFilters({ generation: null, directLine: null });
        setSearchTerm('');
        setFatherFilter('');
    };

    const expandAllGroups = () => {
        const allGenerationGroups = allPersons.reduce((acc, person) => {
            const generation = person.generation || 'Không rõ';
            acc[generation] = true;
            return acc;
        }, {});
        setOpenGroups(allGenerationGroups);
    };

    const handleViewChange = (newView) => {
        setViewMode(newView);
        if (newView === 'table') {
            expandAllGroups();
        }
    };

    const toggleAllGroups = () => {
        const generations = Object.keys(filteredPersonsForTable.reduce((acc, person) => {
            const generation = person.generation || 'Không rõ';
            if (!acc[generation]) {
                acc[generation] = [];
            }
            acc[generation].push(person);
            return acc;
        }, {}));
        
        const allOpen = generations.every(gen => openGroups[gen]);
        const newOpenGroups = {};
        generations.forEach(gen => {
            newOpenGroups[gen] = !allOpen;
        });
        setOpenGroups(newOpenGroups);
    };

    if (loading) {
        return <p className="p-8 text-center">Đang tải cây gia phả...</p>;
    }
    
    if (!treeData) {
        return <p className="p-8 text-center">Không có dữ liệu để hiển thị cây gia phả.</p>;
    }

    // Node size
    const isMobile = size.width < 768;
    const nodeSize = isMobile ? { x: 220, y: 240 } : { x: 260, y: 240 };
    const foreignObjectProps = { width: nodeSize.x, height: nodeSize.y, x: -nodeSize.x / 2, y: -80 };

    const filteredPersonsForTable = allPersons.filter(person => {
        if (activeFilters.generation && person.generation !== activeFilters.generation) {
            return false;
        }
        if (activeFilters.directLine && !activeFilters.directLine.has(person.id)) {
            return false;
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const nameMatch = person.name.toLowerCase().includes(term);
            const nicknameMatch = person.nickname && person.nickname.toLowerCase().includes(term);
            if (!nameMatch && !nicknameMatch) {
                return false;
            }
        }
        if (fatherFilter && person.fatherId !== fatherFilter) {
            return false;
        }
        return true;
    });

    const generationsInTable = Object.keys(filteredPersonsForTable.reduce((acc, person) => {
        const generation = person.generation || 'Không rõ';
        if (!acc[generation]) {
            acc[generation] = [];
        }
        acc[generation].push(person);
        return acc;
    }, {}));

    const allGroupsOpen = generationsInTable.length > 0 && generationsInTable.every(gen => openGroups[gen]);

    return (
        <div className="flex flex-col h-screen">
            <div ref={headerRef}>
                <TreeViewHeader 
                    persons={allPersons} 
                    onSelect={handleSearchSelect} 
                    onOrientationChange={setOrientation}
                    onViewChange={handleViewChange}
                    currentView={viewMode}
                    currentOrientation={orientation}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    generations={generations}
                    onGenerationChange={handleGenerationChange}
                    onDirectLineToggle={handleDirectLineToggle}
                    directLineActive={!!activeFilters.directLine}
                    onShowAll={handleShowAll}
                    toggleAllGroups={toggleAllGroups}
                    allGroupsOpen={allGroupsOpen}
                    fatherFilter={fatherFilter}
                    setFatherFilter={setFatherFilter}
                    visibleColumns={visibleColumns}
                    setVisibleColumns={setVisibleColumns}
                />
            </div>
            <div className="flex-grow overflow-auto">
                {viewMode === 'tree' ? (
                    <div style={getTreeContainerStyle()} className="relative w-full">
                        <Tree 
                            ref={treeRef}
                            data={treeData}
                            translate={isMobile ? { x: 40, y: size.height / 2 } : { x: size.width / 2, y: 150 }}
                            renderCustomNodeElement={(rd3tProps) =>
                                renderForeignObjectNode({ ...rd3tProps, foreignObjectProps, onNodeClick: handleNodeClick, expandedNodeId, size, nodeSize, highlightedNodeId })
                            }
                            orientation={orientation}
                            pathFunc="elbow"
                            collapsible={true}
                            onNodeToggle={(node) => handleNodeToggle(node.id, node.isExpanded)}
                            zoomable={true}
                            zoom={zoom}
                            separation={{ siblings: 2, nonSiblings: 3 }}
                            nodeSize={nodeSize}
                        />
                        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
                            <button onClick={handleZoomIn} className="p-2 bg-gray-700 text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center text-lg">+</button>
                            <button onClick={handleZoomOut} className="p-2 bg-gray-700 text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center text-lg">-</button>
                        </div>
                    </div>
                ) : (
                    <PersonsTable 
                        key={viewMode}
                        persons={filteredPersonsForTable} 
                        allPersons={allPersons}
                        openGroups={openGroups}
                        setOpenGroups={setOpenGroups}
                        fatherFilter={fatherFilter}
                        visibleColumns={visibleColumns}
                        highlightedNodeId={highlightedNodeId}
                        setHighlightedNodeId={setHighlightedNodeId}
                        rowRefs={rowRefs}
                    />
                )}
            </div>
        </div>
    );
};

export default PublicTreeView;
