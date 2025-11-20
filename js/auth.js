document.getElementById('login-btn').addEventListener('click', () => {
  const login = document.getElementById('login').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  if (login === 'testuser' && password === 'testuser2025') {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    window.app.init();
  } else {
    errorEl.textContent = 'Неверный логин или пароль';
  }
});