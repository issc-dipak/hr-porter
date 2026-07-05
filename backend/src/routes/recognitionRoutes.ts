import express, { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Appreciation } from '../models/Appreciation';
import { Badge, EmployeeBadge } from '../models/Badge';
import { RewardCatalog } from '../models/RewardCatalog';
import { Redemption } from '../models/Redemption';
import { Nomination } from '../models/Nomination';
import { EmployeeOfTheMonth } from '../models/EmployeeOfTheMonth';
import { Employee } from '../models/Employee';
import {
  RewardProgram,
  RewardCategory,
  RewardTransaction,
  EmployeeCertificate,
  Campaign,
  RecognitionAuditLog
} from '../models/recognitionModels';
import { emitToRoom, emitToUser } from '../config/socket';

const router: Router = express.Router();
router.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-if-unset-for-safety';

// Strict token-decoding middleware
const authMiddleware = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;

    // Auto-inject authenticated company context
    if (decoded.companyId) {
      req.query = req.query || {};
      req.body = req.body || {};
      req.query.companyId = decoded.companyId;
      req.body.companyId = decoded.companyId;
    }
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

const injectEmployeeContext = async (req: any, res: any, next: any) => {
  try {
    if (req.user?.email) {
      const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (emp) {
        req.user.employeeId = emp._id.toString();
        req.user.id = emp._id.toString();
        req.user.fullName = emp.fullName;
      }
    }
    next();
  } catch (e) {
    console.error('injectEmployeeContext middleware error:', e);
    next();
  }
};

router.use(authMiddleware);
router.use(injectEmployeeContext);

const getCompanyId = (req: any): string => {
  let cid = req.query.companyId || req.body.companyId || 'company_001';
  if (cid === 'p') cid = 'company_p';
  if (cid && !cid.startsWith('company_') && cid !== 'hrcore') {
    cid = 'company_' + cid;
  }
  return cid;
};

// Helper: Enforce RBAC validation checks
const checkRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role || 'Employee';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, error: `Forbidden: Access restricted for role: ${userRole}` });
    }
    next();
  };
};

// Helper: Log audit action
const logAudit = async (req: any, action: any, targetId?: string, targetName?: string) => {
  try {
    const companyId = getCompanyId(req);
    await RecognitionAuditLog.create({
      companyId,
      action,
      actorId: req.user?.employeeId || req.user?.id || 'Unknown',
      actorName: req.user?.fullName || req.user?.email || 'Unknown',
      actorRole: req.user?.role || 'Employee',
      targetId,
      targetName,
      ipAddress: req.ip || req.connection?.remoteAddress,
      branchId: req.user?.branchId || ''
    });
  } catch (e) {
    console.error('Audit Logging failed:', e);
  }
};

// ── 1. DASHBOARD ANALYTICS ──
router.get('/dashboard', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const employeeId = req.user?.employeeId || req.user?.id;

    const totalAppreciations = await Appreciation.countDocuments({ companyId });
    const totalBadges = await EmployeeBadge.countDocuments({ companyId });
    const totalRedemptions = await Redemption.countDocuments({ companyId });

    // Calculate total points awarded vs redeemed
    const pointsAwardedAgg = await EmployeeBadge.aggregate([
      { $match: { companyId } },
      { $group: { _id: null, total: { $sum: '$badgePoints' } } }
    ]);
    const totalPointsAwarded = pointsAwardedAgg[0]?.total || 0;

    const pointsRedeemedAgg = await Redemption.aggregate([
      { $match: { companyId, status: { $ne: 'Rejected' } } },
      { $group: { _id: null, total: { $sum: '$pointsRedeemed' } } }
    ]);
    const totalPointsRedeemed = pointsRedeemedAgg[0]?.total || 0;

    // Get Employee of the Month (current month or latest)
    const latestEom = await EmployeeOfTheMonth.findOne({ companyId }).sort({ month: -1 });

    // Get Top Performing / Most Recognized Employees (based on earned badges)
    const topPerformers = await EmployeeBadge.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$employeeId', name: { $first: '$employeeName' }, count: { $sum: 1 }, points: { $sum: '$badgePoints' } } },
      { $sort: { points: -1 } },
      { $limit: 5 }
    ]);

    // Recognition trends (by category)
    const categoryTrends = await Appreciation.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Logged in Employee specific stats
    let myStats = null;
    if (employeeId) {
      const emp = await Employee.findOne({ _id: employeeId });
      const myBadgesCount = await EmployeeBadge.countDocuments({ companyId, employeeId });
      const myAppreciationsGiven = await Appreciation.countDocuments({ companyId, senderId: employeeId });
      const myAppreciationsReceived = await Appreciation.countDocuments({ companyId, recipientId: employeeId });

      myStats = {
        pointsBalance: emp?.rewardPoints || 0,
        badgesCount: myBadgesCount,
        appreciationsGiven: myAppreciationsGiven,
        appreciationsReceived: myAppreciationsReceived
      };
    }

    res.json({
      success: true,
      data: {
        totalAppreciations,
        totalBadges,
        totalRedemptions,
        totalPointsAwarded,
        totalPointsRedeemed,
        latestEom,
        topPerformers,
        categoryTrends,
        myStats
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 2. REWARD PROGRAMS (ADMIN ONLY CREATE, ALL VIEW) ──
router.get('/programs', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const list = await RewardProgram.find({ companyId }).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/programs', checkRole(['Admin', 'Super Admin']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { name, description, budget, startDate, endDate, status } = req.body;

    const program = await RewardProgram.create({
      companyId,
      name,
      description,
      budget: Number(budget) || 0,
      startDate,
      endDate,
      status: status || 'Draft'
    });

    await logAudit(req, 'Create', program._id.toString(), program.name);
    res.json({ success: true, data: program });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 3. APPRECIATION WALL (SOCIAL FEED) ──
router.get('/wall', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const appreciations = await Appreciation.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: appreciations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/wall', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const senderId = req.user?.employeeId || req.user?.id;
    const { recipientId, message, category } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({ success: false, message: 'Recipient and message are required' });
    }

    const sender = await Employee.findOne({ _id: senderId });
    const recipient = await Employee.findOne({ _id: recipientId });

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient employee not found' });
    }

    const app = await Appreciation.create({
      companyId,
      senderId,
      senderName: sender?.fullName || 'Anonymous',
      senderRole: sender?.designation || 'Staff',
      recipientId,
      recipientName: recipient.fullName,
      message,
      category,
      likes: [],
      comments: [],
      reactions: []
    });

    // Real-time broadcast
    emitToRoom(`company:${companyId}`, 'recognition_created', app);

    await logAudit(req, 'Create', app._id.toString(), `Appreciation to ${recipient.fullName}`);

    res.json({ success: true, data: app });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/wall/:id', checkRole(['Admin', 'Super Admin']), async (req: any, res: Response) => {
  try {
    const app = await Appreciation.findByIdAndDelete(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Appreciation not found' });
    }
    await logAudit(req, 'Delete', req.params.id, 'Appreciation Deleted');
    res.json({ success: true, message: 'Appreciation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/wall/:id/like', async (req: any, res: Response) => {
  try {
    const employeeId = req.user?.employeeId || req.user?.id;
    const companyId = getCompanyId(req);
    const app = await Appreciation.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Appreciation not found' });
    }

    const idx = app.likes.indexOf(employeeId);
    if (idx > -1) {
      app.likes.splice(idx, 1); // Unlike
    } else {
      app.likes.push(employeeId); // Like
    }

    await app.save();

    // Broadcast update
    emitToRoom(`company:${companyId}`, 'likes_updated', app);

    res.json({ success: true, data: app });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/wall/:id/comment', async (req: any, res: Response) => {
  try {
    const employeeId = req.user?.employeeId || req.user?.id;
    const companyId = getCompanyId(req);
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const user = await Employee.findOne({ _id: employeeId });
    const app = await Appreciation.findById(req.params.id);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Appreciation not found' });
    }

    app.comments.push({
      userId: employeeId,
      userName: user?.fullName || 'Anonymous',
      text,
      createdAt: new Date()
    });

    await app.save();

    // Broadcast update
    emitToRoom(`company:${companyId}`, 'likes_updated', app);

    res.json({ success: true, data: app });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 4. BADGE LIBRARY & AWARDS ──
router.get('/badges', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const badges = await Badge.find({ companyId });
    res.json({ success: true, data: badges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/badges', checkRole(['Admin', 'Super Admin']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { name, description, icon, points, criteria } = req.body;

    const badge = await Badge.create({
      companyId,
      name,
      description,
      icon,
      points: Number(points) || 50,
      criteria
    });

    await logAudit(req, 'Create', badge._id.toString(), badge.name);
    res.json({ success: true, data: badge });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/badges/my', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const employeeId = req.query.employeeId || req.user?.employeeId || req.user?.id;

    const myBadges = await EmployeeBadge.find({ companyId, employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, data: myBadges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/badges/award', checkRole(['Admin', 'HR', 'Manager', 'Reporting Manager']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const issuedById = req.user?.employeeId || req.user?.id;
    const { employeeId, badgeId, reason } = req.body;

    if (!employeeId || !badgeId) {
      return res.status(400).json({ success: false, message: 'Employee ID and Badge ID are required' });
    }

    const emp = await Employee.findOne({ _id: employeeId });
    const badge = await Badge.findById(badgeId);
    const issuer = await Employee.findOne({ _id: issuedById });

    if (!emp || !badge) {
      return res.status(404).json({ success: false, message: 'Employee or Badge not found' });
    }

    // Award badge record
    const awarded = await EmployeeBadge.create({
      companyId,
      employeeId,
      employeeName: emp.fullName,
      badgeId,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      badgePoints: badge.points,
      issuedById,
      issuedByName: issuer?.fullName || 'Manager',
      reason,
      earnedDate: new Date().toISOString().split('T')[0]
    });

    // Credit points to employee balance
    emp.rewardPoints = (emp.rewardPoints || 0) + (badge.points || 0);
    await emp.save();

    // Create ledger transaction audit
    await RewardTransaction.create({
      companyId,
      employeeId,
      employeeName: emp.fullName,
      points: badge.points,
      type: 'Credit',
      source: 'Badge',
      description: `Awarded "${badge.name}" badge: ${reason || 'Exceptional contribution'}`
    });

    // Real-time notify user points
    emitToUser(emp.email, 'points_updated', { points: emp.rewardPoints });

    // Auto publish appreciation post on Wall
    const app = await Appreciation.create({
      companyId,
      senderId: issuedById,
      senderName: issuer?.fullName || 'Manager',
      senderRole: issuer?.designation || 'Management',
      recipientId: employeeId,
      recipientName: emp.fullName,
      message: `Awarded the "${badge.name}" Badge! Reason: ${reason || 'Exceptional contribution.'}`,
      category: 'Excellence'
    });

    emitToRoom(`company:${companyId}`, 'recognition_created', app);

    await logAudit(req, 'Award', employeeId, `Awarded ${badge.name}`);

    res.json({ success: true, data: awarded });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 5. MANUAL REWARD POINTS CR/DR (ADMIN/HR ONLY) ──
router.post('/award-points', checkRole(['Admin', 'HR']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const actorId = req.user?.employeeId || req.user?.id;
    const actor = await Employee.findOne({ _id: actorId });
    const { employeeId, points, type, description } = req.body; // type: 'Credit' | 'Debit'

    const emp = await Employee.findOne({ _id: employeeId });
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const ptsNum = Number(points) || 0;
    if (type === 'Debit' && (emp.rewardPoints || 0) < ptsNum) {
      return res.status(400).json({ success: false, message: 'Insufficient points to debit' });
    }

    emp.rewardPoints = type === 'Credit'
      ? (emp.rewardPoints || 0) + ptsNum
      : (emp.rewardPoints || 0) - ptsNum;
    await emp.save();

    await RewardTransaction.create({
      companyId,
      employeeId,
      employeeName: emp.fullName,
      points: ptsNum,
      type,
      source: 'Manual',
      description: description || `Manually ${type}ed by ${actor?.fullName || 'HR Manager'}`
    });

    emitToUser(emp.email, 'points_updated', { points: emp.rewardPoints });

    await logAudit(req, type === 'Credit' ? 'Approve' : 'Reject', employeeId, `Manual points ${type}: ${ptsNum}`);

    res.json({ success: true, data: { rewardPoints: emp.rewardPoints } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 6. CERTIFICATE ISSUANCE (ADMIN/HR ONLY) ──
router.get('/certificates', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const employeeId = req.user?.employeeId || req.user?.id;
    const role = req.user?.role;

    let query: any = { companyId };
    if (role !== 'Admin' && role !== 'HR') {
      query.employeeId = employeeId;
    }

    const list = await EmployeeCertificate.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/issue-certificate', checkRole(['Admin', 'HR']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const issuedById = req.user?.employeeId || req.user?.id;
    const issuer = await Employee.findOne({ _id: issuedById });
    const { employeeId, templateType } = req.body;

    const emp = await Employee.findOne({ _id: employeeId });
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const certNum = 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const certificate = await EmployeeCertificate.create({
      companyId,
      employeeId,
      employeeName: emp.fullName,
      templateType,
      certificateNumber: certNum,
      issuedById,
      issuedByName: issuer?.fullName || 'Management',
      issueDate: new Date().toISOString().split('T')[0]
    });

    await logAudit(req, 'Create', employeeId, `Issued Cert: ${templateType}`);
    res.json({ success: true, data: certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 7. REWARDS CATALOG & REDEMPTION ──
router.get('/catalog', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const items = await RewardCatalog.find({ companyId });
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/catalog', checkRole(['Admin', 'HR']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const { name, pointsRequired, category, stock, description, imageUrl } = req.body;

    const item = await RewardCatalog.create({
      companyId,
      name,
      pointsRequired: Number(pointsRequired),
      category,
      stock: Number(stock) || 0,
      description,
      imageUrl
    });

    await logAudit(req, 'Create', item._id.toString(), item.name);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/redemptions', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const employeeId = req.user?.employeeId || req.user?.id;
    const role = req.user?.role;

    let query: any = { companyId };
    if (role !== 'Admin' && role !== 'HR') {
      query.employeeId = employeeId;
    }

    const logs = await Redemption.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/catalog/redeem', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const employeeId = req.user?.employeeId || req.user?.id;
    const { rewardId } = req.body;

    const emp = await Employee.findOne({ _id: employeeId });
    const reward = await RewardCatalog.findById(rewardId);

    if (!emp || !reward) {
      return res.status(404).json({ success: false, message: 'Employee or Reward not found' });
    }

    if ((emp.rewardPoints || 0) < reward.pointsRequired) {
      return res.status(400).json({ success: false, message: 'Insufficient points balance' });
    }

    if (reward.stock !== undefined && reward.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Reward item is out of stock' });
    }

    // Deduct points and stock
    emp.rewardPoints = (emp.rewardPoints || 0) - reward.pointsRequired;
    await emp.save();

    if (reward.stock !== undefined) {
      reward.stock = reward.stock - 1;
      await reward.save();
    }

    await RewardTransaction.create({
      companyId,
      employeeId,
      employeeName: emp.fullName,
      points: reward.pointsRequired,
      type: 'Debit',
      source: 'Redemption',
      description: `Redeemed catalog reward: ${reward.name}`
    });

    const log = await Redemption.create({
      companyId,
      employeeId,
      employeeName: emp.fullName,
      rewardId,
      rewardName: reward.name,
      pointsRedeemed: reward.pointsRequired,
      status: 'Pending'
    });

    emitToUser(emp.email, 'points_updated', { points: emp.rewardPoints });

    await logAudit(req, 'Redeem', rewardId, `Redeemed ${reward.name}`);

    res.json({ success: true, data: log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/redemptions/:id', checkRole(['Admin', 'HR']), async (req: any, res: Response) => {
  try {
    const { status, deliveryNote } = req.body;
    const redemption = await Redemption.findById(req.params.id);

    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption request not found' });
    }

    // Refund points if rejected
    if (status === 'Rejected' && redemption.status !== 'Rejected') {
      const emp = await Employee.findOne({ _id: redemption.employeeId });
      if (emp) {
        emp.rewardPoints = (emp.rewardPoints || 0) + redemption.pointsRedeemed;
        await emp.save();

        await RewardTransaction.create({
          companyId: redemption.companyId,
          employeeId: redemption.employeeId,
          employeeName: emp.fullName,
          points: redemption.pointsRedeemed,
          type: 'Credit',
          source: 'Manual',
          description: `Refunded points for rejected redemption of ${redemption.rewardName}`
        });

        emitToUser(emp.email, 'points_updated', { points: emp.rewardPoints });
      }
    }

    redemption.status = status;
    if (deliveryNote !== undefined) redemption.deliveryNote = deliveryNote;
    await redemption.save();

    await logAudit(req, status === 'Approved' ? 'Approve' : 'Reject', redemption.employeeId, `Redemption ${status}: ${redemption.rewardName}`);

    res.json({ success: true, data: redemption });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 8. NOMINATIONS ──
router.get('/nominations', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const list = await Nomination.find({ companyId }).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/nominations', checkRole(['Admin', 'HR', 'Manager', 'Reporting Manager']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const nominatorId = req.user?.employeeId || req.user?.id;
    const { nomineeId, category, reason, evidence } = req.body;

    const nominee = await Employee.findOne({ _id: nomineeId });
    const nominator = await Employee.findOne({ _id: nominatorId });

    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found' });
    }

    const nomination = await Nomination.create({
      companyId,
      nomineeId,
      nomineeName: nominee.fullName,
      nomineeDepartment: nominee.department,
      nominatorId,
      nominatorName: nominator?.fullName || 'Manager',
      category,
      reason,
      evidence,
      status: 'Pending'
    });

    await logAudit(req, 'Create', nomineeId, `Nomination for ${category}`);
    res.json({ success: true, data: nomination });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/nominations/:id/approve', checkRole(['Admin', 'HR']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const approvedById = req.user?.employeeId || req.user?.id;
    const { status, pointsRewarded } = req.body; // status: 'Approved' | 'Rejected'

    const nomination = await Nomination.findById(req.params.id);
    const approver = await Employee.findOne({ _id: approvedById });

    if (!nomination) {
      return res.status(404).json({ success: false, message: 'Nomination not found' });
    }

    nomination.status = status;
    nomination.approvedById = approvedById;
    nomination.approvedByName = approver?.fullName || 'HR Manager';
    nomination.pointsRewarded = pointsRewarded ? Number(pointsRewarded) : 0;
    await nomination.save();

    if (status === 'Approved' && nomination.pointsRewarded > 0) {
      const nominee = await Employee.findOne({ _id: nomination.nomineeId });
      if (nominee) {
        nominee.rewardPoints = (nominee.rewardPoints || 0) + nomination.pointsRewarded;
        await nominee.save();

        await RewardTransaction.create({
          companyId,
          employeeId: nomination.nomineeId,
          employeeName: nominee.fullName,
          points: nomination.pointsRewarded,
          type: 'Credit',
          source: 'Nomination',
          description: `Credited points for approved nomination: ${nomination.category}`
        });

        emitToUser(nominee.email, 'points_updated', { points: nominee.rewardPoints });
      }

      // Automatically post Employee of the Month entry if category is EOM
      if (nomination.category === 'Employee of the Month') {
        const month = new Date().toISOString().slice(0, 7); // format YYYY-MM
        await EmployeeOfTheMonth.create({
          companyId,
          employeeId: nomination.nomineeId,
          employeeName: nomination.nomineeName,
          department: nomination.nomineeDepartment,
          month,
          achievement: nomination.reason,
          rewardPoints: nomination.pointsRewarded
        });
      }

      // Auto publish appreciation on social wall
      const app = await Appreciation.create({
        companyId,
        senderId: approvedById,
        senderName: approver?.fullName || 'HR Team',
        senderRole: approver?.designation || 'HR Management',
        recipientId: nomination.nomineeId,
        recipientName: nomination.nomineeName,
        message: `🎉 Approved Nomination for ${nomination.category}! Reason: ${nomination.reason}`,
        category: 'Excellence'
      });

      emitToRoom(`company:${companyId}`, 'recognition_created', app);
    }

    await logAudit(req, status === 'Approved' ? 'Approve' : 'Reject', nomination.nomineeId, `Nomination ${status}: ${nomination.category}`);

    res.json({ success: true, data: nomination });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 9. LEADERBOARDS ──
router.get('/leaderboard', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    // Sort employees by rewardPoints descending
    const list = await Employee.find({ companyId })
      .select('fullName department designation profilePicture rewardPoints')
      .sort({ rewardPoints: -1 })
      .limit(50);
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 10. HALL OF FAME ──
router.get('/halloffame', async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const hallOfFame = await EmployeeOfTheMonth.find({ companyId }).sort({ month: -1 });
    res.json({ success: true, data: hallOfFame });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── 11. AUDIT LOGS (ADMIN ONLY) ──
router.get('/audit-logs', checkRole(['Admin', 'Super Admin']), async (req: any, res: Response) => {
  try {
    const companyId = getCompanyId(req);
    const logs = await RecognitionAuditLog.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
