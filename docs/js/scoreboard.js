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
      const max = check === 'flightplan' ? 40 : 20;
      squad.scores[check] = Math.min(max, Math.max(0, parseInt(score) || 0));
      this.save();
      this.updateTotals();
    }
  }

  updateTotals() {
    // Update all total cells in any rendered scoreboard
    document.querySelectorAll('.scoreboard tbody tr').forEach((row, i) => {
      const squad = this.squads[i];
      if (squad) {
        const totalCell = row.querySelector('.total');
        if (totalCell) {
          totalCell.textContent = this.getTotal(squad);
        }
      }
    });
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
        <tr data-squad="${squad.id}">
          <td>
            <input type="text" value="${squad.name}" 
              style="width:120px;text-align:left" 
              onfocus="this.select()"
              onchange="scoreboard.updateName(${squad.id}, this.value)">
          </td>
          ${checks.map(check => `
            <td>
              <input type="number" min="0" max="${check === 'flightplan' ? 40 : 20}" value="${squad.scores[check]}"
                onfocus="this.select()"
                oninput="scoreboard.updateScore(${squad.id}, '${check}', this.value)">
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
          onclick="scoreboard.reset();scoreboard.renderAll()">
          Reset All
        </button>
      </div>
      <p style="color:var(--grey-mid);font-size:0.75rem;margin-top:0.5rem">Enter / ↓ = next squad · ↑ = prev squad · Tab = next column</p>
    `;

    container.innerHTML = html;

    // Add column navigation (Enter/ArrowDown = down, ArrowUp = up in same column)
    container.querySelectorAll('.scoreboard input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
          e.preventDefault();
          this.moveVertical(input, 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.moveVertical(input, -1);
        }
      });
    });
  }

  moveVertical(currentInput, direction) {
    const td = currentInput.closest('td');
    const tr = td.closest('tr');
    const tbody = tr.closest('tbody');
    const colIndex = Array.from(tr.children).indexOf(td);
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const rowIndex = rows.indexOf(tr);
    const targetRow = rows[rowIndex + direction];
    if (targetRow) {
      const targetCell = targetRow.children[colIndex];
      if (targetCell) {
        const targetInput = targetCell.querySelector('input');
        if (targetInput) {
          targetInput.focus();
          targetInput.select();
        }
      }
    }
  }

  renderAll() {
    document.querySelectorAll('.scoreboard-container').forEach(c => {
      if (c.children.length > 0) this.render(c);
    });
  }
}

// Global scoreboard instance
window.scoreboard = new Scoreboard();
