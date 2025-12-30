// ProfilWerk JavaScript
// Handles form validation and mobile CTA behaviour
document.addEventListener('DOMContentLoaded', function () {
  // Contact form validation
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let hasError = false;

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const nameError = document.getElementById('name-error');
      const emailError = document.getElementById('email-error');

      // Reset errors
      nameError.textContent = '';
      emailError.textContent = '';

      // Name validation
      if (!nameInput.value.trim()) {
        nameError.textContent = 'Bitte geben Sie Ihren Namen ein.';
        hasError = true;
      }

      // Email validation (simple regex)
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim()) {
        emailError.textContent = 'Bitte geben Sie Ihre E-Mail ein.';
        hasError = true;
      } else if (!emailPattern.test(emailInput.value.trim())) {
        emailError.textContent = 'Bitte geben Sie eine gültige E-Mail ein.';
        hasError = true;
      }

      if (!hasError) {
        // In real implementation, send data to server here.
        // For demo purposes, just show a thank you message.
        alert('Vielen Dank! Ihre Anfrage wurde gesendet.');
        form.reset();
      }
    });
  }

  // Mobile sticky CTA hide when contact section in view
  const mobileCTA = document.getElementById('mobile-cta');
  const contactSection = document.getElementById('kontakt');
  if (mobileCTA && contactSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          mobileCTA.style.display = 'none';
        } else {
          mobileCTA.style.display = 'flex';
        }
      });
    }, { root: null, threshold: 0 });
    observer.observe(contactSection);
  }
});