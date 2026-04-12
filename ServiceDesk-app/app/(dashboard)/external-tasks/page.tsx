'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
} from '@/components/ui/card';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import {
 Search,
 Cog,
 Clock,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 Lock,
 RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExternalTasks, type ExternalTaskStatus } from '@/hooks/useExternalTasks';

const statusConfig: Record<
 ExternalTaskStatus,
 { label: string; labelAr: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
 available: { label: 'Available', labelAr: 'متاح', variant: 'outline', icon: Clock },
 locked: { label: 'Locked', labelAr: 'مقفل', variant: 'default', icon: Lock },
 completed: { label: 'Completed', labelAr: 'مكتمل', variant: 'secondary', icon: CheckCircle2 },
 failed: { label: 'Failed', labelAr: 'فشل', variant: 'destructive', icon: XCircle },
 cancelled: { label: 'Cancelled', labelAr: 'ملغى', variant: 'secondary', icon: AlertTriangle },
};

function formatDate(dateStr?: string) {
 if (!dateStr) return '—';
 const d = new Date(dateStr);
 return d.toLocaleString('en-GB', {
 day: '2-digit',
 month: 'short',
 hour: '2-digit',
 minute: '2-digit',
 });
}

function timeAgo(dateStr?: string) {
 if (!dateStr) return '';
 const diff = Date.now() - new Date(dateStr).getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return 'just now';
 if (mins < 60) return `${mins}m ago`;
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return `${hrs}h ago`;
 return `${Math.floor(hrs / 24)}d ago`;
}

export default function ExternalTasksPage() {
 const { locale } = useLanguage();
 const isAr = locale === 'ar';

 const [topicFilter, setTopicFilter] = useState('');
 const [statusFilter, setStatusFilter] = useState<string>('all');
 const [page, setPage] = useState(1);

 const { data, isLoading, refetch, isFetching } = useExternalTasks({
 topic: topicFilter || undefined,
 status: statusFilter !== 'all' ? (statusFilter as ExternalTaskStatus) : undefined,
 page,
 limit: 20,
 });

 const tasks = data?.tasks || [];
 const pagination = data?.pagination;

 // Compute summary stats
 const availableCount = tasks.filter(t => t.status === 'available').length;
 const lockedCount = tasks.filter(t => t.status === 'locked').length;
 const failedCount = tasks.filter(t => t.status === 'failed').length;

 return (
 <DashboardLayout>
 <div className="container mx-auto py-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-warning-soft flex items-center justify-center">
 <Cog className="h-5 w-5 text-warning" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground">
 {isAr ? 'المهام الخارجية' : 'External Tasks'}
 </h1>
 <p className="text-sm text-muted-foreground">
 {isAr ? 'مراقبة المهام المفوضة للعمال الخارجيين' : 'Monitor tasks delegated to external workers'}
 </p>
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => refetch()}
 disabled={isFetching}
 >
 <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
 {isAr ? 'تحديث' : 'Refresh'}
 </Button>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Card>
 <CardContent className="pt-4 pb-3 flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-brand-surface flex items-center justify-center">
 <Clock className="h-4 w-4 text-brand" />
 </div>
 <div>
 <p className="text-2xl font-bold text-foreground">{availableCount}</p>
 <p className="text-xs text-muted-foreground">{isAr ? 'متاح للتنفيذ' : 'Available'}</p>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="pt-4 pb-3 flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-warning-soft flex items-center justify-center">
 <Lock className="h-4 w-4 text-warning" />
 </div>
 <div>
 <p className="text-2xl font-bold text-foreground">{lockedCount}</p>
 <p className="text-xs text-muted-foreground">{isAr ? 'قيد التنفيذ' : 'Locked'}</p>
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="pt-4 pb-3 flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-destructive-soft flex items-center justify-center">
 <XCircle className="h-4 w-4 text-destructive" />
 </div>
 <div>
 <p className="text-2xl font-bold text-foreground">{failedCount}</p>
 <p className="text-xs text-muted-foreground">{isAr ? 'فشل' : 'Failed'}</p>
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Filters */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base">
 {isAr ? 'قائمة المهام' : 'Task List'}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col sm:flex-row gap-3 mb-4">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 value={topicFilter}
 onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
 placeholder={isAr ? 'بحث بالموضوع...' : 'Filter by topic...'}
 className="pl-9"
 />
 </div>
 <Select
 value={statusFilter}
 onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
 >
 <SelectTrigger className="w-[160px]">
 <SelectValue placeholder={isAr ? 'الحالة' : 'Status'} />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{isAr ? 'الكل' : 'All'}</SelectItem>
 <SelectItem value="available">{isAr ? 'متاح' : 'Available'}</SelectItem>
 <SelectItem value="locked">{isAr ? 'مقفل' : 'Locked'}</SelectItem>
 <SelectItem value="completed">{isAr ? 'مكتمل' : 'Completed'}</SelectItem>
 <SelectItem value="failed">{isAr ? 'فشل' : 'Failed'}</SelectItem>
 <SelectItem value="cancelled">{isAr ? 'ملغى' : 'Cancelled'}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Table */}
 {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
 </div>
 ) : tasks.length === 0 ? (
 <div className="text-center py-12">
 <Cog className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
 <p className="text-sm text-muted-foreground">
 {isAr ? 'لا توجد مهام خارجية' : 'No external tasks found'}
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border">
 <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">
 {isAr ? 'الموضوع' : 'Topic'}
 </th>
 <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">
 {isAr ? 'الحالة' : 'Status'}
 </th>
 <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">
 {isAr ? 'العامل' : 'Worker'}
 </th>
 <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">
 {isAr ? 'المحاولات' : 'Retries'}
 </th>
 <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">
 {isAr ? 'الأولوية' : 'Priority'}
 </th>
 <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">
 {isAr ? 'تم الإنشاء' : 'Created'}
 </th>
 <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase">
 {isAr ? 'الخطأ' : 'Error'}
 </th>
 </tr>
 </thead>
 <tbody>
 {tasks.map((task) => {
 const sc = statusConfig[task.status] || statusConfig.available;
 const StatusIcon = sc.icon;
 return (
 <tr
 key={task._id}
 className="border-b border-border hover:bg-accent transition-colors"
 >
 <td className="py-2.5 px-3">
 <span className="font-mono text-xs bg-warning-soft text-warning px-2 py-0.5 rounded">
 {task.topic}
 </span>
 </td>
 <td className="py-2.5 px-3">
 <Badge variant={sc.variant} className="gap-1 text-xs">
 <StatusIcon className="h-3 w-3" />
 {isAr ? sc.labelAr : sc.label}
 </Badge>
 </td>
 <td className="py-2.5 px-3">
 {task.workerId ? (
 <span className="text-xs font-mono text-muted-foreground">{task.workerId}</span>
 ) : (
 <span className="text-xs text-muted-foreground">—</span>
 )}
 </td>
 <td className="py-2.5 px-3">
 <span className={`text-xs ${task.retriesLeft === 0 && task.status === 'failed' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
 {task.retriesLeft}/{task.retries}
 </span>
 </td>
 <td className="py-2.5 px-3">
 <span className="text-xs text-muted-foreground">{task.priority}</span>
 </td>
 <td className="py-2.5 px-3">
 <span className="text-xs text-muted-foreground" title={formatDate(task.createdAt)}>
 {timeAgo(task.createdAt)}
 </span>
 </td>
 <td className="py-2.5 px-3 max-w-[200px]">
 {task.errorMessage ? (
 <span className="text-xs text-destructive truncate block" title={task.errorMessage}>
 {task.errorMessage}
 </span>
 ) : (
 <span className="text-xs text-muted-foreground">—</span>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* Pagination */}
 {pagination && pagination.pages > 1 && (
 <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
 <p className="text-xs text-muted-foreground">
 {isAr
 ? `${pagination.total} مهمة`
 : `${pagination.total} task${pagination.total !== 1 ? 's' : ''}`}
 </p>
 <div className="flex gap-1">
 <Button
 variant="outline"
 size="sm"
 disabled={page <= 1}
 onClick={() => setPage(p => p - 1)}
 >
 {isAr ? 'السابق' : 'Prev'}
 </Button>
 <Button
 variant="outline"
 size="sm"
 disabled={page >= pagination.pages}
 onClick={() => setPage(p => p + 1)}
 >
 {isAr ? 'التالي' : 'Next'}
 </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Auto-refresh indicator */}
 <p className="text-center text-[10px] text-muted-foreground">
 {isAr ? 'يتم التحديث تلقائياً كل 10 ثوانٍ' : 'Auto-refreshes every 10 seconds'}
 </p>
 </div>
 </DashboardLayout>
 );
}
