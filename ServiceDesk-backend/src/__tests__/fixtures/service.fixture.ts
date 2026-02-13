export const createMockRepository = () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  deleteMany: jest.fn(),
  countDocuments: jest.fn(),
});

export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
});

export const createMockCacheManager = () => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  deletePattern: jest.fn(),
  clear: jest.fn(),
  exists: jest.fn(),
  getTTL: jest.fn(),
  setTTL: jest.fn(),
  increment: jest.fn(),
  getStats: jest.fn(),
  close: jest.fn(),
});

export const createMockJobQueue = () => ({
  enqueue: jest.fn(),
  dequeue: jest.fn(),
  getJobStatus: jest.fn(),
  retryJob: jest.fn(),
  cancelJob: jest.fn(),
  getStats: jest.fn(),
});

export const createMockEventBus = () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
});
