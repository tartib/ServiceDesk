import mongoose, { Schema } from 'mongoose';

export interface IPokerVote {
  oderId: mongoose.Types.ObjectId;
  value: number | string;
  votedAt: Date;
  revealed: boolean;
}

export interface IPlanningPokerSession {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  sprintId?: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  status: 'voting' | 'revealed' | 'completed' | 'cancelled';
  estimationType: 'story_points' | 'hours' | 'days';
  votes: IPokerVote[];
  finalEstimate?: number;
  round: number;
  maxRounds: number;
  roundTimeLimit: number; // in seconds
  facilitator: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  consensusReached: boolean;
  discussionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PokerVoteSchema = new Schema<IPokerVote>(
  {
    oderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
    revealed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const PlanningPokerSessionSchema = new Schema<IPlanningPokerSession>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
      required: true,
    },
    sprintId: {
      type: Schema.Types.ObjectId,
      ref: 'PMSprint',
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'PMTask',
      required: true,
    },
    status: {
      type: String,
      enum: ['voting', 'revealed', 'completed', 'cancelled'],
      default: 'voting',
    },
    estimationType: {
      type: String,
      enum: ['story_points', 'hours', 'days'],
      default: 'story_points',
    },
    votes: [PokerVoteSchema],
    finalEstimate: {
      type: Number,
    },
    round: {
      type: Number,
      default: 1,
    },
    maxRounds: {
      type: Number,
      default: 3,
    },
    roundTimeLimit: {
      type: Number,
      default: 300, // 5 minutes in seconds
    },
    consensusReached: {
      type: Boolean,
      default: false,
    },
    discussionNotes: {
      type: String,
      maxlength: 2000,
    },
    facilitator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

PlanningPokerSessionSchema.index({ projectId: 1, taskId: 1 });
PlanningPokerSessionSchema.index({ sprintId: 1 });
PlanningPokerSessionSchema.index({ status: 1 });

const PlanningPokerSession = mongoose.model<IPlanningPokerSession>(
  'PlanningPokerSession',
  PlanningPokerSessionSchema
);

export default PlanningPokerSession;
