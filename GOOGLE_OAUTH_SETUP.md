# Google OAuth Setup Guide for Sniket

This guide explains how to set up Google OAuth authentication in your Appwrite project to enable "Continue with Google" functionality for both customers and providers.

## 🚀 **Prerequisites**

1. **Appwrite Project**: You need an active Appwrite project
2. **Google Cloud Console Access**: To create OAuth credentials
3. **Domain Verification**: Your domain needs to be verified with Google

## 📋 **Step 1: Google Cloud Console Setup**

### 1.1 Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**

### 1.2 Configure OAuth Consent Screen
1. Choose **External** user type
2. Fill in required information:
   - **App name**: Sniket
   - **User support email**: Your email
   - **Developer contact information**: Your email
3. Add scopes:
   - `openid`
   - `email`
   - `profile`
4. Add test users (your email addresses)

### 1.3 Create OAuth Client ID
1. **Application type**: Web application
2. **Name**: Sniket Web Client
3. **Authorized redirect URIs**:
   - `https://your-appwrite-endpoint/v1/account/sessions/oauth2/callback/google`
   - `http://localhost:3000/auth/callback` (for development)
4. Click **Create**
5. **Save the Client ID and Client Secret**

## 🔧 **Step 2: Appwrite Project Configuration**

### 2.1 Add Google OAuth Provider
1. Go to your [Appwrite Console](https://cloud.appwrite.io/)
2. Select your project
3. Navigate to **Auth** > **OAuth2 Providers**
4. Click **Add Provider**
5. Select **Google** from the list

### 2.2 Configure Google Provider
1. **Provider ID**: `google`
2. **Client ID**: Your Google OAuth Client ID
3. **Client Secret**: Your Google OAuth Client Secret
4. **Enabled**: ✅ Check this box
5. **Callback URL**: Copy the URL from Appwrite (it will be shown)
6. Click **Save**

### 2.3 Update Google Cloud Console
1. Go back to Google Cloud Console
2. Add the Appwrite callback URL to **Authorized redirect URIs**
3. Save the changes

## 🌍 **Step 3: Environment Configuration**

### 3.1 Update .env.local
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
```

### 3.2 Verify Appwrite Configuration
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

## 🧪 **Step 4: Testing OAuth**

### 4.1 Test Customer Login
1. Go to `/login`
2. Click **Continue with Google**
3. Should redirect to Google OAuth
4. After authentication, should redirect to customer dashboard

### 4.2 Test Provider Login
1. Go to `/provider/login`
2. Click **Continue with Google**
3. Should redirect to Google OAuth
4. After authentication, should redirect to provider onboarding/dashboard

## 🚨 **Common Issues & Solutions**

### Issue 1: "Google OAuth is not enabled"
**Solution**: Check `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true` in your environment

### Issue 2: "Invalid redirect URI"
**Solution**: 
1. Verify callback URL in Appwrite matches Google Cloud Console
2. Check for trailing slashes or protocol mismatches

### Issue 3: "OAuth provider not found"
**Solution**: 
1. Ensure Google provider is enabled in Appwrite
2. Verify provider ID is exactly `google`

### Issue 4: "Client ID or Secret invalid"
**Solution**: 
1. Double-check credentials in Appwrite
2. Ensure no extra spaces or characters
3. Verify credentials are from the correct project

## 🔒 **Security Considerations**

### 1. Client Secret Protection
- Never expose client secret in frontend code
- Use environment variables
- Consider using Appwrite's built-in OAuth management

### 2. Redirect URI Validation
- Only allow necessary redirect URIs
- Use HTTPS in production
- Validate callback URLs

### 3. Scope Limitation
- Only request necessary scopes
- `openid`, `email`, `profile` are sufficient for basic auth

## 📱 **Mobile Considerations**

### 1. Deep Linking
- Configure deep links for mobile apps
- Handle OAuth callbacks in mobile context

### 2. Universal Links (iOS)
- Set up universal links for seamless OAuth
- Handle app switching gracefully

## 🔄 **OAuth Flow Diagram**

```
User clicks "Continue with Google"
         ↓
Appwrite redirects to Google OAuth
         ↓
User authenticates with Google
         ↓
Google redirects to Appwrite callback
         ↓
Appwrite creates session
         ↓
User redirected to success URL
         ↓
Role detection & dashboard redirect
```

## 📞 **Support & Troubleshooting**

### 1. Check Appwrite Logs
- Monitor OAuth attempts in Appwrite console
- Check for error messages and failed attempts

### 2. Verify Network Requests
- Use browser dev tools to monitor redirects
- Check for CORS or network issues

### 3. Test with Different Browsers
- Some browsers handle OAuth differently
- Test incognito/private browsing

## 🎯 **Next Steps After Setup**

1. **Test thoroughly** with both customer and provider flows
2. **Monitor usage** in Appwrite analytics
3. **Set up error tracking** for OAuth failures
4. **Implement fallback** authentication methods
5. **Add user feedback** for OAuth states

## 📚 **Additional Resources**

- [Appwrite OAuth Documentation](https://appwrite.io/docs/auth/oauth2)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [OAuth Security Best Practices](https://oauth.net/2/oauth-best-practice/)

---

**Note**: This setup requires both Google Cloud Console and Appwrite configuration to work properly. Make sure to test thoroughly in development before deploying to production. 