# PathoScope Backend Setup Guide for Absolute Beginners

## Prerequisites
- **Python 3.10 or higher** (You have Python 3.14.0 ✓)
- **Command Prompt/Terminal** access

## Step-by-Step Instructions

### Step 1: Check Your Python Installation
Open your command prompt and run:
```bash
python --version
```
You should see something like: `Python 3.14.0`

### Step 2: Navigate to the Backend Directory
```bash
cd pathoscope
```
You should now be in the `pathoscope` folder.

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```
This will install:
- Django 4.2.7
- Django REST Framework 3.14.0
- Django CORS Headers 4.3.1

### Step 4: Set Up the Database
```bash
python manage.py makemigrations
python manage.py migrate
```
This creates and applies database migrations.

### Step 5: Create a Superuser (Admin Account)
```bash
python manage.py createsuperuser
```
Follow the prompts to create an admin account:
- **Username**: Choose a username (e.g., `admin`)
- **Email**: Your email address
- **Password**: Choose a secure password
- **Password (again)**: Confirm your password

### Step 6: Run the Backend Server
```bash
python manage.py runserver
```

## Success! 🎉
If everything worked correctly, you should see:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

## Accessing Your Backend
- **API Base URL**: http://127.0.0.1:8000/
- **Admin Panel**: http://127.0.0.1:8000/admin/ (login with your superuser credentials)
- **API Documentation**: http://127.0.0.1:8000/api/ (if available)

## Troubleshooting

### Common Issues:

1. **"python is not recognized"**
   - Try using `python3` instead of `python`
   - Or use `py` on Windows

2. **"Permission denied"**
   - Run command prompt as Administrator (Windows)
   - Use `sudo` on Mac/Linux

3. **Port already in use**
   - The server is already running
   - Stop it with `Ctrl+C` and try again
   - Or specify a different port: `python manage.py runserver 8001`

4. **Database issues**
   - Delete `db.sqlite3` file and run migrations again
   - Make sure you have write permissions in the directory

## What Each Component Does

- **Django**: The web framework that handles requests and responses
- **Django REST Framework**: Adds API functionality to Django
- **SQLite Database**: Stores all your data (patients, results, etc.)
- **CORS Headers**: Allows your frontend to communicate with the backend

## API Endpoints Available
Once the server is running, you can access:
- `/admin/` - Admin interface
- `/api/auth/login/` - User authentication
- `/api/accounts/` - User management
- `/api/patient_portal/` - Patient-related operations
- `/api/hematology/` - Hematology lab operations
- `/api/admin_dashboard/` - Administrative functions

## Next Steps
1. Test the admin panel by visiting http://127.0.0.1:8000/admin/
2. Set up the frontend following similar steps in the `frontend` directory
3. Configure your database settings if using PostgreSQL (currently using SQLite)

## Security Notes for Development
- The current setup is for development only
- Change the `SECRET_KEY` in `settings.py` for production
- Use HTTPS and proper authentication in production
- Never use the default Django secret key in production

---

**Need Help?**
If you encounter any issues, check that:
1. Python is properly installed
2. You're in the correct directory (`pathoscope`)
3. All dependencies installed successfully
4. Database migrations completed without errors
