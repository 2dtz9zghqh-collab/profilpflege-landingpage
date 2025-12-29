(function () {
  // Zentral anpassen
  const PHONE_TEL = "tel:+490000000000";
  const PHONE_TEXT = "+49 0000 000000";

  // Inject phone placeholders (optional helper)
  document.querySelectorAll("[data-phone-tel]").forEach((el) => {
    el.setAttribute("href", PHONE_TEL);
  });
  document.querySelectorAll("[data-phone-text]").forEach((el) => {
    el.textContent = PHONE_TEXT;
  });

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
      const target = e.target;
      if (!nav.classList.contains("open")) return;
      if (target === toggle) return;
      if (nav.contains(target)) return;
      closeNav();
    });

    window.addEventListener("resize", () => {
      // If breakpoint flips, ensure nav is closed
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

      // Native validation first
      if (!form.reportValidity()) return;

      const data = new FormData(form);

      // Honeypot
      const gotcha = (data.get("_gotcha") || "").toString().trim();
      if (gotcha) return;

      const name = (data.get("name") || "").toString().trim();
      const company = (data.get("company") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const phone = (data.get("phone") || "").toString().trim();
      const url = (data.get("profile_url") || "").toString().trim();

      // Basic sanity
      if (!name || !company || !email || !url) {
        setStatus("Bitte die Pflichtfelder ausfüllen.");
        return;
      }

      // Subject
      data.set("_subject", `Kostenloser Check: ${company}`);

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
          setStatus(`Formular ist noch nicht verbunden (Formspree-ID fehlt). Alternativ: bitte kurz anrufen unter ${PHONE_TEXT}.`);
          return;
        }

        const res = await fetch(form.action, {
          method: (form.method || "POST").toUpperCase(),
          body: data,
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          form.reset();
          setStatus(
            phone
              ? "Danke! Anfrage ist raus. Ich melde mich per Rückruf oder E-Mail."
              : "Danke! Anfrage ist raus. Ich melde mich per E-Mail. Wenn es eilt: bitte kurz anrufen."
          );
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

  // Profil-Score widget (heuristisch)
  const els = {
    rating: document.getElementById("in_rating"),
    reviews: document.getElementById("in_reviews"),
    response: document.getElementById("in_response"),
    recency: document.getElementById("in_recency"),
    complete: document.getElementById("in_complete"),

    vResponse: document.getElementById("v_response"),
    vRecency: document.getElementById("v_recency"),
    vComplete: document.getElementById("v_complete"),

    outScore: document.getElementById("out_score"),
    outScoreBig: document.getElementById("out_score_big"),
    outDesc: document.getElementById("out_desc"),
    outTrust: document.getElementById("out_trust"),
    outAct: document.getElementById("out_act"),
    outProf: document.getElementById("out_prof"),
    outTodos: document.getElementById("out_todos"),

    segTrust: document.getElementById("seg_trust"),
    segAct: document.getElementById("seg_act"),
    segProf: document.getElementById("seg_prof"),
  };

  const hasScoreWidget = !!(els.rating && els.reviews && els.response && els.recency && els.complete);
  if (!hasScoreWidget) return;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  // Map input to 0..1
  function ratingScore(r) { return clamp((r - 3.8) / (4.7 - 3.8), 0, 1); }
  function volumeScore(n) {
    const max = 200;
    const v = Math.log10(n + 1) / Math.log10(max + 1);
    return clamp(v, 0, 1);
  }
  function responseScore(p) { return clamp(p / 100, 0, 1); }
  function recencyScore(weeks) { return clamp(Math.exp(-weeks / 12), 0, 1); }
  function completenessScore(p) { return clamp(p / 100, 0, 1); }

  function describe(score) {
    if (score >= 85) return "Sehr stark. Das Profil wirkt aktiv, vertrauenswürdig und komplett.";
    if (score >= 70) return "Solider Eindruck. Mit mehr Kontinuität und Antworten ist schnell mehr drin.";
    if (score >= 50) return "Okay, aber ausbaufähig. Schon kleine Routinen können spürbar helfen.";
    return "Viel Potenzial. Starten Sie mit Antworten, Aktualität und Basisdaten.";
  }

  function buildTodos(inputs) {
    const t = [];
    const { rating, reviews, response, recency, complete } = inputs;

    if (response < 80) t.push("Antwortquote erhöhen: auch kurze, freundliche Antworten zählen.");
    if (recency > 8) t.push("Bewertungen regelmäßiger anstoßen: einfacher Link oder QR-Code nach Termin.");
    if (complete < 75) t.push("Profil vervollständigen: Leistungen, Kategorien, Öffnungszeiten, Inhalte.");
    if (reviews < 20) t.push("Mehr Social Proof: ein klarer Review-Flow nach abgeschlossenen Aufträgen.");
    if (rating < 4.3) t.push("Qualitätsfeedback intern sammeln und wiederkehrende Ursachen abstellen.");

    if (!t.length) t.push("Weiter so: Routine halten und auf neue Reviews zeitnah reagieren.");
    return t;
  }

  function setDonutSegments(trust, act, prof) {
    const r = 46;
    const C = 2 * Math.PI * r;
    const total = Math.max(1, trust + act + prof);

    const fTrust = trust / total;
    const fAct = act / total;
    const fProf = prof / total;

    const dashTrust = C * fTrust;
    const dashAct = C * fAct;
    const dashProf = C * fProf;

    const offTrust = 0;
    const offAct = -dashTrust;
    const offProf = -(dashTrust + dashAct);

    function apply(seg, dash, off) {
      if (!seg) return;
      seg.setAttribute("stroke-dasharray", `${dash} ${C - dash}`);
      seg.setAttribute("stroke-dashoffset", String(off));
    }

    apply(els.segTrust, dashTrust, offTrust);
    apply(els.segAct, dashAct, offAct);
    apply(els.segProf, dashProf, offProf);

    // Visual differentiation without introducing new accent colors
    if (els.segTrust) els.segTrust.style.opacity = "0.95";
    if (els.segAct) els.segAct.style.opacity = "0.72";
    if (els.segProf) els.segProf.style.opacity = "0.52";
  }

  function render() {
    const rating = clamp(parseFloat(els.rating.value || "0"), 1, 5);
    const reviews = clamp(parseInt(els.reviews.value || "0", 10), 0, 5000);
    const response = clamp(parseInt(els.response.value || "0", 10), 0, 100);
    const recency = clamp(parseInt(els.recency.value || "0", 10), 0, 52);
    const complete = clamp(parseInt(els.complete.value || "0", 10), 0, 100);

    if (els.vResponse) els.vResponse.textContent = String(response);
    if (els.vRecency) els.vRecency.textContent = String(recency);
    if (els.vComplete) els.vComplete.textContent = String(complete);

    const trust = Math.round(100 * (0.62 * ratingScore(rating) + 0.38 * volumeScore(reviews)));
    const act = Math.round(100 * (0.60 * responseScore(response) + 0.40 * recencyScore(recency)));
    const prof = Math.round(100 * completenessScore(complete));
    const score = Math.round(0.45 * trust + 0.35 * act + 0.20 * prof);

    if (els.outTrust) els.outTrust.textContent = String(trust);
    if (els.outAct) els.outAct.textContent = String(act);
    if (els.outProf) els.outProf.textContent = String(prof);

    if (els.outScore) els.outScore.textContent = String(score);
    if (els.outScoreBig) els.outScoreBig.textContent = String(score);
    if (els.outDesc) els.outDesc.textContent = describe(score);

    setDonutSegments(trust, act, prof);

    if (els.outTodos) {
      els.outTodos.innerHTML = "";
      const items = buildTodos({ rating, reviews, response, recency, complete });
      items.forEach((txt) => {
        const li = document.createElement("li");
        li.textContent = txt;
        els.outTodos.appendChild(li);
      });
    }
  }

  [els.rating, els.reviews, els.response, els.recency, els.complete].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  render();
})();
