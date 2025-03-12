document.addEventListener('DOMContentLoaded', async function() {
    await loadTeachers();
    
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const userData = await fetchUserData(token);
            updateUIforLoggedInUser(userData);
            await loadRoleSpecificData(userData.role, token);
        } catch (error) {
            console.error('Error loading user data:', error);
            if (error.status === 401) {
                localStorage.removeItem('token');
                updateUIforGuest();
            }
        }
    } else {
        updateUIforGuest();
    }
});

async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers/public');
        const teachers = await response.json();
        displayTeachers(teachers);
    } catch (error) {
        console.error('Error loading teachers:', error);
        document.getElementById('teachersList').innerHTML = 
            '<div class="text-red-500">Не удалось загрузить список преподавателей. Пожалуйста, попробуйте позже.</div>';
    }
}

function displayTeachers(teachers) {
    const teachersList = document.getElementById('teachersList');
    if (teachers.length === 0) {
        teachersList.innerHTML = `
            <div class="teacherlist-text">
                <span class="empty-icon">📚</span>
                Нет доступных преподавателей в данный момент.
            </div>`;
        return;
    }

    // Функция для склонения возраста
    function getAgeString(age) {
        const lastDigit = age % 10;
        const lastTwoDigits = age % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
            return `${age} лет`;
        } else if (lastDigit === 1) {
            return `${age} год`;
        } else if (lastDigit >= 2 && lastDigit <= 4) {
            return `${age} года`;
        } else {
            return `${age} лет`;
        }
    }

    teachersList.innerHTML = teachers.map((teacher, index) => `
        <div class="teacherlist-show" style="animation-delay: ${index * 0.1}s;">
            <div class="teacherlist-header">
                <span class="teacher-icon">👩‍🏫</span>
                <h3 class="teacher-name">${teacher.first_name} ${teacher.last_name}</h3>
            </div>
            <div class="teacherlist-details">
                <p class="teacherlist-show-p">
                    <span class="detail-icon">🎓</span> 
                    ${teacher.qualification || 'Квалификация не указана'}
                </p>
                <p class="teacherlist-show-p">
                    <span class="detail-icon">✉️</span> 
                    ${teacher.email}
                </p>
                <p class="teacherlist-show-p">
                    <span class="detail-icon">🎂</span> 
                    ${getAgeString(teacher.age)}
                </p>
                <p class="teacherlist-show-p">
                    <span class="detail-icon">${teacher.sex === 'M' ? '👨' : '👩'}</span> 
                    ${teacher.sex === 'M' ? 'М' : 'Ж'}
                </p>
            </div>
        </div>
    `).join('');
}

fetch('static/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-container').innerHTML = data;
        })
    .catch(error => console.error('Ошибка при загрузке футера:', error));
    
fetch('static/footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-container').innerHTML = data;
    })
    .catch(error => console.error('Ошибка при загрузке футера:', error));
