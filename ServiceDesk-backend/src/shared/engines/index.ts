/**
 * Shared Engines — Cross-cutting Business Logic
 *
 * These engines are used across multiple modules (ITSM, Forms, etc.)
 * and are NOT owned by any single module.
 *
 * Physically located at src/core/engines/ (legacy path).
 * This barrel provides the canonical import path for new consumers.
 */

export { default as ApprovalEngine } from '../../core/engines/ApprovalEngine';
export { default as AutoAssignmentEngine } from '../../core/engines/AutoAssignmentEngine';
export { default as ConditionalLogicEngine } from '../../core/engines/ConditionalLogicEngine';
export { default as DynamicFieldsEngine } from '../../core/engines/DynamicFieldsEngine';
export { default as RulesEngine } from '../../core/engines/RulesEngine';
export { default as ValidationEngine } from '../../core/engines/ValidationEngine';
export { default as WorkflowEngine } from '../../core/engines/WorkflowEngine';
