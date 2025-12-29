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

  // Profil-Score Vorschau (optional, clientseitig)
  const elRating = document.getElementById("in_rating");
  const elReviews = document.getElementById("in_reviews");
  const elResponse = document.getElementById("in_response");
  const elRecency = document.getElementById("in_recency");
  const elComplete = document.getElementById("in_complete");

  const vResponse = document.getElementById("v_response");
  const vRecency = document.getElementById("v_recency");
  const vComplete = document.getElementById("v_complete");

  const outScore = document.getElementById("out_score");
  const outBar = document.getElementById("out_bar");
  const outLabel = document.getElementById("out_label");

  const outTrust = document.getElementById("out_trust");
  const outAct = document.getElementById("out_act");
  const outProf = document.getElementById("out_prof");

  const barTrust = document.getElementById("bar_trust");
  const barAct = document.getElementById("bar_act");
  const barProf = document.getElementById("bar_prof");

  const tipsList = document.getElementById("score_tips");

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function num(el, fallback) {
    if (!el) return fallback;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : fallback;
  }

  function scoreLabel(score) {
    if (score >= 85) return "sehr stark";
    if (score >= 70) return "solide Basis";
    if (score >= 55) return "ausbaufähig";
    return "klarer Hebel";
  }

  function calcLogScore(x, maxX, maxScore) {
    // Log-Skalierung, damit kleine Zahlen nicht komplett untergehen.
    const v = clamp(x, 0, maxX);
    const s = Math.log10(v + 1) / Math.log10(maxX + 1);
    return clamp(s * maxScore, 0, maxScore);
  }

  function renderTips({ rating, reviews, response, recency, complete, total }) {
    if (!tipsList) return;

    const tips = [];

    if (response < 50) tips.push("Antwortquote erhöhen: auch kurze Reviews ruhig und freundlich beantworten.");
    if (recency > 12) tips.push("Aktivität sichtbar machen: Review-Flow starten, damit regelmäßig echte Bewertungen reinkommen.");
    if (complete < 70) tips.push("Profil vervollständigen: Leistungen, Kategorien, Attribute und Kontaktwege sauber pflegen.");
    if (rating < 4.2) tips.push("Kritik souverän bearbeiten: Standard-Antworten + Eskalationsweg zur Klärung definieren.");
    if (reviews < 30) tips.push("Mehr Social Proof: nach Termin oder Kauf freundlich um eine Bewertung bitten, ohne Druck.");

    if (!tips.length) tips.push("Gute Basis. Nächster Hebel: Konsistenz und Reaktionsgeschwindigkeit als Routine.");

    tipsList.innerHTML = "";
    tips.slice(0, 5).forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      tipsList.appendChild(li);
    });

    if (outLabel) outLabel.textContent = scoreLabel(total);
  }

  function updateScore() {
    if (!elRating || !elReviews || !elResponse || !elRecency || !elComplete) return;

    const rating = clamp(num(elRating, 4.4), 1, 5);
    const reviews = clamp(num(elReviews, 63), 0, 5000);
    const response = clamp(num(elResponse, 60), 0, 100);
    const recency = clamp(num(elRecency, 6), 0, 52); // Wochen
    const complete = clamp(num(elComplete, 70), 0, 100);

    if (vResponse) vResponse.textContent = String(Math.round(response));
    if (vRecency) vRecency.textContent = String(Math.round(recency));
    if (vComplete) vComplete.textContent = String(Math.round(complete));

    // Vertrauen (40): Sterne (max 22) + Antwortquote (max 18)
    const sStars = clamp(((rating - 1) / 4) * 22, 0, 22);
    const sResp = clamp((response / 100) * 18, 0, 18);
    const trust = clamp(sStars + sResp, 0, 40);

    // Aktivität (30): Review-Menge (max 16, log) + Frische (max 14)
    const sReviews = calcLogScore(reviews, 5000, 16);
    const sFresh = clamp((1 - recency / 52) * 14, 0, 14);
    const act = clamp(sReviews + sFresh, 0, 30);

    // Profilqualität (30): Vollständigkeit
    const prof = clamp((complete / 100) * 30, 0, 30);

    const total = Math.round(clamp(trust + act + prof, 0, 100));

    if (outScore) outScore.textContent = String(total);
    if (outBar) outBar.style.width = `${total}%`;

    if (outTrust) outTrust.textContent = String(Math.round(trust));
    if (outAct) outAct.textContent = String(Math.round(act));
    if (outProf) outProf.textContent = String(Math.round(prof));

    if (barTrust) barTrust.style.width = `${(trust / 40) * 100}%`;
    if (barAct) barAct.style.width = `${(act / 30) * 100}%`;
    if (barProf) barProf.style.width = `${(prof / 30) * 100}%`;

    renderTips({ rating, reviews, response, recency, complete, total });
  }

  [elRating, elReviews].forEach((el) => {
    if (el) el.addEventListener("input", updateScore);
  });
  [elResponse, elRecency, elComplete].forEach((el) => {
    if (el) el.addEventListener("input", updateScore);
  });

  updateScore();
})();
