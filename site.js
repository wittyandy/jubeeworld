const boxes = document.querySelectorAll('[data-version]');
const message = document.querySelector('.copy-message');
const progressCount = document.querySelector('#progress-count');
const progressCheer = document.querySelector('#progress-cheer');
const progressFill = document.querySelector('#progress-fill');

boxes.forEach((box) => {
  const key = `jubee-world-version-${box.dataset.version}`;
  try {
    box.checked = localStorage.getItem(key) === 'done';
  } catch {
    box.checked = false;
  }
  box.addEventListener('change', () => {
    try {
      if (box.checked) localStorage.setItem(key, 'done');
      else localStorage.removeItem(key);
    } catch {
      // Progress still works for this visit if browser storage is unavailable.
    }
    if (box.checked) {
      const card = box.closest('.version-card');
      card.classList.add('just-finished');
      setTimeout(() => card.classList.remove('just-finished'), 650);
      showMessage(`Version ${box.dataset.version} finished! Great work!`);
    }
    updateProgress();
  });
});

updateProgress();

document.querySelectorAll('.copy-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const prompt = button.closest('.prompt-box').querySelector('blockquote').innerText.trim();
    try {
      await navigator.clipboard.writeText(prompt);
      showMessage('Prompt copied!');
    } catch {
      showMessage('Select the prompt and copy it.');
    }
  });
});

let messageTimer;
function showMessage(text) {
  clearTimeout(messageTimer);
  message.textContent = text;
  message.classList.add('show');
  messageTimer = setTimeout(() => message.classList.remove('show'), 1800);
}

function updateProgress() {
  const finished = [...boxes].filter((box) => box.checked).length;
  const cheers = [
    'Your adventure starts here!',
    'Jubee is on the move!',
    'You are building a real game!',
    'You reached the halfway mark!',
    'Jubee World is coming alive!',
    'One phone-ready version to go!',
    'You made Jubee World for computers and phones!'
  ];
  progressCount.textContent = `${finished} of ${boxes.length} versions finished`;
  progressCheer.textContent = cheers[finished];
  progressFill.style.width = `${(finished / boxes.length) * 100}%`;
}
