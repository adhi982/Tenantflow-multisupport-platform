# TenantFlow - Multi-Tenant SaaS Platform

A complete multi-tenant SaaS platform with real-time ticket management, workflow automation, and tenant isolation.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (for cloning the repository)

### Start the Platform
```bash
# Clone and navigate to project
git clone <your-repo-url>
cd tenantflow-platform

# Start all services
docker-compose up -d

# Seed database with test tenants
docker exec tenantflow-backend node seed-users.js

# Access the application
open http://localhost:3000
```

## 🏗️ Architecture

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

┌─────────────────────────────────────────────────────────────────┐
│                      Data Flow                                  │
└─────────────────────────────────────────────────────────────────┘

1. User Login → JWT Token → Dashboard Access
2. Create Ticket → Store in MongoDB → Trigger N8N
3. N8N Process → Email Alert → Webhook Callback
4. Update Status → Real-time UI Refresh

┌─────────────────────────────────────────────────────────────────┐
│                   Tenant Isolation                              │
└─────────────────────────────────────────────────────────────────┘

LogisticsCo ────┐                    ┌──── RetailGmbH
Data            │                    │     Data
                ▼                    ▼
            ┌─────────────────────────────┐
            │     Backend Middleware      │
            │   (customerId filtering)    │
            └─────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  MongoDB    │
                  │ Collections │
                  └─────────────┘

## 👥 Test Tenants

The platform includes two pre-configured tenants:

### LogisticsCo
- **Admin**: `admin@logisticsco.com` / `admin123`
- **Support**: `support1@logisticsco.com` / `user123`
- **Customer ID**: `logistics-co`

### RetailGmbH  
- **Admin**: `admin@retailgmbh.de` / `admin123`
- **Support**: `support1@retailgmbh.de` / `user123`
- **Customer ID**: `retail-gmbh`

## 🔥 Key Features

### ✅ Multi-Tenancy
- Complete tenant isolation at database level
- Tenant-specific user management
- Isolated ticket systems per tenant

### ✅ Real-Time Dashboard
- Auto-refreshing workflow status (10-second intervals)
- Live activity feed
- Tenant-specific metrics

### ✅ Workflow Automation
- N8N integration for ticket processing
- Webhook-based status updates
- Email notifications for high-priority tickets

### ✅ Robust Authentication
- JWT-based authentication
- Role-based access control (Admin/User)
- Secure password hashing

## 🎬 Demo Flow

1. **Login as LogisticsCo Admin**
   - Navigate to http://localhost:3000
   - Use credentials: `admin@logisticsco.com` / `admin123`
   - Customer ID: `logistics-co`

2. **Create a Ticket**
   - Go to Tickets section
   - Create a new high-priority ticket
   - Observe workflow trigger

3. **Monitor Real-Time Updates**
   - Watch dashboard for status changes
   - See activity logs update in real-time
   - Note workflow progression

4. **Test Tenant Isolation**
   - Logout and login as RetailGmbH Admin
   - Verify separate ticket view
   - Confirm data isolation

## � Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Frontend Shell | 3000 | Main dashboard and authentication |
| Tickets Frontend | 3002 | Ticket management interface |
| Backend API | 3001 | REST API and business logic |
| N8N Workflows | 5678 | Automation and workflow engine |
| MongoDB | 27017 | Database and data persistence |

## 🛠️ Development Commands

```bash
# View all services status
docker-compose ps

# View logs for specific service
docker-compose logs frontend-shell

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
docker exec -it tenantflow-mongodb mongosh --username admin --password password123 --authenticationDatabase admin

# Or use MongoDB Compass with:
# mongodb://admin:password123@localhost:27017/?authSource=admin
```

## 🚨 Known Limitations

1. **Development Environment**: Currently configured for local development with basic security
2. **Email Integration**: Requires Gmail OAuth setup for N8N email notifications
3. **Scalability**: Single MongoDB instance (production would need replica sets)
4. **SSL**: No HTTPS configured (production requirement)
5. **Monitoring**: Basic health checks (production needs comprehensive monitoring)

## 🔧 Environment Configuration

Key environment variables (already configured in docker-compose.yml):
- `NODE_ENV=development`
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication secret
- `N8N_BASIC_AUTH` - Workflow engine access

## 📝 API Documentation

Once running, access interactive API docs at:
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🏢 Multi-Tenant Features Demonstrated

- **Data Isolation**: Each tenant sees only their data
- **User Management**: Tenant-specific user accounts
- **Workflow Isolation**: Separate N8N workflows per tenant
- **Dashboard Customization**: Tenant-branded interfaces
- **Activity Tracking**: Tenant-specific audit logs

## 📹 Demo Video Checklist

✅ Show login for both tenants  
✅ Demonstrate ticket creation  
✅ Prove real-time status updates  
✅ Verify tenant data isolation  
✅ Show workflow automation  
✅ Display dashboard functionality  

---

**Built with**: Node.js, React, MongoDB, Docker, N8N
**Architecture**: Microservices with container orchestration
**Deployment**: Docker Compose for easy local development

### 1. Clone & Setup
```bash
git clone <repository-url>
cd tenantflow-platform
cp .env.example .env
```

### 2. Start Development Environment
```bash
# Install all dependencies
npm run install:all

# Start all services with Docker
npm run dev
```

### 3. Access the Platform
- **Frontend Shell**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **n8n Workflows**: http://localhost:5678 (admin/tenantflow123)
- **MongoDB**: localhost:27017

### 4. Login Credentials
```
LogisticsCo Admin:
Email: admin@logisticsco.com
Password: Admin123!

RetailGmbH Admin:  
Email: admin@retailgmbh.com
Password: Admin123!
```

## 📊 Core Requirements Verification

### ✅ R1: Auth & RBAC
- JWT tokens with customerId and role
- Admin-only routes protected
- bcrypt password hashing

### ✅ R2: Tenant Data Isolation  
- All MongoDB collections include customerId
- Jest test proves cross-tenant isolation
- Middleware enforces tenant boundaries

### ✅ R3: Use-Case Registry
- `registry.json` maps tenant screens
- `/me/screens` endpoint returns tenant config
- Dynamic navigation generation

### ✅ R4: Dynamic Navigation
- React shell fetches tenant screens
- Webpack Module Federation for micro-frontends
- Lazy-loaded SupportTicketsApp

### ✅ R5: Workflow Integration
- n8n container in docker-compose
- POST /api/tickets triggers workflow
- Webhook callback updates ticket status
- Real-time UI updates

### ✅ R6: Containerized Development
- Complete docker-compose setup
- Auto-configuration on startup
- Health checks for all services

## 🗂️ Project Structure

```
flowbit-platform/
├── backend/                 # Node.js API with Express
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, tenant isolation
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   └── tests/               # Jest unit tests
├── frontend-shell/          # React main application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   └── services/        # API clients
│   └── webpack.config.js    # Module Federation config
├── frontend-tickets/        # Support tickets micro-frontend
│   ├── src/
│   │   ├── components/      # Ticket-specific components
│   │   └── hooks/           # Ticket management hooks
│   └── webpack.config.js    # Remote module config
├── n8n-workflows/           # Workflow definitions
├── seed-data/              # Initial tenant data
├── docker-compose.yml      # Container orchestration
└── registry.json          # Tenant configuration
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Critical Tenant Isolation Test
```bash
cd backend
npm run test -- --testNamePattern="Tenant Data Isolation"
```

### E2E Testing (Optional)
```bash
cd frontend-shell
npm run test:e2e
```

## 🔧 Development Scripts

```bash
# Development
npm run dev                 # Start all services
npm run dev:backend        # Backend only  
npm run dev:frontend       # Frontend shell only
npm run dev:tickets        # Tickets app only

# Building
npm run build              # Build all apps
npm run build:backend      # Build backend
npm run build:frontend     # Build frontend shell
npm run build:tickets      # Build tickets app

# Database
npm run seed               # Seed database with test data

# Maintenance
npm run clean              # Clean Docker environment
npm run install:all        # Install all dependencies
```

## 🔐 Security Features

- JWT authentication with tenant context
- bcrypt password hashing (12 rounds)
- CORS configuration
- Rate limiting
- Input validation (Joi)
- Helmet security headers
- Tenant isolation middleware

## 📈 Workflow Example

1. **User creates ticket** → POST /api/tickets
2. **Backend triggers n8n** → Webhook to n8n workflow  
3. **n8n processes ticket** → Business logic execution
4. **n8n calls back** → POST /webhook/ticket-done
5. **Backend updates status** → MongoDB update
6. **Frontend refreshes** → Real-time status update

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend-shell | 3000 | React main application |
| backend | 3001 | Node.js API server |
| frontend-tickets | 3002 | Tickets micro-frontend |
| n8n | 5678 | Workflow automation |
| mongodb | 27017 | Database |
| ngrok | 4040 | Webhook tunnel (optional) |

## 📝 API Documentation

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout  
- `GET /me` - Current user info

### Tickets
- `GET /api/tickets` - List tickets (tenant-filtered)
- `POST /api/tickets` - Create ticket + trigger workflow
- `PUT /api/tickets/:id` - Update ticket
- `GET /api/tickets/:id` - Get ticket details

### Tenant Configuration
- `GET /me/screens` - Get tenant screen configuration

### Webhooks
- `POST /webhook/ticket-done` - n8n callback endpoint

## 🚨 Known Limitations

- Single database instance (would use database per tenant in production)
- Basic n8n workflow templates (would be more complex in production)
- No real-time WebSocket implementation (using polling)
- Limited error handling in demo scenarios

## 🎥 Demo Video Highlights

The demo video showcases:
1. Login as LogisticsCo admin
2. Create support ticket
3. n8n workflow automatic trigger
4. Real-time status update
5. Switch to RetailGmbH tenant
6. Verify complete data isolation
7. Role-based access demonstration

## 🔮 Future Enhancements

- WebSocket real-time updates
- Advanced audit logging
- Multi-database tenant isolation  
- Advanced RBAC permissions
- Monitoring and analytics
- Auto-scaling capabilities

## 👥 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

