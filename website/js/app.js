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
            const response = await fetch('../course_structure.json');
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
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase();
        this.filteredModules = this.modules.filter(module => 
            module.title.toLowerCase().includes(searchTerm) ||
            module.description.toLowerCase().includes(searchTerm) ||
            module.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
        );
        this.renderModules();
    }

    handleCategoryFilter(category) {
        if (category === '') {
            this.filteredModules = [...this.modules];
        } else {
            this.filteredModules = this.modules.filter(module => module.category === category);
        }
        this.renderModules();
    }

    renderModules() {
        const container = document.getElementById('modules-container');
        container.innerHTML = '';

        this.filteredModules.forEach(module => {
            const moduleCard = this.createModuleCard(module);
            container.appendChild(moduleCard);
        });
    }

    createModuleCard(module) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';

        const difficultyColor = {
            'beginner': 'success',
            'intermediate': 'warning',
            'advanced': 'danger'
        };

        const isCompleted = this.userProgress[module.id] === 'completed';
        const isInProgress = this.userProgress[module.id] === 'in-progress';

        col.innerHTML = `
            <div class="card module-card h-100" data-module-id="${module.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title">${module.title}</h5>
                        <span class="badge bg-${difficultyColor[module.level]} difficulty-badge">${module.level}</span>
                    </div>
                    <p class="card-text">${module.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${module.duration} min
                        </small>
                        <div>
                            ${isCompleted ? '<i class="fas fa-check-circle text-success"></i>' : ''}
                            ${isInProgress ? '<i class="fas fa-play-circle text-primary"></i>' : ''}
                        </div>
                    </div>
                    <div class="mt-2">
                        ${module.keywords.map(keyword => `<span class="badge bg-light text-dark me-1">${keyword}</span>`).join('')}
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm" onclick="app.startModule('${module.id}')">
                        ${isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'}
                    </button>
                    <button class="btn btn-outline-secondary btn-sm ms-2" onclick="app.viewPrerequisites('${module.id}')">
                        Prerequisites
                    </button>
                </div>
            </div>
        `;

        return col;
    }

    showListView() {
        document.getElementById('list-view').style.display = 'block';
        document.getElementById('graph-view').style.display = 'none';
        document.getElementById('list-view-btn').classList.add('active');
        document.getElementById('graph-view-btn').classList.remove('active');
    }

    showGraphView() {
        document.getElementById('list-view').style.display = 'none';
        document.getElementById('graph-view').style.display = 'block';
        document.getElementById('list-view-btn').classList.remove('active');
        document.getElementById('graph-view-btn').classList.add('active');
        
        if (!this.graph) {
            this.createGraph();
        }
    }

    createGraph() {
        const container = document.getElementById('graph-container');
        const width = container.clientWidth;
        const height = 600;

        // Clear any existing SVG
        d3.select(container).selectAll('*').remove();

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

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

        // Create nodes data
        const nodes = this.modules.map(module => ({
            id: module.id,
            title: module.title,
            level: module.level,
            category: module.category,
            description: module.description,
            duration: module.duration,
            prerequisites: module.prerequisites
        }));

        // Color scale for different levels
        const colorScale = d3.scaleOrdinal()
            .domain(['beginner', 'intermediate', 'advanced'])
            .range(['#007bff', '#28a745', '#ffc107']);

        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));

        // Create links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('class', 'link')
            .attr('stroke-width', 2);

        // Create nodes
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('class', 'node')
            .attr('r', 20)
            .attr('fill', d => colorScale(d.level))
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

        // Update module info panel
        const moduleInfo = document.getElementById('module-info');
        moduleInfo.innerHTML = `
            <h6>${module.title}</h6>
            <p>${module.description}</p>
            <p><strong>Duration:</strong> ${module.duration} minutes</p>
            <p><strong>Level:</strong> ${module.level}</p>
            <p><strong>Category:</strong> ${module.category}</p>
            <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="app.startModule('${module.id}')">
                    Start Module
                </button>
            </div>
        `;

        // Highlight related nodes in graph
        if (this.graph) {
            this.highlightRelatedNodes(moduleId);
        }
    }

    highlightRelatedNodes(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        const prerequisites = new Set(module.prerequisites);
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

        // Highlight prerequisites
        this.graph.node.filter(d => prerequisites.has(d.id))
                      .classed('prerequisite', true);

        // Highlight dependents
        this.graph.node.filter(d => dependents.has(d.id))
                      .classed('dependent', true);

        // Highlight links
        this.graph.link.filter(d => d.target.id === moduleId)
                      .classed('prerequisite', true);

        this.graph.link.filter(d => d.source.id === moduleId)
                      .classed('dependent', true);
    }

    startModule(moduleId) {
        // In a real implementation, this would navigate to the notebook
        alert(`Starting module: ${moduleId}\n\nThis would open the Jupyter notebook for this module.`);
        
        // Update progress
        if (this.currentUser) {
            this.userProgress[moduleId] = 'in-progress';
            this.saveProgress();
        }
    }

    viewPrerequisites(moduleId) {
        const module = this.modules.find(m => m.id === moduleId);
        if (module.prerequisites.length === 0) {
            alert('This module has no prerequisites!');
            return;
        }

        const prereqNames = module.prerequisites.map(id => {
            const prereq = this.modules.find(m => m.id === id);
            return prereq ? prereq.title : id;
        });

        alert(`Prerequisites for "${module.title}":\n\n${prereqNames.join('\n')}`);
    }

    showLoginModal() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }

    handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Simple demo authentication
        if (email && password) {
            this.currentUser = { email: email, name: email.split('@')[0] };
            this.loadProgress();
            this.updateLoginStatus();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();
        }
    }

    logout() {
        this.currentUser = null;
        this.userProgress = {};
        this.updateLoginStatus();
        this.renderModules();
    }

    checkLoginStatus() {
        // Check if user is already logged in (from localStorage)
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.loadProgress();
            this.updateLoginStatus();
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
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        } else {
            loginBtn.style.display = 'block';
            userInfo.style.display = 'none';
            localStorage.removeItem('currentUser');
        }
    }

    loadProgress() {
        if (this.currentUser) {
            const savedProgress = localStorage.getItem(`progress_${this.currentUser.email}`);
            this.userProgress = savedProgress ? JSON.parse(savedProgress) : {};
        }
    }

    saveProgress() {
        if (this.currentUser) {
            localStorage.setItem(`progress_${this.currentUser.email}`, JSON.stringify(this.userProgress));
        }
    }
}

// Initialize the application
const app = new CourseApp();
