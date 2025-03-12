# populate_db.py
from database import SessionLocal, engine, Base
from models import Teacher, Student, Manager, Specification, Hobby
import bcrypt

def create_tables():
    Base.metadata.drop_all(bind=engine)  # Удаляем старые таблицы
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

def populate_database():
    create_tables()
    
    db = SessionLocal()
    
    try:
        # Создание учителей
        teachers_data = [
            {
                "first_name": "John",
                "last_name": "Doe",
                "age": 35,
                "sex": "M",
                "qualification": "C2",
                "email": "john.doe@example.com",
                "password": Teacher.hash_password("teacher123"),
                "is_active": True,
                "specification": Specification.grammar,
                "hobby": Hobby.books
            },
            {
                "first_name": "Jane",
                "last_name": "Smith",
                "age": 42,
                "sex": "F",
                "qualification": "C1",
                "email": "jane.smith@example.com",
                "password": Teacher.hash_password("teacher456"),
                "is_active": True,
                "specification": Specification.pronunciation,
                "hobby": Hobby.music
            },
            {
                "first_name": "Michael",
                "last_name": "Brown",
                "age": 28,
                "sex": "M",
                "qualification": "C1",
                "email": "michael.brown@example.com",
                "password": Teacher.hash_password("teacher789"),
                "is_active": True,
                "specification": Specification.vocabulary,
                "hobby": Hobby.magazines
            },
            {
                "first_name": "Sarah",
                "last_name": "Davis",
                "age": 31,
                "sex": "F",
                "qualification": "C2",
                "email": "sarah.davis@example.com",
                "password": Teacher.hash_password("teacher101"),
                "is_active": True,
                "specification": Specification.grammar,
                "hobby": Hobby.cinematography
            },
            {
                "first_name": "David",
                "last_name": "Wilson",
                "age": 45,
                "sex": "M",
                "qualification": "C2",
                "email": "david.wilson@example.com",
                "password": Teacher.hash_password("teacher102"),
                "is_active": True,
                "specification": Specification.pronunciation,
                "hobby": Hobby.magazines
            },
            {
                "first_name": "Emma",
                "last_name": "Taylor",
                "age": 29,
                "sex": "F",
                "qualification": "C1",
                "email": "emma.taylor@example.com",
                "password": Teacher.hash_password("teacher103"),
                "is_active": True,
                "specification": Specification.vocabulary,
                "hobby": Hobby.memes
            },
            {
                "first_name": "James",
                "last_name": "Anderson",
                "age": 38,
                "sex": "M",
                "qualification": "C2",
                "email": "james.anderson@example.com",
                "password": Teacher.hash_password("teacher104"),
                "is_active": True,
                "specification": Specification.grammar,
                "hobby": Hobby.music
            },
            {
                "first_name": "Olivia",
                "last_name": "Martin",
                "age": 33,
                "sex": "F",
                "qualification": "C1",
                "email": "olivia.martin@example.com",
                "password": Teacher.hash_password("teacher105"),
                "is_active": True,
                "specification": Specification.pronunciation,
                "hobby": Hobby.books
            }
        ]

        teachers = [Teacher(**data) for data in teachers_data]
        db.add_all(teachers)
        db.flush()  # Получаем ID учителей

        print("Teachers added successfully!")

        # Создание студентов
        students_data = [
            {
                "first_name": "Alice",
                "last_name": "Johnson",
                "age": 20,
                "sex": "F",
                "email": "alice@example.com",
                "password": Student.hash_password("password123"),
                "level": "B2",
                "vocabulary": 2500,
                "teacher_id": teachers[0].id,
                "is_active": True,
                "finished_tests": False,
                "specification": Specification.vocabulary,
                "hobby": Hobby.cinematography
            },
            {
                "first_name": "Bob",
                "last_name": "Wilson",
                "age": 22,
                "sex": "M",
                "email": "bob@example.com",
                "password": Student.hash_password("password456"),
                "level": "A2",
                "vocabulary": 1500,
                "teacher_id": teachers[1].id,
                "is_active": True,
                "finished_tests": False,
                "specification": Specification.pronunciation,
                "hobby": Hobby.memes
            }
        ]

        students = [Student(**data) for data in students_data]
        db.add_all(students)
        db.flush()

        print("Students added successfully!")

        # Создание менеджера
        manager = Manager(
            email="admin@example.com",
            password=Manager.hash_password("admin123"),
            is_active=True,
            is_superuser=True
        )
        db.add(manager)
        db.commit()

        print("Manager added successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_database()