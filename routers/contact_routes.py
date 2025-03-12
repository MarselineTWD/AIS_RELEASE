# routers/contact_routes.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["contact"])

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

def send_email_background(
    recipient: str, 
    subject: str, 
    content: str, 
    sender_name: str = "", 
    sender_email: str = ""
):
    try:
        # Получаем настройки из .env
        sender = os.getenv("MAIL_USERNAME")
        password = os.getenv("MAIL_PASSWORD")
        smtp_server = os.getenv("MAIL_SERVER", "smtp.yandex.ru")
        smtp_port = int(os.getenv("MAIL_PORT", "587"))
        
        # Создаем сообщение
        msg = MIMEMultipart()
        msg['From'] = sender  # Для Яндекса важно, чтобы отправитель совпадал с аутентифицированным пользователем
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Добавляем информацию об отправителе в тело письма, если она предоставлена
        footer = ""
        if sender_name and sender_email:
            footer = f"<p>Сообщение от: {sender_name} &lt;{sender_email}&gt;</p>"
        
        # Добавляем тело сообщения
        html_content = content + footer
        msg.attach(MIMEText(html_content, 'html'))
        
        # Подключаемся к серверу SMTP
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Включаем безопасное соединение
        server.ehlo()  # Для Яндекса это важно
        server.login(sender, password)  # Авторизуемся
        
        # Отправляем сообщение
        server.send_message(msg)
        server.quit()
        
        print(f"Email успешно отправлен на {recipient}")
        return True
    except Exception as e:
        print(f"Ошибка при отправке email: {str(e)}")
        return False
    
    
@router.post("/contact")
async def contact_form(form_data: ContactForm, background_tasks: BackgroundTasks):
    try:
        # Адрес для получения сообщений с формы
        recipient = os.getenv("CONTACT_RECIPIENT", "support@englishgang.ru")
        
        # Формируем содержание письма
        html_content = f"""
        <h3>Новое сообщение от {form_data.name}</h3>
        <p><strong>Email:</strong> {form_data.email}</p>
        <p><strong>Тема:</strong> {form_data.subject}</p>
        <p><strong>Сообщение:</strong></p>
        <p>{form_data.message}</p>
        """
        
        # Добавляем задачу отправки в фоновый режим
        background_tasks.add_task(
            send_email_background,
            recipient=recipient,
            subject=f"EnglishGang: {form_data.subject}",
            content=html_content,
            sender_name=form_data.name,
            sender_email=form_data.email
        )
        
        # Опционально: отправить подтверждение отправителю
        confirmation_content = f"""
        <h3>Здравствуйте, {form_data.name}!</h3>
        <p>Спасибо за ваше сообщение. Мы получили его и ответим вам в ближайшее время.</p>
        <p>С уважением,<br>Команда EnglishGang</p>
        """
        
        background_tasks.add_task(
            send_email_background,
            recipient=form_data.email,
            subject="Ваше сообщение получено - EnglishGang",
            content=confirmation_content
        )
        
        return {"message": "Сообщение успешно отправлено"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Произошла ошибка при отправке сообщения: {str(e)}"
        )