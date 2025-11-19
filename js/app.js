// В класс App добавим метод для отображения главной страницы
showHome() {
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('instructions-grid').classList.add('hidden');
    document.getElementById('editor-view').classList.add('hidden');
    
    // Сбросить активную группу в навигации
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
    });
    this.ui.currentGroupId = null;
}

// Обновим initDemoData для использования новых групп
initDemoData() {
    const hasData = this.storage.getGroups().length > 0;
    
    if (!hasData) {
        // Демо-группы
        const mailGroup = this.storage.addGroup('Почта');
        const utilitiesGroup = this.storage.addGroup('ЖКХ');
        const shopsGroup = this.storage.addGroup('Магазины');

        // Демо-инструкции
        this.storage.addInstruction(mailGroup.id, {
            title: 'Как настроить почтовый клиент',
            steps: [
                { content: '<p>Откройте настройки почтового клиента в вашей программе.</p>' },
                { content: '<p>Введите адрес сервера: <code>mail.example.com</code></p>' },
                { content: '<p>Укажите порт 587 для SMTP.</p>' }
            ]
        });

        this.storage.addInstruction(utilitiesGroup.id, {
            title: 'Оплата коммунальных услуг',
            steps: [
                { content: '<p>Войдите в личный кабинет на сайте вашей управляющей компании.</p>' },
                { content: '<p>Выберите раздел "Коммунальные услуги".</p>' },
                { content: '<p>Следуйте инструкциям для оплаты.</p>' }
            ]
        });
    }
}