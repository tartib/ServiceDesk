import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskSummary {
  totalTasks: number;
  completedTasks: number;
  lateTasks: number;
  inProgressTasks: number;
  stockIssueTasks: number;
}

export interface IEmployeePerformance {
  userId: mongoose.Types.ObjectId;
  userName: string;
  tasksCompleted: number;
  averageCompletionTime: number;
  onTimeCompletions: number;
  lateCompletions: number;
}

export interface IInventoryUsage {
  ingredientId: mongoose.Types.ObjectId;
  ingredientName: string;
  quantityUsed: number;
  unit: string;
}

export interface IDailyReport extends Document {
  date: Date;
  taskSummary: ITaskSummary;
  employeePerformance: IEmployeePerformance[];
  inventoryUsage: IInventoryUsage[];
  totalPrepared: number;
  totalUsed: number;
  totalWaste: number;
  wastePercentage: number;
  notes?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSummarySchema = new Schema<ITaskSummary>(
  {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    lateTasks: { type: Number, default: 0 },
    inProgressTasks: { type: Number, default: 0 },
    stockIssueTasks: { type: Number, default: 0 },
  },
  { _id: false }
);

const employeePerformanceSchema = new Schema<IEmployeePerformance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    averageCompletionTime: {
      type: Number,
      default: 0,
    },
    onTimeCompletions: {
      type: Number,
      default: 0,
    },
    lateCompletions: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const inventoryUsageSchema = new Schema<IInventoryUsage>(
  {
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    ingredientName: {
      type: String,
      required: true,
    },
    quantityUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const dailyReportSchema = new Schema<IDailyReport>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    taskSummary: {
      type: taskSummarySchema,
      required: true,
    },
    employeePerformance: {
      type: [employeePerformanceSchema],
      default: [],
    },
    inventoryUsage: {
      type: [inventoryUsageSchema],
      default: [],
    },
    totalPrepared: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWaste: {
      type: Number,
      default: 0,
      min: 0,
    },
    wastePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for date-based queries
dailyReportSchema.index({ date: -1 });

const DailyReport = mongoose.model<IDailyReport>('DailyReport', dailyReportSchema);

export default DailyReport;
