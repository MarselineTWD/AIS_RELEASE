# routers/test_routes.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
import json
import os
from typing import List, Dict, Any
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter(tags=["tests"])

class TestAnswers(BaseModel):
    answers: Dict[str, str]

LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']

def get_adjacent_levels(current_level: str) -> tuple[str | None, str | None]:
    """Get the levels above and below the current level"""
    try:
        current_idx = LEVELS.index(current_level.lower())
        lower_level = LEVELS[current_idx - 1] if current_idx > 0 else None
        higher_level = LEVELS[current_idx + 1] if current_idx < len(LEVELS) - 1 else None
        return lower_level, higher_level
    except ValueError:
        return None, None

@router.get("/test/{test_name}", response_model=Dict[str, Any])
def get_test(test_name: str):
    """
    Get test questions by test name (e.g., 'a1', 'b2', etc.)
    Returns the questions without correct answers
    """
    try:
        # Construct the file path
        file_path = os.path.join("tests", f"{test_name}.json")
        
        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail=f"Test '{test_name}' not found"
            )
        
        # Read and parse the JSON file
        with open(file_path, 'r') as f:
            test_data = json.load(f)
        
        # Remove correct answers from questions
        for question in test_data["questions"]:
            if "correct_answer" in question:
                del question["correct_answer"]
        
        return test_data
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Error parsing test file"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/test/{test_name}/check")
async def check_test_answers(
    test_name: str,
    answers: TestAnswers,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Check test answers and adjust user level based on performance:
    - 0-2 correct: Move down one level
    - 3-7 correct: Stay at current level, mark tests as finished
    - 8-10 correct: Move up one level
    """
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can take tests")

        student = current_user["user"]
        current_level = student.level.lower()

        # Read the test file to get correct answers
        file_path = os.path.join("tests", f"{test_name}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Test '{test_name}' not found")
        
        with open(file_path, 'r') as f:
            test_data = json.load(f)
        
        # Count correct answers
        correct_count = 0
        total_questions = len(test_data["questions"])
        
        for i, question in enumerate(test_data["questions"], 1):
            student_answer = answers.answers.get(str(i))
            if student_answer and student_answer == question["correct_answer"]:
                correct_count += 1

        # Calculate percentage
        percentage = round((correct_count / total_questions) * 100, 2)
        
        # Get adjacent levels
        lower_level, higher_level = get_adjacent_levels(current_level)
        
        # Determine next action based on score
        next_level = None
        if correct_count <= 2 and lower_level:
            next_level = lower_level
            student.finished_tests = False  # Reset finished status for new level
        elif correct_count >= 8 and higher_level:
            next_level = higher_level
            student.finished_tests = False  # Reset finished status for new level
        else:
            student.finished_tests = True  # Mark as finished if staying at current level
        
        # Update student level if needed
        if next_level:
            student.level = next_level.upper()
        
        db.commit()
        
        return {
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "percentage": percentage,
            "next_level": next_level,
            "finished_tests": student.finished_tests
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))