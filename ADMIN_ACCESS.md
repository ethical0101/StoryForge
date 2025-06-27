# Admin Access Guide

## 🎉 Congratulations! You are now an admin user!

### How to Access the Admin Panel

1. **Login to your account** using `kommidruthendra2005@gmail.com`
2. **Navigate to**: `http://localhost:5174/admin`
   - Or simply add `/admin` to your current URL

### Admin Panel Features

The admin panel gives you access to:

#### 📊 **Overview Tab**
- Platform statistics (total users, stories, etc.)
- Recent activity feed
- System health monitoring

#### 👥 **Users Tab**
- View all registered users
- Promote users to admin
- Ban/unban users
- View user roles and details

#### 📚 **Stories Tab**
- Manage all published stories
- Delete inappropriate content
- View story details and authors

#### 🚩 **Reports Tab**
- Review content reports
- Take action on flagged content

#### 👑 **Admins Tab**
- View current administrators
- Promote users to admin by email/username
- Remove admin roles (except your own)

### Security Features

- Only users with `role = 'admin'` can access `/admin`
- Protected routes redirect unauthorized users
- Admin actions are logged for audit purposes

### Quick Access Links

When logged in as admin:
- **Dashboard**: `http://localhost:5174/dashboard`
- **Admin Panel**: `http://localhost:5174/admin`
- **Create Story**: `http://localhost:5174/create-story`
- **Library**: `http://localhost:5174/library`

---

**Note**: The admin panel will only be accessible after you log in with your admin account (`kommidruthendra2005@gmail.com`). If you see an "Access Denied" page, make sure you're logged in with the correct account.

Enjoy your admin privileges! 🚀
