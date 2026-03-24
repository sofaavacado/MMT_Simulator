window.initializeSimulation = function() {
  if (selectedExample) {
    machine.states = [...selectedExample.states];
    machine.transitions = selectedExample.transitions.map(t => ({ ...t, read: [...t.read], write: [...t.write], move: [...t.move] }));
    machine.currentState = selectedExample.initialState || selectedExample.states[0] || 'q0';
  } else {
    machine.states = ['q0', 'qf'];
    machine.transitions = [];
    machine.currentState = 'q0';
  }

  machine.isRunning = false;
  machine.isPaused = false;
  machine.stepCount = 0;
  machine.startTime = Date.now();
  machine.executionLog = [];
  renderTapes();
  renderTransitions();
  updateMachineStatus();
  updateControls();
  updateProgress();
};

window.toggleExecution = function() {
  if (machine.isRunning) pauseExecution();
  else startExecution();
};

window.startExecution = function() {
  machine.isRunning = true;
  machine.isPaused = false;
  executionTimer = setInterval(() => {
    if (!stepExecution()) pauseExecution();
  }, executionSpeed);
  updateControls();
  showNotification('Симуляция запущена', 'success');
};

window.pauseExecution = function() {
  machine.isRunning = false;
  machine.isPaused = true;
  if (executionTimer) {
    clearInterval(executionTimer);
    executionTimer = null;
  }
  updateControls();
  showNotification('Симуляция приостановлена', 'info');
};

window.stepExecution = function() {
  if (machine.stepCount >= maxSteps) {
    showNotification('Достигнут лимит шагов (10,000)', 'warning');
    pauseExecution();
    return false;
  }

  const currentRead = machine.heads.map((head, i) => machine.tapes[i][head] || '_');
  const transition = machine.transitions.find(t => t.from === machine.currentState && arraysEqual(t.read, currentRead));

  if (!transition) {
    if (machine.currentState === 'qf' || machine.currentState === 'qaccept' || machine.currentState.includes('accept')) {
      showNotification('Машина завершена успешно!', 'success');
      updateMachineStatus('Успешно завершено');
    } else if (machine.currentState === 'qreject' || machine.currentState.includes('reject')) {
      showNotification('Машина отклонила ввод', 'warning');
      updateMachineStatus('Ввод отклонён');
    } else {
      showDetailedError(`Нет правила для состояния ${machine.currentState} и символов [${currentRead.join(', ')}]`);
      updateMachineStatus('Ошибка: недостающее правило');
    }
    pauseExecution();
    return false;
  }

  highlightTransition(transition);
  machine.executionLog.push({
    step: machine.stepCount,
    timestamp: Date.now() - machine.startTime,
    state: machine.currentState,
    rule: `${transition.from} + [${transition.read.join(', ')}] → ${transition.to} + [${transition.write.join(', ')}] + [${transition.move.join(', ')}]`,
    tapes: machine.tapes.map(tape => [...tape]),
    heads: [...machine.heads],
    description: transition.description || ''
  });

  machine.currentState = transition.to;

  transition.write.forEach((symbol, index) => {
    if (index < machine.tapes.length) {
      machine.tapes[index][machine.heads[index]] = symbol;
      markCellChanged(index, machine.heads[index]);
    }
  });

  transition.move.forEach((direction, index) => {
    if (direction === 'L') {
      machine.heads[index] = Math.max(0, machine.heads[index] - 1);
      if (machine.heads[index] === 0) machine.tapes[index].unshift('_');
    } else if (direction === 'R') {
      machine.heads[index]++;
      if (machine.heads[index] >= machine.tapes[index].length) machine.tapes[index].push('_');
    }
  });

  machine.stepCount++;
  renderTapes();
  updateMachineStatus();
  updateProgress();
  return true;
};

window.resetExecution = function() {
  machine.isRunning = false;
  machine.isPaused = false;
  machine.currentState = selectedExample?.initialState || machine.states[0] || 'q0';
  machine.stepCount = 0;
  machine.startTime = Date.now();
  machine.executionLog = [];
  machine.heads = machine.heads.map(() => 0);
  machine.tapes = (selectedExample?.initialTapes || machine.initialTapes || [['_']]).map(tape => [...tape]);
  if (executionTimer) {
    clearInterval(executionTimer);
    executionTimer = null;
  }
  document.querySelectorAll('.transition-rule').forEach(rule => rule.classList.remove('active'));
  renderTapes();
  updateMachineStatus();
  updateControls();
  updateProgress();
  showNotification('Симуляция сброшена к начальному состоянию', 'info');
};

window.setSpeed = function(speed) {
  executionSpeed = parseInt(speed, 10);
  if (machine.isRunning && executionTimer) {
    clearInterval(executionTimer);
    executionTimer = setInterval(() => {
      if (!stepExecution()) pauseExecution();
    }, executionSpeed);
  }
};

window.updateTransition = function(index, field, value) {
  const transition = machine.transitions[index];
  if (field === 'read' || field === 'write' || field === 'move') transition[field] = value.split(',').map(s => s.trim());
  else transition[field] = value;
  if ((field === 'from' || field === 'to') && !machine.states.includes(value)) machine.states.push(value);
};

window.addTransition = function() {
  machine.transitions.push({
    from: 'q0',
    read: new Array(selectedTapeCount).fill('_'),
    to: 'q1',
    write: new Array(selectedTapeCount).fill('_'),
    move: new Array(selectedTapeCount).fill('S')
  });
  renderTransitions();
};

window.removeTransition = function(index) {
  machine.transitions.splice(index, 1);
  renderTransitions();
};

window.duplicateTransition = function(index) {
  const original = machine.transitions[index];
  machine.transitions.splice(index + 1, 0, {
    from: original.from,
    read: [...original.read],
    to: original.to,
    write: [...original.write],
    move: [...original.move],
    description: (original.description || '') + ' (копия)'
  });
  renderTransitions();
  showNotification('Правило продублировано', 'info');
};

window.convertToSingleTape = function() {
  if (!machine.transitions.length) {
    return { states: ['q0', 'qaccept', 'qreject'], alphabet: ['_', '#', '*'], transitionCount: 0 };
  }
  const k = selectedTapeCount;
  const states = new Set();
  const alphabet = new Set(['_', '#', '*']);
  machine.transitions.forEach(trans => {
    states.add(trans.from);
    states.add(trans.to);
    (trans.read || []).forEach(symbol => symbol && alphabet.add(symbol));
    (trans.write || []).forEach(symbol => symbol && alphabet.add(symbol));
  });

  const unmarkedSymbols = Array.from(alphabet);
  unmarkedSymbols.forEach(symbol => { if (symbol !== '*') alphabet.add(symbol + '*'); });

  const singleTapeStates = new Set();
  states.forEach(state => {
    singleTapeStates.add(state);
    for (let i = 0; i <= k; i++) {
      singleTapeStates.add(`${state}_scan_${i}`);
      singleTapeStates.add(`${state}_update_${i}`);
      singleTapeStates.add(`${state}_moveleft_${i}`);
    }
  });

  const avgTapeLength = 100;
  const estimatedTransitionCount = machine.transitions.length * k * avgTapeLength * 3;
  return { states: Array.from(singleTapeStates), alphabet: Array.from(alphabet), transitionCount: estimatedTransitionCount };
};

window.saveProgram = function() {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>💾 Сохранение программы</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <label>Название программы:</label>
        <input type="text" id="programName" class="form-control" value="Моя машина Тьюринга ${selectedTapeCount}-лент">
        <label style="margin-top:var(--space-12);display:block;">Описание:</label>
        <textarea id="programDescription" class="form-control" rows="2" placeholder="Опишите программу"></textarea>
        <div class="centered-actions row-actions">
          <button class="btn btn--primary" onclick="downloadProgram()">💾 Скачать JSON</button>
          <button class="btn btn--secondary" onclick="copyToClipboard()">📋 Копировать</button>
          <button class="btn btn--outline" onclick="this.closest('.modal').remove()">Отмена</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.downloadProgram = function() {
  const name = document.getElementById('programName').value || 'Моя программа';
  const description = document.getElementById('programDescription').value;
  const program = {
    name,
    description,
    created: new Date().toISOString(),
    version: '1.0',
    tapeCount: selectedTapeCount,
    states: machine.states,
    initialState: machine.currentState,
    finalStates: machine.states.filter(s => s.includes('f') || s.includes('accept') || s.includes('reject')),
    transitions: machine.transitions.map(t => ({ ...t, read: [...t.read], write: [...t.write], move: [...t.move] })),
    initialTapes: machine.tapes.map(tape => [...tape])
  };
  const dataBlob = new Blob([JSON.stringify(program, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name.replace(/\s+/g, '_') + '.json';
  link.click();
  URL.revokeObjectURL(url);
  showNotification(`Программа "${name}" сохранена!`, 'success');
  document.querySelector('.modal.show')?.remove();
};

window.copyToClipboard = function() {
  const program = {
    tapeCount: selectedTapeCount,
    states: machine.states,
    transitions: machine.transitions,
    initialTapes: machine.tapes.map(tape => [...tape])
  };
  navigator.clipboard.writeText(JSON.stringify(program, null, 2))
    .then(() => {
      showNotification('Программа скопирована в буфер!', 'success');
      document.querySelector('.modal.show')?.remove();
    })
    .catch(() => showNotification('Ошибка копирования', 'error'));
};

window.exportLog = function() {
  const executionLog = machine.executionLog || [];
  if (!executionLog.length) {
    showNotification('Нет данных для экспорта. Запустите симуляцию!', 'warning');
    return;
  }

  const header = ['Шаг', 'Время', 'Состояние', 'Применённое правило'];
  for (let i = 0; i < selectedTapeCount; i++) header.push(`Лента ${i + 1}`, `Головка ${i + 1}`);
  const rows = [header];

  executionLog.forEach((entry, index) => {
    const row = [index, entry.timestamp, entry.state, entry.rule];
    for (let i = 0; i < selectedTapeCount; i++) row.push(entry.tapes[i] ? entry.tapes[i].join('') : '', entry.heads[i] || 0);
    rows.push(row);
  });

  const csvContent = rows.map(row => row.map(cell => typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell).join(',')).join('\n');
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `turing_machine_log_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showNotification(`Журнал экспортирован (${executionLog.length} шагов)`, 'success');
};

window.loadProgram = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      try {
        const program = JSON.parse(ev.target.result);
        if (!program.tapeCount || !program.transitions) throw new Error('Неверный формат файла');
        selectedTapeCount = program.tapeCount;
        selectedExample = null;
        machine.states = program.states || [];
        machine.transitions = program.transitions || [];
        machine.tapes = (program.initialTapes || []).map(tape => [...tape]);
        while (machine.tapes.length < selectedTapeCount) machine.tapes.push(['_']);
        machine.initialTapes = machine.tapes.map(tape => [...tape]);
        machine.heads = new Array(selectedTapeCount).fill(0);
        machine.currentState = program.initialState || machine.states[0] || 'q0';
        goToStep(4);
        showNotification(`Программа "${program.name || 'Без названия'}" загружена!`, 'success');
      } catch (error) {
        showNotification('Ошибка загрузки: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};
