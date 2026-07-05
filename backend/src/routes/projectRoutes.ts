import express, { Router, Request, Response } from 'express';
import { Project } from '../models/Project';
import { ProjectTask } from '../models/ProjectTask';
import { Sprint } from '../models/Sprint';
import { Milestone } from '../models/Milestone';
import { ProjectBudget } from '../models/ProjectBudget';
import { ProjectRisk } from '../models/ProjectRisk';
import { ProjectTimeLog } from '../models/ProjectTimeLog';
import { ProjectActivity } from '../models/ProjectActivity';

import jwt from 'jsonwebtoken';

const router = Router();

router.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-if-unset-for-safety';

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

router.use(authMiddleware);

// ============================================================
// UTILITY: Auto-generate project code
// ============================================================
async function generateProjectCode(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await Project.countDocuments({ companyId });
  return `PRJ-${year}-${String(count + 1).padStart(3, '0')}`;
}

// ============================================================
// UTILITY: Recalculate project health score
// ============================================================
async function recalculateProjectHealth(projectId: string, companyId: string): Promise<void> {
  const project = await Project.findOne({ _id: projectId, companyId });
  if (!project) return;

  const tasks = await ProjectTask.find({ companyId, projectId });
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const taskScore = total > 0 ? (completed / total) * 30 : 30;

  // Timeline score
  let timelineScore = 25;
  if (project.endDate) {
    const end = new Date(project.endDate);
    const now = new Date();
    if (project.status !== 'Completed' && now > end) {
      timelineScore = 0;
    } else if (now > new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      timelineScore = 10;
    }
  }

  // Budget score
  let budgetScore = 20;
  const budget = await ProjectBudget.findOne({ projectId, companyId });
  if (budget && budget.approvedBudget > 0) {
    const ratio = budget.usedBudget / budget.approvedBudget;
    if (ratio > 1) budgetScore = 0;
    else if (ratio > 0.85) budgetScore = 8;
    else if (ratio > 0.7) budgetScore = 15;
  }

  // Risk score
  const openRisks = await ProjectRisk.countDocuments({ projectId, companyId, status: { $in: ['Open', 'Mitigating'] } });
  const riskScore = Math.max(0, 10 - openRisks * 2);

  // Blocked tasks score
  const blockedCount = tasks.filter(t => t.status === 'Blocked').length;
  const teamScore = Math.max(0, 15 - blockedCount * 3);

  const health = Math.round(taskScore + timelineScore + budgetScore + riskScore + teamScore);
  const healthStatus = health >= 75 ? 'Healthy' : health >= 50 ? 'Warning' : 'Critical';

  await Project.findByIdAndUpdate(projectId, {
    healthScore: Math.min(100, health),
    healthStatus,
    tasksTotal: total,
    tasksCompleted: completed,
    tasksOpen: total - completed,
    completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0
  });
}

// ============================================================
// LOG ACTIVITY
// ============================================================
async function logActivity(data: {
  companyId: string;
  projectId: string;
  projectName?: string;
  actorId?: string;
  actorName?: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    await ProjectActivity.create(data);
  } catch (_) { /* non-critical */ }
}

// ============================================================
// PROJECT ROUTES
// ============================================================

// GET /api/projects — list all with filters
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', status, priority, department, managerId, archived, search, page = 1, limit = 50 } = req.query;

    const filter: any = { companyId, isArchived: archived === 'true' };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (department) filter.department = department;
    if (managerId) filter.projectManagerId = managerId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
      Project.countDocuments(filter)
    ]);

    res.json({ success: true, data: projects, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects — create project
router.post('/projects', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const projectCode = await generateProjectCode(companyId);

    const project = await Project.create({ ...req.body, companyId, projectCode });

    // Create empty budget record
    await ProjectBudget.create({
      companyId,
      projectId: project._id.toString(),
      projectName: project.name,
      totalBudget: project.totalBudget || 0,
      approvedBudget: project.approvedBudget || 0,
    });

    await logActivity({
      companyId,
      projectId: project._id.toString(),
      projectName: project.name,
      actorId: req.body.createdBy,
      actorName: req.body.createdByName,
      action: 'created project',
      entity: 'project',
      entityId: project._id.toString(),
      entityName: project.name
    });

    res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/projects/:id — project detail
router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const project = await Project.findOne({ _id: req.params.id, companyId });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/projects/:id — update project
router.put('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const old = await Project.findOne({ _id: req.params.id, companyId });
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { ...req.body, updatedBy: req.body.updatedBy },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    // Sync with ProjectBudget collection
    await ProjectBudget.findOneAndUpdate(
      { projectId: req.params.id, companyId },
      {
        projectName: project.name,
        totalBudget: project.totalBudget || 0,
        approvedBudget: project.approvedBudget || project.totalBudget || 0
      },
      { upsert: true, new: true }
    );

    if (old?.status !== req.body.status) {
      await logActivity({
        companyId,
        projectId: req.params.id,
        projectName: project.name,
        actorId: req.body.updatedBy,
        actorName: req.body.updatedByName,
        action: 'changed project status',
        entity: 'project',
        entityId: req.params.id,
        entityName: project.name,
        oldValue: old?.status,
        newValue: req.body.status
      });
    }

    res.json({ success: true, data: project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/projects/:id — archive project
router.delete('/projects/:id', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { isArchived: true, status: 'Cancelled' },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, message: 'Project archived successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/clone — clone a project
router.post('/projects/:id/clone', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const original = await Project.findOne({ _id: req.params.id, companyId });
    if (!original) return res.status(404).json({ success: false, error: 'Project not found' });

    const projectCode = await generateProjectCode(companyId);
    const cloned = await Project.create({
      ...original.toObject(),
      _id: undefined,
      projectCode,
      name: `${original.name} (Copy)`,
      status: 'Planning',
      clonedFromId: original._id.toString(),
      completionPercent: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
      createdBy: req.body.createdBy,
    });

    res.status(201).json({ success: true, data: cloned });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/projects/:id/health — project health metrics
router.get('/projects/:id/health', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    await recalculateProjectHealth(req.params.id, companyId as string);
    const project = await Project.findOne({ _id: req.params.id, companyId });
    res.json({ success: true, data: { healthScore: project?.healthScore, healthStatus: project?.healthStatus } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// TASK ROUTES
// ============================================================

// GET /api/projects/:id/tasks
router.get('/projects/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', status, assigneeId, sprintId, priority } = req.query;
    const filter: any = { companyId, projectId: req.params.id };
    if (status) filter.status = status;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (sprintId) filter.sprintId = sprintId;
    if (priority) filter.priority = priority;

    const tasks = await ProjectTask.find(filter).sort({ kanbanOrder: 1, createdAt: -1 });
    res.json({ success: true, data: tasks, total: tasks.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/tasks
router.post('/projects/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const project = await Project.findOne({ _id: req.params.id, companyId });

    // Get max kanban order for the column
    const lastTask = await ProjectTask.findOne({
      companyId, projectId: req.params.id, kanbanColumn: req.body.kanbanColumn || 'To Do'
    }).sort({ kanbanOrder: -1 });
    const order = lastTask ? lastTask.kanbanOrder + 1 : 0;

    const task = await ProjectTask.create({
      ...req.body,
      companyId,
      projectId: req.params.id,
      projectName: project?.name,
      kanbanColumn: req.body.status || 'To Do',
      kanbanOrder: order
    });

    await logActivity({
      companyId,
      projectId: req.params.id,
      projectName: project?.name,
      actorId: req.body.createdBy,
      actorName: req.body.createdByName,
      action: 'created task',
      entity: 'task',
      entityId: task._id.toString(),
      entityName: task.title
    });

    await recalculateProjectHealth(req.params.id, companyId);
    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/projects/:id/tasks/:taskId
router.put('/projects/:id/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const old = await ProjectTask.findById(req.params.taskId);
    const task = await ProjectTask.findOneAndUpdate(
      { _id: req.params.taskId, companyId, projectId: req.params.id },
      { ...req.body },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    if (old?.status !== req.body.status && req.body.status === 'Completed') {
      await ProjectTask.findByIdAndUpdate(req.params.taskId, { completedAt: new Date().toISOString().split('T')[0] });
    }

    await logActivity({
      companyId,
      projectId: req.params.id,
      actorId: req.body.updatedBy,
      actorName: req.body.updatedByName,
      action: old?.status !== req.body.status ? 'changed task status' : 'updated task',
      entity: 'task',
      entityId: task._id.toString(),
      entityName: task.title,
      oldValue: old?.status,
      newValue: req.body.status
    });

    await recalculateProjectHealth(req.params.id, companyId);
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/projects/:id/tasks/:taskId/kanban — move task on kanban
router.patch('/projects/:id/tasks/:taskId/kanban', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', column, order, status } = req.body;
    const task = await ProjectTask.findOneAndUpdate(
      { _id: req.params.taskId, companyId },
      { kanbanColumn: column, kanbanOrder: order, status: status || column },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    await recalculateProjectHealth(req.params.id, companyId);
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/projects/:id/tasks/:taskId
router.delete('/projects/:id/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    await ProjectTask.findOneAndDelete({ _id: req.params.taskId, companyId, projectId: req.params.id });
    await recalculateProjectHealth(req.params.id, companyId as string);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/tasks/:taskId/comments
router.post('/projects/:id/tasks/:taskId/comments', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const task = await ProjectTask.findOneAndUpdate(
      { _id: req.params.taskId, companyId },
      { $push: { comments: { ...req.body, createdAt: new Date() } } },
      { new: true }
    );
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/projects/:id/tasks/:taskId/checklist/:checkId
router.patch('/projects/:id/tasks/:taskId/checklist/:checkId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', completed, completedBy } = req.body;
    const task = await ProjectTask.findOneAndUpdate(
      { _id: req.params.taskId, companyId, 'checklist._id': req.params.checkId },
      {
        $set: {
          'checklist.$.completed': completed,
          'checklist.$.completedBy': completedBy,
          'checklist.$.completedAt': completed ? new Date() : null
        }
      },
      { new: true }
    );
    res.json({ success: true, data: task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/comments
router.post('/projects/:id/comments', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', actorId, actorName, content } = req.body;
    const project = await Project.findOne({ _id: req.params.id, companyId });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const activity = await ProjectActivity.create({
      companyId,
      projectId: req.params.id,
      projectName: project.name,
      actorId,
      actorName,
      action: 'posted a comment',
      entity: 'comment',
      entityName: content
    });
    res.status(201).json({ success: true, data: activity });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// TEAM ROUTES
// ============================================================

// GET /api/projects/:id/team
router.get('/projects/:id/team', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const project = await Project.findOne({ _id: req.params.id, companyId });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: project.teamMembers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/team
router.post('/projects/:id/team', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, companyId, 'teamMembers.employeeId': { $ne: req.body.employeeId } },
      { $push: { teamMembers: { ...req.body, joinedAt: new Date() } } },
      { new: true }
    );
    if (!project) return res.status(400).json({ success: false, error: 'Member already in team or project not found' });
    res.json({ success: true, data: project.teamMembers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/projects/:id/team/:memberId
router.delete('/projects/:id/team/:memberId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, companyId },
      { $pull: { teamMembers: { employeeId: req.params.memberId } } },
      { new: true }
    );
    res.json({ success: true, data: project?.teamMembers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// SPRINT ROUTES
// ============================================================

// GET /api/projects/:id/sprints
router.get('/projects/:id/sprints', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const sprints = await Sprint.find({ companyId, projectId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: sprints });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/sprints
router.post('/projects/:id/sprints', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const sprint = await Sprint.create({ ...req.body, companyId, projectId: req.params.id });
    res.status(201).json({ success: true, data: sprint });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/projects/:id/sprints/:sprintId/start
router.patch('/projects/:id/sprints/:sprintId/start', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    // Close any active sprint first
    await Sprint.updateMany({ companyId, projectId: req.params.id, status: 'Active' }, { status: 'Completed' });
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.sprintId, companyId },
      { status: 'Active', startDate: new Date().toISOString().split('T')[0] },
      { new: true }
    );
    res.json({ success: true, data: sprint });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// MILESTONE ROUTES
// ============================================================

// GET /api/projects/:id/milestones
router.get('/projects/:id/milestones', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const milestones = await Milestone.find({ companyId, projectId: req.params.id }).sort({ dueDate: 1 });
    res.json({ success: true, data: milestones });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/milestones
router.post('/projects/:id/milestones', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const milestone = await Milestone.create({ ...req.body, companyId, projectId: req.params.id });
    res.status(201).json({ success: true, data: milestone });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/projects/:id/milestones/:milestoneId
router.put('/projects/:id/milestones/:milestoneId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const milestone = await Milestone.findOneAndUpdate(
      { _id: req.params.milestoneId, companyId },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: milestone });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// BUDGET ROUTES
// ============================================================

// GET /api/projects/:id/budget
router.get('/projects/:id/budget', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    let budget = await ProjectBudget.findOne({ projectId: req.params.id, companyId });
    if (!budget) {
      const project = await Project.findOne({ _id: req.params.id, companyId });
      budget = await ProjectBudget.create({
        companyId,
        projectId: req.params.id,
        projectName: project?.name || 'Project Budget',
        totalBudget: project?.totalBudget || 0,
        approvedBudget: project?.approvedBudget || project?.totalBudget || 0
      });
    }
    res.json({ success: true, data: budget });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/budget/expense
router.post('/projects/:id/budget/expense', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const budget = await ProjectBudget.findOneAndUpdate(
      { projectId: req.params.id, companyId },
      { $push: { expenses: req.body } },
      { new: true }
    );
    await budget?.save(); // trigger pre-save to recalculate usedBudget
    res.json({ success: true, data: budget });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/projects/:id/budget/expense/:expenseId/approve
router.patch('/projects/:id/budget/expense/:expenseId/approve', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', status, approvedBy, approvedByName } = req.body;
    const budget = await ProjectBudget.findOneAndUpdate(
      { projectId: req.params.id, companyId, 'expenses._id': req.params.expenseId },
      { $set: { 'expenses.$.status': status, 'expenses.$.approvedBy': approvedBy, 'expenses.$.approvedByName': approvedByName } },
      { new: true }
    );
    await budget?.save();
    res.json({ success: true, data: budget });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// RISK ROUTES
// ============================================================

// GET /api/projects/:id/risks
router.get('/projects/:id/risks', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const risks = await ProjectRisk.find({ companyId, projectId: req.params.id }).sort({ severity: -1 });
    res.json({ success: true, data: risks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/:id/risks
router.post('/projects/:id/risks', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const risk = await ProjectRisk.create({ ...req.body, companyId, projectId: req.params.id });
    res.status(201).json({ success: true, data: risk });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/projects/:id/risks/:riskId
router.put('/projects/:id/risks/:riskId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.body;
    const risk = await ProjectRisk.findOneAndUpdate(
      { _id: req.params.riskId, companyId },
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: risk });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// TIME LOG ROUTES
// ============================================================

// POST /api/projects/timelogs/start
router.post('/timelogs/start', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', employeeId } = req.body;

    // Stop any running timer for this employee first
    await ProjectTimeLog.updateMany(
      { companyId, employeeId, isRunning: true },
      { isRunning: false, endTime: new Date() }
    );

    const log = await ProjectTimeLog.create({
      ...req.body,
      companyId,
      startTime: new Date(),
      isRunning: true,
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects/timelogs/stop
router.post('/timelogs/stop', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', employeeId, logId } = req.body;
    const now = new Date();

    const query = logId
      ? { _id: logId, companyId, isRunning: true }
      : { companyId, employeeId, isRunning: true };

    const log = await ProjectTimeLog.findOne(query);
    if (!log) return res.status(404).json({ success: false, error: 'No running timer found' });

    const duration = Math.round((now.getTime() - new Date(log.startTime!).getTime()) / 60000);
    const updated = await ProjectTimeLog.findByIdAndUpdate(
      log._id,
      { endTime: now, duration, isRunning: false },
      { new: true }
    );

    // Update loggedHours on task
    if (log.taskId) {
      await ProjectTask.findByIdAndUpdate(log.taskId, { $inc: { loggedHours: duration / 60 } });
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/projects/timelogs/employee/:empId
router.get('/timelogs/employee/:empId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', from, to, projectId } = req.query;
    const filter: any = { companyId, employeeId: req.params.empId };
    if (projectId) filter.projectId = projectId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    const logs = await ProjectTimeLog.find(filter).sort({ date: -1, startTime: -1 });
    const totalMinutes = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
    res.json({ success: true, data: logs, totalMinutes, totalHours: +(totalMinutes / 60).toFixed(2) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/projects/timelogs/running/:empId — check running timer
router.get('/timelogs/running/:empId', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;
    const log = await ProjectTimeLog.findOne({ companyId, employeeId: req.params.empId, isRunning: true });
    res.json({ success: true, data: log || null, isRunning: !!log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// ACTIVITY ROUTES
// ============================================================

// GET /api/projects/:id/activity
router.get('/projects/:id/activity', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', limit = 50 } = req.query;
    const activities = await ProjectActivity.find({ companyId, projectId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, data: activities });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// DASHBOARD / REPORTS
// ============================================================

// GET /api/projects/dashboard — global project dashboard stats
router.get('/projects-dashboard', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001' } = req.query;

    const [
      total,
      active,
      completed,
      delayed,
      onHold,
      planning,
      allTasks,
      completedTasks,
      allTimeLogs
    ] = await Promise.all([
      Project.countDocuments({ companyId, isArchived: false }),
      Project.countDocuments({ companyId, isArchived: false, status: 'Active' }),
      Project.countDocuments({ companyId, status: 'Completed' }),
      Project.countDocuments({ companyId, isArchived: false, status: 'Delayed' }),
      Project.countDocuments({ companyId, isArchived: false, status: 'On Hold' }),
      Project.countDocuments({ companyId, isArchived: false, status: 'Planning' }),
      ProjectTask.countDocuments({ companyId }),
      ProjectTask.countDocuments({ companyId, status: 'Completed' }),
      ProjectTimeLog.find({ companyId, status: 'Approved' })
    ]);

    const totalHours = allTimeLogs.reduce((sum, l) => sum + (l.duration || 0), 0) / 60;

    // Upcoming deadlines (next 14 days)
    const now = new Date();
    const futureDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const upcomingDeadlines = await Project.find({
      companyId,
      isArchived: false,
      endDate: { $gte: todayStr, $lte: futureDate }
    }).sort({ endDate: 1 }).limit(10).select('name endDate status priority healthStatus');

    const todaysTasks = await ProjectTask.find({
      companyId,
      dueDate: todayStr,
      status: { $ne: 'Completed' }
    }).limit(20).select('title priority status assigneeName projectName dueDate');

    // Recalculate all active projects health
    const activeProjects = await Project.find({ companyId, isArchived: false, status: 'Active' }).select('_id');
    for (const p of activeProjects.slice(0, 10)) {
      await recalculateProjectHealth(p._id.toString(), companyId as string);
    }

    const healthCounts = await Project.aggregate([
      { $match: { companyId, isArchived: false } },
      { $group: { _id: '$healthStatus', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalProjects: total,
        activeProjects: active,
        completedProjects: completed,
        delayedProjects: delayed,
        onHoldProjects: onHold,
        planningProjects: planning,
        totalTasks: allTasks,
        completedTasks,
        openTasks: allTasks - completedTasks,
        totalBillableHours: +totalHours.toFixed(2),
        taskCompletionRate: allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0,
        upcomingDeadlines,
        todaysTasks,
        healthBreakdown: healthCounts
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/projects/:id/reports/burndown
router.get('/projects/:id/reports/burndown', async (req: Request, res: Response) => {
  try {
    const { companyId = 'company_001', sprintId } = req.query;
    const filter: any = { companyId, projectId: req.params.id };
    if (sprintId) filter.sprintId = sprintId;

    const tasks = await ProjectTask.find(filter).select('storyPoints status completedAt createdAt');
    const total = tasks.reduce((s, t) => s + (t.storyPoints || 1), 0);

    // Group by day (simplified)
    const completedByDay: Record<string, number> = {};
    tasks.filter(t => t.status === 'Completed' && t.completedAt).forEach(t => {
      const day = t.completedAt!.substring(0, 10);
      completedByDay[day] = (completedByDay[day] || 0) + (t.storyPoints || 1);
    });

    const sorted = Object.keys(completedByDay).sort();
    let remaining = total;
    const burndown = sorted.map(day => {
      remaining -= completedByDay[day];
      return { date: day, remaining, completed: completedByDay[day] };
    });

    res.json({ success: true, data: { total, burndown } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
