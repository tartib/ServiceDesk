/**
 * Shared Test Setup — DRY MongoMemoryServer lifecycle
 *
 * Usage in test files:
 *   import { setupTestDB } from '../helpers/testSetup';
 *   setupTestDB();
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

export interface SetupOptions {
  /** If true, collections are NOT cleared between tests. Default: false */
  dropAfterEach?: boolean;
}

export function setupTestDB(opts: SetupOptions = {}): void {
  const dropAfterEach = opts.dropAfterEach !== false; // default true

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  if (dropAfterEach) {
    afterEach(async () => {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    });
  }
}

/**
 * Manually clear all collections. Useful when dropAfterEach is false
 * and you want to clean up at specific points.
 */
export async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Get the current MongoMemoryServer URI (useful for debugging).
 */
export function getTestMongoUri(): string {
  return mongoServer?.getUri() ?? '';
}
