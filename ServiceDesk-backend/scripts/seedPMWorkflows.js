/**
 * Seeds PM default workflows for all 6 methodologies and the missing project.
 * Run inside Docker: docker exec servicedesk-api node /tmp/seedPMWorkflows.js
 */
const mongoose = require('/app/node_modules/mongoose');
const MONGO_URI = process.env.MONGODB_URI;

const PMStatusCategory = { TODO: 'todo', IN_PROGRESS: 'in_progress', DONE: 'done' };
const MethodologyCode = { SCRUM: 'scrum', KANBAN: 'kanban', WATERFALL: 'waterfall', ITIL: 'itil', LEAN: 'lean', OKR: 'okr' };

const WorkflowSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  description: String,
  methodology: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  statuses: [{
    id: String, name: String, category: String, color: String,
    order: Number, isInitial: Boolean, isFinal: Boolean,
  }],
  transitions: [{ id: String, name: String, fromStatus: String, toStatus: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  key: String,
  name: String,
  description: String,
  methodology: { code: String },
  members: [{ userId: mongoose.Schema.Types.ObjectId, role: String, permissions: [String], addedAt: Date }],
  issueTypes: [{ id: String, name: String, icon: String, color: String }],
  settings: { visibility: String, allowExternalAccess: Boolean },
  status: { type: String, default: 'active' },
  health: { type: String, default: 'green' },
  priority: { type: String, default: 'medium' },
  escalated: { type: Boolean, default: false },
}, { timestamps: true });

if (mongoose.models.PMWorkflow) delete mongoose.models.PMWorkflow;
if (mongoose.models.PMProject) delete mongoose.models.PMProject;
const Workflow = mongoose.model('PMWorkflow', WorkflowSchema);
const Project = mongoose.model('PMProject', ProjectSchema);

const ADMIN_ID = new mongoose.Types.ObjectId('69a60023039ff88fca146e46');
const TARGET_PROJECT_ID = new mongoose.Types.ObjectId('69aabb8ced7b1067c62c5653');

const defaultWorkflowDefs = {
  scrum: {
    name: 'Scrum Workflow', description: 'Standard Scrum workflow',
    methodology: 'scrum', isDefault: true,
    statuses: [
      { id: 'backlog', name: 'Backlog', category: 'todo', color: '#6B7280', order: 0, isInitial: true, isFinal: false },
      { id: 'ready', name: 'Ready', category: 'todo', color: '#ffffff', order: 1, isInitial: false, isFinal: false },
      { id: 'in-progress', name: 'In Progress', category: 'in_progress', color: '#F59E0B', order: 2, isInitial: false, isFinal: false },
      { id: 'in-review', name: 'In Review', category: 'in_progress', color: '#8B5CF6', order: 3, isInitial: false, isFinal: false },
      { id: 'done', name: 'Done', category: 'done', color: '#10B981', order: 4, isInitial: false, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Ready for Sprint', fromStatus: 'backlog', toStatus: 'ready' },
      { id: 't2', name: 'Start Work', fromStatus: 'ready', toStatus: 'in-progress' },
      { id: 't3', name: 'Submit for Review', fromStatus: 'in-progress', toStatus: 'in-review' },
      { id: 't4', name: 'Request Changes', fromStatus: 'in-review', toStatus: 'in-progress' },
      { id: 't5', name: 'Approve', fromStatus: 'in-review', toStatus: 'done' },
      { id: 't6', name: 'Reopen', fromStatus: 'done', toStatus: 'in-progress' },
    ],
  },
  kanban: {
    name: 'Kanban Workflow', description: 'Continuous flow Kanban workflow',
    methodology: 'kanban', isDefault: true,
    statuses: [
      { id: 'todo', name: 'To Do', category: 'todo', color: '#6B7280', order: 0, isInitial: true, isFinal: false },
      { id: 'in-progress', name: 'In Progress', category: 'in_progress', color: '#F59E0B', order: 1, isInitial: false, isFinal: false },
      { id: 'review', name: 'Review', category: 'in_progress', color: '#8B5CF6', order: 2, isInitial: false, isFinal: false },
      { id: 'done', name: 'Done', category: 'done', color: '#10B981', order: 3, isInitial: false, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Start', fromStatus: 'todo', toStatus: 'in-progress' },
      { id: 't2', name: 'Review', fromStatus: 'in-progress', toStatus: 'review' },
      { id: 't3', name: 'Rework', fromStatus: 'review', toStatus: 'in-progress' },
      { id: 't4', name: 'Complete', fromStatus: 'review', toStatus: 'done' },
      { id: 't5', name: 'Reopen', fromStatus: 'done', toStatus: 'todo' },
    ],
  },
  waterfall: {
    name: 'Waterfall Workflow', description: 'Sequential phase-based workflow',
    methodology: 'waterfall', isDefault: true,
    statuses: [
      { id: 'requirements', name: 'Requirements', category: 'todo', color: '#6B7280', order: 0, isInitial: true, isFinal: false },
      { id: 'design', name: 'Design', category: 'in_progress', color: '#ffffff', order: 1, isInitial: false, isFinal: false },
      { id: 'implementation', name: 'Implementation', category: 'in_progress', color: '#F59E0B', order: 2, isInitial: false, isFinal: false },
      { id: 'testing', name: 'Testing', category: 'in_progress', color: '#8B5CF6', order: 3, isInitial: false, isFinal: false },
      { id: 'deployment', name: 'Deployment', category: 'in_progress', color: '#EC4899', order: 4, isInitial: false, isFinal: false },
      { id: 'completed', name: 'Completed', category: 'done', color: '#10B981', order: 5, isInitial: false, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Approve Requirements', fromStatus: 'requirements', toStatus: 'design' },
      { id: 't2', name: 'Approve Design', fromStatus: 'design', toStatus: 'implementation' },
      { id: 't3', name: 'Ready for Testing', fromStatus: 'implementation', toStatus: 'testing' },
      { id: 't4', name: 'Ready for Deployment', fromStatus: 'testing', toStatus: 'deployment' },
      { id: 't5', name: 'Deploy', fromStatus: 'deployment', toStatus: 'completed' },
    ],
  },
  itil: {
    name: 'ITIL Change Workflow', description: 'ITIL change management workflow',
    methodology: 'itil', isDefault: true,
    statuses: [
      { id: 'draft', name: 'Draft', category: 'todo', color: '#6B7280', order: 0, isInitial: true, isFinal: false },
      { id: 'submitted', name: 'Submitted', category: 'todo', color: '#ffffff', order: 1, isInitial: false, isFinal: false },
      { id: 'assessment', name: 'Assessment', category: 'in_progress', color: '#F59E0B', order: 2, isInitial: false, isFinal: false },
      { id: 'approved', name: 'Approved', category: 'in_progress', color: '#10B981', order: 3, isInitial: false, isFinal: false },
      { id: 'implementing', name: 'Implementing', category: 'in_progress', color: '#F97316', order: 4, isInitial: false, isFinal: false },
      { id: 'closed', name: 'Closed', category: 'done', color: '#10B981', order: 5, isInitial: false, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Submit', fromStatus: 'draft', toStatus: 'submitted' },
      { id: 't2', name: 'Assess', fromStatus: 'submitted', toStatus: 'assessment' },
      { id: 't3', name: 'Approve', fromStatus: 'assessment', toStatus: 'approved' },
      { id: 't4', name: 'Implement', fromStatus: 'approved', toStatus: 'implementing' },
      { id: 't5', name: 'Close', fromStatus: 'implementing', toStatus: 'closed' },
    ],
  },
  lean: {
    name: 'Lean Workflow', description: 'Value stream focused workflow',
    methodology: 'lean', isDefault: true,
    statuses: [
      { id: 'idea', name: 'Idea', category: 'todo', color: '#6B7280', order: 0, isInitial: true, isFinal: false },
      { id: 'validated', name: 'Validated', category: 'todo', color: '#ffffff', order: 1, isInitial: false, isFinal: false },
      { id: 'building', name: 'Building', category: 'in_progress', color: '#F59E0B', order: 2, isInitial: false, isFinal: false },
      { id: 'measuring', name: 'Measuring', category: 'in_progress', color: '#8B5CF6', order: 3, isInitial: false, isFinal: false },
      { id: 'done', name: 'Done', category: 'done', color: '#10B981', order: 4, isInitial: false, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Validate', fromStatus: 'idea', toStatus: 'validated' },
      { id: 't2', name: 'Build', fromStatus: 'validated', toStatus: 'building' },
      { id: 't3', name: 'Measure', fromStatus: 'building', toStatus: 'measuring' },
      { id: 't4', name: 'Complete', fromStatus: 'measuring', toStatus: 'done' },
    ],
  },
  okr: {
    name: 'OKR Workflow', description: 'Objectives and Key Results tracking workflow',
    methodology: 'okr', isDefault: true,
    statuses: [
      { id: 'draft', name: 'Draft', category: 'todo', color: '#6B7280', order: 0, isInitial: true, isFinal: false },
      { id: 'committed', name: 'Committed', category: 'todo', color: '#ffffff', order: 1, isInitial: false, isFinal: false },
      { id: 'on-track', name: 'On Track', category: 'in_progress', color: '#10B981', order: 2, isInitial: false, isFinal: false },
      { id: 'at-risk', name: 'At Risk', category: 'in_progress', color: '#F59E0B', order: 3, isInitial: false, isFinal: false },
      { id: 'achieved', name: 'Achieved', category: 'done', color: '#10B981', order: 4, isInitial: false, isFinal: true },
      { id: 'missed', name: 'Missed', category: 'done', color: '#EF4444', order: 5, isInitial: false, isFinal: true },
    ],
    transitions: [
      { id: 't1', name: 'Commit', fromStatus: 'draft', toStatus: 'committed' },
      { id: 't2', name: 'Start Tracking', fromStatus: 'committed', toStatus: 'on-track' },
      { id: 't3', name: 'Flag Risk', fromStatus: 'on-track', toStatus: 'at-risk' },
      { id: 't4', name: 'Achieve', fromStatus: 'on-track', toStatus: 'achieved' },
      { id: 't5', name: 'Miss', fromStatus: 'at-risk', toStatus: 'missed' },
    ],
  },
};

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected');

  // 1. Seed default workflows (need an org ID — use a placeholder since they are org-agnostic defaults)
  const PLACEHOLDER_ORG = new mongoose.Types.ObjectId('000000000000000000000001');

  for (const [code, def] of Object.entries(defaultWorkflowDefs)) {
    const existing = await Workflow.findOne({ methodology: code, isDefault: true });
    if (!existing) {
      await Workflow.create({ ...def, organizationId: PLACEHOLDER_ORG, createdBy: ADMIN_ID });
      console.log('Created default workflow:', def.name);
    } else {
      console.log('Already exists:', def.name);
    }
  }

  // 2. Seed the missing project
  const existingProject = await Project.findById(TARGET_PROJECT_ID);
  if (!existingProject) {
    await Project.create({
      _id: TARGET_PROJECT_ID,
      organizationId: PLACEHOLDER_ORG,
      key: 'DEMO',
      name: 'Demo Project',
      description: 'Auto-seeded demo project',
      methodology: { code: 'scrum' },
      members: [{ userId: ADMIN_ID, role: 'lead', permissions: ['*'], addedAt: new Date() }],
      issueTypes: [
        { id: 'task', name: 'Task', icon: 'check-square', color: '#3B82F6' },
        { id: 'bug', name: 'Bug', icon: 'bug', color: '#EF4444' },
        { id: 'story', name: 'Story', icon: 'book', color: '#10B981' },
      ],
      settings: { visibility: 'public', allowExternalAccess: false },
      status: 'active',
      health: 'green',
      priority: 'medium',
      escalated: false,
    });
    console.log('Created project:', TARGET_PROJECT_ID.toString());
  } else {
    console.log('Project already exists:', TARGET_PROJECT_ID.toString());
  }

  await mongoose.disconnect();
  console.log('Done');
}).catch(e => { console.error('Error:', e.message); process.exit(1); });
