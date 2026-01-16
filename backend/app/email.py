from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from sib_api_v3_sdk import Configuration, ApiClient, TransactionalEmailsApi, SendSmtpEmail
from dotenv import load_dotenv
import os
from pathlib import Path
from decouple import config

env_path = Path(__file__).resolve().parents[1] / ".env"

load_dotenv(env_path)

BREVO_API_KEY = config("BREVO_API_KEY")

SENDER = {"email": "michaelchijioke07@gmail.com", "name": "MED-TRACK"}

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_TLS") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL") == "True",
    USE_CREDENTIALS=True
)

configuration = Configuration()



def send_password_reset_email(to: str, subject: str, body: str):
    configuration = Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY

    api_client = ApiClient(configuration)
    api_instance = TransactionalEmailsApi(api_client)

    send_smtp_email = SendSmtpEmail(
        sender={"email": "michaelchijioke07@gmail.com", "name": "MED-TRACK"},
        to=[{"email": to}],
        subject=subject,
        html_content=f"<p>{body}</p>"
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")




def send_email(to: str, subject: str, html_body: str):
    configuration = Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY

    api_client = ApiClient(configuration)
    api_instance = TransactionalEmailsApi(api_client)

    email = SendSmtpEmail(
        sender=SENDER,
        to=[{"email": to}],
        subject=subject,
        html_content=html_body
    )

    try:
        api_instance.send_transac_email(email)
        print(" Email sent successfully!")
    except Exception as e:
        print(" Error sending email:", str(e))


def send_verification_email(to: str, code: str):
    subject = "Verify Your Email - MED-TRACK"
    body = f"""
        <p>Hello,</p>
        <p>Your MED-TRACK verification code is:</p>
        <h2 style="text-align:center; font-size: 24px;">{code}</h2>
        <p>If you did not request this, please ignore this message.</p>
        <p>Thanks,<br>MED-TRACK Team</p>
    """
    send_email(to, subject, body)
