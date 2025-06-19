
let flowchart = {};
let currentNodeId = 'start';
let navigationHistory = [];
let editingNodeId = null;
let currentImageData = null;
// Enhanced Canvas Zoom and Pan Functionality
let canvasZoom = {
    scale: 1.0,
    minScale: 0.1,
    maxScale: 3.0,
    step: 0.1,
    panX: 0,
    panY: 0,
    isPanning: false,
    startPan: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 }
};
// Example flowcharts data
const exampleFlowcharts = {
   'should-i-eat-it': {
       "start": {
           "id": "start",
           "instruction": "You found a mysterious Tupperware in the fridge. Open it?",
           "options": [
               { "label": "Yes, I'm brave", "nextNodeId": "sniff-test" },
               { "label": "Nope", "nextNodeId": "chicken-out" }
           ],
           "position": { x: 300, y: 50 }
       },
       "sniff-test": {
           "id": "sniff-test",
           "instruction": "It smells... like regret. Proceed?",
           "options": [
               { "label": "I've eaten worse", "nextNodeId": "taste-test" },
               { "label": "Abort mission", "nextNodeId": "bin-it" }
           ],
           "position": { x: 150, y: 200 }
       },
       "taste-test": {
           "id": "taste-test",
           "instruction": "You took a bite. The flavor is... indescribable. Keep eating?",
           "options": [
               { "label": "Deliciously dangerous", "nextNodeId": "hospital-time" },
               { "label": "I value my intestines", "nextNodeId": "bin-it" }
           ],
           "position": { x: 50, y: 350 }
       },
       "bin-it": {
           "id": "bin-it",
           "instruction": "You toss it. The mold colony thanks you for releasing it.",
           "options": [
               { "label": "Back to Uber Eats", "nextNodeId": "end" }
           ],
           "position": { x: 300, y: 350 }
       },
       "chicken-out": {
           "id": "chicken-out",
           "instruction": "You pretend you never saw it. But it saw you.",
           "options": [
               { "label": "Run away", "nextNodeId": "end" }
           ],
           "position": { x: 450, y: 200 }
       },
       "hospital-time": {
           "id": "hospital-time",
           "instruction": "Congrats. You now have a starring role in 'Mystery Meal: ER Edition.'",
           "options": [
               { "label": "Call mom", "nextNodeId": "end" }
           ],
           "position": { x: 50, y: 500 }
       },
       "end": {
           "id": "end",
           "instruction": "End of the road. Hopefully not the digestive tract.",
           "options": [],
           "position": { x: 300, y: 500 }
       }
   }
};

function switchMode(mode) {
    if (mode === 'create') {
        document.getElementById('create-mode').classList.remove('hidden');
        document.getElementById('navigate-mode').classList.add('hidden');
    } else {
        document.getElementById('create-mode').classList.add('hidden');
        document.getElementById('navigate-mode').classList.remove('hidden');
        
        // Reset to proper starting node when switching to navigate mode
        if (Object.keys(flowchart).length > 0) {
            if (flowchart['start']) {
                currentNodeId = 'start';
            } else {
                currentNodeId = Object.keys(flowchart)[0];
            }
            navigationHistory = [];
        }
        
        loadNavigationView();
    }
}

// Add this new function to check if navigation is available
function isNavigationAvailable() {
    return Object.keys(flowchart).length > 0;
}

// Update the navigate button state based on flowchart availability
function updateNavigateButtonState() {
    const navigateBtn = document.querySelector('.navigate-from-create');
    if (navigateBtn) {
        if (isNavigationAvailable()) {
            navigateBtn.disabled = false;
            navigateBtn.style.opacity = '1';
            navigateBtn.style.cursor = 'pointer';
            navigateBtn.title = 'Navigate through your flowchart';
        } else {
            navigateBtn.disabled = true;
            navigateBtn.style.opacity = '0.6';
            navigateBtn.style.cursor = 'not-allowed';
            navigateBtn.title = 'Create some nodes first to enable navigation';
        }
    }
}

function toggleExampleDropdown() {
   const dropdown = document.getElementById('example-dropdown');
   const arrow = document.getElementById('dropdown-arrow');
   
   dropdown.classList.toggle('show');
   arrow.textContent = dropdown.classList.contains('show') ? '▲' : '▼';
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
   const dropdown = document.getElementById('example-dropdown');
   const button = document.querySelector('.example-dropdown-btn');
   
   if (!button.contains(event.target) && !dropdown.contains(event.target)) {
       dropdown.classList.remove('show');
       document.getElementById('dropdown-arrow').textContent = '▼';
   }
});

// REPLACE your existing loadExample function (around line 130) with this COMPLETE version:

// REPLACE the loadExample function (around line 130) with this COMPLETE version:
function loadExample(exampleKey) {
    if (exampleFlowcharts[exampleKey]) {
        if (Object.keys(flowchart).length > 0) {
            if (!confirm('This will replace your current flowchart. Continue?')) {
                return;
            }
        }
        
        // Use deep copy to preserve the example data structure
        flowchart = JSON.parse(JSON.stringify(exampleFlowcharts[exampleKey]));
        updateFlowchartDisplay();
        resetForm();
        
        // Close dropdown
        document.getElementById('example-dropdown').classList.remove('show');
        document.getElementById('dropdown-arrow').textContent = '▼';
        
        alert(`Example "${exampleKey}" loaded successfully!`);
    }
}

function addOption() {
   const container = document.getElementById('options-container');
   const optionDiv = document.createElement('div');
   optionDiv.className = 'option-item';
   optionDiv.innerHTML = `
       <input type="text" placeholder="Option label (e.g., No)">
       <input type="text" placeholder="Next node ID (e.g., end)">
       <button type="button" class="remove-option" onclick="removeOption(this)">×</button>
   `;
   container.appendChild(optionDiv);
}

function removeOption(button) {
   const container = document.getElementById('options-container');
   if (container.children.length > 1) {
       button.parentElement.remove();
   }
}

// Replace the entire generateNodePosition() function in main.js
// REPLACE THE generateNodePosition AND calculateHierarchicalPosition FUNCTIONS (around lines 160-220) WITH THIS:

function generateNodePosition() {
   const existingNodes = Object.values(flowchart);
   
   if (existingNodes.length === 0) {
       return { x: 200, y: 100 };
   }
   
   // Use hierarchical layout for better organization
   return calculateHierarchicalPosition();
}


// REPLACE your entire calculateHierarchicalPosition function (around lines 180-250) with this COMPLETE version:

function calculateHierarchicalPosition() {
   const existingNodes = Object.values(flowchart);
   const nodeSpacingX = 300;
   const nodeSpacingY = 250;
   const startX = 150;
   const startY = 100;
   
   // Find all root nodes (nodes not referenced by others)
   const rootNodes = existingNodes.filter(node => {
       return !existingNodes.some(otherNode => 
           otherNode.options.some(option => option.nextNodeId === node.id)
       );
   });
   
   // If no root nodes found, treat first node as root
   if (rootNodes.length === 0 && existingNodes.length > 0) {
       rootNodes.push(existingNodes[0]);
   }
   
   const levels = new Map();
   const visited = new Set();
   const positions = new Map();
   
   // BFS to assign levels
   let currentLevel = [...rootNodes];
   let levelIndex = 0;
   
   while (currentLevel.length > 0) {
       if (!levels.has(levelIndex)) {
           levels.set(levelIndex, []);
       }
       
       const nextLevel = [];
       
       currentLevel.forEach(node => {
           if (!visited.has(node.id)) {
               visited.add(node.id);
               levels.get(levelIndex).push(node);
               
               // Add children to next level
               node.options.forEach(option => {
                   const targetNode = flowchart[option.nextNodeId];
                   if (targetNode && !visited.has(targetNode.id) && !nextLevel.some(n => n.id === targetNode.id)) {
                       nextLevel.push(targetNode);
                   }
               });
           }
       });
       
       currentLevel = nextLevel;
       levelIndex++;
   }
   
   // Position nodes by level
   levels.forEach((levelNodes, level) => {
       const y = startY + (level * nodeSpacingY);
       const totalWidth = (levelNodes.length - 1) * nodeSpacingX;
       const levelStartX = Math.max(startX, startX + (600 - totalWidth) / 2); // Center the level
       
       levelNodes.forEach((node, index) => {
           const x = levelStartX + (index * nodeSpacingX);
           positions.set(node.id, { x, y });
       });
   });
   
   // Handle orphaned nodes (not in hierarchy)
   const orphanedNodes = existingNodes.filter(node => !visited.has(node.id));
   orphanedNodes.forEach((node, index) => {
       const orphanRow = Math.floor(index / 3);
       const orphanCol = index % 3;
       const x = startX + (orphanCol * nodeSpacingX);
       const y = startY + (levels.size * nodeSpacingY) + 150 + (orphanRow * nodeSpacingY);
       positions.set(node.id, { x, y });
   });
   
   // For new node, find a good position
   const maxNodesPerLevel = 4;
   const currentLevelCount = levels.get(levels.size - 1)?.length || 0;
   
   if (currentLevelCount < maxNodesPerLevel) {
       // Add to current level
       const level = Math.max(0, levels.size - 1);
       const y = startY + (level * nodeSpacingY);
       const x = startX + (currentLevelCount * nodeSpacingX);
       return { x, y };
   } else {
       // Create new level
       const level = levels.size;
       const y = startY + (level * nodeSpacingY);
       const x = startX;
       return { x, y };
   }
}

// REPLACE the validateAndFixNodePositions function (around line 400) with this:
function validateAndFixNodePositions() {
    console.log('=== VALIDATING NODE POSITIONS ===');
    
    Object.keys(flowchart).forEach(nodeId => {
        const node = flowchart[nodeId];
        
        // Only fix positions that are truly broken, not just missing decimal places
        const hasValidPosition = node.position && 
                               typeof node.position.x === 'number' && 
                               typeof node.position.y === 'number' &&
                               !isNaN(node.position.x) && 
                               !isNaN(node.position.y) &&
                               node.position.x >= 0 && 
                               node.position.y >= 0;
        
        if (!hasValidPosition) {
            console.warn(`Node ${nodeId} has invalid position:`, node.position);
            
            // Generate a fallback position only for truly broken nodes
            const nodeIndex = Object.keys(flowchart).indexOf(nodeId);
            node.position = {
                x: 150 + (nodeIndex % 3) * 300,
                y: 100 + Math.floor(nodeIndex / 3) * 250
            };
            
            console.log(`Fixed position for ${nodeId}:`, node.position);
        } else {
            console.log(`Node ${nodeId} position is valid:`, node.position);
        }
    });
    
    console.log('=== POSITION VALIDATION COMPLETE ===');
}

// FIXED: Enhanced renderFlowchart with position validation
// REPLACE THE renderFlowchart FUNCTION (around line 250) WITH THIS:

function renderFlowchart() {
   const canvas = document.getElementById('flowchart-canvas');
   const content = document.getElementById('flowchart-content');
   
   if (Object.keys(flowchart).length === 0) {
       content.innerHTML = `
           <div class="empty-state">
               <div class="empty-state-icon">📋</div>
               <div class="empty-state-text">No nodes created yet</div>
               <div class="empty-state-subtext">Start by adding your first node using the form on the left</div>
           </div>
       `;
       return;
   }
   
   // CRITICAL FIX: DON'T call validateAndFixNodePositions here
   // Only validate in updateFlowchartDisplay when truly needed
   
   // Clear existing content
   content.innerHTML = '';
   
   // Calculate required canvas size based on node positions with generous padding
   let maxX = 0, maxY = 0;
   Object.values(flowchart).forEach(node => {
       if (node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number') {
           // Use actual node dimensions or reasonable defaults
           const nodeWidth = node.customSize?.width || 350;
           const nodeHeight = node.customSize?.height || 200;
           maxX = Math.max(maxX, node.position.x + nodeWidth + 100); // Extra padding
           maxY = Math.max(maxY, node.position.y + nodeHeight + 100); // Extra padding
       }
   });
   
   // Ensure minimum canvas size and add extra buffer
   const canvasWidth = Math.max(maxX + 200, 1500); // Minimum 1500px width
   const canvasHeight = Math.max(maxY + 200, 1000); // Minimum 1000px height

   // Set explicit dimensions on the content container
   content.style.position = 'relative';
   content.style.width = `${canvasWidth}px`;
   content.style.height = `${canvasHeight}px`;
   content.style.minWidth = `${canvasWidth}px`;
   content.style.minHeight = `${canvasHeight}px`;

   // Create SVG for connections
   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
   svg.style.position = 'absolute';
   svg.style.top = '0';
   svg.style.left = '0';
   svg.style.width = `${canvasWidth}px`;
   svg.style.height = `${canvasHeight}px`;
   svg.style.pointerEvents = 'none';
   svg.style.zIndex = '10';
   content.appendChild(svg);
   
   // Create container for nodes
   const nodeContainer = document.createElement('div');
   nodeContainer.style.position = 'relative';
   nodeContainer.style.width = `${canvasWidth}px`;
   nodeContainer.style.height = `${canvasHeight}px`;
   nodeContainer.style.zIndex = '5';
   content.appendChild(nodeContainer);
   
   // Render nodes
   Object.values(flowchart).forEach(node => {
       renderNode(node, nodeContainer);
   });
   
   // Render connections
   renderConnections(svg);
   
   console.log('Flowchart rendered with positions:', 
       Object.fromEntries(Object.entries(flowchart).map(([id, node]) => [id, node.position]))
   );
}


// REPLACE the renderNode function with this version that fixes reference issues:
// REPLACE the renderNode function (around line 580) with this:
function renderNode(node, container) {
    console.log(`Rendering node ${node.id} with position:`, node.position);
    
    const nodeEl = document.createElement('div');
    nodeEl.className = 'flowchart-node';
    nodeEl.id = `node-${node.id}`;
    nodeEl.style.position = 'absolute';
    
    const mainNodeData = flowchart[node.id];
    
    const posX = (mainNodeData.position && typeof mainNodeData.position.x === 'number') ? mainNodeData.position.x : 100;
    const posY = (mainNodeData.position && typeof mainNodeData.position.y === 'number') ? mainNodeData.position.y : 100;

    nodeEl.style.left = `${posX}px`;
    nodeEl.style.top = `${posY}px`;

    console.log(`Set node ${node.id} DOM position to: left=${posX}px, top=${posY}px`);
    
    // Apply custom size if it exists, otherwise use fit-content
    if (mainNodeData.customSize) {
        nodeEl.style.width = `${mainNodeData.customSize.width}px`;
        nodeEl.style.height = `${mainNodeData.customSize.height}px`;
        nodeEl.style.maxWidth = 'none';
    } else {
        nodeEl.style.width = 'fit-content';
        if (window.innerWidth <= 768) {
            nodeEl.style.maxWidth = '280px';
        } else {
            nodeEl.style.maxWidth = '350px';
        }
    }
    
    nodeEl.style.minWidth = window.innerWidth <= 768 ? '140px' : '160px';
    nodeEl.style.minHeight = '120px';
    nodeEl.style.background = 'white';
    nodeEl.style.border = '2px solid #667eea';
    nodeEl.style.borderRadius = '12px';
    nodeEl.style.padding = window.innerWidth <= 768 ? '10px' : '12px';
    nodeEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    nodeEl.style.cursor = 'move';
    nodeEl.style.userSelect = 'none';
    nodeEl.style.fontSize = window.innerWidth <= 768 ? '0.8rem' : '0.85rem';
    nodeEl.style.wordWrap = 'break-word';
    nodeEl.style.overflowWrap = 'break-word';
    
    // Mobile-specific touch handling
    if (window.innerWidth <= 768) {
        nodeEl.style.touchAction = 'none';
        nodeEl.style.WebkitUserSelect = 'none';
        nodeEl.style.MozUserSelect = 'none';
        nodeEl.style.msUserSelect = 'none';
    }
    
    // Add node type styling
    const isStart = node.id === 'start' || !Object.values(flowchart).some(n => 
        n.options.some(opt => opt.nextNodeId === node.id)
    );
    const isEnd = node.options.length === 0 || 
        node.options.every(opt => !flowchart[opt.nextNodeId]);
    
    if (isStart) {
        nodeEl.style.borderColor = '#27ae60';
        nodeEl.style.borderLeftWidth = '6px';
    } else if (isEnd) {
        nodeEl.style.borderColor = '#e74c3c';
        nodeEl.style.borderLeftWidth = '6px';
    }
    
    // Node header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.style.fontSize = window.innerWidth <= 768 ? '0.7rem' : '0.75rem';
    header.style.fontWeight = 'bold';
    header.style.color = '#333';
    header.style.fontFamily = 'Monaco, Consolas, monospace';
    header.textContent = node.id;
    
    // Node indicators
    const indicators = document.createElement('div');
    indicators.style.display = 'flex';
    indicators.style.gap = '4px';
    
    if (node.image) {
        const imgIndicator = document.createElement('div');
        imgIndicator.style.width = '16px';
        imgIndicator.style.height = '16px';
        imgIndicator.style.borderRadius = '50%';
        imgIndicator.style.background = '#3498db';
        imgIndicator.style.color = 'white';
        imgIndicator.style.display = 'flex';
        imgIndicator.style.alignItems = 'center';
        imgIndicator.style.justifyContent = 'center';
        imgIndicator.style.fontSize = '0.6rem';
        imgIndicator.textContent = '📷';
        indicators.appendChild(imgIndicator);
    }
    
    const brokenLinks = node.options.filter(opt => !flowchart[opt.nextNodeId]);
    if (brokenLinks.length > 0) {
        const warningIndicator = document.createElement('div');
        warningIndicator.style.width = '16px';
        warningIndicator.style.height = '16px';
        warningIndicator.style.borderRadius = '50%';
        warningIndicator.style.background = '#e74c3c';
        warningIndicator.style.color = 'white';
        warningIndicator.style.display = 'flex';
        warningIndicator.style.alignItems = 'center';
        warningIndicator.style.justifyContent = 'center';
        warningIndicator.style.fontSize = '0.6rem';
        warningIndicator.textContent = '⚠️';
        indicators.appendChild(warningIndicator);
    }
    
    header.appendChild(indicators);
    nodeEl.appendChild(header);
    
    // Node instruction
    const instruction = document.createElement('div');
    instruction.style.marginBottom = '8px';
    instruction.style.fontSize = window.innerWidth <= 768 ? '0.75rem' : '0.8rem';
    instruction.style.lineHeight = '1.3';
    instruction.style.color = '#333';
    instruction.style.wordWrap = 'break-word';
    instruction.innerHTML = linkifyText(node.instruction);
    nodeEl.appendChild(instruction);
    
    // Node options
    if (node.options.length > 0) {
        const optionsContainer = document.createElement('div');
        optionsContainer.style.marginBottom = '8px';
        
        node.options.forEach(option => {
            const optionEl = document.createElement('div');
            optionEl.style.display = 'flex';
            optionEl.style.alignItems = 'center';
            optionEl.style.padding = '4px 6px';
            optionEl.style.background = '#f8f9fa';
            optionEl.style.borderRadius = '4px';
            optionEl.style.marginBottom = '2px';
            optionEl.style.fontSize = window.innerWidth <= 768 ? '0.65rem' : '0.7rem';
            optionEl.style.borderLeft = '3px solid #667eea';
            
            const isValid = flowchart[option.nextNodeId];
            if (!isValid) {
                optionEl.style.borderLeftColor = '#e74c3c';
                optionEl.style.background = '#ffeaea';
            }
            
            const label = document.createElement('span');
            label.style.fontWeight = '600';
            label.style.marginRight = '6px';
            label.textContent = option.label;
            
            const arrow = document.createElement('span');
            arrow.style.margin = '0 4px';
            arrow.style.color = '#666';
            arrow.textContent = '→';
            
            const target = document.createElement('span');
            target.style.fontFamily = 'Monaco, Consolas, monospace';
            target.style.fontSize = window.innerWidth <= 768 ? '0.6rem' : '0.65rem';
            target.style.color = isValid ? '#667eea' : '#e74c3c';
            target.textContent = option.nextNodeId;
            
            optionEl.appendChild(label);
            optionEl.appendChild(arrow);
            optionEl.appendChild(target);
            
            if (!isValid) {
                const warning = document.createElement('span');
                warning.style.color = '#e74c3c';
                warning.style.fontSize = '0.6rem';
                warning.style.marginLeft = '4px';
                warning.textContent = '⚠️';
                optionEl.appendChild(warning);
            }
            
            optionsContainer.appendChild(optionEl);
        });
        
        nodeEl.appendChild(optionsContainer);
    }
    
    // Node actions - Different for mobile vs desktop
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '4px';
    actions.style.paddingTop = '8px';
    actions.style.borderTop = '1px solid #e0e0e0';
    
    // Check if we're on mobile
    if (window.innerWidth <= 768) {
        // Mobile: Hide action buttons since we use the toolbar
        actions.style.display = 'none';
    } else {
        // Desktop: Show action buttons
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary';
        editBtn.style.padding = '4px 8px';
        editBtn.style.fontSize = '0.7rem';
        editBtn.style.margin = '0';
        editBtn.textContent = '✏️ Edit';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editNode(node.id);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.style.padding = '4px 8px';
        deleteBtn.style.fontSize = '0.7rem';
        deleteBtn.style.margin = '0';
        deleteBtn.textContent = '🗑️ Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteNode(node.id);
        };
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
    }
    
    nodeEl.appendChild(actions);
    
// Interactions are handled globally by the unified system - no per-node setup needed
    
    container.appendChild(nodeEl);
    
    // Verify position after rendering
    console.log(`Node ${node.id} final DOM position: left=${nodeEl.style.left}, top=${nodeEl.style.top}`);
    console.log(`Node ${node.id} stored position:`, mainNodeData.position);
}




function renderConnections(svg) {
    // Clear existing connections
    svg.innerHTML = '';
    
    // Create arrow marker definition
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#667eea');
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
    
    // Draw connections between nodes
    Object.values(flowchart).forEach(node => {
        node.options.forEach((option, index) => {
            const targetNode = flowchart[option.nextNodeId];
            if (!targetNode) return;
            
            // FIXED: Account for mobile zoom scale when calculating positions
            const sourcePos = getNodeConnectionPoint(node, 'output', index, node.options.length);
            const targetPos = getNodeConnectionPoint(targetNode, 'input');
            
            const line = createConnectionLine(sourcePos, targetPos, option.label);
            svg.appendChild(line);
        });
    });
}

function getNodeConnectionPoint(node, type, optionIndex = 0, totalOptions = 1) {
    const nodePos = node.position || { x: 100, y: 100 };
    
    // FIXED: Get actual rendered node dimensions for mobile
    const nodeEl = document.getElementById(`node-${node.id}`);
    let nodeWidth, nodeHeight;
    
    if (nodeEl) {
        // Use actual rendered dimensions
        nodeWidth = nodeEl.offsetWidth;
        nodeHeight = nodeEl.offsetHeight;
    } else {
        // Fallback dimensions
        nodeWidth = window.innerWidth <= 768 ? 280 : 350;
        nodeHeight = node.customSize?.height || 120;
    }
    
    if (type === 'input') {
        // Connection point at the top-center of the target node
        return {
            x: nodePos.x + nodeWidth / 2,
            y: nodePos.y
        };
    } else {
        // For output connections, find the target node to determine the best side
        const targetNodeId = node.options[optionIndex]?.nextNodeId;
        const targetNode = flowchart[targetNodeId];
        
        if (!targetNode || !targetNode.position) {
            // Fallback to right side if target not found
            return {
                x: nodePos.x + nodeWidth,
                y: nodePos.y + nodeHeight / 2 + (optionIndex * 30)
            };
        }
        
        // Calculate which side is closer to the target
        const sourceCenter = { x: nodePos.x + nodeWidth / 2, y: nodePos.y + nodeHeight / 2 };
        const targetCenter = { x: targetNode.position.x + (nodeWidth / 2), y: targetNode.position.y + (nodeHeight / 2) };
        
        // Determine the best connection side based on relative positions
        const deltaX = targetCenter.x - sourceCenter.x;
        const deltaY = targetCenter.y - sourceCenter.y;
        
        let connectionPoint;
        
        // If target is significantly to the left, connect from left side
        if (deltaX < -nodeWidth * 0.3) {
            connectionPoint = {
                x: nodePos.x,
                y: nodePos.y + nodeHeight / 2 + (optionIndex * 30)
            };
        }
        // If target is significantly to the right, connect from right side
        else if (deltaX > nodeWidth * 0.3) {
            connectionPoint = {
                x: nodePos.x + nodeWidth,
                y: nodePos.y + nodeHeight / 2 + (optionIndex * 30)
            };
        }
        // If target is roughly horizontally aligned, choose based on vertical position
        else {
            // If target is below, connect from bottom
            if (deltaY > nodeHeight * 0.5) {
                connectionPoint = {
                    x: nodePos.x + nodeWidth / 2 + (optionIndex - totalOptions / 2) * 40,
                    y: nodePos.y + nodeHeight
                };
            }
            // If target is above, connect from top
            else if (deltaY < -nodeHeight * 0.5) {
                connectionPoint = {
                    x: nodePos.x + nodeWidth / 2 + (optionIndex - totalOptions / 2) * 40,
                    y: nodePos.y
                };
            }
            // Default to right side for same level
            else {
                connectionPoint = {
                    x: nodePos.x + nodeWidth,
                    y: nodePos.y + nodeHeight / 2 + (optionIndex * 30)
                };
            }
        }
        
        return connectionPoint;
    }
}

function createConnectionLine(start, end, label) {
   const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
   
   // Create curved path with smarter control points
   const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
   
   // Calculate the distance and direction
   const deltaX = end.x - start.x;
   const deltaY = end.y - start.y;
   const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
   
   // Adjust control points based on connection direction
   let controlPoint1, controlPoint2;
   
   // For horizontal connections
   if (Math.abs(deltaX) > Math.abs(deltaY)) {
       const controlDistance = Math.min(distance * 0.4, 100);
       controlPoint1 = { 
           x: start.x + (deltaX > 0 ? controlDistance : -controlDistance), 
           y: start.y 
       };
       controlPoint2 = { 
           x: end.x - (deltaX > 0 ? controlDistance : -controlDistance), 
           y: end.y 
       };
   }
   // For vertical connections
   else {
       const controlDistance = Math.min(distance * 0.4, 80);
       controlPoint1 = { 
           x: start.x, 
           y: start.y + (deltaY > 0 ? controlDistance : -controlDistance) 
       };
       controlPoint2 = { 
           x: end.x, 
           y: end.y - (deltaY > 0 ? controlDistance : -controlDistance) 
       };
   }
   
   const pathData = `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`;
   
   path.setAttribute('d', pathData);
   path.setAttribute('stroke', '#667eea');
   path.setAttribute('stroke-width', '2');
   path.setAttribute('fill', 'none');
   path.setAttribute('marker-end', 'url(#arrowhead)');
   
   group.appendChild(path);
   
   // Add label if there's space and it's not too long
   if (label && label.length < 20 && distance > 80) {
       const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
       const labelX = (start.x + end.x) / 2;
       const labelY = (start.y + end.y) / 2;
       
       text.setAttribute('x', labelX);
       text.setAttribute('y', labelY);
       text.setAttribute('text-anchor', 'middle');
       text.setAttribute('font-size', '11px');
       text.setAttribute('font-weight', '600');
       text.setAttribute('fill', '#667eea');
       text.setAttribute('dy', '0.35em');
       
       // Add background rectangle for better readability
       const bbox = text.getBBox ? text.getBBox() : { width: label.length * 7, height: 14 };
       const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
       rect.setAttribute('x', labelX - bbox.width / 2 - 2);
       rect.setAttribute('y', labelY - bbox.height / 2);
       rect.setAttribute('width', bbox.width + 4);
       rect.setAttribute('height', bbox.height);
       rect.setAttribute('fill', 'white');
       rect.setAttribute('stroke', '#667eea');
       rect.setAttribute('stroke-width', '1');
       rect.setAttribute('rx', '3');
       
       text.textContent = label;
       group.appendChild(rect);
       group.appendChild(text);
   }
   
   return group;
}

// REPLACE THE ENTIRE updateFlowchartDisplay FUNCTION with this:

function updateFlowchartDisplay() {
    const stats = document.getElementById('flowchart-stats');
    const searchContainer = document.getElementById('search-container');
    
    const nodeCount = Object.keys(flowchart).length;
    stats.textContent = `${nodeCount} node${nodeCount !== 1 ? 's' : ''}`;
    
    // Show/hide search container based on whether there are nodes
    if (nodeCount === 0) {
        searchContainer.style.display = 'none';
    } else {
        searchContainer.style.display = 'block';
    }
    
    updateNavigateButtonState();
    
    // CRITICAL FIX: Only validate positions if we actually have broken data
    let needsValidation = false;
    Object.values(flowchart).forEach(node => {
        if (!node.position || 
            typeof node.position.x !== 'number' || 
            typeof node.position.y !== 'number' ||
            isNaN(node.position.x) || 
            isNaN(node.position.y)) {
            needsValidation = true;
        }
    });
    
    if (needsValidation) {
        console.log('Some nodes need position validation...');
        validateAndFixNodePositions();
    } else {
        console.log('All node positions are valid, skipping validation');
    }
    
    // Render the flowchart (this should preserve existing positions)
    renderFlowchart();
    
    // Re-initialize interaction system after flowchart update
    setTimeout(() => {
        initializeNodeInteractions();
    }, 100);
}

// Updated form submission handler
document.getElementById('node-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION START ===');
    
    const nodeId = document.getElementById('node-id').value.trim();
    const instruction = document.getElementById('node-instruction').value.trim();
    
    console.log('Node ID:', nodeId);
    console.log('Instruction:', instruction);
    
    // Check for special end node IDs FIRST
    const isEndNodeByID = nodeId.toLowerCase() === 'end' || 
                         nodeId.toLowerCase() === 'exit' || 
                         nodeId.toLowerCase() === 'finish' || 
                         nodeId.toLowerCase() === 'complete';
    
    console.log('Is end node by ID:', isEndNodeByID);
    
    const optionItems = document.querySelectorAll('.option-item');
    console.log('Found option items:', optionItems.length);
    
    let options = [];
    let hasExitOption = false;
    
    // Process options only if not an end node by ID
    if (!isEndNodeByID) {
        console.log('Processing options (not an end node)...');
        optionItems.forEach((item, index) => {
            const inputs = item.querySelectorAll('input');
            const label = inputs[0].value.trim();
            const nextNodeId = inputs[1].value.trim();
            
            console.log(`Option ${index}: label="${label}", nextNodeId="${nextNodeId}"`);
            
            if (label && nextNodeId) {
                if (label.toLowerCase() === 'exit' || nextNodeId.toLowerCase() === 'exit') {
                    hasExitOption = true;
                    console.log('Found exit option');
                } else {
                    options.push({ label, nextNodeId });
                }
            }
        });
    } else {
        console.log('Skipping option processing - this is an end node by ID');
    }
    
    console.log('Final options array:', options);
    console.log('Has exit option:', hasExitOption);
    
    // Validation: Allow if it's an end node OR has valid options
    const shouldPass = isEndNodeByID || hasExitOption || options.length > 0;
    console.log('Should pass validation:', shouldPass);
    
    if (!isEndNodeByID && !hasExitOption && options.length === 0) {
        console.log('VALIDATION FAILED');
        alert('Please add at least one option, or:\n• Use "end", "exit", "finish", or "complete" as the node ID, or\n• Add an option with "exit" as the label or target to create an end node.');
        return;
    }
    
    console.log('VALIDATION PASSED - Creating node...');
    
    // Check if we're editing and the ID changed, make sure new ID doesn't exist
    if (editingNodeId && editingNodeId !== nodeId && flowchart[nodeId]) {
        alert('A node with this ID already exists. Please choose a different ID.');
        return;
    }
    
    // CRITICAL FIX: Preserve existing position when editing
    let position = null;
    
    if (editingNodeId && flowchart[editingNodeId] && flowchart[editingNodeId].position) {
        // EDITING: Keep the exact same position
        position = { 
            x: flowchart[editingNodeId].position.x, 
            y: flowchart[editingNodeId].position.y 
        };
        console.log(`Preserving existing position for ${editingNodeId}:`, position);
        
        // If ID changed, remove the old node AFTER preserving position
        if (editingNodeId !== nodeId) {
            delete flowchart[editingNodeId];
        }
    } else {
        // NEW NODE: Generate a new position using proper hierarchy
        position = generateNodePosition();
        console.log(`Generated new position for ${nodeId}:`, position);
    }
    
    // Ensure position is valid
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        position = { x: 150, y: 100 };
        console.warn('Fallback position used:', position);
    }
    
    console.log(`Final position for ${nodeId}:`, position);
    
    // Create/update the node with preserved position
    flowchart[nodeId] = {
        id: nodeId,
        instruction: instruction,
        options: options,
        image: currentImageData,
        position: { 
            x: position.x, 
            y: position.y 
        }
    };
    
    // Preserve custom size if editing
    if (editingNodeId && flowchart[editingNodeId] && flowchart[editingNodeId].customSize) {
        flowchart[nodeId].customSize = { ...flowchart[editingNodeId].customSize };
    }
    
    console.log('Created/updated node:', flowchart[nodeId]);
    
    console.log('=== POSITION DEBUG ===');
    console.log('Position in flowchart object:', flowchart[nodeId].position);
    console.log('All flowchart positions:', Object.fromEntries(Object.entries(flowchart).map(([id, node]) => [id, node.position])));
    console.log('=== END POSITION DEBUG ===');
    updateFlowchartDisplay();
    resetForm();
    
    const action = editingNodeId ? 'updated' : 'added';
    const isEndNode = (isEndNodeByID || hasExitOption) && options.length === 0;
    const nodeType = isEndNode ? 'End' : 'Node';
    alert(`${nodeType} "${nodeId}" ${action} successfully!`);
    
    console.log('=== FORM SUBMISSION COMPLETE ===');
});



// Updated resetForm function
function resetForm() {
    document.getElementById('node-form').reset();
    editingNodeId = null;
    currentImageData = null;
    
    // Hide image preview
    document.getElementById('image-preview').classList.add('hidden');
    
    // Update UI to show "Add" mode
    document.getElementById('submit-btn').textContent = 'Add Node';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    document.getElementById('node-id').disabled = false;
    
    // Reset to one option with NO required attributes
const container = document.getElementById('options-container');
container.innerHTML = `
    <div class="option-item">
        <input type="text" placeholder="Option label (e.g., Yes)">
        <input type="text" placeholder="Next node ID (e.g., verify-id)">
        <button type="button" class="remove-option" onclick="removeOption(this)">×</button>
    </div>
`;
}

function editNode(nodeId) {
    const node = flowchart[nodeId];
    if (!node) return;
    
    editingNodeId = nodeId;
    
    // Populate form with node data
    document.getElementById('node-id').value = node.id;
    document.getElementById('node-instruction').value = node.instruction;
    
    // Handle image data
    currentImageData = node.image || null;
    if (currentImageData) {
        document.getElementById('preview-img').src = currentImageData;
        document.getElementById('image-preview').classList.remove('hidden');
    } else {
        document.getElementById('image-preview').classList.add('hidden');
    }
    
    // Clear and populate options
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    // If node has options, populate them
    if (node.options && node.options.length > 0) {
        node.options.forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <input type="text" value="${option.label}" required>
                <input type="text" value="${option.nextNodeId}" required>
                <button type="button" class="remove-option" onclick="removeOption(this)">×</button>
            `;
            container.appendChild(optionDiv);
        });
    } else {
        // For end nodes with no options, add one empty option field
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';
        optionDiv.innerHTML = `
            <input type="text" placeholder="Option label (e.g., Yes)" required>
            <input type="text" placeholder="Next node ID (e.g., verify-id)" required>
            <button type="button" class="remove-option" onclick="removeOption(this)">×</button>
        `;
        container.appendChild(optionDiv);
    }
    
    // Update UI to show "Edit" mode
    document.getElementById('submit-btn').textContent = 'Update Node';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    document.getElementById('node-id').disabled = true; // Prevent ID changes to avoid confusion
    
    // Scroll to form
    document.getElementById('node-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
   resetForm();
}

function deleteNode(nodeId) {
   if (confirm(`Are you sure you want to delete node "${nodeId}"?`)) {
       delete flowchart[nodeId];
       updateFlowchartDisplay();
   }
}

// Enhanced export function with robust position saving and debugging
async function exportFlowchart() {
   if (Object.keys(flowchart).length === 0) {
       alert('No flowchart to export. Please create some nodes first.');
       return;
   }
   
   console.log('=== EXPORT DEBUG START ===');
   console.log('Flowchart before position save:', JSON.parse(JSON.stringify(flowchart)));
   
   // Save current node positions before export
   saveCurrentNodePositions();
   
   console.log('Flowchart after position save:', JSON.parse(JSON.stringify(flowchart)));
   
   // Force a small delay to ensure all position updates are complete
   await new Promise(resolve => setTimeout(resolve, 100));
   
   const dataStr = JSON.stringify(flowchart, null, 2);
   console.log('Final export data:', dataStr);
   console.log('=== EXPORT DEBUG END ===');
   
   // Always use custom dialog for consistent experience
   showCustomSaveDialog(dataStr);
}

// Enhanced function to save current node positions from DOM to flowchart data
// REPLACE THE saveCurrentNodePositions FUNCTION (around line 810) WITH THIS:

function saveCurrentNodePositions() {
    console.log('=== SAVING CURRENT NODE POSITIONS ===');
    
    Object.keys(flowchart).forEach(nodeId => {
        const nodeEl = document.getElementById(`node-${nodeId}`);
        if (nodeEl) {
            const currentLeft = parseInt(nodeEl.style.left) || 0;
            const currentTop = parseInt(nodeEl.style.top) || 0;
            
            console.log(`Saving position for ${nodeId}: x=${currentLeft}, y=${currentTop}`);
            
            // CRITICAL: Ensure position object exists
            if (!flowchart[nodeId].position) {
                flowchart[nodeId].position = {};
            }
            
            // Update the flowchart data directly
            flowchart[nodeId].position.x = currentLeft;
            flowchart[nodeId].position.y = currentTop;
            
            // Also save custom size if it exists
            if (nodeEl.style.width && nodeEl.style.height && 
                nodeEl.style.width !== 'fit-content' && nodeEl.style.width !== 'auto') {
                if (!flowchart[nodeId].customSize) {
                    flowchart[nodeId].customSize = {};
                }
                flowchart[nodeId].customSize.width = parseInt(nodeEl.style.width);
                flowchart[nodeId].customSize.height = parseInt(nodeEl.style.height);
            }
        } else {
            console.warn(`Node element not found: node-${nodeId}`);
            // Ensure position exists with defaults even if DOM element missing
            if (!flowchart[nodeId].position) {
                flowchart[nodeId].position = { x: 100, y: 100 };
                console.log(`Added default position for ${nodeId}`);
            }
        }
    });
    
    console.log('=== POSITION SAVE COMPLETE ===');
    console.log('Current flowchart positions:', 
        Object.fromEntries(Object.entries(flowchart).map(([id, node]) => [id, node.position]))
    );
}



// REPLACE the importFlowchart function (around line 850) with this:
function importFlowchart(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedFlowchart = JSON.parse(e.target.result);
            
            console.log('=== IMPORT DEBUG START ===');
            console.log('Imported flowchart:', importedFlowchart);
            
            // Validate the imported data
            if (typeof importedFlowchart !== 'object' || importedFlowchart === null) {
                throw new Error('Invalid flowchart format - must be a valid JSON object');
            }
            
            // Additional validation to ensure it has the right structure
            for (let nodeId in importedFlowchart) {
                const node = importedFlowchart[nodeId];
                if (!node.id || !node.instruction || !Array.isArray(node.options)) {
                    throw new Error(`Invalid node structure for "${nodeId}"`);
                }
                
                // Log position data for debugging
                console.log(`Node ${nodeId} imported position:`, node.position);
                
                // CRITICAL FIX: Ensure position is preserved during import
                if (!node.position || 
                    typeof node.position.x !== 'number' || 
                    typeof node.position.y !== 'number') {
                    console.warn(`Node ${nodeId} missing position, creating default`);
                    const nodeIndex = Object.keys(importedFlowchart).indexOf(nodeId);
                    node.position = {
                        x: 150 + (nodeIndex % 3) * 300,
                        y: 100 + Math.floor(nodeIndex / 3) * 250
                    };
                }
            }
            
            // Set the flowchart data - PRESERVE the imported positions exactly
            flowchart = JSON.parse(JSON.stringify(importedFlowchart));
            
            console.log('Final flowchart after import with positions:', 
                Object.fromEntries(Object.entries(flowchart).map(([id, node]) => [id, node.position]))
            );
            console.log('=== IMPORT DEBUG END ===');
            
            // Update the display WITHOUT calling functions that might reset positions
            updateFlowchartDisplay();
            resetForm();
            
            alert('Flowchart imported successfully!');
            
        } catch (error) {
            alert('Error importing flowchart: ' + error.message);
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
    
    // Clear the file input so the same file can be imported again if needed
    event.target.value = '';
}

// Enhanced custom save dialog with better Chrome support
function showCustomSaveDialog(dataStr) {
   console.log('Showing custom save dialog');
   
   const overlay = document.createElement('div');
   overlay.style.cssText = `
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background: rgba(0, 0, 0, 0.5);
       display: flex;
       align-items: center;
       justify-content: center;
       z-index: 10000;
       backdrop-filter: blur(5px);
   `;
   
   const modal = document.createElement('div');
   modal.style.cssText = `
       background: white;
       padding: 30px;
       border-radius: 15px;
       box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
       max-width: 500px;
       width: 90%;
       text-align: center;
   `;
   
   modal.innerHTML = `
       <h3 style="margin: 0 0 20px 0; color: #333; font-size: 1.3rem;">📄 Export Flowchart</h3>
       <p style="margin: 0 0 20px 0; color: #666; line-height: 1.4;">
           Choose a filename for your flowchart export:
       </p>
       <div style="margin-bottom: 20px;">
           <input 
               type="text" 
               id="export-filename" 
               value="flowchart.json"
               style="
                   width: 100%;
                   padding: 12px;
                   border: 2px solid #e0e0e0;
                   border-radius: 8px;
                   font-size: 1rem;
                   text-align: center;
                   box-sizing: border-box;
               "
               placeholder="Enter filename..."
           >
       </div>
       <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
           <button 
               id="export-cancel-btn"
               style="
                   padding: 12px 24px;
                   background: #95a5a6;
                   color: white;
                   border: none;
                   border-radius: 8px;
                   font-size: 1rem;
                   font-weight: 600;
                   cursor: pointer;
                   margin: 4px;
               "
           >
               Cancel
           </button>
           <button 
               id="export-native-btn"
               style="
                   padding: 12px 24px;
                   background: #3498db;
                   color: white;
                   border: none;
                   border-radius: 8px;
                   font-size: 1rem;
                   font-weight: 600;
                   cursor: pointer;
                   margin: 4px;
               "
           >
               📁 Choose Location
           </button>
           <button 
               id="export-download-btn"
               style="
                   padding: 12px 24px;
                   background: #27ae60;
                   color: white;
                   border: none;
                   border-radius: 8px;
                   font-size: 1rem;
                   font-weight: 600;
                   cursor: pointer;
                   margin: 4px;
               "
           >
               💾 Download
           </button>
       </div>
       <p style="margin: 15px 0 0 0; color: #999; font-size: 0.85rem;">
           "Choose Location" opens your system's save dialog (Chrome 86+)<br>
           "Download" saves to your default Downloads folder
       </p>
   `;
   
   overlay.appendChild(modal);
   document.body.appendChild(overlay);
   
   const filenameInput = document.getElementById('export-filename');
   filenameInput.focus();
   filenameInput.setSelectionRange(0, filenameInput.value.lastIndexOf('.'));
   
   const closeModal = () => {
       document.body.removeChild(overlay);
   };
   
   // Cancel button
   document.getElementById('export-cancel-btn').addEventListener('click', closeModal);
   overlay.addEventListener('click', (e) => {
       if (e.target === overlay) closeModal();
   });
   
   // Native file picker button (File System Access API)
   document.getElementById('export-native-btn').addEventListener('click', async () => {
       let filename = filenameInput.value.trim();
       if (!filename.endsWith('.json')) {
           filename += '.json';
       }
       
       try {
           if ('showSaveFilePicker' in window) {
               console.log('Attempting to use File System Access API');
               
               const fileHandle = await window.showSaveFilePicker({
                   suggestedName: filename,
                   types: [
                       {
                           description: 'JSON files',
                           accept: {
                               'application/json': ['.json'],
                           },
                       },
                   ],
               });
               
               const writable = await fileHandle.createWritable();
               await writable.write(dataStr);
               await writable.close();
               
               closeModal();
               showExportSuccess('File saved successfully to chosen location!');
               
           } else {
               alert('File picker not supported in this browser. Use the Download button instead.');
           }
           
       } catch (error) {
           if (error.name === 'AbortError') {
               console.log('User cancelled native save dialog');
           } else {
               console.error('File System Access API error:', error);
               alert('Error with file picker: ' + error.message + '\nTry the Download button instead.');
           }
       }
   });
   
   // Regular download button
   document.getElementById('export-download-btn').addEventListener('click', () => {
       let filename = filenameInput.value.trim();
       
       if (!filename) {
           filenameInput.focus();
           filenameInput.style.borderColor = '#e74c3c';
           setTimeout(() => {
               filenameInput.style.borderColor = '#e0e0e0';
           }, 2000);
           return;
       }
       
       if (!filename.endsWith('.json')) {
           filename += '.json';
       }
       
       console.log('Downloading with filename:', filename);
       
       try {
           // Create the blob
           const blob = new Blob([dataStr], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           
           // Create download link
           const link = document.createElement('a');
           link.href = url;
           link.download = filename;
           
           // Ensure the download attribute is respected
           link.style.display = 'none';
           document.body.appendChild(link);
           
           // Trigger download
           link.click();
           
           // Cleanup
           document.body.removeChild(link);
           URL.revokeObjectURL(url);
           
           closeModal();
           showExportSuccess(`File "${filename}" downloaded to your Downloads folder!`);
           
       } catch (error) {
           console.error('Download error:', error);
           alert('Download failed: ' + error.message);
       }
   });
   
   // Keyboard shortcuts
   filenameInput.addEventListener('keydown', (e) => {
       if (e.key === 'Enter') {
           // Default to native picker if available, otherwise download
           if ('showSaveFilePicker' in window) {
               document.getElementById('export-native-btn').click();
           } else {
               document.getElementById('export-download-btn').click();
           }
       } else if (e.key === 'Escape') {
           closeModal();
       }
   });
}

// Enhanced success notification
function showExportSuccess(message = 'Flowchart exported successfully!') {
   console.log('Export success:', message);
   
   // Remove any existing notifications
   const existing = document.querySelector('.export-notification');
   if (existing) {
       existing.remove();
   }
   
   const notification = document.createElement('div');
   notification.className = 'export-notification';
   notification.style.cssText = `
       position: fixed;
       top: 20px;
       right: 20px;
       background: #27ae60;
       color: white;
       padding: 15px 20px;
       border-radius: 10px;
       box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
       z-index: 10001;
       font-weight: 600;
       animation: slideInRight 0.3s ease;
       max-width: 300px;
       word-wrap: break-word;
   `;
   
   notification.innerHTML = `
       <div style="display: flex; align-items: center; gap: 8px;">
           <span>✅</span>
           <span>${message}</span>
       </div>
   `;
   
   // Add animation styles if not already present
   if (!document.getElementById('export-animations')) {
       const style = document.createElement('style');
       style.id = 'export-animations';
       style.textContent = `
           @keyframes slideInRight {
               from { transform: translateX(100%); opacity: 0; }
               to { transform: translateX(0); opacity: 1; }
           }
           @keyframes slideOutRight {
               from { transform: translateX(0); opacity: 1; }
               to { transform: translateX(100%); opacity: 0; }
           }
       `;
       document.head.appendChild(style);
   }
   
   document.body.appendChild(notification);
   
   // Auto-remove after 4 seconds
   setTimeout(() => {
       notification.style.animation = 'slideOutRight 0.3s ease';
       setTimeout(() => {
           if (notification.parentNode) {
               notification.remove();
           }
       }, 300);
   }, 4000);
}


// Replace your existing clearFlowchart function with this:
function clearFlowchart() {
   if (confirm('Are you sure you want to clear all nodes? This cannot be undone.')) {
       flowchart = {};
       updateFlowchartDisplay();
       resetForm();
       updateNavigateButtonState(); // Add this line
   }
}

function loadNavigationView() {
   const content = document.getElementById('navigation-content');
   
   if (Object.keys(flowchart).length === 0) {
       content.innerHTML = '<p style="text-align: center; color: #666;">No flowchart loaded. Please create nodes or import a flowchart.</p>';
       return;
   }
   
   // If current node doesn't exist, try to find 'start' node or use the first available node
   if (!flowchart[currentNodeId]) {
       if (flowchart['start']) {
           currentNodeId = 'start';
       } else {
           // Use the first available node
           const firstNodeId = Object.keys(flowchart)[0];
           currentNodeId = firstNodeId;
       }
   }
   
   const currentNode = flowchart[currentNodeId];
   
   let html = `
       <div class="current-node">
           <div class="node-id">Current Node: ${currentNode.id}</div>
           <div class="node-instruction">${linkifyText(currentNode.instruction)}</div>
           ${currentNode.image ? `<div class="node-image"><img src="${currentNode.image}" alt="Node illustration"></div>` : ''}
       </div>
       <div class="navigate-options">
   `;
   
   // Add option buttons
   currentNode.options.forEach(option => {
       html += `
           <button class="btn btn-primary btn-large" onclick="navigateToNode('${option.nextNodeId}')">
               ${option.label}
           </button>
       `;
   });
   
   html += `</div>`;
   
   // Add navigation controls
   html += `
       <div class="navigation-buttons">
           <button class="btn btn-secondary" onclick="goBack()" ${navigationHistory.length === 0 ? 'disabled' : ''}>
               ← Back
           </button>
           <button class="btn btn-secondary" onclick="resetNavigation()">
               🏠 Start Over
           </button>
       </div>
   `;
   
   content.innerHTML = html;
}

function navigateToNode(nodeId) {
   if (!flowchart[nodeId]) {
       alert(`Node "${nodeId}" not found!`);
       return;
   }
   
   // Disable all buttons to prevent double-clicking
   const buttons = document.querySelectorAll('.navigate-options .btn');
   buttons.forEach(btn => {
       btn.disabled = true;
       btn.style.opacity = '0.6';
   });
   
   // Add a brief delay with visual feedback
   setTimeout(() => {
       navigationHistory.push(currentNodeId);
       currentNodeId = nodeId;
       
       // Fade out current content
       const content = document.getElementById('navigation-content');
       content.style.opacity = '0.3';
       content.style.transform = 'translateY(-10px)';
       
       // Load new content after fade
       setTimeout(() => {
           loadNavigationView();
           
           // Fade in new content
           content.style.opacity = '1';
           content.style.transform = 'translateY(0)';
       }, 150);
   }, 200);
}

function goBack() {
   if (navigationHistory.length > 0) {
       currentNodeId = navigationHistory.pop();
       loadNavigationView();
   }
}

function resetNavigation() {
   // Reset to 'start' node if it exists, otherwise use the first available node
   if (flowchart['start']) {
       currentNodeId = 'start';
   } else if (Object.keys(flowchart).length > 0) {
       currentNodeId = Object.keys(flowchart)[0];
   } else {
       currentNodeId = 'start';
   }
   navigationHistory = [];
   loadNavigationView();
}

function previewImage(event) {
   const file = event.target.files[0];
   if (!file) return;
   
   // Check file size (limit to 5MB)
   if (file.size > 5 * 1024 * 1024) {
       alert('Image file is too large. Please choose a file smaller than 5MB.');
       event.target.value = '';
       return;
   }
   
   const reader = new FileReader();
   reader.onload = function(e) {
       currentImageData = e.target.result;
       document.getElementById('preview-img').src = currentImageData;
       document.getElementById('image-preview').classList.remove('hidden');
   };
   reader.readAsDataURL(file);
}

function removeImage() {
   currentImageData = null;
   document.getElementById('node-image').value = '';
   document.getElementById('image-preview').classList.add('hidden');
}

// Search functionality
function setupSearchEventListeners() {
   const searchInput = document.getElementById('search-input');
   const clearBtn = document.querySelector('.search-clear-btn');
   
   // Input event for real-time search
   searchInput.addEventListener('input', function(e) {
       const query = e.target.value.trim();
       
       // Show/hide clear button
       if (query.length > 0) {
           clearBtn.classList.add('show');
       } else {
           clearBtn.classList.remove('show');
       }
       
       // Perform search if query has content, otherwise show all nodes
       if (query.length > 0) {
           performSearch(query);
       } else {
           showAllNodes();
       }
   });
   
   // Keydown event for special keys
   searchInput.addEventListener('keydown', handleSearchKeydown);
}

function handleSearchKeydown(event) {
   if (event.key === 'Escape') {
       clearSearch();
   }
}

function performSearch(query) {
   const searchResults = document.getElementById('search-results');
   const flowchartContent = document.getElementById('flowchart-content');
   
   if (!query.trim()) {
       showAllNodes();
       return;
   }
   
   // Search through flowchart nodes
   const results = [];
   const queryLower = query.toLowerCase();
   
   Object.values(flowchart).forEach(node => {
       let matches = [];
       
       // Check node ID
       if (node.id.toLowerCase().includes(queryLower)) {
           matches.push({ type: 'id', text: node.id });
       }
       
       // Check instruction text
       if (node.instruction.toLowerCase().includes(queryLower)) {
           matches.push({ type: 'instruction', text: node.instruction });
       }
       
       // Check options
       node.options.forEach(option => {
           if (option.label.toLowerCase().includes(queryLower)) {
               matches.push({ type: 'option', text: option.label });
           }
           if (option.nextNodeId.toLowerCase().includes(queryLower)) {
               matches.push({ type: 'target', text: option.nextNodeId });
           }
       });
       
       if (matches.length > 0) {
           results.push({ node, matches });
       }
   });
   
   // Display search results
   if (results.length > 0) {
       let html = '';
       results.forEach(({ node, matches }) => {
           html += createSearchResultItem(node, matches, queryLower);
       });
       searchResults.innerHTML = html;
       searchResults.classList.add('show');
       flowchartContent.style.display = 'none';
   } else {
       searchResults.innerHTML = '<div class="no-results">No nodes found matching your search.</div>';
       searchResults.classList.add('show');
       flowchartContent.style.display = 'none';
   }
}

function createSearchResultItem(node, matches, query) {
   return `
       <div class="search-result-item" onclick="selectSearchResult('${node.id}')">
           <div class="search-result-header">
               <div class="search-result-id">${highlightText(node.id, query)}</div>
               <div class="search-result-actions">
                   <button class="btn btn-primary" onclick="event.stopPropagation(); editNode('${node.id}')">Edit</button>
               </div>
           </div>
           <div class="search-result-instruction">${linkifyText(highlightText(node.instruction, query))}</div>
           <div class="search-result-options">
               ${node.options.map(option => 
                   `<span class="search-result-option">${highlightText(option.label, query)} → ${highlightText(option.nextNodeId, query)}</span>`
               ).join('')}
           </div>
       </div>
   `;
}

function highlightText(text, query) {
   if (!query.trim()) return text;
   
   const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
   return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegExp(string) {
   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function selectSearchResult(nodeId) {
   clearSearch();
   
   // Find and highlight the node in the canvas
   const nodeEl = document.getElementById(`node-${nodeId}`);
   if (nodeEl) {
       // Scroll the canvas to show the node
       const canvas = document.getElementById('flowchart-canvas');
       const canvasRect = canvas.getBoundingClientRect();
       const nodeRect = nodeEl.getBoundingClientRect();
       
       // Calculate scroll position to center the node
       const scrollLeft = nodeRect.left - canvasRect.left - canvasRect.width / 2 + nodeRect.width / 2;
       const scrollTop = nodeRect.top - canvasRect.top - canvasRect.height / 2 + nodeRect.height / 2;
       
       canvas.scrollTo({
           left: Math.max(0, scrollLeft),
           top: Math.max(0, scrollTop),
           behavior: 'smooth'
       });
       
       // Highlight the node temporarily
       nodeEl.style.borderColor = '#3498db';
       nodeEl.style.boxShadow = '0 8px 24px rgba(52,152,219,0.4)';
       nodeEl.style.transform = 'scale(1.1)';
       
       setTimeout(() => {
           nodeEl.style.borderColor = '';
           nodeEl.style.boxShadow = '';
           nodeEl.style.transform = '';
       }, 2000);
   }
}

function clearSearch() {
   const searchInput = document.getElementById('search-input');
   const clearBtn = document.querySelector('.search-clear-btn');
   
   searchInput.value = '';
   clearBtn.classList.remove('show');
   showAllNodes();
}

function showAllNodes() {
   const searchResults = document.getElementById('search-results');
   const flowchartContent = document.getElementById('flowchart-content');
   
   searchResults.classList.remove('show');
   flowchartContent.style.display = 'block';
}

// Auto-layout functionality (prepare for future library integration)
// Replace the entire autoLayoutNodes() function in main.js
function autoLayoutNodes() {
   if (Object.keys(flowchart).length === 0) return;
   
   const nodeSpacingX = 320;
   const nodeSpacingY = 280;
   const startX = 150;
   const startY = 80;
   
   // Find start nodes (nodes not referenced by others)
   const startNodes = Object.values(flowchart).filter(node => {
       return node.id === 'start' || !Object.values(flowchart).some(otherNode => 
           otherNode.options.some(option => option.nextNodeId === node.id)
       );
   });
   
   // If no clear start nodes, use the first node
   if (startNodes.length === 0 && Object.keys(flowchart).length > 0) {
       startNodes.push(Object.values(flowchart)[0]);
   }
   
   const levels = [];
   const visited = new Set();
   const nodePositions = new Map();
   
   // BFS to assign levels
   let currentLevel = startNodes.slice();
   let levelIndex = 0;
   
   while (currentLevel.length > 0) {
       levels[levelIndex] = currentLevel.slice();
       const nextLevel = [];
       
       currentLevel.forEach(node => {
           visited.add(node.id);
           node.options.forEach(option => {
               const targetNode = flowchart[option.nextNodeId];
               if (targetNode && !visited.has(targetNode.id) && !nextLevel.includes(targetNode)) {
                   nextLevel.push(targetNode);
               }
           });
       });
       
       currentLevel = nextLevel;
       levelIndex++;
   }
   
   // Position nodes with proper spacing
   levels.forEach((level, levelIdx) => {
       const y = startY + (levelIdx * nodeSpacingY);
       
       // Center the level horizontally
       const totalLevelWidth = (level.length - 1) * nodeSpacingX;
       const levelStartX = Math.max(startX, startX + (1000 - totalLevelWidth) / 2);
       
       level.forEach((node, nodeIdx) => {
           const x = levelStartX + (nodeIdx * nodeSpacingX);
           
           if (!node.position) node.position = {};
           node.position.x = x;
           node.position.y = y;
           nodePositions.set(node.id, { x, y });
       });
   });
   
   // Handle orphaned nodes (not connected to main flow)
   const orphanedNodes = Object.values(flowchart).filter(node => !visited.has(node.id));
   orphanedNodes.forEach((node, index) => {
       const orphanRow = Math.floor(index / 3);
       const orphanCol = index % 3;
       
       const x = startX + (orphanCol * nodeSpacingX);
       const y = startY + (levels.length * nodeSpacingY) + 150 + (orphanRow * nodeSpacingY);
       
       if (!node.position) node.position = {};
       node.position.x = x;
       node.position.y = y;
   });
   
   updateFlowchartDisplay();
}


// Function to convert URLs in text to clickable links
function linkifyText(text) {
   if (!text) return text;
   
   // Regular expression to match URLs
   const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
   
   return text.replace(urlRegex, function(url) {
       // Clean up URL (remove trailing punctuation that's likely not part of the URL)
       let cleanUrl = url.replace(/[.,;:!?)]$/, '');
       let trailingPunct = url.slice(cleanUrl.length);
       
       return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${trailingPunct}`;
   });
}

// ADD THIS FUNCTION after the linkifyText function (around line 1070):

function setupCanvasControls() {
    const canvas = document.getElementById('flowchart-canvas');
    if (canvas && !canvas.querySelector('.canvas-zoom-controls')) {
        setupZoomControls(canvas);
        setupZoomEventListeners(canvas);
    }
}
// Add these functions to your main.js file (after linkifyText function):

function setupZoomControls(canvas) {
    // Create zoom controls container
    const zoomControls = document.createElement('div');
    zoomControls.className = 'canvas-zoom-controls';
    
    // Zoom in button
    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'zoom-btn';
    zoomInBtn.textContent = '+';
    zoomInBtn.title = 'Zoom In';
    zoomInBtn.onclick = () => zoomCanvas(canvasZoom.step);
    
    // Zoom level display
    const zoomDisplay = document.createElement('div');
    zoomDisplay.className = 'zoom-level-display';
    zoomDisplay.id = 'zoom-level-display';
    zoomDisplay.textContent = '100%';
    
    // Zoom out button
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'zoom-btn';
    zoomOutBtn.textContent = '−';
    zoomOutBtn.title = 'Zoom Out';
    zoomOutBtn.onclick = () => zoomCanvas(-canvasZoom.step);
    
    // Add elements to zoom controls
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomDisplay);
    zoomControls.appendChild(zoomOutBtn);
    
    canvas.appendChild(zoomControls);
}

function setupZoomEventListeners(canvas) {
    const content = document.getElementById('flowchart-content');
    
    // Mouse wheel zoom
    canvas.addEventListener('wheel', function(e) {
        // Prevent default scrolling behavior when zooming
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Calculate zoom direction and amount
            const delta = e.deltaY > 0 ? -canvasZoom.step : canvasZoom.step;
            
            zoomCanvasAtPoint(delta, mouseX, mouseY);
        }
    }, { passive: false });
}

function zoomCanvas(delta) {
    const newScale = canvasZoom.scale + delta;
    const clampedScale = Math.max(canvasZoom.minScale, Math.min(canvasZoom.maxScale, newScale));
    
    setCanvasZoom(clampedScale);
}

function zoomCanvasAtPoint(delta, mouseX, mouseY) {
    const canvas = document.getElementById('flowchart-canvas');
    const content = document.getElementById('flowchart-content');
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the point in the content coordinate system
    const contentX = (mouseX - canvasZoom.panX) / canvasZoom.scale;
    const contentY = (mouseY - canvasZoom.panY) / canvasZoom.scale;
    
    const oldScale = canvasZoom.scale;
    const newScale = Math.max(canvasZoom.minScale, Math.min(canvasZoom.maxScale, oldScale + delta));
    
    if (newScale !== oldScale) {
        // Adjust pan to keep the mouse point stationary
        canvasZoom.panX = mouseX - contentX * newScale;
        canvasZoom.panY = mouseY - contentY * newScale;
        
        canvasZoom.scale = newScale;
        applyCanvasTransform();
        updateZoomDisplay();
    }
}

function setCanvasZoom(scale) {
    canvasZoom.scale = Math.max(canvasZoom.minScale, Math.min(canvasZoom.maxScale, scale));
    applyCanvasTransform();
    updateZoomDisplay();
}

function applyCanvasTransform() {
    const content = document.getElementById('flowchart-content');
    if (content) {
        content.style.transform = `translate(${canvasZoom.panX}px, ${canvasZoom.panY}px) scale(${canvasZoom.scale})`;
    }
    
    // Update zoom control button states
    updateZoomControlStates();
}

function updateZoomDisplay() {
    const display = document.getElementById('zoom-level-display');
    if (display) {
        display.textContent = Math.round(canvasZoom.scale * 100) + '%';
    }
}

function updateZoomControlStates() {
    const zoomControls = document.querySelector('.canvas-zoom-controls');
    if (zoomControls) {
        const zoomInBtn = zoomControls.querySelector('.zoom-btn:first-child');
        const zoomOutBtn = zoomControls.querySelector('.zoom-btn:last-child');
        
        if (zoomInBtn) {
            zoomInBtn.disabled = canvasZoom.scale >= canvasZoom.maxScale;
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = canvasZoom.scale <= canvasZoom.minScale;
        }
    }
}

function resetCanvasZoom() {
    canvasZoom.scale = 1.0;
    canvasZoom.panX = 0;
    canvasZoom.panY = 0;
    applyCanvasTransform();
    updateZoomDisplay();
}
// Initialize
updateFlowchartDisplay();

// Setup everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    setupSearchEventListeners();
    setupCanvasControls();
    
    // Initialize navigate button state
    updateNavigateButtonState();
    
    // Add click handler for the navigate button with proper validation
    const navigateBtn = document.querySelector('.navigate-from-create');
    if (navigateBtn) {
        // Remove the onclick attribute to avoid conflicts
        navigateBtn.removeAttribute('onclick');
        
        navigateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isNavigationAvailable()) {
                alert('Please create some nodes first before navigating your flowchart.');
                return false;
            }
            // If we have nodes, proceed with navigation
            switchMode('navigate');
        });
    }
});

// Also setup listeners immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    setupSearchEventListeners();
    setupCanvasControls();
    updateNavigateButtonState();
    
    // Add click handler for the navigate button
    const navigateBtn = document.querySelector('.navigate-from-create');
    if (navigateBtn) {
        navigateBtn.removeAttribute('onclick');
        
        navigateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isNavigationAvailable()) {
                alert('Please create some nodes first before navigating your flowchart.');
                return false;
            }
            switchMode('navigate');
        });
    }
}
// Automatic position saving every 10 seconds
setInterval(() => {
    if (Object.keys(flowchart).length > 0) {
        saveCurrentNodePositions();
    }
}, 10000);
// Mobile-specific variables and functions
let selectedMobileNode = null;
let mobileEditingNodeId = null;
let currentMobileImageData = null;

// Mobile menu functions
function openMobileMenu() {
    const menu = document.querySelector('.mobile-side-menu');
    const overlay = document.querySelector('.mobile-overlay');
    
    menu.classList.add('open');
    overlay.classList.add('show');
    
    // Prevent body scrolling when menu is open
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const menu = document.querySelector('.mobile-side-menu');
    const overlay = document.querySelector('.mobile-overlay');
    
    menu.classList.remove('open');
    overlay.classList.remove('show');
    
    // Restore body scrolling
    document.body.style.overflow = '';
}

function switchToNavigateFromMobile() {
    if (!isNavigationAvailable()) {
        alert('Please create some nodes first before navigating your flowchart.');
        return;
    }
    closeMobileMenu();
    switchMode('navigate');
}

// Mobile option management
function addMobileOption() {
    const container = document.getElementById('mobile-options-container');
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input type="text" placeholder="Option label (e.g., No)">
        <input type="text" placeholder="Next node ID (e.g., end)">
        <button type="button" class="remove-option" onclick="removeMobileOption(this)">×</button>
    `;
    container.appendChild(optionDiv);
}

function removeMobileOption(button) {
    const container = document.getElementById('mobile-options-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
    }
}

function resetMobileForm() {
    document.getElementById('mobile-node-form').reset();
    mobileEditingNodeId = null;
    currentMobileImageData = null;
    
    document.getElementById('mobile-submit-btn').textContent = 'Add Node';
    document.getElementById('mobile-cancel-edit-btn').classList.add('hidden');
    document.getElementById('mobile-node-id').disabled = false;
    
    // Reset to one option
    const container = document.getElementById('mobile-options-container');
    container.innerHTML = `
        <div class="option-item">
            <input type="text" placeholder="Option label (e.g., Yes)">
            <input type="text" placeholder="Next node ID (e.g., verify-id)">
            <button type="button" class="remove-option" onclick="removeMobileOption(this)">×</button>
        </div>
    `;
}

function cancelMobileEdit() {
    resetMobileForm();
}

// Mobile node selection and interaction
function selectMobileNode(nodeElement) {
    // Deselect previous node
    if (selectedMobileNode) {
        selectedMobileNode.classList.remove('mobile-selected');
    }
    
    // Select new node
    selectedMobileNode = nodeElement;
    nodeElement.classList.add('mobile-selected');
    
    // Show mobile toolbar
    document.querySelector('.mobile-node-toolbar').classList.add('show');
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function deselectMobileNode() {
    if (selectedMobileNode) {
        selectedMobileNode.classList.remove('mobile-selected');
        selectedMobileNode = null;
    }
    
    // Hide mobile toolbar
    document.querySelector('.mobile-node-toolbar').classList.remove('show');
}

function editSelectedMobileNode() {
    if (!selectedMobileNode) return;
    
    const nodeId = selectedMobileNode.id.replace('node-', '');
    const node = flowchart[nodeId];
    
    if (!node) return;
    
    // Populate mobile form
    mobileEditingNodeId = nodeId;
    document.getElementById('mobile-node-id').value = node.id;
    document.getElementById('mobile-node-instruction').value = node.instruction;
    
    // Clear and populate options
    const container = document.getElementById('mobile-options-container');
    container.innerHTML = '';
    
    if (node.options && node.options.length > 0) {
        node.options.forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <input type="text" value="${option.label}">
                <input type="text" value="${option.nextNodeId}">
                <button type="button" class="remove-option" onclick="removeMobileOption(this)">×</button>
            `;
            container.appendChild(optionDiv);
        });
    } else {
        addMobileOption();
    }
    
    // Update UI for edit mode
    document.getElementById('mobile-submit-btn').textContent = 'Update Node';
    document.getElementById('mobile-cancel-edit-btn').classList.remove('hidden');
    document.getElementById('mobile-node-id').disabled = true;
    
    deselectMobileNode();
    openMobileMenu();
}

function deleteSelectedMobileNode() {
    if (!selectedMobileNode) return;
    
    const nodeId = selectedMobileNode.id.replace('node-', '');
    
    if (confirm(`Are you sure you want to delete node "${nodeId}"?`)) {
        delete flowchart[nodeId];
        updateFlowchartDisplay();
        deselectMobileNode();
    }
}
// ADD this function to make mobile selection work:
function clearMobileSelection() {
    const previousSelected = document.querySelector('.flowchart-node.mobile-selected');
    if (previousSelected) {
        previousSelected.classList.remove('mobile-selected');
    }
    
    // Hide mobile toolbar
    const toolbar = document.querySelector('.mobile-node-toolbar');
    if (toolbar) {
        toolbar.classList.remove('show');
    }
}
// Mobile form submission handler
function setupMobileFormSubmission() {
    const mobileForm = document.getElementById('mobile-node-form');
    if (mobileForm) {
        mobileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nodeId = document.getElementById('mobile-node-id').value.trim();
            const instruction = document.getElementById('mobile-node-instruction').value.trim();
            
            // Process options
            const optionItems = document.querySelectorAll('#mobile-options-container .option-item');
            let options = [];
            let hasExitOption = false;
            
            const isEndNodeByID = nodeId.toLowerCase() === 'end' || 
                                 nodeId.toLowerCase() === 'exit' || 
                                 nodeId.toLowerCase() === 'finish' || 
                                 nodeId.toLowerCase() === 'complete';
            
            if (!isEndNodeByID) {
                optionItems.forEach(item => {
                    const inputs = item.querySelectorAll('input');
                    const label = inputs[0].value.trim();
                    const nextNodeId = inputs[1].value.trim();
                    
                    if (label && nextNodeId) {
                        if (label.toLowerCase() === 'exit' || nextNodeId.toLowerCase() === 'exit') {
                            hasExitOption = true;
                        } else {
                            options.push({ label, nextNodeId });
                        }
                    }
                });
            }
            
            // Validation
            if (!isEndNodeByID && !hasExitOption && options.length === 0) {
                alert('Please add at least one option, or use "end", "exit", "finish", or "complete" as the node ID to create an end node.');
                return;
            }
            
            // Check for duplicate ID
            if (mobileEditingNodeId && mobileEditingNodeId !== nodeId && flowchart[nodeId]) {
                alert('A node with this ID already exists. Please choose a different ID.');
                return;
            }
            
            // Preserve position if editing
            let position = null;
            if (mobileEditingNodeId && flowchart[mobileEditingNodeId] && flowchart[mobileEditingNodeId].position) {
                position = { 
                    x: flowchart[mobileEditingNodeId].position.x, 
                    y: flowchart[mobileEditingNodeId].position.y 
                };
                
                if (mobileEditingNodeId !== nodeId) {
                    delete flowchart[mobileEditingNodeId];
                }
            } else {
                position = generateNodePosition();
            }
            
            // Create/update node
            flowchart[nodeId] = {
                id: nodeId,
                instruction: instruction,
                options: options,
                image: currentMobileImageData,
                position: position
            };
            
            updateFlowchartDisplay();
            resetMobileForm();
            closeMobileMenu();
            
            const action = mobileEditingNodeId ? 'updated' : 'added';
            const isEndNode = (isEndNodeByID || hasExitOption) && options.length === 0;
            const nodeType = isEndNode ? 'End' : 'Node';
            alert(`${nodeType} "${nodeId}" ${action} successfully!`);
        });
    }
}

// Enhanced mobile initialization
// REPLACE the initializeMobileFeatures function (around line 1200) with this:
function initializeMobileFeatures() {
    // Setup mobile form submission
    setupMobileFormSubmission();
    
    // FIXED: Only setup mobile touch if on mobile
    if (window.innerWidth <= 768) {
        setupMobileNodeInteractions();
    }
    
    // Prevent default touch behaviors on canvas
    const canvas = document.getElementById('flowchart-canvas');
    if (canvas && window.innerWidth <= 768) {
        canvas.addEventListener('touchstart', function(e) {
            // Allow normal scrolling but prevent zoom
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        canvas.addEventListener('touchmove', function(e) {
            // Prevent zoom but allow single touch interactions
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Refresh the display after orientation change
            updateFlowchartDisplay();
        }, 100);
    });
    
    // Handle window resize for responsive behavior
    window.addEventListener('resize', function() {
        // Update mobile UI elements based on new window size
        if (window.innerWidth > 768) {
            // Desktop mode: Clean up mobile handlers
            deselectMobileNode();
            closeMobileMenu();
            removeMobileEventListeners();
        } else if (window.innerWidth <= 768) {
            // Mobile mode: Initialize mobile features
            setTimeout(() => {
                initializeMobileTouchAndZoom();
            }, 100);
        }
    });
}


// REPLACE the entire DOMContentLoaded section with this:
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile features
    initializeMobileFeatures();
    
    // Initialize unified interaction system
    initializeNodeInteractions();
    
    // Setup existing functionality
    setupSearchEventListeners();
    setupCanvasControls();
    updateNavigateButtonState();
    
    // Add click handler for the navigate button with proper validation
    const navigateBtn = document.querySelector('.navigate-from-create');
    if (navigateBtn) {
        navigateBtn.removeAttribute('onclick');
        
        navigateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isNavigationAvailable()) {
                alert('Please create some nodes first before navigating your flowchart.');
                return false;
            }
            switchMode('navigate');
        });
    }
});

// Also setup immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    initializeMobileFeatures();
    initializeNodeInteractions();
    setupSearchEventListeners();
    setupCanvasControls();
    updateNavigateButtonState();
    
    const navigateBtn = document.querySelector('.navigate-from-create');
    if (navigateBtn) {
        navigateBtn.removeAttribute('onclick');
        
        navigateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isNavigationAvailable()) {
                alert('Please create some nodes first before navigating your flowchart.');
                return false;
            }
            switchMode('navigate');
        });
    }
}

// Prevent default gesture handling
function preventDefaultGesture(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Handle touch move
function handleMobileTouchMove(e) {
    if (window.innerWidth > 768) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - mobileState.startX;
    const deltaY = touch.clientY - mobileState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Determine what type of interaction this is
    if (distance > mobileState.dragThreshold) {
        if (mobileState.selectedNode && selectedMobileNode === mobileState.selectedNode) {
            // Node dragging
            if (!mobileState.isDraggingNode) {
                mobileState.isDraggingNode = true;
                startNodeDrag();
            }
            updateNodeDrag(touch);
            e.preventDefault(); // Prevent scrolling during node drag
        } else {
            // Canvas scrolling - let the browser handle it naturally
            if (!mobileState.isScrolling) {
                mobileState.isScrolling = true;
                // Remove any node visual feedback
                if (mobileState.selectedNode) {
                    mobileState.selectedNode.style.transform = '';
                    mobileState.selectedNode.style.transition = '';
                }
            }
            // DON'T preventDefault() here - let browser handle scrolling
        }
    }
    
    mobileState.lastX = touch.clientX;
    mobileState.lastY = touch.clientY;
}

// Handle touch end
function handleMobileTouchEnd(e) {
    if (window.innerWidth > 768) return;
    
    const touchDuration = Date.now() - mobileState.touchStartTime;
    const deltaX = mobileState.lastX - mobileState.startX;
    const deltaY = mobileState.lastY - mobileState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Handle tap
    if (touchDuration < mobileState.tapThreshold && distance < mobileState.dragThreshold) {
        if (mobileState.selectedNode) {
            selectMobileNode(mobileState.selectedNode);
        }
    }
    
    // Clean up drag state
    if (mobileState.isDraggingNode) {
        finishNodeDrag();
    }
    
    // Remove visual feedback
    if (mobileState.selectedNode) {
        mobileState.selectedNode.style.transform = '';
        mobileState.selectedNode.style.transition = '';
    }
    
    // Reset states
    mobileState.isScrolling = false;
    mobileState.isDraggingNode = false;
    mobileState.selectedNode = null;
}

// Handle touch move
function handleMobileTouchMove(e) {
    if (window.innerWidth > 768) return;
    
    const touchCount = e.touches.length;
    
    // Update touch tracking
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (mobileState.touches.has(touch.identifier)) {
            const trackedTouch = mobileState.touches.get(touch.identifier);
            trackedTouch.x = touch.clientX;
            trackedTouch.y = touch.clientY;
        }
    }
    
    if (touchCount === 1) {
        handleSingleTouchMove(e.touches[0], e);
    } else if (touchCount === 2 && mobileState.isPinching) {
        handlePinchMove(e.touches[0], e.touches[1], e);
    }
}



// Handle touch end
function handleMobileTouchEnd(e) {
    if (window.innerWidth > 768) return;
    
    const currentTime = Date.now();
    const touchDuration = currentTime - mobileState.touchStartTime;
    
    // Handle tap
    if (mobileState.isTapping && touchDuration < mobileState.tapThreshold) {
        handleTap();
    }
    
    // Clean up drag state
    if (mobileState.isDragging) {
        finishNodeDrag();
    }
    
    // Clean up pinch state
    if (mobileState.isPinching) {
        finishPinchZoom();
    }
    
    // Reset states
    resetMobileGestureStates();
    
    // Remove visual feedback from nodes
    if (mobileState.selectedNode) {
        mobileState.selectedNode.style.transform = '';
        mobileState.selectedNode.style.transition = '';
    }
}


function startNodeDrag() {
    if (!mobileState.selectedNode) return;
    
    mobileState.selectedNode.classList.add('dragging');
    mobileState.selectedNode.style.zIndex = '1000';
    mobileState.selectedNode.style.opacity = '0.9';
    mobileState.selectedNode.style.transform = 'scale(1.05)';
    mobileState.selectedNode.style.transition = 'none';
    
    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    console.log('Started dragging node');
}

function updateNodeDrag(touch) {
    if (!mobileState.selectedNode || !mobileState.isDraggingNode) return;
    
    const rect = mobileState.canvas.getBoundingClientRect();
    const nodeId = mobileState.selectedNode.id.replace('node-', '');
    const node = flowchart[nodeId];
    
    if (!node || !node.position) return;
    
    // Calculate new position accounting for scroll
    const touchX = touch.clientX - rect.left + mobileState.canvas.scrollLeft;
    const touchY = touch.clientY - rect.top + mobileState.canvas.scrollTop;
    const startTouchX = mobileState.dragStartPos.x + mobileState.canvas.scrollLeft;
    const startTouchY = mobileState.dragStartPos.y + mobileState.canvas.scrollTop;
    
    const deltaX = touchX - startTouchX;
    const deltaY = touchY - startTouchY;
    
    const newX = Math.max(0, mobileState.nodeStartPos.x + deltaX);
    const newY = Math.max(0, mobileState.nodeStartPos.y + deltaY);
    
    // Update node position in data
    node.position.x = newX;
    node.position.y = newY;
    
    // Update DOM position
    mobileState.selectedNode.style.left = `${newX}px`;
    mobileState.selectedNode.style.top = `${newY}px`;
    
    // Update connections immediately
    const svg = document.querySelector('#flowchart-content svg');
    if (svg) {
        renderConnections(svg);
    }
    
    console.log(`Dragging node to: ${newX}, ${newY}`);
}

function finishNodeDrag() {
    if (!mobileState.selectedNode) return;
    
    mobileState.selectedNode.classList.remove('dragging');
    mobileState.selectedNode.style.zIndex = '';
    mobileState.selectedNode.style.opacity = '';
    mobileState.selectedNode.style.transform = '';
    mobileState.selectedNode.style.transition = '';
    
    // Save position
    saveCurrentNodePositions();
    
    console.log('Finished dragging node');
}


// Update mobile zoom display
function updateMobileZoomDisplay() {
    const display = document.getElementById('zoom-level-display');
    if (display) {
        display.textContent = Math.round(mobileState.currentScale * 100) + '%';
    }
}


// Update node connections after dragging
function updateNodeConnections() {
    const svg = document.querySelector('#flowchart-content svg');
    if (svg && typeof renderConnections === 'function') {
        // Force immediate re-render of connections
        renderConnections(svg);
    }
}


// Handle orientation change
function handleOrientationChange() {
    setTimeout(() => {
        if (window.innerWidth <= 768) {
            initializeMobileTouchAndZoom();
            resetMobileCanvasTransform();
        }
    }, 300);
}

// Handle mobile resize
function handleMobileResize() {
    if (window.innerWidth <= 768) {
        initializeMobileTouchAndZoom();
    } else {
        removeMobileEventListeners();
        resetMobileCanvasTransform();
    }
}

// Utility function to get distance between two touches
function getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Add zoom buttons functionality for mobile
function addMobileZoomButtons() {
    // Create zoom controls if they don't exist
    let zoomControls = document.querySelector('.canvas-zoom-controls');
    
    if (!zoomControls && window.innerWidth <= 768) {
        const canvas = document.getElementById('flowchart-canvas');
        if (canvas) {
            zoomControls = document.createElement('div');
            zoomControls.className = 'canvas-zoom-controls';
            zoomControls.innerHTML = `
                <button class="zoom-btn" onclick="mobileZoomIn()">+</button>
                <div class="zoom-level-display" id="zoom-level-display">100%</div>
                <button class="zoom-btn" onclick="mobileZoomOut()">−</button>
                <button class="zoom-btn" onclick="resetMobileZoom()" title="Reset Zoom">⌂</button>
            `;
            canvas.appendChild(zoomControls);
        }
    }
}

// Mobile zoom functions
window.mobileZoomIn = function() {
    const newScale = Math.min(mobileState.maxScale, mobileState.currentScale + 0.2);
    applyMobileZoom(newScale);
};

window.mobileZoomOut = function() {
    const newScale = Math.max(mobileState.minScale, mobileState.currentScale - 0.2);
    applyMobileZoom(newScale);
};

window.resetMobileZoom = function() {
    applyMobileZoom(1.0);
};

// Apply zoom from buttons
function applyMobileZoom(scale) {
    mobileState.currentScale = scale;
    const content = mobileState.content;
    
    if (content) {
        content.style.transformOrigin = 'center center';
        content.style.transform = `scale(${scale})`;
        updateMobileZoomDisplay();
        
        // FIXED: Update connections after zoom
        setTimeout(() => {
            updateNodeConnections();
        }, 50);
    }
}

// Enhanced initialization
function initializeEnhancedMobileFeatures() {
    // Initialize touch and zoom
    initializeMobileTouchAndZoom();
    
    // Add zoom buttons
    addMobileZoomButtons();
    
    // Add scroll hints
    addMobileScrollHints();
    
    // Optimize for mobile performance
    optimizeForMobilePerformance();
}

// Add scroll hints for first-time users
function addMobileScrollHints() {
    if (window.innerWidth > 768 || localStorage.getItem('mobile-hints-shown')) return;
    
    const canvas = document.getElementById('flowchart-canvas');
    if (!canvas || Object.keys(flowchart).length === 0) return;
    
    // Show hints
    setTimeout(() => {
        showMobileScrollHint('👆 Tap and drag to scroll • Pinch to zoom • Tap nodes to select', 3000);
        localStorage.setItem('mobile-hints-shown', 'true');
    }, 1000);
}

// Show mobile hint
function showMobileScrollHint(message, duration = 3000) {
    const hint = document.createElement('div');
    hint.className = 'mobile-scroll-hint';
    hint.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(102, 126, 234, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 2000;
        text-align: center;
        max-width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideUpFade 0.5s ease;
    `;
    hint.textContent = message;
    
    document.body.appendChild(hint);
    
    setTimeout(() => {
        hint.style.animation = 'slideDownFade 0.5s ease forwards';
        setTimeout(() => hint.remove(), 500);
    }, duration);
}

// Optimize for mobile performance
function optimizeForMobilePerformance() {
    if (window.innerWidth > 768) return;
    
    // Add CSS for better mobile performance
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUpFade {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes slideDownFade {
            from { opacity: 1; transform: translateX(-50%) translateY(0); }
            to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
        
        /* Optimize scrolling performance */
        #flowchart-canvas {
            -webkit-overflow-scrolling: touch;
            overflow-scrolling: touch;
            scroll-behavior: smooth;
        }
        
        /* Optimize node rendering during gestures */
        .flowchart-node {
            will-change: transform;
            backface-visibility: hidden;
        }
        
        .flowchart-node.dragging {
            will-change: transform, left, top;
        }
    `;
    document.head.appendChild(style);
}

// REPLACE the DOMContentLoaded event listener with this:
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile features first
    if (window.innerWidth <= 768) {
        initializeMobileFeatures();
        initializeMobileTouchAndZoom();
    }
    
    // Then setup other functionality
    setupSearchEventListeners();
    setupCanvasControls();
    updateNavigateButtonState();
    
    // Add click handler for the navigate button with proper validation
    const navigateBtn = document.querySelector('.navigate-from-create');
    if (navigateBtn) {
        navigateBtn.removeAttribute('onclick');
        
        navigateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isNavigationAvailable()) {
                alert('Please create some nodes first before navigating your flowchart.');
                return false;
            }
            switchMode('navigate');
        });
    }
});

console.log('Mobile touch and zoom functionality loaded');

// FIXED: Override the original updateFlowchartDisplay to include mobile connection fixes
const originalUpdateFlowchartDisplayWithMobileFix = window.updateFlowchartDisplay;
window.updateFlowchartDisplay = function() {
    if (originalUpdateFlowchartDisplayWithMobileFix) {
        originalUpdateFlowchartDisplayWithMobileFix();
    }
    
    // Re-initialize mobile features after flowchart update
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            initializeMobileTouchAndZoom();
            addMobileZoomButtons();
            // FIXED: Ensure connections are properly rendered on mobile
            updateNodeConnections();
        }, 100);
    }
};

// =================================
// UNIFIED NODE INTERACTION SYSTEM
// Add this to the END of main.js
// =================================

// Global interaction state
let interactionState = {
    // Device detection
    isMobile: window.innerWidth <= 768,
    
    // Touch/mouse state
    isDragging: false,
    isSelecting: false,
    startTime: 0,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    
    // Node state
    selectedNode: null,
    selectedNodeData: null,
    dragStartNodePos: { x: 0, y: 0 },
    
    // Thresholds
    tapThreshold: 300, // ms
    dragThreshold: 10, // pixels
    
    // Canvas references
    canvas: null,
    content: null
};

// =================================
// MAIN INITIALIZATION
// =================================

function initializeNodeInteractions() {
    // Clean up existing listeners
    removeAllInteractionListeners();
    
    // Update device detection
    interactionState.isMobile = window.innerWidth <= 768;
    interactionState.canvas = document.getElementById('flowchart-canvas');
    interactionState.content = document.getElementById('flowchart-content');
    
    if (!interactionState.canvas || !interactionState.content) return;
    
    // Add unified event listeners
    addUnifiedEventListeners();
    
    console.log(`Initialized ${interactionState.isMobile ? 'mobile' : 'desktop'} node interactions`);
}

// =================================
// EVENT LISTENER MANAGEMENT
// =================================

function removeAllInteractionListeners() {
    const canvas = document.getElementById('flowchart-canvas');
    if (!canvas) return;
    
    // Remove all possible event listeners
    canvas.removeEventListener('touchstart', handleUnifiedStart);
    canvas.removeEventListener('touchmove', handleUnifiedMove);
    canvas.removeEventListener('touchend', handleUnifiedEnd);
    canvas.removeEventListener('touchcancel', handleUnifiedEnd);
    canvas.removeEventListener('mousedown', handleUnifiedStart);
    document.removeEventListener('mousemove', handleUnifiedMove);
    document.removeEventListener('mouseup', handleUnifiedEnd);
    canvas.removeEventListener('contextmenu', preventContextMenu);
    
    // Clear selection state
    clearSelection();
}

function addUnifiedEventListeners() {
    const canvas = interactionState.canvas;
    
    if (interactionState.isMobile) {
        // Mobile: Touch events
        canvas.addEventListener('touchstart', handleUnifiedStart, { passive: false });
        canvas.addEventListener('touchmove', handleUnifiedMove, { passive: false });
        canvas.addEventListener('touchend', handleUnifiedEnd, { passive: true });
        canvas.addEventListener('touchcancel', handleUnifiedEnd, { passive: true });
    } else {
        // Desktop: Mouse events
        canvas.addEventListener('mousedown', handleUnifiedStart, { passive: false });
        document.addEventListener('mousemove', handleUnifiedMove, { passive: false });
        document.addEventListener('mouseup', handleUnifiedEnd, { passive: true });
    }
    
    // Prevent context menu on both
    canvas.addEventListener('contextmenu', preventContextMenu);
}

function preventContextMenu(e) {
    e.preventDefault();
}

// =================================
// UNIFIED EVENT HANDLERS
// =================================

function handleUnifiedStart(e) {
    const isTouch = e.type.startsWith('touch');
    const point = isTouch ? e.touches[0] : e;
    const target = e.target.closest('.flowchart-node');
    
    // Store initial state
    interactionState.startTime = Date.now();
    interactionState.startPos = { x: point.clientX, y: point.clientY };
    interactionState.currentPos = { x: point.clientX, y: point.clientY };
    interactionState.isDragging = false;
    interactionState.isSelecting = false;
    
    if (target) {
        // Touching/clicking a node
        const nodeId = target.id.replace('node-', '');
        const nodeData = flowchart[nodeId];
        
        if (!nodeData) return;
        
        interactionState.selectedNode = target;
        interactionState.selectedNodeData = nodeData;
        interactionState.isSelecting = true;
        
        // Store node's current position
        if (nodeData.position) {
            interactionState.dragStartNodePos = { 
                x: nodeData.position.x, 
                y: nodeData.position.y 
            };
        }
        
        // Visual feedback
        if (interactionState.isMobile) {
            applyMobileNodeSelectionFeedback(target);
        } else {
            applyDesktopNodeHoverFeedback(target);
        }
        
        // Prevent default for nodes to enable dragging
        e.preventDefault();
    } else {
        // Touching/clicking canvas - clear selection
        clearSelection();
        
        // Allow normal scrolling on mobile
        if (interactionState.isMobile) {
            // Don't prevent default - allow canvas scrolling
        } else {
            // Desktop: could add canvas panning here if needed
        }
    }
}

function handleUnifiedMove(e) {
    if (!interactionState.isSelecting && !interactionState.isDragging) return;
    
    const isTouch = e.type.startsWith('touch');
    const point = isTouch ? e.touches[0] : e;
    
    if (!point) return;
    
    interactionState.currentPos = { x: point.clientX, y: point.clientY };
    
    const deltaX = point.clientX - interactionState.startPos.x;
    const deltaY = point.clientY - interactionState.startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check if we should start dragging
    if (!interactionState.isDragging && distance > interactionState.dragThreshold) {
        if (interactionState.selectedNode && interactionState.selectedNodeData) {
            startNodeDrag();
            e.preventDefault(); // Prevent scrolling during drag
        }
    }
    
    // Continue dragging
    if (interactionState.isDragging) {
        updateNodeDrag(point);
        e.preventDefault(); // Prevent scrolling during drag
    }
}

function handleUnifiedEnd(e) {
    const duration = Date.now() - interactionState.startTime;
    const deltaX = interactionState.currentPos.x - interactionState.startPos.x;
    const deltaY = interactionState.currentPos.y - interactionState.startPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Handle tap/click
    if (!interactionState.isDragging && 
        duration < interactionState.tapThreshold && 
        distance < interactionState.dragThreshold) {
        
        if (interactionState.selectedNode) {
            handleNodeTapClick();
        }
    }
    
    // End drag
    if (interactionState.isDragging) {
        endNodeDrag();
    }
    
    // Clean up visual feedback
    removeAllNodeFeedback();
    
    // Reset state
    interactionState.isDragging = false;
    interactionState.isSelecting = false;
}

// =================================
// NODE INTERACTION FUNCTIONS
// =================================

function startNodeDrag() {
    if (!interactionState.selectedNode || !interactionState.selectedNodeData) return;
    
    interactionState.isDragging = true;
    
    const node = interactionState.selectedNode;
    
    // Apply drag styling
    node.style.zIndex = '1000';
    node.style.opacity = '0.9';
    node.style.transform = 'scale(1.05)';
    node.style.transition = 'none';
    node.classList.add('dragging');
    
    // Haptic feedback on mobile
    if (interactionState.isMobile && navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    console.log('Started dragging node:', interactionState.selectedNodeData.id);
}

function updateNodeDrag(point) {
    if (!interactionState.isDragging || !interactionState.selectedNode || !interactionState.selectedNodeData) return;
    
    const canvas = interactionState.canvas;
    const rect = canvas.getBoundingClientRect();
    const nodeData = interactionState.selectedNodeData;
    
    // Calculate new position
    const canvasX = point.clientX - rect.left + canvas.scrollLeft;
    const canvasY = point.clientY - rect.top + canvas.scrollTop;
    const startCanvasX = interactionState.startPos.x - rect.left + canvas.scrollLeft;
    const startCanvasY = interactionState.startPos.y - rect.top + canvas.scrollTop;
    
    const deltaX = canvasX - startCanvasX;
    const deltaY = canvasY - startCanvasY;
    
    const newX = Math.max(0, interactionState.dragStartNodePos.x + deltaX);
    const newY = Math.max(0, interactionState.dragStartNodePos.y + deltaY);
    
    // Update node position in data
    nodeData.position.x = newX;
    nodeData.position.y = newY;
    
    // Update DOM position
    interactionState.selectedNode.style.left = `${newX}px`;
    interactionState.selectedNode.style.top = `${newY}px`;
    
    // Update connections
    const svg = document.querySelector('#flowchart-content svg');
    if (svg && typeof renderConnections === 'function') {
        renderConnections(svg);
    }
    
    // Expand canvas if needed
    expandCanvasIfNeeded(newX, newY);
}

function endNodeDrag() {
    if (!interactionState.selectedNode || !interactionState.selectedNodeData) return;
    
    const node = interactionState.selectedNode;
    
    // Remove drag styling
    node.style.zIndex = '';
    node.style.opacity = '';
    node.style.transform = '';
    node.style.transition = '';
    node.classList.remove('dragging');
    
    // Save positions
    if (typeof saveCurrentNodePositions === 'function') {
        saveCurrentNodePositions();
    }
    
    console.log('Ended dragging node:', interactionState.selectedNodeData.id);
}

function handleNodeTapClick() {
    if (!interactionState.selectedNode || !interactionState.selectedNodeData) return;
    
    if (interactionState.isMobile) {
        // Mobile: Select node and show toolbar
        selectMobileNode(interactionState.selectedNode);
    } else {
        // Desktop: Could show context menu or properties
        console.log('Clicked node:', interactionState.selectedNodeData.id);
        // Optionally highlight the node briefly
        highlightNode(interactionState.selectedNode);
    }
}

// =================================
// VISUAL FEEDBACK FUNCTIONS
// =================================

function applyMobileNodeSelectionFeedback(node) {
    node.style.transform = 'scale(0.98)';
    node.style.transition = 'transform 0.1s ease';
}

function applyDesktopNodeHoverFeedback(node) {
    node.style.transform = 'scale(1.02)';
    node.style.transition = 'transform 0.1s ease';
}

function removeAllNodeFeedback() {
    if (interactionState.selectedNode && !interactionState.isDragging) {
        const node = interactionState.selectedNode;
        // Only reset if not currently dragging
        setTimeout(() => {
            if (!interactionState.isDragging) {
                node.style.transform = '';
                node.style.transition = '';
            }
        }, 100);
    }
}

function highlightNode(node) {
    const originalBorderColor = node.style.borderColor;
    const originalBoxShadow = node.style.boxShadow;
    
    node.style.borderColor = '#3498db';
    node.style.boxShadow = '0 8px 24px rgba(52,152,219,0.4)';
    
    setTimeout(() => {
        node.style.borderColor = originalBorderColor;
        node.style.boxShadow = originalBoxShadow;
    }, 1500);
}

// =================================
// MOBILE-SPECIFIC FUNCTIONS
// =================================

function selectMobileNode(nodeElement) {
    // Clear previous selection
    clearMobileSelection();
    
    // Select new node
    nodeElement.classList.add('mobile-selected');
    interactionState.selectedNode = nodeElement;
    
    // Show mobile toolbar
    const toolbar = document.querySelector('.mobile-node-toolbar');
    if (toolbar) {
        toolbar.classList.add('show');
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function clearSelection() {
    if (interactionState.isMobile) {
        clearMobileSelection();
    }
    
    interactionState.selectedNode = null;
    interactionState.selectedNodeData = null;
}

// =================================
// UTILITY FUNCTIONS
// =================================

function expandCanvasIfNeeded(nodeX, nodeY) {
    const content = interactionState.content;
    if (!content) return;
    
    const nodeWidth = 350; // Approximate node width
    const nodeHeight = 200; // Approximate node height
    const padding = 200;
    
    const requiredWidth = nodeX + nodeWidth + padding;
    const requiredHeight = nodeY + nodeHeight + padding;
    
    const currentWidth = parseInt(content.style.width) || 1500;
    const currentHeight = parseInt(content.style.height) || 1000;
    
    if (requiredWidth > currentWidth || requiredHeight > currentHeight) {
        const newWidth = Math.max(requiredWidth, currentWidth);
        const newHeight = Math.max(requiredHeight, currentHeight);
        
        content.style.width = `${newWidth}px`;
        content.style.height = `${newHeight}px`;
        content.style.minWidth = `${newWidth}px`;
        content.style.minHeight = `${newHeight}px`;
        
        // Update SVG dimensions
        const svg = content.querySelector('svg');
        if (svg) {
            svg.style.width = `${newWidth}px`;
            svg.style.height = `${newHeight}px`;
        }
        
        // Update node container
        const nodeContainer = content.children[1];
        if (nodeContainer) {
            nodeContainer.style.width = `${newWidth}px`;
            nodeContainer.style.height = `${newHeight}px`;
        }
    }
}

// =================================
// WINDOW EVENT HANDLERS
// =================================

function handleWindowResize() {
    const wasMobile = interactionState.isMobile;
    const isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== isMobile) {
        // Device type changed, reinitialize
        interactionState.isMobile = isMobile;
        initializeNodeInteractions();
    }
}

// =================================
// INITIALIZATION AND CLEANUP
// =================================

// Handle window resize
window.addEventListener('resize', handleWindowResize);

// Handle orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(initializeNodeInteractions, 300);
});

// Export functions for global access (for mobile toolbar)
window.editSelectedMobileNode = function() {
    if (!interactionState.selectedNode) return;
    
    const nodeId = interactionState.selectedNode.id.replace('node-', '');
    
    // Use existing editNode function if available
    if (typeof editNode === 'function') {
        editNode(nodeId);
    }
    
    clearMobileSelection();
};

window.deleteSelectedMobileNode = function() {
    if (!interactionState.selectedNode) return;
    
    const nodeId = interactionState.selectedNode.id.replace('node-', '');
    
    if (confirm(`Are you sure you want to delete node "${nodeId}"?`)) {
        // Use existing deleteNode function if available
        if (typeof deleteNode === 'function') {
            deleteNode(nodeId);
        }
        clearMobileSelection();
    }
};

window.deselectMobileNode = function() {
    clearMobileSelection();
};

console.log('Unified interaction system loaded');