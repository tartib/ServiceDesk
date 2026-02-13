/**
 * Seed script for Service Catalog items
 * Run: node scripts/seedServiceCatalog.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/servicedesk';

const ServiceCatalogSchema = new mongoose.Schema({
  service_id: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  name_ar: { type: String },
  description: { type: String, required: true },
  description_ar: { type: String },
  icon: { type: String },
  form: { type: Array, default: [] },
  workflow: {
    approval_chain: { type: Array, default: [] },
    auto_assign_group: { type: String },
    sla_id: { type: String, required: true },
  },
  fulfillment: {
    type: { type: String, default: 'manual' },
    estimated_hours: { type: Number, default: 24 },
  },
  pricing: {
    cost: { type: Number, default: 0 },
    currency: { type: String, default: 'SAR' },
    billing_type: { type: String, default: 'free' },
  },
  availability: {
    is_active: { type: Boolean, default: true },
    available_to: { type: Array, default: ['all'] },
    requires_approval: { type: Boolean, default: true },
  },
  metrics: {
    total_requests: { type: Number, default: 0 },
    avg_fulfillment_hours: { type: Number, default: 0 },
    satisfaction_score: { type: Number, default: 0 },
  },
  tags: { type: Array, default: [] },
  order: { type: Number, default: 0 },
  site_id: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const ServiceCatalog = mongoose.model('ServiceCatalog', ServiceCatalogSchema);

const services = [
  {
    service_id: 'SVC-001',
    category: 'access_management',
    name: 'New User Account',
    name_ar: 'حساب مستخدم جديد',
    description: 'Request a new user account for Active Directory, email, and core business applications.',
    description_ar: 'طلب حساب مستخدم جديد للدليل النشط والبريد الإلكتروني والتطبيقات الأساسية.',
    icon: 'user-plus',
    form: [
      { field_id: 'full_name', label: 'Full Name', label_ar: 'الاسم الكامل', type: 'text', required: true, placeholder: 'Enter full name', order: 1 },
      { field_id: 'employee_id', label: 'Employee ID', label_ar: 'رقم الموظف', type: 'text', required: true, placeholder: 'e.g. EMP-1234', order: 2 },
      { field_id: 'department', label: 'Department', label_ar: 'القسم', type: 'select', required: true, options: [
        { value: 'IT', label: 'IT', label_ar: 'تقنية المعلومات' },
        { value: 'HR', label: 'HR', label_ar: 'الموارد البشرية' },
        { value: 'Finance', label: 'Finance', label_ar: 'المالية' },
        { value: 'Operations', label: 'Operations', label_ar: 'العمليات' },
        { value: 'Marketing', label: 'Marketing', label_ar: 'التسويق' },
      ], order: 3 },
      { field_id: 'job_title', label: 'Job Title', label_ar: 'المسمى الوظيفي', type: 'text', required: true, placeholder: 'Enter job title', order: 4 },
      { field_id: 'start_date', label: 'Start Date', label_ar: 'تاريخ البدء', type: 'date', required: true, order: 5 },
      { field_id: 'applications', label: 'Required Applications', label_ar: 'التطبيقات المطلوبة', type: 'textarea', required: false, placeholder: 'List applications needed (e.g. SAP, CRM, etc.)', order: 6 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'manager', approver_name: 'Line Manager', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'hybrid', estimated_hours: 4 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 142, avg_fulfillment_hours: 3.5, satisfaction_score: 4.6 },
    tags: ['onboarding', 'account'],
    order: 1,
  },
  {
    service_id: 'SVC-002',
    category: 'access_management',
    name: 'Password Reset',
    name_ar: 'إعادة تعيين كلمة المرور',
    description: 'Reset your password for any corporate system or application.',
    description_ar: 'إعادة تعيين كلمة المرور لأي نظام أو تطبيق مؤسسي.',
    icon: 'key',
    form: [
      { field_id: 'username', label: 'Username', label_ar: 'اسم المستخدم', type: 'text', required: true, placeholder: 'Enter your username', order: 1 },
      { field_id: 'system', label: 'System', label_ar: 'النظام', type: 'select', required: true, options: [
        { value: 'active_directory', label: 'Active Directory', label_ar: 'الدليل النشط' },
        { value: 'email', label: 'Email', label_ar: 'البريد الإلكتروني' },
        { value: 'erp', label: 'ERP System', label_ar: 'نظام ERP' },
        { value: 'crm', label: 'CRM', label_ar: 'نظام CRM' },
        { value: 'other', label: 'Other', label_ar: 'أخرى' },
      ], order: 2 },
    ],
    workflow: { approval_chain: [], sla_id: 'DEFAULT' },
    fulfillment: { type: 'automated', estimated_hours: 0.5 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: false },
    metrics: { total_requests: 523, avg_fulfillment_hours: 0.3, satisfaction_score: 4.8 },
    tags: ['password', 'self-service'],
    order: 2,
  },
  {
    service_id: 'SVC-003',
    category: 'access_management',
    name: 'VPN Access',
    name_ar: 'الوصول عبر VPN',
    description: 'Request VPN access for remote work connectivity to corporate network.',
    description_ar: 'طلب الوصول عبر VPN للاتصال بالشبكة المؤسسية عن بُعد.',
    icon: 'shield',
    form: [
      { field_id: 'device_type', label: 'Device Type', label_ar: 'نوع الجهاز', type: 'select', required: true, options: [
        { value: 'company_laptop', label: 'Company Laptop', label_ar: 'حاسب محمول للشركة' },
        { value: 'personal_laptop', label: 'Personal Laptop', label_ar: 'حاسب محمول شخصي' },
        { value: 'mobile', label: 'Mobile Device', label_ar: 'جهاز محمول' },
      ], order: 1 },
      { field_id: 'os', label: 'Operating System', label_ar: 'نظام التشغيل', type: 'select', required: true, options: [
        { value: 'windows', label: 'Windows', label_ar: 'ويندوز' },
        { value: 'macos', label: 'macOS', label_ar: 'ماك' },
        { value: 'linux', label: 'Linux', label_ar: 'لينكس' },
        { value: 'ios', label: 'iOS', label_ar: 'iOS' },
        { value: 'android', label: 'Android', label_ar: 'أندرويد' },
      ], order: 2 },
      { field_id: 'access_duration', label: 'Access Duration', label_ar: 'مدة الوصول', type: 'select', required: true, options: [
        { value: 'temporary_1w', label: '1 Week', label_ar: 'أسبوع واحد' },
        { value: 'temporary_1m', label: '1 Month', label_ar: 'شهر واحد' },
        { value: 'permanent', label: 'Permanent', label_ar: 'دائم' },
      ], order: 3 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'manager', approver_name: 'Line Manager', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'hybrid', estimated_hours: 8 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 89, avg_fulfillment_hours: 6, satisfaction_score: 4.3 },
    tags: ['vpn', 'remote', 'network'],
    order: 3,
  },
  {
    service_id: 'SVC-004',
    category: 'hardware',
    name: 'Laptop Request',
    name_ar: 'طلب حاسب محمول',
    description: 'Request a new laptop or replacement for your current device.',
    description_ar: 'طلب حاسب محمول جديد أو استبدال الجهاز الحالي.',
    icon: 'laptop',
    form: [
      { field_id: 'request_type', label: 'Request Type', label_ar: 'نوع الطلب', type: 'select', required: true, options: [
        { value: 'new', label: 'New Laptop', label_ar: 'حاسب جديد' },
        { value: 'replacement', label: 'Replacement', label_ar: 'استبدال' },
        { value: 'upgrade', label: 'Upgrade', label_ar: 'ترقية' },
      ], order: 1 },
      { field_id: 'laptop_type', label: 'Laptop Type', label_ar: 'نوع الحاسب', type: 'select', required: true, options: [
        { value: 'standard', label: 'Standard (Office use)', label_ar: 'عادي (استخدام مكتبي)' },
        { value: 'performance', label: 'Performance (Development)', label_ar: 'عالي الأداء (تطوير)' },
        { value: 'workstation', label: 'Workstation (Design/Engineering)', label_ar: 'محطة عمل (تصميم/هندسة)' },
      ], order: 2 },
      { field_id: 'current_asset_tag', label: 'Current Asset Tag (if replacement)', label_ar: 'رقم الأصل الحالي (إن وجد)', type: 'text', required: false, placeholder: 'e.g. AST-12345', order: 3 },
      { field_id: 'additional_specs', label: 'Additional Requirements', label_ar: 'متطلبات إضافية', type: 'textarea', required: false, placeholder: 'Any specific requirements (RAM, storage, etc.)', order: 4 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'manager', approver_name: 'Line Manager', is_optional: false }, { step: 2, approver_type: 'role', approver_id: 'it-manager', approver_name: 'IT Manager', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'manual', estimated_hours: 48 },
    pricing: { cost: 4500, currency: 'SAR', billing_type: 'one_time' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 67, avg_fulfillment_hours: 40, satisfaction_score: 4.2 },
    tags: ['laptop', 'equipment'],
    order: 4,
  },
  {
    service_id: 'SVC-005',
    category: 'hardware',
    name: 'Monitor Request',
    name_ar: 'طلب شاشة',
    description: 'Request an additional monitor or replacement for your workstation.',
    description_ar: 'طلب شاشة إضافية أو استبدال شاشة محطة العمل.',
    icon: 'monitor',
    form: [
      { field_id: 'monitor_type', label: 'Monitor Type', label_ar: 'نوع الشاشة', type: 'select', required: true, options: [
        { value: '24_standard', label: '24" Standard', label_ar: '24 بوصة عادية' },
        { value: '27_qhd', label: '27" QHD', label_ar: '27 بوصة QHD' },
        { value: '32_4k', label: '32" 4K', label_ar: '32 بوصة 4K' },
      ], order: 1 },
      { field_id: 'quantity', label: 'Quantity', label_ar: 'الكمية', type: 'number', required: true, default_value: 1, order: 2 },
      { field_id: 'desk_location', label: 'Desk / Office Location', label_ar: 'موقع المكتب', type: 'text', required: true, placeholder: 'e.g. Building A, Floor 3, Desk 42', order: 3 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'manager', approver_name: 'Line Manager', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'manual', estimated_hours: 24 },
    pricing: { cost: 1200, currency: 'SAR', billing_type: 'one_time' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 34, avg_fulfillment_hours: 20, satisfaction_score: 4.5 },
    tags: ['monitor', 'equipment'],
    order: 5,
  },
  {
    service_id: 'SVC-006',
    category: 'hardware',
    name: 'Printer Setup',
    name_ar: 'إعداد طابعة',
    description: 'Request printer installation, configuration, or access to a shared printer.',
    description_ar: 'طلب تثبيت طابعة أو إعدادها أو الوصول إلى طابعة مشتركة.',
    icon: 'printer',
    form: [
      { field_id: 'setup_type', label: 'Setup Type', label_ar: 'نوع الإعداد', type: 'select', required: true, options: [
        { value: 'new_install', label: 'New Printer Installation', label_ar: 'تثبيت طابعة جديدة' },
        { value: 'shared_access', label: 'Access to Shared Printer', label_ar: 'الوصول لطابعة مشتركة' },
        { value: 'reconfigure', label: 'Reconfigure Existing Printer', label_ar: 'إعادة إعداد طابعة حالية' },
      ], order: 1 },
      { field_id: 'printer_name', label: 'Printer Name / Location', label_ar: 'اسم الطابعة / الموقع', type: 'text', required: false, placeholder: 'e.g. HP-Floor3-East', order: 2 },
      { field_id: 'floor_location', label: 'Floor / Building', label_ar: 'الطابق / المبنى', type: 'text', required: true, placeholder: 'e.g. Building A, Floor 2', order: 3 },
    ],
    workflow: { approval_chain: [], sla_id: 'DEFAULT' },
    fulfillment: { type: 'manual', estimated_hours: 4 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: false },
    metrics: { total_requests: 45, avg_fulfillment_hours: 3, satisfaction_score: 4.1 },
    tags: ['printer', 'setup'],
    order: 6,
  },
  {
    service_id: 'SVC-007',
    category: 'software',
    name: 'Software Installation',
    name_ar: 'تثبيت برنامج',
    description: 'Request installation of approved software on your workstation.',
    description_ar: 'طلب تثبيت برنامج معتمد على محطة العمل.',
    icon: 'download',
    form: [
      { field_id: 'software_name', label: 'Software Name', label_ar: 'اسم البرنامج', type: 'text', required: true, placeholder: 'e.g. Adobe Acrobat Pro, Visual Studio Code', order: 1 },
      { field_id: 'version', label: 'Version (if specific)', label_ar: 'الإصدار (إن وجد)', type: 'text', required: false, placeholder: 'e.g. 2024, v3.1', order: 2 },
      { field_id: 'license_type', label: 'License Type', label_ar: 'نوع الترخيص', type: 'select', required: true, options: [
        { value: 'company_owned', label: 'Company-owned License', label_ar: 'ترخيص الشركة' },
        { value: 'free', label: 'Free / Open Source', label_ar: 'مجاني / مفتوح المصدر' },
        { value: 'need_purchase', label: 'Needs Purchase', label_ar: 'يحتاج شراء' },
      ], order: 3 },
      { field_id: 'business_reason', label: 'Business Reason', label_ar: 'السبب التجاري', type: 'textarea', required: true, placeholder: 'Why do you need this software?', order: 4 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'it-manager', approver_name: 'IT Manager', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'hybrid', estimated_hours: 4 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 198, avg_fulfillment_hours: 3, satisfaction_score: 4.4 },
    tags: ['software', 'install'],
    order: 7,
  },
  {
    service_id: 'SVC-008',
    category: 'software',
    name: 'Microsoft 365 License',
    name_ar: 'ترخيص مايكروسوفت 365',
    description: 'Request a Microsoft 365 license for Office apps, Teams, and OneDrive.',
    description_ar: 'طلب ترخيص مايكروسوفت 365 لتطبيقات أوفيس وتيمز وون درايف.',
    icon: 'file-text',
    form: [
      { field_id: 'license_plan', label: 'License Plan', label_ar: 'خطة الترخيص', type: 'select', required: true, options: [
        { value: 'business_basic', label: 'Business Basic (Web apps only)', label_ar: 'أساسي (تطبيقات الويب فقط)' },
        { value: 'business_standard', label: 'Business Standard (Desktop apps)', label_ar: 'قياسي (تطبيقات سطح المكتب)' },
        { value: 'business_premium', label: 'Business Premium (Advanced security)', label_ar: 'متميز (أمان متقدم)' },
      ], order: 1 },
      { field_id: 'user_email', label: 'User Email', label_ar: 'بريد المستخدم', type: 'email', required: true, placeholder: 'user@company.com', order: 2 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'manager', approver_name: 'Line Manager', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'automated', estimated_hours: 2 },
    pricing: { cost: 75, currency: 'SAR', billing_type: 'recurring' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 112, avg_fulfillment_hours: 1.5, satisfaction_score: 4.7 },
    tags: ['microsoft', 'license', 'office'],
    order: 8,
  },
  {
    service_id: 'SVC-009',
    category: 'network',
    name: 'Wi-Fi Access',
    name_ar: 'الوصول للشبكة اللاسلكية',
    description: 'Request access to corporate Wi-Fi network for your device.',
    description_ar: 'طلب الوصول إلى شبكة الواي فاي المؤسسية لجهازك.',
    icon: 'wifi',
    form: [
      { field_id: 'device_mac', label: 'Device MAC Address', label_ar: 'عنوان MAC للجهاز', type: 'text', required: true, placeholder: 'e.g. AA:BB:CC:DD:EE:FF', order: 1 },
      { field_id: 'device_type', label: 'Device Type', label_ar: 'نوع الجهاز', type: 'select', required: true, options: [
        { value: 'laptop', label: 'Laptop', label_ar: 'حاسب محمول' },
        { value: 'mobile', label: 'Mobile Phone', label_ar: 'هاتف محمول' },
        { value: 'tablet', label: 'Tablet', label_ar: 'جهاز لوحي' },
        { value: 'iot', label: 'IoT Device', label_ar: 'جهاز IoT' },
      ], order: 2 },
      { field_id: 'network_type', label: 'Network', label_ar: 'الشبكة', type: 'select', required: true, options: [
        { value: 'corporate', label: 'Corporate Network', label_ar: 'شبكة الشركة' },
        { value: 'guest', label: 'Guest Network', label_ar: 'شبكة الضيوف' },
      ], order: 3 },
    ],
    workflow: { approval_chain: [], sla_id: 'DEFAULT' },
    fulfillment: { type: 'automated', estimated_hours: 1 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: false },
    metrics: { total_requests: 256, avg_fulfillment_hours: 0.5, satisfaction_score: 4.5 },
    tags: ['wifi', 'network', 'connectivity'],
    order: 9,
  },
  {
    service_id: 'SVC-010',
    category: 'network',
    name: 'Network Port Activation',
    name_ar: 'تفعيل منفذ شبكة',
    description: 'Request activation of a network port at your desk or meeting room.',
    description_ar: 'طلب تفعيل منفذ شبكة في مكتبك أو غرفة الاجتماعات.',
    icon: 'plug',
    form: [
      { field_id: 'port_id', label: 'Port ID / Label', label_ar: 'رقم المنفذ', type: 'text', required: true, placeholder: 'e.g. P-A3-042', order: 1 },
      { field_id: 'location', label: 'Location', label_ar: 'الموقع', type: 'text', required: true, placeholder: 'Building, Floor, Room', order: 2 },
      { field_id: 'vlan', label: 'VLAN Required', label_ar: 'VLAN المطلوب', type: 'select', required: false, options: [
        { value: 'data', label: 'Data', label_ar: 'بيانات' },
        { value: 'voice', label: 'Voice', label_ar: 'صوت' },
        { value: 'management', label: 'Management', label_ar: 'إدارة' },
      ], order: 3 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'network-admin', approver_name: 'Network Admin', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'manual', estimated_hours: 8 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 28, avg_fulfillment_hours: 6, satisfaction_score: 4.0 },
    tags: ['network', 'port', 'infrastructure'],
    order: 10,
  },
  {
    service_id: 'SVC-011',
    category: 'accounts',
    name: 'Email Distribution List',
    name_ar: 'قائمة توزيع البريد',
    description: 'Create or modify an email distribution list for your team or department.',
    description_ar: 'إنشاء أو تعديل قائمة توزيع بريد إلكتروني لفريقك أو قسمك.',
    icon: 'mail',
    form: [
      { field_id: 'action_type', label: 'Action', label_ar: 'الإجراء', type: 'select', required: true, options: [
        { value: 'create', label: 'Create New List', label_ar: 'إنشاء قائمة جديدة' },
        { value: 'modify', label: 'Modify Existing List', label_ar: 'تعديل قائمة حالية' },
        { value: 'delete', label: 'Delete List', label_ar: 'حذف قائمة' },
      ], order: 1 },
      { field_id: 'list_name', label: 'Distribution List Name', label_ar: 'اسم قائمة التوزيع', type: 'text', required: true, placeholder: 'e.g. marketing-team@company.com', order: 2 },
      { field_id: 'members', label: 'Members (emails)', label_ar: 'الأعضاء (بريد إلكتروني)', type: 'textarea', required: false, placeholder: 'One email per line', order: 3 },
    ],
    workflow: { approval_chain: [{ step: 1, approver_type: 'role', approver_id: 'manager', approver_name: 'Line Manager', is_optional: false }], sla_id: 'DEFAULT' },
    fulfillment: { type: 'manual', estimated_hours: 4 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: true },
    metrics: { total_requests: 56, avg_fulfillment_hours: 3, satisfaction_score: 4.3 },
    tags: ['email', 'distribution', 'group'],
    order: 11,
  },
  {
    service_id: 'SVC-012',
    category: 'general_request',
    name: 'Meeting Room Setup',
    name_ar: 'إعداد غرفة اجتماعات',
    description: 'Request AV equipment setup, video conferencing, or technical support for a meeting room.',
    description_ar: 'طلب إعداد معدات صوت ومرئيات أو مؤتمرات فيديو أو دعم تقني لغرفة اجتماعات.',
    icon: 'video',
    form: [
      { field_id: 'room_name', label: 'Meeting Room', label_ar: 'غرفة الاجتماعات', type: 'text', required: true, placeholder: 'e.g. Conference Room A, Floor 5', order: 1 },
      { field_id: 'meeting_date', label: 'Meeting Date & Time', label_ar: 'تاريخ ووقت الاجتماع', type: 'datetime', required: true, order: 2 },
      { field_id: 'equipment_needed', label: 'Equipment Needed', label_ar: 'المعدات المطلوبة', type: 'select', required: true, options: [
        { value: 'projector', label: 'Projector', label_ar: 'جهاز عرض' },
        { value: 'video_conference', label: 'Video Conferencing', label_ar: 'مؤتمرات فيديو' },
        { value: 'audio_system', label: 'Audio System', label_ar: 'نظام صوت' },
        { value: 'full_av', label: 'Full AV Setup', label_ar: 'إعداد كامل' },
      ], order: 3 },
      { field_id: 'attendees_count', label: 'Number of Attendees', label_ar: 'عدد الحضور', type: 'number', required: false, default_value: 10, order: 4 },
    ],
    workflow: { approval_chain: [], sla_id: 'DEFAULT' },
    fulfillment: { type: 'manual', estimated_hours: 2 },
    pricing: { cost: 0, currency: 'SAR', billing_type: 'free' },
    availability: { is_active: true, available_to: ['all'], requires_approval: false },
    metrics: { total_requests: 178, avg_fulfillment_hours: 1.5, satisfaction_score: 4.6 },
    tags: ['meeting', 'av', 'conference'],
    order: 12,
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
