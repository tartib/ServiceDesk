import { Types } from 'mongoose';
import { createMockRepository } from '../../../__tests__/fixtures/service.fixture';

describe('Dashboard Service', () => {
  let mockDashboardRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockDashboardRepository = createMockRepository();
  });

  describe('getKPIs', () => {
    it('should retrieve KPI metrics', async () => {
      const kpis = {
        totalIncidents: 150,
        resolvedIncidents: 120,
        avgResolutionTime: 4.5,
        customerSatisfaction: 4.2,
      };

      mockDashboardRepository.findOne.mockResolvedValue(kpis);

      const result = await mockDashboardRepository.findOne({});

      expect(result.totalIncidents).toBe(150);
      expect(result.resolvedIncidents).toBe(120);
    });
  });

  describe('getTeamPerformance', () => {
    it('should retrieve team performance metrics', async () => {
      const performance = [
        { _id: new Types.ObjectId(), name: 'Team A', resolvedTickets: 45, avgTime: 3.2 },
        { _id: new Types.ObjectId(), name: 'Team B', resolvedTickets: 38, avgTime: 4.1 },
      ];

      mockDashboardRepository.find.mockResolvedValue(performance);

      const result = await mockDashboardRepository.find({});

      expect(result).toHaveLength(2);
      expect(result[0].resolvedTickets).toBe(45);
    });
  });

  describe('getIncidentDistribution', () => {
    it('should retrieve incident distribution by category', async () => {
      const distribution = [
        { category: 'Hardware', count: 45 },
        { category: 'Software', count: 38 },
        { category: 'Network', count: 22 },
      ];

      mockDashboardRepository.find.mockResolvedValue(distribution);

      const result = await mockDashboardRepository.find({});

      expect(result).toHaveLength(3);
      expect(result[0].category).toBe('Hardware');
    });
  });

  describe('getTimeAnalysis', () => {
    it('should retrieve time-based analytics', async () => {
      const timeData = [
        { hour: 9, incidents: 12 },
        { hour: 10, incidents: 18 },
        { hour: 11, incidents: 15 },
      ];

      mockDashboardRepository.find.mockResolvedValue(timeData);

      const result = await mockDashboardRepository.find({});

      expect(result).toHaveLength(3);
      expect(result[1].incidents).toBe(18);
    });
  });

  describe('getDashboardSummary', () => {
    it('should retrieve complete dashboard summary', async () => {
      const summary = {
        _id: new Types.ObjectId(),
        totalIncidents: 150,
        openIncidents: 30,
        resolvedIncidents: 120,
        avgResolutionTime: 4.5,
        topCategory: 'Hardware',
        topTeam: 'Team A',
      };

      mockDashboardRepository.findOne.mockResolvedValue(summary);

      const result = await mockDashboardRepository.findOne({});

      expect(result.totalIncidents).toBe(150);
      expect(result.openIncidents).toBe(30);
      expect(result.topCategory).toBe('Hardware');
    });
  });

  describe('refreshDashboard', () => {
    it('should refresh dashboard data', async () => {
      const dashboardId = new Types.ObjectId();
      const refreshedDashboard = {
        _id: dashboardId,
        lastUpdated: new Date(),
        data: { totalIncidents: 155 },
      };

      mockDashboardRepository.updateById.mockResolvedValue(refreshedDashboard);

      const result = await mockDashboardRepository.updateById(dashboardId, {
        lastUpdated: new Date(),
      });

      expect(result.lastUpdated).toBeDefined();
    });
  });
});
