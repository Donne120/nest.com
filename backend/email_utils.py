"""
Transactional email utility.
Uses Resend if RESEND_API_KEY is set, otherwise falls back to SMTP.
"""

import smtplib
import logging
import html
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import settings

logger = logging.getLogger(__name__)


def _sendgrid_configured() -> bool:
    return bool(settings.SENDGRID_API_KEY and settings.SENDGRID_FROM)


def _resend_configured() -> bool:
    return bool(settings.RESEND_API_KEY)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def send(to: str, subject: str, body_html: str) -> bool:
    """Send an HTML email via SendGrid, Resend, or SMTP. Returns True on success."""
    if _sendgrid_configured():
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            msg = Mail(
                from_email=settings.SENDGRID_FROM,
                to_emails=to,
                subject=subject,
                html_content=body_html,
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(msg)
            print(f"[EMAIL] SendGrid: sent to {to}", flush=True)
            return True
        except Exception as e:
            print(f"[EMAIL] SendGrid failed for {to}: {e}", flush=True)
            return False

    if _resend_configured():
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": settings.RESEND_FROM,
                "to": [to],
                "subject": subject,
                "html": body_html,
            })
            print(f"[EMAIL] Resend: sent to {to}", flush=True)
            return True
        except Exception as e:
            print(f"[EMAIL] Resend failed for {to}: {e}", flush=True)
            return False

    if _smtp_configured():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM
            msg["To"] = to
            msg.attach(MIMEText(body_html, "html"))
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM, to, msg.as_string())
            print(f"[EMAIL] SMTP: sent to {to}", flush=True)
            return True
        except Exception as e:
            print(f"[EMAIL] SMTP failed for {to}: {e}", flush=True)
            return False

    print(f"[EMAIL] No email provider configured — skipping {to}", flush=True)
    return False


# ─── Shared layout helper ──────────────────────────────────────────────────────

def _wrap(body: str, preheader: str = "") -> str:
    """Wrap body HTML in a consistent, mobile-friendly email shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nest</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
  {"<div style='display:none;max-height:0;overflow:hidden;'>" + preheader + "</div>" if preheader else ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo header -->
        <tr><td style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;height:36px;background:#2563eb;border-radius:10px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-weight:700;font-size:18px;line-height:36px;">N</span>
              </td>
              <td style="padding-left:10px;font-size:15px;font-weight:700;color:#1e293b;">Nest Onboarding</td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          {body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="font-size:11px;color:#94a3b8;margin:0;">
            &copy; Nest Onboarding Platform &mdash; You received this because you have an account on Nest.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _btn(url: str, label: str, color: str = "#2563eb") -> str:
    return f"""<table cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr><td style="background:{color};border-radius:10px;">
    <a href="{url}" style="display:inline-block;padding:12px 28px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.01em;">{label}</a>
  </td></tr>
</table>"""


# ─── Invitation ────────────────────────────────────────────────────────────────

def send_invitation(to: str, org_name: str, invite_url: str, role: str) -> bool:
    org_name = html.escape(org_name)
    role = html.escape(role)
    subject = f"You're invited to join {org_name} on Nest"
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Team Invitation</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">You've been invited to join {org_name}</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 4px;">
        Someone at <strong style="color:#0f172a;">{org_name}</strong> has invited you as a
        <strong style="color:#0f172a;text-transform:capitalize;">{role}</strong>.
      </p>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
        Click the button below to set up your account and start your onboarding journey.
      </p>
      {_btn(invite_url, "Accept Invitation")}
      <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;">
        This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.
      </p>
    </div>"""
    return send(to, subject, _wrap(body, f"You've been invited to join {org_name}"))


# ─── Password reset ────────────────────────────────────────────────────────────

def send_password_reset(to: str, reset_url: str) -> bool:
    subject = "Reset your Nest password"
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Security</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">Reset your password</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
        We received a password reset request for your Nest account.
        This link will expire in <strong style="color:#0f172a;">1 hour</strong>.
      </p>
      {_btn(reset_url, "Choose New Password")}
      <div style="margin-top:24px;padding:14px 16px;background:#fef3c7;border-radius:10px;border:1px solid #fde68a;">
        <p style="font-size:12px;color:#92400e;margin:0;line-height:1.6;">
          If you didn't request this, your account is safe. No action is needed.
        </p>
      </div>
    </div>"""
    return send(to, subject, _wrap(body, "Someone requested a password reset for your account"))


# ─── Welcome email ─────────────────────────────────────────────────────────────

def send_welcome(to: str, admin_name: str, org_name: str, dashboard_url: str) -> bool:
    """Sent to the admin right after their organization is created."""
    admin_name = html.escape(admin_name)
    org_name = html.escape(org_name)
    first = html.escape(admin_name.split(" ")[0])
    subject = f"Welcome to Nest, {first} — your workspace is ready"
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Getting Started</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">Welcome aboard, {first}!</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 8px;">
        Your <strong style="color:#0f172a;">{org_name}</strong> workspace is live on Nest.
        You're on a <strong style="color:#0f172a;">14-day free trial</strong> — no credit card required.
      </p>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
        Here's what to do next:
      </p>
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">
        <tr>
          <td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;">
            <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">1. Create your first course</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Upload videos and build your onboarding program.</p>
          </td>
        </tr>
        <tr><td style="height:8px;"></td></tr>
        <tr>
          <td style="padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
            <p style="margin:0;font-size:14px;color:#0f172a;font-weight:600;">2. Invite your team</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Send invite links to managers and employees.</p>
          </td>
        </tr>
      </table>
      {_btn(dashboard_url, "Open Dashboard")}
    </div>"""
    return send(to, subject, _wrap(body, f"Your {org_name} workspace is ready on Nest"))


# ─── Quiz result ───────────────────────────────────────────────────────────────

def send_quiz_result(to: str, employee_name: str, video_title: str, passed: bool, score: float, max_score: int) -> bool:
    """Sent to employee after submitting a quiz."""
    employee_name = html.escape(employee_name)
    video_title = html.escape(video_title)
    first = html.escape(employee_name.split(" ")[0])
    pct = round((score / max_score) * 100) if max_score > 0 else 0
    subject = f"{'Quiz passed!' if passed else 'Quiz result'} — {video_title}"

    if passed:
        badge_bg, badge_color, badge_text = "#dcfce7", "#166534", "Passed"
        heading = f"Well done, {first}!"
        message = f"You scored <strong style='color:#0f172a;'>{pct}%</strong> on the quiz for <em>{video_title}</em>. Keep it up!"
        accent = "#16a34a"
    else:
        badge_bg, badge_color, badge_text = "#fee2e2", "#991b1b", "Not Passed"
        heading = f"Quiz result, {first}"
        message = f"You scored <strong style='color:#0f172a;'>{pct}%</strong> on the quiz for <em>{video_title}</em>. You need 70% to pass — you can try again!"
        accent = "#dc2626"

    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Quiz Result</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 16px;line-height:1.3;">{heading}</h1>

      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
        <span style="display:inline-block;padding:4px 14px;background:{badge_bg};color:{badge_color};font-size:13px;font-weight:700;border-radius:999px;">{badge_text}</span>
      </div>

      <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px 24px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Score</p>
        <p style="margin:0;font-size:36px;font-weight:800;color:{accent};">{pct}%</p>
        <p style="margin:4px 0 0;font-size:13px;color:#64748b;">{int(score)} out of {max_score} questions correct</p>
      </div>

      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">{message}</p>
    </div>"""
    return send(to, subject, _wrap(body, f"Your quiz result for {video_title}"))


# ─── Meeting request (to manager) ─────────────────────────────────────────────

def send_meeting_request_to_manager(
    to: str, manager_name: str, employee_name: str,
    note: str | None, meetings_url: str
) -> bool:
    """Sent to each manager when an employee requests a 1-on-1."""
    manager_name = html.escape(manager_name)
    employee_name = html.escape(employee_name)
    if note:
        note = html.escape(note)
    first = html.escape(manager_name.split(" ")[0])
    subject = f"{employee_name} requested a 1-on-1 meeting"
    note_block = (
        f"""<div style="margin:16px 0;padding:14px 16px;background:#f0f9ff;border-left:3px solid #38bdf8;border-radius:0 10px 10px 0;">
          <p style="font-size:13px;font-weight:600;color:#0369a1;margin:0 0 4px;">Note from {employee_name}:</p>
          <p style="font-size:13px;color:#0c4a6e;margin:0;line-height:1.6;font-style:italic;">"{note}"</p>
        </div>"""
        if note else ""
    )
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Meeting Request</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">Hey {first}, someone wants to meet</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
        <strong style="color:#0f172a;">{employee_name}</strong> has requested a 1-on-1 meeting
        and is waiting for your confirmation.
      </p>
      {note_block}
      {_btn(meetings_url, "Review Request")}
    </div>"""
    return send(to, subject, _wrap(body, f"{employee_name} is requesting a 1-on-1 with you"))


# ─── Meeting confirmed ─────────────────────────────────────────────────────────

def send_meeting_confirmed(to: str, employee_name: str, confirmed_at: str, meeting_link: str) -> bool:
    employee_name = html.escape(employee_name)
    confirmed_at = html.escape(confirmed_at)
    first = html.escape(employee_name.split(" ")[0])
    subject = "Your 1-on-1 meeting has been confirmed"
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Meeting Confirmed</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">You're all set, {first}!</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
        Your 1-on-1 session has been confirmed. Here are the details:
      </p>
      <div style="background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;padding:20px 24px;margin-bottom:20px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <tr>
            <td style="padding-bottom:10px;">
              <p style="margin:0;font-size:11px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">When</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#0f172a;">{confirmed_at}</p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0;font-size:11px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">Meeting Link</p>
              <p style="margin:4px 0 0;font-size:13px;color:#2563eb;word-break:break-all;">
                <a href="{meeting_link}" style="color:#2563eb;">{meeting_link}</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
      {_btn(meeting_link, "Join Meeting", "#16a34a")}
    </div>"""
    return send(to, subject, _wrap(body, f"Your 1-on-1 is confirmed for {confirmed_at}"))


# ─── Payment submitted (to admin) ─────────────────────────────────────────────

def send_payment_submitted(
    to: str, payer_name: str, payer_email: str,
    payment_type: str, amount: float, currency: str,
    plan: str | None, module_title: str | None,
    review_url: str,
) -> bool:
    """Sent to admin when a user submits a payment proof."""
    payer_name = html.escape(payer_name)
    payer_email = html.escape(payer_email)
    payment_type = html.escape(payment_type.replace("_", " ").title())
    currency = html.escape(currency)
    detail_line = ""
    if plan:
        detail_line = f"<p style='font-size:13px;color:#475569;margin:4px 0 0;'>Plan: <strong style='color:#0f172a;'>{html.escape(plan.title())}</strong></p>"
    elif module_title:
        detail_line = f"<p style='font-size:13px;color:#475569;margin:4px 0 0;'>Module: <strong style='color:#0f172a;'>{html.escape(module_title)}</strong></p>"

    subject = f"New payment proof submitted — {payer_name}"
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Action Required</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">New payment proof to review</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
        A user has submitted a payment proof and is waiting for access to be granted.
      </p>
      <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px 24px;margin-bottom:20px;">
        <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">From</p>
        <p style="margin:4px 0 8px;font-size:14px;font-weight:600;color:#0f172a;">{payer_name} &mdash; <span style="font-weight:400;color:#64748b;">{payer_email}</span></p>
        <p style="margin:0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Type</p>
        <p style="margin:4px 0 8px;font-size:14px;color:#0f172a;">{payment_type}</p>
        {detail_line}
        <p style="margin:8px 0 0;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Amount</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#2563eb;">{amount:,.0f} {currency}</p>
      </div>
      {_btn(review_url, "Review Payment", "#f59e0b")}
    </div>"""
    return send(to, subject, _wrap(body, f"New payment proof from {payer_name} — review required"))


# ─── Payment approved (to user) ────────────────────────────────────────────────

def send_payment_approved(
    to: str, user_name: str,
    payment_type: str, amount: float, currency: str,
    plan: str | None, module_title: str | None,
    dashboard_url: str,
) -> bool:
    """Sent to the user when their payment is approved."""
    user_name = html.escape(user_name)
    first = html.escape(user_name.split(" ")[0])
    payment_type = html.escape(payment_type.replace("_", " ").title())
    currency = html.escape(currency)
    what_unlocked = ""
    if plan:
        what_unlocked = f"Your workspace has been upgraded to the <strong style='color:#0f172a;'>{html.escape(plan.title())}</strong> plan."
    elif module_title:
        what_unlocked = f"You now have full access to <strong style='color:#0f172a;'>{html.escape(module_title)}</strong>."

    subject = "Payment approved — your access is ready"
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Payment Approved</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">Great news, {first}!</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 8px;">
        Your payment of <strong style="color:#0f172a;">{amount:,.0f} {currency}</strong> has been verified and approved.
      </p>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
        {what_unlocked}
      </p>
      {_btn(dashboard_url, "Go to Dashboard", "#16a34a")}
    </div>"""
    return send(to, subject, _wrap(body, "Your payment has been approved — access granted"))


# ─── Payment rejected (to user) ────────────────────────────────────────────────

def send_payment_rejected(
    to: str, user_name: str,
    amount: float, currency: str,
    reason: str | None,
    support_url: str,
) -> bool:
    """Sent to the user when their payment is rejected."""
    user_name = html.escape(user_name)
    first = html.escape(user_name.split(" ")[0])
    currency = html.escape(currency)
    reason_block = (
        f"""<div style="margin:16px 0;padding:14px 16px;background:#fef2f2;border-left:3px solid #fca5a5;border-radius:0 10px 10px 0;">
          <p style="font-size:13px;font-weight:600;color:#991b1b;margin:0 0 4px;">Reason:</p>
          <p style="font-size:13px;color:#7f1d1d;margin:0;line-height:1.6;">{html.escape(reason)}</p>
        </div>"""
        if reason else ""
    )
    subject = "Payment not verified — action needed"
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Payment Update</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">We couldn't verify your payment, {first}</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
        Your payment proof of <strong style="color:#0f172a;">{amount:,.0f} {currency}</strong> could not be verified.
      </p>
      {reason_block}
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:16px 0 0;">
        Please double-check your proof and resubmit, or contact us for help.
      </p>
      {_btn(support_url, "Resubmit Payment", "#dc2626")}
    </div>"""
    return send(to, subject, _wrap(body, "Your payment proof could not be verified"))


# ─── Meeting declined ──────────────────────────────────────────────────────────

def send_meeting_declined(to: str, employee_name: str, reason: str | None, meetings_url: str) -> bool:
    """Sent to employee when their meeting request is declined."""
    employee_name = html.escape(employee_name)
    if reason:
        reason = html.escape(reason)
    first = html.escape(employee_name.split(" ")[0])
    subject = "Your meeting request was declined"
    reason_block = (
        f"""<div style="margin:16px 0;padding:14px 16px;background:#fef2f2;border-left:3px solid #fca5a5;border-radius:0 10px 10px 0;">
          <p style="font-size:13px;color:#7f1d1d;margin:0;line-height:1.6;">{reason}</p>
        </div>"""
        if reason else ""
    )
    body = f"""
    <div style="padding:36px 40px;">
      <p style="font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Meeting Update</p>
      <h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 12px;line-height:1.3;">Sorry, {first}</h1>
      <p style="font-size:14px;color:#475569;line-height:1.7;margin:0;">
        Your 1-on-1 meeting request was declined.
        You can submit a new request at a different time.
      </p>
      {reason_block}
      {_btn(meetings_url, "Request Another Time")}
    </div>"""
    return send(to, subject, _wrap(body, "Your meeting request was not confirmed"))
