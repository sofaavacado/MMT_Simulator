window.setupKeyboardShortcuts = function() {
  document.addEventListener('keydown', function(e) {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (currentStep === 4) toggleExecution();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentStep === 4) stepExecution();
        break;
      case 'KeyR':
        e.preventDefault();
        if (currentStep === 4) resetExecution();
        break;
      case 'KeyH':
        e.preventDefault();
        showHelp();
        break;
      case 'KeyE':
        e.preventDefault();
        if (currentStep === 4) showEquivalence();
        break;
      case 'KeyS':
        e.preventDefault();
        if (currentStep === 4) saveProgram();
        break;
      case 'Escape':
        closeHelp();
        closeWelcome();
        document.querySelectorAll('.modal.show').forEach(modal => {
          if (modal.id !== 'helpModal' && modal.id !== 'welcomeModal') modal.remove();
        });
        break;
    }
  });
};

document.addEventListener('DOMContentLoaded', function() {
  showWelcome();
  setupKeyboardShortcuts();
  updateGlobalStatus('Готов к настройке многоленточной машины Тьюринга');

  setTimeout(() => {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal?.classList.contains('show')) {
      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn btn--outline';
      loadBtn.innerHTML = '📁 Загрузить программу';
      loadBtn.onclick = () => { closeWelcome(); loadProgram(); };
      const buttonContainer = welcomeModal.querySelector('.modal-body .centered-actions');
      if (buttonContainer) buttonContainer.appendChild(loadBtn);
    }
  }, 100);
});
