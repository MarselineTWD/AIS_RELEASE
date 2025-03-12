document.addEventListener('DOMContentLoaded', async function () {
    // Показываем welcome-section при загрузке страницы
    const welcomeSection = document.getElementById('welcomeSection');
    welcomeSection.classList.remove('hidden');
    welcomeSection.classList.add('show');

    // Скрываем через 1 секунду с плавным исчезновением
    setTimeout(() => {
        welcomeSection.classList.remove('show');
        welcomeSection.classList.add('fade-out');
        // Полностью скрываем после завершения анимации (0.5s)
        setTimeout(() => {
            welcomeSection.classList.add('hidden');
            welcomeSection.classList.remove('fade-out');
        }, 500);
    }, 1000);

    // Загружаем список преподавателей (публичная информация)
    await loadTeachers();

    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Загружаем данные профиля пользователя
            const userData = await fetchUserData(token);
            console.log('Данные пользователя загружены:', userData.role);

            // Обновляем UI в зависимости от статуса авторизации
            updateUIforLoggedInUser(userData);

            // Загружаем специфичные данные в зависимости от роли
            await loadRoleSpecificData(userData.role, token, userData);
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
            // Если токен невалидный, сбрасываем его
            if (error.status === 401) {
                localStorage.removeItem('token');
                updateUIforGuest();
            }
        }
    } else {
        // Отображаем UI для неавторизованного пользователя
        updateUIforGuest();
    }

    // Добавляем модальные окна для форм к body
    addModalWindows();
});

async function loadTeachers() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // Получаем роль пользователя
        let userRole = null;
        try {
            const meResponse = await fetch('/api/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (meResponse.ok) {
                const meData = await meResponse.json();
                userRole = meData.role;
                console.log('Текущая роль пользователя:', userRole);
            }
        } catch (e) {
            console.warn('Ошибка получения данных пользователя:', e);
        }

        // Выбираем endpoint в зависимости от роли
        let teachersEndpoint = '/api/teachers/recommended/list';
        // Если роль не студент, например менеджер, используем общий endpoint
        if (userRole && userRole !== 'student') {
            teachersEndpoint = '/api/teachers/';
        }

        // Запрашиваем список преподавателей
        const response = await fetch(teachersEndpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        const teachers = await response.json();
        if (!response.ok) {
            throw new Error(teachers.detail || 'Не удалось получить список преподавателей');
        }

        const teacherList = document.getElementById('teachersList');
        teacherList.className = 'row';
        teacherList.innerHTML = '';

        if (!Array.isArray(teachers) || teachers.length === 0) {
            teacherList.innerHTML = '<div class="alert alert-info">Нет преподавателей для отображения.</div>';
            return;
        }

        // Генерируем карточки преподавателей
        teachers.forEach(teacher => {
            if (!teacher || typeof teacher !== 'object') return;
            
            // Если роль студент – показываем Match и прогресс, иначе не показываем
            let matchBadgeHtml = '';
            let progressBarHtml = '';
            if (userRole === 'student') {
                const scorePercentage = (teacher.score * 100).toFixed(0);
                const color = getProgressBarColor(scorePercentage);
                matchBadgeHtml = `<span class="badge" style="background-color: ${color}; color: #000;">${scorePercentage}% Match</span>`;
                progressBarHtml = `
                    <div class="progress mt-3">
                        <div class="progress-bar" role="progressbar" 
                            style="width: ${scorePercentage}%; background-color: ${color};" 
                            aria-valuenow="${scorePercentage}" 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                        </div>
                    </div>
                `;
            }

            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 mb-4';
            card.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title mb-0">${teacher.first_name} ${teacher.last_name}</h5>
                            ${matchBadgeHtml}
                        </div>
                        <ul class="list-unstyled teacher-details">
                            <li><strong>Age:</strong> ${teacher.age}</li>
                            <li><strong>Sex:</strong> ${teacher.sex}</li>
                            <li><strong>Qualification:</strong> ${teacher.qualification}</li>
                            <li><strong>Specialization:</strong> ${teacher.specification}</li>
                            <li><strong>Hobby:</strong> ${teacher.hobby}</li>
                        </ul>
                        ${progressBarHtml}
                    </div>
                </div>
            `;
            teacherList.appendChild(card);
        });
    } catch (error) {
        console.error('Error in loadTeachers:', error);
        const teacherList = document.getElementById('teachersList');
        if (teacherList) {
            teacherList.innerHTML = `<div class="alert alert-danger"><pre>${error.message}</pre></div>`;
        }
    }
}



// Отображение списка преподавателей
function displayTeachers(teachers) {
    const teachersList = document.getElementById('teachersList');

    if (!teachersList) {
        console.error('Элемент #teachersList не найден в DOM');
        return;
    }

    if (teachers.length === 0) {
        teachersList.innerHTML = '<div class="teacherlist-text">Нет доступных преподавателей в данный момент.</div>';
        return;
    }

    teachersList.innerHTML = teachers.map(teacher => `
        <div class="teacherlist-show">
            <div class="teacherlist-show-p">${teacher.first_name} ${teacher.last_name}</div>
            <div class="teacherlist-show-p">Qualification: ${teacher.qualification || 'Not specified'}</div>
            <div class="teacherlist-show-p">${teacher.email || 'Почта не указана'}</div>
        </div>
    `).join('');
}

// UI для гостя (не авторизованного пользователя)
function updateUIforGuest() {
    console.log('Обновление UI для гостя');
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.remove('hidden');

    document.getElementById('studentDashboard')?.classList.add('hidden');
    document.getElementById('teacherDashboard')?.classList.add('hidden');
    document.getElementById('managerDashboard')?.classList.add('hidden');
}

// UI для авторизованного пользователя
function updateUIforLoggedInUser(userData) {
    console.log('Обновление UI для авторизованного пользователя:', userData.role);
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (welcomeMessage) {
        welcomeMessage.textContent =
            `С возвращением, ${userData.additional_info.first_name || userData.email}! Вы вошли как ${userData.role}.`;
    }

    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.add('hidden');

    // Показываем соответствующий дашборд в зависимости от роли
    if (userData.role === 'student') {
        document.getElementById('studentDashboard')?.classList.remove('hidden');
    } else if (userData.role === 'teacher') {
        document.getElementById('teacherDashboard')?.classList.remove('hidden');
    } else if (userData.role === 'manager') {
        document.getElementById('managerDashboard')?.classList.remove('hidden');
    }
}

// Получение данных о пользователе
async function fetchUserData(token) {
    console.log('Запрос данных пользователя...');
    const response = await fetch('/api/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = new Error('Не удалось загрузить данные пользователя');
        error.status = response.status;
        throw error;
    }

    return await response.json();
}

// Загрузка данных в зависимости от роли
async function loadRoleSpecificData(role, token, userData) {
    console.log('Загрузка данных для роли:', role);

    try {
        // ========== СТУДЕНТ ==========
        if (role === 'student') {
            const studentData = document.getElementById('studentData');
            if (!studentData) {
                console.error('Элемент #studentData не найден в DOM');
                return;
            }

            studentData.innerHTML = '<div class="loading-message">Загрузка данных...</div>';

            const studentInfo = userData.additional_info;
            const vocabularyProgress = calculateVocabularyProgress(studentInfo.vocabulary);

            try {
                // Получаем информацию о преподавателе студента
                let teacherInfo = null;
                if (studentInfo.teacher_id) {
                    console.log('Запрос данных преподавателя ID:', studentInfo.teacher_id);
                    const teacherResponse = await fetch(`/api/teachers/${studentInfo.teacher_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (teacherResponse.ok) {
                        teacherInfo = await teacherResponse.json();
                        console.log('Данные преподавателя получены:', teacherInfo.first_name);
                    } else {
                        console.warn('Не удалось получить данные преподавателя:', teacherResponse.status);
                    }
                } else {
                    console.log('У студента не назначен преподаватель (teacher_id отсутствует)');
                }

                // Формируем HTML профиля студента
                studentData.innerHTML = `
                    <div class="student-profile">
                        <div class="student-details">
                            <p><strong>Имя:</strong> ${studentInfo.first_name} ${studentInfo.last_name}</p>
                            <p><strong>Email:</strong> ${userData.email}</p>
                            <p><strong>Уровень английского:</strong> ${studentInfo.level}</p>
                            ${teacherInfo ? `
                            <div class="teacher-info-block">
                                <p><strong>Ваш преподаватель:</strong> ${teacherInfo.first_name} ${teacherInfo.last_name}</p>
                                <p><strong>Квалификация преподавателя:</strong> ${teacherInfo.qualification || 'Не указана'}</p>
                                <p><strong>Email преподавателя:</strong> ${teacherInfo.email || 'Не указан'}</p>
                            </div>
                            ` : '<p><strong>Преподаватель:</strong> Не назначен</p>'}
                        </div>
                        <div class="vocabulary-section">
                            <h3>Словарный запас</h3>
                            <div class="vocabulary-progress-container">
                                <div class="vocabulary-progress" style="width: ${vocabularyProgress}%">
                                    ${studentInfo.vocabulary} слов
                                </div>
                            </div>
                            <p class="vocabulary-description">
                                ${getVocabularyDescription(studentInfo.vocabulary)}
                            </p>
                        </div>
                        <div class="learning-progress">
                            <h3>Прогресс обучения</h3>
                            <div class="progress-details">
                                <p><strong>Уровень английского:</strong> ${studentInfo.level}</p>
                                <button id="TestBtn">Пройти тест</button>
                            </div>
                        </div>
                    </div>
                `;
                const testBtn = document.getElementById('TestBtn');
                if (testBtn) {
                    testBtn.addEventListener('click', async function(e) {
                        e.preventDefault();
                        console.log('Test button clicked');
                        
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
                    });
                } else {
                    console.error('Кнопка #TestBtn не найдена после создания');
                }
            } catch (studentError) {
                console.error('Ошибка при загрузке данных о преподавателе:', studentError);

                // Отображаем базовую информацию без данных преподавателя
                studentData.innerHTML = `
                    <div class="student-profile">
                        <div class="student-details">
                            <p><strong>Имя:</strong> ${studentInfo.first_name} ${studentInfo.last_name}</p>
                            <p><strong>Email:</strong> ${userData.email}</p>
                            <p><strong>Уровень английского:</strong> ${studentInfo.level}</p>
                            <p><strong>Преподаватель:</strong> Информация недоступна</p>
                        </div>
                        <div class="vocabulary-section">
                            <h3>Словарный запас</h3>
                            <div class="vocabulary-progress-container">
                                <div class="vocabulary-progress" style="width: ${vocabularyProgress}%">
                                    ${studentInfo.vocabulary} слов
                                </div>
                            </div>
                            <p class="vocabulary-description">
                                ${getVocabularyDescription(studentInfo.vocabulary)}
                            </p>
                        </div>
                        <div class="learning-progress">
                            <h3>Прогресс обучения</h3>
                            <div class="progress-details">                                <p>Тесты сданы: <span id="completedTests">0</span></p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        // ========== ПРЕПОДАВАТЕЛЬ ==========
        else if (role === 'teacher') {
            console.log('Загрузка данных для преподавателя...');
            const teacherData = document.getElementById('teacherData');

            if (!teacherData) {
                console.error('Элемент #teacherData не найден в DOM');
                return;
            }

            teacherData.innerHTML = '<div class="loading-message">Загрузка ваших студентов...</div>';

            try {
                const response = await fetch('/api/students/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`Ошибка загрузки данных студентов: ${response.status}`);
                }

                const students = await response.json();
                console.log(`Загружено ${students.length} студентов преподавателя`);

                teacherData.innerHTML = students.length === 0 ?
                    '<div class="no-students-text">У вас нет студентов</div>' :
                    `
                        <h3 class="students-title">Ваши студенты</h3>
                        <div class="students-grid">
                            ${students.map(s => `
                                <div class="student-card">
                                    <div class="student-name">${s.first_name} ${s.last_name}</div>
                                    <div class="student-level">Уровень: ${s.level}</div>
                                    <div class="student-vocab">Словарный запас: ${s.vocabulary} слов</div>
                                    <div class="student-email">Email: ${s.email}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
            } catch (teacherError) {
                console.error('Ошибка загрузки данных студентов:', teacherError);
                teacherData.innerHTML = `
                    <div class="error-message">
                        <h4>Ошибка загрузки данных</h4>
                        <p>${teacherError.message}</p>
                        <button onclick="location.reload()" class="retry-button">Попробовать снова</button>
                    </div>
                `;
            }
        }

        // ========== МЕНЕДЖЕР ==========
        else if (role === 'manager') {
            console.log('Загрузка данных для менеджера...');
            const managerData = document.getElementById('managerData');

            if (!managerData) {
                console.error('Элемент #managerData не найден в DOM');
                return;
            }

            managerData.innerHTML = '<div class="loading-message">Загрузка данных...</div>';

            try {
                // Загружаем список преподавателей
                console.log('Запрос списка преподавателей');
                const teachersResponse = await fetch('/api/teachers/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!teachersResponse.ok) {
                    throw new Error(`Ошибка при загрузке преподавателей: ${teachersResponse.status}`);
                }

                const teachersRes = await teachersResponse.json();
                console.log('Загружены преподаватели:', teachersRes.length);

                // Загружаем список студентов
                console.log('Запрос списка студентов');
                const studentsResponse = await fetch('/api/students/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!studentsResponse.ok) {
                    throw new Error(`Ошибка при загрузке студентов: ${studentsResponse.status}`);
                }

                const studentsRes = await studentsResponse.json();
                console.log('Загружены студенты:', studentsRes.length);

                // Формируем HTML панели менеджера
                managerData.innerHTML = `
                    <div class="manager-admin">
                        <div class="manager-teacher">
                            <h3>Управление преподавателями</h3>
                            <p class="mb-3">Всего учителей: ${teachersRes.length} </p>
                            <div class="button-group">
                                <button class="teacher-add-button">Добавить нового преподавателя</button>
                                <button class="teacher-delete-button">Удалить преподавателя</button>
                            </div>
                        </div>
                        <div class="manager-student">
                            <h3>Управление студентами</h3>
                            <p class="mb-3">Всего студентов: ${studentsRes.length} </p>
                            <div class="button-group">
                                <button class="student-add-button">Добавить нового студента</button>
                                <button class="student-delete-button">Удалить студента</button>
                            </div>
                        </div>
                    </div>
                `;

                // Сохраняем списки для использования в модальных окнах
                window.teachersList = teachersRes;
                window.studentsList = studentsRes;

                // Добавляем обработчики для кнопок
                const teacherAddBtn = document.querySelector('.teacher-add-button');
                if (teacherAddBtn) {
                    teacherAddBtn.addEventListener('click', showTeacherModal);
                } else {
                    console.error('Кнопка .teacher-add-button не найдена');
                }

                const studentAddBtn = document.querySelector('.student-add-button');
                if (studentAddBtn) {
                    studentAddBtn.addEventListener('click', showStudentModal);
                } else {
                    console.error('Кнопка .student-add-button не найдена');
                }

                const teacherDeleteBtn = document.querySelector('.teacher-delete-button');
                if (teacherDeleteBtn) {
                    teacherDeleteBtn.addEventListener('click', showDeleteTeacherModal);
                } else {
                    console.error('Кнопка .teacher-delete-button не найдена');
                }

                const studentDeleteBtn = document.querySelector('.student-delete-button');
                if (studentDeleteBtn) {
                    studentDeleteBtn.addEventListener('click', showDeleteStudentModal);
                } else {
                    console.error('Кнопка .student-delete-button не найдена');
                }

                console.log('Панель менеджера загружена успешно');
            } catch (managerError) {
                console.error('Ошибка загрузки данных для менеджера:', managerError);
                console.log('Стек ошибки:', managerError.stack);

                managerData.innerHTML = `
                    <div class="error-message">
                        <h4>Ошибка загрузки данных</h4>
                        <p>${managerError.message}</p>
                        <button onclick="location.reload()" class="retry-button">Попробовать снова</button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error(`Общая ошибка загрузки данных для роли ${role}:`, error);
        const dataContainer = document.getElementById(`${role}Data`);
        if (dataContainer) {
            dataContainer.innerHTML = `
                <div class="error-message">
                    <h4>Ошибка загрузки данных</h4>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="retry-button">Попробовать снова</button>
                </div>
            `;
        }
    }
}

// Расчет прогресса словарного запаса
function calculateVocabularyProgress(vocabularyCount) {
    const maxVocabulary = 5000;
    return Math.min((vocabularyCount / maxVocabulary) * 100, 100);
}

// Описание уровня словарного запаса
function getVocabularyDescription(vocabularyCount) {
    if (vocabularyCount < 1000) {
        return 'Начальный уровень словарного запаса. Продолжайте изучение!';
    } else if (vocabularyCount < 2000) {
        return 'Хороший прогресс! Ваш словарный запас растет.';
    } else if (vocabularyCount < 3000) {
        return 'Отличный уровень! Вы значительно расширили свой словарный запас.';
    } else if (vocabularyCount < 4000) {
        return 'Впечатляющий словарный запас! Вы близки к свободному владению.';
    } else {
        return 'Превосходный словарный запас! Вы практически носитель языка.';
    }
}

// Добавление модальных окон для форм
function addModalWindows() {
    console.log('Добавление модальных окон...');

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
        <!-- Модальное окно для добавления преподавателя -->
        <div id="teacherModal" class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Добавить нового преподавателя</h2>
                <form id="addTeacherForm">
                <div class="form-group">
                    <label for="teacher-first-name">Имя</label>
                    <input type="text" id="teacher-first-name" required>
                </div>
                <div class="form-group">
                    <label for="teacher-last-name">Фамилия</label>
                    <input type="text" id="teacher-last-name" required>
                </div>
                <div class="form-group">
                    <label for="teacher-age">Возраст</label>
                    <input type="number" id="teacher-age" min="18" max="100" required>
                </div>
                <div class="form-group">
                    <label for="teacher-sex">Пол</label>
                    <select id="teacher-sex" required>
                    <option value="">Выберите пол</option>
                    <option value="M">Мужской</option>
                    <option value="F">Женский</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="teacher-qualification">Квалификация</label>
                    <select id="teacher-qualification" required>
                    <option value="">Выберите уровень</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="teacher-email">Email</label>
                    <input type="email" id="teacher-email" required>
                </div>
                <!-- Новые поля в виде выпадающих списков -->
                <div class="form-group">
                    <label for="teacher-hobby">Хобби</label>
                    <select id="teacher-hobby" required>
                    <option value="">Выберите хобби</option>
                    <option value="cinematography">cinematography</option>
                    <option value="music">music</option>
                    <option value="magazines">magazines</option>
                    <option value="books">books</option>
                    <option value="memes">memes</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="teacher-specification">Специализация</label>
                    <select id="teacher-specification" required>
                    <option value="">Выберите специализацию</option>
                    <option value="pronunciation">pronunciation</option>
                    <option value="vocabulary">vocabulary</option>
                    <option value="grammar">grammar</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="teacher-password">Пароль</label>
                    <input type="password" id="teacher-password" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-button">Отмена</button>
                    <button type="submit" class="submit-button">Добавить</button>
                </div>
                </form>
            </div>
        </div>




        <!-- Модальное окно для добавления студента -->
        <div id="studentModal" class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Добавить нового студента</h2>
                <form id="addStudentForm">
                <div class="form-group">
                    <label for="student-first-name">Имя</label>
                    <input type="text" id="student-first-name" required>
                </div>
                <div class="form-group">
                    <label for="student-last-name">Фамилия</label>
                    <input type="text" id="student-last-name" required>
                </div>
                <div class="form-group">
                    <label for="student-age">Возраст</label>
                    <input type="number" id="student-age" min="7" max="100" required>
                </div>
                <div class="form-group">
                    <label for="student-sex">Пол</label>
                    <select id="student-sex" required>
                    <option value="">Выберите пол</option>
                    <option value="M">Мужской</option>
                    <option value="F">Женский</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="student-email">Email</label>
                    <input type="email" id="student-email" required>
                </div>
                <div class="form-group">
                    <label for="student-level">Уровень английского</label>
                    <select id="student-level" required>
                    <option value="">Выберите уровень</option>
                    <option value="A1">A1 (Начальный)</option>
                    <option value="A2">A2 (Элементарный)</option>
                    <option value="B1">B1 (Средний)</option>
                    <option value="B2">B2 (Выше среднего)</option>
                    <option value="C1">C1 (Продвинутый)</option>
                    <option value="C2">C2 (Профессиональный)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="student-vocabulary">Словарный запас (кол-во слов)</label>
                    <input type="number" id="student-vocabulary" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label for="student-teacher">Преподаватель</label>
                    <select id="student-teacher" required>
                    <option value="">Выберите преподавателя</option>
                    <!-- Опции будут добавлены динамически -->
                    </select>
                </div>
                <!-- Новые поля в виде выпадающих списков -->
                <div class="form-group">
                    <label for="student-hobby">Хобби</label>
                    <select id="student-hobby" required>
                    <option value="">Выберите хобби</option>
                    <option value="cinematography">cinematography</option>
                    <option value="music">music</option>
                    <option value="magazines">magazines</option>
                    <option value="books">books</option>
                    <option value="memes">memes</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="student-specification">Цель обучения</label>
                    <select id="student-specification" required>
                    <option value="">Выберите цель обучения</option>
                    <option value="pronunciation">pronunciation</option>
                    <option value="vocabulary">vocabulary</option>
                    <option value="grammar">grammar</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="student-password">Пароль</label>
                    <input type="password" id="student-password" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="cancel-button">Отмена</button>
                    <button type="submit" class="submit-button">Добавить</button>
                </div>
                </form>
            </div>
        </div>


        
        <!-- Модальное окно для удаления преподавателя -->
        <div id="deleteTeacherModal" class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Удалить преподавателя</h2>
                <p class="warning-text">Внимание! Это действие невозможно отменить.</p>
                <form id="deleteTeacherForm">
                    <div class="form-group">
                        <label for="teacher-select">Выберите преподавателя</label>
                        <select id="teacher-select" required>
                            <option value="">Выберите преподавателя</option>
                            <!-- Опции будут добавлены динамически -->
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-button">Отмена</button>
                        <button type="submit" class="submit-button delete-button">Удалить</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Модальное окно для удаления студента -->
        <div id="deleteStudentModal" class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Удалить студента</h2>
                <p class="warning-text">Внимание! Это действие невозможно отменить.</p>
                <form id="deleteStudentForm">
                    <div class="form-group">
                        <label for="student-select">Выберите студента</label>
                        <select id="student-select" required>
                            <option value="">Выберите студента</option>
                            <!-- Опции будут добавлены динамически -->
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-button">Отмена</button>
                        <button type="submit" class="submit-button delete-button">Удалить</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modalContainer);
    console.log('Модальные окна добавлены в DOM');

    // Добавляем обработчики закрытия модальных окон
    const closeButtons = document.querySelectorAll('.close-button, .cancel-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            document.getElementById('teacherModal').style.display = 'none';
            document.getElementById('studentModal').style.display = 'none';
            document.getElementById('deleteTeacherModal').style.display = 'none';
            document.getElementById('deleteStudentModal').style.display = 'none';
        });
    });



    // Добавляем обработчики отправки форм
    document.getElementById('addTeacherForm').addEventListener('submit', addTeacher);
    document.getElementById('addStudentForm').addEventListener('submit', addStudent);
    document.getElementById('deleteTeacherForm').addEventListener('submit', deleteTeacher);
    document.getElementById('deleteStudentForm').addEventListener('submit', deleteStudent);

    console.log('Обработчики событий для модальных окон установлены');
}

// Показать модальное окно добавления преподавателя
function showTeacherModal() {
    console.log('Открытие модального окна добавления преподавателя');
    document.getElementById('teacherModal').style.display = 'block';
}

// Показать модальное окно добавления студента
function showStudentModal() {
    console.log('Открытие модального окна добавления студента');
    const modal = document.getElementById('studentModal');

    // Заполняем выпадающий список преподавателей
    const teacherSelect = document.getElementById('student-teacher');
    teacherSelect.innerHTML = '<option value="">Выберите преподавателя</option>';

    if (window.teachersList && window.teachersList.length > 0) {
        console.log(`Заполнение списка из ${window.teachersList.length} преподавателей`);
        window.teachersList.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.first_name} ${teacher.last_name}`;
            teacherSelect.appendChild(option);
        });
    } else {
        console.warn('Список преподавателей пуст или не загружен');
    }

    modal.style.display = 'block';
}

// Показать модальное окно удаления преподавателя
function showDeleteTeacherModal() {
    console.log('Открытие модального окна удаления преподавателя');
    const modal = document.getElementById('deleteTeacherModal');

    // Заполняем выпадающий список преподавателей
    const teacherSelect = document.getElementById('teacher-select');
    teacherSelect.innerHTML = '<option value="">Выберите преподавателя</option>';

    if (window.teachersList && window.teachersList.length > 0) {
        console.log(`Заполнение списка из ${window.teachersList.length} преподавателей для удаления`);
        window.teachersList.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.first_name} ${teacher.last_name} (${teacher.email || 'Нет почты'})`;
            teacherSelect.appendChild(option);
        });
    } else {
        console.warn('Список преподавателей пуст или не загружен');
        teacherSelect.innerHTML = '<option value="">Нет доступных преподавателей</option>';
    }

    modal.style.display = 'block';
}

// Показать модальное окно удаления студента
function showDeleteStudentModal() {
    console.log('Открытие модального окна удаления студента');
    const modal = document.getElementById('deleteStudentModal');

    // Заполняем выпадающий список студентов
    const studentSelect = document.getElementById('student-select');
    studentSelect.innerHTML = '<option value="">Выберите студента</option>';

    if (window.studentsList && window.studentsList.length > 0) {
        console.log(`Заполнение списка из ${window.studentsList.length} студентов для удаления`);
        window.studentsList.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.first_name} ${student.last_name} (${student.email || 'Нет почты'})`;
            studentSelect.appendChild(option);
        });
    } else {
        console.warn('Список студентов пуст или не загружен');
        studentSelect.innerHTML = '<option value="">Нет доступных студентов</option>';
    }

    modal.style.display = 'block';
}

// Добавление нового преподавателя
async function addTeacher(event) {
    event.preventDefault();
  
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Вы не авторизованы!');
      return;
    }
  
    // Собираем данные из формы, включая новые поля hobby и specification
    const teacherData = {
      first_name: document.getElementById('teacher-first-name').value.trim(),
      last_name: document.getElementById('teacher-last-name').value.trim(),
      age: parseInt(document.getElementById('teacher-age').value),
      sex: document.getElementById('teacher-sex').value,
      qualification: document.getElementById('teacher-qualification').value,
      email: document.getElementById('teacher-email').value.trim(),
      hobby: document.getElementById('teacher-hobby').value.trim(),           // Новое поле
      specification: document.getElementById('teacher-specification').value.trim(), // Новое поле
      password: document.getElementById('teacher-password').value.trim()
    };
  
    console.log('Отправка данных нового преподавателя:', teacherData.first_name, teacherData.last_name);
  
    try {
      // Отправляем запрос на создание преподавателя
      const response = await fetch('/api/teachers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teacherData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при добавлении преподавателя');
      }
  
      const result = await response.json();
      console.log('Преподаватель успешно добавлен:', result);
      alert('Преподаватель успешно добавлен!');
  
      // Обновляем список преподавателей (если используется глобальный массив)
      if (window.teachersList) {
        window.teachersList.push(result);
      }
  
      // Закрываем модальное окно и обновляем страницу
      document.getElementById('teacherModal').style.display = 'none';
      location.reload();
    } catch (error) {
      console.error('Ошибка при добавлении преподавателя:', error);
      alert(`Ошибка: ${error.message}`);
    }
  }
  

async function addStudent(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
    alert('Вы не авторизованы!');
    return;
    }

    // Собираем данные из формы, включая новые поля hobby и specification
    const studentData = {
    first_name: document.getElementById('student-first-name').value.trim(),
    last_name: document.getElementById('student-last-name').value.trim(),
    age: parseInt(document.getElementById('student-age').value),
    sex: document.getElementById('student-sex').value,
    email: document.getElementById('student-email').value.trim(),
    level: document.getElementById('student-level').value,
    vocabulary: parseInt(document.getElementById('student-vocabulary').value),
    teacher_id: parseInt(document.getElementById('student-teacher').value),
      hobby: document.getElementById('student-hobby').value.trim(),             // Новое поле
      specification: document.getElementById('student-specification').value.trim(), // Новое поле
    password: document.getElementById('student-password').value.trim()
    };

    console.log("Отправляемые данные студента:", JSON.stringify(studentData));

    try {
    const response = await fetch('/api/students/', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(studentData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при добавлении студента');
    }

    console.log('Студент успешно добавлен');
    alert('Студент успешно добавлен!');

      // Закрываем модальное окно
    document.getElementById('studentModal').style.display = 'none';

      // Перезагружаем страницу для обновления данных
    location.reload();

    } catch (error) {
    console.error('Ошибка при добавлении студента:', error);
    alert(`Ошибка: ${error.message}`);
    }
}


// Удаление преподавателя
async function deleteTeacher(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы!');
        return;
    }

    const teacherId = document.getElementById('teacher-select').value;
    if (!teacherId) {
        alert('Пожалуйста, выберите преподавателя!');
        return;
    }

    if (!confirm('Вы уверены, что хотите удалить этого преподавателя? Это действие невозможно отменить.')) {
        return;
    }

    console.log('Отправка запроса на удаление преподавателя:', teacherId);

    try {
        // Отправляем запрос на удаление преподавателя
        const response = await fetch(`/api/teachers/${teacherId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при удалении преподавателя');
        }

        // Успешное удаление
        console.log('Преподаватель успешно удален');
        alert('Преподаватель успешно удален!');

        // Закрываем модальное окно
        document.getElementById('deleteTeacherModal').style.display = 'none';

        // Перезагружаем страницу, чтобы обновить данные
        location.reload();

    } catch (error) {
        console.error('Ошибка при удалении преподавателя:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// Удаление студента
async function deleteStudent(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы!');
        return;
    }

    const studentId = document.getElementById('student-select').value;
    if (!studentId) {
        alert('Пожалуйста, выберите студента!');
        return;
    }

    if (!confirm('Вы уверены, что хотите удалить этого студента? Это действие невозможно отменить.')) {
        return;
    }

    console.log('Отправка запроса на удаление студента:', studentId);

    try {
        // Отправляем запрос на удаление студента
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при удалении студента');
        }

        // Успешное удаление
        console.log('Студент успешно удален');
        alert('Студент успешно удален!');

        // Закрываем модальное окно
        document.getElementById('deleteStudentModal').style.display = 'none';

        // Перезагружаем страницу, чтобы обновить данные
        location.reload();

    } catch (error) {
        console.error('Ошибка при удалении студента:', error);
        alert(`Ошибка: ${error.message}`);
    }
}
document.addEventListener('DOMContentLoaded', function () {
    $('[data-toggle="tooltip"]').tooltip();
});

 // Function to calculate progress bar and badge color based on percentage
function getProgressBarColor(percentage) {
    percentage = Math.min(Math.max(percentage, 0), 100); // Clamp between 0 and 100

    let r, g, b;

    if (percentage <= 50) {
        // Transition from red (0%) to yellow (50%)
        r = 255; // Red stays at 255
        g = Math.round((percentage / 50) * 255); // Green increases from 0 to 255
        b = 0; // Blue stays at 0
    } else {
        // Transition from yellow (50%) to green (100%)
        r = Math.round(((100 - percentage) / 50) * 255); // Red decreases from 255 to 0
        g = 255; // Green stays at 255
        b = 0; // Blue stays at 0
    }

    return `rgb(${r}, ${g}, ${b})`;
}

// Function to calculate progress bar color based on percentage
function getProgressBarColor(percentage) {
    percentage = Math.min(Math.max(percentage, 0), 100); // Clamp between 0 and 100

    let r, g, b;

    if (percentage <= 50) {
        // Transition from red (0%) to yellow (50%)
        r = 255; // Red stays at 255
        g = Math.round((percentage / 50) * 255); // Green increases from 0 to 255
        b = 0; // Blue stays at 0
    } else {
        // Transition from yellow (50%) to green (100%)
        r = Math.round(((100 - percentage) / 50) * 255); // Red decreases from 255 to 0
        g = 255; // Green stays at 255
        b = 0; // Blue stays at 0
    }

    return `rgb(${r}, ${g}, ${b})`;
}

// Load teachers when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, calling loadTeachers');
    loadTeachers();
});