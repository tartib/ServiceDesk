import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  manager?: Types.ObjectId;
  hireDate: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    hireDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default model<IEmployee>('Employee', employeeSchema);
