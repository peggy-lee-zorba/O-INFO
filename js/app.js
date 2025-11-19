import { AuthManager } from './auth.js';
import { Storage } from './storage.js';
import { UIManager } from './ui.js';
import { EditorManager } from './editor.js';

class App {
    constructor() {
        this.auth = new AuthManager();
        this.storage = new Storage();
        this.ui = new UIManager(this.storage, null); // временно null для editor
        this.editor = new EditorManager(this.storage);
        this.ui = new UIManager(this.storage, this.editor); // теперь с editor

        this.init();
    }

    init() {
        // Инициализация приложения
        if (this.auth.isAuthenticated()) {
            this.showMainApp();
        } else {
            this.showLogin();
        }

        // Назначение обработчиков
        this.setupEventListeners();

        // Демо-данные при первом запуске
        this.initDemoData();
    }

    setupEventListeners() {
        // Обработка аутентификации
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Login form submitted'); // Для отладки
            const login = document.getElementById('login').value;
            const password = document.getElementById('password').value;
            console.log('Form values:', login, password); // Для отладки

            if (this.auth.login(login, password)) {
                this.showMainApp();
            } else {
                console.log('Login failed, showing error'); // Для отладки
                document.getElementById('login-error').textContent = 'Неверный логин или пароль';
            }
        });

        // Выход
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.auth.logout();
            this.showLogin();
        });

        // Переключение меню (мобильные)
        document.getElementById('menu-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }

    showLogin() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');

        // Инициализация UI
        this.ui.init();
        this.editor.init();
        this.ui.updateWelcomeScreen(); // Чтобы показать избранные

        // Добавить global functions
        window.showHome = () => this.showHome();
        window.selectFavorite = (id) => this.selectFavorite(id);
    }

    showHome() {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('instructions-view').classList.add('hidden');
        document.getElementById('editor-view').classList.add('hidden');
        // Сбросить выбранную группу
        document.querySelectorAll('.group-item').forEach(item => item.classList.remove('active'));
        this.ui.currentGroupId = null;
    }

    selectFavorite(id) {
        const instruction = this.storage.getInstruction(id);
        if (instruction) {
            const groupId = instruction.groupId;
            this.ui.selectGroup(groupId);
        }
    }

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
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
