<script>
    // Функция для загрузки HTML-файла в указанный контейнер
    function loadHTML(file, containerId) {
        fetch(`static/${file}`)
            .then(response => response.text())
            .then(data => {
                document.getElementById(containerId).innerHTML = data;
            })
            .catch(error => console.error(`Ошибка при загрузке ${file}:`, error))
    }

    // Подключение всех необходимых элементов
    loadHTML('static/header.html', 'header-container');
    loadHTML('static/footer.html', 'footer-container');
    loadHTML('static/css.html', 'css-container');
</script>
