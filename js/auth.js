export class AuthManager {
    constructor() {
        this.credentials = {
            login: 'testuser',
            password: 'testuser2025'
        };
    }

    isAuthenticated() {
        return localStorage.getItem('auth_token') === 'authenticated';
    }

    login(login, password) {
        console.log('Attempting login with:', login, password); // Для отладки
        console.log('Expected credentials:', this.credentials.login, this.credentials.password);

        if (login === this.credentials.login && password === this.credentials.password) {
            localStorage.setItem('auth_token', 'authenticated');
            console.log('Login successful');
            return true;
        }
        console.log('Login failed');
        return false;
    }

    logout() {
        localStorage.removeItem('auth_token');
    }
}
