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

    // Stop any active timers from previous slide
    this.stopActiveTimers();

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
      timerEl._timerControl = window.timer.createRing(timerEl, seconds, {
        onComplete: () => {
          // optional sound or visual
        }
      });
      timerEl._timerControl.start();
      this.activeTimerControls.push(timerEl._timerControl);
    } else {
      // Toggle start/stop
      if (timerEl._timerStarted) {
        timerEl._timerControl.stop();
        timerEl._timerStarted = false;
      } else {
        timerEl._timerControl.start();
        timerEl._timerStarted = true;
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
   Boot
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  createScoreboardOverlay();
  window.engine = new SlideEngine();
});
