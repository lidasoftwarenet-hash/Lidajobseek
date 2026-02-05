# Email Setup for CV Sharing

## Gmail SMTP Configuration

To enable sending CVs via email, you need to configure Gmail SMTP credentials.

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable it if not already enabled)
3. Scroll down to **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "JobSeek Backend" as the name
6. Click **Generate**
7. Copy the 16-character app password (you'll need this for `SMTP_PASS`)

### Step 2: Set Environment Variables

Add these to your `.env` file in the backend directory:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=lidasoftwarenet@gmail.com
SMTP_PASS=your_16_character_app_password_here
```

**Important:** 
- Use the **App Password** (16 characters), NOT your regular Gmail password
- Never commit the `.env` file with real credentials to git
- On Render/deployment: Add these as environment variables in your service settings

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install `nodemailer` and `@types/nodemailer`.

### Testing

After setup, the "Share Your CV" feature will:
1. Generate a PDF of the CV
2. Send it as an email attachment to any email address entered
3. No user account check - any email can receive the CV
