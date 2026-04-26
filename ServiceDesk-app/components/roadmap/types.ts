export interface Project {
 _id: string;
 name: string;
 key: string;
 methodology: {
 code: string;
 };
}

// Jira-compatible Task interface
export interface Task {
 _id: string;
 id?: string;
 key: string;
 title: string;
 summary?: string;
 type: string;
 itemTypeId?: number;
 parentId?: string | null;
 status: { id: string; name: string; category?: string; statusCategory?: { id: string } };
 priority: string;
 startDate?: string;
 startDateRFC3339?: string | null;
 dueDate?: string;
 dueDateRFC3339?: string | null;
 assignee?: { 
 _id?: string; 
 accountId?: string;
 name?: string;
 picture?: string;
 profile?: { firstName: string; lastName: string } 
 };
 description?: string;
 storyPoints?: number;
 labels?: string[];
 sprintIds?: string[];
 sprint?: string;
 color?: string;
 rank?: string;
 dependencies?: { id: string; type: string }[];
 resolved?: boolean;
}

// Roadmap configuration from API
export interface RoadmapConfig {
 sprints?: {
 id: string;
 name: string;
 state: string;
 startDateRFC3339: string;
 endDateRFC3339: string;
 }[];
 statusCategories?: {
 id: string;
 key: string;
 name: string;
 }[];
 parentItemTypes?: {
 id: string;
 name: string;
 iconUrl: string;
 }[];
 childItemTypes?: {
 id: string;
 name: string;
 iconUrl: string;
 }[];
}

export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

export interface TimelineColumn {
 label: string;
 sublabel?: string;
 isCurrent: boolean;
 date: Date;
 monthLabel?: string;
 isFirstOfMonth?: boolean;
}

export interface TimelineRange {
 startDate: Date;
 endDate: Date;
 totalDays: number;
 now: Date;
}

export interface TimelineSettings {
 showWeekends: boolean;
 colorBy: 'status' | 'priority' | 'type';
 showProgress: boolean;
 showLabels: boolean;
}

export interface TaskBarStyle {
 left: string;
 width: string;
 opacity?: number;
 hasMissingDates: boolean;
 showLeftArrow: boolean;
 showRightArrow: boolean;
}

export interface GroupedTasks {
 epics: Task[];
 others: Task[];
 childrenMap: Map<string, Task[]>;
 standaloneTasks: Task[];
}
