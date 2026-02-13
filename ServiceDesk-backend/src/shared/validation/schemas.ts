import Joi from 'joi';

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('admin', 'user', 'manager', 'prep').optional(),
  phone: Joi.string().optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters',
    'any.required': 'New password is required',
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().optional(),
  fcmToken: Joi.string().optional(),
});

// ============================================
// ITSM SCHEMAS
// ============================================

export const createIncidentSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Title must be at least 3 characters',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().min(10).required().messages({
    'string.min': 'Description must be at least 10 characters',
    'any.required': 'Description is required',
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  impact: Joi.string().valid('low', 'medium', 'high').optional(),
  urgency: Joi.string().valid('low', 'medium', 'high').optional(),
  channel: Joi.string().optional(),
  category: Joi.string().optional(),
  category_id: Joi.string().optional(),
  subcategory_id: Joi.string().optional(),
  site_id: Joi.string().optional(),
  assignedTo: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  is_major: Joi.boolean().optional(),
  department: Joi.string().optional(),
  phone: Joi.string().optional(),
}).unknown(true);

export const updateIncidentSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  status: Joi.string().optional(),
  assignedTo: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const createProblemSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Title is required',
    'string.max': 'Title must not exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().allow('').optional().messages({
    'string.min': 'Description must be at least 1 character',
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  affectedServices: Joi.array().items(Joi.string()).optional(),
  rootCause: Joi.string().optional(),
}).unknown(true);

export const createChangeSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  type: Joi.string().valid('standard', 'normal', 'emergency').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  impact: Joi.string().valid('low', 'medium', 'high').optional(),
  risk: Joi.string().valid('low', 'medium', 'high').optional(),
  risk_assessment: Joi.string().optional(),
  implementation_plan: Joi.string().optional(),
  rollback_plan: Joi.string().optional(),
  test_plan: Joi.string().optional().allow('', null),
  communication_plan: Joi.string().optional().allow('', null),
  schedule: Joi.object({
    planned_start: Joi.string().optional(),
    planned_end: Joi.string().optional(),
    maintenance_window: Joi.string().optional().allow('', null),
  }).optional(),
  affected_services: Joi.array().items(Joi.string()).optional(),
  affected_cis: Joi.array().items(Joi.string()).optional(),
  site_id: Joi.string().optional(),
  reason_for_change: Joi.string().optional(),
  business_justification: Joi.string().optional().allow('', null),
  department: Joi.string().optional().allow('', null),
  linked_problems: Joi.array().items(Joi.string()).optional(),
  linked_incidents: Joi.array().items(Joi.string()).optional(),
}).unknown(true);

// ============================================
// PROJECT MANAGEMENT SCHEMAS
// ============================================

export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().optional(),
  key: Joi.string().min(2).max(10).required(),
  methodology: Joi.string().valid('agile', 'waterfall', 'kanban', 'scrum').optional(),
  lead: Joi.string().required(),
  members: Joi.array().items(Joi.string()).optional(),
});

export const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional(),
  projectId: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  assignee: Joi.string().optional().allow(null, ''),
  storyPoints: Joi.number().optional().allow(null, ''),
  dueDate: Joi.date().iso().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  status: Joi.string().optional(),
  assignee: Joi.string().optional().allow(null, ''),
  storyPoints: Joi.number().optional().allow(null, ''),
  dueDate: Joi.date().iso().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const createSprintSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().optional(),
  projectId: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  goal: Joi.string().optional(),
});

// ============================================
// FORMS SCHEMAS
// ============================================

export const createFormTemplateSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().optional(),
  fields: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required(),
      required: Joi.boolean().optional(),
      options: Joi.array().optional(),
    })
  ).required(),
  category: Joi.string().optional(),
});

export const createFormSubmissionSchema = Joi.object({
  form_template_id: Joi.string().required(),
  data: Joi.object().required(),
  attachments: Joi.array().optional(),
  signature: Joi.object().optional(),
  geolocation: Joi.object().optional(),
  is_draft: Joi.boolean().optional(),
});

// ============================================
// PAGINATION SCHEMAS
// ============================================

export const paginationSchema = Joi.object({
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(100).optional().default(20),
  sort: Joi.string().optional(),
  search: Joi.string().optional(),
});

// ============================================
// UTILITY FUNCTION
// ============================================

export function validateSchema(data: Record<string, unknown>, schema: Joi.ObjectSchema) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return { valid: false, errors: details, data: null };
  }

  return { valid: true, errors: null, data: value };
}
