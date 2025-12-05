# Deployment Guide

This guide covers deploying the HMS project to various platforms.

## Vercel Deployment

### Prerequisites
- Vercel account
- Vercel CLI installed: `npm i -g vercel`

### Steps

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from your `.env` file

4. **Deploy:**
   ```bash
   vercel
   ```

5. **Update Database Settings:**
   - Use a cloud PostgreSQL service (e.g., Supabase, Neon, Railway)
   - Update `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in Vercel environment variables

6. **Run Migrations:**
   ```bash
   vercel env pull .env.local
   python manage.py migrate
   ```

**Note:** Vercel is primarily for serverless functions. For Django, consider Railway or Render.

## Railway Deployment

### Steps

1. **Create Railway Account:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL:**
   - Click "+ New"
   - Select "PostgreSQL"
   - Railway will auto-generate connection variables

4. **Configure Environment Variables:**
   - Go to Variables tab
   - Add all variables from `.env`
   - Railway automatically provides `DATABASE_URL` - you can use it or set individual DB variables

5. **Configure Build Settings:**
   - Build Command: `pip install -r requirements.txt && python manage.py migrate`
   - Start Command: `gunicorn hms_project.wsgi:application`

6. **Deploy:**
   - Railway will automatically deploy on push to main branch
   - Or click "Deploy" button

## Render Deployment

### Steps

1. **Create Render Account:**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service:**
   - **Name:** hms-project
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate`
   - **Start Command:** `gunicorn hms_project.wsgi:application`

4. **Add PostgreSQL Database:**
   - Click "New +" → "PostgreSQL"
   - Note the connection details

5. **Set Environment Variables:**
   - Go to Environment tab
   - Add all variables from `.env`
   - Update database variables with Render PostgreSQL details

6. **Deploy:**
   - Render will deploy automatically

## Environment Variables for Production

```env
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database (from cloud provider)
DB_NAME=railway_db_name
DB_USER=railway_user
DB_PASSWORD=railway_password
DB_HOST=railway_host
DB_PORT=5432

# Google Calendar (update redirect URI)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/calendar/callback/

# Email Service (update URL if deployed)
EMAIL_SERVICE_URL=https://your-email-service-url.com/email
```

## Deploying Email Service (AWS Lambda)

### Prerequisites
- AWS account
- AWS CLI configured
- Serverless Framework installed: `npm install -g serverless`

### Steps

1. **Configure AWS Credentials:**
   ```bash
   aws configure
   ```

2. **Deploy Email Service:**
   ```bash
   cd serverless-email
   serverless deploy
   ```

3. **Get API Gateway URL:**
   - After deployment, note the API Gateway endpoint
   - Update `EMAIL_SERVICE_URL` in your Django app's environment variables

4. **Set Lambda Environment Variables:**
   ```bash
   serverless env set SMTP_HOST smtp.gmail.com
   serverless env set SMTP_PORT 587
   serverless env set SMTP_USER your-email@gmail.com
   serverless env set SMTP_PASSWORD your-app-password
   serverless env set FROM_EMAIL your-email@gmail.com
   ```

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Google Calendar OAuth redirect URI updated
- [ ] Email service deployed and URL updated
- [ ] Static files collected (if needed)
- [ ] Admin user created
- [ ] Test signup/login
- [ ] Test appointment booking
- [ ] Test Google Calendar integration
- [ ] Test email notifications

## Troubleshooting

### Database Connection Issues
- Verify database is accessible from deployment platform
- Check firewall rules
- Verify credentials

### Static Files Not Loading
- Run `python manage.py collectstatic`
- Configure static file serving in platform settings

### OAuth Redirect URI Mismatch
- Update redirect URI in Google Cloud Console
- Must match exactly (including http/https, trailing slash)

### Email Service Not Working
- Verify Lambda function is deployed
- Check CloudWatch logs
- Verify environment variables in Lambda

