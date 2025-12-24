(function () {
  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Formspree "Profil-Check" form
  const form = document.querySelector("#check-form");
  if (form) {
    const status = document.getElementById("form-status");
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Browser validation (email/url etc.)
      if (!form.reportValidity()) return;

      // UI state
      if (status) status.textContent = "Sende …";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.prevText = submitBtn.textContent || "";
        submitBtn.textContent = "Wird gesendet …";
      }

      const data = new FormData(form);

      const company = (data.get("company") || "").toString().trim();
      const gbp = (data.get("gbp") || "").toString().trim();
      const city = (data.get("city") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();

      // Extra safety (should already be covered by reportValidity)
      if (!company || !gbp || !city || !email) {
        if (status) status.textContent = "Bitte die Pflichtfelder ausfüllen.";
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.prevText || "Check anfordern";
        }
        return;
      }

      // Betreff pro Firma dynamisch
      data.set("_subject", `3-Punkte-Check Anfrage: ${company}`);

      try {
        // Guard: action must be a real Formspree endpoint
        if (!form.action || form.action.includes("DEIN_FORM_ID")) {
          if (status) status.textContent = "Formular ist noch nicht verbunden (Formspree-ID fehlt im action-Attribut).";
          return;
        }

        const res = await fetch(form.action, {
          method: (form.method || "POST").toUpperCase(),
          body: data,
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          form.reset();
          if (status) status.textContent = "Danke! Ihre Anfrage wurde gesendet. Ich melde mich per E-Mail.";
        } else {
          let msg = "Senden hat nicht geklappt. Bitte später erneut versuchen.";
          try {
            const json = await res.json();
            if (json && json.errors && json.errors.length) {
              msg = json.errors.map((x) => x.message).join(" ");
            }
          } catch (err) {
            // ignore json parse errors
          }
          if (status) status.textContent = msg;
        }
      } catch (err) {
        if (status) status.textContent = "Netzwerkfehler. Bitte später erneut versuchen.";
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.prevText || "Check anfordern";
        }
      }
    });
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

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  // Map input to 0..1
  function ratingScore(r) {
    // 3.8 is "ok", 4.7 is "sehr gut"
    return clamp((r - 3.8) / (4.7 - 3.8), 0, 1);
  }

  function volumeScore(n) {
    // log curve: 0..200 reviews are most "visible", above it flattens
    const max = 200;
    const v = Math.log10(n + 1) / Math.log10(max + 1);
    return clamp(v, 0, 1);
  }

  function responseScore(p) {
    return clamp(p / 100, 0, 1);
  }

  function recencyScore(weeks) {
    // decay: 0 weeks = 1, 12 weeks ~ 0.37, 24 weeks ~ 0.14
    return clamp(Math.exp(-weeks / 12), 0, 1);
  }

  function completenessScore(p) {
    return clamp(p / 100, 0, 1);
  }

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
    if (complete < 75) t.push("Profil vervollständigen: Leistungen, Kategorien, Öffnungszeiten, Fotos.");
    if (reviews < 20) t.push("Mehr Social Proof: ein klarer Review-Flow nach abgeschlossenen Aufträgen.");
    if (rating < 4.3) t.push("Qualitätsfeedback intern sammeln und wiederkehrende Ursachen abstellen.");

    if (!t.length) t.push("Weiter so: Routine halten und auf neue Reviews zeitnah reagieren.");
    return t;
  }

  function setDonutSegments(trust, act, prof) {
    // Show category proportions around the donut.
    // Each value is 0..100. We map them to circumference fractions.
    const r = 46;
    const C = 2 * Math.PI * r;

    const total = Math.max(1, trust + act + prof);
    const fTrust = trust / total;
    const fAct = act / total;
    const fProf = prof / total;

    const dashTrust = C * fTrust;
    const dashAct = C * fAct;
    const dashProf = C * fProf;

    // Offsets are cumulative
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

  // Update on input
  [els.rating, els.reviews, els.response, els.recency, els.complete].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  render();
})();
