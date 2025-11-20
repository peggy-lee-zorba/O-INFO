document.addEventListener('DOMContentLoaded', () => {
  let editingInstructionId = null;

  // === КНОПКИ ===
  const addGroupBtn = document.getElementById('add-group-btn');
  const saveGroupBtn = document.getElementById('save-group-btn');
  const addInstructionBtn = document.getElementById('add-instruction-btn');
  const saveInstructionBtn = document.getElementById('save-instruction-btn');
  const uploadHtmlBtn = document.getElementById('upload-html-btn');
  const htmlFileInput = document.getElementById('html-file-input');

  // === ОБРАБОТЧИКИ ===
  if (addGroupBtn) {
    addGroupBtn.addEventListener('click', () => {
      ui.showGroupModal();
    });
  }

  if (saveGroupBtn) {
    saveGroupBtn.addEventListener('click', () => {
      const name = document.getElementById('group-name')?.value.trim();
      if (name) {
        window.app.addGroup(name);
        ui.closeGroupModal();
      }
    });
  }

  if (addInstructionBtn) {
    addInstructionBtn.addEventListener('click', () => {
      if (!window.app.activeGroupId || window.app.activeGroupId === 'favorites') {
        alert('Сначала выберите группу (не "Главная")');
        return;
      }
      editingInstructionId = null;
      ui.showEditor('Новая инструкция');
    });
  }

  if (saveInstructionBtn) {
    saveInstructionBtn.addEventListener('click', () => {
      const name = document.getElementById('instruction-name')?.value.trim();
      const content = document.getElementById('instruction-content')?.value.trim();
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
  }

  // === ЗАГРУЗКА HTML-ФАЙЛА ===
  if (uploadHtmlBtn && htmlFileInput) {
    uploadHtmlBtn.addEventListener('click', () => {
      htmlFileInput.click();
    });

    htmlFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target.result;
        const nameFromTitle = extractTitleFromHTML(content) || file.name.replace(/\.[^/.]+$/, "");
        document.getElementById('instruction-name').value = nameFromTitle;
        document.getElementById('instruction-content').value = content;
      };
      reader.readAsText(file, 'utf-8');
    });
  }
});

// Вспомогательная функция: извлечь <title>
function extractTitleFromHTML(html) {
  const match = html.match(/<title>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}