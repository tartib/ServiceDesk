/**
 * Parallel Step Manager - مدير الخطوات المتوازية
 * Workflow Engine
 *
 * مسؤول عن:
 * - Fork: تقسيم المسار إلى فروع متوازية
 * - Join: انتظار اكتمال الفروع (all/any/count)
 * - تتبع حالة كل فرع
 */

import {
  WFStateType,
  WFJoinStrategy,
  type IWFInstance,
  type IWFDefinition,
  type IWFStateDefinition,
  type IWFParallelBranch,
} from '../../../core/types/workflow-engine.types';

export interface IForkResult {
  success: boolean;
  branches: IWFParallelBranch[];
  error?: string;
}

export interface IJoinResult {
  success: boolean;
  allCompleted: boolean;
  completedCount: number;
  totalCount: number;
  error?: string;
}

export class ParallelStepManager {
  /**
   * تنفيذ Fork — إنشاء فروع متوازية
   */
  fork(
    instance: IWFInstance,
    definition: IWFDefinition,
    forkState: IWFStateDefinition
  ): IForkResult {
    if (forkState.type !== WFStateType.FORK) {
      return {
        success: false,
        branches: [],
        error: `State "${forkState.code}" is not a FORK state`,
      };
    }

    const branchStateCodes = forkState.parallelBranches || [];
    if (branchStateCodes.length === 0) {
      return {
        success: false,
        branches: [],
        error: `FORK state "${forkState.code}" has no parallel branches defined`,
      };
    }

    // التحقق من وجود الحالات المستهدفة
    for (const code of branchStateCodes) {
      const state = definition.states.find(s => s.code === code);
      if (!state) {
        return {
          success: false,
          branches: [],
          error: `Branch target state "${code}" not found in definition`,
        };
      }
    }

    // إنشاء الفروع
    const now = new Date();
    const branches: IWFParallelBranch[] = branchStateCodes.map((code, index) => ({
      branchId: `branch-${forkState.code}-${index}-${Date.now()}`,
      stateCode: code,
      enteredAt: now,
      isCompleted: false,
    }));

    // تحديث الـ instance
    instance.parallelBranches = branches;

    return {
      success: true,
      branches,
    };
  }

  /**
   * إكمال فرع متوازي
   */
  completeBranch(
    instance: IWFInstance,
    branchId: string
  ): { success: boolean; error?: string } {
    const branch = instance.parallelBranches.find(b => b.branchId === branchId);
    if (!branch) {
      return { success: false, error: `Branch "${branchId}" not found` };
    }

    if (branch.isCompleted) {
      return { success: false, error: `Branch "${branchId}" is already completed` };
    }

    branch.isCompleted = true;
    branch.completedAt = new Date();

    return { success: true };
  }

  /**
   * إكمال فرع بناءً على كود الحالة
   */
  completeBranchByState(
    instance: IWFInstance,
    stateCode: string
  ): { success: boolean; branchId?: string; error?: string } {
    const branch = instance.parallelBranches.find(
      b => b.stateCode === stateCode && !b.isCompleted
    );

    if (!branch) {
      return { success: false, error: `No active branch with state "${stateCode}" found` };
    }

    branch.isCompleted = true;
    branch.completedAt = new Date();

    return { success: true, branchId: branch.branchId };
  }

  /**
   * تحقق من شرط الانضمام (Join)
   */
  checkJoin(
    instance: IWFInstance,
    definition: IWFDefinition,
    joinState: IWFStateDefinition
  ): IJoinResult {
    if (joinState.type !== WFStateType.JOIN) {
      return {
        success: false,
        allCompleted: false,
        completedCount: 0,
        totalCount: 0,
        error: `State "${joinState.code}" is not a JOIN state`,
      };
    }

    const branches = instance.parallelBranches;
    const totalCount = branches.length;
    const completedCount = branches.filter(b => b.isCompleted).length;

    const strategy = joinState.joinStrategy || WFJoinStrategy.ALL;
    let allCompleted = false;

    switch (strategy) {
      case WFJoinStrategy.ALL:
        allCompleted = completedCount === totalCount;
        break;

      case WFJoinStrategy.ANY:
        allCompleted = completedCount >= 1;
        break;

      case WFJoinStrategy.COUNT:
        allCompleted = completedCount >= (joinState.joinCount || totalCount);
        break;

      default:
        allCompleted = completedCount === totalCount;
    }

    return {
      success: true,
      allCompleted,
      completedCount,
      totalCount,
    };
  }

  /**
   * تنظيف الفروع بعد الانضمام
   */
  clearBranches(instance: IWFInstance): void {
    instance.parallelBranches = [];
  }

  /**
   * الحصول على الفروع النشطة
   */
  getActiveBranches(instance: IWFInstance): IWFParallelBranch[] {
    return instance.parallelBranches.filter(b => !b.isCompleted);
  }

  /**
   * الحصول على الفروع المكتملة
   */
  getCompletedBranches(instance: IWFInstance): IWFParallelBranch[] {
    return instance.parallelBranches.filter(b => b.isCompleted);
  }

  /**
   * التحقق مما إذا كان الـ instance في وضع متوازي
   */
  isInParallelMode(instance: IWFInstance): boolean {
    return instance.parallelBranches.length > 0;
  }

  /**
   * البحث عن أقرب JOIN state في التعريف
   */
  findJoinState(
    definition: IWFDefinition,
    forkStateCode: string
  ): IWFStateDefinition | null {
    // البحث عن الـ transitions التي تخرج من الفروع المتوازية
    const forkState = definition.states.find(s => s.code === forkStateCode);
    if (!forkState || forkState.type !== WFStateType.FORK) return null;

    const branchStates = forkState.parallelBranches || [];

    // البحث عن الحالة التي تأتي إليها transitions من جميع الفروع
    const joinCandidates = definition.states.filter(s => s.type === WFStateType.JOIN);

    for (const join of joinCandidates) {
      // تحقق أن هناك transitions من الفروع إلى هذا الـ JOIN
      const transitionsToJoin = definition.transitions.filter(t => t.toState === join.code);
      const sourcesOfJoin = transitionsToJoin.map(t => t.fromState);

      // إذا كان الـ JOIN يستقبل من كل الفروع أو من حالات تلي الفروع
      const allBranchesReachJoin = branchStates.every(branch =>
        sourcesOfJoin.includes(branch) || this.canReachState(definition, branch, join.code)
      );

      if (allBranchesReachJoin) {
        return join;
      }
    }

    return null;
  }

  /**
   * تحقق أن حالة يمكن أن تصل إلى حالة أخرى (BFS)
   */
  private canReachState(
    definition: IWFDefinition,
    fromCode: string,
    toCode: string,
    visited: Set<string> = new Set()
  ): boolean {
    if (fromCode === toCode) return true;
    if (visited.has(fromCode)) return false;
    visited.add(fromCode);

    const outTransitions = definition.transitions.filter(t => t.fromState === fromCode);
    for (const t of outTransitions) {
      if (this.canReachState(definition, t.toState, toCode, visited)) {
        return true;
      }
    }

    return false;
  }
}

export const parallelStepManager = new ParallelStepManager();
export default ParallelStepManager;
