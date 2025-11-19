export class EditorManager {
    constructor(storage) {
        this.storage = storage;
        this.currentInstructionId = null;
        this.steps = [];
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

        // Добавление шага
        document.getElementById('add-step').addEventListener('click', () => {
            this.addStep();
        });

        // Делегирование событий для шагов
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-step')) {
                e.stopPropagation();
                const stepElement = e.target.closest('.step-item');
                this.deleteStep(stepElement);
            }
            if (e.target.closest('.move-step-up')) {
                e.stopPropagation();
                const stepElement = e.target.closest('.step-item');
                this.moveStepUp(stepElement);
            }
            if (e.target.closest('.move-step-down')) {
                e.stopPropagation();
                const stepElement = e.target.closest('.step-item');
                this.moveStepDown(stepElement);
            }
        });

        // Обработка изменения изображений
        document.addEventListener('change', (e) => {
            if (e.target.matches('.step-image-input')) {
                this.handleImageUpload(e.target);
            }
        });

        // Форматирование текста
        document.addEventListener('click', (e) => {
            if (e.target.matches('.format-btn')) {
                const command = e.target.dataset.command;
                document.execCommand(command, false, null);
                e.target.closest('[contenteditable]').focus();
            }
        });
    }

    showEditor(instructionId = null) {
        this.currentInstructionId = instructionId;

        if (instructionId) {
            const instruction = this.storage.getInstruction(instructionId);
            if (instruction) {
                document.getElementById('editor-title').textContent = 'Редактировать инструкцию';
                document.getElementById('instruction-title').value = instruction.title;
                this.steps = instruction.steps || [];
                this.renderSteps();
            }
        } else {
            this.reset();
        }
    }

    reset() {
        document.getElementById('instruction-title').value = '';
        document.getElementById('editor-title').textContent = 'Новая инструкция';
        this.steps = [];
        this.renderSteps();
        this.currentInstructionId = null;
    }

    addStep(content = '', image = null) {
        const step = {
            content: content || '<p>Введите текст шага...</p>',
            image: image
        };
        this.steps.push(step);
        this.renderSteps();
        // Фокус на новый шаг
        setTimeout(() => {
            const steps = document.querySelectorAll('.step-content');
            const lastStep = steps[steps.length - 1];
            if (lastStep) {
                lastStep.focus();
            }
        }, 10);
    }

    deleteStep(stepElement) {
        const index = Array.from(stepElement.parentElement.children).indexOf(stepElement);
        if (index > -1) {
            this.steps.splice(index, 1);
            this.renderSteps();
        }
    }

    moveStepUp(stepElement) {
        const index = Array.from(stepElement.parentElement.children).indexOf(stepElement);
        if (index > 0) {
            [this.steps[index], this.steps[index - 1]] = [this.steps[index - 1], this.steps[index]];
            this.renderSteps();
        }
    }

    moveStepDown(stepElement) {
        const index = Array.from(stepElement.parentElement.children).indexOf(stepElement);
        if (index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.renderSteps();
        }
    }

    handleImageUpload(input) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const stepElement = input.closest('.step-item');
                const index = Array.from(stepElement.parentElement.children).indexOf(stepElement);
                this.steps[index].image = e.target.result;
                this.renderSteps();
            };
            reader.readAsDataURL(file);
        }
    }

    renderSteps() {
        const stepsList = document.getElementById('steps-list');
        stepsList.innerHTML = '';

        this.steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'step-item';
            stepElement.innerHTML = `
                <div class="step-header">
                    <span class="step-number">Шаг ${index + 1}</span>
                    <div class="step-actions">
                        <button class="move-step-up" title="Переместить вверх">&uarr;</button>
                        <button class="move-step-down" title="Переместить вниз">&darr;</button>
                        <button class="delete-step" title="Удалить шаг">&times;</button>
                    </div>
                </div>
                <div class="step-editor">
                    <div class="format-toolbar">
                        <button class="format-btn" data-command="bold" title="Жирный"><strong>B</strong></button>
                        <button class="format-btn" data-command="italic" title="Курсив"><em>I</em></button>
                        <button class="format-btn" data-command="underline" title="Подчеркнутый"><u>U</u></button>
                        <input type="file" class="step-image-input" accept="image/*" style="display: none;">
                        <button class="image-btn" title="Добавить изображение">🖼️</button>
                    </div>
                    <div class="step-content" contenteditable="true">${step.content}</div>
                    ${step.image ? `<div class="step-image-preview"><img src="${step.image}" alt="Изображение шага"><button class="remove-image">&times;</button></div>` : ''}
                </div>
            `;
            stepsList.appendChild(stepElement);
        });

        // Обработчики toolbar
        document.querySelectorAll('.image-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                input.click();
            });
        });

        document.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', () => {
                const preview = btn.closest('.step-image-preview');
                const stepElement = preview.closest('.step-item');
                const index = Array.from(stepElement.parentElement.children).indexOf(stepElement);
                this.steps[index].image = null;
                this.renderSteps();
            });
        });
    }

    saveInstruction() {
        const title = document.getElementById('instruction-title').value.trim();
        const groupId = this.getCurrentGroupId();

        if (!title) {
            alert('Введите заголовок инструкции');
            return;
        }

        if (this.steps.length === 0) {
            alert('Добавьте хотя бы один шаг');
            return;
        }

        // Сохранить текущий контент шагов
        this.saveCurrentStepContent();

        const instructionData = {
            title,
            steps: this.steps,
            html: this.storage.generateHtmlFromSteps(this.steps)
        };

        if (this.currentInstructionId) {
            // Обновление
            this.storage.updateInstruction(this.currentInstructionId, instructionData);
        } else {
            // Создание
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

    saveCurrentStepContent() {
        document.querySelectorAll('.step-content').forEach((contentEditable, index) => {
            if (this.steps[index]) {
                this.steps[index].content = contentEditable.innerHTML;
            }
        });
    }

    getCurrentGroupId() {
        const activeGroup = document.querySelector('.group-item.active');
        return activeGroup ? activeGroup.dataset.groupId : null;
    }
}
