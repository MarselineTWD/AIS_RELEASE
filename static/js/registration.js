document.addEventListener("DOMContentLoaded", function () {
    // Добавляем явный вызов функции showRegistration при нажатии на кнопку регистрации
    const regButton = document.getElementById("regButton");
    if (regButton) {
        regButton.addEventListener("click", function () {
            showRegistration();
        });
    }

    // Добавляем явный вызов функции showLogin при нажатии на кнопку авторизации
    const loginButton = document.getElementById("loginButton");
    if (loginButton) {
        loginButton.addEventListener("click", function () {
            showLogin();
        });
    }

    // Обработчик отправки формы регистрации
    const registrationForm = document.getElementById("registrationForm");
    if (registrationForm) {
        registrationForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            console.log("Форма регистрации отправлена!");

            const firstName = document.getElementById("firstName").value.trim();
            const lastName = document.getElementById("lastName").value.trim();
            const age = parseInt(document.getElementById("age").value);
            const gender = document.getElementById("gender").value;
            const email = document.getElementById("email").value.trim();
            const englishLevel = document.getElementById("englishLevel").value;
            const password = document.getElementById("password").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();
            const hobby = document.getElementById("hobby").value;
            const specification = document.getElementById("specification").value;

            // Проверка совпадения паролей
            if (password !== confirmPassword) {
                alert("Пароли не совпадают!");
                return;
            }

            // Проверка, что все обязательные поля выбраны
            if (!hobby) {
                alert("Пожалуйста, выберите хобби");
                return;
            }

            if (!specification) {
                alert("Пожалуйста, выберите цель обучения");
                return;
            }

            // Вывод отладочной информации о выбранных значениях
            console.log("Хобби:", hobby);
            console.log("Цель:", specification);

            // Формируем объект данных для отправки
            const data = {
                first_name: firstName,
                last_name: lastName,
                age: age,
                sex: gender === "male" ? "M" : gender === "female" ? "F" : "O",
                email: email,
                level: englishLevel,
                password: password,
                teacher_id: 1, // Фиксированный ID преподавателя
                vocabulary: 0,  // Начальный словарный запас
                hobby: hobby,      // Строковое значение из формы
                specification: specification // Строковое значение из формы
            };

            console.log("✅ Отправляемые данные:", JSON.stringify(data));

            try {
                console.log("🔄 Отправка запроса на регистрацию...");
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                // Выводим полную информацию об ответе для отладки
                console.log("📊 Статус ответа:", response.status);
                console.log("📋 Заголовки ответа:", Object.fromEntries([...response.headers.entries()]));

                if (response.ok) {
                    const result = await response.json();
                    console.log("✅ Успешная регистрация:", result);
                    alert("Регистрация прошла успешно!");
                    window.location.href = "login.html"; // Перенаправление на авторизацию
                } else {
                    console.log("❌ Ошибка регистрации. Статус:", response.status);
                    let errorMessage = "Ошибка регистрации: ";
                    try {
                        const errorData = await response.json();
                        console.error("❌ Данные ошибки (JSON):", errorData);

                        if (errorData.detail) {
                            errorMessage += errorData.detail;
                        } else if (errorData.message) {
                            errorMessage += errorData.message;
                        } else {
                            errorMessage += JSON.stringify(errorData);
                        }
                    } catch (jsonError) {
                        // Если ответ не в формате JSON
                        console.error("⚠️ Не удалось разобрать JSON ответа:", jsonError);
                        const textResponse = await response.text();
                        console.error("📝 Текстовый ответ:", textResponse);
                        errorMessage += textResponse || `Код ошибки: ${response.status}`;
                    }
                    alert(errorMessage);
                }
            } catch (error) {
                console.error("🔴 Сетевая ошибка:", error);
                alert("Не удалось выполнить регистрацию. Проверьте соединение с сервером и попробуйте снова.");
            }
        });
    } else {
        console.error("❌ Форма регистрации не найдена на странице!");
    }
});
