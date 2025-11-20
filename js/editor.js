let editingInstructionId = null;

document.getElementById('add-group-btn').addEventListener('click', () => {
  ui.showGroupModal();
});

document.getElementById('save-group-btn').addEventListener('click', () => {
  const name = document.getElementById('group-name').value.trim();
  if (name) {
    window.app.addGroup(name);
    ui.closeGroupModal();
  }
});

document.getElementById('add-instruction-btn').addEventListener('click', () => {
  if (!window.app.activeGroupId) {
    alert('Сначала выберите группу');
    return;
  }
  editingInstructionId = null;
  ui.showEditor('Новая инструкция');
});

document.getElementById('save-instruction-btn').addEventListener('click', () => {
  const name = document.getElementById('instruction-name').value.trim();
  const content = document.getElementById('instruction-content').value.trim();
  if (!name || !content) {
    alert('Заполните все поля');
    return;
  }

  if (editingInstructionId) {
    window.app.updateInstruction(editingInstructionId, name, content);
  } else {
    window.app.addInstruction(name, content);
  }
  ui.closeEditor();
});

// Обработка загрузки HTML-файла
document.getElementById('upload-html-btn').addEventListener('click', () => {
  document.getElementById('html-file-input').click();
});

document.getElementById('html-file-input').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    let content = e.target.result;

    // Опционально: извлечь <title> из HTML как название
    const nameFromTitle = extractTitleFromHTML(content) || file.name.replace(/\.[^/.]+$/, "");

    // Обновить поля в редакторе
    document.getElementById('instruction-name').value = nameFromTitle;
    document.getElementById('instruction-content').value = content;
  };
  reader.readAsText(file, 'utf-8');
});

// Вспомогательная функция: вытащить <title> из HTML
function extractTitleFromHTML(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}