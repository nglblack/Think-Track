let flowchart = {};
let currentNodeId = 'start';
let navigationHistory = [];
let editingNodeId = null;
let currentImageData = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let selectedNode = null;
let canvasScale = 1;
let canvasOffset = { x: 0, y: 0 };

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
   document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
   event.target.classList.add('active');
   
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

function loadExample(exampleKey) {
   if (exampleFlowcharts[exampleKey]) {
       if (Object.keys(flowchart).length > 0) {
           if (!confirm('This will replace your current flowchart. Continue?')) {
               return;
           }
       }
       
       flowchart = JSON.parse(JSON.stringify(exampleFlowcharts[exampleKey])); // Deep copy
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
       <input type="text" placeholder="Option label (e.g., No)" required>
       <input type="text" placeholder="Next node ID (e.g., end)" required>
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

document.getElementById('node-form').addEventListener('submit', function(e) {
   e.preventDefault();
   
   const nodeId = document.getElementById('node-id').value.trim();
   const instruction = document.getElementById('node-instruction').value.trim();
   const optionItems = document.querySelectorAll('.option-item');
   
   const options = [];
   optionItems.forEach(item => {
       const inputs = item.querySelectorAll('input');
       const label = inputs[0].value.trim();
       const nextNodeId = inputs[1].value.trim();
       
       if (label && nextNodeId) {
           options.push({ label, nextNodeId });
       }
   });
   
   if (options.length === 0) {
       alert('Please add at least one option.');
       return;
   }
   
   // Check if we're editing and the ID changed, make sure new ID doesn't exist
   if (editingNodeId && editingNodeId !== nodeId && flowchart[nodeId]) {
       alert('A node with this ID already exists. Please choose a different ID.');
       return;
   }
   
   // If editing and ID changed, remove the old node
   if (editingNodeId && editingNodeId !== nodeId) {
       delete flowchart[editingNodeId];
   }
   
   // Generate position for new nodes
  let position = { x: 100, y: 100 };
if (editingNodeId && flowchart[editingNodeId]) {
   // Keep existing position if editing
   position = flowchart[editingNodeId].position || position;
} else {
   // Generate new position for new nodes using hierarchical layout
   position = generateNodePosition();
}
   
   flowchart[nodeId] = {
       id: nodeId,
       instruction: instruction,
       options: options,
       image: currentImageData,
       position: position
   };
   
   updateFlowchartDisplay();
   resetForm();
   
   // Show success message
   const action = editingNodeId ? 'updated' : 'added';
   alert(`Node "${nodeId}" ${action} successfully!`);
});

// Replace the entire generateNodePosition() function in main.js
function generateNodePosition() {
   const existingNodes = Object.values(flowchart);
   
   if (existingNodes.length === 0) {
       return { x: 200, y: 100 };
   }
   
   // Use hierarchical layout for better organization
   return calculateHierarchicalPosition();
}

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
   
   // Clear existing content
   content.innerHTML = '';
   
   // Create SVG for connections
   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
   svg.style.position = 'absolute';
   svg.style.top = '0';
   svg.style.left = '0';
   svg.style.width = '100%';
   svg.style.height = '100%';
   svg.style.pointerEvents = 'none';
   svg.style.zIndex = '1';
   content.appendChild(svg);
   
   // Create container for nodes
   const nodeContainer = document.createElement('div');
   nodeContainer.style.position = 'relative';
   nodeContainer.style.width = '100%';
   nodeContainer.style.height = '100%';
   nodeContainer.style.zIndex = '2';
   content.appendChild(nodeContainer);
   
   // Render nodes
   Object.values(flowchart).forEach(node => {
       renderNode(node, nodeContainer);
   });
   
   // Render connections
   renderConnections(svg);
}

function renderNode(node, container) {
   const nodeEl = document.createElement('div');
   nodeEl.className = 'flowchart-node';
   nodeEl.id = `node-${node.id}`;
   nodeEl.style.position = 'absolute';
   nodeEl.style.left = `${node.position?.x || 100}px`;
   nodeEl.style.top = `${node.position?.y || 100}px`;
   nodeEl.style.width = '180px';
   nodeEl.style.minHeight = '120px';
   nodeEl.style.background = 'white';
   nodeEl.style.border = '2px solid #667eea';
   nodeEl.style.borderRadius = '12px';
   nodeEl.style.padding = '12px';
   nodeEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
   nodeEl.style.cursor = 'move';
   nodeEl.style.userSelect = 'none';
   nodeEl.style.fontSize = '0.85rem';
   nodeEl.style.transition = 'all 0.2s ease';
   
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
   header.style.fontSize = '0.75rem';
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
   instruction.style.fontSize = '0.8rem';
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
           optionEl.style.fontSize = '0.7rem';
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
           target.style.fontSize = '0.65rem';
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
   
   // Node actions
   const actions = document.createElement('div');
   actions.style.display = 'flex';
   actions.style.gap = '4px';
   actions.style.paddingTop = '8px';
   actions.style.borderTop = '1px solid #e0e0e0';
   
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
   nodeEl.appendChild(actions);
   
   // Add drag functionality
   setupNodeDrag(nodeEl, node);
   
   container.appendChild(nodeEl);
}

function setupNodeDrag(nodeEl, node) {
   let isDragging = false;
   let startPos = { x: 0, y: 0 };
   let startNodePos = { x: 0, y: 0 };
   
   nodeEl.addEventListener('mousedown', (e) => {
       if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
           return; // Don't drag when clicking buttons
       }
       
       isDragging = true;
       startPos = { x: e.clientX, y: e.clientY };
       startNodePos = { 
           x: node.position?.x || 100, 
           y: node.position?.y || 100 
       };
       
       nodeEl.style.zIndex = '1000';
       nodeEl.style.opacity = '0.8';
       nodeEl.style.transform = 'scale(1.05)';
       
       e.preventDefault();
   });
   
   document.addEventListener('mousemove', (e) => {
       if (!isDragging) return;
       
       const dx = e.clientX - startPos.x;
       const dy = e.clientY - startPos.y;
       
       const newX = Math.max(0, startNodePos.x + dx);
       const newY = Math.max(0, startNodePos.y + dy);
       
       nodeEl.style.left = `${newX}px`;
       nodeEl.style.top = `${newY}px`;
       
       // Update position in data
       if (!node.position) node.position = {};
       node.position.x = newX;
       node.position.y = newY;
       
       // Re-render connections
       const svg = document.querySelector('#flowchart-content svg');
       if (svg) {
           renderConnections(svg);
       }
   });
   
   document.addEventListener('mouseup', () => {
       if (!isDragging) return;
       
       isDragging = false;
       nodeEl.style.zIndex = '2';
       nodeEl.style.opacity = '1';
       nodeEl.style.transform = 'scale(1)';
   });
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
           
           const sourcePos = getNodeConnectionPoint(node, 'output', index, node.options.length);
           const targetPos = getNodeConnectionPoint(targetNode, 'input');
           
           const line = createConnectionLine(sourcePos, targetPos, option.label);
           svg.appendChild(line);
       });
   });
}

function getNodeConnectionPoint(node, type, optionIndex = 0, totalOptions = 1) {
   const nodePos = node.position || { x: 100, y: 100 };
   const nodeWidth = 180;
   const nodeHeight = 120; // Approximate minimum height
   
   if (type === 'input') {
       // Connection point at the top-center of the target node
       return {
           x: nodePos.x + nodeWidth / 2,
           y: nodePos.y
       };
   } else {
       // Connection point at the bottom of the source node, spread across width for multiple options
       const spacing = nodeWidth / (totalOptions + 1);
       return {
           x: nodePos.x + spacing * (optionIndex + 1),
           y: nodePos.y + nodeHeight
       };
   }
}

function createConnectionLine(start, end, label) {
   const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
   
   // Create curved path
   const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
   
   const midY = start.y + (end.y - start.y) * 0.5;
   const controlPoint1 = { x: start.x, y: midY };
   const controlPoint2 = { x: end.x, y: midY };
   
   const pathData = `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`;
   
   path.setAttribute('d', pathData);
   path.setAttribute('stroke', '#667eea');
   path.setAttribute('stroke-width', '2');
   path.setAttribute('fill', 'none');
   path.setAttribute('marker-end', 'url(#arrowhead)');
   
   group.appendChild(path);
   
   // Add label if there's space and it's not too long
   if (label && label.length < 20 && Math.abs(end.y - start.y) > 60) {
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
   
   // Render the flowchart
   renderFlowchart();
}

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
   
   // Reset to one option
   const container = document.getElementById('options-container');
   container.innerHTML = `
       <div class="option-item">
           <input type="text" placeholder="Option label (e.g., Yes)" required>
           <input type="text" placeholder="Next node ID (e.g., verify-id)" required>
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

function exportFlowchart() {
   if (Object.keys(flowchart).length === 0) {
       alert('No flowchart to export. Please create some nodes first.');
       return;
   }
   
   const dataStr = JSON.stringify(flowchart, null, 2);
   const dataBlob = new Blob([dataStr], {type: 'application/json'});
   const url = URL.createObjectURL(dataBlob);
   
   const link = document.createElement('a');
   link.href = url;
   link.download = 'flowchart.json';
   link.click();
   
   URL.revokeObjectURL(url);
}

// Replace the importFlowchart function in main.js
function importFlowchart(event) {
   const file = event.target.files[0];
   if (!file) return;
   
   const reader = new FileReader();
   reader.onload = function(e) {
       try {
           const importedFlowchart = JSON.parse(e.target.result);
           
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
               // Remove existing position data to force re-positioning
               delete node.position;
           }
           
           flowchart = importedFlowchart;
           
           // Apply auto-layout to properly position all imported nodes
           autoLayoutNodes();
           
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

function clearFlowchart() {
   if (confirm('Are you sure you want to clear all nodes? This cannot be undone.')) {
       flowchart = {};
       updateFlowchartDisplay();
       resetForm();
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

// Canvas zoom and pan functionality
function setupCanvasControls() {
   const canvas = document.getElementById('flowchart-canvas');
   
   // Add control buttons to canvas
   const controls = document.createElement('div');
   controls.style.position = 'absolute';
   controls.style.top = '10px';
   controls.style.right = '10px';
   controls.style.zIndex = '1000';
   controls.style.display = 'flex';
   controls.style.gap = '8px';
   
   const autoLayoutBtn = document.createElement('button');
   autoLayoutBtn.className = 'btn btn-secondary';
   autoLayoutBtn.style.padding = '8px 12px';
   autoLayoutBtn.style.fontSize = '0.8rem';
   autoLayoutBtn.style.margin = '0';
   autoLayoutBtn.textContent = '📐 Auto Layout';
   autoLayoutBtn.onclick = autoLayoutNodes;
   
   const fitBtn = document.createElement('button');
   fitBtn.className = 'btn btn-secondary';
   fitBtn.style.padding = '8px 12px';
   fitBtn.style.fontSize = '0.8rem';
   fitBtn.style.margin = '0';
   fitBtn.textContent = '🔍 Fit to View';
   fitBtn.onclick = fitToView;
   
   controls.appendChild(autoLayoutBtn);
   controls.appendChild(fitBtn);
   canvas.appendChild(controls);
}

function fitToView() {
   const canvas = document.getElementById('flowchart-canvas');
   const nodes = Object.values(flowchart);
   
   if (nodes.length === 0) return;
   
   // Calculate bounding box of all nodes
   let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
   
   nodes.forEach(node => {
       if (node.position) {
           minX = Math.min(minX, node.position.x);
           minY = Math.min(minY, node.position.y);
           maxX = Math.max(maxX, node.position.x + 180); // Node width
           maxY = Math.max(maxY, node.position.y + 120); // Node height
       }
   });
   
   // Add padding
   const padding = 50;
   minX -= padding;
   minY -= padding;
   maxX += padding;
   maxY += padding;
   
   // Center the view on the bounding box
   const centerX = (minX + maxX) / 2;
   const centerY = (minY + maxY) / 2;
   
   const canvasRect = canvas.getBoundingClientRect();
   const scrollLeft = centerX - canvasRect.width / 2;
   const scrollTop = centerY - canvasRect.height / 2;
   
   canvas.scrollTo({
       left: Math.max(0, scrollLeft),
       top: Math.max(0, scrollTop),
       behavior: 'smooth'
   });
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

// Initialize
updateFlowchartDisplay();

// Setup search event listeners when the page loads
document.addEventListener('DOMContentLoaded', function() {
   setupSearchEventListeners();
   setupCanvasControls();
});

// Also setup listeners immediately in case DOM is already loaded
if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', function() {
       setupSearchEventListeners();
       setupCanvasControls();
   });
} else {
   setupSearchEventListeners();
   setupCanvasControls();
}