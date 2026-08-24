// ===== Sécurité + transition d'arrivée (tout en haut pour ne jamais bloquer la page) =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pageTransition = document.getElementById('pageTransition');

if (pageTransition && !reduceMotion) {
  // Arrivée : le panneau (déjà en position "couvre" via .js-loading) remonte
  // et disparaît. On agit de façon synchrone — pas de requestAnimationFrame,
  // qui est gelé dans les onglets en arrière-plan et laisserait la page rouge.
  pageTransition.classList.add('pt-reveal');
  document.documentElement.classList.remove('js-loading');
  setTimeout(() => pageTransition.classList.remove('pt-reveal'), 1150);
} else {
  // pas d'animation : ne jamais laisser le panneau couvrir la page
  document.documentElement.classList.remove('js-loading');
}

// Bouton "précédent/suivant" du navigateur : quand une page est restaurée
// depuis le cache (bfcache), elle peut revenir figée sur l'écran de transition
// rouge. On réinitialise toujours l'overlay pour ne jamais rester bloqué.
window.addEventListener('pageshow', (e) => {
  if (e.persisted && pageTransition) {
    pageTransition.classList.remove('pt-cover', 'pt-reveal');
    document.documentElement.classList.remove('js-loading');
  }
});

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// ===== Révélation progressive des éléments au défilement =====
const revealSelector = [
  '.section-kicker', '.section-title',
  '.about-photo', '.about-text',
  '.service-card', '.contact-card', '.charte-item',
  '.charte-intro', '.first-rdv-note', '.form-wrap',
  '.contact-cta',
  '.about-block-title', '.timeline-item', '.info-card'
].join(', ');

const revealEls = document.querySelectorAll(revealSelector);

if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
  revealEls.forEach((el) => {
    el.classList.add('reveal');
    // léger décalage en cascade pour les éléments d'une même rangée
    const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = (Math.max(0, idx % 3) * 0.12) + 's';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('visible');
        observer.unobserve(el);
        // Une fois révélé, on retire les classes/styles d'animation
        // pour ne pas bloquer les effets de survol (transform).
        setTimeout(() => {
          el.classList.remove('reveal', 'visible');
          el.style.transitionDelay = '';
        }, 1200);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el) => observer.observe(el));
}

// ===== Transition de départ : clic sur un lien vers une autre page =====
if (pageTransition && !reduceMotion) {
  document.querySelectorAll('a[href$=".html"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      pageTransition.classList.remove('pt-reveal');
      pageTransition.classList.add('pt-cover');
      setTimeout(() => { window.location.href = href; }, 560);
    });
  });
}

// ===== Formulaire de pré-bilan (envoi via Web3Forms) =====
const form = document.getElementById('prebilanForm');
if (form) {
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi en cours…';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      const data = await res.json();

      if (data.success) {
        form.style.display = 'none';
        if (status) {
          status.style.display = 'block';
          status.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        throw new Error(data.message || 'Échec de l’envoi');
      }
    } catch (err) {
      btn.disabled = false;
      btn.textContent = originalLabel;
      alert("Oups, l'envoi n'a pas fonctionné. Réessayez, ou écrivez-moi directement à canidesbycruz@gmail.com.");
    }
  });
}
