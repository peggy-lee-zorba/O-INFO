export class UIManager {
    constructor(storage) {
        this.storage = storage;
        this.currentGroupId = null;
        this.currentInstructionId = null;
    }

    init() {
        this.renderGroups();
        this.setupEventListeners();
        this.updateWelcomeScreen();

        // Слушатель обновления инструкций
        document.addEventListener('instructionsUpdated', (e) => {
            const { groupId } = e.detail;
            if (this.currentGroupId === groupId) {
                this.renderInstructions(groupId);
            }
            this.updateWelcomeScreen();
        });
    }

    setupEventListeners() {
        // Группы
        document.getElementById('add-group-btn').addEventListener('click', () => {
            this.showGroupModal();
        });

        document.getElementById('group-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGroupSubmit();
        });

        document.getElementById('cancel-group').addEventListener('click', () => {
            this.hideModal('group-modal');
        });

        // Инструкции
        document.getElementById('add-instruction-btn').addEventListener('click', () => {
            this.showEditor();
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-instruction')) {
                e.stopPropagation();
                const btn = e.target.closest('.edit-instruction');
                const id = btn.dataset.id;
                this.editInstruction(id);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-instruction')) {
                e.stopPropagation();
                const btn = e.target.closest('.delete-instruction');
                const id = btn.dataset.id;
                this.confirmDelete('instruction', id);
            }
        });

        document.getElementById('back-to-list').addEventListener('click', () => {
            this.showInstructionsList();
        });

        // Избранное
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) {
                e.stopPropagation();
                const btn = e.target.closest('.favorite-btn');
                const id = btn.dataset.id;
                this.toggleFavorite(id);
            }
        });

        // Модальные окна
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            this.hideModal('confirm-modal');
        });
    }

    renderGroups() {
        const groupsList = document.getElementById('groups-list');
        const groups = this.storage.getGroups();
        
        groupsList.innerHTML = '';
        
        groups.forEach(group => {
            const li = document.createElement('li');
            li.className = 'group-item';
            li.dataset.groupId = group.id;
            
            li.innerHTML = `
                <span class="group-name">${group.name}</span>
                <div class="group-actions">
                    <button class="edit-group" data-id="${group.id}" title="Редактировать">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="delete-group" data-id="${group.id}" title="Удалить">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.group-actions')) {
                    this.selectGroup(group.id);
                }
            });
            
            groupsList.appendChild(li);
        });

        // Обработчики для действий группы
        document.querySelectorAll('.edit-group').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const group = this.storage.getGroups().find(g => g.id === id);
                this.showGroupModal(group);
            });
        });

        document.querySelectorAll('.delete-group').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.confirmDelete('group', id);
            });
        });
    }

    selectGroup(groupId, instructionId = null) {
        this.currentGroupId = groupId;

        // Обновить активное состояние
        document.querySelectorAll('.group-item').forEach(item => {
            item.classList.remove('active');
        });

        const selectedItem = document.querySelector(`[data-group-id="${groupId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        // Показать инструкции группы
        this.renderInstructions(groupId);
        this.showInstructionsList();

        // Обновить заголовок
        const group = this.storage.getGroups().find(g => g.id === groupId);
        document.getElementById('current-group-title').textContent = group.name;

        // Если указана инструкция, редактировать ее
        if (instructionId) {
            setTimeout(() => {
                this.editInstruction(instructionId);
            }, 100); // Небольшая задержка для рендера
        }
    }

    renderInstructions(groupId) {
        const instructionsList = document.getElementById('instructions-list');
        const instructions = this.storage.getInstructions(groupId);
        
        instructionsList.innerHTML = '';
        
        if (instructions.length === 0) {
            instructionsList.innerHTML = '<p class="empty-state">Нет инструкций. Создайте первую!</p>';
            return;
        }
        
        instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.className = 'instruction-item';
            
            const date = new Date(instruction.createdAt).toLocaleDateString('ru-RU');
            
            li.innerHTML = `
                <div class="instruction-info">
                    <h3>${instruction.title}</h3>
                    <p class="instruction-meta">Создано: ${date} | Шагов: ${instruction.steps.length}</p>
                </div>
                <div class="instruction-actions">
                    <button class="favorite-btn ${instruction.favorite ? 'favorite' : ''}" data-id="${instruction.id}" title="${instruction.favorite ? 'Убрать из избранного' : 'Добавить в избранное'}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${instruction.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </button>
                    <button class="edit-instruction" data-id="${instruction.id}">Редактировать</button>
                    <button class="delete-instruction" data-id="${instruction.id}">Удалить</button>
                </div>
            `;
            
            instructionsList.appendChild(li);
        });
    }

    showInstructionsList() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('instructions-view').classList.remove('hidden');
        document.getElementById('editor-view').classList.add('hidden');
    }

    showEditor() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('instructions-view').classList.add('hidden');
        document.getElementById('editor-view').classList.remove('hidden');
    }

    editInstruction(id) {
        this.currentInstructionId = id;
        const instruction = this.storage.getInstruction(id);

        if (instruction) {
            this.showEditor();
            const event = new CustomEvent('loadInstruction', { detail: { instruction } });
            document.dispatchEvent(event);
        }
    }

    showGroupModal(group = null) {
        const modal = document.getElementById('group-modal');
        const title = document.getElementById('modal-title');
        const input = document.getElementById('group-name');
        
        if (group) {
            title.textContent = 'Редактировать группу';
            input.value = group.name;
            modal.dataset.editingId = group.id;
        } else {
            title.textContent = 'Добавить группу';
            input.value = '';
            delete modal.dataset.editingId;
        }
        
        modal.classList.remove('hidden');
    }

    handleGroupSubmit() {
        const name = document.getElementById('group-name').value;
        const modal = document.getElementById('group-modal');
        const editingId = modal.dataset.editingId;
        
        if (editingId) {
            this.storage.updateGroup(editingId, name);
        } else {
            this.storage.addGroup(name);
        }
        
        this.renderGroups();
        this.hideModal('group-modal');
    }

    confirmDelete(type, id) {
        const modal = document.getElementById('confirm-modal');
        const message = document.getElementById('confirm-message');
        
        const itemName = type === 'group' ? 'группу' : 'инструкцию';
        message.textContent = `Вы уверены, что хотите удалить ${itemName}?`;
        
        modal.dataset.type = type;
        modal.dataset.id = id;
        modal.classList.remove('hidden');
        
        document.getElementById('confirm-ok').onclick = () => {
            this.handleDelete(type, id);
            this.hideModal('confirm-modal');
        };
    }

    handleDelete(type, id) {
        if (type === 'group') {
            this.storage.deleteGroup(id);
            this.renderGroups();
            document.getElementById('instructions-view').classList.add('hidden');
            document.getElementById('welcome-screen').classList.remove('hidden');
        } else {
            this.storage.deleteInstruction(id);
            if (this.currentGroupId) {
                this.renderInstructions(this.currentGroupId);
            }
        }
    }

    toggleFavorite(id) {
        this.storage.toggleFavorite(id);
        // Обновить рендер, но чтобы не перерисовывать все, просто обновить кнопку
        const btn = document.querySelector(`.favorite-btn[data-id="${id}"]`);
        if (btn) {
            const instruction = this.storage.getInstruction(id);
            const isFavorite = instruction.favorite;
            btn.classList.toggle('favorite', isFavorite);
            btn.setAttribute('title', isFavorite ? 'Убрать из избранного' : 'Добавить в избранное');
            const svg = btn.querySelector('svg');
            svg.setAttribute('fill', isFavorite ? 'currentColor' : 'none');
        }
        // Обновить welcome screen если нужно
        this.updateWelcomeScreen();
    }

    updateWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcome-screen');
        const favoriteInstructions = this.storage.getFavoriteInstructions();

        if (favoriteInstructions.length > 0) {
            let html = '<h2>Избранные инструкции</h2><ul class="favorites-list">';
            favoriteInstructions.forEach(inst => {
                const group = this.storage.getGroups().find(g => g.id === inst.groupId);
                const groupName = group ? group.name : 'Неизвестная группа';
                html += `<li class="favorite-item">
                    <div class="favorite-info">
                        <a href="#" onclick="selectFavorite(${inst.id}); return false;">
                            <strong>${inst.title}</strong> (${groupName})
                        </a>
                    </div>
                    <div class="instruction-actions">
                        <button class="favorite-btn favorite" data-id="${inst.id}" title="Убрать из избранного">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        </button>
                        <button class="edit-instruction" data-id="${inst.id}">Редактировать</button>
                        <button class="delete-instruction" data-id="${inst.id}">Удалить</button>
                    </div>
                </li>`;
            });
            html += '</ul><p>Или выберите группу слева, чтобы начать работу с инструкциями.</p>';
            welcomeScreen.innerHTML = html;
        } else {
            welcomeScreen.innerHTML = '<h2>Добро пожаловать!</h2><p>Выберите группу слева, чтобы начать работу с инструкциями.</p>';
        }
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
}
