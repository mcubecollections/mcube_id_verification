# Production Verification Checklist

## Deployment Status
- ✅ Code committed: c339449
- ✅ Pushed to GitHub main branch
- ✅ Render auto-deployment triggered
- ✅ Production health check responding: https://verification-htua.onrender.com/health

## Changes Deployed
1. ✅ Fixed Cloudinary image upload (base64 data URI prefix)
2. ✅ Enhanced email service with:
   - Extended timeouts (60s connection, 30s greeting, 60s socket)
   - Retry logic with exponential backoff (3 attempts)
   - Pre-send connection verification
   - Disabled connection pooling
   - Enhanced logging

## Required Verification Steps

### 1. Environment Variables Check (via Render Dashboard)
Verify these are set correctly in Render:
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_SECURE=false`
- [ ] `EMAIL_USER=identity.review@mcubeplus.com`
- [ ] `EMAIL_PASS=jjprtqcpwjvivcof`
- [ ] `EMAIL_FROM=identity.review@mcubeplus.com`
- [ ] `KYC_SUCCESS_RECIPIENTS=ops@mcubeplus.com,compliance@mcubeplus.com`
- [ ] `CLOUDINARY_NAME=dlk8tegh5`
- [ ] `CLOUDINARY_API_KEY=475259751831441`
- [ ] `CLOUDINARY_API_SECRET=b2RpKaKqFyHbXisB5LlCZ3Dh27A`

### 2. Submit Test Verification
Visit: https://verification-htua.onrender.com/verify

Steps:
1. [ ] Enter test information
2. [ ] Capture/upload selfie image
3. [ ] Submit verification
4. [ ] Wait for processing
5. [ ] Check result page

### 3. Monitor Production Logs
Look for these log entries in Render logs:

**Expected Success Logs:**
```
Selfie uploaded to Cloudinary: https://res.cloudinary.com/...
[Email] Preparing to send KYC success email to: ops@mcubeplus.com, compliance@mcubeplus.com
[Email] Verifying SMTP connection...
[Email] SMTP connection verified successfully
[Email] Attempting to send (attempt 1/3)...
[Email] Successfully sent to: ops@mcubeplus.com, compliance@mcubeplus.com
[Email] Message ID: <...>
```

**If Retry Occurs:**
```
[Email] Attempt 1/3 failed: Connection timeout
[Email] Retrying in 1000ms...
[Email] Attempting to send (attempt 2/3)...
```

### 4. Verify Email Delivery
Check both recipient inboxes:
- [ ] ops@mcubeplus.com received email
- [ ] compliance@mcubeplus.com received email

**Email Subject:** `KYC selfie verification success: [User Name]`

**Email Contents Should Include:**
- Name
- Email
- Session ID
- Status: approved
- Completed At timestamp

### 5. Verify Admin Dashboard
Login to: https://verification-htua.onrender.com/admin
- Username: `admin`
- Password: `Shop0203$`

Check:
- [ ] Session cookie persists (no redirect loop)
- [ ] Latest verification appears in list
- [ ] Selfie image displays correctly from Cloudinary
- [ ] All verification details visible

### 6. Verify Cloudinary Storage
Login to Cloudinary dashboard:
- [ ] New image in `mcube_verification_selfies` folder
- [ ] Image properly optimized (800x800 max, auto quality)
- [ ] Public ID format: `selfie_[sessionId]_[timestamp]`

## Known Issues & Solutions

### If Email Fails
1. Check Render logs for specific error
2. Verify environment variables are set correctly
3. Check if Gmail account has App Password enabled
4. Confirm outbound SMTP ports not blocked
5. Consider alternative SMTP provider if needed

### If Image Upload Fails
1. Check Cloudinary credentials in environment variables
2. Verify image is properly base64 encoded
3. Check Cloudinary account quota/limits

### If Session Issues
1. Verify `SESSION_SECRET` is set
2. Check `DATABASE_URL` is configured for PostgreSQL
3. Ensure `secure` cookie flag logic is working

## Success Criteria
All of the following must be verified:
- ✅ Selfie image uploads to Cloudinary successfully
- ✅ Selfie image displays in admin dashboard
- ✅ Email sends to both recipients without errors
- ✅ Admin dashboard session persists
- ✅ Verification flow completes end-to-end

## Rollback Plan
If critical issues occur:
```bash
git revert c339449
git push origin main
```

Then wait for Render to redeploy previous version.

---
**Production URL:** https://verification-htua.onrender.com/
**Admin URL:** https://verification-htua.onrender.com/admin
**Health Check:** https://verification-htua.onrender.com/health
