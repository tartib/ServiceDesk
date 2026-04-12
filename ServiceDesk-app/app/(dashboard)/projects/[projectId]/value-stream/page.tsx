'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 ArrowRight,
 Clock,
 AlertTriangle,
 CheckCircle,
 Plus,
 Settings,
 TrendingUp,
 Zap,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface ValueStreamStep {
 id: string;
 name: string;
 type: 'process' | 'wait' | 'decision';
 processTime: number; // minutes
 waitTime: number; // minutes
 valueAdded: boolean;
 efficiency: number; // percentage
 bottleneck: boolean;
 owner?: string;
 description?: string;
}

interface Project {
 _id: string;
 name: string;
 key: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapStep = (s: Record<string, any>): ValueStreamStep => ({
 id: s._id,
 name: s.name,
 type: s.type || 'process',
 processTime: s.processTime || 0,
 waitTime: s.waitTime || 0,
 valueAdded: s.valueAdded ?? true,
 efficiency: s.efficiency || 0,
 bottleneck: s.bottleneck || false,
 owner: s.owner,
 description: s.description,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function ValueStreamPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);

 const [project, setProject] = useState<Project | null>(null);
 const [steps, setSteps] = useState<ValueStreamStep[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [selectedStep, setSelectedStep] = useState<ValueStreamStep | null>(null);

 const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, stepsRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/value-stream`, { headers: { Authorization: `Bearer ${token}` } }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);
 const stepsData = await stepsRes.json();
 if (stepsData.success) setSteps((stepsData.data.steps || []).map(mapStep));
 } catch (error) {
 console.error('Failed to fetch value stream:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = getToken();
 if (!token) { router.push('/login'); return; }
 fetchData(token);
 }, [projectId, router, fetchData]);

 const formatTime = (minutes: number) => {
 if (minutes < 60) return `${minutes}m`;
 if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
 return `${(minutes / 1440).toFixed(1)}d`;
 };

 const getTotalLeadTime = () => {
 return steps.reduce((sum, s) => sum + s.processTime + s.waitTime, 0);
 };

 const getTotalProcessTime = () => {
 return steps.reduce((sum, s) => sum + s.processTime, 0);
 };

 const getTotalWaitTime = () => {
 return steps.reduce((sum, s) => sum + s.waitTime, 0);
 };

 const getOverallEfficiency = () => {
 const processTime = getTotalProcessTime();
 const leadTime = getTotalLeadTime();
 return leadTime > 0 ? Math.round((processTime / leadTime) * 100) : 0;
 };

 const getBottleneckCount = () => {
 return steps.filter(s => s.bottleneck).length;
 };

 if (isLoading) {
 return <LoadingState />;
 }

 return (
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'lean'} />

 {/* Toolbar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-foreground">Value Stream Map</h2>
 <div className="flex items-center gap-2">
 <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
 <Settings className="h-4 w-4" />
 Configure
 </button>
 <button className="flex items-center gap-2 px-4 py-1.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors">
 <Plus className="h-4 w-4" />
 Add Step
 </button>
 </div>
 </div>
 </div>

 {/* Metrics Bar */}
 <div className="bg-background border-b border-border px-4 py-4">
 <div className="grid grid-cols-5 gap-4">
 <div className="text-center p-3 bg-muted/50 rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Lead Time</p>
 <p className="text-2xl font-bold text-foreground mt-1">{formatTime(getTotalLeadTime())}</p>
 </div>
 <div className="text-center p-3 bg-success-soft rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Process Time</p>
 <p className="text-2xl font-bold text-success mt-1">{formatTime(getTotalProcessTime())}</p>
 </div>
 <div className="text-center p-3 bg-warning-soft rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Wait Time</p>
 <p className="text-2xl font-bold text-warning mt-1">{formatTime(getTotalWaitTime())}</p>
 </div>
 <div className="text-center p-3 bg-brand-surface rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Efficiency</p>
 <p className="text-2xl font-bold text-brand mt-1">{getOverallEfficiency()}%</p>
 </div>
 <div className="text-center p-3 bg-destructive-soft rounded-lg">
 <p className="text-xs text-muted-foreground uppercase tracking-wide">Bottlenecks</p>
 <p className="text-2xl font-bold text-destructive mt-1">{getBottleneckCount()}</p>
 </div>
 </div>
 </div>

 {/* Value Stream Visualization */}
 <div className="flex-1 overflow-x-auto p-6">
 <div className="flex items-start gap-2 min-w-max">
 {steps.map((step, index) => (
 <div key={step.id} className="flex items-center">
 {/* Step Card */}
 <div
 onClick={() => setSelectedStep(step)}
 className={`relative w-48 cursor-pointer transition-all hover:scale-105 ${
 selectedStep?.id === step.id ? 'ring-2 ring-ring' : ''
 }`}
 >
 {/* Bottleneck Indicator */}
 {step.bottleneck && (
 <div className="absolute -top-2 -right-2 z-10">
 <span className="flex items-center justify-center w-6 h-6 bg-destructive rounded-full">
 <AlertTriangle className="h-3.5 w-3.5 text-white" />
 </span>
 </div>
 )}

 {/* Card */}
 <div className={`rounded-xl border-2 overflow-hidden ${
 step.type === 'wait' 
 ? 'border-warning/30 bg-warning-soft' 
 : step.type === 'decision'
 ? 'border-info/30 bg-info-soft'
 : 'border-brand-border bg-background'
 }`}>
 {/* Header */}
 <div className={`px-3 py-2 text-center ${
 step.type === 'wait' 
 ? 'bg-warning-soft' 
 : step.type === 'decision'
 ? 'bg-info-soft'
 : 'bg-brand-soft'
 }`}>
 <p className="text-sm font-semibold text-foreground">{step.name}</p>
 {step.owner && (
 <p className="text-xs text-muted-foreground">{step.owner}</p>
 )}
 </div>

 {/* Body */}
 <div className="p-3 space-y-2">
 {/* Process Time */}
 <div className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">Process:</span>
 <span className="font-medium text-success">{formatTime(step.processTime)}</span>
 </div>

 {/* Wait Time */}
 <div className="flex items-center justify-between text-xs">
 <span className="text-muted-foreground">Wait:</span>
 <span className={`font-medium ${step.waitTime > 60 ? 'text-warning' : 'text-muted-foreground'}`}>
 {formatTime(step.waitTime)}
 </span>
 </div>

 {/* Efficiency Bar */}
 <div>
 <div className="flex items-center justify-between text-xs mb-1">
 <span className="text-muted-foreground">Efficiency</span>
 <span className="font-medium">{step.efficiency}%</span>
 </div>
 <div className="w-full bg-muted rounded-full h-1.5">
 <div
 className={`h-1.5 rounded-full ${
 step.efficiency >= 70 ? 'bg-success' :
 step.efficiency >= 40 ? 'bg-warning' : 'bg-destructive'
 }`}
 style={{ width: `${step.efficiency}%` }}
 />
 </div>
 </div>

 {/* Value Added Indicator */}
 <div className="flex items-center justify-center pt-1">
 {step.valueAdded ? (
 <span className="flex items-center gap-1 text-xs text-success">
 <CheckCircle className="h-3.5 w-3.5" />
 Value Added
 </span>
 ) : (
 <span className="flex items-center gap-1 text-xs text-muted-foreground">
 <Clock className="h-3.5 w-3.5" />
 Non-Value
 </span>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Arrow */}
 {index < steps.length - 1 && (
 <div className="flex items-center px-2">
 <ArrowRight className="h-6 w-6 text-muted-foreground" />
 </div>
 )}
 </div>
 ))}
 </div>

 {/* Legend */}
 <div className="flex items-center gap-6 mt-8 pt-4 border-t border-border">
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded bg-brand-soft border-2 border-brand-border" />
 <span className="text-sm text-muted-foreground">Process Step</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded bg-warning-soft border-2 border-warning/30" />
 <span className="text-sm text-muted-foreground">Wait/Queue</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded bg-info-soft border-2 border-info/30" />
 <span className="text-sm text-muted-foreground">Decision Point</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="flex items-center justify-center w-4 h-4 bg-destructive rounded-full">
 <AlertTriangle className="h-2.5 w-2.5 text-white" />
 </span>
 <span className="text-sm text-muted-foreground">Bottleneck</span>
 </div>
 </div>
 </div>

 {/* Step Detail Panel */}
 {selectedStep && (
 <div className="fixed inset-y-0 right-0 w-96 bg-background shadow-xl border-l border-border z-50 overflow-y-auto">
 <div className="p-6">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold text-foreground">{selectedStep.name}</h3>
 <button
 onClick={() => setSelectedStep(null)}
 className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg"
 >
 ×
 </button>
 </div>

 {selectedStep.description && (
 <p className="text-sm text-muted-foreground mb-6">{selectedStep.description}</p>
 )}

 {/* Metrics */}
 <div className="space-y-4 mb-6">
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <span className="text-sm text-muted-foreground">Process Time</span>
 <span className="font-semibold text-success">{formatTime(selectedStep.processTime)}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <span className="text-sm text-muted-foreground">Wait Time</span>
 <span className="font-semibold text-warning">{formatTime(selectedStep.waitTime)}</span>
 </div>
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <span className="text-sm text-muted-foreground">Total Time</span>
 <span className="font-semibold text-foreground">
 {formatTime(selectedStep.processTime + selectedStep.waitTime)}
 </span>
 </div>
 <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
 <span className="text-sm text-muted-foreground">Efficiency</span>
 <span className={`font-semibold ${
 selectedStep.efficiency >= 70 ? 'text-success' :
 selectedStep.efficiency >= 40 ? 'text-warning' : 'text-destructive'
 }`}>
 {selectedStep.efficiency}%
 </span>
 </div>
 </div>

 {/* Status */}
 <div className="space-y-3 mb-6">
 <div className="flex items-center gap-2">
 {selectedStep.valueAdded ? (
 <CheckCircle className="h-5 w-5 text-success" />
 ) : (
 <Clock className="h-5 w-5 text-muted-foreground" />
 )}
 <span className="text-sm text-foreground">
 {selectedStep.valueAdded ? 'Value-Adding Activity' : 'Non-Value-Adding Activity'}
 </span>
 </div>
 {selectedStep.bottleneck && (
 <div className="flex items-center gap-2 p-3 bg-destructive-soft rounded-lg">
 <AlertTriangle className="h-5 w-5 text-destructive" />
 <span className="text-sm text-destructive font-medium">Identified as Bottleneck</span>
 </div>
 )}
 </div>

 {/* Improvement Suggestions */}
 {selectedStep.bottleneck && (
 <div className="p-4 bg-brand-surface rounded-lg">
 <div className="flex items-center gap-2 mb-2">
 <Zap className="h-5 w-5 text-brand" />
 <h4 className="font-medium text-brand">Improvement Suggestions</h4>
 </div>
 <ul className="text-sm text-brand space-y-1">
 <li>• Reduce wait time by adding resources</li>
 <li>• Implement parallel processing</li>
 <li>• Automate manual steps</li>
 <li>• Create Kaizen event to address</li>
 </ul>
 </div>
 )}

 {/* Actions */}
 <div className="flex gap-3 mt-6">
 <button className="flex-1 px-4 py-2 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors">
 <TrendingUp className="h-4 w-4 inline mr-2" />
 Create Improvement
 </button>
 <button className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors">
 Edit
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
