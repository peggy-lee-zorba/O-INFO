/**
 * Enhanced Editor Module with File System Support
 * Улучшенный редактор с поддержкой файловой системы
 */

document.addEventListener('DOMContentLoaded', () => {
    let editingInstructionId = null;
    let searchTimeout = null;

    // === КНОПКИ ===
    const buttons = {
        addGroupBtn: document.getElementById('add-group-btn'),
        saveGroupBtn: document.getElementById('save-group-btn'),
        addInstructionBtn: document.getElementById('add-instruction-btn'),
        saveInstructionBtn: document.getElementById('save-instruction-btn'),
        uploadHtmlBtn: document.getElementById('upload-html-btn'),
        htmlFileInput: document.getElementById('html-file-input'),
        imageGalleryBtn: document.getElementById('image-gallery-btn'),
        statisticsBtn: document.getElementById('statistics-btn'),
        exportBtn: document.getElementById('export-btn'),
        insertImageBtn: document.getElementById('insert-image-btn'),
        previewBtn: document.getElementById('preview-btn'),
        searchInput: document.getElementById('search-input'),
        toggleFavoritesBtn: document.getElementById('toggle-favorites-btn'),
        uploadImageBtn: document.getElementById('upload-image-btn'),
        imageFileInput: document.getElementById('image-file-input')
    };

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    
    // Группа
    if (buttons.addGroupBtn) {
        buttons.addGroupBtn.addEventListener('click', () => {
            ui.showGroupModal();
        });
    }

    if (buttons.saveGroupBtn) {
        buttons.saveGroupBtn.addEventListener('click', () => {
            const name = document.getElementById('group-name')?.value.trim();
            if (name && name.length >= 2) {
                window.app.addGroup(name);
                ui.closeGroupModal();
                ui.showNotification('Группа создана успешно', 'success');
            } else {
                ui.showNotification('Название группы должно содержать минимум 2 символа', 'error');
            }
        });
    }

    // Инструкции
    if (buttons.addInstructionBtn) {
        buttons.addInstructionBtn.addEventListener('click', () => {
            if (!window.app.activeGroupId || window.app.activeGroupId === 'favorites') {
                ui.showNotification('Сначала выберите группу (не "Главная")', 'warning');
                return;
            }
            editingInstructionId = null;
            ui.showEditor('Новая инструкция');
        });
    }

    if (buttons.saveInstructionBtn) {
        buttons.saveInstructionBtn.addEventListener('click', async () => {
            const name = document.getElementById('instruction-name')?.value.trim();
            const content = document.getElementById('instruction-content')?.value.trim();
            
            if (!name || name.length < 1) {
                ui.showNotification('Введите название инструкции', 'error');
                return;
            }
            
            if (!content || content.length < 10) {
                ui.showNotification('Содержимое инструкции слишком короткое', 'error');
                return;
            }

            // Проверяем, редактируем ли существующую инструкцию
            const editorModal = document.getElementById('editor-modal');
            const editingId = editorModal?.dataset.editingId;
            
            try {
                if (editingId) {
                    await window.app.updateInstruction(editingId, name, content);
                    ui.showNotification('Инструкция обновлена', 'success');
                } else {
                    await window.app.addInstruction(name, content);
                    ui.showNotification('Инструкция создана', 'success');
                }
                ui.closeEditor();
            } catch (error) {
                console.error('Ошибка сохранения инструкции:', error);
                ui.showNotification('Ошибка при сохранении инструкции', 'error');
            }
        });
    }

    // Загрузка HTML файлов
    if (buttons.uploadHtmlBtn && buttons.htmlFileInput) {
        buttons.uploadHtmlBtn.addEventListener('click', () => {
            buttons.htmlFileInput.click();
        });

        buttons.htmlFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                let content = e.target.result;
                const nameFromTitle = extractTitleFromHTML(content) || file.name.replace(/\.[^/.]+$/, "");
                
                document.getElementById('instruction-name').value = nameFromTitle;
                document.getElementById('instruction-content').value = content;
                ui.showNotification('HTML файл загружен', 'success');
            };
            reader.onerror = () => {
                ui.showNotification('Ошибка чтения файла', 'error');
            };
            reader.readAsText(file, 'utf-8');
        });
    }

    // Новые функции для улучшенного интерфейса
    if (buttons.imageGalleryBtn) {
        buttons.imageGalleryBtn.addEventListener('click', () => {
            ui.showImageGallery();
        });
    }

    if (buttons.statisticsBtn) {
        buttons.statisticsBtn.addEventListener('click', () => {
            toggleStatistics();
        });
    }

    if (buttons.exportBtn) {
        buttons.exportBtn.addEventListener('click', () => {
            ui.showExportModal();
        });
    }

    if (buttons.insertImageBtn) {
        buttons.insertImageBtn.addEventListener('click', () => {
            ui.showImageGallery();
        });
    }

    if (buttons.previewBtn) {
        buttons.previewBtn.addEventListener('click', () => {
            const name = document.getElementById('instruction-name')?.value.trim();
            const content = document.getElementById('instruction-content')?.value.trim();
            
            if (name && content) {
                ui.showPreview(name, content);
            } else {
                ui.showNotification('Заполните название и содержимое для предварительного просмотра', 'warning');
            }
        });
    }

    // Поиск
    if (buttons.searchInput) {
        buttons.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                searchInstructions(query);
            }, 300);
        });
    }

    if (buttons.toggleFavoritesBtn) {
        buttons.toggleFavoritesBtn.addEventListener('click', () => {
            toggleFavoritesView();
        });
    }

    // Закрытие модальных окон
    const closeButtons = ['close-editor', 'close-group', 'close-preview', 'close-gallery'];
    closeButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });

    // Загрузка изображений из галереи
    if (buttons.uploadImageBtn && buttons.imageFileInput) {
        buttons.uploadImageBtn.addEventListener('click', () => {
            buttons.imageFileInput.click();
        });

        buttons.imageFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                ui.showNotification('Поддерживаются только изображения', 'error');
                return;
            }

            try {
                const result = await window.app.uploadImage(file);
                if (result) {
                    ui.showNotification('Изображение загружено', 'success');
                    // Обновляем галерею если она открыта
                    const galleryModal = document.getElementById('gallery-modal');
                    if (galleryModal && !galleryModal.classList.contains('hidden')) {
                        ui.updateImageGrid(document.getElementById('image-grid'));
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки изображения:', error);
                ui.showNotification('Ошибка загрузки изображения', 'error');
            }
        });
    }

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

    // Извлечение заголовка из HTML
    function extractTitleFromHTML(html) {
        const match = html.match(/<title>([^<]*)<\/title>/i);
        if (match) return match[1].trim();
        
        const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        if (h1Match) return h1Match[1].trim();
        
        return null;
    }

    // Поиск инструкций
    function searchInstructions(query) {
        if (!query) {
            window.app.renderInstructions();
            return;
        }

        const allInstructions = window.app.data?.instructions || [];
        const filteredInstructions = allInstructions.filter(instruction => 
            instruction.name.toLowerCase().includes(query.toLowerCase()) ||
            instruction.content.toLowerCase().includes(query.toLowerCase())
        );

        ui.renderInstructions(filteredInstructions, window.app.activeGroupId === 'favorites');
        
        const resultCount = filteredInstructions.length;
        if (resultCount === 0) {
            ui.showNotification(`По запросу "${query}" ничего не найдено`, 'info');
        }
    }

    // Переключение режима избранного
    function toggleFavoritesView() {
        const btn = buttons.toggleFavoritesBtn;
        const isShowingFavorites = btn.textContent.includes('Все');
        
        if (isShowingFavorites) {
            btn.textContent = '⭐ Показать избранные';
            window.app.renderInstructions();
        } else {
            btn.textContent = '📋 Показать все';
            const favorites = window.app.data?.instructions.filter(i => i.favorite) || [];
            ui.renderInstructions(favorites, true);
        }
    }

    // Переключение панели статистики
    function toggleStatistics() {
        const statsPanel = document.getElementById('stats-panel');
        const btn = buttons.statisticsBtn;
        
        if (statsPanel.classList.contains('hidden')) {
            // Показываем статистику
            updateStatistics();
            statsPanel.classList.remove('hidden');
            btn.textContent = '📊 Скрыть статистику';
            btn.classList.add('active');
        } else {
            // Скрываем статистику
            statsPanel.classList.add('hidden');
            btn.textContent = '📊 Статистика';
            btn.classList.remove('active');
        }
    }

    // Обновление статистики
    function updateStatistics() {
        if (!window.app.data) return;

        const stats = window.app.getStatistics();
        
        document.getElementById('stat-instructions').textContent = stats.totalInstructions;
        document.getElementById('stat-groups').textContent = stats.totalGroups;
        document.getElementById('stat-images').textContent = stats.totalImages;
        document.getElementById('stat-favorites').textContent = stats.favoritesCount;
        document.getElementById('storage-mode').textContent = 
            stats.storageMode === 'filesystem' ? 'Файловая система' : 'LocalStorage';
    }

    // Обновление статистики при изменении данных
    document.addEventListener('dataUpdated', updateStatistics);

    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S для сохранения
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const editorModal = document.getElementById('editor-modal');
            if (editorModal && !editorModal.classList.contains('hidden')) {
                buttons.saveInstructionBtn?.click();
            }
        }
        
        // Escape для закрытия модальных окон
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal:not(.hidden)');
            if (openModal) {
                openModal.classList.add('hidden');
            }
        }
    });

    // Инициализация
    console.log('✅ Enhanced Editor initialized');
});

// === ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ ===
// Функция для создания демонстрационных данных
window.createDemoData = async function() {
    const demoInstructions = [
        {
            name: "Как отправить электронное письмо",
            content: `
                <h1>Отправка электронного письма</h1>
                <h2>Пошаговая инструкция:</h2>
                <ol>
                    <li>Откройте почтовый клиент</li>
                    <li>Нажмите кнопку "Написать"</li>
                    <li>Укажите адрес получателя</li>
                    <li>Введите тему письма</li>
                    <li>Напишите текст сообщения</li>
                    <li>Приложите файлы при необходимости</li>
                    <li>Нажмите "Отправить"</li>
                </ol>
                <p><strong>Важно:</strong> Проверьте правильность адреса перед отправкой!</p>
            `,
            groupId: 'mail'
        },
        {
            name: "Оплата коммунальных услуг онлайн",
            content: `
                <h1>Оплата ЖКХ через интернет</h1>
                <h2>Способы оплаты:</h2>
                <ul>
                    <li>Банковское приложение</li>
                    <li>Госуслуги</li>
                    <li>Сайт управляющей компании</li>
                </ul>
                <h3>Алгоритм действий:</h3>
                <ol>
                    <li>Войдите в личный кабинет</li>
                    <li>Выберите раздел "Коммунальные услуги"</li>
                    <li>Введите данные лицевого счета</li>
                    <li>Проверьте сумму к оплате</li>
                    <li>Подтвердите платеж</li>
                </ol>
            `,
            groupId: 'jkh'
        },
        {
            name: "Покупки в интернет-магазинах",
            content: `
                <h1>Безопасные покупки в интернете</h1>
                <h2>На что обратить внимание:</h2>
                <div class="warning">
                    <p>⚠️ Проверяйте надежность сайта перед покупкой!</p>
                </div>
                <h3>Пошаговый процесс:</h3>
                <ol>
                    <li>Найдите товар через поиск или каталог</li>
                    <li>Изучите описание и отзывы</li>
                    <li>Добавьте в корзину</li>
                    <li>Оформите заказ</li>
                    <li>Выберите способ доставки</li>
                    <li>Оплатите покупку</li>
                </ol>
                <p>💡 <strong>Совет:</strong> Сохраняйте чеки и скриншоты заказов</p>
            `,
            groupId: 'shops'
        }
    ];

    try {
        for (const instruction of demoInstructions) {
            await window.app.addInstruction(instruction.name, instruction.content);
        }
        ui.showNotification('Демонстрационные данные загружены', 'success');
    } catch (error) {
        console.error('Ошибка создания демо-данных:', error);
        ui.showNotification('Ошибка загрузки демо-данных', 'error');
    }
};
