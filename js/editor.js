export class EditorManager {
    constructor(storage) {
        this.storage = storage;
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Сохранение инструкции
        document.getElementById('save-instruction').addEventListener('click', () => {
            this.saveInstruction();
        });

        // Форма
        document.getElementById('instruction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInstruction();
        });
    }

    reset() {
        document.getElementById('instruction-title').value = '';
        document.getElementById('instruction-html').value = '';
        document.getElementById('editor-title').textContent = 'Новая инструкция';
    }

    saveInstruction() {
        const title = document.getElementById('instruction-title').value;
        const html = document.getElementById('instruction-html').value;
        const groupId = this.getCurrentGroupId();

        if (!title.trim()) {
            alert('Введите заголовок инструкции');
            return;
        }

        if (!html.trim()) {
            alert('Введите HTML контент инструкции');
            return;
        }

        const instructionData = {
            title,
            html
        };

        this.storage.addInstruction(groupId, instructionData);

        // Возврат к списку
        this.reset();
        document.getElementById('instructions-view').classList.remove('hidden');
        document.getElementById('editor-view').classList.add('hidden');

        // Обновить список
        const event = new CustomEvent('instructionsUpdated', { detail: { groupId } });
        document.dispatchEvent(event);
    }

    getCurrentGroupId() {
        const activeGroup = document.querySelector('.group-item.active');
        return activeGroup ? activeGroup.dataset.groupId : null;
    }
}
