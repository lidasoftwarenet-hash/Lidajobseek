# Email Setup for CV Sharing

## Resend API Configuration (Recommended)

To enable sending CVs via email, configure Resend (HTTPS email API). This avoids SMTP timeouts on hosted environments like Render.

### Step 1: Create a Resend account & API key

1. Go to https://resend.com/
2. Create a project and generate an API key
3. Verify a sender domain or use a verified email address

### Step 2: Set Environment Variables

Add these to your `.env` file in the backend directory:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=lidasoftwarenet@gmail.com
```

**Important:**
- The `RESEND_FROM_EMAIL` must be a verified sender in Resend
- Never commit the `.env` file with real credentials to git
- On Render/deployment: Add these as environment variables in your service settings

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install the `resend` SDK.

### Testing

After setup, the "Share Your CV" feature will:
1. Generate a PDF of the CV
2. Send it as an email attachment to any email address entered
3. No user account check - any email can receive the CV
