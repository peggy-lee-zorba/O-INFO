const ui = {
    renderGroups(groups, activeGroupId = null) {
        const list = document.getElementById('group-list');
        list.innerHTML = '';
        groups.forEach(group => {
            const el = document.createElement('div');
            el.className = 'group-item' + (group.id === activeGroupId ? ' active' : '');
            el.textContent = group.name;
            el.dataset.id = group.id;
            el.addEventListener('click', () => {
                window.app.setActiveGroup(group.id);
            });
            list.appendChild(el);
        });

        // Обновить состояние "Главная"
        const homeLink = document.querySelector('.home-link');
        if (homeLink) {
            homeLink.classList.toggle('active', activeGroupId === 'favorites');
        }
    },

    renderInstructions(instructions, isFavoritesView = false) {
        const list = document.getElementById('instructions-list');
        list.innerHTML = '';
        if (instructions.length === 0) {
            list.innerHTML = isFavoritesView
                ? '<p>Нет избранных инструкций</p>'
                : '<p>Нет инструкций в этой группе</p>';
            return;
        }

        instructions.forEach(instr => {
            const el = document.createElement('div');
            el.className = 'instruction-item';
            el.innerHTML = `
                <span class="instruction-name">${instr.name}</span>
                <div class="instruction-actions">
                    <button class="favorite-star ${instr.favorite ? 'filled' : ''}" data-id="${instr.id}">
                        ${instr.favorite ? '★' : '☆'}
                    </button>
                    <button class="delete-btn" data-id="${instr.id}">×</button>
                </div>
            `;
            list.appendChild(el);

            // Обработчики
            el.querySelector('.instruction-name').addEventListener('click', () => {
                this.showPreview(instr.name, instr.content);
            });

            el.querySelector('.favorite-star').addEventListener('click', (e) => {
                e.stopPropagation();
                window.app.toggleFavorite(instr.id);
            });

            el.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Удалить инструкцию "${instr.name}"?`)) {
                    window.app.deleteInstruction(instr.id);
                }
            });
        });
    },

    showPreview(title, content) {
        document.getElementById('preview-title').textContent = title;
        document.getElementById('preview-content').innerHTML = content;
        document.getElementById('preview-modal').classList.remove('hidden');
    },

    closePreview() {
        document.getElementById('preview-modal').classList.add('hidden');
    },

    showGroupModal() {
        document.getElementById('group-name').value = '';
        document.getElementById('group-modal').classList.remove('hidden');
    },

    closeGroupModal() {
        document.getElementById('group-modal').classList.add('hidden');
    },

    showEditor(title = 'Новая инструкция', name = '', content = '') {
        document.getElementById('editor-title').textContent = title;
        document.getElementById('instruction-name').value = name;
        document.getElementById('instruction-content').value = content;
        document.getElementById('editor-modal').classList.remove('hidden');
    },

    closeEditor() {
        document.getElementById('editor-modal').classList.add('hidden');
    }
};

// Привязка закрытия модалок
document.getElementById('close-preview-btn').addEventListener('click', () => ui.closePreview());
document.getElementById('cancel-group-btn').addEventListener('click', () => ui.closeGroupModal());
document.getElementById('cancel-instruction-btn').addEventListener('click', () => ui.closeEditor());

// Обработчик клика по "Главная"
document.addEventListener('DOMContentLoaded', () => {
    const homeLink = document.querySelector('.home-link');
    if (homeLink) {
        homeLink.addEventListener('click', () => {
            window.app.setActiveGroup('favorites');
        });
    }
});
