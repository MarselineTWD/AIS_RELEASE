// Функция для переключения видимости деталей проекта
function toggleProject(button) {
    const card = button.closest('.project-card');
    const details = card.querySelector('.project-details');
    const buttonText = button.querySelector('.button-text');
    const buttonIcon = button.querySelector('.button-icon');

    if (!details.classList.contains('visible')) {
        details.classList.add('visible');
        buttonText.textContent = 'Свернуть';
        buttonIcon.textContent = '▲';
    } else {
        details.classList.remove('visible');
        buttonText.textContent = 'Подробнее';
        buttonIcon.textContent = '▼';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Скрываем все детали проектов
    const details = document.querySelectorAll('.project-details');
    details.forEach(detail => {
        detail.classList.remove('visible');
    });

    // Инициализируем текст всех кнопок
    const buttons = document.querySelectorAll('.expand-btn');
    buttons.forEach(button => {
        const buttonText = button.querySelector('.button-text');
        const buttonIcon = button.querySelector('.button-icon');
        if (buttonText && buttonIcon) {
            buttonText.textContent = 'Подробнее';
            buttonIcon.textContent = '▼';
        }
    });
});