// ============================================
// CHAT MODULE - Chat com IA
// Módulo: ISOLADO ✓
// ============================================

class ChatModule {
    constructor(supabaseClient, authModule) {
        this.client = supabaseClient;
        this.auth = authModule;
        this.chats = [];
        this.currentChat = null;
        this.messages = [];
        this.aiSending = false;
        this.aiProviders = [];
    }

    /**
     * Carrega chats do usuário
     */
    async loadChats() {
        try {
            if (!this.auth.currentUser) return;

            const chats = await this.client.select('chats', {
                user_id: this.auth.currentUser.id
            });

            this.chats = chats || [];
            this.render();
        } catch (error) {
            toast('❌ Erro ao carregar chats', 'error');
            console.error(error);
        }
    }

    /**
     * Renderiza página de chat
     */
    render() {
        const html = `
            <div class="chat-page">
                <div class="chat-container">
                    <!-- SIDEBAR COM CHATS -->
                    <aside class="chat-sidebar">
                        <div class="sidebar-header">
                            <h3>💬 Chats</h3>
                            <button class="btn-icon" onclick="chatModule.showNewChatForm()">➕</button>
                        </div>

                        <div class="chats-list">
                            ${this.chats.length === 0 ? `
                                <div class="empty-chats">
                                    <p>Nenhum chat ainda</p>
                                </div>
                            ` : this.chats.map(c => `
                                <div class="chat-item ${this.currentChat?.id === c.id ? 'active' : ''}" 
                                     onclick="chatModule.selectChat('${c.id}')">
                                    <div class="chat-title">${c.title}</div>
                                    <div class="chat-date">${new Date(c.created_at).toLocaleDateString('pt-BR')}</div>
                                </div>
                            `).join('')}
                        </div>
                    </aside>

                    <!-- ÁREA DE CHAT -->
                    <div class="chat-main">
                        ${this.currentChat ? `
                            <div class="chat-header">
                                <h2>${this.currentChat.title}</h2>
                                <button class="btn-icon" onclick="chatModule.deleteChat('${this.currentChat.id}')">🗑️</button>
                            </div>

                            <div class="messages-container" id="messages-container">
                                ${this.messages.map(m => `
                                    <div class="message ${m.role}">
                                        <div class="message-avatar">
                                            ${m.role === 'user' ? '👤' : '🤖'}
                                        </div>
                                        <div class="message-content">
                                            ${this.escapeHtml(m.content)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="chat-input-area">
                                <form id="chat-form" onsubmit="chatModule.sendMessage(event)">
                                    <textarea 
                                        id="chat-input" 
                                        class="input"
                                        placeholder="Digite sua mensagem..."
                                        rows="3"
                                    ></textarea>
                                    <div class="input-actions">
                                        <button type="submit" class="btn btn-primary">
                                            Enviar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ` : `
                            <div class="empty-chat">
                                <div class="empty-icon">💬</div>
                                <h3>Selecione um chat</h3>
                                <p>ou crie um novo para começar</p>
                                <button class="btn btn-primary" onclick="chatModule.showNewChatForm()">
                                    ➕ Novo Chat
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        qs('#pages-container').innerHTML = html;

        // Scroll para o final
        setTimeout(() => {
            const container = qs('#messages-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 100);
    }

    /**
     * Mostra formulário de novo chat
     */
    showNewChatForm() {
        const title = prompt('Título do chat:');
        if (!title) return;

        this.createChat(title);
    }

    /**
     * Cria novo chat
     */
    async createChat(title) {
        try {
            const chat = await this.client.insert('chats', {
                user_id: this.auth.currentUser.id,
                title,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            this.chats.push(chat);
            this.currentChat = chat;
            this.messages = [];
            this.render();
            toast('✅ Chat criado!', 'success');
        } catch (error) {
            toast('❌ Erro ao criar chat', 'error');
            console.error(error);
        }
    }

    /**
     * Seleciona chat
     */
    async selectChat(chatId) {
        try {
            const chats = await this.client.select('chats', { id: chatId });
            this.currentChat = chats[0];

            // Carrega mensagens do chat
            const messages = await this.client.select('messages', {
                chat_id: chatId
            });

            this.messages = messages || [];
            this.render();
        } catch (error) {
            toast('❌ Erro ao carregar chat', 'error');
            console.error(error);
        }
    }

    /**
     * Deleta chat
     */
    async deleteChat(chatId) {
        if (!confirm('Tem certeza que deseja deletar este chat?')) {
            return;
        }

        try {
            await this.client.delete('chats', { id: chatId });
            this.chats = this.chats.filter(c => c.id !== chatId);
            this.currentChat = null;
            this.messages = [];
            this.render();
            toast('✅ Chat deletado!', 'success');
        } catch (error) {
            toast('❌ Erro ao deletar chat', 'error');
            console.error(error);
        }
    }

    /**
     * Envia mensagem
     */
    async sendMessage(event) {
        event.preventDefault();

        const input = qs('#chat-input');
        const content = input.value.trim();

        if (!content || !this.currentChat) return;

        try {
            // Adiciona mensagem do usuário
            const userMessage = await this.client.insert('messages', {
                chat_id: this.currentChat.id,
                user_id: this.auth.currentUser.id,
                content,
                role: 'user',
                created_at: new Date().toISOString()
            });

            this.messages.push(userMessage);
            input.value = '';
            this.render();

            // Simula resposta da IA (você integrará com API real depois)
            await this.getAIResponse(content);
        } catch (error) {
            toast('❌ Erro ao enviar mensagem', 'error');
            console.error(error);
        }
    }

    /**
     * Obtém resposta da IA (simulada)
     */
    async getAIResponse(userMessage) {
        try {
            this.aiSending = true;

            // Simula delay da IA
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Resposta simulada (você integrará com API real depois)
            const responses = [
                'Entendi sua pergunta. Como posso ajudar?',
                'Ótima observação! Deixe-me pensar sobre isso...',
                'Você tem razão. Vou analisar melhor.',
                'Interessante! Pode me dar mais detalhes?',
                'Perfeito! Vou levar isso em consideração.'
            ];

            const aiResponse = responses[Math.floor(Math.random() * responses.length)];

            const assistantMessage = await this.client.insert('messages', {
                chat_id: this.currentChat.id,
                user_id: this.auth.currentUser.id,
                content: aiResponse,
                role: 'assistant',
                created_at: new Date().toISOString()
            });

            this.messages.push(assistantMessage);
            this.render();
        } catch (error) {
            toast('❌ Erro ao obter resposta da IA', 'error');
            console.error(error);
        } finally {
            this.aiSending = false;
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
const chatModule = new ChatModule(supabaseClient, authModule);

console.log('✓ Chat Module carregado');
