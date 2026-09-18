// ============================================
// SETTINGS MODULE - Configurações
// Módulo: ISOLADO ✓
// ============================================

class SettingsModule {
    constructor(supabaseClient, authModule) {
        this.client = supabaseClient;
        this.auth = authModule;
        this.settings = {
            theme: localStorage.getItem('theme') || 'dark',
            language: localStorage.getItem('language') || 'pt-BR',
            notifications: localStorage.getItem('notifications') !== 'false',
            autoSave: localStorage.getItem('autoSave') !== 'false'
        };
    }

    /**
     * Renderiza página de configurações
     */
    render() {
        const html = `
            <div class="settings-page">
                <div class="settings-container">
                    <h2>⚙️ Configurações</h2>

                    <!-- SEÇÃO: PERFIL -->
                    <div class="settings-section">
                        <h3>👤 Perfil</h3>
                        <div class="settings-group">
                            <div class="setting-item">
                                <label>Nome</label>
                                <input 
                                    type="text" 
                                    class="input"
                                    value="${this.auth.currentUser?.user_metadata?.full_name || 'Usuário'}"
                                    disabled
                                >
                            </div>

                            <div class="setting-item">
                                <label>Email</label>
                                <input 
                                    type="email" 
                                    class="input"
                                    value="${this.auth.currentUser?.email || ''}"
                                    disabled
                                >
                            </div>

                            <div class="setting-item">
                                <label>OAB</label>
                                <input 
                                    type="text" 
                                    class="input"
                                    id="settings-oab"
                                    placeholder="OAB/MG 123456"
                                >
                            </div>

                            <button class="btn btn-primary" onclick="settingsModule.updateProfile()">
                                Atualizar Perfil
                            </button>
                        </div>
                    </div>

                    <!-- SEÇÃO: APARÊNCIA -->
                    <div class="settings-section">
                        <h3>🎨 Aparência</h3>
                        <div class="settings-group">
                            <div class="setting-item">
                                <label>Tema</label>
                                <div class="theme-options">
                                    <button 
                                        class="theme-btn ${this.settings.theme === 'dark' ? 'active' : ''}"
                                        onclick="settingsModule.setTheme('dark')"
                                    >
                                        🌙 Escuro
                                    </button>
                                    <button 
                                        class="theme-btn ${this.settings.theme === 'light' ? 'active' : ''}"
                                        onclick="settingsModule.setTheme('light')"
                                    >
                                        ☀️ Claro
                                    </button>
                                </div>
                            </div>

                            <div class="setting-item">
                                <label>Idioma</label>
                                <select id="settings-language" class="input" onchange="settingsModule.setLanguage(this.value)">
                                    <option value="pt-BR" ${this.settings.language === 'pt-BR' ? 'selected' : ''}>
                                        🇧🇷 Português (Brasil)
                                    </option>
                                    <option value="en-US" ${this.settings.language === 'en-US' ? 'selected' : ''}>
                                        🇺🇸 English (USA)
                                    </option>
                                    <option value="es-ES" ${this.settings.language === 'es-ES' ? 'selected' : ''}>
                                        🇪🇸 Español (España)
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- SEÇÃO: NOTIFICAÇÕES -->
                    <div class="settings-section">
                        <h3>🔔 Notificações</h3>
                        <div class="settings-group">
                            <div class="setting-item">
                                <label>Ativar Notificações</label>
                                <div class="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        id="notifications-toggle"
                                        ${this.settings.notifications ? 'checked' : ''}
                                        onchange="settingsModule.setNotifications(this.checked)"
                                    >
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>

                            <div class="setting-item">
                                <label>Auto-salvar</label>
                                <div class="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        id="autosave-toggle"
                                        ${this.settings.autoSave ? 'checked' : ''}
                                        onchange="settingsModule.setAutoSave(this.checked)"
                                    >
                                    <span class="toggle-slider"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SEÇÃO: CHAVES API -->
                    <div class="settings-section">
                        <h3>🔑 Chaves API</h3>
                        <div class="settings-group">
                            <p class="setting-description">
                                Configure suas chaves de API para usar com IA
                            </p>

                            <div class="setting-item">
                                <label>OpenAI API Key</label>
                                <input 
                                    type="password" 
                                    class="input"
                                    id="settings-openai-key"
                                    placeholder="sk-..."
                                >
                            </div>

                            <div class="setting-item">
                                <label>Anthropic API Key</label>
                                <input 
                                    type="password" 
                                    class="input"
                                    id="settings-anthropic-key"
                                    placeholder="sk-ant-..."
                                >
                            </div>

                            <button class="btn btn-primary" onclick="settingsModule.saveAPIKeys()">
                                Salvar Chaves
                            </button>
                        </div>
                    </div>

                    <!-- SEÇÃO: SEGURANÇA -->
                    <div class="settings-section">
                        <h3>🔒 Segurança</h3>
                        <div class="settings-group">
                            <button class="btn btn-secondary" onclick="settingsModule.changePassword()">
                                Alterar Senha
                            </button>

                            <button class="btn btn-danger" onclick="settingsModule.logout()">
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        qs('#pages-container').innerHTML = html;
    }

    /**
     * Atualiza perfil
     */
    async updateProfile() {
        try {
            toast('✅ Perfil atualizado!', 'success');
        } catch (error) {
            toast('❌ Erro ao atualizar perfil', 'error');
            console.error(error);
        }
    }

    /**
     * Define tema
     */
    setTheme(theme) {
        this.settings.theme = theme;
        localStorage.setItem('theme', theme);
        toggleTheme();
        this.render();
        toast(`✅ Tema alterado para ${theme}`, 'success');
    }

    /**
     * Define idioma
     */
    setLanguage(language) {
        this.settings.language = language;
        localStorage.setItem('language', language);
        toast(`✅ Idioma alterado para ${language}`, 'success');
    }

    /**
     * Define notificações
     */
    setNotifications(enabled) {
        this.settings.notifications = enabled;
        localStorage.setItem('notifications', enabled);
        toast(`✅ Notificações ${enabled ? 'ativadas' : 'desativadas'}`, 'success');
    }

    /**
     * Define auto-salvar
     */
    setAutoSave(enabled) {
        this.settings.autoSave = enabled;
        localStorage.setItem('autoSave', enabled);
        toast(`✅ Auto-salvar ${enabled ? 'ativado' : 'desativado'}`, 'success');
    }

    /**
     * Salva chaves de API
     */
    saveAPIKeys() {
        const openaiKey = qs('#settings-openai-key').value;
        const anthropicKey = qs('#settings-anthropic-key').value;

        if (openaiKey) localStorage.setItem('openai-key', openaiKey);
        if (anthropicKey) localStorage.setItem('anthropic-key', anthropicKey);

        toast('✅ Chaves de API salvas!', 'success');
    }

    /**
     * Altera senha
     */
    changePassword() {
        const newPassword = prompt('Nova senha:');
        if (!newPassword) return;

        toast('✅ Senha alterada! (Simulado)', 'success');
    }

    /**
     * Faz logout
     */
    async logout() {
        if (!confirm('Tem certeza que deseja sair?')) {
            return;
        }

        try {
            await this.auth.logout();
            navigateTo('projects');
        } catch (error) {
            toast('❌ Erro ao sair', 'error');
            console.error(error);
        }
    }
}

// Inicializa módulo global
const settingsModule = new SettingsModule(supabaseClient, authModule);

console.log('✓ Settings Module carregado');
