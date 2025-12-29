(function () {
  // Zentral anpassen
  const PHONE_TEL = "tel:+490000000000";
  const PHONE_TEXT = "+49 0000 000000";

  // Phone placeholders
  document.querySelectorAll("[data-phone-tel]").forEach((el) => el.setAttribute("href", PHONE_TEL));
  document.querySelectorAll("[data-phone-text]").forEach((el) => (el.textContent = PHONE_TEXT));

  // Header compact on scroll
  const header = document.getElementById("site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  function closeNav() {
    if (!toggle || !nav) return;
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menü";
    document.body.classList.remove("nav-open");
  }

  function openNav() {
    if (!toggle || !nav) return;
    nav.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "Schließen";
    document.body.classList.add("nav-open");
    const firstLink = nav.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.contains("open");
      if (isOpen) closeNav();
      else openNav();
    });

    // Close on link click
    nav.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.tagName === "A") closeNav();
    });

    // Close on ESC / outside click
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("open")) return;
      const target = e.target;
      if (target === toggle) return;
      if (nav.contains(target)) return;
      closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeNav();
    });
  }

  // Lead form (Formspree)
  const form = document.getElementById("lead-form");
  if (form) {
    const status = document.getElementById("form-status");
    const submitBtn = form.querySelector('button[type="submit"]');

    function setStatus(text) {
      if (status) status.textContent = text;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!form.reportValidity()) return;

      const data = new FormData(form);

      // Honeypot
      const gotcha = (data.get("_gotcha") || "").toString().trim();
      if (gotcha) return;

      const company = (data.get("company") || "").toString().trim();

      // Subject
      if (company) data.set("_subject", `Kostenloser Check: ${company}`);

      // UI state
      setStatus("Sende …");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.prevText = submitBtn.textContent || "";
        submitBtn.textContent = "Wird gesendet …";
      }

      try {
        // Guard: action must be a real endpoint
        if (!form.action || form.action.includes("DEIN_FORM_ID")) {
          setStatus(`Formular ist noch nicht verbunden (Formspree-ID fehlt). Alternativ: bitte anrufen unter ${PHONE_TEXT}.`);
          return;
        }

        const res = await fetch(form.action, {
          method: (form.method || "POST").toUpperCase(),
          body: data,
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          form.reset();
          setStatus("Danke! Anfrage ist raus. Wenn es eilt: bitte kurz anrufen.");
        } else {
          let msg = "Senden hat nicht geklappt. Bitte später erneut versuchen oder kurz anrufen.";
          try {
            const json = await res.json();
            if (json && json.errors && json.errors.length) {
              msg = json.errors.map((x) => x.message).join(" ");
            }
          } catch (_) {}
          setStatus(msg);
        }
      } catch (_) {
        setStatus("Netzwerkfehler. Bitte später erneut versuchen oder kurz anrufen.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.prevText || "Check anfordern";
        }
      }
    });

    if (status && !status.textContent.trim()) {
      setStatus(`Wenn Sie lieber sofort sprechen möchten: ${PHONE_TEXT}`);
    }
  }
})();
