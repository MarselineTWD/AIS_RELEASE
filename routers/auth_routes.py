# routers/auth_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from datetime import timedelta
from typing import Dict, Any

from auth import (
    Token,
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(tags=["authentication"])


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user["user"].email,
            "role": user["role"],
            "user_id": user["user"].id,
        },
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=schemas.Student)
async def register_student(
    student_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    try:
        # Отладочный вывод полученных данных
        print(f"Received raw registration data: {student_data}")

        # Check if email already exists
        existing = (
            db.query(models.Student)
            .filter(models.Student.email == student_data.get("email"))
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Преобразуем строковые значения в Enum

        # Получаем все возможные значения Enum
        try:
            valid_specifications = [e.value for e in models.Specification]
            valid_hobbies = [e.value for e in models.Hobby]

            print(f"Valid specifications: {valid_specifications}")
            print(f"Valid hobbies: {valid_hobbies}")
            print(f"Received specification: {student_data.get('specification')}")
            print(f"Received hobby: {student_data.get('hobby')}")

            # Проверяем и преобразуем specification из строки в Enum
            specification_value = student_data.get("specification")
            if not specification_value:
                raise HTTPException(status_code=422, detail="Specification is required")

            specification_enum = None
            for enum_val in models.Specification:
                if enum_val.value == specification_value:
                    specification_enum = enum_val
                    break

            if not specification_enum:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid specification value: '{specification_value}'. Valid options are: {valid_specifications}",
                )

            # Проверяем и преобразуем hobby из строки в Enum
            hobby_value = student_data.get("hobby")
            if not hobby_value:
                raise HTTPException(status_code=422, detail="Hobby is required")

            hobby_enum = None
            for enum_val in models.Hobby:
                if enum_val.value == hobby_value:
                    hobby_enum = enum_val
                    break

            if not hobby_enum:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid hobby value: '{hobby_value}'. Valid options are: {valid_hobbies}",
                )

            # Создаем новый словарь с обработанными данными
            processed_data = {
                "first_name": student_data.get("first_name"),
                "last_name": student_data.get("last_name"),
                "age": student_data.get("age"),
                "sex": student_data.get("sex"),
                "email": student_data.get("email"),
                "level": student_data.get("level"),
                "vocabulary": student_data.get("vocabulary", 0),
                "teacher_id": student_data.get("teacher_id", 1),
                "specification": specification_enum,
                "hobby": hobby_enum,
            }

            # Проверяем обязательные поля
            for field in ["first_name", "last_name", "age", "sex", "email", "level"]:
                if processed_data.get(field) is None:
                    raise HTTPException(
                        status_code=422, detail=f"Field '{field}' is required"
                    )

            # Хешируем пароль
            password = student_data.get("password")
            if not password:
                raise HTTPException(status_code=422, detail="Password is required")

            hashed_password = models.Student.hash_password(password)

            print(f"Final processed data: {processed_data}")

            # Создаем студента
            db_student = models.Student(**processed_data, password=hashed_password)
            db.add(db_student)
            db.commit()
            db.refresh(db_student)

            # Преобразуем объект SQLAlchemy в словарь для Pydantic
            student_dict = {
                "id": db_student.id,
                "first_name": db_student.first_name,
                "last_name": db_student.last_name,
                "age": db_student.age,
                "sex": db_student.sex,
                "email": db_student.email,
                "level": db_student.level,
                "vocabulary": db_student.vocabulary,
                "teacher_id": db_student.teacher_id,
                "specification": db_student.specification.value,  # Преобразуем Enum в строку
                "hobby": db_student.hobby.value,  # Преобразуем Enum в строку
                "is_active": db_student.is_active,
                "finished_tests": db_student.finished_tests,
            }

            # Создаем и возвращаем Pydantic модель
            return schemas.Student(**student_dict)

        except Exception as e:
            print(f"Error processing data: {str(e)}")
            import traceback

            traceback.print_exc()
            raise HTTPException(
                status_code=500, detail=f"Error processing data: {str(e)}"
            )

    except HTTPException:
        # Пробрасываем HTTPException дальше
        raise
    except Exception as e:
        print(f"General error: {str(e)}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.get("/me", response_model=schemas.UserInfo)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    user = current_user["user"]
    role = current_user["role"]

    user_info = {
        "id": user.id,
        "email": user.email,
        "role": role,
        "is_active": user.is_active,
        "additional_info": {},
    }

    if role == "student":
        user_info["additional_info"].update(
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "level": user.level,
                "vocabulary": user.vocabulary,
                "teacher_id": user.teacher_id,
            }
        )
    elif role == "manager":
        user_info["additional_info"].update({"is_superuser": user.is_superuser})
    elif role == "teacher":
        user_info["additional_info"].update(
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "qualification": user.qualification,
            }
        )

    return user_info
