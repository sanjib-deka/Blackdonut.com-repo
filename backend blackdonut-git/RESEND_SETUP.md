# Resend Email Setup Guide

## ✅ Code is Already Configured!

The backend code is ready to use Resend. You just need to add the API key to Render.

## 🚀 Quick Setup Steps

### Step 1: Add Environment Variables to Render

1. Go to your **Render Dashboard**: https://dashboard.render.com
2. Select your **Backend Service**
3. Click on **Environment** tab
4. Add these two environment variables:

   **Variable 1:**
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_Vy4sFo7h_Gh3vMDM6zpKVWGfquhNc1dc5`

   **Variable 2:**
   - **Key:** `RESEND_FROM_EMAIL`
   - **Value:** `onboarding@resend.dev`

5. Click **Save Changes**
6. Render will automatically redeploy your service

### Step 2: Verify Setup

After deployment, check your Render logs. You should see:
```
✅ Resend email service configured successfully
   Works on Render free tier - uses HTTPS API (no SMTP blocking)
```

### Step 3: Test Password Reset

1. Go to your frontend forgot password page
2. Enter an email address
3. Check the email inbox (should receive password reset email)

## 📧 Email Configuration

- **From Email:** `onboarding@resend.dev` (for testing)
- **Free Tier:** 3,000 emails/month
- **No Credit Card Required**

## 🔒 Security Note

✅ Your API key is stored securely in Render environment variables (not in code)
✅ Never commit API keys to GitHub
✅ The code automatically reads from `RESEND_API_KEY` environment variable

## 🎯 Production Setup (Optional)

For production, you can:
1. Verify your domain in Resend dashboard
2. Update `RESEND_FROM_EMAIL` to use your domain (e.g., `noreply@blackdonut.com`)

## ✅ That's It!

Once you add the environment variables to Render, email will work automatically!

