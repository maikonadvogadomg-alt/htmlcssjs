// ============================================
// SUPABASE CLIENT - Conexão com Supabase
// Módulo: ISOLADO ✓
// ============================================

class SupabaseClient {
    constructor(url, anonKey) {
        this.url = url;
        this.anonKey = anonKey;
        this.client = null;
        this.session = null;
        this.user = null;
        this.initialized = false;
        this.initialize();
    }

    /**
     * Inicializa cliente Supabase
     */
    async initialize() {
        try {
            // Carrega biblioteca Supabase do CDN
            if (!window.supabase) {
                console.warn('⚠️ Supabase não carregado. Adicionando script...');
                await this.loadSupabaseScript();
            }

            const { createClient } = window.supabase;
            this.client = createClient(this.url, this.anonKey);

            // Verifica sessão existente
            const { data: { session } } = await this.client.auth.getSession();
            this.session = session;
            this.user = session?.user || null;

            this.initialized = true;
            console.log('✓ Supabase conectado');

            // Dispara evento de inicialização
            window.dispatchEvent(new CustomEvent('supabase-ready'));

            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar Supabase:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Carrega script Supabase do CDN
     */
    loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Falha ao carregar Supabase'));
            document.head.appendChild(script);
        });
    }

    /**
     * Faz login
     */
    async login(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.session = data.session;
            this.user = data.user;
            return data.user;
        } catch (error) {
            console.error('❌ Erro no login:', error);
            throw error;
        }
    }

    /**
     * Faz signup
     */
    async signup(email, password, fullName) {
        try {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) throw error;

            return data.user;
        } catch (error) {
            console.error('❌ Erro no signup:', error);
            throw error;
        }
    }

    /**
     * Faz logout
     */
    async logout() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;

            this.session = null;
            this.user = null;
            return true;
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            throw error;
        }
    }

    /**
     * Verifica se está autenticado
     */
    isAuthenticated() {
        return !!this.user;
    }

    /**
     * SELECT - Busca dados
     */
    async select(table, filters = null) {
        try {
            let query = this.client.from(table).select('*');

            if (filters) {
                for (const [key, value] of Object.entries(filters)) {
                    query = query.eq(key, value);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error(`❌ Erro ao buscar ${table}:`, error);
            throw error;
        }
    }

    /**
     * INSERT - Insere dados
     */
    async insert(table, data) {
        try {
            const { data: result, error } = await this.client
                .from(table)
                .insert([data])
                .select();

            if (error) throw error;
            return result?.[0] || null;
        } catch (error) {
            console.error(`❌ Erro ao inserir em ${table}:`, error);
            throw error;
        }
    }

    /**
     * UPDATE - Atualiza dados
     */
    async update(table, data, filters) {
        try {
            let query = this.client.from(table).update(data);

            if (filters) {
                for (const [key, value] of Object.entries(filters)) {
                    query = query.eq(key, value);
                }
            }

            const { data: result, error } = await query.select();
            if (error) throw error;
            return result || [];
        } catch (error) {
            console.error(`❌ Erro ao atualizar ${table}:`, error);
            throw error;
        }
    }

    /**
     * DELETE - Deleta dados
     */
    async delete(table, filters) {
        try {
            let query = this.client.from(table).delete();

            if (filters) {
                for (const [key, value] of Object.entries(filters)) {
                    query = query.eq(key, value);
                }
            }

            const { error } = await query;
            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`❌ Erro ao deletar de ${table}:`, error);
            throw error;
        }
    }

    /**
     * Escuta mudanças em tempo real
     */
    subscribe(table, callback) {
        try {
            const subscription = this.client
                .channel(`public:${table}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: table },
                    (payload) => callback(payload)
                )
                .subscribe();

            return subscription;
        } catch (error) {
            console.error('❌ Erro ao se inscrever:', error);
            throw error;
        }
    }
}

// Variáveis de ambiente (adicione ao .env)
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-aqui';

// Inicializa cliente global
const supabaseClient = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✓ Supabase Client carregado');
