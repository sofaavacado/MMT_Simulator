window.currentStep = 1;
window.selectedTapeCount = 0;
window.selectedExample = null;
window.machine = {
  tapes: [],
  initialTapes: [],
  states: [],
  currentState: 'q0',
  transitions: [],
  heads: [],
  isRunning: false,
  isPaused: false,
  stepCount: 0,
  startTime: 0,
  executionLog: []
};
window.executionSpeed = 200;
window.executionTimer = null;
window.maxSteps = 10000;

window.arraysEqual = function(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
};

window.generateCombinations = function(symbols, count) {
  if (count === 1) return symbols.map(s => [s]);
  const result = [];
  const smaller = generateCombinations(symbols, count - 1);
  symbols.forEach(symbol => {
    smaller.forEach(combo => result.push([symbol, ...combo]));
  });
  return result;
};

window.showNotification = function(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.innerHTML = message;
  notification.className = `notification ${type} show`;
  const hideTime = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
  setTimeout(() => notification.classList.remove('show'), hideTime);
};

window.updateGlobalStatus = function(status) {
  document.getElementById('globalStatus').textContent = status;
};

window.getStepStatus = function(step) {
  const statuses = {
    1: 'Выбор количества лент',
    2: 'Выбор программы',
    3: 'Настройка данных лент',
    4: 'Симуляция готова к запуску'
  };
  return statuses[step] || 'Неизвестный шаг';
};

window.validateProgram = function() {
  const issues = [];
  const states = new Set();
  const symbols = new Set(['_']);

  machine.transitions.forEach(t => {
    states.add(t.from);
    states.add(t.to);
    (t.read || []).forEach(s => symbols.add(s));
    (t.write || []).forEach(s => symbols.add(s));
  });
  machine.tapes.forEach(tape => tape.forEach(symbol => symbols.add(symbol)));

  let missingCount = 0;
  states.forEach(state => {
    if (state.includes('f') || state.includes('accept') || state.includes('reject')) return;
    const combinations = generateCombinations(Array.from(symbols), selectedTapeCount);
    combinations.forEach(combo => {
      const hasTransition = machine.transitions.some(t => t.from === state && arraysEqual(t.read, combo));
      if (!hasTransition) missingCount++;
    });
  });

  if (missingCount > 0) issues.push(`Недостаёт ${missingCount} правил переходов`);
  return issues;
};

window.showDetailedError = function(message) {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 style="color: var(--color-error);">⚠️ Ошибка выполнения</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <pre style="white-space: pre-wrap; font-family: var(--font-family-base); background: var(--color-bg-4); padding: var(--space-16); border-radius: var(--radius-base); margin: var(--space-16) 0;">${message}</pre>
        <div style="display:flex;gap:var(--space-12);margin-top:var(--space-16);">
          <button class="btn btn--primary" onclick="suggestAutofix()">🛠️ Автоисправление</button>
          <button class="btn btn--secondary" onclick="this.closest('.modal').remove()">Закрыть</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.suggestAutofix = function() {
  const currentRead = machine.heads.map((head, i) => machine.tapes[i][head] || '_');
  const suggestedTransition = {
    from: machine.currentState,
    read: [...currentRead],
    to: 'qf',
    write: [...currentRead],
    move: new Array(selectedTapeCount).fill('S'),
    description: 'Авто-сгенерированное правило'
  };
  const confirmMsg = `Добавить правило:\n${suggestedTransition.from} + [${suggestedTransition.read.join(', ')}] → ${suggestedTransition.to} + [${suggestedTransition.write.join(', ')}] + [${suggestedTransition.move.join(', ')}]?`;
  if (confirm(confirmMsg)) {
    machine.transitions.push(suggestedTransition);
    renderTransitions();
    showNotification('Правило добавлено!', 'success');
    document.querySelector('.modal.show')?.remove();
  }
};

window.generateMissingRules = function() {
  const states = new Set();
  const symbols = new Set(['_']);

  machine.transitions.forEach(t => {
    states.add(t.from);
    states.add(t.to);
    (t.read || []).forEach(s => symbols.add(s));
  });
  machine.tapes.forEach(tape => tape.forEach(symbol => symbols.add(symbol)));

  let addedCount = 0;
  states.forEach(state => {
    if (state.includes('f') || state.includes('accept') || state.includes('reject')) return;
    const combinations = generateCombinations(Array.from(symbols), selectedTapeCount);
    combinations.forEach(combo => {
      const hasTransition = machine.transitions.some(t => t.from === state && arraysEqual(t.read, combo));
      if (!hasTransition && addedCount < 10) {
        machine.transitions.push({
          from: state,
          read: [...combo],
          to: 'qf',
          write: [...combo],
          move: new Array(selectedTapeCount).fill('S'),
          description: 'Авто-сгенерированное правило (остановка)'
        });
        addedCount++;
      }
    });
  });

  renderTransitions();
  renderTapes();
  showNotification(`Добавлено ${addedCount} правил`, 'success');
  document.querySelector('.modal.show')?.remove();
};
