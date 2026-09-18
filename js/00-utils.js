// ============================================
// UTILS - Funções Utilitárias
// ============================================

/**
 * querySelector simplificado
 */
function qs(selector) {
  return document.querySelector(selector);
}

/**
 * querySelectorAll simplificado (retorna array)
 */
function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

/**
 * Mostra toast (notificação)
 */
function toast(message, type = 'success') {
  const container = qs('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Alterna tema (dark/light)
 */
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');

  if (isDark) {
    html.classList.remove('dark');
    html.classList.add('light');
    localStorage.setItem('theme', 'light');
  } else {
    html.classList.add('dark');
    html.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  }
}

/**
 * Inicializa tema salvo
 */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.add(saved);
}

/**
 * Alterna sidebar (mobile)
 */
function toggleSidebar() {
  const sidebar = qs('.sidebar');
  sidebar.classList.toggle('hidden');
}

/**
 * Mostra menu do usuário
 */
function showUserMenu() {
  toast('Menu do usuário', 'success');
}

/**
 * Navega para página
 */
function navigateTo(page) {
  // Remove ativo de todos
  qsa('.nav-item').forEach(item => item.classList.remove('active'));

  // Marca como ativo
  qs(`[data-page="${page}"]`).classList.add('active');

  // Carrega página
  console.log(`Navegando para: ${page}`);

  // Aqui você chamaria os módulos específicos
  if (page === 'projects' && window.projectsModule) {
    projectsModule.render();
  }
}

// Inicializa ao carregar
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Event listeners de navegação
  qsa('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
});

console.log('✓ Utils carregado');
