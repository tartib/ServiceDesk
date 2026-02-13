# 📋 Project Board Development Plan

## Overview
This document outlines the implementation plan for the Project Board Management feature based on user stories organized into 7 epics.

**Status**: In Development  
**Last Updated**: December 13, 2024  
**Current Implementation**: Basic board with columns, task cards, and detail panel

---

## 🎯 Epic 1: Board Viewing & Navigation

### ✅ User Story 1: عرض لوحة المشروع (Display Project Board)
**Status**: ✅ Implemented  
**Priority**: P0 - Critical

**Requirements:**
- [x] Auto-load columns
- [x] Display tasks within each column
- [x] Support horizontal and vertical scrolling
- [x] Load without noticeable delay

**Current Implementation:**
- Located in: `@/Users/nawaf-space/CascadeProjects/ServiceDesk/ServiceDesk-app/app/(dashboard)/projects/[projectId]/board/page.tsx:426-499`
- Uses default statuses: backlog, ready, in-progress, in-review, done
- Tasks organized by status in columns

**Pending Improvements:**
- None - basic functionality complete

---

### 🔄 User Story 2: تحميل اللوحة بأداء عالي (High-Performance Loading)
**Status**: 🟡 Partially Implemented  
**Priority**: P1 - High

**Requirements:**
- [ ] Implement Virtual List for task rendering
- [x] Avoid loading all cards at once (currently loads all)
- [ ] Prevent stuttering during scrolling
- [ ] Implement pagination or infinite scroll

**Technical Implementation:**
```typescript
// Recommended: Use react-virtual or react-window
// File: components/projects/VirtualTaskList.tsx
- Implement windowing for columns with 50+ tasks
- Lazy load task details on demand
- Use React.memo for task cards
```

**Dependencies:**
- Install: `npm install @tanstack/react-virtual` or `react-window`

**Files to Create/Modify:**
- Create: `components/projects/VirtualTaskList.tsx`
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`

---

## 🏛️ Epic 2: Column Management

### 🔄 User Story 3: إنشاء عمود جديد (Create New Column)
**Status**: ❌ Not Implemented  
**Priority**: P1 - High

**Requirements:**
- [ ] Show "Create column" button
- [ ] Input column name
- [ ] Column appears immediately on board
- [ ] Persist to backend

**Technical Implementation:**
```typescript
// API Endpoint: POST /api/v1/pm/projects/:projectId/columns
// Request: { name: string, position: number, category: string }

// UI Components needed:
// - ColumnCreateButton.tsx
// - ColumnCreateModal.tsx or inline form
```

**Files to Create/Modify:**
- Create: `components/projects/ColumnCreateButton.tsx`
- Create: `components/projects/ColumnForm.tsx`
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`
- Backend: Add column management endpoints

**Backend Requirements:**
- New model: `Column` schema with project reference
- CRUD endpoints for columns
- Position/order management

---

### 🔄 User Story 4: تعديل اسم العمود (Edit Column Name)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] Inline editing of column name
- [ ] Auto-save changes
- [ ] Real-time update for all users
- [ ] Click or double-click to edit

**Technical Implementation:**
```typescript
// API: PATCH /api/v1/pm/columns/:columnId
// Real-time: WebSocket or polling for live updates

// Component: EditableColumnHeader.tsx
- ContentEditable or input field
- onBlur save
- Optimistic UI updates
```

**Files to Create/Modify:**
- Create: `components/projects/EditableColumnHeader.tsx`
- Modify: `components/projects/BoardColumn.tsx`

**Dependencies:**
- WebSocket setup for real-time (optional for MVP)

---

### 🔄 User Story 5: إعادة ترتيب الأعمدة (Reorder Columns)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] Drag & Drop functionality for columns
- [ ] Persist new order
- [ ] No data loss during reordering
- [ ] Smooth animation

**Technical Implementation:**
```typescript
// Library: @dnd-kit/core or react-beautiful-dnd
// API: PATCH /api/v1/pm/columns/:columnId/reorder
// Request: { position: number }

// Implementation:
- DndContext wrapper
- Sortable columns
- Persist order to backend
```

**Files to Create/Modify:**
- Create: `components/projects/DraggableColumn.tsx`
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`

**Dependencies:**
- Install: `npm install @dnd-kit/core @dnd-kit/sortable`

---

## 📇 Epic 3: Work Item / Card Management

### ✅ User Story 6: إنشاء مهمة داخل عمود (Create Task in Column)
**Status**: ✅ Implemented  
**Priority**: P0 - Critical

**Requirements:**
- [x] Create button available per column
- [x] Task created with correct status
- [x] Task appears immediately

**Current Implementation:**
- Create button in backlog column: `page.tsx:448-456`
- Modal implementation: `page.tsx:631-793`
- API call: `handleCreateTask` function

**Pending Improvements:**
- [ ] Add create button to all columns (not just backlog)
- [ ] Quick-add inline form option

---

### ✅ User Story 7: عرض بطاقة المهمة (Display Task Card)
**Status**: ✅ Implemented  
**Priority**: P0 - Critical

**Requirements:**
- [x] Display title
- [x] Display task number (key)
- [x] Display task type (Story/Task/Epic/Bug)
- [x] Display assignee

**Current Implementation:**
- Task card: `page.tsx:458-487`
- Shows: key, title, type icon, priority, assignee avatar

**Pending Improvements:**
- [ ] Extract to separate `TaskCard` component
- [ ] Add story points display
- [ ] Add labels/tags display
- [ ] Add due date indicator

---

### 🔄 User Story 8: نقل مهمة بين الأعمدة (Move Task Between Columns)
**Status**: 🟡 Partially Implemented  
**Priority**: P0 - Critical

**Requirements:**
- [ ] Drag & Drop between columns
- [x] Update status in background (API exists)
- [x] No data loss
- [ ] Visual feedback during drag

**Current Implementation:**
- API exists: `handleMoveTask` function at `page.tsx:274-303`
- Manual status update via detail panel: `page.tsx:532-542`

**Technical Implementation:**
```typescript
// Library: @dnd-kit/core
// Components needed:
- DraggableTaskCard.tsx
- DroppableColumn.tsx

// Flow:
1. User drags task card
2. Optimistic UI update
3. API call to update status
4. Rollback on error
```

**Files to Create/Modify:**
- Create: `components/projects/DraggableTaskCard.tsx`
- Create: `components/projects/DroppableColumn.tsx`
- Modify: `components/projects/TaskCard.tsx`

**Dependencies:**
- Install: `npm install @dnd-kit/core @dnd-kit/sortable`

---

## ✏️ Epic 4: Inline Editing

### 🔄 User Story 9: تعديل عنوان المهمة مباشرة (Edit Task Title Inline)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] Edit title without opening detail page
- [ ] Auto-save on change
- [ ] Immediate visual update
- [ ] Click to edit mode

**Technical Implementation:**
```typescript
// Component: EditableTaskTitle.tsx
// API: PATCH /api/v1/pm/tasks/:taskId
// Request: { title: string }

// Features:
- ContentEditable or input field
- onBlur or debounced save
- Loading indicator
- Error handling
```

**Files to Create/Modify:**
- Create: `components/projects/EditableTaskTitle.tsx`
- Modify: `components/projects/TaskCard.tsx`

---

### 🔄 User Story 10: تعديل Story Points (Edit Story Points)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] Display story points field on card
- [ ] Edit without reload
- [ ] Save immediately
- [ ] Numeric validation

**Technical Implementation:**
```typescript
// Component: StoryPointsEditor.tsx
// API: PATCH /api/v1/pm/tasks/:taskId
// Request: { storyPoints: number }

// UI:
- Small badge/chip on card
- Click to edit
- Dropdown or number input
- Common values: 1, 2, 3, 5, 8, 13
```

**Files to Create/Modify:**
- Create: `components/projects/StoryPointsEditor.tsx`
- Modify: `components/projects/TaskCard.tsx`

---

## 🔍 Epic 5: Search & Filter

### 🔄 User Story 11: البحث داخل اللوحة (Search Within Board)
**Status**: 🟡 Partially Implemented  
**Priority**: P1 - High

**Requirements:**
- [x] Clear search field (exists in toolbar)
- [ ] Search by title or number
- [ ] Immediate results display
- [ ] Highlight matching cards

**Current Implementation:**
- Search placeholder exists: `page.tsx:410-421`
- No search logic implemented

**Technical Implementation:**
```typescript
// Add to board page:
const [searchQuery, setSearchQuery] = useState('');

const filteredTasks = useMemo(() => {
  if (!searchQuery) return tasksByStatus;
  
  return Object.entries(tasksByStatus).reduce((acc, [status, tasks]) => {
    acc[status] = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return acc;
  }, {});
}, [tasksByStatus, searchQuery]);
```

**Files to Modify:**
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`
- Modify: `components/projects/ProjectToolbar.tsx` (add onChange handler)

---

### 🔄 User Story 12: فلترة المهام حسب المكلف (Filter by Assignee)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] "Unassigned" option
- [ ] User list dropdown
- [ ] Immediate filtering
- [ ] Multiple assignee selection (optional)

**Technical Implementation:**
```typescript
// Component: AssigneeFilter.tsx
// State: selectedAssignees: string[]

// UI:
- Dropdown with user avatars
- "Unassigned" checkbox
- "Clear filter" option
```

**Files to Create/Modify:**
- Create: `components/projects/AssigneeFilter.tsx`
- Create: `components/projects/FilterBar.tsx`
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`

---

### 🔄 User Story 13: استخدام فلترة متقدمة (Advanced Filtering)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] Clear "Filter" button
- [ ] Multiple condition selection
- [ ] Easy filter removal
- [ ] Save filter presets (optional)

**Technical Implementation:**
```typescript
// Component: AdvancedFilterModal.tsx
// Filters:
- Type (Epic, Story, Task, Bug)
- Priority (Critical, High, Medium, Low)
- Assignee
- Labels
- Due date range
- Story points range

// State management:
interface FilterState {
  types: string[];
  priorities: string[];
  assignees: string[];
  labels: string[];
  dueDateRange: { start?: Date; end?: Date };
  storyPointsRange: { min?: number; max?: number };
}
```

**Files to Create/Modify:**
- Create: `components/projects/AdvancedFilterModal.tsx`
- Create: `components/projects/FilterChips.tsx` (display active filters)
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`

---

## 🏃 Epic 6: Sprint Management

### 🔄 User Story 14: عرض تفاصيل السبرنت (Display Sprint Details)
**Status**: ❌ Not Implemented  
**Priority**: P1 - High

**Requirements:**
- [ ] Display sprint name
- [ ] Show start and end dates
- [ ] Show task count
- [ ] Show completion progress

**Technical Implementation:**
```typescript
// Component: SprintHeader.tsx
// API: GET /api/v1/pm/projects/:projectId/sprints/active

// Display:
- Sprint name
- Dates: Jan 1 - Jan 14
- Tasks: 15/20 completed
- Progress bar
- Days remaining
```

**Files to Create/Modify:**
- Create: `components/projects/SprintHeader.tsx`
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`
- Backend: Sprint model and endpoints

---

### 🔄 User Story 15: إكمال السبرنت (Complete Sprint)
**Status**: 🟡 Partially Implemented  
**Priority**: P1 - High

**Requirements:**
- [ ] "Complete sprint" button available
- [ ] Confirmation before closing
- [ ] Move incomplete tasks to next sprint or backlog
- [ ] Generate sprint report

**Current Implementation:**
- Button exists but not functional: `page.tsx:412-415`

**Technical Implementation:**
```typescript
// Component: CompleteSprintModal.tsx
// API: POST /api/v1/pm/sprints/:sprintId/complete

// Flow:
1. Show incomplete tasks
2. User decides: move to backlog or next sprint
3. Confirm action
4. Generate sprint report
5. Close sprint
6. Redirect to sprint report or next sprint
```

**Files to Create/Modify:**
- Create: `components/projects/CompleteSprintModal.tsx`
- Create: `components/projects/SprintReport.tsx`
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`

---

### 🔄 User Story 16: عرض Sprint Insights (Display Sprint Insights)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] Show completed task count
- [ ] Show team velocity
- [ ] Show delayed tasks
- [ ] Burndown chart (optional)

**Technical Implementation:**
```typescript
// Component: SprintInsights.tsx
// API: GET /api/v1/pm/sprints/:sprintId/insights

// Metrics:
- Completed: 15/20 tasks
- Story points completed: 34/40
- Velocity: 34 points (compared to avg 32)
- Delayed tasks: 3
- On-track tasks: 12
- Burndown chart visualization
```

**Files to Create/Modify:**
- Create: `components/projects/SprintInsights.tsx`
- Create: `components/projects/SprintMetrics.tsx`
- Backend: Sprint analytics endpoints

**Dependencies:**
- Consider: `recharts` or `chart.js` for visualizations

---

## 👥 Epic 7: Grouping & View Settings

### 🔄 User Story 17: تجميع المهام (Group Tasks)
**Status**: ❌ Not Implemented  
**Priority**: P2 - Medium

**Requirements:**
- [ ] Group by Assignee
- [ ] Group by Status (default)
- [ ] Group by Type
- [ ] Group by Priority (optional)
- [ ] Can cancel grouping
- [ ] Doesn't affect data

**Technical Implementation:**
```typescript
// Component: GroupBySelector.tsx
// State: groupBy: 'status' | 'assignee' | 'type' | 'priority'

// Logic:
const groupTasks = (tasks: Task[], groupBy: string) => {
  switch(groupBy) {
    case 'assignee':
      return groupByAssignee(tasks);
    case 'type':
      return groupByType(tasks);
    case 'status':
    default:
      return groupByStatus(tasks);
  }
};
```

**Files to Create/Modify:**
- Create: `components/projects/GroupBySelector.tsx`
- Create: `hooks/useTaskGrouping.ts`
- Modify: `app/(dashboard)/projects/[projectId]/board/page.tsx`

---

### 🔄 User Story 18: إعدادات العرض (View Settings)
**Status**: ❌ Not Implemented  
**Priority**: P3 - Low

**Requirements:**
- [ ] Save settings per user
- [ ] Auto-apply settings
- [ ] Don't affect other users
- [ ] Settings include: group by, filters, column width, etc.

**Technical Implementation:**
```typescript
// Component: BoardSettings.tsx
// API: 
// - GET /api/v1/pm/users/me/board-settings
// - PATCH /api/v1/pm/users/me/board-settings

// Settings:
interface BoardSettings {
  groupBy: string;
  defaultFilters: FilterState;
  columnWidth: number;
  showSubtasks: boolean;
  showLabels: boolean;
  showStoryPoints: boolean;
  compactView: boolean;
}

// Storage:
- Backend: user preferences table
- Frontend: localStorage as fallback
```

**Files to Create/Modify:**
- Create: `components/projects/BoardSettingsModal.tsx`
- Create: `hooks/useBoardSettings.ts`
- Backend: User board preferences model

---

## 📊 Implementation Priority Matrix

### Phase 1: MVP (P0 - Critical)
**Timeline: Week 1-2**
- ✅ User Story 1: Display board (Complete)
- ✅ User Story 6: Create task in column (Complete)
- ✅ User Story 7: Display task card (Complete)
- 🔄 User Story 8: Drag & Drop task movement (In Progress)

### Phase 2: Core Features (P1 - High)
**Timeline: Week 3-4**
- User Story 2: Virtual scrolling for performance
- User Story 3: Create new columns
- User Story 11: Search functionality
- User Story 14: Sprint details display
- User Story 15: Complete sprint

### Phase 3: Enhanced UX (P2 - Medium)
**Timeline: Week 5-6**
- User Story 4: Edit column name
- User Story 5: Reorder columns
- User Story 9: Inline edit task title
- User Story 10: Edit story points
- User Story 12: Filter by assignee
- User Story 13: Advanced filtering
- User Story 16: Sprint insights
- User Story 17: Task grouping

### Phase 4: Polish (P3 - Low)
**Timeline: Week 7+**
- User Story 18: View settings and preferences
- Performance optimizations
- Real-time collaboration features
- Accessibility improvements

---

## 🔧 Technical Dependencies

### Required Libraries
```json
{
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^7.0.0",
  "@tanstack/react-virtual": "^3.0.0",
  "date-fns": "^2.30.0",
  "recharts": "^2.10.0" // for charts
}
```

### Backend Requirements
- Column CRUD endpoints
- Sprint management endpoints
- Task movement/transition endpoints
- User preferences storage
- Real-time updates (WebSocket/SSE)

### Component Architecture
```
components/projects/
├── board/
│   ├── BoardColumn.tsx (exists)
│   ├── DraggableColumn.tsx (new)
│   ├── DroppableColumn.tsx (new)
│   ├── EditableColumnHeader.tsx (new)
│   ├── ColumnCreateButton.tsx (new)
│   ├── VirtualTaskList.tsx (new)
├── tasks/
│   ├── TaskCard.tsx (exists)
│   ├── DraggableTaskCard.tsx (new)
│   ├── EditableTaskTitle.tsx (new)
│   ├── StoryPointsEditor.tsx (new)
├── filters/
│   ├── FilterBar.tsx (new)
│   ├── AssigneeFilter.tsx (new)
│   ├── AdvancedFilterModal.tsx (new)
│   ├── FilterChips.tsx (new)
├── sprint/
│   ├── SprintHeader.tsx (new)
│   ├── SprintInsights.tsx (new)
│   ├── CompleteSprintModal.tsx (new)
│   ├── SprintReport.tsx (new)
└── settings/
    ├── GroupBySelector.tsx (new)
    ├── BoardSettingsModal.tsx (new)
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Task grouping logic
- [ ] Filter logic
- [ ] Sprint calculations
- [ ] Date utilities

### Integration Tests
- [ ] Create task flow
- [ ] Move task between columns
- [ ] Complete sprint flow
- [ ] Filter application

### E2E Tests
- [ ] Full board workflow
- [ ] Drag and drop scenarios
- [ ] Multi-user collaboration
- [ ] Sprint lifecycle

---

## 📝 Notes

### Current Implementation Status
The board currently has:
- Basic column display with hardcoded statuses
- Task cards with key, title, type, assignee
- Detail panel for selected tasks
- Create task modal
- API integration for task CRUD

### Next Immediate Actions
1. **Install drag-and-drop library**: `@dnd-kit/core`
2. **Implement task drag & drop**: Critical for board usability
3. **Add search functionality**: Quick win for UX
4. **Create column management**: Required before custom workflows

### Known Limitations
- No custom column support yet (hardcoded statuses)
- No real-time updates (manual refresh needed)
- No virtual scrolling (performance issue with many tasks)
- Limited filtering options
- No sprint management

### Future Enhancements
- Swimlanes for epics/assignees
- Card coloring and customization
- Keyboard shortcuts
- Bulk operations
- Board templates
- Archive/unarchive columns
- Activity feed on cards
- Comments and mentions
