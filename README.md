# College Placement Portal

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing college placements. This portal connects students with recruiters and provides administrators with tools to manage the entire placement process.

## Features

### For Students
- **Profile Management**: Create and manage academic profile with CGPA, skills, projects
- **Resume Upload**: Upload and manage PDF resumes
- **Job Search**: Browse and search for job opportunities
- **Applications**: Apply to jobs and track application status
- **Offers**: View and respond to job offers

### For Recruiters
- **Company Registration**: Register company with approval workflow
- **Job Posting**: Create and manage job postings with eligibility criteria
- **Application Management**: Review applications, shortlist candidates
- **Offer Management**: Send and manage job offers

### For Administrators
- **Dashboard Analytics**: Real-time placement statistics
- **User Management**: Manage students, recruiters, and admins
- **Company Approval**: Approve/reject company registrations
- **Announcements**: Create targeted announcements
- **Reports**: Export placement data to CSV

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh tokens)
- **Validation**: Joi
- **File Upload**: Multer
- **Email**: Nodemailer
- **Job Queue**: Bull + Redis
- **Logging**: Winston + Morgan

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS
- **Forms**: Formik + Yup
- **Icons**: Heroicons
- **Charts**: Chart.js

## Project Structure

```
Placement Portal/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── validators/      # Joi validation schemas
│   ├── uploads/             # File uploads directory
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml       # Production compose
├── docker-compose.dev.yml   # Development compose
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis 7+
- npm or yarn

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd "Placement Portal"
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
# Edit .env with your configuration
```

3. Start with Docker Compose:
```bash
# Production mode
docker-compose up -d

# Development mode (MongoDB + Redis only)
docker-compose -f docker-compose.dev.yml up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB Express (dev): http://localhost:8081

### Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/placement_portal

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@placement.edu

# Frontend URL (for CORS and emails)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Students
- `GET /api/students/profile` - Get profile
- `POST /api/students/profile` - Create profile
- `PATCH /api/students/profile` - Update profile
- `POST /api/students/profile/resume` - Upload resume
- `GET /api/students` - Get all students (admin/recruiter)

### Jobs
- `GET /api/jobs` - Get all active jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (recruiter)
- `PATCH /api/jobs/:id` - Update job
- `GET /api/jobs/eligible` - Get eligible jobs (student)

### Applications
- `POST /api/applications` - Apply to job
- `GET /api/applications/my-applications` - Get my applications
- `PATCH /api/applications/:id/status` - Update status
- `PATCH /api/applications/:id/withdraw` - Withdraw application

### Companies
- `POST /api/companies` - Register company
- `GET /api/companies` - Get approved companies
- `PATCH /api/companies/:id/approve` - Approve company (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/stats/placements` - Placement statistics
- `GET /api/admin/export/students` - Export students CSV

## Default Credentials

After initialization, a superadmin account is created:
- **Email**: admin@placement.edu
- **Password**: Admin@123

⚠️ **Change this password immediately in production!**

## Architecture

The application follows a clean architecture pattern:

```
Request → Routes → Controllers → Services → Repositories → Models
                       ↓
                  Validators
```

- **Routes**: Define API endpoints
- **Controllers**: Handle HTTP request/response
- **Services**: Business logic
- **Repositories**: Data access layer
- **Models**: MongoDB schemas

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- Input validation with Joi
- File type validation for uploads
- Role-based access control

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
