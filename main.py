# main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import schemas
from typing import List, Optional
from datetime import timedelta
import os
import json

# В main.py после других импортов
from routers import contact_routes


# Import API route modules
from routers import auth_routes, teacher_routes, student_routes, test_routes

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="English Gang API",
    docs_url="/api/docs",  # URL для Swagger UI
    openapi_url="/api/openapi.json",  # URL для OpenAPI схемы
)
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers with prefixes
app.include_router(auth_routes.router, prefix="/api")
app.include_router(teacher_routes.router, prefix="/api")
app.include_router(student_routes.router, prefix="/api")

app.include_router(test_routes.router, prefix="/api")

app.include_router(contact_routes.router, prefix="/api")

# In the same main.py
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")


@app.get("/test", response_class=HTMLResponse)
async def get_test_page(request: Request):
    return templates.TemplateResponse(
        "test.html",
        {
            "request": request,
            "level": "XDD",
            "questions": [
                {"question": "Test Question", "options": ["A", "B", "C", "D"]}
            ],
        },
    )


# Serve HTML pages
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    with open("templates/index.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/login.html", response_class=HTMLResponse)
async def serve_login():
    with open("templates/login.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/login.html", response_class=HTMLResponse)
async def serve_login():
    with open("templates/login.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/registration.html", response_class=HTMLResponse)
async def serve_registration():
    with open("templates/registration.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/contact.html", response_class=HTMLResponse)
async def serve_contact():
    with open("templates/contact.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/Courses.html", response_class=HTMLResponse)
async def serve_Courses():
    with open("templates/Courses.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/projects.html", response_class=HTMLResponse)
async def serve_projects():
    with open("templates/projects.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/Teachers.html", response_class=HTMLResponse)
async def serve_Teachers():
    with open("templates/Teachers.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/team.html", response_class=HTMLResponse)
async def serve_teamn():
    with open("templates/team.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/technical.html", response_class=HTMLResponse)
async def serve_technical():
    with open("templates/technical.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/Tests.html", response_class=HTMLResponse)
async def serve_Tests():
    with open("templates/Tests.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/kabinet.html", response_class=HTMLResponse)
async def serve_kabinet():
    with open("templates/kabinet.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/test/{test_name}.html", response_class=HTMLResponse)
async def serve_test(request: Request, test_name: str):
    """
    Serve the test page for a specific English proficiency test
    """
    # Only allow proficiency tests (not words.json)
    allowed_tests = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
    if test_name.lower() not in allowed_tests:
        raise HTTPException(status_code=404, detail="Test not found")
    
    try:
        # Read the test data
        file_path = os.path.join("tests", f"{test_name}.json")
        with open(file_path, 'r') as f:
            test_data = json.load(f)
        
        # Render the template with the test data
        return templates.TemplateResponse(
            "test_page.html",
            {
                "request": request,
                "test_name": test_name,
                "test_data": test_data
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint for Nginx
@app.get("/health")
async def health_check():
    return {"status": "ok"}
