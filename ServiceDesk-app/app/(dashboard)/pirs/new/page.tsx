'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreatePIR } from '@/hooks/usePIR';
import { RCAMethod } from '@/types/itsm';
import { ArrowLeft, ClipboardList, Plus, X } from 'lucide-react';

const RCA_METHODS: { value: RCAMethod; label: string; desc: string }[] = [
 { value: RCAMethod.FIVE_WHYS, label: '5 Whys', desc: 'Ask "why" repeatedly to trace the root cause' },
 { value: RCAMethod.FISHBONE, label: 'Fishbone (Ishikawa)', desc: 'Categorize causes using a cause-effect diagram' },
 { value: RCAMethod.TIMELINE, label: 'Timeline Analysis', desc: 'Reconstruct the sequence of events' },
 { value: RCAMethod.FAULT_TREE, label: 'Fault Tree Analysis', desc: 'Logical top-down diagram of failure modes' },
];

export default function NewPIRPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const prefillIncidentId = searchParams.get('incident_id') ?? '';

 const createPIR = useCreatePIR();

 const [incidentId, setIncidentId] = useState(prefillIncidentId);
 const [rcaMethod, setRcaMethod] = useState<RCAMethod | ''>('');
 const [reviewDate, setReviewDate] = useState('');
 const [participants, setParticipants] = useState<{ name: string; role: string }[]>([]);
 const [newParticipant, setNewParticipant] = useState({ name: '', role: '' });
 const [showAddParticipant, setShowAddParticipant] = useState(false);

 const addParticipant = () => {
 if (!newParticipant.name.trim()) return;
 setParticipants((prev) => [...prev, newParticipant]);
 setNewParticipant({ name: '', role: '' });
 setShowAddParticipant(false);
 };

 const removeParticipant = (i: number) => {
 setParticipants((prev) => prev.filter((_, idx) => idx !== i));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!incidentId.trim()) return;
 createPIR.mutate(
 {
 incident_id: incidentId.trim(),
 rca_method: rcaMethod || undefined,
 review_date: reviewDate || undefined,
 participants: participants.map((p, i) => ({ id: `p-${i}`, name: p.name, role: p.role || undefined })),
 },
 {
 onSuccess: (pir) => {
 router.push(`/pirs/${pir._id}`);
 },
 }
 );
 };

 return (
 <DashboardLayout>
 <div className="max-w-2xl mx-auto space-y-6">
 {/* Header */}
 <div className="flex items-center gap-4">
 <Link href="/pirs" className="p-2 hover:bg-accent rounded-lg transition-colors">
 <ArrowLeft className="w-5 h-5" />
 </Link>
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-info-soft rounded-lg flex items-center justify-center">
 <ClipboardList className="w-5 h-5 text-info" />
 </div>
 <div>
 <h1 className="text-xl font-bold text-foreground">Start Post-Incident Review</h1>
 <p className="text-sm text-muted-foreground">Create a PIR for a resolved major incident</p>
 </div>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Incident ID */}
 <Card className="p-6">
 <h2 className="font-semibold text-foreground mb-4">Incident Reference</h2>
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Incident ID <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 value={incidentId}
 onChange={(e) => setIncidentId(e.target.value)}
 placeholder="e.g. INC-20240001"
 required
 className="w-full px-3 py-2 border border-input rounded-lg bg-card text-sm"
 />
 <p className="text-xs text-muted-foreground mt-1">The incident this PIR relates to</p>
 </div>
 </Card>

 {/* RCA Method */}
 <Card className="p-6">
 <h2 className="font-semibold text-foreground mb-4">RCA Method</h2>
 <div className="grid grid-cols-2 gap-3">
 {RCA_METHODS.map((m) => (
 <button
 key={m.value}
 type="button"
 onClick={() => setRcaMethod(rcaMethod === m.value ? '' : m.value)}
 className={`p-4 rounded-xl border-2 text-left transition-all ${
 rcaMethod === m.value
 ? 'border-brand bg-brand-surface'
 : 'border-border hover:border-muted-foreground'
 }`}
 >
 <p className="font-medium text-sm text-foreground">{m.label}</p>
 <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
 </button>
 ))}
 </div>
 </Card>

 {/* Schedule & Participants */}
 <Card className="p-6 space-y-5">
 <h2 className="font-semibold text-foreground">Review Session</h2>

 <div>
 <label className="block text-sm font-medium text-foreground mb-1">Scheduled Review Date</label>
 <input
 type="datetime-local"
 value={reviewDate}
 onChange={(e) => setReviewDate(e.target.value)}
 className="px-3 py-2 border border-input rounded-lg bg-card text-sm"
 />
 </div>

 <div>
 <div className="flex items-center justify-between mb-3">
 <label className="text-sm font-medium text-foreground">Participants</label>
 <button
 type="button"
 onClick={() => setShowAddParticipant(true)}
 className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-strong font-medium"
 >
 <Plus className="w-3.5 h-3.5" /> Add
 </button>
 </div>

 {showAddParticipant && (
 <div className="mb-3 p-3 bg-muted rounded-lg border border-border space-y-2">
 <div className="grid grid-cols-2 gap-2">
 <input
 type="text"
 value={newParticipant.name}
 onChange={(e) => setNewParticipant((p) => ({ ...p, name: e.target.value }))}
 placeholder="Name"
 className="px-3 py-1.5 border border-input rounded-lg text-sm bg-card"
 />
 <input
 type="text"
 value={newParticipant.role}
 onChange={(e) => setNewParticipant((p) => ({ ...p, role: e.target.value }))}
 placeholder="Role (optional)"
 className="px-3 py-1.5 border border-input rounded-lg text-sm bg-card"
 />
 </div>
 <div className="flex gap-2">
 <Button type="button" size="sm" onClick={addParticipant}>Add</Button>
 <Button type="button" size="sm" variant="outline" onClick={() => setShowAddParticipant(false)}>Cancel</Button>
 </div>
 </div>
 )}

 {participants.length > 0 ? (
 <div className="space-y-2">
 {participants.map((p, i) => (
 <div key={i} className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
 <div>
 <span className="font-medium text-sm text-foreground">{p.name}</span>
 {p.role && <span className="text-xs text-muted-foreground ml-2">{p.role}</span>}
 </div>
 <button type="button" onClick={() => removeParticipant(i)} className="text-muted-foreground hover:text-destructive transition-colors">
 <X className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground italic">No participants added yet</p>
 )}
 </div>
 </Card>

 {/* Submit */}
 <div className="flex items-center gap-3">
 <Button
 type="submit"
 disabled={createPIR.isPending || !incidentId.trim()}
 className="flex-1"
 size="lg"
 >
 {createPIR.isPending ? 'Creating PIR...' : 'Create PIR'}
 </Button>
 <Button variant="outline" size="lg" asChild>
 <Link href="/pirs">
 Cancel
 </Link>
 </Button>
 </div>
 </form>
 </div>
 </DashboardLayout>
 );
}
