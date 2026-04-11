import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Service Request Status
 */
export enum ServiceRequestStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FULFILLING = 'fulfilling',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

/**
 * Approval Decision
 */
export enum ApprovalDecision {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
}

/**
 * Fulfillment Task Status
 */
export enum FulfillmentTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Request Priority
 */
export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Service Request Interface
 */
export interface IServiceRequest extends Document {
  requestId: string;
  
  // Service Reference
  serviceId: string;
  serviceName: string;
  serviceNameAr?: string;
  serviceCategory: string;
  
  // Requester Information
  requester: {
    userId: string;
    name: string;
    email: string;
    department: string;
    phone?: string;
  };
  
  // On Behalf Of (if requesting for someone else)
  onBehalfOf?: {
    userId: string;
    name: string;
    email: string;
    department: string;
  };
  
  // Dynamic Form Data
  formData: Record<string, unknown>;
  formDataDisplay?: {
    fieldId: string;
    label: string;
    value: string;
    displayValue: string;
  }[];
  
  // Workflow
  workflowInstanceId?: string;
  currentState: string;
  stateHistory: {
    state: string;
    enteredAt: Date;
    exitedAt?: Date;
    duration?: number; // in minutes
    actorId?: string;
    actorName?: string;
    action?: string;
    comment?: string;
  }[];
  
  // Assignment
  assignedTo?: {
    userId: string;
    name: string;
    assignedAt: Date;
    assignedBy: string;
  };
  assignedTeam?: string;
  teamId?: mongoose.Types.ObjectId;
  
  // Approval Workflow
  approvalStage?: string;
  approvals: {
    stageId: string;
    stageName: string;
    approverId: string;
    approverName: string;
    approverRole?: string;
    decision: ApprovalDecision;
    comment?: string;
    timestamp?: Date;
    dueDate?: Date;
    escalated?: boolean;
    escalatedTo?: string;
  }[];
  
  // Fulfillment
  fulfillmentTasks: {
    taskId: string;
    name: string;
    description?: string;
    status: FulfillmentTaskStatus;
    assignedTo?: string;
    assignedToName?: string;
    startedAt?: Date;
    completedAt?: Date;
    result?: string;
    errorMessage?: string;
    automated: boolean;
    order: number;
  }[];
  fulfillmentStartedAt?: Date;
  fulfillmentCompletedAt?: Date;
  
  // SLA Tracking
  sla: {
    priority: RequestPriority;
    targetResponseTime: number; // in hours
    targetResolutionTime: number; // in hours
    targetResponseDate: Date;
    targetResolutionDate: Date;
    actualResponseTime?: number; // in minutes
    actualResolutionTime?: number; // in minutes
    responseBreached: boolean;
    resolutionBreached: boolean;
    breachReason?: string;
    pausedDuration: number; // in minutes (time on hold)
    onHoldSince?: Date;
  };
  
  // Related Records
  relatedIncidents?: string[];
  relatedChanges?: string[];
  relatedProblems?: string[];
  relatedAssets?: string[];
  linkedKnowledgeArticles?: string[];
  
  // Communication
  comments: {
    commentId: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    message: string;
    isInternal: boolean;
    attachments?: string[];
    createdAt: Date;
  }[];
  
  // Notifications
  notificationsSent: {
    type: string;
    recipientId: string;
    sentAt: Date;
    channel: 'email' | 'sms' | 'push' | 'in_app';
  }[];
  
  // Satisfaction
  satisfaction?: {
    rating: number; // 1-5
    comment?: string;
    submittedAt: Date;
    submittedBy: string;
  };
  
  // Status
  status: ServiceRequestStatus;
  statusReason?: string;
  
  // Timestamps
  submittedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  
  // Metadata
  source: 'web' | 'mobile' | 'email' | 'phone' | 'chat' | 'api';
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
}

// Schema
const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    requestId: {
      type: String,
      unique: true,
      index: true,
    },
    
    serviceId: {
      type: String,
      required: true,
      index: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    serviceNameAr: String,
    serviceCategory: String,
    
    requester: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      department: { type: String, default: '' },
      phone: String,
    },
    
    onBehalfOf: {
      userId: String,
      name: String,
      email: String,
      department: String,
    },
    
    formData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    formDataDisplay: [
      {
        fieldId: String,
        label: String,
        value: String,
        displayValue: String,
      },
    ],
    
    workflowInstanceId: String,
    currentState: {
      type: String,
      default: 'submitted',
      index: true,
    },
    stateHistory: [
      {
        state: String,
        enteredAt: Date,
        exitedAt: Date,
        duration: Number,
        actorId: String,
        actorName: String,
        action: String,
        comment: String,
      },
    ],
    
    assignedTo: {
      userId: String,
      name: String,
      assignedAt: Date,
      assignedBy: String,
    },
    assignedTeam: String,
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
    },
    
    approvalStage: String,
    approvals: [
      {
        stageId: String,
        stageName: String,
        approverId: String,
        approverName: String,
        approverRole: String,
        decision: {
          type: String,
          enum: Object.values(ApprovalDecision),
          default: ApprovalDecision.PENDING,
        },
        comment: String,
        timestamp: Date,
        dueDate: Date,
        escalated: Boolean,
        escalatedTo: String,
      },
    ],
    
    fulfillmentTasks: [
      {
        taskId: String,
        name: String,
        description: String,
        status: {
          type: String,
          enum: Object.values(FulfillmentTaskStatus),
          default: FulfillmentTaskStatus.PENDING,
        },
        assignedTo: String,
        assignedToName: String,
        startedAt: Date,
        completedAt: Date,
        result: String,
        errorMessage: String,
        automated: Boolean,
        order: Number,
      },
    ],
    fulfillmentStartedAt: Date,
    fulfillmentCompletedAt: Date,
    
    sla: {
      priority: {
        type: String,
        enum: Object.values(RequestPriority),
        default: RequestPriority.MEDIUM,
      },
      targetResponseTime: Number,
      targetResolutionTime: Number,
      targetResponseDate: Date,
      targetResolutionDate: Date,
      actualResponseTime: Number,
      actualResolutionTime: Number,
      responseBreached: { type: Boolean, default: false },
      resolutionBreached: { type: Boolean, default: false },
      breachReason: String,
      pausedDuration: { type: Number, default: 0 },
      onHoldSince: Date,
    },
    
    relatedIncidents: [{ type: String }],
    relatedChanges: [{ type: String }],
    relatedProblems: [{ type: String }],
    relatedAssets: [{ type: String }],
    linkedKnowledgeArticles: [{ type: String }],
    
    comments: [
      {
        commentId: String,
        authorId: String,
        authorName: String,
        authorRole: String,
        message: String,
        isInternal: Boolean,
        attachments: [{ type: String }],
        createdAt: Date,
      },
    ],
    
    notificationsSent: [
      {
        type: String,
        recipientId: String,
        sentAt: Date,
        channel: {
          type: String,
          enum: ['email', 'sms', 'push', 'in_app'],
        },
      },
    ],
    
    satisfaction: {
      rating: Number,
      comment: String,
      submittedAt: Date,
      submittedBy: String,
    },
    
    status: {
      type: String,
      enum: Object.values(ServiceRequestStatus),
      default: ServiceRequestStatus.SUBMITTED,
      index: true,
    },
    statusReason: String,
    
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: String,
    cancellationReason: String,
    
    source: {
      type: String,
      enum: ['web', 'mobile', 'email', 'phone', 'chat', 'api'],
      default: 'web',
    },
    ipAddress: String,
    userAgent: String,
    organizationId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
ServiceRequestSchema.index({ requester_userId: 1, submittedAt: -1 });
ServiceRequestSchema.index({ serviceId: 1, status: 1 });
ServiceRequestSchema.index({ workflowInstanceId: 1 });
ServiceRequestSchema.index({ assignedTo_userId: 1, status: 1 });
ServiceRequestSchema.index({ 'sla.targetResolutionDate': 1, status: 1 });
ServiceRequestSchema.index({ status: 1, serviceCategory: 1 });

// Pre-save hook to generate requestId
ServiceRequestSchema.pre('save', async function (next) {
  if (!this.requestId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('ServiceRequest').countDocuments({
      submittedAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      },
    });
    this.requestId = `SR-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Method to calculate SLA targets
ServiceRequestSchema.methods.calculateSLA = function (priority: RequestPriority) {
  const now = new Date();
  const slaHours = {
    low: { response: 24, resolution: 72 },
    medium: { response: 8, resolution: 24 },
    high: { response: 2, resolution: 8 },
    critical: { response: 1, resolution: 4 },
  };

  const hours = slaHours[priority] || slaHours.medium;
  
  this.sla = {
    ...this.sla,
    priority,
    targetResponseTime: hours.response,
    targetResolutionTime: hours.resolution,
    targetResponseDate: new Date(now.getTime() + hours.response * 60 * 60 * 1000),
    targetResolutionDate: new Date(now.getTime() + hours.resolution * 60 * 60 * 1000),
    responseBreached: false,
    resolutionBreached: false,
    pausedDuration: 0,
  };
};

// Method to check SLA breach
ServiceRequestSchema.methods.checkSLABreach = function () {
  const now = new Date();
  
  if (!this.sla.responseBreached && now > this.sla.targetResponseDate) {
    this.sla.responseBreached = true;
    return 'response';
  }
  
  if (!this.sla.resolutionBreached && now > this.sla.targetResolutionDate) {
    this.sla.resolutionBreached = true;
    return 'resolution';
  }
  
  return null;
};

// Remove any previously-registered model (e.g. legacy core/entities/ServiceRequest)
// so this module's schema takes precedence.
if (mongoose.models.ServiceRequest) {
  delete mongoose.models.ServiceRequest;
}

export const ServiceRequest = mongoose.model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
export default ServiceRequest;
