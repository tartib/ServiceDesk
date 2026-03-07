/**
 * MongoDB Repository Implementation
 *
 * Default implementation of IRepository using Mongoose.
 * Modules use this today; can be swapped for a PostgreSQL implementation later.
 */

import { Model, Document } from 'mongoose';
import { IRepository, IQueryOptions, IQueryFilter, IPaginatedResult } from './IRepository';

export class MongoRepository<T extends Document> implements IRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string, options: Pick<IQueryOptions, 'populate' | 'select' | 'lean'> = {}): Promise<T | null> {
    let query = this.model.findById(id);
    if (options.select) query = query.select(options.select) as any;
    if (options.populate) {
      const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
      for (const p of pops) query = query.populate(p) as any;
    }
    if (options.lean !== false) query = query.lean() as any;
    return query.exec() as Promise<T | null>;
  }

  async findOne(filter: IQueryFilter, options: Pick<IQueryOptions, 'populate' | 'select' | 'lean'> = {}): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (options.select) query = query.select(options.select) as any;
    if (options.populate) {
      const pops = Array.isArray(options.populate) ? options.populate : [options.populate];
      for (const p of pops) query = query.populate(p) as any;
    }
    if (options.lean !== false) query = query.lean() as any;
    return query.exec() as Promise<T | null>;
  }

  async findMany(filter: IQueryFilter, options: IQueryOptions = {}): Promise<IPaginatedResult<T>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', populate, select } = options;
    const skip = (page - 1) * limit;

    let query = this.model.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    if (select) query = query.select(select) as any;
    if (populate) {
      const pops = Array.isArray(populate) ? populate : [populate];
      for (const p of pops) query = query.populate(p) as any;
    }
    if (options.lean !== false) query = query.lean() as any;

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      data: data as T[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAll(filter: IQueryFilter, options: Pick<IQueryOptions, 'sort' | 'order' | 'populate' | 'select' | 'lean'> = {}): Promise<T[]> {
    const { sort = 'createdAt', order = 'desc', populate, select } = options;

    let query = this.model.find(filter).sort({ [sort]: order === 'asc' ? 1 : -1 });
    if (select) query = query.select(select) as any;
    if (populate) {
      const pops = Array.isArray(populate) ? populate : [populate];
      for (const p of pops) query = query.populate(p) as any;
    }
    if (options.lean !== false) query = query.lean() as any;

    return query.exec() as Promise<T[]>;
  }

  async create(data: Partial<T>): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toObject() as T;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const docs = await this.model.insertMany(data);
    return docs.map((d) => (d as any).toObject ? (d as any).toObject() : d) as T[];
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true, lean: true }).exec() as Promise<T | null>;
  }

  async updateOne(filter: IQueryFilter, data: Partial<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, { $set: data }, { new: true, lean: true }).exec() as Promise<T | null>;
  }

  async updateMany(filter: IQueryFilter, data: Partial<T>): Promise<number> {
    const result = await this.model.updateMany(filter, { $set: data }).exec();
    return result.modifiedCount || 0;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async deleteMany(filter: IQueryFilter): Promise<number> {
    const result = await this.model.deleteMany(filter).exec();
    return result.deletedCount || 0;
  }

  async count(filter: IQueryFilter = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: IQueryFilter): Promise<boolean> {
    const doc = await this.model.findOne(filter).select('_id').lean().exec();
    return doc !== null;
  }
}
