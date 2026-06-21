/* ============================================
   Slide Engine v2 — Lean
   Navigation + facilitator notes only
   ============================================ */

class SlideEngine {
  constructor() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.currentIndex = 0;
    this.notesOpen = false;
    this.bindKeys();
    this.bindNavButtons();
    this.updateSlide();
  }

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      // Don't capture keys when typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight': case ' ': case 'PageDown':
          e.preventDefault(); this.next(); break;
        case 'ArrowLeft': case 'PageUp':
          e.preventDefault(); this.prev(); break;
        case 'f': case 'F':
          if (!e.ctrlKey && !e.metaKey) this.toggleFullscreen(); break;
        case 'n': case 'N':
          if (!e.ctrlKey && !e.metaKey) this.toggleNotes(); break;
        case '?':
          this.toggleHelp(); break;
        case 'Home':
          e.preventDefault(); this.goTo(0); break;
        case 'End':
          e.preventDefault(); this.goTo(this.slides.length - 1); break;
      }
    });
  }

  bindNavButtons() {
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());
  }

  next() { if (this.currentIndex < this.slides.length - 1) this.goTo(this.currentIndex + 1); }
  prev() { if (this.currentIndex > 0) this.goTo(this.currentIndex - 1); }

  goTo(index) {
    if (index < 0 || index >= this.slides.length) return;
    this.slides[this.currentIndex].classList.remove('active');
    this.currentIndex = index;
    this.slides[this.currentIndex].classList.add('active');
    this.updateSlide();
  }

  updateSlide() {
    const counter = document.getElementById('slide-counter');
    if (counter) counter.textContent = `${this.currentIndex + 1} / ${this.slides.length}`;

    const slide = this.slides[this.currentIndex];
    this.updateNotes(slide.dataset.notes);
  }

  updateNotes(notes) {
    const panel = document.getElementById('facilitator-notes');
    if (!panel) return;
    const content = panel.querySelector('.notes-content');
    if (notes) {
      content.innerHTML = `<p>${notes}</p>`;
    } else {
      content.innerHTML = '<p style="color:var(--grey-mid)">No notes for this slide.</p>';
    }
  }

  toggleNotes() {
    const panel = document.getElementById('facilitator-notes');
    this.notesOpen = !this.notesOpen;
    panel.classList.toggle('open', this.notesOpen);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  toggleHelp() {
    const overlay = document.getElementById('help-overlay');
    if (overlay) overlay.classList.toggle('hidden');
  }
}

// Help overlay
function createHelpOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'help-overlay';
  overlay.className = 'hidden';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(11,20,55,0.97);z-index:600;
    display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;
  `;
  overlay.innerHTML = `
    <h2 style="font-family:var(--font-heading);color:var(--amber);margin-bottom:1.5rem">⌨️ Shortcuts</h2>
    <table style="font-size:1rem;border-collapse:collapse">
      <tr><td style="padding:0.4rem 1rem;color:var(--amber);font-weight:700">→ / Space</td><td style="padding:0.4rem 1rem">Next slide</td></tr>
      <tr><td style="padding:0.4rem 1rem;color:var(--amber);font-weight:700">←</td><td style="padding:0.4rem 1rem">Previous slide</td></tr>
      <tr><td style="padding:0.4rem 1rem;color:var(--amber);font-weight:700">N</td><td style="padding:0.4rem 1rem">Facilitator notes</td></tr>
      <tr><td style="padding:0.4rem 1rem;color:var(--amber);font-weight:700">F</td><td style="padding:0.4rem 1rem">Fullscreen</td></tr>
      <tr><td style="padding:0.4rem 1rem;color:var(--amber);font-weight:700">?</td><td style="padding:0.4rem 1rem">This help</td></tr>
    </table>
    <p style="color:var(--grey-mid);font-size:0.8rem;margin-top:1rem">Press ? to close</p>
  `;
  document.body.appendChild(overlay);
}

document.addEventListener('DOMContentLoaded', () => {
  createHelpOverlay();
  window.engine = new SlideEngine();
});
