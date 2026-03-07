/**
 * Seed script designed to run INSIDE the Docker container:
 *   docker cp scripts/seedServiceCatalogDocker.js servicedesk-api:/tmp/seed.js
 *   docker exec servicedesk-api node -e "require('/app/node_modules/dotenv').config({path:'/app/.env'})" /tmp/seed.js
 */
const mongoose = require('/app/node_modules/mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@mongodb:27017/servicedesk?authSource=admin';

const FormFieldSchema = new mongoose.Schema({
  id: String, type: String, label: String, labelAr: String,
  placeholder: String, required: { type: Boolean, default: false },
  options: [{ value: String, label: String, labelAr: String }],
  defaultValue: mongoose.Schema.Types.Mixed,
  order: { type: Number, default: 0 },
}, { _id: false });

const Schema = new mongoose.Schema({
  serviceId: { type: String, unique: true },
  name: String, nameAr: String, description: String, descriptionAr: String,
  category: String, tags: [String], icon: String,
  featured: { type: Boolean, default: false },
  requestForm: { fields: [FormFieldSchema] },
  approvalRequired: { type: Boolean, default: false },
  approvers: [{ type: { type: String }, value: String }],
  fulfillmentType: { type: String, default: 'manual' },
  estimatedFulfillmentTime: Number,
  slaTemplateId: String,
  allowedRoles: [String],
  status: { type: String, default: 'active' },
  order: { type: Number, default: 0 },
  stats: {
    totalRequests: Number, completedRequests: Number,
    avgFulfillmentTime: Number, satisfactionScore: Number,
  },
  createdBy: String,
}, { timestamps: true });

if (mongoose.models.ServiceCatalog) delete mongoose.models.ServiceCatalog;
const SC = mongoose.model('ServiceCatalog', Schema);

function ff(id, type, label, labelAr, opts) {
  opts = opts || {};
  return {
    id: id, type: type, label: label, labelAr: labelAr,
    placeholder: opts.placeholder || '',
    required: opts.required || false,
    options: opts.options,
    defaultValue: opts.defaultValue,
    order: opts.order || 0,
  };
}

const services = [
  {
    serviceId: 'SVC-001', name: 'New User Account', nameAr: '\u062D\u0633\u0627\u0628 \u0645\u0633\u062A\u062E\u062F\u0645 \u062C\u062F\u064A\u062F',
    description: 'Request a new user account for Active Directory, email, and core business applications.',
    descriptionAr: '\u0637\u0644\u0628 \u062D\u0633\u0627\u0628 \u0645\u0633\u062A\u062E\u062F\u0645 \u062C\u062F\u064A\u062F',
    category: 'IT', icon: 'user-plus', featured: true, status: 'active',
    approvalRequired: true, approvers: [{ type: 'role', value: 'manager' }],
    fulfillmentType: 'hybrid', estimatedFulfillmentTime: 4,
    slaTemplateId: 'DEFAULT', allowedRoles: ['all'],
    requestForm: { fields: [
      ff('full_name', 'text', 'Full Name', 'Full Name', { required: true, order: 1 }),
      ff('employee_id', 'text', 'Employee ID', 'Employee ID', { required: true, order: 2 }),
      ff('department', 'select', 'Department', 'Department', { required: true, order: 3, options: [
        { value: 'IT', label: 'IT' }, { value: 'HR', label: 'HR' }, { value: 'Finance', label: 'Finance' },
      ]}),
    ]},
    stats: { totalRequests: 142, completedRequests: 120, avgFulfillmentTime: 3.5, satisfactionScore: 4.6 },
    tags: ['onboarding', 'account'], order: 1, createdBy: 'system',
  },
  {
    serviceId: 'SVC-002', name: 'Password Reset', nameAr: 'Password Reset',
    description: 'Reset your password for any corporate system or application.',
    descriptionAr: 'Reset password', category: 'IT', icon: 'key', status: 'active',
    approvalRequired: false, fulfillmentType: 'automated', estimatedFulfillmentTime: 0.5,
    allowedRoles: ['all'],
    requestForm: { fields: [
      ff('username', 'text', 'Username', 'Username', { required: true, order: 1 }),
    ]},
    stats: { totalRequests: 523, completedRequests: 510, avgFulfillmentTime: 0.3, satisfactionScore: 4.8 },
    tags: ['password', 'self-service'], order: 2, createdBy: 'system',
  },
  {
    serviceId: 'SVC-003', name: 'VPN Access', nameAr: 'VPN Access',
    description: 'Request VPN access for remote work connectivity.',
    descriptionAr: 'VPN', category: 'security', icon: 'shield', status: 'active',
    approvalRequired: true, approvers: [{ type: 'role', value: 'manager' }],
    fulfillmentType: 'hybrid', estimatedFulfillmentTime: 8, allowedRoles: ['all'],
    requestForm: { fields: [
      ff('device_type', 'select', 'Device Type', 'Device', { required: true, order: 1, options: [
        { value: 'laptop', label: 'Laptop' }, { value: 'mobile', label: 'Mobile' },
      ]}),
    ]},
    stats: { totalRequests: 89, completedRequests: 80, avgFulfillmentTime: 6, satisfactionScore: 4.3 },
    tags: ['vpn', 'remote'], order: 3, createdBy: 'system',
  },
  {
    serviceId: 'SVC-004', name: 'Laptop Request', nameAr: 'Laptop',
    description: 'Request a new laptop or replacement for your current device.',
    descriptionAr: 'Laptop', category: 'IT', icon: 'laptop', status: 'active',
    approvalRequired: true, approvers: [{ type: 'role', value: 'manager' }],
    fulfillmentType: 'manual', estimatedFulfillmentTime: 48, allowedRoles: ['all'],
    requestForm: { fields: [] },
    stats: { totalRequests: 67, completedRequests: 55, avgFulfillmentTime: 40, satisfactionScore: 4.2 },
    tags: ['laptop', 'equipment'], order: 4, createdBy: 'system',
  },
  {
    serviceId: 'SVC-005', name: 'Software Installation', nameAr: 'Software',
    description: 'Request installation of approved software on your workstation.',
    descriptionAr: 'Software', category: 'IT', icon: 'download', status: 'active',
    approvalRequired: true, fulfillmentType: 'hybrid', estimatedFulfillmentTime: 4,
    allowedRoles: ['all'], requestForm: { fields: [] },
    stats: { totalRequests: 198, completedRequests: 180, avgFulfillmentTime: 3, satisfactionScore: 4.4 },
    tags: ['software', 'install'], order: 5, createdBy: 'system',
  },
  {
    serviceId: 'SVC-006', name: 'Meeting Room Setup', nameAr: 'Meeting Room',
    description: 'Request AV equipment setup for a meeting room.',
    descriptionAr: 'Meeting room', category: 'facilities', icon: 'video', status: 'active',
    approvalRequired: false, fulfillmentType: 'manual', estimatedFulfillmentTime: 2,
    allowedRoles: ['all'], requestForm: { fields: [] },
    stats: { totalRequests: 178, completedRequests: 170, avgFulfillmentTime: 1.5, satisfactionScore: 4.6 },
    tags: ['meeting', 'av'], order: 6, createdBy: 'system',
  },
];

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  const c = await SC.countDocuments();
  if (c > 0) {
    console.log('Dropping existing ' + c + ' items...');
    await SC.deleteMany({});
  }
  await SC.insertMany(services);
  console.log('Seeded ' + services.length + ' service catalog items');
  await mongoose.disconnect();
  console.log('Done');
}).catch(function(e) { console.error('Error:', e.message); process.exit(1); });
