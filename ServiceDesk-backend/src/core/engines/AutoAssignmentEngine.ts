/**
 * Auto-Assignment Engine - محرك التعيين التلقائي
 * Smart Forms System
 * 
 * مسؤول عن:
 * - تحديد المعين المناسب بناءً على القواعد
 * - موازنة الأحمال
 * - التعيين بناءً على المهارات
 * - التعيين بناءً على الموقع
 */

import {
  IFormSubmission,
  IAssignmentRule,
  IAssignee,
  IEvaluationContext,
  ILoadBalancingConfig,
  AssignmentStrategy,
} from '../types/smart-forms.types';
import { ConditionalLogicEngine } from './ConditionalLogicEngine';

// ============================================
// INTERFACES
// ============================================

export interface IUserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  site_id?: string;
  skills?: string[];
  is_available: boolean;
  active_tasks_count: number;
  manager_id?: string;
}

export interface IAssignmentResult {
  success: boolean;
  assignee: IAssignee | null;
  rule_applied?: string;
  reason?: string;
}

export interface IUserService {
  getUserById(userId: string): Promise<IUserInfo | null>;
  getUsersByRole(role: string, siteId?: string): Promise<IUserInfo[]>;
  getUsersByDepartment(department: string, siteId?: string): Promise<IUserInfo[]>;
  getUsersBySkills(skills: string[], siteId?: string): Promise<IUserInfo[]>;
  getManagerOf(userId: string): Promise<IUserInfo | null>;
  getUsersInGroup(groupId: string): Promise<IUserInfo[]>;
  getActiveTasksCount(userId: string): Promise<number>;
}

// ============================================
// AUTO-ASSIGNMENT ENGINE
// ============================================

export class AutoAssignmentEngine {
  private conditionalLogicEngine: ConditionalLogicEngine;
  private userService?: IUserService;
  private roundRobinIndex: Map<string, number> = new Map();

  constructor(options?: {
    conditionalLogicEngine?: ConditionalLogicEngine;
    userService?: IUserService;
  }) {
    this.conditionalLogicEngine = options?.conditionalLogicEngine || new ConditionalLogicEngine();
    this.userService = options?.userService;
  }

  /**
   * تحديد المعين بناءً على القواعد
   */
  async assignSubmission(
    submission: IFormSubmission,
    rules: IAssignmentRule[]
  ): Promise<IAssignmentResult> {
    // ترتيب القواعد حسب الأولوية
    const sortedRules = [...rules]
      .filter(r => r.is_active)
      .sort((a, b) => a.priority - b.priority);

    // تقييم كل قاعدة
    for (const rule of sortedRules) {
      const context: IEvaluationContext = {
        formData: submission.data,
        user: submission.submitted_by,
        submission,
      };

      // التحقق من شروط القاعدة
      if (rule.conditions) {
        const conditionsMet = this.conditionalLogicEngine.evaluateConditionGroup(
          rule.conditions,
          context
        );
        if (!conditionsMet) continue;
      }

      // تنفيذ استراتيجية التعيين
      const assignee = await this.executeStrategy(rule, submission);
      if (assignee) {
        return {
          success: true,
          assignee,
          rule_applied: rule.rule_id,
        };
      }
    }

    return {
      success: false,
      assignee: null,
      reason: 'No matching assignment rule found',
    };
  }

  /**
   * تنفيذ استراتيجية التعيين
   */
  private async executeStrategy(
    rule: IAssignmentRule,
    submission: IFormSubmission
  ): Promise<IAssignee | null> {
    const siteId = submission.site_id || submission.submitted_by.site_id;

    switch (rule.strategy) {
      case AssignmentStrategy.DIRECT:
        return this.directAssignment(rule);

      case AssignmentStrategy.ROUND_ROBIN:
        return this.roundRobinAssignment(rule, siteId);

      case AssignmentStrategy.LEAST_LOADED:
        return this.leastLoadedAssignment(rule, siteId);

      case AssignmentStrategy.SKILL_BASED:
        return this.skillBasedAssignment(rule, submission, siteId);

      case AssignmentStrategy.LOCATION_BASED:
        return this.locationBasedAssignment(rule, submission);

      case AssignmentStrategy.RANDOM:
        return this.randomAssignment(rule, siteId);

      case AssignmentStrategy.MANAGER:
        return this.managerAssignment(submission);

      case AssignmentStrategy.CUSTOM:
        return this.customAssignment(rule, submission);

      default:
        return null;
    }
  }

  /**
   * التعيين المباشر
   */
  private async directAssignment(rule: IAssignmentRule): Promise<IAssignee | null> {
    if (!rule.target.user_id) return null;

    if (this.userService) {
      const user = await this.userService.getUserById(rule.target.user_id);
      if (user && user.is_available) {
        return this.createAssignee(user);
      }
    }

    // إذا لم يكن هناك خدمة مستخدمين، نعيد المعرف مباشرة
    return {
      user_id: rule.target.user_id,
      name: rule.target.user_id,
      assigned_at: new Date(),
    };
  }

  /**
   * التعيين بالتناوب (Round Robin)
   */
  private async roundRobinAssignment(
    rule: IAssignmentRule,
    siteId?: string
  ): Promise<IAssignee | null> {
    const candidates = await this.getCandidates(rule, siteId);
    if (candidates.length === 0) return null;

    // الحصول على المؤشر الحالي
    const key = `${rule.rule_id}-${siteId || 'global'}`;
    const index = this.roundRobinIndex.get(key) || 0;

    // البحث عن مرشح متاح
    for (let i = 0; i < candidates.length; i++) {
      const candidateIndex = (index + i) % candidates.length;
      const candidate = candidates[candidateIndex];

      if (this.isEligible(candidate, rule.load_balancing)) {
        // تحديث المؤشر
        this.roundRobinIndex.set(key, (candidateIndex + 1) % candidates.length);
        return this.createAssignee(candidate);
      }
    }

    return null;
  }

  /**
   * التعيين للأقل حملاً
   */
  private async leastLoadedAssignment(
    rule: IAssignmentRule,
    siteId?: string
  ): Promise<IAssignee | null> {
    const candidates = await this.getCandidates(rule, siteId);
    if (candidates.length === 0) return null;

    // تصفية المرشحين المؤهلين
    const eligible = candidates.filter(c => this.isEligible(c, rule.load_balancing));
    if (eligible.length === 0) return null;

    // ترتيب حسب عدد المهام النشطة
    eligible.sort((a, b) => a.active_tasks_count - b.active_tasks_count);

    return this.createAssignee(eligible[0]);
  }

  /**
   * التعيين بناءً على المهارات
   */
  private async skillBasedAssignment(
    rule: IAssignmentRule,
    submission: IFormSubmission,
    siteId?: string
  ): Promise<IAssignee | null> {
    if (!this.userService) return null;

    // تحديد المهارات المطلوبة
    const requiredSkills = rule.load_balancing?.required_skills || [];
    
    // إذا كانت المهارات محددة في بيانات النموذج
    const skillField = rule.target.skill_field;
    if (skillField && submission.data[skillField]) {
      const formSkills = submission.data[skillField];
      if (Array.isArray(formSkills)) {
        requiredSkills.push(...formSkills);
      } else {
        requiredSkills.push(String(formSkills));
      }
    }

    if (requiredSkills.length === 0) {
      return this.leastLoadedAssignment(rule, siteId);
    }

    // الحصول على المستخدمين بالمهارات المطلوبة
    const candidates = await this.userService.getUsersBySkills(requiredSkills, siteId);
    
    // تصفية المرشحين المؤهلين
    const eligible = candidates.filter(c => this.isEligible(c, rule.load_balancing));
    if (eligible.length === 0) return null;

    // ترتيب حسب عدد المهارات المطابقة ثم حسب الحمل
    eligible.sort((a, b) => {
      const aMatchCount = a.skills?.filter(s => requiredSkills.includes(s)).length || 0;
      const bMatchCount = b.skills?.filter(s => requiredSkills.includes(s)).length || 0;
      
      if (aMatchCount !== bMatchCount) {
        return bMatchCount - aMatchCount; // الأكثر مطابقة أولاً
      }
      return a.active_tasks_count - b.active_tasks_count; // الأقل حملاً
    });

    return this.createAssignee(eligible[0]);
  }

  /**
   * التعيين بناءً على الموقع
   */
  private async locationBasedAssignment(
    rule: IAssignmentRule,
    submission: IFormSubmission
  ): Promise<IAssignee | null> {
    const siteId = submission.site_id || submission.submitted_by.site_id;
    if (!siteId) {
      return this.leastLoadedAssignment(rule, undefined);
    }

    return this.leastLoadedAssignment(rule, siteId);
  }

  /**
   * التعيين العشوائي
   */
  private async randomAssignment(
    rule: IAssignmentRule,
    siteId?: string
  ): Promise<IAssignee | null> {
    const candidates = await this.getCandidates(rule, siteId);
    if (candidates.length === 0) return null;

    // تصفية المرشحين المؤهلين
    const eligible = candidates.filter(c => this.isEligible(c, rule.load_balancing));
    if (eligible.length === 0) return null;

    // اختيار عشوائي
    const randomIndex = Math.floor(Math.random() * eligible.length);
    return this.createAssignee(eligible[randomIndex]);
  }

  /**
   * التعيين للمدير
   */
  private async managerAssignment(
    submission: IFormSubmission
  ): Promise<IAssignee | null> {
    if (!this.userService) return null;

    const manager = await this.userService.getManagerOf(submission.submitted_by.user_id);
    if (manager && manager.is_available) {
      return this.createAssignee(manager);
    }

    return null;
  }

  /**
   * التعيين المخصص
   */
  private async customAssignment(
    rule: IAssignmentRule,
    submission: IFormSubmission
  ): Promise<IAssignee | null> {
    // التعيين من حقل في النموذج
    if (rule.target.dynamic_field) {
      const userId = submission.data[rule.target.dynamic_field] as string;
      if (userId && this.userService) {
        const user = await this.userService.getUserById(userId);
        if (user && user.is_available) {
          return this.createAssignee(user);
        }
      }
    }

    return null;
  }

  /**
   * الحصول على المرشحين
   */
  private async getCandidates(
    rule: IAssignmentRule,
    siteId?: string
  ): Promise<IUserInfo[]> {
    if (!this.userService) return [];

    let candidates: IUserInfo[] = [];

    if (rule.target.role) {
      candidates = await this.userService.getUsersByRole(rule.target.role, siteId);
    } else if (rule.target.group_id) {
      candidates = await this.userService.getUsersInGroup(rule.target.group_id);
    } else if (rule.target.department) {
      candidates = await this.userService.getUsersByDepartment(rule.target.department, siteId);
    }

    return candidates;
  }

  /**
   * التحقق من أهلية المرشح
   */
  private isEligible(
    user: IUserInfo,
    loadBalancing?: ILoadBalancingConfig
  ): boolean {
    // التحقق من التوفر
    if (!user.is_available) return false;

    if (!loadBalancing) return true;

    // التحقق من الحد الأقصى للمهام
    if (loadBalancing.max_tasks_per_user > 0) {
      if (user.active_tasks_count >= loadBalancing.max_tasks_per_user) {
        return false;
      }
    }

    return true;
  }

  /**
   * إنشاء كائن المعين
   */
  private createAssignee(user: IUserInfo): IAssignee {
    return {
      user_id: user.id,
      name: user.name,
      email: user.email,
      assigned_at: new Date(),
    };
  }

  /**
   * إعادة التعيين
   */
  async reassign(
    submission: IFormSubmission,
    rules: IAssignmentRule[],
    excludeUsers: string[] = []
  ): Promise<IAssignmentResult> {
    // تصفية القواعد لاستبعاد المستخدمين المحددين
    const modifiedRules = rules.map(rule => ({
      ...rule,
      target: {
        ...rule.target,
        exclude_users: [...(rule.target.exclude_users || []), ...excludeUsers],
      },
    }));

    return this.assignSubmission(submission, modifiedRules);
  }

  /**
   * التصعيد
   */
  async escalate(
    submission: IFormSubmission,
    currentAssignee: IAssignee
  ): Promise<IAssignmentResult> {
    if (!this.userService) {
      return {
        success: false,
        assignee: null,
        reason: 'User service not available',
      };
    }

    // الحصول على مدير المعين الحالي
    const manager = await this.userService.getManagerOf(currentAssignee.user_id);
    if (manager && manager.is_available) {
      return {
        success: true,
        assignee: this.createAssignee(manager),
        reason: 'Escalated to manager',
      };
    }

    return {
      success: false,
      assignee: null,
      reason: 'No manager available for escalation',
    };
  }

  /**
   * الحصول على إحصائيات التعيين
   */
  async getAssignmentStats(
    role?: string,
    siteId?: string
  ): Promise<{
    totalUsers: number;
    availableUsers: number;
    averageLoad: number;
    userLoads: { userId: string; name: string; taskCount: number }[];
  }> {
    if (!this.userService) {
      return {
        totalUsers: 0,
        availableUsers: 0,
        averageLoad: 0,
        userLoads: [],
      };
    }

    const users = role
      ? await this.userService.getUsersByRole(role, siteId)
      : [];

    const totalUsers = users.length;
    const availableUsers = users.filter(u => u.is_available).length;
    const totalTasks = users.reduce((sum, u) => sum + u.active_tasks_count, 0);
    const averageLoad = totalUsers > 0 ? totalTasks / totalUsers : 0;

    const userLoads = users.map(u => ({
      userId: u.id,
      name: u.name,
      taskCount: u.active_tasks_count,
    }));

    return {
      totalUsers,
      availableUsers,
      averageLoad,
      userLoads,
    };
  }

  /**
   * إعادة تعيين مؤشر Round Robin
   */
  resetRoundRobinIndex(ruleId: string, siteId?: string): void {
    const key = `${ruleId}-${siteId || 'global'}`;
    this.roundRobinIndex.delete(key);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const autoAssignmentEngine = new AutoAssignmentEngine();

export default AutoAssignmentEngine;
