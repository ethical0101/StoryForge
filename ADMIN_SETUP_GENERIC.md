# 🔐 Admin Setup for Production

## Setting Up Admin Access

### Prerequisites
- Deployed application on Vercel/Netlify
- Supabase project configured
- Admin email ready for registration

### Steps

1. **Register Admin Account**
   - Go to your deployed app's registration page
   - Register with your chosen admin email
   - Complete email verification if enabled

2. **Promote to Admin via SQL**
   - Open your Supabase dashboard
   - Navigate to SQL Editor
   - Run the admin promotion script (see templates in project)

3. **Verify Access**
   - Login with admin credentials
   - Navigate to `/admin` route
   - Confirm all admin features are accessible

### Security Notes
- ✅ Never commit real admin emails to version control
- ✅ Use environment variables for sensitive data
- ✅ Keep admin credentials secure and private
- ✅ Use strong passwords for admin accounts
- ✅ Enable 2FA if available in your auth provider

### Templates
Check the SQL template files in this project for admin setup scripts. Replace placeholder values with your actual information when running locally.
