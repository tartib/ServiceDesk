/**
 * ITSM (Service Desk) DTOs
 */

// Task/Work Order DTOs
export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
  attachments?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
}

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  assignee?: string;
  reporter?: string;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskListDTO {
  items: TaskDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Incident DTOs
export interface CreateIncidentDTO {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  impact?: 'low' | 'medium' | 'high';
  urgency?: 'low' | 'medium' | 'high';
  affectedUsers?: number;
  category?: string;
  attachments?: string[];
}

export interface UpdateIncidentDTO {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: string;
  assignee?: string;
}

export interface IncidentDTO {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  assignee?: string;
  reporter: string;
  affectedUsers: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Problem DTOs
export interface CreateProblemDTO {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  relatedIncidents?: string[];
  rootCause?: string;
  workaround?: string;
}

export interface UpdateProblemDTO {
  title?: string;
  description?: string;
  status?: string;
  rootCause?: string;
  workaround?: string;
}

export interface ProblemDTO {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  relatedIncidents: string[];
  rootCause?: string;
  workaround?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Change DTOs
export interface CreateChangeDTO {
  title: string;
  description: string;
  type?: 'standard' | 'normal' | 'emergency';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  implementationDate?: Date;
  backoutPlan?: string;
  affectedServices?: string[];
}

export interface UpdateChangeDTO {
  title?: string;
  description?: string;
  status?: string;
  implementationDate?: Date;
}

export interface ChangeDTO {
  id: string;
  title: string;
  description: string;
  type: 'standard' | 'normal' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  implementationDate?: Date;
  backoutPlan?: string;
  affectedServices: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Service Request DTOs
export interface CreateServiceRequestDTO {
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high';
  attachments?: string[];
}

export interface UpdateServiceRequestDTO {
  title?: string;
  description?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ServiceRequestDTO {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  requester: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  fulfilledAt?: Date;
}

// Knowledge Base DTOs
export interface CreateKnowledgeArticleDTO {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  relatedArticles?: string[];
}

export interface UpdateKnowledgeArticleDTO {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export interface KnowledgeArticleDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  views: number;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// Asset DTOs
export interface CreateAssetDTO {
  name: string;
  type: string;
  serialNumber?: string;
  location?: string;
  owner?: string;
  status?: string;
}

export interface UpdateAssetDTO {
  name?: string;
  type?: string;
  location?: string;
  owner?: string;
  status?: string;
}

export interface AssetDTO {
  id: string;
  name: string;
  type: string;
  serialNumber?: string;
  location?: string;
  owner?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
