// ============================================
// AUTH MODULE - Gerenciamento de Autenticação
// Módulo: ISOLADO ✓
// ============================================

class AuthModule {
    constructor(supabaseClient) {
        this.client = supabaseClient;
        this.currentUser = null;
        this.isLoading = false;
    }

    /**
     * Inicializa módulo
     */
    async initialize() {
        // Aguarda Supabase estar pronto
        if (!this.client.initialized) {
            await new Promise(resolve => {
                window.addEventListener('supabase-ready', resolve, { once: true });
            });
        }

        // Verifica se já está logado
        if (this.client.isAuthenticated()) {
            this.currentUser = this.client.user;
            this.renderDashboard();
        } else {
            this.renderLoginPage();
        }
    }

    /**
     * Renderiza página de login
     */
    renderLoginPage() {
        const html = `
            <div class="auth-page">
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-header">
                            <div class="auth-logo">⚖️</div>
                            <h1>Iara Suite</h1>
                            <p>Editor Jurídico com IA</p>
                        </div>

                        <div class="auth-tabs">
                            <button class="auth-tab active" onclick="authModule.switchTab('login')">
                                Entrar
                            </button>
                            <button class="auth-tab" onclick="authModule.switchTab('signup')">
                                Criar Conta
                            </button>
                        </div>

                        <!-- TAB: LOGIN -->
                        <form id="login-form" class="auth-form active">
                            <div class="form-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    id="login-email" 
                                    class="input"
                                    placeholder="seu@email.com" 
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label>Senha</label>
                                <input 
                                    type="password" 
                                    id="login-password" 
                                    class="input"
                                    placeholder="••••••••" 
                                    required
                                >
                            </div>

                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                Entrar
                            </button>
                        </form>

                        <!-- TAB: SIGNUP -->
                        <form id="signup-form" class="auth-form">
                            <div class="form-group">
                                <label>Nome Completo</label>
                                <input 
                                    type="text" 
                                    id="signup-name" 
                                    class="input"
                                    placeholder="Seu Nome" 
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    id="signup-email" 
                                    class="input"
                                    placeholder="seu@email.com" 
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label>Senha</label>
                                <input 
                                    type="password" 
                                    id="signup-password" 
                                    class="input"
                                    placeholder="••••••••" 
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label>OAB (opcional)</label>
                                <input 
                                    type="text" 
                                    id="signup-oab" 
                                    class="input"
                                    placeholder="OAB/MG 123456"
                                >
                            </div>

                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                Criar Conta
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        qs('#pages-container').innerHTML = html;

        // Event listeners
        qs('#login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = qs('#login-email').value;
            const password = qs('#login-password').value;
            this.login(email, password);
        });

        qs('#signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = qs('#signup-email').value;
            const password = qs('#signup-password').value;
            const fullName = qs('#signup-name').value;
            this.signup(email, password, fullName);
        });
    }

    /**
     * Alterna entre abas (login/signup)
     */
    switchTab(tab) {
        qsa('.auth-tab').forEach(t => t.classList.remove('active'));
        qsa('.auth-form').forEach(f => f.classList.remove('active'));

        qs(`[onclick*="'${tab}'"]`).classList.add('active');
        qs(`#${tab}-form`).classList.add('active');
    }

    /**
     * Faz login
     */
    async login(email, password) {
        try {
            this.isLoading = true;
            const user = await this.client.login(email, password);
            this.currentUser = user;
            toast('✅ Login realizado!', 'success');
            this.renderDashboard();
        } catch (error) {
            toast(`❌ ${error.message}`, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Faz signup
     */
    async signup(email, password, fullName) {
        try {
            this.isLoading = true;
            await this.client.signup(email, password, fullName);
            toast('✅ Cadastro realizado! Faça login.', 'success');
            this.switchTab('login');
        } catch (error) {
            toast(`❌ ${error.message}`, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Faz logout
     */
    async logout() {
        try {
            await this.client.logout();
            this.currentUser = null;
            toast('✅ Logout realizado!', 'success');
            this.renderLoginPage();
        } catch (error) {
            toast(`❌ ${error.message}`, 'error');
        }
    }

    /**
     * Renderiza dashboard (após login)
     */
    renderDashboard() {
        // Renderiza sidebar com usuário
        const sidebarHtml = `
            <div class="sidebar-user-info">
                <div class="user-avatar">👤</div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.user_metadata?.full_name || 'Usuário'}</div>
                    <div class="user-email">${this.currentUser.email}</div>
                </div>
            </div>
        `;

        // Atualiza sidebar
        const userSection = qs('.sidebar-user');
        if (userSection) {
            userSection.innerHTML = sidebarHtml;
        }

        // Carrega página inicial (projetos)
        if (window.projectsModule) {
            projectsModule.loadProjects();
        }
    }
}

// Inicializa módulo global
const authModule = new AuthModule(supabaseClient);

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    authModule.initialize();
});

console.log('✓ Auth Module carregado');
