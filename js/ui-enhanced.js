/**
 * Enhanced UI Module with Notifications and File System Support
 * Улучшенный UI модуль с системой уведомлений и поддержкой файловой системы
 */

const ui = {
    // Основные методы рендеринга (остаются без изменений)
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
                    <button class="edit-btn" data-id="${instr.id}" title="Редактировать">✏️</button>
                    <button class="delete-btn" data-id="${instr.id}" title="Удалить">×</button>
                </div>
            `;
            list.appendChild(el);

            // Обработчик клика по всей плашке
            el.addEventListener('click', (e) => {
                if (!e.target.classList.contains('favorite-star') && 
                    !e.target.classList.contains('delete-btn') &&
                    !e.target.classList.contains('edit-btn')) {
                    this.showPreview(instr.name, instr.content);
                }
            });

            // Обработчики для кнопок
            el.querySelector('.favorite-star').addEventListener('click', (e) => {
                e.stopPropagation();
                window.app.toggleFavorite(instr.id);
            });

            el.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(instr);
            });

            el.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Удалить инструкцию "${instr.name}"?`)) {
                    window.app.deleteInstruction(instr.id);
                }
            });
        });
    },

    // === СИСТЕМА УВЕДОМЛЕНИЙ ===
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Добавляем в контейнер уведомлений
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Автоматическое удаление
        const timeoutId = setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Кнопка закрытия
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.removeNotification(notification);
        });
        
        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 10);
    },

    removeNotification(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    // === УЛУЧШЕННЫЙ ПРЕВЬЮ ===
    async showPreview(title, content) {
        // Если поддерживается файловая система, загружаем актуальное содержимое
        if (window.app.isFileSystemMode) {
            const instruction = window.app.data.instructions.find(i => i.name === title);
            if (instruction) {
                content = await window.app.loadInstructionContent(instruction);
            }
        }

        document.getElementById('preview-title').textContent = title;
        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = content;
        
        // Проверяем и обрабатываем изображения в контенте
        this.processPreviewImages(previewContent);
        
        document.getElementById('preview-modal').classList.remove('hidden');
    },

    processPreviewImages(container) {
        const imgTags = container.querySelectorAll('img');
        imgTags.forEach(img => {
            // Если изображение ссылается на файл из нашей системы
            if (img.dataset.fileName) {
                const imageData = window.app.data.images.find(imgData => 
                    imgData.fileName === img.dataset.fileName
                );
                if (imageData) {
                    img.src = imageData.url;
                    img.alt = imageData.name || 'Изображение';
                }
            }
        });
    },

    // === МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ===
    showEditModal(instruction) {
        document.getElementById('editor-title').textContent = 'Редактирование инструкции';
        document.getElementById('instruction-name').value = instruction.name;
        document.getElementById('instruction-content').value = instruction.content;
        
        // Добавляем информацию об ID редактируемой инструкции
        document.getElementById('editor-modal').dataset.editingId = instruction.id;
        document.getElementById('editor-modal').classList.remove('hidden');
    },

    // === ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ ===
    showImageGallery() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Галерея изображений</h3>
                <div class="image-gallery">
                    <div class="image-grid" id="image-grid">
                        ${this.renderImageGrid()}
                    </div>
                    <div class="upload-section">
                        <button id="upload-image-btn" class="btn-primary">📁 Загрузить изображение</button>
                        <input type="file" id="image-file-input" accept="image/*" style="display: none;" />
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="close-gallery-btn">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.remove('hidden');

        // Обработчики
        modal.querySelector('#close-gallery-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#upload-image-btn').addEventListener('click', () => {
            modal.querySelector('#image-file-input').click();
        });

        modal.querySelector('#image-file-input').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const result = await window.app.uploadImage(file);
                if (result) {
                    this.updateImageGrid(modal.querySelector('#image-grid'));
                    this.showNotification('Изображение загружено', 'success');
                }
            }
        });

        // Обработчики удаления изображений
        modal.querySelectorAll('.delete-image-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const imageId = e.target.dataset.imageId;
                if (confirm('Удалить изображение?')) {
                    const success = await window.app.deleteImage(imageId);
                    if (success) {
                        this.updateImageGrid(modal.querySelector('#image-grid'));
                        this.showNotification('Изображение удалено', 'success');
                    }
                }
            });
        });
    },

    renderImageGrid() {
        if (!window.app.data || !window.app.data.images) {
            return '<p>Нет изображений</p>';
        }

        return window.app.data.images.map(image => `
            <div class="image-item">
                <img src="${image.url}" alt="${image.name}" title="${image.name}">
                <div class="image-actions">
                    <button class="insert-image-btn" data-image-id="${image.id}">📎</button>
                    <button class="delete-image-btn" data-image-id="${image.id}">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    updateImageGrid(grid) {
        grid.innerHTML = this.renderImageGrid();
        
        // Переназначаем обработчики
        grid.querySelectorAll('.insert-image-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const imageId = e.target.dataset.imageId;
                const image = window.app.data.images.find(img => img.id === imageId);
                if (image) {
                    this.insertImageIntoEditor(image);
                }
            });
        });

        grid.querySelectorAll('.delete-image-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const imageId = e.target.dataset.imageId;
                if (confirm('Удалить изображение?')) {
                    const success = await window.app.deleteImage(imageId);
                    if (success) {
                        this.updateImageGrid(grid);
                        this.showNotification('Изображение удалено', 'success');
                    }
                }
            });
        });
    },

    insertImageIntoEditor(image) {
        const textarea = document.getElementById('instruction-content');
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);
        
        const imgHTML = `<img src="${image.url}" alt="${image.name}" data-file-name="${image.fileName}" style="max-width: 100%; height: auto;">`;
        const newText = textBefore + imgHTML + textAfter;
        
        textarea.value = newText;
        textarea.focus();
        
        // Показываем уведомление
        this.showNotification('Изображение вставлено в редактор', 'success');
    },

    // === ЭКСПОРТ/ИМПОРТ ===
    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Экспорт данных</h3>
                <p>Скачать резервную копию всех данных?</p>
                <div class="storage-info">
                    <p>Режим хранения: <strong>${window.app.isFileSystemMode ? 'Файловая система' : 'LocalStorage'}</strong></p>
                    <p>Инструкций: ${window.app.getStatistics().totalInstructions}</p>
                    <p>Изображений: ${window.app.getStatistics().totalImages}</p>
                </div>
                <div class="modal-actions">
                    <button id="export-btn" class="btn-primary">💾 Скачать бэкап</button>
                    <button id="cancel-export-btn">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.remove('hidden');

        modal.querySelector('#export-btn').addEventListener('click', async () => {
            await window.app.exportData();
            this.showNotification('Бэкап скачан', 'success');
            document.body.removeChild(modal);
        });

        modal.querySelector('#cancel-export-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    },

    // === СТАТИСТИКА ===
    showStatistics() {
        const stats = window.app.getStatistics();
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Статистика</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalInstructions}</span>
                        <span class="stat-label">Инструкций</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalGroups}</span>
                        <span class="stat-label">Групп</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalImages}</span>
                        <span class="stat-label">Изображений</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.favoritesCount}</span>
                        <span class="stat-label">Избранных</span>
                    </div>
                </div>
                <p class="storage-mode">Режим хранения: <strong>${stats.storageMode}</strong></p>
                <div class="modal-actions">
                    <button id="close-stats-btn">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.remove('hidden');

        modal.querySelector('#close-stats-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    },

    // Основные методы (без изменений)
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
        
        // Очищаем ID редактируемой инструкции
        document.getElementById('editor-modal').dataset.editingId = '';
        document.getElementById('editor-modal').classList.remove('hidden');
    },

    closeEditor() {
        // Очищаем ID редактируемой инструкции
        document.getElementById('editor-modal').dataset.editingId = '';
        document.getElementById('editor-modal').classList.add('hidden');
    }
};

// Базовые обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    // Закрытие модалок
    const closeButtons = ['close-preview-btn', 'cancel-group-btn', 'cancel-instruction-btn'];
    closeButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => ui.closePreview());
        }
    });

    // Клик по "Главная"
    const homeLink = document.querySelector('.home-link');
    if (homeLink) {
        homeLink.addEventListener('click', () => {
            window.app.setActiveGroup('favorites');
        });
    }

    // Инициализация уведомлений
    ui.showNotification('Приложение O-INFO инициализировано', 'info', 2000);
});

// Экспорт для использования в других модулях
window.ui = ui;
