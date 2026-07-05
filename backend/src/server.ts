import './config-env';

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { securityHeaders } from './middleware/securityHeaders';

// Import Express Routers
import authRouter from './routes/authRoutes';
import employeeRouter from './routes/employeeRoutes';
import attendanceRouter from './routes/attendanceRoutes';
import leaveRouter from './routes/leaveRoutes';
import payrollRouter from './routes/payrollRoutes';
import chatRouter from './routes/chatRoutes';
import walletRouter from './routes/walletRoutes';
import settingsRouter from './routes/settingsRoutes';
import otherRouter from './routes/otherRoutes';
import recruitmentRouter from './routes/recruitmentRoutes';
import dailyUpdateRouter from './routes/dailyUpdateRoutes';
import reportRouter from './routes/reportRoutes';
import companyRouter from './routes/companyRoutes';
import systemNotificationRouter from './routes/systemNotificationRoutes';
import employeeDashboardRouter from './routes/employeeDashboardRoutes';
import hrDashboardRouter from './routes/hrDashboardRoutes';
import adminDashboardRouter from './routes/adminDashboardRoutes';
import expenseRouter from './routes/expenseRoutes';
import saasRouter from './routes/saasRoutes';
import resignationRouter from './routes/resignationRoutes';
import onboardingRouter from './routes/onboardingRoutes';
import organizationRouter from './routes/organizationRoutes';
import { initSocket } from './config/socket';
import projectRouter from './routes/projectRoutes';
import recognitionRouter from './routes/recognitionRoutes';

const app = express();

// 1. Security Headers (must be FIRST middleware)
app.use(securityHeaders);

// 2. Enable Compression Middleware
app.use(compression());

// 2. Configure CORS with Production Safety
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: isProd 
    ? (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : '*',
  credentials: true
}));

// 4. Configure API Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 20,                 // 20 auth requests per 15 mins per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: 3000,               // 3000 requests per 15 mins per IP (applies to ALL requests)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' }
  // NOTE: No 'skip' bypass — authenticated users are rate limited too
});

// Apply rate limits
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

const PORT = process.env.PORT || 5000;

// Connect to Database dynamically to ensure config reads populated environment variables
const { connectToDatabase } = require('./database');
connectToDatabase()
  .then(async () => {
    console.log('Database connected successfully');

    // Seed default Expense policy and claims if empty
    try {
      const { Reimbursement } = await import('./models/Reimbursement');
      const { ExpensePolicy } = await import('./models/ExpensePolicy');
      const { Branch } = await import('./models/Branch');
      const { Department } = await import('./models/Department');
      const { Designation } = await import('./models/Designation');

      // Seed default branches
      const branchCount = await Branch.countDocuments();
      if (branchCount === 0) {
        console.log('Seeding default Branches...');
        await Branch.insertMany([
          {
            companyId: 'company_001',
            branchName: 'Pune Branch',
            branchCode: 'PUN001',
            branchType: 'Regional Office',
            address: '12, IT Park, Hinjawadi Phase 1',
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            postalCode: '411057',
            timezone: 'UTC+05:30 (Kolkata)',
            contactNumber: '+91 20 44556677',
            email: 'pune@company.com',
            status: 'Active'
          },
          {
            companyId: 'company_001',
            branchName: 'Mumbai Branch',
            branchCode: 'MUM001',
            branchType: 'Head Office',
            address: 'Naman Centre, BKC',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            postalCode: '400051',
            timezone: 'UTC+05:30 (Kolkata)',
            contactNumber: '+91 22 88990011',
            email: 'mumbai@company.com',
            status: 'Active'
          },
          {
            companyId: 'company_001',
            branchName: 'Bangalore Branch',
            branchCode: 'BLR001',
            branchType: 'Development Center',
            address: 'Prestige Tech Park, Outer Ring Road',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560103',
            timezone: 'UTC+05:30 (Kolkata)',
            contactNumber: '+91 80 11223344',
            email: 'bangalore@company.com',
            status: 'Active'
          }
        ]);
      }

      const puneBranch = await Branch.findOne({ branchCode: 'PUN001' });
      const mumbaiBranch = await Branch.findOne({ branchCode: 'MUM001' });

      // Seed default departments
      const deptCount = await Department.countDocuments();
      if (deptCount === 0) {
        console.log('Seeding default Departments...');
        await Department.insertMany([
          { companyId: 'company_001', branchId: puneBranch?._id?.toString() || '', departmentName: 'HR', description: 'Human Resources' },
          { companyId: 'company_001', branchId: puneBranch?._id?.toString() || '', departmentName: 'Engineering', description: 'Software Development' },
          { companyId: 'company_001', branchId: mumbaiBranch?._id?.toString() || '', departmentName: 'Sales', description: 'Business & Sales' }
        ]);
      }

      // Seed default designations
      const desigCount = await Designation.countDocuments();
      if (desigCount === 0) {
        console.log('Seeding default Designations...');
        await Designation.insertMany([
          { companyId: 'company_001', designationName: 'Software Engineer', level: 1 },
          { companyId: 'company_001', designationName: 'Senior Software Engineer', level: 2 },
          { companyId: 'company_001', designationName: 'HR Manager', level: 3 },
          { companyId: 'company_001', designationName: 'Sales Executive', level: 1 }
        ]);
      }

      const policyCount = await ExpensePolicy.countDocuments();
      if (policyCount === 0) {
        console.log('Seeding default Expense Policies...');
        await ExpensePolicy.create({
          companyId: 'company_001',
          travelLimit: 5000,
          foodLimit: 1500,
          hotelLimit: 8000,
          monthlyBudget: 200000,
          departmentBudget: {
            Engineering: 100000,
            Sales: 150000,
            HR: 50000,
            Marketing: 80000,
            Finance: 120000
          }
        });
      }

      const claimCount = await Reimbursement.countDocuments();
      if (claimCount === 0) {
        console.log('Seeding initial Expense Claims...');
        const defaultClaims = [
          {
            companyId: 'company_001',
            employee: 'employee@hrcore.com',
            employeeId: 'emp_001',
            name: 'Jane Doe',
            type: 'Internet',
            expenseType: 'Internet',
            amount: 999,
            claimDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: 'Monthly broadband internet subscription',
            status: 'Paid',
            project: 'Operations',
            department: 'Engineering',
            paidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            comments: [{ user: 'finance@hrcore.com', role: 'Finance', text: 'Approved and paid.', timestamp: new Date() }]
          },
          {
            companyId: 'company_001',
            employee: 'employee@hrcore.com',
            employeeId: 'emp_001',
            name: 'Jane Doe',
            type: 'Food',
            expenseType: 'Food',
            amount: 1200,
            claimDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expenseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: 'Client team dinner meeting',
            status: 'HR Review',
            project: 'Sales Pitch',
            department: 'Marketing',
            comments: []
          },
          {
            companyId: 'company_001',
            employee: 'employee@hrcore.com',
            employeeId: 'emp_001',
            name: 'Jane Doe',
            type: 'Hotel',
            expenseType: 'Hotel',
            amount: 6500,
            claimDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: 'Corporate annual retreat accommodation',
            status: 'Finance Approval',
            project: 'HR Alignment',
            department: 'HR',
            hrApproval: { status: 'Approved', approvedBy: 'hr@hrcore.com', approvedAt: new Date(), comment: 'Policy compliant.' },
            comments: [{ user: 'hr@hrcore.com', role: 'HR', text: 'Verified compliant with hotel policies.', timestamp: new Date() }]
          },
          {
            companyId: 'company_001',
            employee: 'employee@hrcore.com',
            employeeId: 'emp_001',
            name: 'Jane Doe',
            type: 'Travel',
            expenseType: 'Travel',
            amount: 1450,
            claimDate: new Date().toISOString().split('T')[0],
            expenseDate: new Date().toISOString().split('T')[0],
            description: 'Taxi fares for client site visit',
            status: 'Draft',
            project: 'Apollo Pitch',
            department: 'Engineering',
            comments: []
          }
        ];
        await Reimbursement.insertMany(defaultClaims);
      }
      // Seed Rewards & Recognition Defaults Dynamically
      try {
        const { Badge } = await import('./models/Badge');
        const { RewardCatalog } = await import('./models/RewardCatalog');
        const { Appreciation } = await import('./models/Appreciation');
        const { EmployeeOfTheMonth } = await import('./models/EmployeeOfTheMonth');
        const { Employee } = await import('./models/Employee');

        const activeEmployees = await Employee.find({ isActive: true }).limit(3);
        const companyId = activeEmployees[0]?.companyId || 'hrcore';

        const badgeCount = await Badge.countDocuments({ companyId });
        if (badgeCount === 0) {
          console.log(`[Seed] Seeding Recognition Badges for ${companyId}...`);
          await Badge.insertMany([
            { companyId, name: 'Star Performer', description: 'Consistently delivers high-quality results', icon: 'Award', points: 100, criteria: 'Exceeding target deliverables' },
            { companyId, name: 'Rising Star', description: 'Shows exceptional growth and promise', icon: 'Flame', points: 50, criteria: 'Rapid skill improvement' },
            { companyId, name: 'Team Player', description: 'Excellent collaborator and helper', icon: 'Users', points: 75, criteria: 'Supportive team behavior' },
            { companyId, name: 'Innovator', description: 'Proposes creative solutions and ideas', icon: 'Target', points: 150, criteria: 'New feature suggestion' }
          ]);
        }

        // Also seed fallback 'company_001' to guarantee values
        if (companyId !== 'company_001') {
          const badgeCount001 = await Badge.countDocuments({ companyId: 'company_001' });
          if (badgeCount001 === 0) {
            await Badge.insertMany([
              { companyId: 'company_001', name: 'Star Performer', description: 'Consistently delivers high-quality results', icon: 'Award', points: 100, criteria: 'Exceeding target deliverables' },
              { companyId: 'company_001', name: 'Rising Star', description: 'Shows exceptional growth and promise', icon: 'Flame', points: 50, criteria: 'Rapid skill improvement' },
              { companyId: 'company_001', name: 'Team Player', description: 'Excellent collaborator and helper', icon: 'Users', points: 75, criteria: 'Supportive team behavior' },
              { companyId: 'company_001', name: 'Innovator', description: 'Proposes creative solutions and ideas', icon: 'Target', points: 150, criteria: 'New feature suggestion' }
            ]);
          }
        }

        const catalogCount = await RewardCatalog.countDocuments({ companyId });
        if (catalogCount === 0) {
          console.log(`[Seed] Seeding Reward Catalog for ${companyId}...`);
          await RewardCatalog.insertMany([
            { companyId, name: 'Amazon Voucher (₹500)', pointsRequired: 500, category: 'Voucher', stock: 10, description: 'Digital Amazon Gift Card' },
            { companyId, name: 'Swiggy Voucher (₹250)', pointsRequired: 250, category: 'Voucher', stock: 20, description: 'Food delivery discount voucher' },
            { companyId, name: 'Extra Paid Leave Day', pointsRequired: 1000, category: 'Off-time', stock: 99, description: '1 day additional paid vacation' },
            { companyId, name: 'Company Premium Hoodie', pointsRequired: 800, category: 'Merchandise', stock: 5, description: 'High quality branded hoodie' }
          ]);
        }

        if (companyId !== 'company_001') {
          const catalogCount001 = await RewardCatalog.countDocuments({ companyId: 'company_001' });
          if (catalogCount001 === 0) {
            await RewardCatalog.insertMany([
              { companyId: 'company_001', name: 'Amazon Voucher (₹500)', pointsRequired: 500, category: 'Voucher', stock: 10, description: 'Digital Amazon Gift Card' },
              { companyId: 'company_001', name: 'Swiggy Voucher (₹250)', pointsRequired: 250, category: 'Voucher', stock: 20, description: 'Food delivery discount voucher' },
              { companyId: 'company_001', name: 'Extra Paid Leave Day', pointsRequired: 1000, category: 'Off-time', stock: 99, description: '1 day additional paid vacation' },
              { companyId: 'company_001', name: 'Company Premium Hoodie', pointsRequired: 800, category: 'Merchandise', stock: 5, description: 'High quality branded hoodie' }
            ]);
          }
        }

        const appCount = await Appreciation.countDocuments({ companyId });
        if (appCount === 0 && activeEmployees.length >= 2) {
          console.log(`[Seed] Seeding Sample Appreciations for ${companyId}...`);
          await Appreciation.create({
            companyId,
            senderId: activeEmployees[0]._id.toString(),
            senderName: activeEmployees[0].fullName,
            senderRole: activeEmployees[0].designation || 'Management',
            recipientId: activeEmployees[1]._id.toString(),
            recipientName: activeEmployees[1].fullName,
            message: `Thanks ${activeEmployees[1].fullName} for driving the Payroll Module integration and making it responsive!`,
            category: 'Excellence'
          });

          const eomCount = await EmployeeOfTheMonth.countDocuments({ companyId });
          if (eomCount === 0) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            await EmployeeOfTheMonth.create({
              companyId,
              employeeId: activeEmployees[1]._id.toString(),
              employeeName: activeEmployees[1].fullName,
              department: activeEmployees[1].department || 'Engineering',
              month: currentMonth,
              achievement: 'Spearheaded end-to-end integration and responsive layouts',
              rewardPoints: 500
            });
          }
        }
      } catch (err) {
        console.error('Failed to run initial database seed for rewards:', err);
      }
    } catch (seedErr) {
      console.error('Failed to run initial database seed for expenses:', seedErr);
    }
    
    
    // Start Report Scheduler Service
    try {
      const { ReportSchedulerService } = require('./services/reportSchedulerService');
      ReportSchedulerService.start();
    } catch (err) {
      console.error('Failed to start report scheduler service:', err);
    }
    
    // 4. Central Health Check Endpoint
    app.get('/api/health', async (req, res) => {
      const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
      res.status(dbStatus === 'Connected' ? 200 : 503).json({
        status: dbStatus === 'Connected' ? 'UP' : 'DOWN',
        database: dbStatus,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date()
      });
    });

    // Register the routes explicitly
    app.use('/api/auth', authRouter);
    app.use('/api/employees', employeeRouter);
    app.use('/api/attendance', attendanceRouter);
    app.use('/api/leaves', leaveRouter);
    app.use('/api/payroll', payrollRouter);
    app.use('/api/company', companyRouter);
    app.use('/api', chatRouter); // Chat contains sub-segments like /channels and /messages
    app.use('/api', walletRouter); // Wallet contains sub-segments like /wallet and /razorpay
    app.use('/api/settings', settingsRouter);
    app.use('/api/daily-updates', dailyUpdateRouter);
    app.use('/api/reports', reportRouter);
    app.use('/api/system-notifications', systemNotificationRouter);
    app.use('/api', saasRouter);
    app.use('/api', employeeDashboardRouter);
    app.use('/api', hrDashboardRouter);
    app.use('/api', adminDashboardRouter);
    app.use('/api', otherRouter); // Other contains hello, presence, referrals, jobs, etc.
    app.use('/api', recruitmentRouter); // Recruitment ATS and Career Portal APIs
    app.use('/api/expenses', expenseRouter);
    app.use('/api/resignations', resignationRouter);
    app.use('/api/onboarding', onboardingRouter);
    app.use('/api', organizationRouter);
    app.use('/api', projectRouter); // Project Management Module
    app.use('/api/recognition', recognitionRouter); // Rewards & Recognition Module

    // 5. Central Global Error Handling Middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Centralized Server Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    });

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start backend server due to database connection error:', err);
    process.exit(1);
  });
