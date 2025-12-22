import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import shared_task
from app.shared.config import settings
import logging

log = logging.getLogger(__name__)

@shared_task(
    bind=True, 
    max_retries=3, 
    acks_late=True, # Critical: Don't acknowledge until task is DONE
    autoretry_for=(Exception,), # Auto-retry on any error
    retry_backoff=True # Exponential backoff (1s, 2s, 4s...)
)

def send_reset_password_email(self, to_email: str, token: str):
    """
    Async task to send reset password email via SendGrid.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    # 1. Construct Email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset Your Password"
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = to_email

    # Plain Text Version (Fallback)
    text = f"""
    You requested a password reset.
    Click the link below to reset it:
    {reset_link}
    
    If you did not request this, please ignore this email.
    Link expires in 15 minutes.
    """

    # HTML Version (Professional)
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4A90E2;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">
            Or copy this link: <br>
            <a href="{reset_link}">{reset_link}</a>
          </p>
          <p>This link is valid for <strong>15 minutes</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">If you didn't ask for this, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
    """

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        # 2. Connect to SMTP Server
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, msg.as_string())
            
        log.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        log.error(f"Failed to send email to {to_email}: {str(e)}")
        # Exponential Backoff Retry
        raise e