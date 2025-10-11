document.addEventListener("DOMContentLoaded", () => {
  // Highlight active sidebar links
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll(".sidebar .nav-link, #mobileSidebar .nav-link");

  links.forEach(link => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
 
  // Single settings button and card for both desktop & mobile
  const settingsBtns = document.querySelectorAll("#settingsBtn");
  const settingsCard = document.getElementById("settingsCard");
  let currentBtn = null;

  if (settingsBtns.length > 0 && settingsCard) {
    // Initial style for animation
    settingsCard.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    settingsCard.style.transformOrigin = "bottom center";
    settingsCard.style.opacity = 0;

    const toggleSettingsCard = (btn) => {
      const rect = btn.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Position the card above the button
      settingsCard.style.left = `${rect.left + rect.width / 2}px`;
      settingsCard.style.bottom = `calc(100vh - ${rect.top + scrollTop}px + 10px)`;
      settingsCard.style.transform = "translateX(-50%) scale(1)";
      settingsCard.style.display = "block";

      // Animate
      setTimeout(() => {
        settingsCard.style.opacity = 1;
      }, 10);
    };

    settingsBtns.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();


        if (settingsCard.style.display === "block") {
          // Hide with animation
          settingsCard.style.opacity = 0;
          setTimeout(() => settingsCard.style.display = "none", 200);
          currentBtn = null;
        } else {
          currentBtn = btn;
          toggleSettingsCard(btn);
        }
      }, {capture: true});
    });

    // Prevent card click from closing
    settingsCard.addEventListener("click", e => e.stopPropagation());

    // Close card when clicking outside
    document.addEventListener("click", () => {
      if (settingsCard.style.display === "block") {
        settingsCard.style.opacity = 0;
        setTimeout(() => settingsCard.style.display = "none", 200);
      }
    });

    // Button actions inside the card
    ["themeBtn", "languageBtn", "logoutBtn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click",()=>{});
    });

    // Reposition on window resize if open
    window.addEventListener("resize", () => {
      if (settingsCard.style.display === "block" && currentBtn) toggleSettingsCard(currentBtn);
    });
  }
});
