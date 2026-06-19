/* ============================================
   Slide Engine
   Keyboard navigation, slide transitions, 
   check-strip management, facilitator notes
   ============================================ */

class SlideEngine {
  constructor() {
    this.slides = [];
    this.currentIndex = 0;
    this.checksState = [false, false, false, false]; // instruments, comms, systems, flightplan
    this.notesOpen = false;
    this.activeTimerControls = [];

    this.init();
  }

  init() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.updateSlide();
    this.bindKeys();
    this.bindNavButtons();
    this.updateCheckStrip();
  }

  bindKeys() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prev();
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) this.toggleFullscreen();
          break;
        case 'n':
        case 'N':
          if (!e.ctrlKey && !e.metaKey) this.toggleNotes();
          break;
        case 't':
        case 'T':
          if (!e.ctrlKey && !e.metaKey) this.triggerTimer();
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) this.triggerReveal();
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) this.toggleScoreboard();
          break;
        case '?':
          this.toggleHelp();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.slides.length - 1);
          break;
      }
    });
  }

  bindNavButtons() {
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());
  }

  next() {
    if (this.currentIndex < this.slides.length - 1) {
      this.goTo(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  }

  goTo(index) {
    if (index < 0 || index >= this.slides.length) return;

    // Don't stop timers on slide change — let them keep running in background

    this.slides[this.currentIndex].classList.remove('active');
    this.currentIndex = index;
    this.slides[this.currentIndex].classList.add('active');

    this.updateSlide();
  }

  updateSlide() {
    // Update counter
    const counter = document.getElementById('slide-counter');
    if (counter) {
      counter.textContent = `${this.currentIndex + 1} / ${this.slides.length}`;
    }

    // Update check strip based on current slide's data attribute
    const slide = this.slides[this.currentIndex];
    const checkState = slide.dataset.checks;
    if (checkState) {
      this.checksState = checkState.split(',').map(v => v === '1');
      this.updateCheckStrip();
    }

    // Update pulsing state
    const pulsing = slide.dataset.pulsing;
    this.updatePulsing(pulsing);

    // Auto-init scoreboard if this slide has one
    const scoreContainer = slide.querySelector('.scoreboard-container');
    if (scoreContainer && !scoreContainer.hasChildNodes()) {
      scoreboard.render(scoreContainer);
    }

    // Update facilitator notes
    this.updateNotes(slide.dataset.notes);
  }

  updateCheckStrip() {
    const items = document.querySelectorAll('.check-item');
    const names = ['instruments', 'comms', 'systems', 'flightplan'];
    items.forEach((item, i) => {
      item.classList.toggle('lit', this.checksState[i]);
    });
  }

  updatePulsing(name) {
    const items = document.querySelectorAll('.check-item');
    const names = ['instruments', 'comms', 'systems', 'flightplan'];
    items.forEach((item, i) => {
      item.classList.toggle('pulsing', names[i] === name);
    });
  }

  updateNotes(notes) {
    const panel = document.getElementById('facilitator-notes');
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

  toggleScoreboard() {
    const overlay = document.getElementById('scoreboard-overlay');
    if (overlay) {
      overlay.classList.toggle('hidden');
      if (!overlay.classList.contains('hidden')) {
        scoreboard.render(overlay.querySelector('.scoreboard-container'));
      }
    }
  }

  // Timer: press T to start/stop the timer on current slide
  triggerTimer() {
    const slide = this.slides[this.currentIndex];
    const timerEl = slide.querySelector('[data-timer]');
    if (!timerEl) return;

    const seconds = parseInt(timerEl.dataset.timer);
    if (!timerEl._timerControl) {
      // First time — create and start
      timerEl._timerControl = window.timer.createRing(timerEl, seconds, {
        onComplete: () => {
          timerEl._timerRunning = false;
        }
      });
      timerEl._timerControl.start();
      timerEl._timerRunning = true;
    } else {
      // Already created — toggle start/stop
      if (timerEl._timerRunning) {
        timerEl._timerControl.stop();
        timerEl._timerRunning = false;
      } else {
        timerEl._timerControl.start();
        timerEl._timerRunning = true;
      }
    }
  }

  // Reveal: press R to show the reveal-stamp on current slide
  triggerReveal() {
    const slide = this.slides[this.currentIndex];
    const stamp = slide.querySelector('.reveal-stamp');
    if (stamp) {
      stamp.classList.toggle('visible');
    }
  }

  stopActiveTimers() {
    window.timer.stopAll();
    this.activeTimerControls = [];
  }

  toggleHelp() {
    const overlay = document.getElementById('help-overlay');
    if (overlay) {
      overlay.classList.toggle('hidden');
    }
  }
}

/* ============================================
   Scoreboard Overlay (accessible from any slide via S key)
   ============================================ */

function createScoreboardOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'scoreboard-overlay';
  overlay.className = 'hidden';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(11,20,55,0.97);
    z-index: 500;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  `;
  overlay.innerHTML = `
    <h2 style="font-family:var(--font-heading);color:var(--amber);margin-bottom:1.5rem;text-transform:uppercase">
      🏆 Scoreboard
    </h2>
    <div class="scoreboard-container"></div>
    <p class="mt-3" style="color:var(--grey-mid);font-size:0.8rem">Press S to close</p>
  `;
  document.body.appendChild(overlay);
}

/* ============================================
   Help / Keyboard Shortcuts Overlay (toggle with ?)
   ============================================ */

function createHelpOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'help-overlay';
  overlay.className = 'hidden';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(11,20,55,0.97);
    z-index: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  `;
  overlay.innerHTML = `
    <h2 style="font-family:var(--font-heading);color:var(--amber);margin-bottom:1.5rem;text-transform:uppercase">
      ⌨️ Keyboard Shortcuts
    </h2>
    <table style="border-collapse:collapse;font-family:var(--font-body);font-size:1rem;max-width:500px;width:100%">
      <tbody>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">→ / Space</td><td style="padding:0.5rem 1rem">Next slide</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">←</td><td style="padding:0.5rem 1rem">Previous slide</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">T</td><td style="padding:0.5rem 1rem">Start / pause timer</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">R</td><td style="padding:0.5rem 1rem">Reveal answer (MYTH/TRUE)</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">S</td><td style="padding:0.5rem 1rem">Toggle scoreboard</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">N</td><td style="padding:0.5rem 1rem">Toggle facilitator notes</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">F</td><td style="padding:0.5rem 1rem">Fullscreen</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">Home / End</td><td style="padding:0.5rem 1rem">First / last slide</td></tr>
        <tr><td style="padding:0.5rem 1rem;color:var(--amber);font-family:var(--font-heading);font-weight:700">?</td><td style="padding:0.5rem 1rem">This help screen</td></tr>
      </tbody>
    </table>
    <p class="mt-3" style="color:var(--grey-mid);font-size:0.8rem">Press ? to close</p>
  `;
  document.body.appendChild(overlay);
}

/* ============================================
   Boot
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  createScoreboardOverlay();
  createHelpOverlay();
  window.engine = new SlideEngine();
});
