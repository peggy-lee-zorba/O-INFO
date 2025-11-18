export class EditorManager {
    constructor(storage) {
        this.storage = storage;
        this.steps = [];
        this.currentEditingId = null;
    }

    init() {
        this.setupEventListeners();
        this.addStep(); // Добавить первый шаг по умолчанию
    }

    setupEventListeners() {
        // Добавление шага
        document.getElementById('add-step-btn').addEventListener('click', () => {
            this.addStep();
        });

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

    addStep(content = '', image = null) {
        const container = document.getElementById('steps-container');
        const stepIndex = this.steps.length;
        
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-item';
        stepDiv.dataset.stepIndex = stepIndex;
        
        stepDiv.innerHTML = `
            <div class="step-header">
                <span class="step-number">Шаг ${stepIndex + 1}</span>
                <div class="step-actions">
                    <button type="button" class="move-up" title="Вверх">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </button>
                    <button type="button" class="move-down" title="Вниз">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <button type="button" class="delete-step" title="Удалить">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <textarea class="step-content" placeholder="Опишите шаг...">${content}</textarea>
            <div class="image-upload">
                <label for="image-${stepIndex}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Добавить изображение
                </label>
                <input type="file" id="image-${stepIndex}" accept="image/*">
                <div class="image-preview" id="preview-${stepIndex}"></div>
            </div>
        `;
        
        container.appendChild(stepDiv);
        this.steps.push({ content, image });
        
        // Обработчики для шага
        this.setupStepHandlers(stepDiv, stepIndex);
    }

    setupStepHandlers(stepDiv, stepIndex) {
        // Удаление шага
        stepDiv.querySelector('.delete-step').addEventListener('click', () => {
            this.removeStep(stepIndex);
        });

        // Перемещение
        stepDiv.querySelector('.move-up').addEventListener('click', () => {
            this.moveStep(stepIndex, -1);
        });

        stepDiv.querySelector('.move-down').addEventListener('click', () => {
            this.moveStep(stepIndex, 1);
        });

        // Изображение
        const fileInput = stepDiv.querySelector('input[type="file"]');
        fileInput.addEventListener('change', (e) => {
            this.handleImageUpload(e, stepIndex);
        });

        // Обновление контента
        const textarea = stepDiv.querySelector('.step-content');
        textarea.addEventListener('input', (e) => {
            this.steps[stepIndex].content = e.target.value;
        });
    }

    removeStep(index) {
        this.steps.splice(index, 1);
        this.reRenderSteps();
    }

    moveStep(index, direction) {
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < this.steps.length) {
            [this.steps[index], this.steps[newIndex]] = [this.steps[newIndex], this.steps[index]];
            this.reRenderSteps();
        }
    }

    reRenderSteps() {
        const container = document.getElementById('steps-container');
        container.innerHTML = '';
        
        this.steps.forEach((step, index) => {
            this.addStep(step.content, step.image);
        });
    }

    handleImageUpload(e, stepIndex) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.steps[stepIndex].image = e.target.result;
            this.showImagePreview(stepIndex, e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(stepIndex, imageSrc) {
        const preview = document.getElementById(`preview-${stepIndex}`);
        preview.innerHTML = `
            <img src="${imageSrc}" alt="Preview" style="max-width: 200px; margin-top: 8px; border-radius: 4px;">
        `;
    }

    reset() {
        this.steps = [];
        this.currentEditingId = null;
        document.getElementById('instruction-title').value = '';
        document.getElementById('steps-container').innerHTML = '';
        document.getElementById('editor-title').textContent = 'Новая инструкция';
        this.addStep();
    }

    loadInstruction(instruction) {
        this.currentEditingId = instruction.id;
        document.getElementById('instruction-title').value = instruction.title;
        document.getElementById('editor-title').textContent = 'Редактирование инструкции';
        
        this.steps = [...instruction.steps];
        this.reRenderSteps();
    }

    saveInstruction() {
        const title = document.getElementById('instruction-title').value;
        const groupId = this.getCurrentGroupId();
        
        if (!title.trim()) {
            alert('Введите заголовок инструкции');
            return;
        }

        if (this.steps.length === 0 || this.steps.every(s => !s.content.trim())) {
            alert('Добавьте至少 один шаг');
            return;
        }

        const instructionData = {
            title,
            steps: this.steps.filter(s => s.content.trim())
        };

        if (this.currentEditingId) {
            this.storage.updateInstruction(this.currentEditingId, instructionData);
        } else {
            this.storage.addInstruction(groupId, instructionData);
        }

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