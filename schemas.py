# schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from models import Specification, Hobby


class StudentBase(BaseModel):
    first_name: str
    last_name: str
    age: int
    sex: str
    email: EmailStr
    level: str
    vocabulary: int
    teacher_id: int
    specification: str  # Принимаем строку вместо Enum
    hobby: str  # Принимаем строку вместо Enum


class StudentCreate(StudentBase):
    password: str


class Student(StudentBase):
    id: int
    is_active: bool = True
    finished_tests: bool

    class Config:
        from_attributes = True


class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    age: int
    sex: str
    qualification: str
    email: EmailStr
    specification: str  # Принимаем строку вместо Enum
    hobby: str  # Принимаем строку вместо Enum


class TeacherCreate(TeacherBase):
    password: str


class Teacher(TeacherBase):
    id: int
    is_active: bool = True
    students: List[Student] = []

    class Config:
        from_attributes = True


class ManagerBase(BaseModel):
    email: EmailStr
    is_superuser: bool = False
    is_active: bool = True


class ManagerCreate(ManagerBase):
    password: str


class Manager(ManagerBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class UserInfo(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    additional_info: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class TeacherScore(BaseModel):
    id: int
    first_name: str
    age: int
    sex: str
    qualification: str
    specification: str
    hobby: str
    score: float = Field(ge=0.0, le=1.0)
    last_name: str

    class Config:
        from_attributes = True
