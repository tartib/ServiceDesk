import mongoose, { Document, Schema } from 'mongoose';

/**
 * Knowledge Article Status
 */
export enum ArticleStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * Article Visibility
 */
export enum ArticleVisibility {
  PUBLIC = 'public',        // للجميع
  INTERNAL = 'internal',    // للموظفين فقط
  TECHNICIANS = 'technicians', // للفنيين فقط
}

/**
 * Knowledge Article Interface
 */
export interface IKnowledgeArticle extends Document {
  article_id: string;
  title: string;
  title_ar: string;
  slug: string;
  content: string;
  content_ar: string;
  summary?: string;
  summary_ar?: string;
  category_id: string;
  subcategory_id?: string;
  tags: string[];
  status: ArticleStatus;
  visibility: ArticleVisibility;
  author: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    reviewed_at: Date;
    comments?: string;
  };
  linked_incidents?: string[];
  linked_problems?: string[];
  attachments: Array<{
    file_id: string;
    name: string;
    url: string;
    size: number;
    mime_type: string;
  }>;
  metrics: {
    views: number;
    helpful_count: number;
    not_helpful_count: number;
    avg_rating: number;
    rating_count: number;
  };
  version: number;
  is_featured: boolean;
  expires_at?: Date;
  site_id?: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

const AuthorSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
}, { _id: false });

const ReviewerSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  reviewed_at: { type: Date, required: true },
  comments: { type: String },
}, { _id: false });

const AttachmentSchema = new Schema({
  file_id: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  mime_type: { type: String, required: true },
}, { _id: false });

const MetricsSchema = new Schema({
  views: { type: Number, default: 0 },
  helpful_count: { type: Number, default: 0 },
  not_helpful_count: { type: Number, default: 0 },
  avg_rating: { type: Number, default: 0 },
  rating_count: { type: Number, default: 0 },
}, { _id: false });

const KnowledgeArticleSchema = new Schema<IKnowledgeArticle>(
  {
    article_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 500,
    },
    title_ar: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    content_ar: {
      type: String,
    },
    summary: {
      type: String,
      maxlength: 1000,
    },
    summary_ar: {
      type: String,
      maxlength: 1000,
    },
    category_id: {
      type: String,
      required: [true, 'Category is required'],
    },
    subcategory_id: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(ArticleStatus),
      default: ArticleStatus.DRAFT,
    },
    visibility: {
      type: String,
      enum: Object.values(ArticleVisibility),
      default: ArticleVisibility.INTERNAL,
    },
    author: {
      type: AuthorSchema,
      required: true,
    },
    reviewer: {
      type: ReviewerSchema,
    },
    linked_incidents: {
      type: [String],
      default: [],
    },
    linked_problems: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    metrics: {
      type: MetricsSchema,
      default: () => ({
        views: 0,
        helpful_count: 0,
        not_helpful_count: 0,
        avg_rating: 0,
        rating_count: 0,
      }),
    },
    version: {
      type: Number,
      default: 1,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    expires_at: {
      type: Date,
    },
    site_id: {
      type: String,
    },
    published_at: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate article_id before saving
KnowledgeArticleSchema.pre('save', async function (next) {
  if (!this.article_id) {
    const count = await mongoose.model('KnowledgeArticle').countDocuments();
    const year = new Date().getFullYear();
    this.article_id = `KB-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  
  // Generate slug from title
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }
  
  // Set published_at when status changes to published
  if (this.isModified('status') && this.status === ArticleStatus.PUBLISHED && !this.published_at) {
    this.published_at = new Date();
  }
  
  next();
});

// Text index for search
KnowledgeArticleSchema.index({
  title: 'text',
  title_ar: 'text',
  content: 'text',
  content_ar: 'text',
  summary: 'text',
  summary_ar: 'text',
  tags: 'text',
}, {
  weights: {
    title: 10,
    title_ar: 10,
    tags: 5,
    summary: 3,
    summary_ar: 3,
    content: 1,
    content_ar: 1,
  },
  name: 'article_text_search',
});

// Other indexes
KnowledgeArticleSchema.index({ status: 1 });
KnowledgeArticleSchema.index({ category_id: 1 });
KnowledgeArticleSchema.index({ visibility: 1 });
KnowledgeArticleSchema.index({ tags: 1 });
KnowledgeArticleSchema.index({ 'author.id': 1 });
KnowledgeArticleSchema.index({ created_at: -1 });
KnowledgeArticleSchema.index({ 'metrics.views': -1 });

const KnowledgeArticle = mongoose.model<IKnowledgeArticle>('KnowledgeArticle', KnowledgeArticleSchema);

export default KnowledgeArticle;
