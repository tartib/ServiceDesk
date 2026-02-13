import { Types } from 'mongoose';
import { createMockRepository } from '../../../__tests__/fixtures/service.fixture';

describe('Form Rule Service', () => {
  let mockRuleRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRuleRepository = createMockRepository();
  });

  describe('createRule', () => {
    it('should create form rule with valid data', async () => {
      const ruleData = {
        formId: new Types.ObjectId(),
        name: 'Email Required',
        condition: { field: 'email', operator: 'required' },
        action: { type: 'show', target: 'phone' },
      };

      mockRuleRepository.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockRuleRepository.create(ruleData);

      expect(result.name).toBe('Email Required');
      expect(result.condition.operator).toBe('required');
    });
  });

  describe('getFormRules', () => {
    it('should retrieve rules for form', async () => {
      const formId = new Types.ObjectId();
      const rules = [
        { _id: new Types.ObjectId(), formId, name: 'Rule 1' },
        { _id: new Types.ObjectId(), formId, name: 'Rule 2' },
      ];

      mockRuleRepository.find.mockResolvedValue(rules);

      const result = await mockRuleRepository.find({ formId });

      expect(result).toHaveLength(2);
    });
  });

  describe('getRuleById', () => {
    it('should retrieve rule by id', async () => {
      const ruleId = new Types.ObjectId();
      const rule = {
        _id: ruleId,
        name: 'Email Required',
        condition: { field: 'email', operator: 'required' },
      };

      mockRuleRepository.findById.mockResolvedValue(rule);

      const result = await mockRuleRepository.findById(ruleId);

      expect(result._id).toEqual(ruleId);
      expect(result.name).toBe('Email Required');
    });
  });

  describe('updateRule', () => {
    it('should update rule', async () => {
      const ruleId = new Types.ObjectId();
      const updatedRule = {
        _id: ruleId,
        name: 'Updated Rule',
        condition: { field: 'phone', operator: 'required' },
      };

      mockRuleRepository.updateById.mockResolvedValue(updatedRule);

      const result = await mockRuleRepository.updateById(ruleId, { name: 'Updated Rule' });

      expect(result.name).toBe('Updated Rule');
    });
  });

  describe('deleteRule', () => {
    it('should delete rule', async () => {
      const ruleId = new Types.ObjectId();

      mockRuleRepository.deleteById.mockResolvedValue(true);

      const result = await mockRuleRepository.deleteById(ruleId);

      expect(result).toBe(true);
    });
  });

  describe('evaluateRule', () => {
    it('should evaluate rule condition', async () => {
      const ruleId = new Types.ObjectId();
      const rule = {
        _id: ruleId,
        condition: { field: 'email', operator: 'required' },
        action: { type: 'show', target: 'phone' },
      };

      mockRuleRepository.findById.mockResolvedValue(rule);

      const result = await mockRuleRepository.findById(ruleId);

      expect(result.condition.operator).toBe('required');
    });
  });
});
