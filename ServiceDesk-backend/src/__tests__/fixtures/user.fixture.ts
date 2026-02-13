import { Types } from 'mongoose';

export const createMockUser = (overrides = {}) => ({
  _id: new Types.ObjectId(),
  email: 'test@example.com',
  password: 'hashedPassword123',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAdmin = (overrides = {}) =>
  createMockUser({
    role: 'admin',
    email: 'admin@example.com',
    ...overrides,
  });

export const createMockRequest = (overrides = {}) => ({
  user: createMockUser(),
  headers: {},
  body: {},
  params: {},
  query: {},
  ...overrides,
});

export const createMockResponse = () => {
  const res = {} as Record<string, jest.Mock>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = () => jest.fn();
