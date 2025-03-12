// Функция для определения текущей страницы
function isKabinetPage() {
    return window.location.pathname.endsWith('kabinet.html');
}

// Функция для обновления кнопки в header
function updateHeaderButton() {
    const token = localStorage.getItem('token');
    const authButton = document.getElementById('openModalBtn');
    const coursesBtn = document.getElementById('coursesBtn');

    if (coursesBtn) {
        coursesBtn.onclick = async function(e) {
            e.preventDefault();
            console.log('Courses button clicked');
            
            const token = localStorage.getItem('token');
            console.log('Token found:', !!token);
            
            if (!token) {
                console.log('No token, redirecting to login');
                window.location.href = '/login.html';
                return;
            }

            try {
                console.log('Fetching user data...');
                const response = await fetch('/api/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    console.log('Response not ok, redirecting to login');
                    window.location.href = '/login.html';
                    return;
                }

                const userData = await response.json();
                console.log('User data:', userData);
                
                // Check if we have the data we need
                if (!userData || !userData.additional_info) {
                    console.log('No user data or additional_info found');
                    return;
                }

                const level = userData.additional_info.level?.toLowerCase() || 'a1';
                console.log('User level:', level);
                window.location.href = `/test/${level}.html`;
            } catch (error) {
                console.error('Error:', error);
            }
        };
    }

    if (authButton) {
        if (token) {
            if (isKabinetPage()) {
                // На странице kabinet.html показываем "Logout"
                authButton.removeAttribute('href');
                authButton.textContent = 'Разлогиниться';
                authButton.className = 'custom_test_button2 ';
                authButton.onclick = logout;
            } else {
                // На других страницах показываем "Личный кабинет"
                authButton.href = 'kabinet.html';
                authButton.textContent = 'Личный кабинет';
                authButton.className = 'custom_test_button';
                authButton.onclick = null;
            }
        } else {
            // Для неавторизованного пользователя
            authButton.href = 'login.html';
            authButton.textContent = 'Авторизоваться';
            authButton.className = 'custom_test_button';
            authButton.onclick = null;
        }
    }
}

// Функция выхода из системы
function logout() {
    localStorage.removeItem('token');
    updateHeaderButton(); // Обновляем кнопку сразу после выхода
    window.location.reload(); // Перезагружаем страницу
}

// Загрузка header и обновление кнопки
function loadHeader() {
    fetch('/static/header.html', { cache: 'no-store' })
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
            updateHeaderButton(); // Обновляем кнопку после загрузки header
        })
        .catch(error => console.error('Ошибка при загрузке header:', error));
}

// Выполняем загрузку header при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
});

fetch('static/footer.html')
    .then(response => response.text())
    .then(data => {
            document.getElementById('footer-container').innerHTML = data;
        })
    .catch(error => console.error('Ошибка при загрузке футера:', error));

$(document).ready(function(){
    $(".slider_active").owlCarousel({
        loop: true,
        margin: 0,
        items: 1,
        autoplay: true,
        autoplayTimeout: 5000,
        autoplayHoverPause: true,
        nav: true,
        dots: true,
        navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'] 
    });
});
