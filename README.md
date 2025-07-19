# TenantFlow - Multi-Tenant SaaS Platform

A complete multi-tenant SaaS platform with real-time ticket management, workflow automation, and tenant isolation.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (for cloning the repository)

### Start the Platform
```bash
# Clone and navigate to project
git clone https://github.com/adhi982/Tenantflow-multisupport-platform.git
cd tenantflow-platform

# Start all services
docker-compose up -d

# Seed database with test tenants
docker exec tenantflow-backend node seed-users.js

# Access the application
open http://localhost:3000
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TenantFlow Architecture                      │
└─────────────────────────────────────────────────────────────────┘
                             
                        ┌─────────────────┐
                        │  Frontend Shell │
                        │   (Port 3000)   │
                        │                 │
                        │ - Dashboard     │
                        │ - Login/Auth    │
                        │ - Ticket UI     │
                        └─────────────────┘
                                 │
                                 │ HTTP/WebSocket
                                 ▼
                        ┌─────────────────┐
                        │   Backend API   │
                        │   (Port 3001)   │
                        │                 │
                        │ - JWT Auth      │
                        │ - REST APIs     │
                        │ - Webhooks      │
                        │ - Multi-tenant  │
                        └─────────────────┘
                              │         │
                    ┌─────────┘         └─────────┐
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │    MongoDB      │           │      N8N        │
          │  (Port 27017)   │           │  (Port 5678)    │
          │                 │           │                 │
          │ - Users         │◄──────────┤ - Workflows     │
          │ - Tickets       │  Callback │ - Automation    │
          │ - Audit Logs    │           │ - Email Alerts  │
          └─────────────────┘           └─────────────────┘

```
<img width="680" height="631" alt="Tenant Isolation" src="https://github.com/user-attachments/assets/484c5248-611b-46ad-beee-348b8d229d47" />

## 👥 Test Tenants

The platform includes two pre-configured tenants:

### LogisticsCo
- **Admin**: `admin@logistics-co.com` / `admin123`
- **Support**: `support1@logisticsco.com` / `user123`
- **Customer ID**: `logistics-co`

### RetailGmbH  
- **Admin**: `admin@retail-gmbh.com` / `admin123`
- **Support**: `support1@retailgmbh.de` / `user123`
- **Customer ID**: `retail-gmbh`

## 🔥 Key Features

### ✅ Multi-Tenancy
- Complete tenant isolation at database level
- Tenant-specific user management
- JWT tokens with customerId context

### ✅ Real-Time Dashboard
- Auto-refreshing ticket status updates
- Live activity feed showing workflow progress
- Tenant-specific metrics and analytics

### ✅ Workflow Automation
- N8N integration for automated ticket processing
- Webhook-based status callbacks
- Email notifications for high-priority tickets

### ✅ Robust Authentication
- JWT-based authentication with role validation
- Role-based access control (Admin/User)
- Secure password hashing with bcrypt

## 🎬 Demo Flow

1. **Login as LogisticsCo Admin**
   - Navigate to http://localhost:3000
   - Use credentials: `admin@logistics-co.com` / `admin123`
   - Customer ID: `logistics-co`

2. **Create a Ticket**
   - Go to Tickets section in dashboard
   - Create a new high-priority ticket
   - Observe automatic workflow trigger

3. **Monitor Real-Time Updates**
   - Watch dashboard for status changes
   - See activity logs update automatically
   - Note workflow progression in real-time

4. **Test Tenant Isolation**
   - Logout and login as RetailGmbH Admin
   - Verify completely separate ticket view
   - Confirm zero cross-tenant data access

## 🏢 Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Frontend Shell | 3000 | Main dashboard and authentication UI |
| Backend API | 3001 | REST API and business logic |
| N8N Workflows | 5678 | Automation and workflow engine |
| MongoDB | 27017 | Database and data persistence |

## 🛠️ Development Commands

```bash
# View all services status
docker-compose ps

# View logs for specific service
docker-compose logs frontend-shell
docker-compose logs backend

# Restart a specific service
docker-compose restart backend

# Stop everything
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## 📊 Database Access

```bash
# Access MongoDB shell
docker exec -it tenantflow-mongodb mongosh tenantflow

# View collections
show collections

# Check users
db.users.find().pretty()

# Check tickets by tenant
db.tickets.find({"customerId": "logistics-co"}).pretty()
```

## 📊 Core Requirements Verification

### ✅ R1: Auth & RBAC
- JWT tokens carry customerId and role
- Admin/User role-based access control
- bcrypt password hashing implementation

### ✅ R2: Tenant Data Isolation  
- All MongoDB collections include customerId field
- Middleware enforces strict tenant boundaries
- Cross-tenant data access completely blocked

### ✅ R3: Use-Case Registry
- Tenant-specific screen configurations
- Dynamic navigation based on tenant context
- Role-based feature access

### ✅ R4: Dynamic Navigation
- React shell with tenant-aware routing
- Dynamic sidebar generation
- Context-sensitive user interface

### ✅ R5: Workflow Integration
- N8N container fully integrated
- POST /api/tickets triggers workflows
- Webhook callbacks update ticket status
- Real-time UI updates via polling

### ✅ R6: Containerized Development
- Complete Docker Compose setup
- Auto-configuration on startup
- Health checks for all services

## 🗂️ Project Structure

```
tenantflow-platform/
├── backend/                 # Node.js API with Express
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── middleware/      # Auth & tenant isolation
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoint definitions
│   │   ├── services/        # Business logic layer
│   │   └── utils/           # Helper functions
│   ├── seed-users.js        # Database seeding script
│   └── Dockerfile           # Backend container config
├── frontend-shell/          # React main application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # API client services
│   │   └── App.js           # Main application
│   └── Dockerfile           # Frontend container config
├── n8n-workflows/           # Workflow definitions
│   └── tenantflow-Ticket-Processing.json
├── docker-compose.yml       # Container orchestration
├── verify-submission.bat    # Platform verification script
├── SUBMISSION_CHECKLIST.md  # Demo guidelines
└── README.md               # This documentation
```

## 🔐 Security Features

- JWT authentication with tenant isolation
- bcrypt password hashing (12 rounds)
- CORS security headers
- Input validation and sanitization
- Role-based access control
- Tenant isolation middleware
- Secure API endpoint protection

## 📈 Workflow Example

1. **User creates ticket** → POST /api/tickets
2. **Backend triggers N8N** → Webhook to workflow engine
3. **N8N processes ticket** → Automated business logic
4. **N8N calls back** → POST /webhook/n8n-callback
5. **Backend updates status** → MongoDB status update
6. **Frontend refreshes** → Real-time dashboard update

## 🐳 Docker Services

| Container | Port | Status | Description |
|-----------|------|--------|-------------|
| tenantflow-frontend-shell | 3000 | ✅ Running | React dashboard |
| tenantflow-backend | 3001 | ✅ Running | Node.js API |
| tenantflow-n8n | 5678 | ✅ Running | Workflow engine |
| tenantflow-mongodb | 27017 | ✅ Running | Database |

## 📝 API Documentation

### Authentication
- `POST /auth/login` - User login with tenant context
- `GET /me` - Current user profile

### Tickets
- `GET /api/tickets` - List tickets (tenant-filtered)
- `POST /api/tickets` - Create ticket + trigger workflow
- `PUT /api/tickets/:id` - Update ticket
- `GET /api/tickets/:id` - Get ticket details

### Dashboard
- `GET /api/dashboard/stats` - Tenant dashboard metrics
- `GET /api/dashboard/activities` - Recent activity feed

### Webhooks
- `POST /webhook/n8n-callback` - N8N workflow callback

## 🚨 Known Limitations

1. **Development Environment**: Basic security configuration for local development
2. **Single Database**: Production would use separate databases per tenant
3. **Email Integration**: Requires Gmail OAuth configuration for N8N
4. **Real-time**: Currently using polling (WebSocket would be production enhancement)
5. **SSL**: No HTTPS configured (production requirement)

## 🎥 Demo Video Highlights

✅ **Multi-tenant Login**: Both LogisticsCo and RetailGmbH  
✅ **Ticket Creation**: High-priority ticket demonstration  
✅ **Real-time Updates**: Status changes visible immediately  
✅ **Tenant Isolation**: Complete data separation proof  
✅ **Workflow Automation**: N8N integration showcase  
✅ **Dashboard Functionality**: Live metrics and activity feed  


## 🔧 Environment Configuration

All environment variables are pre-configured in docker-compose.yml:
- `MONGODB_URL` - Database connection string
- `JWT_SECRET` - Authentication token secret
- `NODE_ENV` - Application environment
- `N8N_BASIC_AUTH_ACTIVE` - Workflow engine security

## ⚡ Quick Verification

Run the verification script to ensure everything works:

```bash
# Windows
.\verify-submission.bat

# Check all services are healthy
docker-compose ps

# Access the platform
http://localhost:3000
```

## 🎯 Target Categories

Valid ticket categories for testing:
- `technical` - System and technical issues
- `billing` - Payment and billing matters
- `general` - General inquiries and requests
- `feature-request` - New feature requests
- `bug-report` - Software bugs and defects

Valid priorities: `low`, `medium`, `high`, `urgent`

## 🚀 Production Deployment Considerations

- Implement HTTPS/SSL certificates
- Use separate databases per tenant
- Add comprehensive monitoring
- Implement WebSocket for real-time updates
- Add load balancing for scalability
- Enhance security with rate limiting
- Add comprehensive logging and alerting

---

**Repository**: https://github.com/adhi982/Tenantflow-multisupport-platform.git  
**Built with**: Node.js, React, MongoDB, Docker, N8N  
**Architecture**: Multi-tenant microservices with container orchestration  
**Deployment**: Docker Compose for streamlined development  

