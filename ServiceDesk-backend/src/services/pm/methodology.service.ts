import mongoose from 'mongoose';
import MethodologyConfig, {
  IMethodologyConfig,
  IScrumConfig,
  IKanbanConfig,
  IWaterfallConfig,
  IItilConfig,
  ILeanConfig,
  IOkrConfig,
  defaultScrumConfig,
  defaultKanbanConfig,
  defaultWaterfallConfig,
  defaultItilConfig,
  defaultLeanConfig,
  defaultOkrConfig,
} from '../../models/pm/MethodologyConfig';
import { PMProject, MethodologyCode } from '../../models/pm';

type MethodologyType = 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';

export class MethodologyService {
  /**
   * Initialize methodology config for a new project
   */
  async initializeMethodology(
    projectId: string,
    methodologyCode: MethodologyType
  ): Promise<IMethodologyConfig> {
    const defaultConfig = this.getDefaultConfig(methodologyCode);
    
    const config = new MethodologyConfig({
      projectId: new mongoose.Types.ObjectId(projectId),
      methodologyCode,
      [methodologyCode]: defaultConfig,
    });

    await config.save();
    return config;
  }

  /**
   * Get methodology config for a project
   */
  async getMethodologyConfig(projectId: string): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOne({ projectId: new mongoose.Types.ObjectId(projectId) });
  }

  /**
   * Update methodology config
   */
  async updateMethodologyConfig(
    projectId: string,
    updates: Partial<IScrumConfig | IKanbanConfig | IWaterfallConfig | IItilConfig | ILeanConfig | IOkrConfig>
  ): Promise<IMethodologyConfig | null> {
    const config = await this.getMethodologyConfig(projectId);
    if (!config) return null;

    const methodologyCode = config.methodologyCode;
    const currentConfig = config[methodologyCode] || {};
    
    const updatedConfig = {
      ...currentConfig,
      ...updates,
    };

    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId) },
      { [methodologyCode]: updatedConfig },
      { new: true }
    );
  }

  /**
   * Change project methodology
   */
  async changeMethodology(
    projectId: string,
    newMethodologyCode: MethodologyType,
    preserveData: boolean = true
  ): Promise<IMethodologyConfig | null> {
    const project = await PMProject.findById(projectId);
    if (!project) return null;

    const existingConfig = await this.getMethodologyConfig(projectId);
    const defaultConfig = this.getDefaultConfig(newMethodologyCode);

    // Update project methodology
    await PMProject.findByIdAndUpdate(projectId, {
      'methodology.code': newMethodologyCode,
    });

    if (existingConfig) {
      // Clear old methodology config and set new one
      const updateData: Record<string, unknown> = {
        methodologyCode: newMethodologyCode,
        [newMethodologyCode]: defaultConfig,
      };

      // Clear other methodology configs
      const methodologies: MethodologyType[] = ['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr'];
      methodologies.forEach((m) => {
        if (m !== newMethodologyCode) {
          updateData[m] = undefined;
        }
      });

      return MethodologyConfig.findOneAndUpdate(
        { projectId: new mongoose.Types.ObjectId(projectId) },
        updateData,
        { new: true }
      );
    } else {
      return this.initializeMethodology(projectId, newMethodologyCode);
    }
  }

  /**
   * Get default config for a methodology
   */
  private getDefaultConfig(methodologyCode: MethodologyType): Record<string, unknown> {
    switch (methodologyCode) {
      case 'scrum':
        return defaultScrumConfig as Record<string, unknown>;
      case 'kanban':
        return defaultKanbanConfig as Record<string, unknown>;
      case 'waterfall':
        return defaultWaterfallConfig as Record<string, unknown>;
      case 'itil':
        return defaultItilConfig as Record<string, unknown>;
      case 'lean':
        return defaultLeanConfig as Record<string, unknown>;
      case 'okr':
        return defaultOkrConfig as Record<string, unknown>;
      default:
        return {};
    }
  }

  // ============================================
  // Scrum-specific methods
  // ============================================

  async updateScrumConfig(projectId: string, updates: Partial<IScrumConfig>): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'scrum' },
      { $set: { scrum: { ...updates } } },
      { new: true }
    );
  }

  async addDefinitionOfDone(projectId: string, item: string): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'scrum' },
      { $push: { 'scrum.definitionOfDone': item } },
      { new: true }
    );
  }

  async updateVelocity(projectId: string, velocity: number): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'scrum' },
      { $push: { 'scrum.velocityHistory': velocity } },
      { new: true }
    );
  }

  // ============================================
  // Kanban-specific methods
  // ============================================

  async updateKanbanColumns(projectId: string, columns: IKanbanConfig['columns']): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'kanban' },
      { 'kanban.columns': columns },
      { new: true }
    );
  }

  async updateWipLimits(projectId: string, wipLimits: IKanbanConfig['wipLimits']): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'kanban' },
      { 'kanban.wipLimits': wipLimits },
      { new: true }
    );
  }

  // ============================================
  // Waterfall-specific methods
  // ============================================

  async updatePhases(projectId: string, phases: IWaterfallConfig['phases']): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'waterfall' },
      { 'waterfall.phases': phases },
      { new: true }
    );
  }

  async addMilestone(projectId: string, milestone: IWaterfallConfig['milestones'][0]): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'waterfall' },
      { $push: { 'waterfall.milestones': milestone } },
      { new: true }
    );
  }

  async addGateReview(projectId: string, gate: IWaterfallConfig['gates'][0]): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'waterfall' },
      { $push: { 'waterfall.gates': gate } },
      { new: true }
    );
  }

  // ============================================
  // ITIL-specific methods
  // ============================================

  async updateServiceCatalog(projectId: string, services: IItilConfig['serviceCatalog']): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'itil' },
      { 'itil.serviceCatalog': services },
      { new: true }
    );
  }

  async updateSlaDefinitions(projectId: string, slas: IItilConfig['slaDefinitions']): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'itil' },
      { 'itil.slaDefinitions': slas },
      { new: true }
    );
  }

  async updateCabSettings(projectId: string, cab: IItilConfig['cab']): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'itil' },
      { 'itil.cab': cab },
      { new: true }
    );
  }

  // ============================================
  // Lean-specific methods
  // ============================================

  async updateValueStream(projectId: string, valueStream: ILeanConfig['valueStream']): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'lean' },
      { 'lean.valueStream': valueStream },
      { new: true }
    );
  }

  async addKaizenEvent(projectId: string, event: ILeanConfig['kaizenEvents'][0]): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'lean' },
      { $push: { 'lean.kaizenEvents': event } },
      { new: true }
    );
  }

  // ============================================
  // OKR-specific methods
  // ============================================

  async addObjective(projectId: string, objective: IOkrConfig['objectives'][0]): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'okr' },
      { $push: { 'okr.objectives': objective } },
      { new: true }
    );
  }

  async updateObjective(
    projectId: string,
    objectiveId: string,
    updates: Partial<IOkrConfig['objectives'][0]>
  ): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { 
        projectId: new mongoose.Types.ObjectId(projectId), 
        methodologyCode: 'okr',
        'okr.objectives.id': objectiveId 
      },
      { $set: { 'okr.objectives.$': { ...updates, id: objectiveId } } },
      { new: true }
    );
  }

  async addOkrCycle(projectId: string, cycle: IOkrConfig['cycles'][0]): Promise<IMethodologyConfig | null> {
    return MethodologyConfig.findOneAndUpdate(
      { projectId: new mongoose.Types.ObjectId(projectId), methodologyCode: 'okr' },
      { $push: { 'okr.cycles': cycle } },
      { new: true }
    );
  }

  // ============================================
  // Navigation helpers
  // ============================================

  /**
   * Get available navigation tabs based on methodology
   */
  getNavigationTabs(methodologyCode: MethodologyType): Array<{ id: string; label: string; href: string }> {
    const baseTabs = [
      { id: 'summary', label: 'Summary', href: '/summary' },
    ];

    switch (methodologyCode) {
      case 'scrum':
        return [
          ...baseTabs,
          { id: 'board', label: 'Board', href: '/board' },
          { id: 'backlog', label: 'Backlog', href: '/backlog' },
          { id: 'sprints', label: 'Sprints', href: '/sprints' },
          { id: 'roadmap', label: 'Roadmap', href: '/roadmap' },
          { id: 'calendar', label: 'Calendar', href: '/calendar' },
          { id: 'analytics', label: 'Analytics', href: '/analytics' },
        ];
      case 'kanban':
        return [
          ...baseTabs,
          { id: 'board', label: 'Board', href: '/board' },
          { id: 'backlog', label: 'Backlog', href: '/backlog' },
          { id: 'calendar', label: 'Calendar', href: '/calendar' },
          { id: 'analytics', label: 'Analytics', href: '/analytics' },
        ];
      case 'waterfall':
        return [
          ...baseTabs,
          { id: 'phases', label: 'Phases', href: '/phases' },
          { id: 'milestones', label: 'Milestones', href: '/milestones' },
          { id: 'gates', label: 'Gate Reviews', href: '/gates' },
          { id: 'gantt', label: 'Gantt', href: '/gantt' },
          { id: 'analytics', label: 'Analytics', href: '/analytics' },
        ];
      case 'itil':
        return [
          ...baseTabs,
          { id: 'service-catalog', label: 'Service Catalog', href: '/service-catalog' },
          { id: 'incidents', label: 'Incidents', href: '/incidents' },
          { id: 'problems', label: 'Problems', href: '/problems' },
          { id: 'changes', label: 'Changes', href: '/changes' },
          { id: 'releases', label: 'Releases', href: '/releases' },
          { id: 'sla', label: 'SLA Dashboard', href: '/sla' },
        ];
      case 'lean':
        return [
          ...baseTabs,
          { id: 'value-stream', label: 'Value Stream', href: '/value-stream' },
          { id: 'board', label: 'Board', href: '/board' },
          { id: 'improvements', label: 'Improvements', href: '/improvements' },
          { id: 'analytics', label: 'Analytics', href: '/analytics' },
        ];
      case 'okr':
        return [
          ...baseTabs,
          { id: 'objectives', label: 'Objectives', href: '/objectives' },
          { id: 'key-results', label: 'Key Results', href: '/key-results' },
          { id: 'check-ins', label: 'Check-ins', href: '/check-ins' },
          { id: 'analytics', label: 'Progress', href: '/analytics' },
        ];
      default:
        return baseTabs;
    }
  }

  /**
   * Get default landing page for methodology
   */
  getDefaultLandingPage(methodologyCode: MethodologyType): string {
    switch (methodologyCode) {
      case 'scrum':
      case 'kanban':
      case 'lean':
        return '/board';
      case 'waterfall':
        return '/phases';
      case 'itil':
        return '/service-catalog';
      case 'okr':
        return '/objectives';
      default:
        return '/summary';
    }
  }
}

export const methodologyService = new MethodologyService();
