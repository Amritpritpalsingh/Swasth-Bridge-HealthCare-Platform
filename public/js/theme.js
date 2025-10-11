document.addEventListener("DOMContentLoaded", () => {
  const themeButtons = document.querySelectorAll(".theme-option");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  // Apply theme function
  function applyTheme(theme) {
    document.body.classList.remove("dark-mode");

    if (theme === "dark" || (theme === "auto" && systemPrefersDark.matches)) {
      document.body.classList.add("dark-mode");
    }

    localStorage.setItem("theme", theme);
    updateThemeElements();
  }

  // Update tables (desktop and payments)
  function updateTables() {
    const isDark = document.body.classList.contains('dark-mode');

    // Desktop patient table
    const patientTable = document.getElementById('patientsTable');
    if (patientTable) patientTable.classList.toggle('dark-mode-card', isDark);

    // Payments table
    const paymentsTable = document.getElementById('paymentsTable');
    if (paymentsTable) paymentsTable.classList.toggle('dark-mode-card', isDark);

    // Mobile patient cards
    document.querySelectorAll('#patientsCardListBody .card').forEach(card => {
      card.classList.toggle('dark-mode-card', isDark);
    });
  }

  // Update mobile sidebar links for dark mode
  function updateMobileSidebarLinks() {
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.classList.toggle('text-white', isDark);
    });
  }

  // Update all theme-dependent elements
  function updateThemeElements() {
    const isDark = document.body.classList.contains('dark-mode');

    // Tables
    updateTables();

    // Mobile sidebar links
    updateMobileSidebarLinks();

    // Date badges
    document.querySelectorAll('.date-badge').forEach(el => {
      el.classList.toggle('badge-dark-mode', isDark);
    });

    // Cards, inner cards, doctor cards, feature buttons
    document.querySelectorAll('.section-card, .inner-card, .doctor-card, .feature-btn').forEach(el => {
      el.classList.toggle('dark-mode-card', isDark);
    });

    // Buttons
    document.querySelectorAll('.btn, .btn-outline-secondary, .btn-outline-primary').forEach(el => {
      el.classList.toggle('dark-mode-btn', isDark);
    });

    // Topbar
    document.querySelectorAll('.topbar').forEach(el => {
      el.classList.toggle('dark-mode-topbar', isDark);
    });

    // Modals
    document.querySelectorAll('.modal-content').forEach(el => {
      el.classList.toggle('dark-mode-card', isDark);
    });

    // Carousels
    document.querySelectorAll('.carousel-inner').forEach(el => {
      el.classList.toggle('dark-mode-card', isDark);
    });
  }

  // Initial theme setup
  const savedTheme = localStorage.getItem("theme") || "auto";
  applyTheme(savedTheme);

  // Listen for theme selection buttons
  themeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedTheme = btn.dataset.theme;
      applyTheme(selectedTheme);
    });
  });

  // React to system theme change (when on Auto)
  systemPrefersDark.addEventListener("change", () => {
    if (localStorage.getItem("theme") === "auto") {
      applyTheme("auto");
    }
  });
});
