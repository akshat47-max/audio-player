class ProjectManager {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.currentProject = null;
        this.tasks = [];
        this.comments = [];
        this.users = [{
                id: 1,
                name: 'John Doe',
                email: 'john@example.com'
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@example.com'
            },
            {
                id: 3,
                name: 'Mike Johnson',
                email: 'mike@example.com'
            },
            {
                id: 4,
                name: 'Sarah Wilson',
                email: 'sarah@example.com'
            }
        ];
        this.nextProjectId = 1;
        this.nextTaskId = 1;
        this.nextCommentId = 1;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showAuthModal();
        this.setupDragAndDrop();
        this.simulateRealTimeUpdates();
    }

    // Authentication System
    showAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('active');
    }

    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.remove('active');
    }

    login(username, email) {
        // Simple auth simulation
        this.currentUser = {
            id: Date.now(),
            name: username,
            email: email
        };

        document.getElementById('current-user').textContent = username;
        this.hideAuthModal();
        this.showNotification('Welcome to ProjectFlow!', 'success');

        // Load demo data
        this.loadDemoData();
    }

    logout() {
        this.currentUser = null;
        this.projects = [];
        this.currentProject = null;
        this.tasks = [];
        this.comments = [];
        this.updateProjectsList();
        this.showWelcomeMessage();
        this.showAuthModal();
    }

    // Demo Data
    loadDemoData() {
        // Create sample projects
        const project1 = this.createProject('Website Redesign', 'Complete overhaul of company website with modern design and improved UX');
        const project2 = this.createProject('Mobile App Development', 'Develop native mobile app for iOS and Android platforms');

        // Create sample tasks for first project
        this.selectProject(project1.id);
        this.createTask('Design homepage mockup', 'Create wireframes and mockups for the new homepage layout', 'todo', 'high', this.users[1].id);
        this.createTask('Set up development environment', 'Configure local development environment with necessary tools', 'in-progress', 'medium', this.users[0].id);
        this.createTask('Research competitors', 'Analyze competitor websites for inspiration and best practices', 'done', 'low', this.users[2].id);

        // Add sample comments
        const task1 = this.tasks.find(t => t.title === 'Design homepage mockup');
        if (task1) {
            this.addComment(task1.id, this.users[1].id, 'Started working on the initial wireframes. Will have them ready by tomorrow.');
            this.addComment(task1.id, this.users[0].id, 'Great! Looking forward to seeing the designs.');
        }
    }

    // Project Management
    createProject(name, description) {
        const project = {
            id: this.nextProjectId++,
            name: name,
            description: description,
            createdBy: this.currentUser.id,
            createdAt: new Date(),
            members: [this.currentUser.id]
        };

        this.projects.push(project);
        this.updateProjectsList();
        this.showNotification(`Project "${name}" created successfully!`, 'success');

        return project;
    }

    selectProject(projectId) {
        this.currentProject = this.projects.find(p => p.id === projectId);
        if (this.currentProject) {
            this.showProjectBoard();
            this.updateProjectHeader();
            this.updateBoard();
            this.updateProjectsList(); // Update active state
        }
    }

    deleteProject(projectId) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            const projectName = this.projects[projectIndex].name;
            this.projects.splice(projectIndex, 1);

            // Remove associated tasks
            this.tasks = this.tasks.filter(t => t.projectId !== projectId);

            // Remove associated comments
            this.comments = this.comments.filter(c => {
                const task = this.tasks.find(t => t.id === c.taskId);
                return task && task.projectId !== projectId;
            });

            if (this.currentProject && this.currentProject.id === projectId) {
                this.currentProject = null;
                this.showWelcomeMessage();
            }

            this.updateProjectsList();
            this.showNotification(`Project "${projectName}" deleted successfully!`, 'success');
        }
    }

    // Task Management
    createTask(title, description, status = 'todo', priority = 'medium', assigneeId = null, dueDate = null) {
        if (!this.currentProject) {
            this.showNotification('Please select a project first!', 'error');
            return;
        }

        const task = {
            id: this.nextTaskId++,
            title: title,
            description: description,
            status: status,
            priority: priority,
            assigneeId: assigneeId,
            dueDate: dueDate,
            projectId: this.currentProject.id,
            createdBy: this.currentUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.tasks.push(task);
        this.updateBoard();
        this.showNotification(`Task "${title}" created successfully!`, 'success');

        // Simulate real-time notification
        if (assigneeId && assigneeId !== this.currentUser.id) {
            const assignee = this.users.find(u => u.id === assigneeId);
            setTimeout(() => {
                this.showNotification(`New task assigned to ${assignee.name}: "${title}"`, 'info');
            }, 1000);
        }

        return task;
    }

    updateTask(taskId, updates) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = {
                ...this.tasks[taskIndex],
                ...updates,
                updatedAt: new Date()
            };
            this.updateBoard();

            // Show notification for status changes
            if (updates.status) {
                const task = this.tasks[taskIndex];
                this.showNotification(`Task "${task.title}" moved to ${updates.status.replace('-', ' ')}`, 'success');
            }

            return this.tasks[taskIndex];
        }
        return null;
    }

    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const taskTitle = this.tasks[taskIndex].title;
            this.tasks.splice(taskIndex, 1);

            // Remove associated comments
            this.comments = this.comments.filter(c => c.taskId !== taskId);

            this.updateBoard();
            this.showNotification(`Task "${taskTitle}" deleted successfully!`, 'success');
        }
    }

    getTasksByStatus(status) {
        return this.tasks.filter(task =>
            task.projectId === this.currentProject?.id && task.status === status
        );
    }

    // Comment System
    addComment(taskId, userId, text) {
        const comment = {
            id: this.nextCommentId++,
            taskId: taskId,
            userId: userId,
            text: text,
            createdAt: new Date()
        };

        this.comments.push(comment);
        this.showNotification('Comment added successfully!', 'success');

        return comment;
    }

    getComments(taskId) {
        return this.comments
            .filter(c => c.taskId === taskId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    // UI Updates
    updateProjectsList() {
        const projectsList = document.getElementById('projects-list');
        projectsList.innerHTML = '';

        this.projects.forEach(project => {
            const li = document.createElement('li');
            li.textContent = project.name;
            li.dataset.projectId = project.id;

            if (this.currentProject && this.currentProject.id === project.id) {
                li.classList.add('active');
            }

            li.addEventListener('click', () => this.selectProject(project.id));
            projectsList.appendChild(li);
        });
    }

    updateProjectHeader() {
        if (this.currentProject) {
            document.getElementById('project-title').textContent = this.currentProject.name;
            document.getElementById('project-header').style.display = 'flex';
        } else {
            document.getElementById('project-header').style.display = 'none';
        }
    }

    updateBoard() {
        ['todo', 'in-progress', 'done'].forEach(status => {
            const container = document.querySelector(`.tasks-container[data-status="${status}"]`);
            const tasks = this.getTasksByStatus(status);

            // Update task count
            const countElement = document.querySelector(`.column[data-status="${status}"] .task-count`);
            countElement.textContent = tasks.length;

            // Clear and populate tasks
            container.innerHTML = '';

            if (tasks.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = '<i class="fas fa-inbox"></i><p>No tasks yet</p>';
                container.appendChild(emptyState);
                return;
            }

            tasks.forEach(task => {
                const taskCard = this.createTaskCard(task);
                container.appendChild(taskCard);
            });
        });
    }

    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = `task-card priority-${task.priority}`;
        card.draggable = true;
        card.dataset.taskId = task.id;

        const assignee = task.assigneeId ? this.users.find(u => u.id === task.assigneeId) : null;
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';

        card.innerHTML = `
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                <div class="task-assignee">
                    <i class="fas fa-user"></i>
                    <span>${assignee ? assignee.name : 'Unassigned'}</span>
                </div>
                ${dueDate ? `<div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i>
                    ${dueDate.toLocaleDateString()}
                </div>` : ''}
            </div>
        `;

        card.addEventListener('click', () => this.showTaskDetail(task.id));

        return card;
    }

    showWelcomeMessage() {
        document.getElementById('welcome-message').style.display = 'block';
        document.getElementById('board').style.display = 'none';
        document.getElementById('project-header').style.display = 'none';
    }

    showProjectBoard() {
        document.getElementById('welcome-message').style.display = 'none';
        document.getElementById('board').style.display = 'flex';
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
    }

    // Task Detail Modal
    showTaskDetail(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('task-detail-modal');
        const assignee = task.assigneeId ? this.users.find(u => u.id === task.assigneeId) : null;
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set';

        document.getElementById('task-detail-title').textContent = task.title;
        document.getElementById('task-detail-status').textContent = task.status.replace('-', ' ').toUpperCase();
        document.getElementById('task-detail-priority').textContent = task.priority.toUpperCase();
        document.getElementById('task-detail-priority').className = `priority-${task.priority}`;
        document.getElementById('task-detail-assignee').textContent = assignee ? assignee.name : 'Unassigned';
        document.getElementById('task-detail-due').textContent = dueDate;
        document.getElementById('task-detail-description').textContent = task.description || 'No description provided.';

        // Load comments
        this.loadTaskComments(taskId);

        // Store current task ID for actions
        modal.dataset.taskId = taskId;

        this.showModal('task-detail-modal');
    }

    loadTaskComments(taskId) {
        const commentsList = document.getElementById('comments-list');
        const comments = this.getComments(taskId);

        commentsList.innerHTML = '';

        comments.forEach(comment => {
            const user = this.users.find(u => u.id === comment.userId);
            const commentEl = document.createElement('div');
            commentEl.className = 'comment';
            commentEl.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${user ? user.name : 'Unknown User'}</span>
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            `;
            commentsList.appendChild(commentEl);
        });

        // Scroll to bottom
        commentsList.scrollTop = commentsList.scrollHeight;
    }

    // Drag and Drop
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const column = e.target.closest('.column');
            if (column) {
                column.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const column = e.target.closest('.column');
            if (column && !column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const column = e.target.closest('.column');
            if (column) {
                column.classList.remove('drag-over');
                const taskId = parseInt(e.dataTransfer.getData('text/plain'));
                const newStatus = column.dataset.status;
                this.updateTask(taskId, {
                    status: newStatus
                });
            }
        });
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div>${message}</div>
        `;

        const container = document.getElementById('notifications');
        container.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }

    // Real-time Updates Simulation
    simulateRealTimeUpdates() {
        // Simulate occasional updates from other users
        setInterval(() => {
            if (Math.random() < 0.1 && this.tasks.length > 0) { // 10% chance every 10 seconds
                const messages = [
                    'Task updated by team member',
                    'New comment added to task',
                    'Task priority changed',
                    'Due date extended'
                ];
                const message = messages[Math.floor(Math.random() * messages.length)];
                this.showNotification(message, 'info');
            }
        }, 10000);
    }

    // Populate assignee dropdown
    populateAssigneeDropdown() {
        const select = document.getElementById('task-assignee');
        select.innerHTML = '<option value="">Unassigned</option>';

        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
    }

    // Event Listeners
    setupEventListeners() {
        // Auth form
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            this.login(username, email);
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Create project button
        document.getElementById('create-project-btn').addEventListener('click', () => {
            this.showModal('project-modal');
        });

        // Project form
        document.getElementById('project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('project-name').value;
            const description = document.getElementById('project-description').value;
            const project = this.createProject(name, description);
            this.selectProject(project.id);
            this.hideModal('project-modal');
            document.getElementById('project-form').reset();
        });

        // Add task buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-task-btn')) {
                const status = e.target.dataset.status;
                this.showTaskModal(null, status);
            }
        });

        // Quick task button
        document.getElementById('create-task-btn').addEventListener('click', () => {
            if (!this.currentProject) {
                this.showNotification('Please select a project first!', 'error');
                return;
            }
            this.showTaskModal();
        });

        // Task form
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskFormSubmit();
        });

        // Task detail actions
        document.getElementById('edit-task-btn').addEventListener('click', () => {
            const modal = document.getElementById('task-detail-modal');
            const taskId = parseInt(modal.dataset.taskId);
            this.hideModal('task-detail-modal');
            this.showTaskModal(taskId);
        });

        document.getElementById('delete-task-btn').addEventListener('click', () => {
            const modal = document.getElementById('task-detail-modal');
            const taskId = parseInt(modal.dataset.taskId);
            if (confirm('Are you sure you want to delete this task?')) {
                this.deleteTask(taskId);
                this.hideModal('task-detail-modal');
            }
        });

        // Comment form
        document.getElementById('comment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const modal = document.getElementById('task-detail-modal');
            const taskId = parseInt(modal.dataset.taskId);
            const text = document.getElementById('comment-text').value.trim();

            if (text) {
                this.addComment(taskId, this.currentUser.id, text);
                this.loadTaskComments(taskId);
                document.getElementById('comment-text').value = '';
            }
        });

        // Modal close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('cancel-btn')) {
                e.target.closest('.modal').classList.remove('active');
            }

            // Close modal when clicking outside
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    showTaskModal(taskId = null, defaultStatus = 'todo') {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const title = document.getElementById('task-modal-title');

        this.populateAssigneeDropdown();

        if (taskId) {
            // Edit mode
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            title.textContent = 'Edit Task';
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-assignee').value = task.assigneeId || '';
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due-date').value = task.dueDate || '';

            form.dataset.taskId = taskId;
            form.dataset.status = task.status;
        } else {
            // Create mode
            title.textContent = 'Create New Task';
            form.reset();
            form.removeAttribute('data-task-id');
            form.dataset.status = defaultStatus;
            document.getElementById('task-priority').value = 'medium';
        }

        this.showModal('task-modal');
    }

    handleTaskFormSubmit() {
        const form = document.getElementById('task-form');
        const taskId = form.dataset.taskId;

        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            assigneeId: document.getElementById('task-assignee').value ? parseInt(document.getElementById('task-assignee').value) : null,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value || null,
            status: form.dataset.status || 'todo'
        };

        if (taskId) {
            // Update existing task
            this.updateTask(parseInt(taskId), taskData);
            this.showNotification('Task updated successfully!', 'success');
        } else {
            // Create new task
            this.createTask(
                taskData.title,
                taskData.description,
                taskData.status,
                taskData.priority,
                taskData.assigneeId,
                taskData.dueDate
            );
        }

        this.hideModal('task-modal');
        form.reset();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.projectManager = new ProjectManager();
});
