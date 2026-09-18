// ============================================
// APP - Inicialização da Aplicação
// ============================================

/**
 * Aguarda elemento estar disponível
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const check = () => {
            const element = qs(selector);
            if (element) {
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Elemento ${selector} não encontrado`));
            } else {
                requestAnimationFrame(check);
            }
        };

        check();
    });
}

/**
 * Inicializa aplicação
 */
async function initializeApp() {
    console.log('🚀 Iniciando Iara Suite...');

    try {
        // 1. Aguarda Supabase estar pronto
        console.log('⏳ Conectando ao Supabase...');
        await new Promise(resolve => {
            if (supabaseClient.initialized) {
                resolve();
            } else {
                window.addEventListener('supabase-ready', resolve, { once: true });
            }
        });

        // 2. Inicializa Auth
        console.log('⏳ Inicializando autenticação...');
        await authModule.initialize();

        // 3. Se autenticado, carrega dados
        if (authModule.currentUser) {
            console.log('⏳ Carregando dados...');
            await projectsModule.loadProjects();
            await chatModule.loadChats();
        }

        // 4. Configura navegação
        console.log('⏳ Configurando navegação...');
        setupNavigation();

        // 5. Inicializa página padrão
        console.log('⏳ Carregando página inicial...');
        if (authModule.currentUser) {
            navigateTo('projects');
        }

        console.log('✅ Aplicação pronta!');
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        toast('❌ Erro ao inicializar aplicação', 'error');
    }
}

/**
 * Configura navegação
 */
function setupNavigation() {
    qsa('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
}

/**
 * Navega para página
 */
function navigateTo(page) {
    if (!authModule.currentUser && page !== 'login') {
        console.warn('Usuário não autenticado');
        return;
    }

    // Remove ativo de todos
    qsa('.nav-item').forEach(item => item.classList.remove('active'));

    // Marca como ativo
    const navItem = qs(`[data-page="${page}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    // Carrega página
    console.log(`📄 Navegando para: ${page}`);

    switch (page) {
        case 'projects':
            projectsModule.loadProjects();
            break;
        case 'chat':
            chatModule.loadChats();
            break;
        case 'playground':
            playgroundModule.render();
            break;
        case 'settings':
            settingsModule.render();
            break;
        default:
            console.warn(`Página desconhecida: ${page}`);
    }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Listener para mudanças de tema
window.addEventListener('themechange', () => {
    console.log('🎨 Tema alterado');
});

console.log('✓ App carregado');
