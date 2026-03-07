/**
 * Seed script for Service Catalog items (ITSM camelCase schema)
 * Run: node scripts/seedServiceCatalog.js
 *
 * Uses the ITSM module's ServiceCatalog model fields (camelCase).
 * The legacy ServiceCatalogController adapter converts to snake_case for the v1 frontend.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/servicedesk';

// Minimal schema matching modules/itsm/models/ServiceCatalog.ts
const FormFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String, required: true },
  labelAr: String,
  placeholder: String,
  required: { type: Boolean, default: false },
  validation: { min: Number, max: Number, pattern: String, message: String },
  options: [{ value: String, label: String, labelAr: String }],
  defaultValue: mongoose.Schema.Types.Mixed,
  order: { type: Number, default: 0 },
  conditionalDisplay: { dependsOnField: String, showWhenValue: String },
}, { _id: false });

const ServiceCatalogSchema = new mongoose.Schema({
  serviceId: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  nameAr: String,
  description: { type: String, required: true },
  descriptionAr: String,
  category: { type: String, required: true, index: true },
  tags: [String],
  icon: String,
  color: String,
  featured: { type: Boolean, default: false },
  requestForm: { fields: [FormFieldSchema] },
  approvalRequired: { type: Boolean, default: false },
  approvers: [{ type: { type: String }, value: String }],
  fulfillmentType: { type: String, default: 'manual' },
  fulfillmentTeam: String,
  autoAssignee: String,
  estimatedFulfillmentTime: Number,
  slaTemplateId: String,
  priority: { type: String, default: 'medium' },
  visibility: { type: String, default: 'internal' },
  allowedRoles: [String],
  status: { type: String, default: 'active', index: true },
  order: { type: Number, default: 0 },
  stats: {
    totalRequests: { type: Number, default: 0 },
    completedRequests: { type: Number, default: 0 },
    avgFulfillmentTime: { type: Number, default: 0 },
    satisfactionScore: { type: Number, default: 0 },
  },
  createdBy: { type: String, required: true },
}, { timestamps: true });

const ServiceCatalog = mongoose.model('ServiceCatalog', ServiceCatalogSchema);

// Helper to build form fields in the ITSM format
function ff(id, type, label, labelAr, opts = {}) {
  return {
    id,
    type,
    label,
    labelAr,
    placeholder: opts.placeholder || '',
    required: opts.required ?? false,
    options: opts.options,
    defaultValue: opts.defaultValue,
    order: opts.order ?? 0,
  };
}

const services = [
  {
    serviceId: 'SVC-001',
    name: 'New User Account',
    nameAr: 'حساب مستخدم جديد',
    description: 'Request a new user account for Active Directory, email, and core business applications.',
    descriptionAr: 'طلب حساب مستخدم جديد للدليل النشط والبريد الإلكتروني والتطبيقات الأساسية.',
    category: 'IT',
    icon: 'user-plus',
    featured: true,
    status: 'active',
    approvalRequired: true,
    approvers: [{ type: 'role', value: 'manager' }],
    fulfillmentType: 'hybrid',
    estimatedFulfillmentTime: 4,
    slaTemplateId: 'DEFAULT',
    allowedRoles: ['all'],
    requestForm: {
      fields: [
        ff('full_name', 'text', 'Full Name', 'الاسم الكامل', { required: true, placeholder: 'Enter full name', order: 1 }),
        ff('employee_id', 'text', 'Employee ID', 'رقم الموظف', { required: true, placeholder: 'e.g. EMP-1234', order: 2 }),
        ff('department', 'select', 'Department', 'القسم', { required: true, order: 3, options: [
          { value: 'IT', label: 'IT', labelAr: 'تقنية المعلومات' },
          { value: 'HR', label: 'HR', labelAr: 'الموارد البشرية' },
          { value: 'Finance', label: 'Finance', labelAr: 'المالية' },
          { value: 'Operations', label: 'Operations', labelAr: 'العمليات' },
          { value: 'Marketing', label: 'Marketing', labelAr: 'التسويق' },
        ]}),
        ff('job_title', 'text', 'Job Title', 'المسمى الوظيفي', { required: true, placeholder: 'Enter job title', order: 4 }),
        ff('start_date', 'date', 'Start Date', 'تاريخ البدء', { required: true, order: 5 }),
        ff('applications', 'textarea', 'Required Applications', 'التطبيقات المطلوبة', { placeholder: 'List applications needed', order: 6 }),
      ],
    },
    stats: { totalRequests: 142, completedRequests: 120, avgFulfillmentTime: 3.5, satisfactionScore: 4.6 },
    tags: ['onboarding', 'account'],
    order: 1,
    createdBy: 'system',
  },
  {
    serviceId: 'SVC-002',
    name: 'Password Reset',
    nameAr: 'إعادة تعيين كلمة المرور',
    description: 'Reset your password for any corporate system or application.',
    descriptionAr: 'إعادة تعيين كلمة المرور لأي نظام أو تطبيق مؤسسي.',
    category: 'IT',
    icon: 'key',
    status: 'active',
    approvalRequired: false,
    fulfillmentType: 'automated',
    estimatedFulfillmentTime: 0.5,
    slaTemplateId: 'DEFAULT',
    allowedRoles: ['all'],
    requestForm: {
      fields: [
        ff('username', 'text', 'Username', 'اسم المستخدم', { required: true, placeholder: 'Enter your username', order: 1 }),
        ff('system', 'select', 'System', 'النظام', { required: true, order: 2, options: [
          { value: 'active_directory', label: 'Active Directory', labelAr: 'الدليل النشط' },
          { value: 'email', label: 'Email', labelAr: 'البريد الإلكتروني' },
          { value: 'erp', label: 'ERP System', labelAr: 'نظام ERP' },
          { value: 'crm', label: 'CRM', labelAr: 'نظام CRM' },
          { value: 'other', label: 'Other', labelAr: 'أخرى' },
        ]}),
      ],
    },
    stats: { totalRequests: 523, completedRequests: 510, avgFulfillmentTime: 0.3, satisfactionScore: 4.8 },
    tags: ['password', 'self-service'],
    order: 2,
    createdBy: 'system',
  },
  {
    serviceId: 'SVC-003',
    name: 'VPN Access',
    nameAr: 'الوصول عبر VPN',
    description: 'Request VPN access for remote work connectivity to corporate network.',
    descriptionAr: 'طلب الوصول عبر VPN للاتصال بالشبكة المؤسسية عن بُعد.',
    category: 'security',
    icon: 'shield',
    status: 'active',
    approvalRequired: true,
    approvers: [{ type: 'role', value: 'manager' }],
    fulfillmentType: 'hybrid',
    estimatedFulfillmentTime: 8,
    slaTemplateId: 'DEFAULT',
    allowedRoles: ['all'],
    requestForm: {
      fields: [
        ff('device_type', 'select', 'Device Type', 'نوع الجهاز', { required: true, order: 1, options: [
          { value: 'company_laptop', label: 'Company Laptop', labelAr: 'حاسب محمول للشركة' },
          { value: 'personal_laptop', label: 'Personal Laptop', labelAr: 'حاسب محمول شخصي' },
          { value: 'mobile', label: 'Mobile Device', labelAr: 'جهاز محمول' },
        ]}),
        ff('os', 'select', 'Operating System', 'نظام التشغيل', { required: true, order: 2, options: [
          { value: 'windows', label: 'Windows', labelAr: 'ويندوز' },
          { value: 'macos', label: 'macOS', labelAr: 'ماك' },
          { value: 'linux', label: 'Linux', labelAr: 'لينكس' },
        ]}),
        ff('access_duration', 'select', 'Access Duration', 'مدة الوصول', { required: true, order: 3, options: [
          { value: 'temporary_1w', label: '1 Week', labelAr: 'أسبوع واحد' },
          { value: 'temporary_1m', label: '1 Month', labelAr: 'شهر واحد' },
          { value: 'permanent', label: 'Permanent', labelAr: 'دائم' },
        ]}),
      ],
    },
    stats: { totalRequests: 89, completedRequests: 80, avgFulfillmentTime: 6, satisfactionScore: 4.3 },
    tags: ['vpn', 'remote', 'network'],
    order: 3,
    createdBy: 'system',
  },
  {
    serviceId: 'SVC-004',
    name: 'Laptop Request',
    nameAr: 'طلب حاسب محمول',
    description: 'Request a new laptop or replacement for your current device.',
    descriptionAr: 'طلب حاسب محمول جديد أو استبدال الجهاز الحالي.',
    category: 'IT',
    icon: 'laptop',
    status: 'active',
    approvalRequired: true,
    approvers: [{ type: 'role', value: 'manager' }, { type: 'role', value: 'it-manager' }],
    fulfillmentType: 'manual',
    estimatedFulfillmentTime: 48,
    slaTemplateId: 'DEFAULT',
    allowedRoles: ['all'],
    requestForm: {
      fields: [
        ff('request_type', 'select', 'Request Type', 'نوع الطلب', { required: true, order: 1, options: [
          { value: 'new', label: 'New Laptop', labelAr: 'حاسب جديد' },
          { value: 'replacement', label: 'Replacement', labelAr: 'استبدال' },
          { value: 'upgrade', label: 'Upgrade', labelAr: 'ترقية' },
        ]}),
        ff('laptop_type', 'select', 'Laptop Type', 'نوع الحاسب', { required: true, order: 2, options: [
          { value: 'standard', label: 'Standard (Office use)', labelAr: 'عادي (استخدام مكتبي)' },
          { value: 'performance', label: 'Performance (Development)', labelAr: 'عالي الأداء (تطوير)' },
          { value: 'workstation', label: 'Workstation (Design/Engineering)', labelAr: 'محطة عمل (تصميم/هندسة)' },
        ]}),
        ff('current_asset_tag', 'text', 'Current Asset Tag (if replacement)', 'رقم الأصل الحالي', { placeholder: 'e.g. AST-12345', order: 3 }),
        ff('additional_specs', 'textarea', 'Additional Requirements', 'متطلبات إضافية', { placeholder: 'Any specific requirements', order: 4 }),
      ],
    },
    stats: { totalRequests: 67, completedRequests: 55, avgFulfillmentTime: 40, satisfactionScore: 4.2 },
    tags: ['laptop', 'equipment'],
    order: 4,
    createdBy: 'system',
  },
  {
    serviceId: 'SVC-005',
    name: 'Software Installation',
    nameAr: 'تثبيت برنامج',
    description: 'Request installation of approved software on your workstation.',
    descriptionAr: 'طلب تثبيت برنامج معتمد على محطة العمل.',
    category: 'IT',
    icon: 'download',
    status: 'active',
    approvalRequired: true,
    approvers: [{ type: 'role', value: 'it-manager' }],
    fulfillmentType: 'hybrid',
    estimatedFulfillmentTime: 4,
    slaTemplateId: 'DEFAULT',
    allowedRoles: ['all'],
    requestForm: {
      fields: [
        ff('software_name', 'text', 'Software Name', 'اسم البرنامج', { required: true, placeholder: 'e.g. Adobe Acrobat Pro', order: 1 }),
        ff('version', 'text', 'Version (if specific)', 'الإصدار', { placeholder: 'e.g. 2024', order: 2 }),
        ff('license_type', 'select', 'License Type', 'نوع الترخيص', { required: true, order: 3, options: [
          { value: 'company_owned', label: 'Company-owned License', labelAr: 'ترخيص الشركة' },
          { value: 'free', label: 'Free / Open Source', labelAr: 'مجاني / مفتوح المصدر' },
          { value: 'need_purchase', label: 'Needs Purchase', labelAr: 'يحتاج شراء' },
        ]}),
        ff('business_reason', 'textarea', 'Business Reason', 'السبب التجاري', { required: true, placeholder: 'Why do you need this software?', order: 4 }),
      ],
    },
    stats: { totalRequests: 198, completedRequests: 180, avgFulfillmentTime: 3, satisfactionScore: 4.4 },
    tags: ['software', 'install'],
    order: 5,
    createdBy: 'system',
  },
  {
    serviceId: 'SVC-006',
    name: 'Meeting Room Setup',
    nameAr: 'إعداد غرفة اجتماعات',
    description: 'Request AV equipment setup, video conferencing, or technical support for a meeting room.',
    descriptionAr: 'طلب إعداد معدات صوت ومرئيات أو مؤتمرات فيديو أو دعم تقني لغرفة اجتماعات.',
    category: 'facilities',
    icon: 'video',
    status: 'active',
    approvalRequired: false,
    fulfillmentType: 'manual',
    estimatedFulfillmentTime: 2,
    slaTemplateId: 'DEFAULT',
    allowedRoles: ['all'],
    requestForm: {
      fields: [
        ff('room_name', 'text', 'Meeting Room', 'غرفة الاجتماعات', { required: true, placeholder: 'e.g. Conference Room A', order: 1 }),
        ff('meeting_date', 'datetime', 'Meeting Date & Time', 'تاريخ ووقت الاجتماع', { required: true, order: 2 }),
        ff('equipment_needed', 'select', 'Equipment Needed', 'المعدات المطلوبة', { required: true, order: 3, options: [
          { value: 'projector', label: 'Projector', labelAr: 'جهاز عرض' },
          { value: 'video_conference', label: 'Video Conferencing', labelAr: 'مؤتمرات فيديو' },
          { value: 'audio_system', label: 'Audio System', labelAr: 'نظام صوت' },
          { value: 'full_av', label: 'Full AV Setup', labelAr: 'إعداد كامل' },
        ]}),
      ],
    },
    stats: { totalRequests: 178, completedRequests: 170, avgFulfillmentTime: 1.5, satisfactionScore: 4.6 },
    tags: ['meeting', 'av', 'conference'],
    order: 6,
    createdBy: 'system',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await ServiceCatalog.countDocuments();
    if (existing > 0) {
      console.log(`Service catalog already has ${existing} items. Skipping seed.`);
      console.log('To re-seed, drop the collection first: db.servicecatalogs.drop()');
    } else {
      await ServiceCatalog.insertMany(services);
      console.log(`✅ Seeded ${services.length} service catalog items`);
    }

    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
