import Roadmap, { IPMRoadmap as IRoadmap, IRoadmapSprint } from '../../models/pm/Roadmap';
import Sprint from '../../models/pm/Sprint';
import Task from '../../models/pm/Task';
import Project from '../../models/pm/Project';
import { MethodologyCode, StatusCategory } from '../../types/pm';
import mongoose from 'mongoose';

class RoadmapService {
  async generateSprintTimeline(
    projectId: string,
    organizationId: string,
    userId: string
  ): Promise<IRoadmap> {
    const sprints = await Sprint.find({ projectId }).sort({ number: 1 });
    
    if (sprints.length === 0) {
      throw new Error('No sprints found for this project');
    }

    const sprintData: IRoadmapSprint[] = await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await Task.find({ sprintId: sprint._id });
        const plannedPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedPoints = tasks
          .filter((t) => t.status.category === StatusCategory.DONE)
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return {
          sprintId: sprint._id,
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          status: sprint.status as 'planning' | 'active' | 'completed',
          velocity: sprint.velocity?.completed,
          plannedPoints,
          completedPoints,
        };
      })
    );

    const startDate = sprints[0].startDate;
    const endDate = sprints[sprints.length - 1].endDate;

    let roadmap = await Roadmap.findOne({
      projectId,
      type: 'sprint_timeline',
    });

    if (roadmap) {
      roadmap.sprints = sprintData;
      roadmap.startDate = startDate;
      roadmap.endDate = endDate;
      await roadmap.save();
    } else {
      roadmap = new Roadmap({
        projectId,
        organizationId,
        name: 'Sprint Timeline',
        type: 'sprint_timeline',
        methodology: MethodologyCode.SCRUM,
        startDate,
        endDate,
        sprints: sprintData,
        settings: {
          showWeekends: true,
          showDependencies: false,
          groupBy: 'none',
          zoomLevel: 'week',
        },
        isDefault: true,
        createdBy: userId,
      });
      await roadmap.save();
    }

    return roadmap;
  }

  async generateGanttChart(
    projectId: string,
    organizationId: string,
    userId: string
  ): Promise<IRoadmap> {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const tasks = await Task.find({ projectId }).sort({ createdAt: 1 });
    
    const startDate = project.startDate || new Date();
    const endDate = project.targetEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Group tasks by epic
    const epics = tasks.filter((t) => t.type === 'epic');
    const phases = epics.map((epic) => {
      const epicTasks = tasks.filter((t) => t.epicId?.toString() === epic._id.toString());
      const completedTasks = epicTasks.filter((t) => t.status.category === StatusCategory.DONE);
      const progress = epicTasks.length > 0 ? (completedTasks.length / epicTasks.length) * 100 : 0;

      return {
        id: epic._id.toString(),
        name: epic.title,
        description: epic.description,
        startDate: epic.startDate || startDate,
        endDate: epic.dueDate || endDate,
        status: epic.status.category === StatusCategory.DONE ? 'completed' as const :
                epic.status.category === StatusCategory.IN_PROGRESS ? 'in_progress' as const : 'planned' as const,
        milestones: epicTasks.map((t) => ({
          id: t._id.toString(),
          name: t.title,
          startDate: t.startDate || startDate,
          endDate: t.dueDate || endDate,
          status: t.status.category === StatusCategory.DONE ? 'completed' as const :
                  t.status.category === StatusCategory.IN_PROGRESS ? 'in_progress' as const : 'planned' as const,
          progress: t.status.category === StatusCategory.DONE ? 100 : 0,
        })),
        color: '#3B82F6',
      };
    });

    let roadmap = await Roadmap.findOne({
      projectId,
      type: 'gantt',
    });

    if (roadmap) {
      roadmap.phases = phases;
      roadmap.startDate = startDate;
      roadmap.endDate = endDate;
      await roadmap.save();
    } else {
      roadmap = new Roadmap({
        projectId,
        organizationId,
        name: 'Gantt Chart',
        type: 'gantt',
        methodology: project.methodology.code,
        startDate,
        endDate,
        phases,
        settings: {
          showWeekends: true,
          showDependencies: true,
          groupBy: 'epic',
          zoomLevel: 'week',
        },
        isDefault: false,
        createdBy: userId,
      });
      await roadmap.save();
    }

    return roadmap;
  }

  async generateChangeCalendar(
    projectId: string,
    organizationId: string,
    userId: string
  ): Promise<IRoadmap> {
    const changes = await Task.find({
      projectId,
      type: 'change',
    }).sort({ 'itil.scheduledStart': 1 });

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    // Group changes by week into change windows
    const changeWindows: {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      type: 'maintenance' | 'release' | 'emergency';
      changes: mongoose.Types.ObjectId[];
    }[] = [];

    const weekMap = new Map<string, typeof changeWindows[0]>();

    for (const change of changes) {
      const scheduledStart = change.itil?.scheduledStart || change.createdAt;
      const weekStart = new Date(scheduledStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        weekMap.set(weekKey, {
          id: `week-${weekKey}`,
          name: `Week of ${weekStart.toLocaleDateString()}`,
          startDate: weekStart,
          endDate: weekEnd,
          type: 'maintenance',
          changes: [],
        });
      }

      const window = weekMap.get(weekKey)!;
      window.changes.push(change._id);
      
      if (change.itil?.changeType === 'emergency') {
        window.type = 'emergency';
      } else if (change.itil?.changeType === 'normal' && window.type !== 'emergency') {
        window.type = 'release';
      }
    }

    changeWindows.push(...weekMap.values());

    let roadmap = await Roadmap.findOne({
      projectId,
      type: 'change_calendar',
    });

    if (roadmap) {
      roadmap.changeWindows = changeWindows;
      roadmap.startDate = startDate;
      roadmap.endDate = endDate;
      await roadmap.save();
    } else {
      roadmap = new Roadmap({
        projectId,
        organizationId,
        name: 'Change Calendar',
        type: 'change_calendar',
        methodology: MethodologyCode.ITIL,
        startDate,
        endDate,
        changeWindows,
        settings: {
          showWeekends: false,
          showDependencies: false,
          groupBy: 'none',
          zoomLevel: 'week',
        },
        isDefault: true,
        createdBy: userId,
      });
      await roadmap.save();
    }

    return roadmap;
  }

  async generateOKRProgress(
    projectId: string,
    organizationId: string,
    userId: string
  ): Promise<IRoadmap> {
    const tasks = await Task.find({
      projectId,
      'okr.objectiveId': { $exists: true },
    });

    // Group by objective
    const objectiveMap = new Map<string, {
      id: string;
      name: string;
      progress: number;
      keyResults: {
        id: string;
        name: string;
        target: number;
        current: number;
        unit: string;
      }[];
    }>();

    for (const task of tasks) {
      if (!task.okr?.objectiveId) continue;
      
      const objId = task.okr.objectiveId.toString();
      if (!objectiveMap.has(objId)) {
        objectiveMap.set(objId, {
          id: objId,
          name: task.title,
          progress: 0,
          keyResults: [],
        });
      }

      const obj = objectiveMap.get(objId)!;
      if (task.okr.keyResultId) {
        obj.keyResults.push({
          id: task.okr.keyResultId.toString(),
          name: task.title,
          target: 100,
          current: task.okr.contribution || 0,
          unit: '%',
        });
      }
    }

    // Calculate progress for each objective
    for (const obj of objectiveMap.values()) {
      if (obj.keyResults.length > 0) {
        const totalProgress = obj.keyResults.reduce((sum, kr) => sum + (kr.current / kr.target) * 100, 0);
        obj.progress = totalProgress / obj.keyResults.length;
      }
    }

    const objectives = Array.from(objectiveMap.values());
    const now = new Date();
    const startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);

    let roadmap = await Roadmap.findOne({
      projectId,
      type: 'okr_progress',
    });

    if (roadmap) {
      roadmap.objectives = objectives;
      roadmap.startDate = startDate;
      roadmap.endDate = endDate;
      await roadmap.save();
    } else {
      roadmap = new Roadmap({
        projectId,
        organizationId,
        name: 'OKR Progress',
        type: 'okr_progress',
        methodology: MethodologyCode.OKR,
        startDate,
        endDate,
        objectives,
        settings: {
          showWeekends: false,
          showDependencies: false,
          groupBy: 'none',
          zoomLevel: 'quarter',
        },
        isDefault: true,
        createdBy: userId,
      });
      await roadmap.save();
    }

    return roadmap;
  }

  async getRoadmap(roadmapId: string): Promise<IRoadmap | null> {
    return Roadmap.findById(roadmapId);
  }

  async getProjectRoadmaps(projectId: string): Promise<IRoadmap[]> {
    return Roadmap.find({ projectId }).sort({ createdAt: -1 });
  }

  async deleteRoadmap(roadmapId: string): Promise<void> {
    await Roadmap.findByIdAndDelete(roadmapId);
  }
}

export default new RoadmapService();
