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
        if (login === this.credentials.login && password === this.credentials.password) {
            localStorage.setItem('auth_token', 'authenticated');
            return true;
        }
        return false;
    }

    logout() {
        localStorage.removeItem('auth_token');
    }
}