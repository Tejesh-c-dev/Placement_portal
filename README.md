# College Placement Portal

A full-stack **MERN** application that streamlines the college placement process — connecting **students**, **recruiters**, and **administrators** on one platform. Students build profiles and apply to jobs, recruiters post openings and manage offers, and admins get real-time analytics and full control.

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

---

## Features

### For Students
| | |
|---|---|
| **Profile Management** | Create and manage academic profile — CGPA, skills, projects |
| **Resume Upload** | Upload and manage PDF resumes |
| **Job Search** | Browse and search for job opportunities |
| **Applications** | Apply to jobs and track application status in real time |
| **Offers** | View and respond to job offers |

### For Recruiters
| | |
|---|---|
| **Company Registration** | Register your company with an approval workflow |
| **Job Posting** | Create and manage job postings with eligibility criteria |
| **Application Management** | Review applications and shortlist candidates |
| **Offer Management** | Send and manage job offers |

### For Administrators
| | |
|---|---|
| **Dashboard Analytics** | Real-time placement statistics |
| **User Management** | Manage students, recruiters, and admins |
| **Company Approval** | Approve or reject company registrations |
| **Announcements** | Create targeted announcements |
| **Reports** | Export placement data to CSV |

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ | Runtime |
| Express.js | Web framework |
| MongoDB + Mongoose | Database & ODM |
| JWT (Access + Refresh tokens) | Authentication |
| Joi | Input validation |
| Multer | File uploads |
| Nodemailer | Email delivery |
| Bull + Redis | Job queueing |
| Winston + Morgan | Logging |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework & build tool |
| React Router v6 | Routing |
| Zustand | State management |
| TanStack Query | Server-state / data fetching |
| Tailwind CSS | Styling |
| Formik + Yup | Form handling & validation |
| Heroicons | Icons |
| Chart.js | Charts & analytics |

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

```bash
# 1. Clone the repository
git clone <repository-url>
cd "Placement Portal"

# 2. Create your environment file from the template
cp backend/.env.example backend/.env

# 3a. Production mode
docker-compose up -d

# 3b. Development mode (MongoDB + Redis only)
docker-compose -f docker-compose.dev.yml up -d
```

Once running, access the app:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| MongoDB Express (dev) | http://localhost:8081 |

### Manual Setup

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with your configuration
npm run dev
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

> **First run:** run `npm run seed` (in `backend/`) to bootstrap the superadmin account. Configure the initial credentials via `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` in your `.env`.

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in your values. Below is a reference of what each variable controls.

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Backend port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/placement_portal` |
| `MONGODB_URI_TEST` | Test database connection | `mongodb://localhost:27017/placement_portal_test` |
| `SUPERADMIN_EMAIL` | Superadmin account email (bootstrap) | `admin@yourdomain.com` |
| `SUPERADMIN_PASSWORD` | Superadmin account password (bootstrap) | `your-strong-password` |
| `JWT_ACCESS_SECRET` | JWT access token secret | `your-super-secure-access-secret` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your-super-secure-refresh-secret` |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` |
| `RESET_PASSWORD_EXPIRY` | Password reset token lifetime (ms) | `3600000` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` |
| `UPLOAD_PATH` | Uploads directory | `./uploads` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password / app password | `your-app-password` |
| `EMAIL_FROM` | Outgoing email address | `noreply@placementportal.com` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `DEFAULT_PAGE_SIZE` | Pagination default | `10` |
| `MAX_PAGE_SIZE` | Pagination maximum | `100` |
| `FRONTEND_URL` | Frontend URL (for email links) | `http://localhost:3000` |

> **Security:** never commit real secrets. Use strong, unique values for all JWT secrets, SMTP credentials, and the superadmin password — especially in production. The `.env` file is git-ignored; only the `.env.example` template belongs in version control.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students/profile` | Get profile |
| POST | `/api/students/profile` | Create profile |
| PATCH | `/api/students/profile` | Update profile |
| POST | `/api/students/profile/resume` | Upload resume |
| GET | `/api/students` | Get all students (admin/recruiter) |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | Get all active jobs |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs` | Create job (recruiter) |
| PATCH | `/api/jobs/:id` | Update job |
| GET | `/api/jobs/eligible` | Get eligible jobs (student) |

### Applications
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/applications` | Apply to job |
| GET | `/api/applications/my-applications` | Get my applications |
| PATCH | `/api/applications/:id/status` | Update status |
| PATCH | `/api/applications/:id/withdraw` | Withdraw application |

### Companies
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/companies` | Register company |
| GET | `/api/companies` | Get approved companies |
| PATCH | `/api/companies/:id/approve` | Approve company (admin) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard analytics |
| GET | `/api/admin/stats/placements` | Placement statistics |
| GET | `/api/admin/export/students` | Export students CSV |

## Architecture

The application follows a clean architecture pattern:

```
Request → Routes → Controllers → Services → Repositories → Models
                       ↓
                  Validators
```

| Layer | Responsibility |
|---|---|
| **Routes** | Define API endpoints |
| **Controllers** | Handle HTTP request/response |
| **Services** | Business logic |
| **Repositories** | Data access layer |
| **Models** | MongoDB schemas |

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
