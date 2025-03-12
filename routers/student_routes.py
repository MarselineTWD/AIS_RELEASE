# routers/student_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List
import traceback
import json

from auth import (
    get_current_user,
    get_current_manager,
    get_current_student,
    get_current_teacher,
)

router = APIRouter(tags=["students"])

@router.get("/teachers/recommended/list", response_model=List[schemas.TeacherScore])
async def get_recommended_teachers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all teachers sorted by compatibility score"""
    try:
        print("\n=== Starting teacher recommendations ===")
        print("Current user:", json.dumps(current_user, default=str, indent=2))
        
        if not current_user or "role" not in current_user or current_user["role"] != "student":
            raise HTTPException(
                status_code=403, 
                detail="Only students can view teacher recommendations"
            )
        
        student = current_user.get("user")
        print("\nStudent data:")
        print("ID:", getattr(student, "id", None))
        print("Level:", getattr(student, "level", None))
        print("Specification:", getattr(student, "specification", None))
        print("Hobby:", getattr(student, "hobby", None))
        print("Age:", getattr(student, "age", None))
        print("Sex:", getattr(student, "sex", None))
        
        if not student:
            raise HTTPException(
                status_code=422, 
                detail="Student data not found"
            )
        
        teachers = db.query(models.Teacher).filter(models.Teacher.is_active == True).all()
        print(f"\nFound {len(teachers)} active teachers")
        
        # Calculate scores and create response
        teacher_scores = []
        for teacher in teachers:
            try:
                print(f"\nProcessing teacher {teacher.id}:")
                print(json.dumps({
                    "id": teacher.id,
                    "first_name": teacher.first_name,
                    "last_name": teacher.last_name,
                    "age": teacher.age,
                    "sex": teacher.sex,
                    "qualification": teacher.qualification,
                    "specification": str(teacher.specification) if teacher.specification else None,
                    "hobby": str(teacher.hobby) if teacher.hobby else None
                }, indent=2))
                
                score = calculate_teacher_score(teacher, student)
                print(f"Calculated score: {score}")
                
                # Validate data types before creating dict
                try:
                    teacher_id = int(teacher.id)
                except (TypeError, ValueError) as e:
                    print(f"Error converting teacher ID: {e}")
                    print(f"Raw teacher ID value: {repr(teacher.id)}")
                    continue
                
                try:
                    teacher_age = int(teacher.age)
                except (TypeError, ValueError) as e:
                    print(f"Error converting teacher age: {e}")
                    print(f"Raw teacher age value: {repr(teacher.age)}")
                    continue
                
                # Ensure all required fields are present and of correct type
                teacher_data = {
                    "id": teacher_id,
                    "first_name": str(teacher.first_name or ""),
                    "last_name": str(teacher.last_name or ""),
                    "age": teacher_age,
                    "sex": str(teacher.sex or ""),
                    "qualification": str(teacher.qualification or ""),
                    "specification": str(teacher.specification.value if teacher.specification else ""),
                    "hobby": str(teacher.hobby.value if teacher.hobby else ""),
                    "score": float(score)
                }
                
                print("Validated teacher data:", json.dumps(teacher_data, indent=2))
                
                # Create TeacherScore object with validated data
                teacher_score = schemas.TeacherScore(**teacher_data)
                teacher_scores.append(teacher_score)
                print(f"Successfully processed teacher {teacher.id}")
            except Exception as e:
                print(f"Error processing teacher {teacher.id}:")
                print(traceback.format_exc())
                continue
        
        # Sort by score in descending order
        teacher_scores.sort(key=lambda x: x.score, reverse=True)
        print(f"\nReturning {len(teacher_scores)} teacher scores")
        
        return teacher_scores
    except Exception as e:
        print("\nError in get_recommended_teachers:")
        print(traceback.format_exc())
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

def calculate_level_difference(teacher_qual: str, student_level: str) -> bool:
    """Calculate if teacher's qualification is at least 1 level above student's"""
    levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    try:
        teacher_idx = levels.index(teacher_qual)
        student_idx = levels.index(student_level.upper())
        return teacher_idx > student_idx
    except ValueError:
        return False

def calculate_teacher_score(teacher: models.Teacher, student: models.Student) -> float:
    """Calculate compatibility score between teacher and student"""
    score = 0.0
    
    # Same hobby
    if teacher.hobby == student.hobby:
        score += 0.2
    
    # Same specialization
    if teacher.specification == student.specification:
        score += 0.2
    
    # Same sex
    if teacher.sex == student.sex:
        score += 0.2
    
    # Age ratio less than 2
    if student.age > 0 and teacher.age / student.age < 2:
        score += 0.2
    
    # Teacher qualification at least 1 level above
    if calculate_level_difference(teacher.qualification, student.level):
        score += 0.2
    
    return round(score, 2)

@router.post("/students/", response_model=schemas.Student)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.Manager = Depends(get_current_manager),
):
    # Check if email already exists
    existing = (
        db.query(models.Student).filter(models.Student.email == student.email).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = models.Student.hash_password(student.password)
    db_student = models.Student(
        **student.model_dump(exclude={"password"}), password=hashed_password
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.get("/students/", response_model=List[schemas.Student])
def read_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # If user is a teacher, show only their students
    if current_user["role"] == "teacher":
        return (
            db.query(models.Student)
            .filter(models.Student.teacher_id == current_user["user"].id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    # If manager - show all
    elif current_user["role"] == "manager":
        return db.query(models.Student).offset(skip).limit(limit).all()
    # If student - show only them
    else:
        return [current_user["user"]]

@router.get("/students/{student_id}", response_model=schemas.Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check access permissions
    if current_user["role"] == "student" and current_user["user"].id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if (
        current_user["role"] == "teacher"
        and student.teacher_id != current_user["user"].id
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    return student

@router.put("/students/{student_id}", response_model=schemas.Student)
def update_student(
    student_id: int,
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Verify access permissions
    if current_user["role"] == "student" and current_user["user"].id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    db_student = (
        db.query(models.Student).filter(models.Student.id == student_id).first()
    )
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if email is being changed to an existing one
    if student.email != db_student.email:
        existing = (
            db.query(models.Student)
            .filter(models.Student.email == student.email)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

    update_data = student.model_dump(exclude={"password"}, exclude_unset=True)

    if student.password:
        update_data["password"] = models.Student.hash_password(student.password)

    for key, value in update_data.items():
        setattr(db_student, key, value)

    db.commit()
    db.refresh(db_student)
    return db_student

@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.Manager = Depends(get_current_manager),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}