// Course data and application logic
class CourseApp {
    constructor() {
        this.modules = [];
        this.filteredModules = [];
        this.currentUser = null;
        this.userProgress = {};
        this.selectedModule = null;
        this.graph = null;
        
        this.loadCourseData();
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    async loadCourseData() {
        try {
            const response = await fetch('/api/modules');
            const data = await response.json();
            this.modules = data.modules;
            this.filteredModules = [...this.modules];
            this.renderModules();
        } catch (error) {
            console.error('Error loading course data:', error);
        }
    }

    setupEventListeners() {
        // View toggle
        document.getElementById('list-view-btn').addEventListener('click', () => this.showListView());
        document.getElementById('graph-view-btn').addEventListener('click', () => this.showGraphView());

        // Search and filter
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('category-filter').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));

        // Login/logout
        document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('login-submit').addEventListener('click', () => this.handleLogin());
        
        // Registration
        document.getElementById('register-submit').addEventListener('click', () => this.handleRegister());
        document.getElementById('show-register').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('show-login').addEventListener('click', () => this.showLoginModal());
        
        // Clear highlights when clicking outside modules
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.module-card') && !e.target.closest('.node') && !e.target.closest('button')) {
                this.clearHighlights();
            }
        });

        // Handle window resize for responsive graph
        window.addEventListener('resize', () => {
            if (this.graph && document.getElementById('graph-view').style.display !== 'none') {
                // Debounce resize events
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.createGraph();
                }, 250);
            }
        });
    }

    async handleSearch(query) {
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            
            const response = await fetch(`/api/modules?${params}`);
            const data = await response.json();
            this.filteredModules = data.modules;
            this.renderModules();
        } catch (error) {
            console.error('Error searching modules:', error);
            // Fallback to client-side filtering
            const searchTerm = query.toLowerCase();
            this.filteredModules = this.modules.filter(module => 
                module.title.toLowerCase().includes(searchTerm) ||
                module.description.toLowerCase().includes(searchTerm) ||
                module.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
            );
            this.renderModules();
        }
    }

    async handleCategoryFilter(category) {
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            
            const response = await fetch(`/api/modules?${params}`);
            const data = await response.json();
            this.filteredModules = data.modules;
            this.renderModules();
        } catch (error) {
            console.error('Error filtering modules:', error);
            // Fallback to client-side filtering
            if (category === '') {
                this.filteredModules = [...this.modules];
            } else {
                this.filteredModules = this.modules.filter(module => module.category === category);
            }
            this.renderModules();
        }
    }

    renderModules() {
        const container = document.getElementById('modules-container');
        container.innerHTML = '';

        this.filteredModules.forEach(module => {
            const moduleCard = this.createModuleCard(module);
            container.appendChild(moduleCard);
        });

        // Update progress overview
        this.updateProgressOverview();
    }

    updateProgressOverview() {
        if (!this.currentUser) {
            document.getElementById('progress-overview').style.display = 'none';
            return;
        }

        document.getElementById('progress-overview').style.display = 'flex';

        const completedCount = this.modules.filter(m => m.status === 'completed').length;
        const inProgressCount = this.modules.filter(m => m.status === 'in-progress').length;
        const totalCount = this.modules.length;
        const progressPercentage = Math.round((completedCount / totalCount) * 100);

        document.getElementById('completed-count').textContent = completedCount;
        document.getElementById('in-progress-count').textContent = inProgressCount;
        document.getElementById('total-count').textContent = totalCount;
        document.getElementById('progress-percentage').textContent = `${progressPercentage}%`;
    }

    createModuleCard(module) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';

        const difficultyColor = {
            'beginner': 'success',
            'intermediate': 'warning',
            'advanced': 'danger'
        };

        const isCompleted = module.status === 'completed';
        const isInProgress = module.status === 'in-progress';
        
        // Check if prerequisites are completed
        const arePrerequisitesMet = this.arePrerequisitesMet(module);
        const isAvailable = arePrerequisitesMet || isCompleted || isInProgress;

        // Add completion styling to the card
        const cardClass = isCompleted ? 'module-card h-100 border-success' : 
                         isInProgress ? 'module-card h-100 border-primary' : 
                         'module-card h-100';

        // Add availability classes
        let availabilityClass = '';
        if (!isAvailable) {
            availabilityClass = 'module-unavailable';
        } else if (!isCompleted && !isInProgress) {
            availabilityClass = 'module-available';
        }

        col.innerHTML = `
            <div class="card ${cardClass} ${availabilityClass}" data-module-id="${module.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title">
                            ${module.title}
                            ${isCompleted ? '<i class="fas fa-check-circle text-success ms-2" title="Completed"></i>' : ''}
                            ${isInProgress ? '<i class="fas fa-play-circle text-primary ms-2" title="In Progress"></i>' : ''}
                            ${!isAvailable ? '<i class="fas fa-lock text-muted ms-2" title="Prerequisites required"></i>' : ''}
                        </h5>
                        <span class="badge bg-${difficultyColor[module.level]} difficulty-badge">${module.level}</span>
                    </div>
                    <p class="card-text">${module.description}</p>
                    ${!isAvailable ? `
                    <div class="alert alert-warning py-2 mb-2">
                        <small><i class="fas fa-exclamation-triangle"></i> Complete prerequisites first</small>
                    </div>
                    ` : ''}
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${module.duration} min
                        </small>
                        <div class="status-indicator">
                            <span class="badge ${isCompleted ? 'bg-success' : isInProgress ? 'bg-primary' : isAvailable ? 'bg-secondary' : 'bg-light text-dark'}">
                                ${isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isAvailable ? 'Available' : 'Locked'}
                            </span>
                        </div>
                    </div>
                    <div class="mt-2">
                        ${module.keywords.map(keyword => `<span class="badge bg-light text-dark me-1">${keyword}</span>`).join('')}
                    </div>
                    ${isCompleted ? `
                    <div class="mt-2">
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                        </div>
                    </div>
                    ` : isInProgress ? `
                    <div class="mt-2">
                        <div class="progress" style="height: 5px;">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: 50%"></div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="card-footer">
                    ${isCompleted ? `
                        <div class="d-flex justify-content-between align-items-center">
                            ${module.notebook_available ? `
                                <a href="${module.colab_url}" target="_blank" class="btn btn-outline-success btn-sm">
                                    <i class="fab fa-google"></i> Review in Colab
                                </a>
                                <a href="/download/${module.id}" class="btn btn-outline-secondary btn-sm" title="Download notebook">
                                    <i class="fas fa-download"></i>
                                </a>
                            ` : `
                                <button class="btn btn-outline-success btn-sm" onclick="app.startModule('${module.id}')">
                                    Review
                                </button>
                            `}
                        </div>
                    ` : isAvailable ? `
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                ${module.notebook_available ? `
                                    <a href="${module.colab_url}" target="_blank" class="btn btn-primary btn-sm">
                                        <i class="fab fa-google"></i> ${isInProgress ? 'Continue in Colab' : 'Start in Colab'}
                                    </a>
                                ` : `
                                    <button class="btn btn-primary btn-sm" onclick="app.startModule('${module.id}')">
                                        ${isInProgress ? 'Continue' : 'Start'}
                                    </button>
                                `}
                                ${this.currentUser ? `
                                    <button class="btn btn-outline-success btn-sm ms-2" onclick="app.markAsCompleted('${module.id}')" title="Mark as completed">
                                        ${isInProgress ? 'Mark Complete' : 'I know this'}
                                    </button>
                                ` : ''}
                            </div>
                            ${module.notebook_available ? `
                                <a href="/download/${module.id}" class="btn btn-outline-secondary btn-sm" title="Download notebook">
                                    <i class="fas fa-download"></i>
                                </a>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add click handler for modules with missing prerequisites
        if (!isAvailable) {
            const card = col.querySelector('.card');
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons or other interactive elements
                if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                    this.viewPrerequisites(module.id);
                }
            });
        }

        return col;
    }

    showListView() {
        document.getElementById('list-view').style.display = 'block';
        document.getElementById('graph-view').style.display = 'none';
        document.getElementById('list-view-btn').classList.add('active');
        document.getElementById('graph-view-btn').classList.remove('active');
        // Clear any existing highlights when switching views
        this.clearHighlights();
    }

    arePrerequisitesMet(module) {
        if (!module.prerequisites || module.prerequisites.length === 0) {
            return true; // No prerequisites means always available
        }
        
        return module.prerequisites.every(prereqId => {
            const prereqModule = this.modules.find(m => m.id === prereqId);
            return prereqModule && prereqModule.status === 'completed';
        });
    }

    getPrerequisiteChain(moduleId, visited = new Set()) {
        // Prevent infinite loops
        if (visited.has(moduleId)) {
            return [];
        }
        visited.add(moduleId);

        const module = this.modules.find(m => m.id === moduleId);
        if (!module || !module.prerequisites || module.prerequisites.length === 0) {
            return [];
        }

        let chain = [];
        
        // Add direct prerequisites
        for (const prereqId of module.prerequisites) {
            const prereqModule = this.modules.find(m => m.id === prereqId);
            if (prereqModule) {
                // Only include if not completed
                if (prereqModule.status !== 'completed') {
                    chain.push(prereqId);
                }
                // Recursively get prerequisites of this prerequisite
                const subChain = this.getPrerequisiteChain(prereqId, visited);
                chain = chain.concat(subChain);
            }
        }

        // Remove duplicates
        return [...new Set(chain)];
    }

    highlightPrerequisites(prerequisiteIds, targetId = null) {
        // Clear existing highlights
        this.clearHighlights();

        // Highlight in list view (excluding target)
        prerequisiteIds.filter(id => id !== targetId).forEach(prereqId => {
            const moduleCard = document.querySelector(`[data-module-id="${prereqId}"]`);
            if (moduleCard) {
                moduleCard.classList.add('prerequisite-highlight');
            }
        });

        // Highlight target in list view with different style
        if (targetId) {
            const targetCard = document.querySelector(`[data-module-id="${targetId}"]`);
            if (targetCard) {
                targetCard.classList.add('target-highlight');
            }
        }

        // Highlight in graph view
        if (this.graph && this.graph.node) {
            // First, make all nodes semi-transparent and restore default colors
            this.graph.node
                .classed('prerequisite-highlight', false)
                .classed('target-highlight', false);

        }
    }

    clearHighlights() {
        // Clear list view highlights
        document.querySelectorAll('.prerequisite-highlight, .target-highlight').forEach(card => {
            card.classList.remove('prerequisite-highlight', 'target-highlight');
        });

        // Clear graph view highlights
        if (this.graph && this.graph.node) {
            // Restore normal opacity for all nodes
            this.graph.node
                .classed('prerequisite-highlight', false)
                .classed('target-highlight', false);
                
            // Restore original node colors and styling
            this.updateGraphNodeColors();
            
        }
    }

    showGraphView() {
        document.getElementById('list-view').style.display = 'none';
        document.getElementById('graph-view').style.display = 'block';
        document.getElementById('list-view-btn').classList.remove('active');
        document.getElementById('graph-view-btn').classList.add('active');
        
        if (!this.graph) {
            this.createGraph();
        }
        // Clear any existing highlights when switching views
        this.clearHighlights();
    }

    categoryForce(width, height) {
        // Anchor core modules to bottom center
        const coreAnchor = {
            x: d3.forceX().x(d => d.category === 'core' ? width / 2 : d.x).strength(d => d.category === 'core' ? 0.3 : 0),
            y: d3.forceY().y(d => d.category === 'core' ? height * 0.8 : d.y).strength(d => d.category === 'core' ? 0.3 : 0)
        };

        return {
            x: coreAnchor.x,
            y: coreAnchor.y
        };
    }

    createGraph() {
        const container = document.getElementById('graph-container');
        const width = container.clientWidth;
        // Use viewport height minus navbar and other UI elements
        const height = Math.max(window.innerHeight - 200, 500);

        // Clear any existing SVG
        d3.select(container).selectAll('*').remove();

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('width', '100%')
            .style('height', `${height}px`);

        // Create links data
        const links = [];
        this.modules.forEach(module => {
            module.prerequisites.forEach(prereq => {
                links.push({
                    source: prereq,
                    target: module.id
                });
            });
        });

        // Create nodes data with completion status
        const nodes = this.modules.map(module => {
            // Start ALL nodes at the core position with small random offset, then let them expand out
            const coreX = width / 2;
            const coreY = height * 0.8;
            // Add small random offset to help with expansion and avoid overlap
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            
            return {
                id: module.id,
                title: module.title,
                level: module.level,
                category: module.category,
                description: module.description,
                duration: module.duration,
                prerequisites: module.prerequisites,
                status: module.status || 'not-started',
                x: coreX + offsetX,
                y: coreY + offsetY,
                fx: null, // Allow x movement
                fy: null  // Allow y movement
            };
        });

        // Color scale for different levels and completion status
        const getNodeColor = (d) => {
            const module = this.modules.find(m => m.id === d.id);
            const status = module ? module.status : 'not-started';
            const arePrerequisitesMet = module ? this.arePrerequisitesMet(module) : false;
            const isAvailable = arePrerequisitesMet || status === 'completed' || status === 'in-progress';
            
            if (!isAvailable) {
                return '#e9ecef'; // Light gray for unavailable
            } else if (status === 'completed') {
                return '#28a745'; // Green for completed
            } else if (status === 'in-progress') {
                return '#007bff'; // Blue for in progress
            } else {
                // Default colors based on level
                const levelColors = {
                    'beginner': '#6c757d',
                    'intermediate': '#ffc107', 
                    'advanced': '#dc3545'
                };
                return levelColors[d.level] || '#6c757d';
            }
        };

        // Create force simulation
        const categoryForces = this.categoryForce(width, height);
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(150).strength(0.5))
            .force('charge', d3.forceManyBody().strength(-600).distanceMax(300))
            .force('center', d3.forceCenter(width / 2, height / 2).strength(0.02))
            .force('collision', d3.forceCollide().radius(45).strength(0.8))
            .force('coreAnchorX', categoryForces.x)
            .force('coreAnchorY', categoryForces.y)
            .alpha(1) // Start with full energy for nice expansion effect
            .alphaDecay(0.02)
            .velocityDecay(0.4);

        // Create links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('class', 'link')

        // Create nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('class', 'node')
            .attr('r', 20) // Default node size
            .attr('fill', getNodeColor)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .on('click', (event, d) => this.selectModule(d.id));

        // Add labels
        const label = svg.append('g')
            .selectAll('text')
            .data(nodes)
            .enter().append('text')
            .text(d => d.title)
            .attr('font-size', 10)
            .attr('text-anchor', 'middle')
            .attr('dy', -25)
            .style('pointer-events', 'none');

        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        this.graph = { svg, nodes, links, simulation, node, link };
    }

    selectModule(moduleId) {
        this.selectedModule = moduleId;
        const module = this.modules.find(m => m.id === moduleId);
        
        if (!module) return;

        const isCompleted = module.status === 'completed';
        const isInProgress = module.status === 'in-progress';

        // Get status badge and icon
        const statusBadge = isCompleted ? '<span class="badge bg-success"><i class="fas fa-check-circle"></i> Completed</span>' :
                           isInProgress ? '<span class="badge bg-primary"><i class="fas fa-play-circle"></i> In Progress</span>' :
                           '<span class="badge bg-secondary"><i class="fas fa-circle"></i> Not Started</span>';

        // Get prerequisites info
        const prereqInfo = module.prerequisites.length > 0 ? 
            `<p><strong>Prerequisites:</strong> ${module.prerequisites.length} module(s)</p>` : 
            '<p><strong>Prerequisites:</strong> None</p>';

        // Get dependents info
        const dependents = this.modules.filter(m => m.prerequisites.includes(moduleId));
        const dependentInfo = dependents.length > 0 ? 
            `<p><strong>Unlocks:</strong> ${dependents.length} module(s)</p>` : 
            '<p><strong>Unlocks:</strong> No direct dependencies</p>';

        // Update module info panel
        const moduleInfo = document.getElementById('module-info');
        moduleInfo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">${module.title}</h6>
                ${statusBadge}
            </div>
            <p>${module.description}</p>
            <div class="module-details">
                <p><strong>Duration:</strong> ${module.duration} minutes</p>
                <p><strong>Level:</strong> <span class="badge bg-secondary">${module.level}</span></p>
                <p><strong>Category:</strong> ${module.category}</p>
                ${prereqInfo}
                ${dependentInfo}
            </div>
            ${isCompleted ? `
            <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar bg-success" role="progressbar" style="width: 100%;" 
                     aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            ` : isInProgress ? `
            <div class="progress mb-3" style="height: 8px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: 50%;" 
                     aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            ` : ''}
            <div class="d-grid gap-2">
                ${module.notebook_available ? `
                    <a href="${module.colab_url}" target="_blank" class="btn ${isCompleted ? 'btn-outline-success' : 'btn-primary'}">
                        <i class="fab fa-google"></i> ${isCompleted ? 'Review in Colab' : isInProgress ? 'Continue in Colab' : 'Start in Colab'}
                    </a>
                    <a href="/download/${module.id}" class="btn btn-outline-secondary">
                        <i class="fas fa-download"></i> Download Notebook
                    </a>
                ` : `
                    <button class="btn ${isCompleted ? 'btn-outline-success' : 'btn-primary'}" 
                            onclick="app.startModule('${module.id}')">
                        ${isCompleted ? 'Review Module' : isInProgress ? 'Continue Module' : 'Start Module'}
                    </button>
                `}
                ${this.currentUser && !isCompleted ? `
                <button class="btn btn-outline-secondary" onclick="app.markAsCompleted('${module.id}')">
                    ${isInProgress ? 'Mark Complete' : 'Mark as Completed'}
                </button>
                ` : ''}
            </div>
        `;

        // Highlight related nodes in graph
        if (this.graph) {
            this.highlightRelatedNodes(moduleId);
        }
    }

    highlightRelatedNodes(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        // Get the entire prerequisite chain (excluding completed modules)
        const prerequisiteChain = this.getPrerequisiteChain(moduleId);
        const prerequisites = new Set(prerequisiteChain);
        const dependents = new Set();
        
        // Find modules that depend on this one
        this.modules.forEach(m => {
            if (m.prerequisites.includes(moduleId)) {
                dependents.add(m.id);
            }
        });

        // Reset all styles
        this.graph.node.classed('selected', false)
                      .classed('prerequisite', false)
                      .classed('dependent', false);

        this.graph.link.classed('prerequisite', false)
                      .classed('dependent', false);

        // Highlight selected node
        this.graph.node.filter(d => d.id === moduleId)
                      .classed('selected', true);

        // Highlight prerequisite chain (excluding completed modules)
        this.graph.node.filter(d => prerequisites.has(d.id))
                      .classed('prerequisite', true);

        // Highlight dependents
        this.graph.node.filter(d => dependents.has(d.id))
                      .classed('dependent', true);

        // Highlight prerequisite links in the chain
        this.graph.link.filter(d => {
            const sourceInChain = prerequisites.has(d.source.id) || d.source.id === moduleId;
            const targetInChain = prerequisites.has(d.target.id) || d.target.id === moduleId;
            return sourceInChain && targetInChain;
        }).classed('prerequisite', true);

        // Highlight dependent links
        this.graph.link.filter(d => d.source.id === moduleId)
                      .classed('dependent', true);
    }

    startModule(moduleId) {
        // In a real implementation, this would navigate to the notebook
        const module = this.modules.find(m => m.id === moduleId);
        const isCompleted = module.status === 'completed';
        
        if (module.notebook_available) {
            if (isCompleted) {
                alert(`Reviewing module: ${module.title}\n\nClick "Review in Colab" to open the Jupyter notebook in Google Colab for review.`);
            } else {
                alert(`Starting module: ${module.title}\n\nClick "Start in Colab" to open the Jupyter notebook in Google Colab.`);
                
                // Update progress to in-progress
                if (this.currentUser && module.status === 'not-started') {
                    this.updateProgress(moduleId, 'in-progress');
                }
            }
        } else {
            if (isCompleted) {
                alert(`Reviewing module: ${module.title}\n\nThis module's notebook is coming soon.`);
            } else {
                alert(`Starting module: ${module.title}\n\nThis module's notebook is coming soon.`);
                
                // Update progress to in-progress
                if (this.currentUser && module.status === 'not-started') {
                    this.updateProgress(moduleId, 'in-progress');
                }
            }
        }
    }

    async markAsCompleted(moduleId) {
        if (!this.currentUser) {
            alert('Please log in to track your progress.');
            return;
        }

        try {
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    module_id: moduleId,
                    status: 'completed'
                })
            });

            if (response.ok) {
                // Update local state
                const module = this.modules.find(m => m.id === moduleId);
                if (module) {
                    module.status = 'completed';
                }
                
                // Refresh the views
                this.renderModules();
                this.selectModule(moduleId); // Refresh the info panel
                
                // Update graph if visible
                if (this.graph) {
                    this.updateGraphNodeColors();
                }
            } else {
                alert('Failed to update progress. Please try again.');
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Failed to update progress. Please try again.');
        }
    }

    async updateProgress(moduleId, status) {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    module_id: moduleId,
                    status: status
                })
            });

            if (response.ok) {
                // Update local state
                const module = this.modules.find(m => m.id === moduleId);
                if (module) {
                    module.status = status;
                }
                
                // Refresh the views
                this.renderModules();
                
                // Update graph if visible
                if (this.graph) {
                    this.updateGraphNodeColors();
                }
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    updateGraphNodeColors() {
        if (!this.graph) return;

        const getNodeColor = (d) => {
            const module = this.modules.find(m => m.id === d.id);
            const status = module ? module.status : 'not-started';
            const arePrerequisitesMet = module ? this.arePrerequisitesMet(module) : false;
            const isAvailable = arePrerequisitesMet || status === 'completed' || status === 'in-progress';
            
            if (!isAvailable) {
                return '#e9ecef'; // Light gray for unavailable
            } else if (status === 'completed') {
                return '#28a745'; // Green for completed
            } else if (status === 'in-progress') {
                return '#007bff'; // Blue for in progress
            } else {
                // Default colors based on level
                const levelColors = {
                    'beginner': '#6c757d',
                    'intermediate': '#ffc107', 
                    'advanced': '#dc3545'
                };
                return levelColors[d.level] || '#6c757d';
            }
        };

        const getNodeStroke = (d) => {
            const module = this.modules.find(m => m.id === d.id);
            const status = module ? module.status : 'not-started';
            const arePrerequisitesMet = module ? this.arePrerequisitesMet(module) : false;
            const isAvailable = arePrerequisitesMet || status === 'completed' || status === 'in-progress';
            
            if (!isAvailable) {
                return '#ced4da'; // Light gray border for unavailable
            } else if (status === 'completed') {
                return '#1e7e34'; // Darker green border
            } else if (status === 'in-progress') {
                return '#0056b3'; // Darker blue border
            } else {
                return '#495057'; // Default gray border
            }
        };

        // Update node colors and styles
        this.graph.node
            .attr('fill', getNodeColor)
            .attr('stroke', getNodeStroke)
            .style('filter', d => {
                const module = this.modules.find(m => m.id === d.id);
                const status = module ? module.status : 'not-started';
                const arePrerequisitesMet = module ? this.arePrerequisitesMet(module) : false;
                const isAvailable = arePrerequisitesMet || status === 'completed' || status === 'in-progress';
                return status === 'completed' ? 'drop-shadow(0px 0px 6px rgba(40, 167, 69, 0.5))' : null;
            });
    }

    viewPrerequisites(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        
        // Get the complete prerequisite chain
        const prerequisiteChain = this.getPrerequisiteChain(moduleId);
        
        if (prerequisiteChain.length === 0) {
            // No incomplete prerequisites, just clear any existing highlights
            this.clearHighlights();
            return;
        }

        // Add the target module to the highlighting (so the full path is visible)
        const highlightIds = [...prerequisiteChain, moduleId];
        
        // Highlight the prerequisite modules and target
        this.highlightPrerequisites(highlightIds, moduleId);
    }

    showModal(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    remember: document.getElementById('remember').checked
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                await this.loadUserProgress();
                this.updateLoginStatus();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                modal.hide();
                
                // Clear form
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async loadUserProgress() {
        if (!this.currentUser) return;

        try {
            const response = await fetch('/api/progress');
            if (response.ok) {
                const data = await response.json();
                // Update module status from backend
                this.modules.forEach(module => {
                    const progress = data.progress[module.id];
                    if (progress) {
                        module.status = progress.status;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading user progress:', error);
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
            });

            if (response.ok) {
                this.currentUser = null;
                // Reset all module status and reload data
                await this.loadCourseData();
                this.updateLoginStatus();
                
                // Update graph if visible
                if (this.graph) {
                    this.updateGraphNodeColors();
                }
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback logout
            this.currentUser = null;
            // Reset all module status and reload data
            this.loadCourseData();
            this.updateLoginStatus();
        }
    }

    async checkLoginStatus() {
        // Check if user is already logged in (from session)
        try {
            // First try to get user info
            const userResponse = await fetch('/api/user');
            if (userResponse.ok) {
                const userData = await userResponse.json();
                this.currentUser = userData.user;
                
                // Load modules with user progress
                await this.loadCourseData();
                this.updateLoginStatus();
                return;
            }
        } catch (error) {
            // User not logged in, that's fine
        }
        
        // If no user session, just load modules without progress
        try {
            await this.loadCourseData();
            this.updateLoginStatus();
        } catch (error) {
            console.error('Error loading course data:', error);
        }
    }

    updateLoginStatus() {
        const loginBtn = document.getElementById('login-btn');
        const userInfo = document.getElementById('user-info');
        const username = document.getElementById('username');

        if (this.currentUser) {
            loginBtn.style.display = 'none';
            userInfo.style.display = 'block';
            username.textContent = this.currentUser.name;
        } else {
            loginBtn.style.display = 'block';
            userInfo.style.display = 'none';
        }

        // Update progress overview visibility
        this.updateProgressOverview();
        this.renderModules(); // Refresh modules to show progress
    }

    showLoginModal() {
        // Hide register modal if open
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) {
            registerModal.hide();
        }
        
        this.showModal('loginModal');
    }

    showRegisterModal() {
        // Hide login modal if open
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }
        
        this.showModal('registerModal');
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-password-confirm').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                await this.loadUserProgress();
                this.updateLoginStatus();
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                modal.hide();
                
                // Clear form
                document.getElementById('register-name').value = '';
                document.getElementById('register-email').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-password-confirm').value = '';
                
                alert('Account created successfully! Welcome to the course.');
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    }
}

// Initialize the application
const app = new CourseApp();
