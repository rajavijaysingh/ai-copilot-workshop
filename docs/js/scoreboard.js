/* ============================================
   Scoreboard Component
   12 squads × 4 checks, localStorage persistence
   ============================================ */

class Scoreboard {
  constructor() {
    this.storageKey = 'copilot-workshop-scores';
    this.squads = this.load();
  }

  getDefaultSquads() {
    const squads = [];
    for (let i = 1; i <= 12; i++) {
      squads.push({
        id: i,
        name: `Squad ${i}`,
        scores: { instruments: 0, comms: 0, systems: 0, flightplan: 0 }
      });
    }
    return squads;
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) return JSON.parse(data);
    } catch (e) { /* ignore */ }
    return this.getDefaultSquads();
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.squads));
  }

  reset() {
    this.squads = this.getDefaultSquads();
    this.save();
  }

  updateName(squadId, name) {
    const squad = this.squads.find(s => s.id === squadId);
    if (squad) {
      squad.name = name;
      this.save();
    }
  }

  updateScore(squadId, check, score) {
    const squad = this.squads.find(s => s.id === squadId);
    if (squad && squad.scores.hasOwnProperty(check)) {
      squad.scores[check] = Math.min(20, Math.max(0, parseInt(score) || 0));
      this.save();
    }
  }

  getTotal(squad) {
    return Object.values(squad.scores).reduce((a, b) => a + b, 0);
  }

  getWinner() {
    let max = 0;
    let winner = null;
    this.squads.forEach(s => {
      const total = this.getTotal(s);
      if (total > max) {
        max = total;
        winner = s;
      }
    });
    return winner;
  }

  render(container) {
    const checks = ['instruments', 'comms', 'systems', 'flightplan'];
    const labels = ['Instruments', 'Comms', 'Systems', 'Flight Plan'];

    let html = `
      <table class="scoreboard">
        <thead>
          <tr>
            <th>Squad</th>
            ${labels.map(l => `<th>${l}</th>`).join('')}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    this.squads.forEach(squad => {
      const total = this.getTotal(squad);
      html += `
        <tr>
          <td>
            <input type="text" value="${squad.name}" 
              style="width:120px;text-align:left" 
              onchange="scoreboard.updateName(${squad.id}, this.value)">
          </td>
          ${checks.map(check => `
            <td>
              <input type="number" min="0" max="20" value="${squad.scores[check]}"
                onchange="scoreboard.updateScore(${squad.id}, '${check}', this.value)">
            </td>
          `).join('')}
          <td class="total">${total}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <div class="mt-3" style="display:flex;gap:1rem;justify-content:center">
        <button class="nav-btn" style="width:auto;border-radius:4px;padding:0.5rem 1rem;font-size:0.8rem" 
          onclick="scoreboard.reset();scoreboard.render(this.closest('.slide').querySelector('.scoreboard-container'))">
          Reset All
        </button>
      </div>
    `;

    container.innerHTML = html;
  }
}

// Global scoreboard instance
window.scoreboard = new Scoreboard();
