document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            // Базовая валидация
            const email = document.getElementById('email').value;
            const name = document.getElementById('name').value;
            const message = document.getElementById('message').value;
            const subject = document.getElementById('subject').value;

            if (!email || !name || !message) {
                alert('Пожалуйста, заполните все обязательные поля');
                return;
            }

            // Проверка формата email
            const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(email)) {
                alert('Пожалуйста, введите корректный email адрес');
                return;
            }

            // Отображение состояния загрузки
            const submitBtn = document.querySelector('.button-contactForm');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email,
                        subject: subject || 'Сообщение с сайта',
                        message: message
                    })
                });

                if (response.ok) {
                    // Успешная отправка
                    alert('Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.');
                    contactForm.reset();
                } else {
                    // Ошибка при отправке
                    const errorData = await response.json();
                    alert(`Ошибка при отправке сообщения: ${errorData.detail || 'Пожалуйста, попробуйте позже'}`);
                }
            } catch (error) {
                console.error('Ошибка при отправке формы:', error);
                alert('Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже.');
            } finally {
                // Восстановление кнопки
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});