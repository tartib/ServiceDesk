import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export type ItsmRole = 'end_user' | 'technician' | 'team_lead' | 'manager' | 'cab_member' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  itsmRole: ItsmRole;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    title?: string;
  };
  phone?: string;
  department?: string;
  teamIds: mongoose.Types.ObjectId[];
  isActive: boolean;
  fcmToken?: string;
  organizations: {
    organizationId: mongoose.Types.ObjectId;
    role: string;
    joinedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PREP,
      required: true,
    },
    profile: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      avatar: { type: String },
      bio: { type: String },
      title: { type: String },
    },
    phone: {
      type: String,
      trim: true,
    },
    itsmRole: {
      type: String,
      enum: ['end_user', 'technician', 'team_lead', 'manager', 'cab_member', 'admin'],
      default: 'end_user',
    },
    department: {
      type: String,
      trim: true,
    },
    teamIds: [{
      type: Schema.Types.ObjectId,
      ref: 'PMTeam',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    fcmToken: {
      type: String,
    },
    organizations: [
      {
        organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization' },
        role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model<IUser>('User', userSchema);

export default User;
