# Copyright (c) 2026 Anandha Krishnan P
# R2V (Right to Vote)
# All rights reserved.
#
# File: backend/app/utils/email.py

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp: str, register_number: str) -> None:
    """
    Sends OTP email. Falls back to console print if SMTP fails.
    In development, OTP is always printed to terminal regardless.
    """
    # Always print to terminal in dev so you can test without real email
    print(f"\n{'='*50}")
    print(f"[R2V OTP] Register: {register_number}")
    print(f"[R2V OTP] Email: {to_email}")
    print(f"[R2V OTP] Code: {otp}")
    print(f"{'='*50}\n")
    logger.info(f"[R2V OTP] {register_number} → {otp}")

    try:
        from app.core.config import get_settings

        settings = get_settings()

        if not settings.SMTP_HOST or not settings.SMTP_USER:
            return  # No SMTP configured, console output is enough

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your R2V Login Code: {otp}"
        msg["From"] = settings.SMTP_USER
        msg["To"] = to_email

        body = f"""
        <html><body>
        <h2>R2V — Right to Vote</h2>
        <p>Your login OTP is:</p>
        <h1 style="letter-spacing:8px;">{otp}</h1>
        <p>Valid for 5 minutes. Do not share this code.</p>
        </body></html>
        """
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

    except Exception as e:
        logger.warning(f"Email send failed (OTP still printed above): {e}")
