// ============================================
// PLAYGROUND MODULE - Playground de Código
// Módulo: ISOLADO ✓
// ============================================

class PlaygroundModule {
    constructor(supabaseClient, authModule) {
        this.client = supabaseClient;
        this.auth = authModule;
        this.code = `// Bem-vindo ao Playground!
console.log('Olá, mundo!');

// Escreva seu código JavaScript aqui
const resultado = 2 + 2;
console.log('2 + 2 =', resultado);`;
        this.output = '';
        this.isRunning = false;
    }

    /**
     * Renderiza página do playground
     */
    render() {
        const html = `
            <div class="playground-page">
                <div class="playground-header">
                    <h2>▶️ Playground JavaScript</h2>
                    <div class="playground-actions">
                        <button class="btn btn-primary" onclick="playgroundModule.runCode()">
                            ▶️ Executar
                        </button>
                        <button class="btn btn-secondary" onclick="playgroundModule.clearCode()">
                            🗑️ Limpar
                        </button>
                    </div>
                </div>

                <div class="playground-container">
                    <!-- EDITOR DE CÓDIGO -->
                    <div class="playground-editor">
                        <div class="editor-label">📝 Código</div>
                        <textarea 
                            id="playground-code" 
                            class="code-textarea"
                            onkeydown="playgroundModule.handleKeydown(event)"
                        >${this.code}</textarea>
                    </div>

                    <!-- OUTPUT -->
                    <div class="playground-output">
                        <div class="output-label">📊 Output</div>
                        <div id="playground-output" class="output-content">
                            ${this.output ? `<pre>${this.escapeHtml(this.output)}</pre>` : '<p class="output-empty">Execute o código para ver o resultado...</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        qs('#pages-container').innerHTML = html;
    }

    /**
     * Executa código
     */
    runCode() {
        try {
            this.isRunning = true;
            const code = qs('#playground-code').value;
            this.code = code;

            // Captura console.log
            const logs = [];
            const originalLog = console.log;
            console.log = (...args) => {
                logs.push(args.map(arg => {
                    if (typeof arg === 'object') {
                        return JSON.stringify(arg, null, 2);
                    }
                    return String(arg);
                }).join(' '));
            };

            try {
                // Executa código
                eval(code);
                this.output = logs.length > 0 ? logs.join('\n') : '(sem output)';
            } catch (error) {
                this.output = `❌ Erro: ${error.message}`;
            } finally {
                console.log = originalLog;
            }

            this.render();
            toast('✅ Código executado!', 'success');
        } catch (error) {
            toast('❌ Erro ao executar código', 'error');
            console.error(error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Limpa código
     */
    clearCode() {
        if (confirm('Tem certeza que deseja limpar o código?')) {
            this.code = '';
            this.output = '';
            this.render();
        }
    }

    /**
     * Manipula keydown (Ctrl+Enter para executar)
     */
    handleKeydown(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.runCode();
        }

        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
    }

    /**
     * Escapa HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializa módulo global
const playgroundModule = new PlaygroundModule(supabaseClient, authModule);

console.log('✓ Playground Module carregado');
