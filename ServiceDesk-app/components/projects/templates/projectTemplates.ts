/**
 * Project Templates — Static Definitions
 *
 * Pure data module. No React, no API calls.
 * Used by TemplateGallery (full-screen) and StepTemplate (wizard step).
 */

export type MethodologyType = 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Engineering' | 'Business' | 'Operations' | 'People' | 'IT' | 'Finance';
  iconName: string;
  color: string;
  accentClass: string;
  methodology: MethodologyType;
  defaultName: string;
  defaultDescription: string;
  features: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'devops',
    name: 'DevOps',
    description: 'Continuous delivery pipeline with CI/CD tracking, incidents, and infrastructure tasks.',
    category: 'Engineering',
    iconName: 'GitBranch',
    color: 'bg-success-soft text-success',
    accentClass: 'border-success/30 hover:border-success/60',
    methodology: 'kanban',
    defaultName: 'DevOps Pipeline',
    defaultDescription: 'Continuous delivery and infrastructure operations management.',
    features: ['CI/CD Tracking', 'Incident Management', 'Deployment Board', 'On-Call Rotation'],
  },
  {
    id: 'software-development',
    name: 'Software Development',
    description: 'Agile sprints, backlog grooming, and release tracking for engineering teams.',
    category: 'Engineering',
    iconName: 'Code2',
    color: 'bg-brand-soft text-brand',
    accentClass: 'border-brand-border hover:border-brand',
    methodology: 'scrum',
    defaultName: 'Software Development',
    defaultDescription: 'Sprint-based software development with backlog and release tracking.',
    features: ['Sprint Planning', 'Backlog', 'Bug Tracking', 'Code Reviews', 'Release Notes'],
  },
  {
    id: 'marketing',
    name: 'Marketing Campaign',
    description: 'Plan and track campaigns, content calendars, and creative assets across channels.',
    category: 'Business',
    iconName: 'Megaphone',
    color: 'bg-warning-soft text-warning',
    accentClass: 'border-warning/30 hover:border-warning/60',
    methodology: 'kanban',
    defaultName: 'Marketing Campaign',
    defaultDescription: 'Campaign planning, content creation, and launch tracking.',
    features: ['Content Calendar', 'Campaign Board', 'Asset Management', 'Launch Checklist'],
  },
  {
    id: 'design',
    name: 'Design Project',
    description: 'Track UX/UI design tasks from discovery through handoff with review stages.',
    category: 'Business',
    iconName: 'Palette',
    color: 'bg-info-soft text-info',
    accentClass: 'border-info/30 hover:border-info/60',
    methodology: 'kanban',
    defaultName: 'Design Project',
    defaultDescription: 'Design workflow from research and wireframes to final handoff.',
    features: ['Design Board', 'Review Stages', 'Asset Library', 'Feedback Tracking'],
  },
  {
    id: 'sales',
    name: 'Sales Pipeline',
    description: 'Manage deals, track prospects, and hit revenue targets with a visual pipeline.',
    category: 'Business',
    iconName: 'TrendingUp',
    color: 'bg-success-soft text-success',
    accentClass: 'border-success/30 hover:border-success/60',
    methodology: 'kanban',
    defaultName: 'Sales Pipeline',
    defaultDescription: 'Prospect tracking, deal management, and revenue forecasting.',
    features: ['Deal Stages', 'Revenue Tracking', 'Activity Log', 'Forecasting'],
  },
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Manage hiring pipelines, onboarding workflows, and HR initiatives.',
    category: 'People',
    iconName: 'Users',
    color: 'bg-destructive-soft text-destructive',
    accentClass: 'border-destructive/30 hover:border-destructive/60',
    methodology: 'waterfall',
    defaultName: 'HR Project',
    defaultDescription: 'Recruitment, onboarding, and HR program management.',
    features: ['Hiring Pipeline', 'Onboarding Checklist', 'Policy Reviews', 'Performance Cycles'],
  },
  {
    id: 'it-operations',
    name: 'IT Operations',
    description: 'IT service management with change advisory, incidents, and SLA tracking.',
    category: 'IT',
    iconName: 'Server',
    color: 'bg-warning-soft text-warning',
    accentClass: 'border-warning/30 hover:border-warning/60',
    methodology: 'itil',
    defaultName: 'IT Operations',
    defaultDescription: 'ITIL-based IT service management, changes, and SLA tracking.',
    features: ['Change Advisory Board', 'Incident Tracking', 'SLA Management', 'Release Calendar'],
  },
  {
    id: 'finance',
    name: 'Finance & Budgeting',
    description: 'Track budgets, financial milestones, audits, and reporting cycles.',
    category: 'Finance',
    iconName: 'DollarSign',
    color: 'bg-success-soft text-success',
    accentClass: 'border-success/30 hover:border-success/60',
    methodology: 'waterfall',
    defaultName: 'Finance Project',
    defaultDescription: 'Budget planning, financial reporting, and audit management.',
    features: ['Budget Tracking', 'Milestone Gates', 'Audit Checklist', 'Reporting Cycle'],
  },
];

export const TEMPLATE_CATEGORIES = [
  'All',
  'Engineering',
  'Business',
  'People',
  'IT',
  'Finance',
  'Operations',
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
