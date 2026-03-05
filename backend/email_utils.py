"""
Simple SMTP email utility.
If SMTP_HOST is not configured in .env, send() is a no-op and returns False.
"""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import settings

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def send(to: str, subject: str, html: str) -> bool:
    """Send an HTML email. Returns True on success, False if SMTP not configured or failed."""
    if not _smtp_configured():
        logger.info(f"SMTP not configured — skipping email to {to} ({subject})")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


def send_invitation(to: str, org_name: str, invite_url: str, role: str) -> bool:
    subject = f"You're invited to join {org_name} on Nest"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <div style="margin-bottom:24px">
        <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center">
          <span style="color:white;font-weight:700;font-size:18px">N</span>
        </div>
      </div>

      <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">You've been invited</h1>
      <p style="color:#64748b;margin:0 0 24px;line-height:1.6">
        You've been invited to join <strong>{org_name}</strong> on Nest as a <strong>{role}</strong>.
        Click the button below to set up your account.
      </p>

      <a href="{invite_url}"
         style="display:inline-block;background:#6366f1;color:white;font-weight:600;
                font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
        Accept Invitation
      </a>

      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">
        This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="font-size:11px;color:#cbd5e1;margin:0">
        Nest Onboarding Platform
      </p>
    </div>
    """
    return send(to, subject, html)


def send_password_reset(to: str, reset_url: str) -> bool:
    subject = "Reset your Nest password"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <div style="margin-bottom:24px">
        <div style="width:40px;height:40px;background:#6366f1;border-radius:10px;display:flex;align-items:center;justify-content:center">
          <span style="color:white;font-weight:700;font-size:18px">N</span>
        </div>
      </div>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Reset your password</h1>
      <p style="color:#64748b;margin:0 0 24px;line-height:1.6">
        We received a request to reset your Nest password. Click the button below to choose a new password.
        This link expires in 1 hour.
      </p>
      <a href="{reset_url}"
         style="display:inline-block;background:#6366f1;color:white;font-weight:600;
                font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
        Reset Password
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">
        If you didn't request this, you can safely ignore this email. Your password won't change.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
      <p style="font-size:11px;color:#cbd5e1;margin:0">Nest Onboarding Platform</p>
    </div>
    """
    return send(to, subject, html)


def send_meeting_confirmed(to: str, employee_name: str, confirmed_at: str, meeting_link: str) -> bool:
    subject = "Your 1-on-1 meeting has been confirmed"
    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Meeting Confirmed</h1>
      <p style="color:#64748b;margin:0 0 16px;line-height:1.6">
        Hi {employee_name}, your 1-on-1 session has been confirmed.
      </p>
      <p style="margin:0 0 8px"><strong>When:</strong> {confirmed_at}</p>
      <p style="margin:0 0 24px"><strong>Link:</strong>
        <a href="{meeting_link}" style="color:#6366f1">{meeting_link}</a>
      </p>
      <a href="{meeting_link}"
         style="display:inline-block;background:#6366f1;color:white;font-weight:600;
                font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
        Join Meeting
      </a>
    </div>
    """
    return send(to, subject, html)
