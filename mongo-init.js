// MongoDB initialization script
// This runs when MongoDB container is first created

db = db.getSiblingDB('placement_portal');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        role: {
          enum: ['student', 'recruiter', 'admin', 'superadmin'],
          description: 'must be a valid role'
        }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.studentprofiles.createIndex({ user: 1 }, { unique: true });
db.studentprofiles.createIndex({ rollNumber: 1 }, { unique: true });
db.studentprofiles.createIndex({ batch: 1 });
db.studentprofiles.createIndex({ branch: 1 });
db.studentprofiles.createIndex({ cgpa: 1 });
db.studentprofiles.createIndex({ placementStatus: 1 });

db.companies.createIndex({ slug: 1 }, { unique: true });
db.companies.createIndex({ status: 1 });
db.companies.createIndex({ createdBy: 1 });

db.jobs.createIndex({ company: 1 });
db.jobs.createIndex({ status: 1 });
db.jobs.createIndex({ 'eligibility.minCGPA': 1 });
db.jobs.createIndex({ deadline: 1 });
db.jobs.createIndex({ createdAt: -1 });

db.applications.createIndex({ student: 1, job: 1 }, { unique: true });
db.applications.createIndex({ job: 1 });
db.applications.createIndex({ status: 1 });
db.applications.createIndex({ appliedAt: -1 });

db.offers.createIndex({ student: 1 });
db.offers.createIndex({ job: 1 });
db.offers.createIndex({ status: 1 });
db.offers.createIndex({ expiresAt: 1 });

db.announcements.createIndex({ isActive: 1, publishAt: 1 });
db.announcements.createIndex({ createdBy: 1 });

// Create initial superadmin user (password: Admin@123)
db.users.insertOne({
  email: 'admin@placement.edu',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4iMAaERF0ZwghzfC', // bcrypt hash of Admin@123
  firstName: 'Super',
  lastName: 'Admin',
  role: 'superadmin',
  isActive: true,
  isEmailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialization completed successfully!');
print('Default superadmin created: admin@placement.edu / Admin@123');
