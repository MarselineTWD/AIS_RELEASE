from locust import HttpUser, task, between, tag
import json
import random


class BaseUser(HttpUser):
    """Базовый класс пользователя для тестирования"""

    # Указываем, что класс абстрактный и не должен напрямую создавать экземпляры
    abstract = True

    # Время ожидания между запросами (от 1 до 5 секунд)
    wait_time = between(1, 5)

    # Общие данные для авторизации
    token = None

    def on_start(self):
        """Метод выполняется при старте каждого пользователя"""
        pass

    def login(self, email, password):
        """Метод авторизации пользователя"""
        response = self.client.post(
            "/api/token", data={"username": email, "password": password}
        )

        if response.status_code == 200:
            self.token = response.json()["access_token"]
            return True
        return False


class StudentUser(BaseUser):
    """Класс для тестирования нагрузки от студентов"""

    def on_start(self):
        """Авторизация студента"""
        # Используем сгенерированный email для каждого пользователя
        user_id = random.randint(1, 1000)
        self.student_email = f"student_{user_id}@example.com"
        self.student_password = "password123"

        # Сначала регистрируем нового студента
        self.register_student()

        # Затем авторизуемся
        self.login(self.student_email, self.student_password)

    def register_student(self):
        """Регистрация нового студента"""
        student_data = {
            "first_name": f"Test{random.randint(1, 1000)}",
            "last_name": f"Student{random.randint(1, 1000)}",
            "age": random.randint(18, 50),
            "sex": random.choice(["M", "F"]),
            "email": self.student_email,
            "level": random.choice(["A1", "A2", "B1", "B2", "C1", "C2"]),
            "vocabulary": random.randint(500, 5000),
            "teacher_id": 1,  # Предполагаем, что в системе есть учитель с ID=1
            "password": self.student_password,
        }

        self.client.post("/api/register", json=student_data)

    @tag("student")
    @task(2)
    def view_profile(self):
        """Просмотр своего профиля"""
        if not self.token:
            return

        self.client.get("/api/me", headers={"Authorization": f"Bearer {self.token}"})

    @tag("student")
    @task(1)
    def browse_teachers(self):
        """Просмотр списка преподавателей"""
        self.client.get("/api/teachers/public")

    @tag("student")
    @task(1)
    def check_teacher_profile(self):
        """Просмотр профиля преподавателя"""
        if not self.token:
            return

        # Предполагаем, что в системе есть преподаватель с ID=1
        self.client.get(
            "/api/teachers/1", headers={"Authorization": f"Bearer {self.token}"}
        )


class TeacherUser(BaseUser):
    """Класс для тестирования нагрузки от преподавателей"""

    def on_start(self):
        """Авторизация преподавателя"""
        # Предполагаем, что у нас уже есть учитель в системе
        self.login("john.doe@example.com", "teacher123")

    @tag("teacher")
    @task(3)
    def view_students(self):
        """Просмотр своих студентов"""
        if not self.token:
            return

        self.client.get(
            "/api/students/", headers={"Authorization": f"Bearer {self.token}"}
        )

    @tag("teacher")
    @task(1)
    def view_profile(self):
        """Просмотр своего профиля"""
        if not self.token:
            return

        self.client.get("/api/me", headers={"Authorization": f"Bearer {self.token}"})


class ManagerUser(BaseUser):
    """Класс для тестирования нагрузки от менеджеров"""

    def on_start(self):
        """Авторизация менеджера"""
        # Предполагаем, что у нас уже есть менеджер в системе
        self.login("admin@example.com", "admin123")

    @tag("manager")
    @task(2)
    def view_students(self):
        """Просмотр всех студентов"""
        if not self.token:
            return

        self.client.get(
            "/api/students/", headers={"Authorization": f"Bearer {self.token}"}
        )

    @tag("manager")
    @task(2)
    def view_teachers(self):
        """Просмотр всех преподавателей"""
        if not self.token:
            return

        self.client.get(
            "/api/teachers/", headers={"Authorization": f"Bearer {self.token}"}
        )

    @tag("manager")
    @task(1)
    def create_teacher(self):
        """Создание нового преподавателя"""
        if not self.token:
            return

        teacher_id = random.randint(1, 1000)
        teacher_data = {
            "first_name": f"Test{teacher_id}",
            "last_name": f"Teacher{teacher_id}",
            "age": random.randint(25, 60),
            "sex": random.choice(["M", "F"]),
            "qualification": random.choice(["A2", "B1", "B2", "C1", "C2"]),
            "email": f"teacher_{teacher_id}@example.com",
            "password": "teacher123",
        }

        self.client.post(
            "/api/teachers/",
            headers={"Authorization": f"Bearer {self.token}"},
            json=teacher_data,
        )


class GuestUser(HttpUser):
    """Класс для тестирования нагрузки от неавторизованных пользователей"""

    wait_time = between(1, 3)

    @tag("guest")
    @task(5)
    def visit_home_page(self):
        """Посещение главной страницы"""
        self.client.get("/")

    @tag("guest")
    @task(2)
    def visit_team_page(self):
        """Посещение страницы команды"""
        self.client.get("/team.html")

    @tag("guest")
    @task(2)
    def visit_projects_page(self):
        """Посещение страницы проектов"""
        self.client.get("/projects.html")

    @tag("guest")
    @task(1)
    def visit_technical_page(self):
        """Посещение страницы технического описания"""
        self.client.get("/technical.html")

    @tag("guest")
    @task(2)
    def visit_teachers_page(self):
        """Посещение страницы преподавателей"""
        self.client.get("/Teachers.html")

    @tag("guest")
    @task(2)
    def view_public_teachers(self):
        """Просмотр публичного списка преподавателей"""
        self.client.get("/api/teachers/public")

    @tag("guest")
    @task(2)
    def visit_contact_page(self):
        """Посещение страницы контактов"""
        self.client.get("/contact.html")

    @tag("guest")
    @task(1)
    def visit_login_page(self):
        """Посещение страницы авторизации"""
        self.client.get("/login.html")
