'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCalendarEvents, useCreateCalendarEvent } from '@/hooks/useChangeCalendar';
import { IChangeCalendarEvent, ChangeCalendarEventType } from '@/types/itsm';
import { Calendar, ChevronLeft, ChevronRight, Plus, AlertTriangle, Snowflake, Users, X } from 'lucide-react';
import Link from 'next/link';

const EVENT_CONFIG: Record<ChangeCalendarEventType, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
 [ChangeCalendarEventType.FREEZE_WINDOW]: { label: 'Freeze Window', color: 'text-info', bg: 'bg-info-soft', border: 'border-info/30', icon: <Snowflake className="w-3 h-3" /> },
 [ChangeCalendarEventType.MAINTENANCE_WINDOW]: { label: 'Maintenance', color: 'text-warning', bg: 'bg-warning-soft', border: 'border-warning/30', icon: <AlertTriangle className="w-3 h-3" /> },
 [ChangeCalendarEventType.CAB_MEETING]: { label: 'CAB Meeting', color: 'text-info', bg: 'bg-info-soft', border: 'border-info/30', icon: <Users className="w-3 h-3" /> },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
 return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
 return new Date(year, month, 1).getDay();
}

const EMPTY_FORM = {
 type: ChangeCalendarEventType.FREEZE_WINDOW,
 title: '',
 description: '',
 start_date: '',
 end_date: '',
};

export default function ChangeCalendarPage() {
 const today = new Date();
 const [viewYear, setViewYear] = useState(today.getFullYear());
 const [viewMonth, setViewMonth] = useState(today.getMonth());
 const [selectedDay, setSelectedDay] = useState<number | null>(null);
 const [filterType, setFilterType] = useState<ChangeCalendarEventType | ''>('');
 const [showAddModal, setShowAddModal] = useState(false);
 const [form, setForm] = useState(EMPTY_FORM);

 const createEvent = useCreateCalendarEvent();

 const startDate = new Date(viewYear, viewMonth, 1).toISOString();
 const endDate = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();

 const { data, isLoading } = useCalendarEvents({ start_date: startDate, end_date: endDate, type: filterType || undefined });
 const events: IChangeCalendarEvent[] = (data as { data?: IChangeCalendarEvent[] })?.data ?? [];

 const handleAddEvent = () => {
 if (!form.title || !form.start_date || !form.end_date) return;
 createEvent.mutate(
 {
 type: form.type,
 title: form.title,
 description: form.description || undefined,
 start_date: new Date(form.start_date).toISOString(),
 end_date: new Date(form.end_date).toISOString(),
 },
 {
 onSuccess: () => {
 setShowAddModal(false);
 setForm(EMPTY_FORM);
 },
 }
 );
 };

 const filtered = filterType ? events.filter((e) => e.type === filterType) : events;

 const daysInMonth = getDaysInMonth(viewYear, viewMonth);
 const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

 const eventsForDay = (day: number) => {
 return filtered.filter((e) => {
 const start = new Date(e.start_date);
 const end = new Date(e.end_date);
 const d = new Date(viewYear, viewMonth, day);
 return d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
 d <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
 });
 };

 const prevMonth = () => {
 if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
 else setViewMonth((m) => m - 1);
 setSelectedDay(null);
 };

 const nextMonth = () => {
 if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
 else setViewMonth((m) => m + 1);
 setSelectedDay(null);
 };

 const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between flex-wrap gap-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-brand-soft dark:bg-brand-soft rounded-xl flex items-center justify-center">
 <Calendar className="w-5 h-5 text-brand" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground">Change Calendar</h1>
 <p className="text-sm text-muted-foreground">{filtered.length} events this month</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Link
 href="/changes/new"
 className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-accent transition-colors font-medium text-sm"
 >
 <Plus className="w-4 h-4" /> New Change
 </Link>
 <button
 onClick={() => setShowAddModal(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-xl hover:bg-brand-strong transition-colors font-medium text-sm"
 >
 <Calendar className="w-4 h-4" /> Add Event
 </button>
 </div>
 </div>

 {/* Legend / Filter */}
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-semibold text-muted-foreground mr-1">Filter:</span>
 <button
 onClick={() => setFilterType('')}
 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterType ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
 >
 All
 </button>
 {Object.entries(EVENT_CONFIG).map(([type, cfg]) => (
 <button
 key={type}
 onClick={() => setFilterType(filterType === type ? '' : type as ChangeCalendarEventType)}
 className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
 filterType === type ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-muted text-muted-foreground hover:bg-accent border-transparent'
 }`}
 >
 {cfg.icon} {cfg.label}
 </button>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Calendar Grid */}
 <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
 {/* Month Nav */}
 <div className="flex items-center justify-between px-5 py-4 border-b border-border">
 <button onClick={prevMonth} className="p-2 hover:bg-accent rounded-lg transition-colors">
 <ChevronLeft className="w-5 h-5" />
 </button>
 <h2 className="text-lg font-bold text-foreground">
 {MONTHS[viewMonth]} {viewYear}
 </h2>
 <button onClick={nextMonth} className="p-2 hover:bg-accent rounded-lg transition-colors">
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>

 {/* Day headers */}
 <div className="grid grid-cols-7 border-b border-border">
 {DAYS.map((d) => (
 <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase">{d}</div>
 ))}
 </div>

 {/* Days grid */}
 {isLoading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
 </div>
 ) : (
 <div className="grid grid-cols-7">
 {Array.from({ length: firstDay }).map((_, i) => (
 <div key={`empty-${i}`} className="h-24 border-b border-r border-border bg-muted" />
 ))}
 {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
 const dayEvents = eventsForDay(day);
 const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
 const isSelected = selectedDay === day;
 return (
 <div
 key={day}
 onClick={() => setSelectedDay(isSelected ? null : day)}
 className={`h-24 border-b border-r border-border p-1.5 cursor-pointer transition-colors ${
 isSelected ? 'bg-brand-surface dark:bg-brand-soft' :
 'hover:bg-accent'
 }`}
 >
 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
 isToday ? 'bg-brand text-brand-foreground' :
 isSelected ? 'bg-brand-soft text-brand' :
 'text-muted-foreground'
 }`}>
 {day}
 </div>
 <div className="space-y-0.5">
 {dayEvents.slice(0, 2).map((e) => {
 const cfg = EVENT_CONFIG[e.type];
 return (
 <div key={e._id} className={`text-xs px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.color} flex items-center gap-0.5`}>
 {cfg.icon}
 <span className="truncate">{e.title}</span>
 </div>
 );
 })}
 {dayEvents.length > 2 && (
 <div className="text-xs text-muted-foreground pl-1">+{dayEvents.length - 2} more</div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Sidebar: selected day events or upcoming */}
 <div className="space-y-5">
 {selectedDay ? (
 <div className="bg-card rounded-xl border border-border p-5">
 <h3 className="font-semibold text-foreground mb-4">
 {MONTHS[viewMonth]} {selectedDay}, {viewYear}
 </h3>
 {selectedEvents.length > 0 ? (
 <div className="space-y-3">
 {selectedEvents.map((e) => {
 const cfg = EVENT_CONFIG[e.type];
 return (
 <div key={e._id} className={`p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
 <div className="flex items-center gap-2 mb-1">
 <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
 {cfg.icon} {cfg.label}
 </span>
 </div>
 <p className={`font-medium text-sm ${cfg.color}`}>{e.title}</p>
 {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
 <p className="text-xs text-muted-foreground mt-2">
 {new Date(e.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
 {new Date(e.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground text-center py-6">No events on this day</p>
 )}
 </div>
 ) : (
 <div className="bg-card rounded-xl border border-border p-5">
 <h3 className="font-semibold text-foreground mb-4">Upcoming Events</h3>
 {filtered.length > 0 ? (
 <div className="space-y-3">
 {[...filtered]
 .filter((e) => new Date(e.start_date) >= today)
 .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
 .slice(0, 6)
 .map((e) => {
 const cfg = EVENT_CONFIG[e.type];
 return (
 <div key={e._id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
 <span className={cfg.color}>{cfg.icon}</span>
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm text-foreground truncate">{e.title}</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 {new Date(e.start_date).toLocaleDateString()} — {new Date(e.end_date).toLocaleDateString()}
 </p>
 <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${cfg.color} mt-1`}>
 {cfg.icon} {cfg.label}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground text-center py-6">No upcoming events</p>
 )}
 </div>
 )}

 {/* Event type summary */}
 <div className="bg-card rounded-xl border border-border p-5">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">This Month</h3>
 <div className="space-y-2">
 {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
 const count = events.filter((e) => e.type === type).length;
 return (
 <div key={type} className="flex items-center justify-between">
 <span className={`inline-flex items-center gap-1.5 text-sm ${cfg.color}`}>
 {cfg.icon} {cfg.label}
 </span>
 <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>{count}</span>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Add Event Modal */}
 {showAddModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
 <div className="flex items-center justify-between p-5 border-b border-border">
 <h2 className="text-lg font-bold text-foreground">Add Calendar Event</h2>
 <button onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM); }} className="p-2 hover:bg-accent rounded-lg">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="p-5 space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Event Type</label>
 <select
 value={form.type}
 onChange={(e) => setForm({ ...form, type: e.target.value as ChangeCalendarEventType })}
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
 >
 <option value={ChangeCalendarEventType.FREEZE_WINDOW}>Freeze Window</option>
 <option value={ChangeCalendarEventType.MAINTENANCE_WINDOW}>Maintenance Window</option>
 <option value={ChangeCalendarEventType.CAB_MEETING}>CAB Meeting</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Title <span className="text-destructive">*</span></label>
 <input
 type="text"
 value={form.title}
 onChange={(e) => setForm({ ...form, title: e.target.value })}
 placeholder="e.g. Q1 Freeze Window"
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Description</label>
 <textarea
 value={form.description}
 onChange={(e) => setForm({ ...form, description: e.target.value })}
 rows={2}
 placeholder="Optional description..."
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Start <span className="text-destructive">*</span></label>
 <input
 type="datetime-local"
 value={form.start_date}
 onChange={(e) => setForm({ ...form, start_date: e.target.value })}
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">End <span className="text-destructive">*</span></label>
 <input
 type="datetime-local"
 value={form.end_date}
 onChange={(e) => setForm({ ...form, end_date: e.target.value })}
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
 />
 </div>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
 <button
 onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM); }}
 className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleAddEvent}
 disabled={createEvent.isPending || !form.title || !form.start_date || !form.end_date}
 className="px-4 py-2 text-sm font-medium text-brand-foreground bg-brand rounded-lg hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
 >
 {createEvent.isPending ? (
 <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
 ) : (
 <><Calendar className="w-4 h-4" /> Add Event</>
 )}
 </button>
 </div>
 </div>
 </div>
 )}
 </DashboardLayout>
 );
}
