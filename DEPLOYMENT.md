# LuminaLib - Enterprise Library Management System
## Deployment & Execution Guide

LuminaLib is a modular, high-performance library management system built with Laravel (Backend) and React (Frontend).

### 🚀 Local Execution

#### Backend (Laravel)
1. **Navigate to backend folder**: `cd backend`
2. **Install dependencies**: `composer install`
3. **Environment setup**: 
   - Copy `.env.example` to `.env`
   - Configure `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
   - Set `QUEUE_CONNECTION=database`
4. **Database migration**: `php artisan migrate --seed`
5. **Run the server**: `php artisan serve`
6. **Start Queue Worker**: `php artisan queue:work` (Required for email automation)
7. **Start Scheduler**: `php artisan schedule:work` (Required for daily fine updates)

#### Frontend (React + Vite)
1. **Navigate to frontend folder**: `cd frontend`
2. **Install dependencies**: `npm install`
3. **Environment setup**: 
   - Create `.env`
   - Set `VITE_API_URL=http://localhost:8000/api`
4. **Run development server**: `npm run dev`

---

### 🌐 Cloud Deployment Strategy

#### 1. Database (Supabase / Managed MySQL)
- Create a new PostgreSQL/MySQL project.
- Obtain the connection string and update the production `.env` file on your backend host.

#### 2. Backend (Render / DigitalOcean / Heroku)
- **Host**: Deploy the `backend` directory.
- **Environment Variables**:
  - `APP_KEY`: Generate using `php artisan key:generate`
  - `DB_*`: Your cloud database credentials.
  - `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, etc.: For production emails (e.g., SendGrid, Mailgun).
  - `QUEUE_CONNECTION`: Set to `database` or `redis`.
- **Worker Process**: Ensure you run `php artisan queue:work` as a background worker.
- **Cron Job**: Set up a system cron job to run `php artisan schedule:run` every minute.

#### 3. Frontend (Vercel / Netlify / Cloudflare Pages)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: The URL of your deployed backend API.

---

### 🛠 Security Key Features
- **Audit Logs**: Every sensitive action is logged in `storage/logs/laravel.log`.
- **Rate Limiting**: Login is protected (5 attempts/min).
- **RBAC**: Strict separation between Student, Librarian, and Admin roles.
- **Scalability**: Database indexes optimized for `register_number`, `book_code`, and `due_date`.

### 🎯 Final Capabilities Checklist
- [x] **Check-in / Check-out**: Kiosk system for student presence.
- [x] **Book Lending**: Full circulation module with limits & dual validation.
- [x] **Proactive Notifications**: Automated emails for upcoming & overdue books.
- [x] **Live Counters**: Real-time dashboard stats and fine estimations.
- [x] **Intelligence**: Analytics dashboard with Chart.js visualization.
- [x] **Admin Control**: Centralized staff management and policy setup.
- [x] **Responsive**: Mobile-first design for students on the go.
