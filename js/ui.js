export class UIManager {
    constructor(storage) {
        this.storage = storage;
        this.currentGroupId = null;
        this.currentInstructionId = null;
    }

    init() {
        this.renderGroups();
        this.setupEventListeners();
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

        document.getElementById('back-to-list').addEventListener('click', () => {
            this.showInstructionsList();
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

    selectGroup(groupId) {
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
                    <button class="edit-instruction" data-id="${instruction.id}">Редактировать</button>
                    <button class="delete-instruction" data-id="${instruction.id}">Удалить</button>
                </div>
            `;
            
            instructionsList.appendChild(li);
        });

        // Обработчики
        document.querySelectorAll('.edit-instruction').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.editInstruction(id);
            });
        });

        document.querySelectorAll('.delete-instruction').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.confirmDelete('instruction', id);
            });
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
            this.populateEditor(instruction);
        }
    }

    populateEditor(instruction) {
        document.getElementById('instruction-title').value = instruction.title;
        document.getElementById('editor-title').textContent = 'Редактирование инструкции';
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

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
}