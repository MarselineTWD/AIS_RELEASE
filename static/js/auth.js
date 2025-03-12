function togglePassword(id) {
    const input = document.getElementById(id);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

function showRegistration() {
    document.getElementById('registrationForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';

    document.getElementById('regButton').classList.add('active');
    document.getElementById('loginButton').classList.remove('active');
}

function showLogin() {
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';

    document.getElementById('loginButton').classList.add('active');
    document.getElementById('regButton').classList.remove('active');
}

document.addEventListener("DOMContentLoaded", function () {
    showLogin();

    // Проверка email и паролей, но без отправки формы (без preventDefault)
    // Эта проверка будет выполняться перед отправкой формы в registration.js
    function validateRegistrationForm() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!email.includes('@') || !email.includes('.')) {
            alert('Введите корректную почту с @ и .');
            return false;
        }

        if (password !== confirmPassword) {
            alert('Пароли не совпадают');
            return false;
        }

        return true;
    }

    // Проверка формы входа
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email.includes('@') || !email.includes('.')) {
            alert('Введите корректную почту с @ и .');
            e.preventDefault();
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const messageDiv = document.createElement('div'); // Создаем div для сообщений
    messageDiv.className = 'message';
    form.prepend(messageDiv); // Вставляем его перед формой

    // Проверяем, есть ли сообщение об успешной регистрации в URL
    const urlParams = new URLSearchParams(window.location.search);
    const successMsg = urlParams.get('success');
    if (successMsg) {
        messageDiv.textContent = decodeURIComponent(successMsg);
        messageDiv.className = 'message success';
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const loginBtn = form.querySelector('.button input');
        loginBtn.disabled = true;
        loginBtn.value = 'Вход...';

        try {
            // Создаем объект FormData для отправки формы
            const formData = new FormData();
            formData.append('username', document.getElementById('loginEmail').value);
            formData.append('password', document.getElementById('loginPassword').value);

            // Отправляем запрос на авторизацию
            const response = await fetch('/api/token', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ошибка входа');
            }

            // Получаем данные о токене
            const data = await response.json();

            // Сохраняем токен в localStorage
            localStorage.setItem('token', data.access_token);



            // Перенаправляем на дашборд
            setTimeout(() => {
                window.location.href = 'kabinet.html';
            });

        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.className = 'message error';
            loginBtn.disabled = false;
            loginBtn.value = 'Войти';
        }
    });
});

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Загрузка заголовка
fetch('/static/header.html', { cache: 'no-store' })
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-container').innerHTML = data;

        // После загрузки заголовка обновляем кнопку
        const authButton = document.getElementById('auth-button');
        const token = localStorage.getItem('token');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        if (authButton) {
            if (token && currentPage === 'kabinet.html') {
                // Пользователь авторизован и на странице kabinet.html
                authButton.textContent = 'Выйти';
                authButton.onclick = function () {
                    localStorage.removeItem('token'); // Удаляем токен
                    window.location.href = 'login.html'; // Перенаправляем на страницу входа
                };
            } else {
                // Пользователь не авторизован или не на странице kabinet.html
                authButton.textContent = 'Авторизоваться';
                authButton.onclick = function () {
                    window.location.href = 'login.html'; // Перенаправляем на страницу входа
                };
            }
        }
    })
    .catch(error => console.error('Ошибка при загрузке заголовка:', error));

// Загрузка футера (без изменений)
fetch('/static/footer.html', { cache: 'no-store' })
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-container').innerHTML = data;
    })
    .catch(error => console.error('Ошибка при загрузке футера:', error));
