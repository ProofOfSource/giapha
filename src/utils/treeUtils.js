// Helper function to build the hierarchical data structure
export const buildTree = (persons, unions) => {
    const personMap = new Map();
    persons.forEach(p => personMap.set(p.id, { ...p, children: [], spouses: [] }));

    // 1. Establish parent-child relationships
    const childrenIds = new Set();
    personMap.forEach(node => {
        const parentId = node.fatherId || node.motherId;
        if (parentId && personMap.has(parentId)) {
            personMap.get(parentId).children.push(node);
            childrenIds.add(node.id);
        }
    });

    // 2. Identify initial root nodes (those not a child of anyone)
    let rootNodes = [];
    personMap.forEach(node => {
        if (!childrenIds.has(node.id)) {
            rootNodes.push(node);
        }
    });

    // 3. Handle spouses: add them to each other and remove duplicates from roots
    const spousesToRemoveFromRoots = new Set();
    unions.forEach(union => {
        const husband = personMap.get(union.husbandId);
        const wife = personMap.get(union.wifeId);
        if (husband && wife) {
            // Create a shallow copy for the spouse to avoid circular references in children
            const wifeForSpouse = { ...wife, children: [] };
            const husbandForSpouse = { ...husband, children: [] };
            husband.spouses.push(wifeForSpouse);
            wife.spouses.push(husbandForSpouse);
            
            if (!childrenIds.has(wife.id)) {
                 spousesToRemoveFromRoots.add(wife.id);
            }
        }
    });

    rootNodes = rootNodes.filter(node => !spousesToRemoveFromRoots.has(node.id));

    // 4. Function to assign generation number recursively
    const assignGeneration = (nodes, generation) => {
        nodes.forEach(node => {
            // This is the key change: we are now definitively setting the generation
            node.generation = generation;
            if (node.children.length > 0) {
                assignGeneration(node.children, generation + 1);
            }
        });
    };

    assignGeneration(rootNodes, 1);

    // 5. Flatten the tree to get a list with correct generations
    const personsWithGenerations = [];
    const flattenTree = (nodes) => {
        nodes.forEach(node => {
            // Giữ nguyên trường spouses (là mảng id)
            personsWithGenerations.push({ ...node });
            if (node.children.length > 0) {
                flattenTree(node.children);
            }
        });
    };
    flattenTree(rootNodes);

    // Also add spouses to the flattened list, ensuring they have a generation if they are part of a branch
    unions.forEach(union => {
        const wife = personMap.get(union.wifeId);
        if (wife && !personsWithGenerations.some(p => p.id === wife.id)) {
            personsWithGenerations.push({ ...wife, children: [] });
        }
    });


    let tree;
    if (rootNodes.length > 1) {
        tree = { id: 'root', name: 'Gia Phả', children: rootNodes, generation: 0 };
    } else {
        tree = rootNodes[0] || null;
    }

    return { tree, personsWithGenerations };
};
