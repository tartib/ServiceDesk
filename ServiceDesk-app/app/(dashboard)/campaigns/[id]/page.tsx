'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
 ArrowLeft,
 Megaphone,
 Play,
 Pause,
 XCircle,
 Send,
 Mail,
 MessageSquare,
 Bell,
 FlaskConical,
 CalendarClock,
 Users,
} from 'lucide-react';
import {
 useCampaign,
 useCampaignMessages,
 useScheduleCampaign,
 useSendCampaign,
 usePauseCampaign,
 useResumeCampaign,
 useCancelCampaign,
 useTestCampaign,
 IMessage,
} from '@/hooks/useCampaigns';

const statusColors: Record<string, string> = {
 draft: 'bg-muted text-foreground',
 scheduled: 'bg-brand-soft text-brand',
 running: 'bg-success-soft text-success',
 paused: 'bg-warning-soft text-warning',
 completed: 'bg-info-soft text-info',
 cancelled: 'bg-destructive-soft text-destructive',
};

const channelIcons: Record<string, React.ReactNode> = {
 email: <Mail className="h-5 w-5 text-brand" />,
 sms: <MessageSquare className="h-5 w-5 text-success" />,
 push: <Bell className="h-5 w-5 text-info" />,
};

const msgStatusColors: Record<string, string> = {
 pending: 'text-muted-foreground',
 sent: 'text-brand',
 delivered: 'text-success',
 opened: 'text-info',
 clicked: 'text-warning',
 bounced: 'text-destructive',
 failed: 'text-destructive',
 unsubscribed: 'text-muted-foreground',
};

export default function CampaignDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const [testEmail, setTestEmail] = useState('');
 const [showTestModal, setShowTestModal] = useState(false);
 const [messagesPage] = useState(1);

 const { data: campaign, isLoading } = useCampaign(id);
 const { data: messagesData, isLoading: messagesLoading } = useCampaignMessages(id, { page: messagesPage, limit: 20 });

 const scheduleMutation = useScheduleCampaign();
 const sendMutation = useSendCampaign();
 const pauseMutation = usePauseCampaign();
 const resumeMutation = useResumeCampaign();
 const cancelMutation = useCancelCampaign();
 const testMutation = useTestCampaign();

 const messages: IMessage[] = messagesData?.items || [];

 if (isLoading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
 </div>
 );
 }

 if (!campaign) {
 return (
 <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
 <p>Campaign not found</p>
 </div>
 );
 }

 const handleSendTest = async () => {
 if (!testEmail) return;
 await testMutation.mutateAsync({ id, recipientEmail: testEmail });
 setShowTestModal(false);
 setTestEmail('');
 };

 return (
 <div className="flex flex-col h-full bg-background">
 <div className="bg-card border-b border-border px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
 <ArrowLeft className="h-5 w-5" />
 </button>
 {channelIcons[campaign.channel] || <Megaphone className="h-6 w-6" />}
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
 <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
 {campaign.status}
 </span>
 </div>
 {campaign.description && (
 <p className="text-sm text-muted-foreground mt-0.5">{campaign.description}</p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {campaign.status === 'draft' && (
 <>
 <button
 onClick={() => setShowTestModal(true)}
 className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent"
 >
 <FlaskConical className="h-4 w-4" />
 Test
 </button>
 <button
 onClick={() => scheduleMutation.mutate({ id })}
 disabled={scheduleMutation.isPending}
 className="flex items-center gap-2 px-3 py-2 text-sm border border-brand text-brand rounded-lg hover:bg-brand-surface"
 >
 <CalendarClock className="h-4 w-4" />
 Schedule
 </button>
 <button
 onClick={() => sendMutation.mutate(id)}
 disabled={sendMutation.isPending}
 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-foreground bg-brand rounded-lg hover:bg-brand-strong"
 >
 <Send className="h-4 w-4" />
 Send Now
 </button>
 </>
 )}
 {campaign.status === 'scheduled' && (
 <button
 onClick={() => cancelMutation.mutate(id)}
 disabled={cancelMutation.isPending}
 className="flex items-center gap-2 px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive-soft"
 >
 <XCircle className="h-4 w-4" />
 Cancel
 </button>
 )}
 {campaign.status === 'running' && (
 <button
 onClick={() => pauseMutation.mutate(id)}
 disabled={pauseMutation.isPending}
 className="flex items-center gap-2 px-3 py-2 text-sm text-warning border border-warning/60 rounded-lg hover:bg-warning-soft"
 >
 <Pause className="h-4 w-4" />
 Pause
 </button>
 )}
 {campaign.status === 'paused' && (
 <>
 <button
 onClick={() => resumeMutation.mutate(id)}
 disabled={resumeMutation.isPending}
 className="flex items-center gap-2 px-3 py-2 text-sm text-success border border-success/60 rounded-lg hover:bg-success-soft"
 >
 <Play className="h-4 w-4" />
 Resume
 </button>
 <button
 onClick={() => cancelMutation.mutate(id)}
 disabled={cancelMutation.isPending}
 className="flex items-center gap-2 px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive-soft"
 >
 <XCircle className="h-4 w-4" />
 Cancel
 </button>
 </>
 )}
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 <div className="bg-card rounded-xl border border-border p-4 text-center">
 <p className="text-xs text-muted-foreground mb-1">Sent</p>
 <p className="text-2xl font-bold">{campaign.stats?.sent?.toLocaleString() || 0}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 text-center">
 <p className="text-xs text-muted-foreground mb-1">Delivered</p>
 <p className="text-2xl font-bold text-success">{campaign.stats?.delivered?.toLocaleString() || 0}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 text-center">
 <p className="text-xs text-muted-foreground mb-1">Open Rate</p>
 <p className="text-2xl font-bold text-info">{campaign.stats?.openRate?.toFixed(1) || 0}%</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 text-center">
 <p className="text-xs text-muted-foreground mb-1">Click Rate</p>
 <p className="text-2xl font-bold text-brand">{campaign.stats?.clickRate?.toFixed(1) || 0}%</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 text-center">
 <p className="text-xs text-muted-foreground mb-1">Failed</p>
 <p className="text-2xl font-bold text-destructive">{campaign.stats?.failed?.toLocaleString() || 0}</p>
 </div>
 </div>

 {/* Campaign Details */}
 <div className="bg-card rounded-xl border border-border p-6">
 <h2 className="text-lg font-semibold mb-4">Campaign Details</h2>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
 <div>
 <span className="text-muted-foreground">Channel</span>
 <p className="font-medium capitalize mt-1">{campaign.channel}</p>
 </div>
 <div>
 <span className="text-muted-foreground">Mode</span>
 <p className="font-medium capitalize mt-1">{campaign.mode}</p>
 </div>
 <div>
 <span className="text-muted-foreground">Created</span>
 <p className="font-medium mt-1">{new Date(campaign.createdAt).toLocaleString()}</p>
 </div>
 {campaign.sendAt && (
 <div>
 <span className="text-muted-foreground">Scheduled At</span>
 <p className="font-medium mt-1">{new Date(campaign.sendAt).toLocaleString()}</p>
 </div>
 )}
 {campaign.sentAt && (
 <div>
 <span className="text-muted-foreground">Sent At</span>
 <p className="font-medium mt-1">{new Date(campaign.sentAt).toLocaleString()}</p>
 </div>
 )}
 {campaign.tags && campaign.tags.length > 0 && (
 <div>
 <span className="text-muted-foreground">Tags</span>
 <div className="flex flex-wrap gap-1 mt-1">
 {campaign.tags.map((tag) => (
 <span key={tag} className="px-2 py-0.5 bg-accent rounded text-xs">{tag}</span>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Messages */}
 <div className="bg-card rounded-xl border border-border p-6">
 <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
 <Users className="h-5 w-5" />
 Delivery Messages
 </h2>
 {messagesLoading ? (
 <div className="flex items-center justify-center h-32">
 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand" />
 </div>
 ) : messages.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-8">No messages sent yet</p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border text-muted-foreground">
 <th className="text-left py-2 pr-4">Recipient</th>
 <th className="text-left py-2 pr-4">Channel</th>
 <th className="text-left py-2 pr-4">Status</th>
 <th className="text-left py-2 pr-4">Sent</th>
 <th className="text-left py-2">Delivered</th>
 </tr>
 </thead>
 <tbody>
 {messages.map((msg) => (
 <tr key={msg._id} className="border-b border-border/50">
 <td className="py-2 pr-4">{msg.recipientId}</td>
 <td className="py-2 pr-4 capitalize">{msg.channel}</td>
 <td className={`py-2 pr-4 font-medium ${msgStatusColors[msg.status] || ''}`}>
 {msg.status}
 </td>
 <td className="py-2 pr-4">{msg.sentAt ? new Date(msg.sentAt).toLocaleString() : '-'}</td>
 <td className="py-2">{msg.deliveredAt ? new Date(msg.deliveredAt).toLocaleString() : '-'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {/* Test Modal */}
 {showTestModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
 <div className="bg-card rounded-xl border border-border p-6 w-96">
 <h3 className="text-lg font-semibold mb-4">Send Test Campaign</h3>
 <input
 type="email"
 required
 value={testEmail}
 onChange={(e) => setTestEmail(e.target.value)}
 placeholder="recipient@example.com"
 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
 />
 <div className="flex justify-end gap-2">
 <button
 onClick={() => setShowTestModal(false)}
 className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent"
 >
 Cancel
 </button>
 <button
 onClick={handleSendTest}
 disabled={testMutation.isPending || !testEmail}
 className="px-4 py-2 text-sm font-medium text-brand-foreground bg-brand rounded-lg hover:bg-brand-strong disabled:opacity-50"
 >
 {testMutation.isPending ? 'Sending...' : 'Send Test'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
