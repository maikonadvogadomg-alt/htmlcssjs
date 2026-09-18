// ============================================
// PROJECTS MODULE - Gerenciador de Projetos
// Módulo: ISOLADO ✓
// ============================================

class ProjectsModule {
    constructor(supabaseClient, authModule) {
        this.client = supabaseClient;
        this.auth = authModule;
        this.projects = [];
        this.currentProject = null;
    }

    /**
     * Carrega projetos do usuário
     */
    async loadProjects() {
        try {
            if (!this.auth.currentUser) {
                console.warn('Usuário não autenticado');
                return;
            }

            const projects = await this.client.select('projects', {
                user_id: this.auth.currentUser.id
            });

            this.projects = projects || [];
            this.render();
        } catch (error) {
            toast('❌ Erro ao carregar projetos', 'error');
            console.error(error);
        }
    }

    /**
     * Renderiza página de projetos
     */
    render() {
        const html = `
            <div class="projects-page">
                <div class="projects-header">
                    <h2>📁 Meus Projetos</h2>
                    <button class="btn btn-primary" onclick="projectsModule.showNewProjectForm()">
                        ➕ Novo Projeto
                    </button>
                </div>

                ${this.projects.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">📁</div>
                        <h3>Nenhum projeto ainda</h3>
                        <p>Crie seu primeiro projeto para começar</p>
                        <button class="btn btn-primary" onclick="projectsModule.showNewProjectForm()">
                            Criar Projeto
                        </button>
                    </div>
                ` : `
                    <div class="projects-grid">
                        ${this.projects.map(p => `
                            <div class="project-card" onclick="projectsModule.openProject('${p.id}')">
                                <div class="project-header">
                                    <div class="project-icon">
                                        ${this.getTypeIcon(p.type)}
                                    </div>
                                    <div class="project-actions">
                                        <button class="btn-icon" onclick="event.stopPropagation(); projectsModule.editProject('${p.id}')">
                                            ✏️
                                        </button>
                                        <button class="btn-icon" onclick="event.stopPropagation(); projectsModule.deleteProject('${p.id}')">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div class="project-name">${p.name}</div>
                                <div class="project-desc">${p.description || 'Sem descrição'}</div>
                                <div class="project-footer">
                                    <span class="project-type">${p.type}</span>
                                    <span class="project-date">${new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;

        qs('#pages-container').innerHTML = html;
    }

    /**
     * Retorna ícone do tipo de projeto
     */
    getTypeIcon(type) {
        const icons = {
            html: '🌐',
            react: '⚛️',
            python: '🐍',
            java: '☕'
        };
        return icons[type] || '📄';
    }

    /**
     * Mostra formulário de novo projeto
     */
    showNewProjectForm() {
        const html = `
            <div class="modal-overlay" onclick="projectsModule.render()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <h2>➕ Novo Projeto</h2>

                    <form id="new-project-form" class="form">
                        <div class="form-group">
                            <label>Nome do Projeto</label>
                            <input 
                                type="text" 
                                id="project-name" 
                                class="input"
                                placeholder="Meu Projeto" 
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea 
                                id="project-desc" 
                                class="input"
                                placeholder="Descrição do projeto..."
                                rows="3"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label>Tipo</label>
                            <select id="project-type" class="input" required>
                                <option value="">Selecione um tipo...</option>
                                <option value="html">🌐 HTML</option>
                                <option value="react">⚛️ React</option>
                                <option value="python">🐍 Python</option>
                                <option value="java">☕ Java</option>
                            </select>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Criar Projeto</button>
                            <button type="button" class="btn btn-secondary" onclick="projectsModule.render()">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        qs('#pages-container').innerHTML = html;

        qs('#new-project-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = qs('#project-name').value;
            const description = qs('#project-desc').value;
            const type = qs('#project-type').value;

            await this.createProject(name, type, description);
        });
    }

    /**
     * Cria novo projeto
     */
    async createProject(name, type, description) {
        try {
            const project = await this.client.insert('projects', {
                user_id: this.auth.currentUser.id,
                name,
                type,
                description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            toast('✅ Projeto criado!', 'success');
            await this.loadProjects();
        } catch (error) {
            toast('❌ Erro ao criar projeto', 'error');
            console.error(error);
        }
    }

    /**
     * Abre projeto (carrega editor)
     */
    async openProject(projectId) {
        try {
            const projects = await this.client.select('projects', { id: projectId });
            const project = projects[0];

            if (!project) {
                toast('❌ Projeto não encontrado', 'error');
                return;
            }

            this.currentProject = project;
            localStorage.setItem('currentProject', JSON.stringify(project));

            // Carrega editor
            if (window.editorModule) {
                editorModule.loadProject(project);
            }
        } catch (error) {
            toast('❌ Erro ao abrir projeto', 'error');
            console.error(error);
        }
    }

    /**
     * Edita projeto
     */
    editProject(projectId) {
        toast('✏️ Editar projeto (em desenvolvimento)', 'warning');
    }

    /**
     * Deleta projeto
     */
    async deleteProject(projectId) {
        if (!confirm('Tem certeza que deseja deletar este projeto?')) {
            return;
        }

        try {
            await this.client.delete('projects', { id: projectId });
            toast('✅ Projeto deletado!', 'success');
            await this.loadProjects();
        } catch (error) {
            toast('❌ Erro ao deletar projeto', 'error');
            console.error(error);
        }
    }
}

// Inicializa módulo global
const projectsModule = new ProjectsModule(supabaseClient, authModule);

console.log('✓ Projects Module carregado');
