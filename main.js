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

    nav.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.tagName === "A") closeNav();
    });

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
      if (company) data.set("_subject", `Kostenloser Check: ${company}`);

      setStatus("Sende …");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.prevText = submitBtn.textContent || "";
        submitBtn.textContent = "Wird gesendet …";
      }

      try {
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

  // Profil-Score (optional, clientseitig)
  const scoreFill = document.getElementById("score-fill");
  const scoreNumber = document.getElementById("score-number");
  const scoreBadge = document.getElementById("score-badge");
  const scoreTips = document.getElementById("score-tips");

  const fReplies = document.getElementById("score-replies");
  const fFreshness = document.getElementById("score-freshness");
  const fCompleteness = document.getElementById("score-completeness");
  const fContent = document.getElementById("score-content");
  const fFlow = document.getElementById("score-flow");

  function toNum(el) {
    if (!el) return 0;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : 0;
  }

  function updateScore() {
    if (!scoreFill || !scoreNumber || !scoreBadge || !scoreTips) return;

    const replies = toNum(fReplies);            // max 30
    const freshness = toNum(fFreshness);        // max 24
    const completeness = toNum(fCompleteness);  // max 18
    const content = toNum(fContent);            // max 14
    const flow = toNum(fFlow);                  // max 14

    let score = replies + freshness + completeness + content + flow;
    score = Math.max(0, Math.min(100, score));

    scoreFill.style.width = `${score}%`;
    scoreNumber.textContent = String(score);
    scoreBadge.textContent = `Score: ${score}/100`;

    const tips = [];
    if (replies <= 10) tips.push("Antworten standardisieren: ruhige Vorlagen je Fall (Lob, neutral, Kritik).");
    if (freshness <= 8) tips.push("Aktualität fixen: Öffnungszeiten, Leistungen, Kontaktwege konsequent korrekt halten.");
    if (completeness <= 6) tips.push("Profil vervollständigen: Kategorien, Leistungen, Attribute, kurze Service-Texte.");
    if (content <= 5) tips.push("Sichtbare Aktivität: regelmäßige, neutrale Fotos oder Updates.");
    if (flow === 0) tips.push("Review-Flow einführen: Link/QR nach Termin oder Kauf, freundlich und regelkonform.");

    if (tips.length === 0) {
      tips.push("Sie sind gut aufgestellt. Nächster Hebel: Konsistenz und Reaktionsgeschwindigkeit als Routine.");
    }

    scoreTips.innerHTML = "";
    tips.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      scoreTips.appendChild(li);
    });
  }

  [fReplies, fFreshness, fCompleteness, fContent, fFlow].forEach((el) => {
    if (el) el.addEventListener("change", updateScore);
  });

  // Defaults + initial
  if (fReplies) fReplies.value = "20";
  if (fFreshness) fFreshness.value = "16";
  if (fCompleteness) fCompleteness.value = "12";
  if (fContent) fContent.value = "5";
  if (fFlow) fFlow.value = "6";
  updateScore();
})();