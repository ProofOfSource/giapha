import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase/config.js';
import Tree from 'react-d3-tree';
import useWindowSize from '../hooks/useWindowSize.js';
import { buildTree } from '../utils/treeUtils.js';
import { Icons } from './Icons.jsx';
import { ChevronUp, ChevronDown, X } from 'lucide-react'; // Import X icon
import TreeViewHeader from './TreeViewHeader.jsx';
import PersonsTable from './PersonsTable.jsx';
import FilterBar from './FilterBar.jsx';
import FloatingToolbar from './FloatingToolbar.jsx';

// Hàm làm sạch cây: loại bỏ node hoặc children undefined/null hoặc thiếu id/name
function cleanTree(node) {
    if (!node || !node.id || !node.name) return null;
    let cleaned = { ...node };
    // Clean children
    if (!Array.isArray(cleaned.children)) {
        cleaned.children = [];
    } else {
        cleaned.children = cleaned.children
            .map(child => cleanTree(child))
            .filter(child => !!child);
    }
    // Clean spouses
    if (Array.isArray(cleaned.spouses)) {
        cleaned.spouses = cleaned.spouses
            .filter(spouse => spouse && spouse.id && spouse.name)
            .map(spouse => ({ ...spouse }));
    } else {
        cleaned.spouses = [];
    }
    return cleaned;
}

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
    // Tạm thời trả về nguyên bản để test hiển thị avatar
    return url;
};

// TreeNode: Hiển thị nickname trong ngoặc bên cạnh tên
const TreeNode = ({ nodeDatum, onNodeClick, isExpanded, size, nodeSize, isHighlighted }) => {
    if (!nodeDatum || !nodeDatum.id || !nodeDatum.name) {
        console.warn('[RENDER] Skipping invalid TreeNode nodeDatum:', nodeDatum);
        return null; // Bảo vệ khỏi node lỗi
    }
    // Tính là đã mất nếu có ngày mất
    const isDeceased = !!nodeDatum.deathDate ? true : nodeDatum.isDeceased;
    // Dù không có ngày mất thì vẫn xem xét trường isDeaceased
    const fullName = nodeDatum.name || '';
    const nickname = nodeDatum.nickname || '';
    const generation = nodeDatum.generation || 0;
    const branchColor = branchColorMap[generation % 6] || '#6b7280';
    const birthYear = nodeDatum.birthDate ? nodeDatum.birthDate.split('-')[0] : '';
    const deathYear = nodeDatum.deathDate ? nodeDatum.deathDate.split('-')[0] : '';
    const isMobile = size && size.width < 768;
    const nodeId = nodeDatum.id;
    // Tính tuổi nếu còn sống
    let age = '';
    if (birthYear && !deathYear) {
        const now = new Date().getFullYear();
        age = now - parseInt(birthYear);
    }
    // Tooltip chi tiết
    const tooltipContent = `Tên: ${fullName}\n${nickname ? 'Biệt danh: ' + nickname + '\n' : ''}${birthYear ? 'Năm sinh: ' + birthYear + '\n' : ''}${deathYear ? 'Năm mất: ' + deathYear + '\n' : ''}${nodeDatum.currentAddress ? 'Địa chỉ: ' + nodeDatum.currentAddress + '\n' : ''}${nodeDatum.occupation ? 'Nghề nghiệp: ' + nodeDatum.occupation + '\n' : ''}${nodeDatum.achievements ? 'Thành tựu: ' + nodeDatum.achievements : ''}`;

    // Avatar lớn, border màu nhánh
    const avatarUrl = getResizedImageUrl(nodeDatum.profilePictureUrl, isMobile ? '48x48' : '80x80');
    const avatarSize = isMobile ? 48 : 80;
    // Border cạnh trên: dày hơn khi select
    const avatarBorder = isHighlighted
        ? `4.5px solid ${branchColor}`
        : `3px solid ${branchColor}`;
    // Cạnh trái: dày hơn khi select
    const leftBarWidth = isMobile
        ? (isHighlighted ? 10 : 6)
        : (isHighlighted ? 14 : 8);
    // Badge đời
    const genBadge = (
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{background: branchColor, color: '#fff'}}>
            Đời {generation}
        </span>
    );
    // Overlay hoa sen nếu đã mất
    const lotusOverlay = isDeceased ? (
        <span className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow" title="Đã mất">
            <Icons.lotus className="w-5 h-5 text-pink-500" />
        </span>
    ) : null;
    // Node chọn: chỉ dùng boxShadow, outline, không override borderTop/cạnh trái
    const selectedStyle = isHighlighted ? {
        boxShadow: '0 0 0 4px #f59e0b, 0 4px 24px 0 #fbbf24',
        outline: '2.5px solid #f59e0b',
        transform: 'scale(1.04)',
        zIndex: 2,
        transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
    } : {};
    // Accessibility
    const ariaLabel = `${fullName}${nickname ? ', biệt danh ' + nickname : ''}${birthYear ? ', sinh ' + birthYear : ''}${deathYear ? ', mất ' + deathYear : ''}`;
    // Vợ/chồng: avatar nhỏ, hover hiện tên
    const spouses = nodeDatum.spouses || [];
    // Cạnh trái: màu xám nếu đã mất, xanh lá nếu còn sống
    const leftBarColor = isDeceased ? '#9ca3af' : '#16a34a';
    // Mobile: node tối giản
    if (isMobile) {
        return (
            <div
                tabIndex={0}
                aria-label={ariaLabel}
                className="flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow-md focus:ring-2 focus:ring-amber-400 outline-none"
                style={{ minWidth: 90, ...selectedStyle, borderTop: avatarBorder, position: 'relative', cursor: 'pointer' }}
                onClick={() => onNodeClick(nodeId)}
                title={tooltipContent}
            >
                {/* Cạnh trái trạng thái sống/chết */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: leftBarWidth, borderRadius: 4, background: leftBarColor, zIndex: 1, transition: 'width 0.18s cubic-bezier(.4,2,.6,1)' }} />
                <div className="relative mb-1">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} className="rounded-full object-cover" style={{ width: avatarSize, height: avatarSize, border: avatarBorder, background: '#fff' }} />
                    ) : (
                        <div className="rounded-full flex items-center justify-center" style={{ width: avatarSize, height: avatarSize, border: avatarBorder, background: '#f3f4f6' }}>
                            <Icons.user className="w-10 h-10 text-gray-400" />
                        </div>
                    )}
                    {lotusOverlay}
                </div>
                <span className="font-bold text-base text-gray-900 text-center truncate w-full">
                    {fullName}{nickname && ` (${nickname})`}
                </span>
                {genBadge}
            </div>
        );
    }
    // Desktop: đầy đủ
    return (
        <div
            tabIndex={0}
            aria-label={ariaLabel}
            className="flex flex-col items-center p-3 bg-white rounded-xl shadow-md focus:ring-2 focus:ring-amber-400 outline-none group"
            style={{ minWidth: 180, maxWidth: 220, ...selectedStyle, borderTop: avatarBorder, position: 'relative', cursor: 'pointer', transition: 'all 0.18s cubic-bezier(.4,2,.6,1)' }}
            onClick={() => onNodeClick(nodeId)}
            title={tooltipContent}
        >
            {/* Cạnh trái trạng thái sống/chết */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: leftBarWidth, borderRadius: 6, background: leftBarColor, zIndex: 1, transition: 'width 0.18s cubic-bezier(.4,2,.6,1)' }} />
            <div className="relative mb-2">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="rounded-full object-cover" style={{ width: avatarSize, height: avatarSize, border: avatarBorder, background: '#fff' }} />
                ) : (
                    <div className="rounded-full flex items-center justify-center" style={{ width: avatarSize, height: avatarSize, border: avatarBorder, background: '#f3f4f6' }}>
                        <Icons.user className="w-14 h-14 text-gray-400" />
                    </div>
                )}
                {lotusOverlay}
            </div>
            <span className="font-bold text-lg text-gray-900 text-center truncate w-full">
                {fullName}{nickname && ` (${nickname})`}
            </span>
            <div className="flex items-center justify-center mt-1 space-x-2">
                {birthYear && <span className="text-xs text-gray-700">{birthYear}</span>}
                {deathYear && <span className="text-xs text-gray-700">- {deathYear}</span>}
                {!deathYear && age && <span className="text-xs text-green-600">({age} tuổi)</span>}
                {genBadge}
            </div>
            {/* Vợ/chồng: avatar nhỏ, hover hiện tên */}
            {spouses.length > 0 && (
                <div className="flex items-center justify-center mt-2 space-x-1">
                    {spouses.map((spouse, idx) => {
                        const spouseAvatar = getResizedImageUrl(spouse.profilePictureUrl, '24x24');
                        return (
                            <div key={spouse.id || idx} className="relative" tabIndex={0} aria-label={`Vợ/chồng: ${spouse.name}`}> 
                                {spouse.profilePictureUrl ? (
                                    <img src={spouseAvatar} alt={spouse.name} className="w-6 h-6 rounded-full object-cover border border-gray-300 peer" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 peer">
                                        <Icons.user className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                )}
                                <span
                                    className="absolute left-1/2 -translate-x-1/2 top-8 z-20 px-2 py-1 text-xs rounded opacity-0 peer-hover:opacity-100 peer-focus:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-150 shadow-lg border border-white"
                                    style={{ background: 'rgba(30,30,30,0.92)', color: '#fff', zIndex: 20 }}
                                >
                                    {spouse.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const renderForeignObjectNode = ({ nodeDatum, toggleNode, foreignObjectProps, onNodeClick, expandedNodeId, size, nodeSize, highlightedNodeId }) => {
    if (!nodeDatum || !nodeDatum.id || !nodeDatum.name) {
        console.warn('[RENDER] Skipping invalid nodeDatum:', nodeDatum);
        return null; // Bảo vệ khỏi node lỗi
    }
    return (
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
};

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
    const [selectedPersonForPopup, setSelectedPersonForPopup] = useState(null); // New state for popup
    const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight); // New state for landscape orientation
    const [isHeaderShrink, setIsHeaderShrink] = useState(false); // Thêm state cho shrink header
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Hiện bộ lọc nâng cao
    const [showHeader, setShowHeader] = useState(true); // Ẩn/hiện header

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
    const contentRef = React.useRef(null); // Ref cho vùng scroll
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
                console.log('[DEBUG] Raw tree from buildTree:', tree);
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

    // Lazy load flag
    const [isLazyMode, setIsLazyMode] = useState(false);

    useEffect(() => {
        if (allPersons.length > 0) {
            setIsLazyMode(allPersons.length > 500);
        }
    }, [allPersons]);

    const handleNodeToggle = async (nodeId, isExpanded) => {
        if (!isLazyMode) return; // Chỉ lazy load khi số node > 500
        if (!isExpanded) return;

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
        // Find the person data for the clicked node
        const clickedPerson = allPersons.find(p => p.id === nodeId);

        setHighlightedNodeId(nodeId);
        setExpandedNodeId(prev => (prev === nodeId ? null : nodeId));

        // Toggle the popup visibility
        if (selectedPersonForPopup && selectedPersonForPopup.id === nodeId) {
            setSelectedPersonForPopup(null); // Hide popup if clicking the same node
        } else {
            setSelectedPersonForPopup(clickedPerson); // Show popup for the clicked node
        }
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

    // Lắng nghe scroll để thu nhỏ header
    useEffect(() => {
        const contentEl = contentRef.current;
        if (!contentEl) return;
        const onScroll = () => {
            setIsHeaderShrink(contentEl.scrollTop > 24); // scroll > 24px thì thu nhỏ
        };
        contentEl.addEventListener('scroll', onScroll);
        return () => contentEl.removeEventListener('scroll', onScroll);
    }, []);

    // Logic ẩn header khi click vào vùng cây, hiện lại khi rê chuột lên trên cùng
    useEffect(() => {
        if (!showHeader) {
            const onMouseMove = (e) => {
                if (e.clientY < 40) setShowHeader(true);
            };
            window.addEventListener('mousemove', onMouseMove);
            return () => window.removeEventListener('mousemove', onMouseMove);
        }
    }, [showHeader]);

    // Đảm bảo FloatingToolbar có thể truy cập allPersons và handleSearchSelect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.allPersonsForSearch = allPersons;
            window.handleSearchSelectForToolbar = handleSearchSelect;
        }
    }, [allPersons]);

    // Trước khi render Tree, kiểm tra treeData hợp lệ
    if (loading) {
        return <p className="p-8 text-center">Đang tải cây gia phả...</p>;
    }

    // Đảm bảo treeData là object, không phải mảng
    let treeRoot = treeData;
    if (Array.isArray(treeData)) {
        treeRoot = treeData[0] || null;
    }
    console.log('[DEBUG] treeRoot before clean:', treeRoot);
    treeRoot = cleanTree(treeRoot); // Làm sạch cây trước khi render
    // Đảm bảo children luôn là mảng (dù rỗng)
    if (!Array.isArray(treeRoot.children)) treeRoot.children = [];
    console.log('[DEBUG] treeRoot after cleanTree (full):', treeRoot); // Use console.dir or log directly to avoid circular reference error
    if (!treeRoot || !treeRoot.id || !treeRoot.name) {
        return <p className="p-8 text-center text-red-600">Không có dữ liệu hợp lệ để hiển thị cây gia phả.</p>;
    }

    // Node size
    const isMobile = size.width < 768;
    const nodeSize = isMobile ? { x: 160, y: 160 } : { x: 220, y: 220 }; // Tăng y để cách cha-con rộng hơn
    // foreignObjectProps: dịch y xuống để node không bị đường nối đè lên
    const foreignObjectProps = { width: nodeSize.x, height: nodeSize.y, x: -nodeSize.x / 2, y: 0 };
    // Tăng separation giữa các đời (nonSiblings)
    const separation = isMobile
        ? { siblings: 0.8, nonSiblings: 3.5 } // tăng nonSiblings cho mobile
        : { siblings: 1.1, nonSiblings: 4.2 }; // tăng nonSiblings cho desktop

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
            {showHeader && (
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
                        shrink={isHeaderShrink}
                        onHideHeader={() => setShowHeader(false)}
                        showAdvancedFilters={showAdvancedFilters}
                        setShowAdvancedFilters={setShowAdvancedFilters}
                    />
                </div>
            )}
            <FloatingToolbar
                currentView={viewMode}
                onViewChange={handleViewChange}
                currentOrientation={orientation}
                onOrientationChange={setOrientation}
                onShowAll={handleShowAll}
                onDirectLineToggle={handleDirectLineToggle}
                directLineActive={!!activeFilters.directLine}
                generations={generations}
                onGenerationChange={handleGenerationChange}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onOpenAdvancedFilters={() => setShowAdvancedFilters(true)}
                isMobile={size.width < 768}
            />
            <div className="flex-grow overflow-auto" ref={contentRef} onClick={() => setShowHeader(false)}>
                {viewMode === 'tree' ? (
                    <div style={getTreeContainerStyle()} className="relative w-full">
                        <Tree 
                            ref={treeRef}
                            data={treeRoot}
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
                            separation={separation}
                            nodeSize={nodeSize}
                            pathClassFunc={(linkData) => {
                                // linkData.source, linkData.target
                                // Lấy màu theo đời của node cha (source)
                                const color = getBranchColorByGeneration(linkData.source.data);
                                return `tree-link-generation-${color.replace('#','')}`;
                            }}
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

            {/* Popup hiển thị thông tin chi tiết */}
            {selectedPersonForPopup && allPersons && allPersons.length > 0 && selectedPersonForPopup.id && (() => {
                // Xử lý spouseList: luôn là mảng object đầy đủ thông tin
                let spouseList = [];
                if (selectedPersonForPopup.spouses && Array.isArray(selectedPersonForPopup.spouses)) {
                    spouseList = selectedPersonForPopup.spouses.map(spouse => {
                        if (typeof spouse === 'string' || typeof spouse === 'number') {
                            // Là id, lookup từ allPersons
                            return allPersons.find(p => p.id === spouse);
                        } else if (spouse && spouse.id) {
                            // Là object, dùng luôn
                            return spouse;
                        }
                        return null;
                    }).filter(Boolean);
                }
                return (
                    <div
                        className="fixed shadow-lg border-t border-gray-200 dark:border-gray-700 p-6 overflow-y-auto z-50"
                        style={isLandscape
                            ? { left: 0, bottom: 0, width: '33.33vw', height: '50.0vh', backgroundColor: '#f3f4f6' }
                            : { left: 0, right: 0, bottom: 0, height: '33.33vh', backgroundColor: '#f3f4f6' }
                        }
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-amber-900 dark:text-amber-400">
                                Thông tin chi tiết: {selectedPersonForPopup.name} {selectedPersonForPopup.nickname ? `(${selectedPersonForPopup.nickname})` : ''}
                            </h3>
                            <button onClick={() => setSelectedPersonForPopup(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {/* Display Avatar và thông tin person chính */}
                        <div className="md:col-span-2 flex flex-col items-center mb-4">
                            <img 
                                src={selectedPersonForPopup.profilePictureUrl || 'https://placehold.co/100'} 
                                alt="Avatar" 
                                className="rounded-full object-cover border mb-2" 
                                style={{ width: '96px', height: '96px' }}
                            />
                            <div className="text-center">
                                <div className="font-bold text-xl text-amber-900 dark:text-amber-400">{selectedPersonForPopup.name}</div>
                                {selectedPersonForPopup.nickname && (
                                    <div className="text-sm text-gray-500">{selectedPersonForPopup.nickname}</div>
                                )}
                            </div>
                        </div>
                        {/* Thông tin chi tiết person chính */}
                        {selectedPersonForPopup.birthDate && (
                            <div><span className="font-semibold">Ngày sinh (Dương):</span> {selectedPersonForPopup.birthDate}</div>
                        )}
                        {selectedPersonForPopup.lunarBirthDate && (
                            <div><span className="font-semibold">Ngày sinh (Âm):</span> {selectedPersonForPopup.lunarBirthDate}</div>
                        )}
                        {selectedPersonForPopup.deathDate && (
                            <div><span className="font-semibold">Ngày mất (Dương):</span> {selectedPersonForPopup.deathDate}</div>
                        )}
                        {selectedPersonForPopup.lunarDeathDate && (
                            <div><span className="font-semibold">Ngày mất (Âm):</span> {selectedPersonForPopup.lunarDeathDate}</div>
                        )}
                        {selectedPersonForPopup.burialPlace && (
                            <div><span className="font-semibold">Nơi chôn cất:</span> {selectedPersonForPopup.burialPlace}</div>
                        )}
                        {selectedPersonForPopup.currentAddress && (
                            <div className="md:col-span-2"><span className="font-semibold">Nơi ở hiện tại:</span> {selectedPersonForPopup.currentAddress}</div>
                        )}
                        {selectedPersonForPopup.contact?.personalEmail && (
                            <div><span className="font-semibold">Email cá nhân:</span> {selectedPersonForPopup.contact.personalEmail}</div>
                        )}
                        {selectedPersonForPopup.contact?.phone && (
                            <div><span className="font-semibold">Số điện thoại:</span> {selectedPersonForPopup.contact.phone}</div>
                        )}
                        {selectedPersonForPopup.contact?.facebook && (
                            <div className="md:col-span-2"><span className="font-semibold">Facebook:</span> {selectedPersonForPopup.contact.facebook}</div>
                        )}
                        {selectedPersonForPopup.biography && (
                            <div className="md:col-span-2"><span className="font-semibold">Tiểu sử:</span> <p className="whitespace-pre-wrap">{selectedPersonForPopup.biography}</p></div>
                        )}
                        {selectedPersonForPopup.achievements && (
                            <div className="md:col-span-2"><span className="font-semibold">Thành tựu:</span> <p className="whitespace-pre-wrap">{selectedPersonForPopup.achievements}</p></div>
                        )}
                        {selectedPersonForPopup.otherInfo && (
                            <div className="md:col-span-2"><span className="font-semibold">Thông tin khác:</span> <p className="whitespace-pre-wrap">{selectedPersonForPopup.otherInfo}</p></div>
                        )}
                        {/* Section vợ/chồng: nằm dưới info person chính */}
                        {spouseList.length > 0 && (
                            <div className="md:col-span-2 mb-2 mt-4 w-full">
                                <div className="font-semibold mb-1">Vợ/Chồng:</div>
                                <div className="flex flex-col gap-4 w-full">
                                    {spouseList.map((spouse, idx) => (
                                        <div key={spouse.id || idx} className="flex flex-row items-start bg-white rounded-lg shadow p-4 w-full max-w-full border border-gray-200">
                                            <img
                                                src={spouse.profilePictureUrl || 'https://placehold.co/100'}
                                                alt={spouse.name}
                                                className="rounded-full object-cover border mr-4 flex-shrink-0"
                                                style={{ width: '96px', height: '96px' }}
                                            />
                                            <div className="flex flex-col justify-start w-full">
                                                <div className="font-bold text-base text-gray-900">{spouse.name}</div>
                                                {spouse.nickname && <div className="text-xs text-gray-500">{spouse.nickname}</div>}
                                                {spouse.birthDate && <div className="text-xs text-gray-700">Ngày sinh (Dương): {spouse.birthDate}</div>}
                                                {spouse.lunarBirthDate && <div className="text-xs text-gray-700">Ngày sinh (Âm): {spouse.lunarBirthDate}</div>}
                                                {spouse.deathDate && <div className="text-xs text-gray-700">Ngày mất (Dương): {spouse.deathDate}</div>}
                                                {spouse.lunarDeathDate && <div className="text-xs text-gray-700">Ngày mất (Âm): {spouse.lunarDeathDate}</div>}
                                                {spouse.burialPlace && <div className="text-xs text-gray-700">Nơi chôn cất: {spouse.burialPlace}</div>}
                                                {spouse.currentAddress && <div className="text-xs text-gray-700">Nơi ở hiện tại: {spouse.currentAddress}</div>}
                                                {spouse.contact?.personalEmail && <div className="text-xs text-gray-700">Email: {spouse.contact.personalEmail}</div>}
                                                {spouse.contact?.phone && <div className="text-xs text-gray-700">SĐT: {spouse.contact.phone}</div>}
                                                {spouse.contact?.facebook && <div className="text-xs text-gray-700">Facebook: {spouse.contact.facebook}</div>}
                                                {spouse.biography && <div className="text-xs text-gray-700">Tiểu sử: <span className="whitespace-pre-wrap">{spouse.biography}</span></div>}
                                                {spouse.achievements && <div className="text-xs text-gray-700">Thành tựu: <span className="whitespace-pre-wrap">{spouse.achievements}</span></div>}
                                                {spouse.otherInfo && <div className="text-xs text-gray-700">Thông tin khác: <span className="whitespace-pre-wrap">{spouse.otherInfo}</span></div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
            {/* Thêm style cho các class path */}
            <style>{`
.tree-link-generation-f59e0b { stroke: #f59e0b !important; stroke-width: 3px; }
.tree-link-generation-2563eb { stroke: #2563eb !important; stroke-width: 3px; }
.tree-link-generation-16a34a { stroke: #16a34a !important; stroke-width: 3px; }
.tree-link-generation-9333ea { stroke: #9333ea !important; stroke-width: 3px; }
.tree-link-generation-db2777 { stroke: #db2777 !important; stroke-width: 3px; }
.tree-link-generation-4f46e5 { stroke: #4f46e5 !important; stroke-width: 3px; }
`}</style>
        </div>
    );
};

// Hàm lấy màu branchColor theo generation (đặt ngoài component để không bị hoisting bug)
function getBranchColorByGeneration(nodeDatum) {
    const generation = nodeDatum && nodeDatum.generation ? nodeDatum.generation : 0;
    return branchColorMap[generation % 6] || '#6b7280';
}

export default PublicTreeView;
