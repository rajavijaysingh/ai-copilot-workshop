/* ============================================
   Timer Component
   Supports countdown ring (SVG circle) and inline text timers
   ============================================ */

class Timer {
  constructor() {
    this.activeTimers = new Map();
    this.nextId = 0;
  }

  /**
   * Create a countdown ring timer
   * @param {HTMLElement} container - Element to render timer into
   * @param {number} seconds - Duration in seconds
   * @param {object} options - { onComplete, autoStart, size }
   * @returns {object} Timer control { start, stop, reset, id }
   */
  createRing(container, seconds, options = {}) {
    const { onComplete, autoStart = false, size = 120 } = options;
    const id = this.nextId++;
    const circumference = 2 * Math.PI * 45; // radius = 45 for viewBox 100

    container.innerHTML = `
      <div class="timer-container" style="width:${size}px;height:${size}px">
        <svg class="timer-ring" viewBox="0 0 100 100" width="${size}" height="${size}">
          <circle class="ring-bg" cx="50" cy="50" r="45"/>
          <circle class="ring-progress" cx="50" cy="50" r="45"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="0"/>
        </svg>
        <div class="timer-text">${this.formatTime(seconds)}</div>
      </div>
    `;

    const progress = container.querySelector('.ring-progress');
    const text = container.querySelector('.timer-text');
    let remaining = seconds;
    let interval = null;

    const update = () => {
      remaining--;
      const fraction = remaining / seconds;
      const offset = circumference * (1 - fraction);
      progress.style.strokeDashoffset = offset;
      text.textContent = this.formatTime(remaining);

      if (remaining <= 5 && remaining > 0) {
        progress.classList.add('urgent');
      }

      if (remaining <= 0) {
        this.stop(id);
        text.textContent = '0';
        if (onComplete) onComplete();
      }
    };

    const control = {
      id,
      start: () => {
        if (interval) return;
        interval = setInterval(update, 1000);
        this.activeTimers.set(id, interval);
      },
      stop: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
          this.activeTimers.delete(id);
        }
      },
      reset: () => {
        control.stop();
        remaining = seconds;
        progress.style.strokeDashoffset = 0;
        progress.classList.remove('urgent');
        text.textContent = this.formatTime(seconds);
      }
    };

    if (autoStart) control.start();
    return control;
  }

  /**
   * Create a simple inline text timer
   * @param {HTMLElement} container
   * @param {number} seconds
   * @param {object} options - { onComplete, autoStart }
   * @returns {object} Timer control
   */
  createInline(container, seconds, options = {}) {
    const { onComplete, autoStart = false } = options;
    const id = this.nextId++;
    let remaining = seconds;
    let interval = null;

    container.innerHTML = `<span class="timer-inline">⏱ ${this.formatTime(seconds)}</span>`;
    const display = container.querySelector('.timer-inline');

    const update = () => {
      remaining--;
      display.textContent = `⏱ ${this.formatTime(remaining)}`;

      if (remaining <= 10) {
        display.style.color = 'var(--red)';
      }

      if (remaining <= 0) {
        control.stop();
        display.textContent = '⏱ TIME!';
        if (onComplete) onComplete();
      }
    };

    const control = {
      id,
      start: () => {
        if (interval) return;
        interval = setInterval(update, 1000);
        this.activeTimers.set(id, interval);
      },
      stop: () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
          this.activeTimers.delete(id);
        }
      },
      reset: () => {
        control.stop();
        remaining = seconds;
        display.style.color = 'var(--amber)';
        display.textContent = `⏱ ${this.formatTime(seconds)}`;
      }
    };

    if (autoStart) control.start();
    return control;
  }

  stop(id) {
    const interval = this.activeTimers.get(id);
    if (interval) {
      clearInterval(interval);
      this.activeTimers.delete(id);
    }
  }

  stopAll() {
    this.activeTimers.forEach((interval) => clearInterval(interval));
    this.activeTimers.clear();
  }

  formatTime(seconds) {
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${seconds}`;
  }
}

// Global timer instance
window.timer = new Timer();
