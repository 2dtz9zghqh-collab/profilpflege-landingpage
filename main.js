(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const form = document.querySelector("#check-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const company = (data.get("company") || "").toString().trim();
    const gbp = (data.get("gbp") || "").toString().trim();
    const city = (data.get("city") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const note = (data.get("note") || "").toString().trim();

    if (!company || !gbp || !city || !email) {
      alert("Bitte die Pflichtfelder ausfüllen.");
      return;
    }

    const subject = encodeURIComponent(`3-Punkte-Check Anfrage: ${company}`);
    const bodyLines = [
      `Hallo Marcel,`,
      ``,
      `ich möchte den kostenlosen 3-Punkte-Check anfordern.`,
      ``,
      `Unternehmen: ${company}`,
      `Ort: ${city}`,
      `Google-Profil: ${gbp}`,
      `Kontakt-E-Mail: ${email}`,
      note ? `` : null,
      note ? `Hinweis: ${note}` : null,
      ``,
      `Viele Grüße`
    ].filter(Boolean);

    const body = encodeURIComponent(bodyLines.join("\n"));
    window.location.href = `mailto:info@profilpflege.de?subject=${subject}&body=${body}`;
  });
})();
