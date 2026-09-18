// ============================================
// EDITOR MODULE - Editor de Código
// Módulo: ISOLADO ✓
// ============================================

class EditorModule {
    constructor(supabaseClient, authModule, projectsModule) {
        this.client = supabaseClient;
        this.auth = authModule;
        this.projects = projectsModule;
        this.currentProject = null;
        this.files = [];
        this.currentFile = null;
        this.previewMode = 'off'; // off, split, full
    }

    /**
     * Carrega projeto e renderiza editor
     */
    async loadProject(project) {
        try {
            this.currentProject = project;

            // Carrega arquivos do projeto
            const files = await this.client.select('files', {
                project_id: project.id
            });

            this.files = files || [];

            // Se não há arquivos, cria um padrão
            if (this.files.length === 0) {
                await this.createDefaultFile();
            }

            this.render();
        } catch (error) {
            toast('❌ Erro ao carregar projeto', 'error');
            console.error(error);
        }
    }

    /**
     * Cria arquivo padrão
     */
    async createDefaultFile() {
        const defaultContent = this.currentProject.type === 'html' 
            ? `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentProject.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: sans-serif; background: #f5f5f5; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>👋 Bem-vindo ao ${this.currentProject.name}</h1>
    <p>Comece a editar aqui...</p>
</body>
</html>`
            : `// ${this.currentProject.name}
console.log('Olá, mundo!');`;

        const file = await this.client.insert('files', {
            project_id: this.currentProject.id,
            name: this.currentProject.type === 'html' ? 'index.html' : 'main.js',
            path: this.currentProject.type === 'html' ? 'index.html' : 'main.js',
            content: defaultContent,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        this.files.push(file);
        this.currentFile = file;
    }

    /**
     * Renderiza editor
     */
    render() {
        const html = `
            <div class="editor-page">
                <!-- HEADER DO EDITOR -->
                <div class="editor-header">
                    <div class="editor-title">
                        <button class="btn-back" onclick="projectsModule.loadProjects()">← Voltar</button>
                        <h2>${this.currentProject.name}</h2>
                    </div>
                    <div class="editor-actions">
                        <button class="btn btn-secondary" onclick="editorModule.togglePreview('split')">
                            ⚡ Split
                        </button>
                        <button class="btn btn-secondary" onclick="editorModule.togglePreview('full')">
                            🖥️ Full
                        </button>
                        <button class="btn btn-secondary" onclick="editorModule.saveFile()">
                            💾 Salvar
                        </button>
                    </div>
                </div>

                <!-- CONTAINER DO EDITOR -->
                <div class="editor-container">
                    <!-- SIDEBAR COM ARQUIVOS -->
                    <aside class="editor-sidebar">
                        <div class="sidebar-header">
                            <h3>📄 Arquivos</h3>
                            <button class="btn-icon" onclick="editorModule.showNewFileForm()">➕</button>
                        </div>
                        <div class="files-list">
                            ${this.files.map(f => `
                                <div class="file-item ${this.currentFile?.id === f.id ? 'active' : ''}" 
                                     onclick="editorModule.selectFile('${f.id}')">
                                    <span class="file-icon">${this.getFileIcon(f.name)}</span>
                                    <span class="file-name">${f.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </aside>

                    <!-- EDITOR DE CÓDIGO -->
                    <div class="editor-main">
                        <div class="code-editor">
                            <div class="editor-tabs">
                                ${this.files.map(f => `
                                    <div class="tab ${this.currentFile?.id === f.id ? 'active' : ''}" 
                                         onclick="editorModule.selectFile('${f.id}')">
                                        ${this.getFileIcon(f.name)} ${f.name}
                                    </div>
                                `).join('')}
                            </div>
                            <textarea 
                                id="code-editor" 
                                class="code-textarea"
                                placeholder="Escreva seu código aqui..."
                                onkeydown="editorModule.handleKeydown(event)"
                                oninput="editorModule.onCodeChange()"
                            >${this.currentFile?.content || ''}</textarea>
                        </div>

                        <!-- PREVIEW -->
                        ${this.previewMode !== 'off' ? `
                            <div class="preview-container" style="display: ${this.previewMode === 'full' ? 'block' : 'flex'}">
                                <div class="preview-header">
                                    <span>🖼️ Preview</span>
                                    <button class="btn-icon" onclick="editorModule.togglePreview('off')">✕</button>
                                </div>
                                <iframe id="preview-frame" class="preview-frame"></iframe>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        qs('#pages-container').innerHTML = html;

        // Inicializa editor
        if (this.currentFile) {
            this.updatePreview();
        }
    }

    /**
     * Retorna ícone do arquivo
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            html: '🌐',
            css: '🎨',
            js: '📜',
            json: '📋',
            md: '📝',
            py: '🐍',
            java: '☕'
        };
        return icons[ext] || '📄';
    }

    /**
     * Seleciona arquivo
     */
    selectFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;

        // Salva arquivo anterior
        if (this.currentFile) {
            const textarea = qs('#code-editor');
            if (textarea) {
                this.currentFile.content = textarea.value;
            }
        }

        this.currentFile = file;
        this.render();
    }

    /**
     * Mostra formulário de novo arquivo
     */
    showNewFileForm() {
        const filename = prompt('Nome do arquivo (ex: style.css):');
        if (!filename) return;

        this.createFile(filename);
    }

    /**
     * Cria novo arquivo
     */
    async createFile(filename) {
        try {
            const file = await this.client.insert('files', {
                project_id: this.currentProject.id,
                name: filename,
                path: filename,
                content: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            this.files.push(file);
            this.currentFile = file;
            this.render();
            toast('✅ Arquivo criado!', 'success');
        } catch (error) {
            toast('❌ Erro ao criar arquivo', 'error');
            console.error(error);
        }
    }

    /**
     * Salva arquivo
     */
    async saveFile() {
        if (!this.currentFile) return;

        try {
            const textarea = qs('#code-editor');
            const content = textarea.value;

            await this.client.update('files', 
                { content, updated_at: new Date().toISOString() },
                { id: this.currentFile.id }
            );

            this.currentFile.content = content;
            toast('✅ Arquivo salvo!', 'success');
            this.updatePreview();
        } catch (error) {
            toast('❌ Erro ao salvar arquivo', 'error');
            console.error(error);
        }
    }

    /**
     * Alterna modo de preview
     */
    togglePreview(mode) {
        this.previewMode = mode;
        this.render();
    }

    /**
     * Atualiza preview
     */
    updatePreview() {
        if (this.previewMode === 'off') return;

        const frame = qs('#preview-frame');
        if (!frame) return;

        const ext = this.currentFile.name.split('.').pop().toLowerCase();

        if (ext === 'html') {
            frame.srcdoc = this.currentFile.content;
        } else if (ext === 'css') {
            frame.srcdoc = `
                <html>
                <head>
                    <style>${this.currentFile.content}</style>
                </head>
                <body>
                    <div style="padding: 20px;">
                        <h2>Preview CSS</h2>
                        <p>Estilos aplicados</p>
                    </div>
                </body>
                </html>
            `;
        } else {
            frame.srcdoc = `
                <pre style="padding: 20px; background: #1e293b; color: #e2e8f0;">
${this.currentFile.content}
                </pre>
            `;
        }
    }

    /**
     * Manipula keydown (Tab, Ctrl+S)
     */
    handleKeydown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveFile();
        }
    }

    /**
     * Mudança no código
     */
    onCodeChange() {
        if (this.previewMode !== 'off') {
            this.updatePreview();
        }
    }
}

// Inicializa módulo global
const editorModule = new EditorModule(supabaseClient, authModule, projectsModule);

console.log('✓ Editor Module carregado');
