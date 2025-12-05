import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(event, context):
    """
    AWS Lambda handler for sending emails
    Supports SIGNUP_WELCOME and BOOKING_CONFIRMATION actions
    """
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        action = body.get('action')
        to_email = body.get('to_email')
        to_name = body.get('to_name', 'User')
        
        if not action or not to_email:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Missing required fields: action and to_email'
                })
            }
        
        # Get SMTP configuration from environment
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER')
        smtp_password = os.environ.get('SMTP_PASSWORD')
        from_email = os.environ.get('FROM_EMAIL', smtp_user)
        
        if not smtp_user or not smtp_password:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'SMTP configuration not set'
                })
            }
        
        # Prepare email content based on action
        subject, html_content, text_content = get_email_content(action, body, to_name)
        
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        
        # Add text and HTML parts
        text_part = MIMEText(text_content, 'plain')
        html_part = MIMEText(html_content, 'html')
        msg.attach(text_part)
        msg.attach(html_part)
        
        # Send email via SMTP
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Email sent successfully',
                'to': to_email,
                'action': action
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }


def get_email_content(action, body, to_name):
    """Generate email content based on action type"""
    
    if action == 'SIGNUP_WELCOME':
        role = body.get('role', 'user')
        subject = f"Welcome to Hospital Management System!"
        
        html_content = f"""
        <html>
          <body>
            <h2>Welcome to HMS, {to_name}!</h2>
            <p>Thank you for signing up as a {role}.</p>
            <p>You can now access your dashboard and start using our services.</p>
            <p>Best regards,<br>HMS Team</p>
          </body>
        </html>
        """
        
        text_content = f"""
        Welcome to HMS, {to_name}!
        
        Thank you for signing up as a {role}.
        You can now access your dashboard and start using our services.
        
        Best regards,
        HMS Team
        """
        
    elif action == 'BOOKING_CONFIRMATION':
        doctor_name = body.get('doctor_name', 'Doctor')
        appointment_date = body.get('appointment_date', '')
        appointment_time = body.get('appointment_time', '')
        appointment_id = body.get('appointment_id', '')
        
        subject = f"Appointment Confirmation - {appointment_date}"
        
        html_content = f"""
        <html>
          <body>
            <h2>Appointment Confirmed!</h2>
            <p>Dear {to_name},</p>
            <p>Your appointment has been confirmed with the following details:</p>
            <ul>
              <li><strong>Doctor:</strong> Dr. {doctor_name}</li>
              <li><strong>Date:</strong> {appointment_date}</li>
              <li><strong>Time:</strong> {appointment_time}</li>
              <li><strong>Appointment ID:</strong> {appointment_id}</li>
            </ul>
            <p>Please arrive on time for your appointment.</p>
            <p>Best regards,<br>HMS Team</p>
          </body>
        </html>
        """
        
        text_content = f"""
        Appointment Confirmed!
        
        Dear {to_name},
        
        Your appointment has been confirmed with the following details:
        
        Doctor: Dr. {doctor_name}
        Date: {appointment_date}
        Time: {appointment_time}
        Appointment ID: {appointment_id}
        
        Please arrive on time for your appointment.
        
        Best regards,
        HMS Team
        """
        
    else:
        subject = "Notification from HMS"
        html_content = f"<p>Hello {to_name},</p><p>You have a notification from HMS.</p>"
        text_content = f"Hello {to_name},\n\nYou have a notification from HMS."
    
    return subject, html_content, text_content

