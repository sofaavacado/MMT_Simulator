window.showWelcome = function() {
  document.getElementById('welcomeModal').classList.add('show');
};

window.closeWelcome = function() {
  document.getElementById('welcomeModal').classList.remove('show');
};

window.showHelp = function() {
  document.getElementById('helpModal').classList.add('show');
};

window.closeHelp = function() {
  document.getElementById('helpModal').classList.remove('show');
};

window.showHelpSection = function(section, event) {
  document.querySelectorAll('.help-nav-item').forEach(item => item.classList.remove('active'));
  if (event?.target) event.target.classList.add('active');
  document.querySelectorAll('.help-content').forEach(content => content.classList.remove('active'));
  const target = document.getElementById('help' + section.charAt(0).toUpperCase() + section.slice(1));
  if (target) target.classList.add('active');
};

window.goToStep = function(step) {
  document.querySelectorAll('.wizard-step-content').forEach(content => content.classList.add('hidden'));
  document.getElementById('step' + step + 'Content').classList.remove('hidden');

  for (let i = 1; i <= 4; i++) {
    const circle = document.getElementById('step' + i + 'Circle');
    const text = document.getElementById('step' + i + 'Text');
    circle.classList.remove('active', 'completed');
    text.classList.remove('active');
    if (i < step) {
      circle.classList.add('completed');
      circle.innerHTML = '✓';
    } else if (i === step) {
      circle.classList.add('active');
      text.classList.add('active');
      circle.innerHTML = i;
    } else {
      circle.innerHTML = i;
    }
  }

  currentStep = step;
  if (step === 2) populateExamples();
  else if (step === 3) setupTapeDataEditor();
  else if (step === 4) {
    initializeSimulation();
    setTimeout(() => showSimulationTutorial(), 400);
  }
  updateGlobalStatus(getStepStatus(step));
};

window.selectTapeCount = function(count) {
  selectedTapeCount = count;
  document.querySelectorAll('.tape-card').forEach(card => card.classList.remove('selected'));
  document.querySelector(`[data-count="${count}"]`)?.classList.add('selected');
  document.getElementById('step1NextBtn').disabled = false;
  showNotification('Выбрано лент: ' + count, 'info');
};

window.populateExamples = function() {
  const grid = document.getElementById('examplesGrid');
  grid.innerHTML = '';

  const customCard = document.createElement('div');
  customCard.className = 'example-card';
  customCard.innerHTML = `
    <h4>Создать свою программу</h4>
    <p>Создайте собственную программу с нуля</p>
    <small class="muted">Для опытных пользователей</small>
  `;
  customCard.onclick = (event) => selectExample(null, event);
  grid.appendChild(customCard);

  const list = examples[selectedTapeCount] || [];
  list.forEach(example => {
    const card = document.createElement('div');
    card.className = 'example-card';
    card.innerHTML = `
      <h4>${example.name}</h4>
      <p>${example.description}</p>
      <small class="muted">${example.tapeCount} лент, ${example.transitions.length} правил</small>
    `;
    card.onclick = (event) => selectExample(example, event);
    grid.appendChild(card);
  });

  if (list.length === 0) {
    const noExamples = document.createElement('div');
    noExamples.className = 'card';
    noExamples.style.gridColumn = '1 / -1';
    noExamples.innerHTML = `
      <div class="card__body" style="text-align:center;color:var(--color-text-secondary);">
        <p>Для ${selectedTapeCount} лент пока нет готовых примеров.</p>
        <p>Создайте свою программу или выберите другое количество лент.</p>
      </div>
    `;
    grid.appendChild(noExamples);
  }
};

window.selectExample = function(example, event) {
  selectedExample = example;
  document.querySelectorAll('.example-card').forEach(card => card.classList.remove('selected'));
  event?.currentTarget?.classList.add('selected');
  document.getElementById('step2NextBtn').disabled = false;
  showNotification(example ? `Выбран пример: ${example.name}` : 'Создание собственной программы', example ? 'success' : 'info');
};

window.setupTapeDataEditor = function() {
  const container = document.getElementById('tapeDataEditor');
  container.innerHTML = '';
  machine.tapes = [];
  machine.initialTapes = [];
  machine.heads = [];

  const tapeColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];

  for (let i = 0; i < selectedTapeCount; i++) {
    const initialData = selectedExample ? (selectedExample.initialTapes[i] || ['_']) : ['_'];
    machine.tapes.push([...initialData]);
    machine.initialTapes.push([...initialData]);
    machine.heads.push(0);

    const tapeEditor = document.createElement('div');
    tapeEditor.className = 'card';
    tapeEditor.style.marginBottom = 'var(--space-16)';
    tapeEditor.innerHTML = `
      <div class="card__body">
        <h5 style="margin-bottom: var(--space-8); color: ${tapeColors[i % 5]};">🎞️ Лента ${i + 1}</h5>
        <div style="display:flex;gap:var(--space-8);align-items:center;margin-bottom:var(--space-8);">
          <input type="text" class="form-control" placeholder="Введите символы через запятую" value="${initialData.join(', ')}" onchange="updateTapeData(${i}, this.value)">
          <button class="btn btn--secondary btn--sm tooltip" data-tooltip="Очистить ленту" onclick="clearTape(${i})">🗑️</button>
          <button class="btn btn--secondary btn--sm tooltip" data-tooltip="Случайные данные" onclick="generateRandomTape(${i})">🎲</button>
        </div>
        <div class="tape-preview" id="tapePreview${i}"></div>
        <div class="muted" style="font-size: var(--font-size-xs); margin-top: var(--space-8);">ℹ️ Используйте "_" для пустых ячеек. Начальная позиция головки: 0</div>
      </div>
    `;
    container.appendChild(tapeEditor);
    updateTapePreview(i);
  }
};

window.updateTapeData = function(tapeIndex, value) {
  const symbols = value.split(',').map(s => s.trim()).filter(Boolean);
  machine.tapes[tapeIndex] = symbols.length ? symbols : ['_'];
  machine.initialTapes[tapeIndex] = [...machine.tapes[tapeIndex]];
  updateTapePreview(tapeIndex);
};

window.clearTape = function(tapeIndex) {
  machine.tapes[tapeIndex] = ['_'];
  machine.initialTapes[tapeIndex] = ['_'];
  const inputs = document.querySelectorAll('#tapeDataEditor input.form-control');
  if (inputs[tapeIndex]) inputs[tapeIndex].value = '_';
  updateTapePreview(tapeIndex);
};

window.generateRandomTape = function(tapeIndex) {
  const symbols = ['a', 'b', 'c', '1', '0'];
  const length = Math.floor(Math.random() * 5) + 3;
  const randomTape = Array.from({ length }, () => symbols[Math.floor(Math.random() * symbols.length)]);
  const inputs = document.querySelectorAll('#tapeDataEditor input.form-control');
  if (inputs[tapeIndex]) inputs[tapeIndex].value = randomTape.join(', ');
  updateTapeData(tapeIndex, randomTape.join(', '));
  showNotification(`Лента ${tapeIndex + 1} заполнена случайными данными`, 'info');
};

window.updateTapePreview = function(tapeIndex) {
  const preview = document.getElementById('tapePreview' + tapeIndex);
  const tape = machine.tapes[tapeIndex];
  preview.innerHTML = tape.map((symbol, idx) => `<span class="tape-cell ${idx === 0 ? 'head' : ''}">${symbol}</span>`).join('');
};

window.renderTapes = function() {
  const container = document.getElementById('tapesContainer');
  container.innerHTML = '';
  const tapeColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];

  machine.tapes.forEach((tape, index) => {
    const tapeDiv = document.createElement('div');
    tapeDiv.className = 'tape';
    tapeDiv.style.borderLeft = `4px solid ${tapeColors[index % tapeColors.length]}`;

    const extendedTape = [...tape];
    while (extendedTape.length < machine.heads[index] + 8) extendedTape.push('_');
    while (machine.heads[index] < 5) {
      extendedTape.unshift('_');
      machine.heads[index]++;
    }
    machine.tapes[index] = extendedTape;

    tapeDiv.innerHTML = `
      <div class="tape-header">
        <h5 style="color:${tapeColors[index % tapeColors.length]};">🎞️ Лента ${index + 1}</h5>
        <small>Позиция головки: ${machine.heads[index]} | Символов: ${extendedTape.filter(s => s !== '_').length}</small>
      </div>
      <div class="tape-cells">
        ${extendedTape.map((symbol, cellIndex) => `
          <div class="tape-cell ${cellIndex === machine.heads[index] ? 'head head-tape-' + (index + 1) : ''}" data-tape="${index}" data-cell="${cellIndex}">
            <div class="tape-cell-index">${cellIndex}</div>
            <div class="tape-cell-content">${symbol === '_' ? '&nbsp;' : symbol}</div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(tapeDiv);
  });

  const issues = validateProgram();
  if (issues.length > 0) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'status status--warning';
    warningDiv.style.margin = 'var(--space-16) 0';
    warningDiv.innerHTML = `⚠️ Обнаружены проблемы: ${issues.join(', ')} <button class="btn btn--sm" style="margin-left: var(--space-8);" onclick="showValidationDetails()">Подробнее</button>`;
    container.appendChild(warningDiv);
  }
};

window.renderTransitions = function() {
  const container = document.getElementById('transitionsContainer');
  container.innerHTML = '';

  if (machine.transitions.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center;color:var(--color-text-secondary);padding:var(--space-24);">
        <p>📝 Правила переходов пока не определены</p>
        <button class="btn btn--primary" onclick="addTransition()">+ Добавить первое правило</button>
      </div>
    `;
    return;
  }

  const headerDiv = document.createElement('div');
  headerDiv.style.display = 'grid';
  headerDiv.style.gridTemplateColumns = '1fr 2fr 1fr 2fr 2fr auto';
  headerDiv.style.gap = 'var(--space-8)';
  headerDiv.style.marginBottom = 'var(--space-8)';
  headerDiv.style.padding = 'var(--space-8)';
  headerDiv.style.fontWeight = 'var(--font-weight-medium)';
  headerDiv.style.fontSize = 'var(--font-size-sm)';
  headerDiv.style.color = 'var(--color-text-secondary)';
  headerDiv.innerHTML = `
    <div>Из состояния</div>
    <div>Читаем символы</div>
    <div>В состояние</div>
    <div>Записываем</div>
    <div>Движения</div>
    <div>Действия</div>
  `;
  container.appendChild(headerDiv);

  machine.transitions.forEach((transition, index) => {
    const div = document.createElement('div');
    div.className = 'transition-rule';
    div.id = `transition-${index}`;
    div.innerHTML = `
      <input type="text" class="form-control" value="${transition.from}" onchange="updateTransition(${index}, 'from', this.value)">
      <input type="text" class="form-control" value="${transition.read.join(', ')}" onchange="updateTransition(${index}, 'read', this.value)">
      <input type="text" class="form-control" value="${transition.to}" onchange="updateTransition(${index}, 'to', this.value)">
      <input type="text" class="form-control" value="${transition.write.join(', ')}" onchange="updateTransition(${index}, 'write', this.value)">
      <input type="text" class="form-control" value="${transition.move.join(', ')}" onchange="updateTransition(${index}, 'move', this.value)">
      <div style="display:flex;gap:var(--space-4);">
        <button class="btn btn--secondary btn--sm tooltip" data-tooltip="Дублировать правило" onclick="duplicateTransition(${index})">📋</button>
        <button class="btn btn--secondary btn--sm tooltip" data-tooltip="Удалить правило" onclick="removeTransition(${index})">🗑️</button>
      </div>
      ${transition.description ? `<div style="grid-column:1 / -1;font-size:var(--font-size-xs);color:var(--color-text-secondary);font-style:italic;">💬 ${transition.description}</div>` : ''}
    `;
    container.appendChild(div);
  });
};

window.highlightTransition = function(transition) {
  document.querySelectorAll('.transition-rule').forEach(rule => rule.classList.remove('active'));
  const transitionIndex = machine.transitions.indexOf(transition);
  if (transitionIndex >= 0) document.querySelectorAll('.transition-rule')[transitionIndex]?.classList.add('active');
};

window.updateMachineStatus = function(status = null) {
  const statusElement = document.getElementById('machineStatus');
  const elapsed = Date.now() - machine.startTime;
  statusElement.textContent = status ? `Состояние: ${status}` : `Состояние: ${machine.currentState} | Шаг: ${machine.stepCount} | Время: ${elapsed}мс`;
};

window.updateControls = function() {
  const playBtn = document.getElementById('playBtn');
  const stepBtn = document.getElementById('stepBtn');
  if (machine.isRunning) {
    playBtn.innerHTML = '⏸️';
    stepBtn.disabled = true;
  } else {
    playBtn.innerHTML = '▶️';
    stepBtn.disabled = false;
  }
};

window.updateProgress = function() {
  const progress = Math.min((machine.stepCount / maxSteps) * 100, 100);
  document.getElementById('progressFill').style.width = progress + '%';
};

window.markCellChanged = function(tapeIndex, cellIndex) {
  setTimeout(() => {
    const cell = document.querySelector(`[data-tape="${tapeIndex}"][data-cell="${cellIndex}"]`);
    if (cell) {
      cell.classList.add('changed');
      setTimeout(() => cell.classList.remove('changed'), 800);
    }
  }, 100);
};

window.showSimulationTutorial = function() {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🎆 Первые шаги в симуляции</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-16);">
          <div class="card"><div class="card__body" style="text-align:center;"><div style="font-size:2rem;">▶️</div><h5>Запуск</h5><p>Play для автоматического выполнения</p></div></div>
          <div class="card"><div class="card__body" style="text-align:center;"><div style="font-size:2rem;">⏭️</div><h5>По шагам</h5><p>Step для детального изучения</p></div></div>
          <div class="card"><div class="card__body" style="text-align:center;"><div style="font-size:2rem;">🎞️</div><h5>Ленты</h5><p>Цветные головки показывают позиции</p></div></div>
          <div class="card"><div class="card__body" style="text-align:center;"><div style="font-size:2rem;">🔄</div><h5>Правила</h5><p>Активное правило подсвечивается</p></div></div>
        </div>
        <div class="status status--info" style="margin: var(--space-16) 0;">⌨️ Горячие клавиши: Space, →, R, H, E</div>
        <div class="centered-actions"><button class="btn btn--primary" onclick="this.closest('.modal').remove()">Понятно, начать! 🚀</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.showValidationDetails = function() {
  const issues = validateProgram();
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔍 Валидация программы</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <h4>Обнаруженные проблемы:</h4>
        <ul>${issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
        <div style="margin-top:var(--space-16);display:flex;gap:var(--space-12);">
          <button class="btn btn--primary" onclick="generateMissingRules()">✨ Сгенерировать недостающие правила</button>
          <button class="btn btn--secondary" onclick="this.closest('.modal').remove()">Закрыть</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.showDebugInfo = function() {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:800px;">
      <div class="modal-header">
        <h3>🔍 Отладочная информация</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="card">
          <div class="card__body">
            <ul style="list-style:none;padding:0;font-family:var(--font-family-mono);">
              <li>Текущее состояние: <code>${machine.currentState}</code></li>
              <li>Шагов выполнено: <code>${machine.stepCount}</code></li>
              <li>Лент: <code>${selectedTapeCount}</code></li>
              <li>Правил: <code>${machine.transitions.length}</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.showEquivalence = function() {
  const equivalentMachine = convertToSingleTape();
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:900px;">
      <div class="modal-header">
        <h2>🔄 Эквивалентная одноленточная машина</h2>
        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="status status--info" style="margin-bottom:var(--space-16);">Любая ${selectedTapeCount}-ленточная машина может быть преобразована в эквивалентную одноленточную.</div>
        <div class="card"><div class="card__body">
          <p>Состояний в новой машине: <strong>${equivalentMachine.states.length}</strong></p>
          <p>Оценка числа переходов: <strong>~${equivalentMachine.transitionCount}</strong></p>
          <p>Размер алфавита: <strong>${equivalentMachine.alphabet.length}</strong></p>
        </div></div>
        <div class="centered-actions row-actions">
          <button class="btn btn--primary" onclick="demonstrateEquivalence()">🎬 Показать демонстрацию</button>
          <button class="btn btn--secondary" onclick="this.closest('.modal').remove()">Закрыть</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.demonstrateEquivalence = function() {
  const k = selectedTapeCount;
  const tapeContents = machine.tapes.map(tape => tape.join('').trim() || '_');
  let singleTapeRepresentation = '';
  for (let i = 0; i < tapeContents.length; i++) {
    const tapeStr = tapeContents[i];
    const headPos = machine.heads[i] || 0;
    for (let j = 0; j < tapeStr.length; j++) {
      singleTapeRepresentation += j === headPos
        ? `<span style="background: var(--color-primary); color: white; padding: 2px 4px; border-radius: 2px;">${tapeStr[j]}*</span>`
        : tapeStr[j];
    }
    if (i < tapeContents.length - 1) singleTapeRepresentation += '<span style="color: var(--color-error); font-weight: bold;"> # </span>';
  }

  const demo = document.createElement('div');
  demo.className = 'equivalence-demo';
  demo.style.marginTop = 'var(--space-16)';
  demo.style.padding = 'var(--space-16)';
  demo.style.background = 'var(--color-bg-3)';
  demo.style.borderRadius = 'var(--radius-base)';
  demo.innerHTML = `
    <h5>💻 Пример кодирования на одной ленте:</h5>
    <div style="font-family: var(--font-family-mono); background: var(--color-surface); padding: var(--space-12); border-radius: var(--radius-sm); overflow-x: auto; margin-top: var(--space-12);">${singleTapeRepresentation}</div>
    <p style="margin-top: var(--space-12);">Алгоритм симуляции: сканирование → применение перехода → запись → перемещение маркеров.</p>
    <p><strong>Сложность:</strong> O(T²), где T — время работы исходной ${k}-ленточной машины.</p>
  `;
  const modalBody = document.querySelector('.modal.show .modal-body');
  modalBody?.querySelector('.equivalence-demo')?.remove();
  modalBody?.appendChild(demo);
};
