#!/bin/bash

# Проверка наличия установленного Locust
if ! command -v locust &> /dev/null
then
    echo "Locust не установлен. Установите его с помощью: pip install locust"
    exit 1
fi

# Функция для проверки доступности сервера
check_server() {
    local url=$1
    echo "Проверка доступности сервера $url..."
    
    # Проверка с помощью curl
    if curl -s --head "$url" > /dev/null; then
        echo "Сервер доступен!"
        return 0
    else
        echo "Ошибка: Сервер недоступен. Пожалуйста, проверьте URL и доступность сервера."
        return 1
    fi
}

# Сохранение лога в файл
log_file="load_test_$(date +%Y%m%d_%H%M%S).log"
echo "Лог тестирования будет сохранен в файл: $log_file"

# Запрос URL сервера
read -p "Введите URL сервера для тестирования (например, http://example.com): " SERVER_URL

# Проверка формата URL
if [[ ! $SERVER_URL =~ ^https?:// ]]; then
    echo "URL должен начинаться с http:// или https://"
    exit 1
fi

# Проверка доступности сервера
if ! check_server "$SERVER_URL"; then
    read -p "Продолжить тестирование, несмотря на проблемы с соединением? (y/n): " force_continue
    if [[ "$force_continue" != "y" && "$force_continue" != "Y" ]]; then
        echo "Тестирование отменено."
        exit 1
    fi
    echo "Продолжаем тестирование по вашему запросу. Возможны ошибки."
fi

# Основное меню
echo "======== НАСТРОЙКА НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ ========"
echo "Выберите тип тестирования:"
echo "1) Веб-интерфейс (для интерактивного мониторинга)"
echo "2) Тестирование гостевых пользователей (без авторизации)"
echo "3) Тестирование студентов"
echo "4) Тестирование преподавателей"
echo "5) Тестирование менеджеров"
echo "6) Полное тестирование всех типов пользователей"
echo "7) Настроить параметры нагрузки вручную"

read -p "Ваш выбор (1-7): " test_type

# Определение параметров по умолчанию
users=10
spawn_rate=1
run_time="5m"
tags=""

case $test_type in
    1) # Веб-интерфейс
        echo "Запуск веб-интерфейса Locust..."
        echo "После запуска откройте http://localhost:8089 в браузере"
        
        locust -f locustfile.py --host="$SERVER_URL" | tee -a "$log_file"
        exit 0
        ;;
    2) # Гостевые пользователи
        echo "Настройка тестирования гостевых пользователей..."
        users=50
        spawn_rate=5
        tags="guest"
        ;;
    3) # Студенты
        echo "Настройка тестирования студентов..."
        users=30
        spawn_rate=3
        tags="student"
        ;;
    4) # Преподаватели
        echo "Настройка тестирования преподавателей..."
        users=10
        spawn_rate=2
        tags="teacher"
        ;;
    5) # Менеджеры
        echo "Настройка тестирования менеджеров..."
        users=5
        spawn_rate=1
        tags="manager"
        ;;
    6) # Все типы пользователей
        echo "Настройка полного тестирования всех типов пользователей..."
        users=60
        spawn_rate=5
        ;;
    7) # Ручная настройка
        echo "Ручная настройка параметров нагрузки..."
        
        read -p "Количество пользователей: " users
        read -p "Скорость появления пользователей (пользователей/сек): " spawn_rate
        read -p "Продолжительность теста (например, 5m, 30s, 1h): " run_time
        
        echo "Выберите тип пользователей для тестирования:"
        echo "1) Все типы пользователей"
        echo "2) Только гостевые пользователи"
        echo "3) Только студенты"
        echo "4) Только преподаватели"
        echo "5) Только менеджеры"
        
        read -p "Ваш выбор (1-5): " user_type
        
        case $user_type in
            1) tags="" ;;
            2) tags="guest" ;;
            3) tags="student" ;;
            4) tags="teacher" ;;
            5) tags="manager" ;;
            *) 
                echo "Неверный выбор. Будут тестироваться все типы пользователей."
                tags=""
                ;;
        esac
        ;;
    *)
        echo "Неверный выбор. Выход."
        exit 1
        ;;
esac

# Запрос о продолжении тестирования с выбранными параметрами
echo ""
echo "======== ПАРАМЕТРЫ ТЕСТИРОВАНИЯ ========"
echo "URL сервера: $SERVER_URL"
echo "Количество пользователей: $users"
echo "Скорость появления пользователей: $spawn_rate пользователей/сек"
echo "Продолжительность теста: $run_time"
if [ -n "$tags" ]; then
    echo "Тип пользователей: $tags"
else
    echo "Тип пользователей: все типы"
fi

read -p "Продолжить с этими параметрами? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Тестирование отменено."
    exit 0
fi

# Формирование команды для запуска Locust
cmd="locust -f locustfile.py --host=\"$SERVER_URL\" --headless -u $users -r $spawn_rate --run-time $run_time --csv=server_test_$(date +%Y%m%d_%H%M%S)"

# Добавление тегов, если они указаны
if [ -n "$tags" ]; then
    cmd="$cmd --tags $tags"
fi

# Запуск теста
echo "Запуск нагрузочного тестирования..."
echo "Команда: $cmd"
echo ""

eval $cmd | tee -a "$log_file"

echo ""
echo "Тестирование завершено. Результаты сохранены в CSV файлы и лог $log_file"
echo "Для анализа результатов откройте CSV файлы в Excel или используйте скрипт visualize_results.py"