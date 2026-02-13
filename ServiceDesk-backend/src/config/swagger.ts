import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ServiceDesk ITSM API',
      version: '2.0.0',
      description: `
# IT Service Management API Documentation

This API provides comprehensive IT Service Management (ITSM) functionality including:

- **Incident Management** - Create, track, and resolve IT incidents
- **Problem Management** - Root cause analysis and known error database
- **Change Management** - Change requests with CAB approval workflow
- **SLA Management** - Service Level Agreement tracking and breach alerts

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## API Versions

- **v1** - Legacy API for tasks, products, inventory
- **v2** - ITSM API for incidents, problems, changes
      `,
      contact: {
        name: 'ServiceDesk Support',
        email: 'support@servicedesk.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'البيانات المدخلة غير صحيحة' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'البريد الإلكتروني يجب أن يكون بصيغة صحيحة' },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        Incident: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            incident_id: { type: 'string', example: 'INC-2025-00001' },
            title: { type: 'string', example: 'Email not working' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'],
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
            },
            impact: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            urgency: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            requester: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                department: { type: 'string' },
              },
            },
            assigned_to: {
              type: 'object',
              properties: {
                technician_id: { type: 'string' },
                name: { type: 'string' },
                group_id: { type: 'string' },
                group_name: { type: 'string' },
              },
            },
            sla: {
              type: 'object',
              properties: {
                response_due: { type: 'string', format: 'date-time' },
                resolution_due: { type: 'string', format: 'date-time' },
                breach_flag: { type: 'boolean' },
              },
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateIncident: {
          type: 'object',
          required: ['title', 'description', 'impact', 'urgency', 'channel', 'category_id', 'site_id'],
          properties: {
            title: { type: 'string', example: 'Cannot access email' },
            description: { type: 'string', example: 'User unable to login to email since this morning' },
            impact: { type: 'string', enum: ['high', 'medium', 'low'] },
            urgency: { type: 'string', enum: ['high', 'medium', 'low'] },
            channel: { type: 'string', enum: ['self_service', 'email', 'phone', 'chat', 'walk_in'] },
            category_id: { type: 'string' },
            site_id: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            is_major: { type: 'boolean', default: false },
          },
        },
        Problem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            problem_id: { type: 'string', example: 'PRB-2025-00001' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['logged', 'rca_in_progress', 'known_error', 'resolved', 'closed'],
            },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            root_cause: { type: 'string' },
            workaround: { type: 'string' },
            linked_incidents: { type: 'array', items: { type: 'string' } },
            known_error: {
              type: 'object',
              properties: {
                ke_id: { type: 'string' },
                title: { type: 'string' },
                symptoms: { type: 'string' },
                workaround: { type: 'string' },
              },
            },
          },
        },
        Change: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            change_id: { type: 'string', example: 'CHG-2025-00001' },
            type: { type: 'string', enum: ['normal', 'standard', 'emergency'] },
            title: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'cab_review', 'approved', 'rejected', 'scheduled', 'implementing', 'completed', 'failed', 'cancelled'],
            },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            risk: { type: 'string', enum: ['high', 'medium', 'low'] },
            cab_approval: {
              type: 'object',
              properties: {
                cab_status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                required_approvers: { type: 'integer' },
                current_approvers: { type: 'integer' },
              },
            },
            schedule: {
              type: 'object',
              properties: {
                planned_start: { type: 'string', format: 'date-time' },
                planned_end: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        IncidentStats: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            open: { type: 'integer' },
            inProgress: { type: 'integer' },
            pending: { type: 'integer' },
            resolved: { type: 'integer' },
            breached: { type: 'integer' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'تم تسجيل الدخول بنجاح' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                    email: { type: 'string', example: 'user@example.com' },
                    name: { type: 'string', example: 'أحمد محمد' },
                    role: { type: 'string', example: 'user' },
                  },
                },
              },
            },
          },
        },
        IncidentResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'تم جلب الحادثة بنجاح' },
            data: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                incident_id: { type: 'string', example: 'INC-2025-00001' },
                title: { type: 'string', example: 'البريد الإلكتروني لا يعمل' },
                description: { type: 'string', example: 'المستخدم لا يستطيع الوصول للبريد الإلكتروني' },
                status: { type: 'string', example: 'in_progress' },
                priority: { type: 'string', example: 'high' },
                impact: { type: 'string', example: 'high' },
                urgency: { type: 'string', example: 'high' },
                created_at: { type: 'string', example: '2025-01-02T04:41:00Z' },
                updated_at: { type: 'string', example: '2025-01-02T04:41:00Z' },
              },
            },
          },
        },
        IncidentsListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'تم جلب الحوادث بنجاح' },
            data: {
              type: 'object',
              properties: {
                incidents: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Incident' },
                },
                pagination: { $ref: '#/components/schemas/Pagination' },
              },
            },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'البيانات المدخلة غير صحيحة' },
            errors: {
              type: 'array',
              example: [
                {
                  field: 'email',
                  message: 'البريد الإلكتروني يجب أن يكون بصيغة صحيحة (example@domain.com)',
                },
                {
                  field: 'password',
                  message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
                },
              ],
            },
          },
        },
        UnauthorizedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 401 },
            message: { type: 'string', example: 'يجب تسجيل الدخول أولاً' },
          },
        },
        ForbiddenResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 403 },
            message: { type: 'string', example: 'ليس لديك صلاحية للقيام بهذا الإجراء' },
          },
        },
        NotFoundResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 404 },
            message: { type: 'string', example: 'الحادثة غير موجودة' },
          },
        },
        ServerErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 500 },
            message: { type: 'string', example: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/pm/**/*.ts',
    './src/presentation/routes/v2/*.ts',
    './src/presentation/routes/*.ts',
    './src/api/v2/**/*.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ServiceDesk API Documentation',
  }));

  // Serve swagger spec as JSON
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;
