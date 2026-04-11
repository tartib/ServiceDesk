'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart3,
  ArrowLeft,
  Send,
  CheckCircle,
  Eye,
  MousePointerClick,
  Mail,
  MessageSquare,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { useAnalyticsOverview, useAnalyticsChannels } from '@/hooks/useCampaigns';

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: overview, isLoading } = useAnalyticsOverview();
  const { data: channels } = useAnalyticsChannels();

  const channelIcons: Record<string, React.ReactNode> = {
    email: <Mail className="h-5 w-5 text-blue-500" />,
    sms: <MessageSquare className="h-5 w-5 text-green-500" />,
    push: <Bell className="h-5 w-5 text-purple-500" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-foreground">Campaign Analytics</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total Sent</span>
              <div className="p-2 rounded-lg bg-blue-100">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-foreground">
              {overview?.totalSent?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Delivered</span>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-green-600">
              {overview?.totalDelivered?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {overview?.avgDeliveryRate?.toFixed(1) || 0}% delivery rate
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Opened</span>
              <div className="p-2 rounded-lg bg-purple-100">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-purple-600">
              {overview?.totalOpened?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {overview?.avgOpenRate?.toFixed(1) || 0}% avg open rate
            </p>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Clicked</span>
              <div className="p-2 rounded-lg bg-orange-100">
                <MousePointerClick className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-orange-600">
              {overview?.totalClicked?.toLocaleString() || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {overview?.avgClickRate?.toFixed(1) || 0}% avg click rate
            </p>
          </div>
        </div>

        {/* Failure */}
        <div className="bg-card rounded-xl p-6 border border-border mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <span className="text-sm text-muted-foreground">Total Campaigns</span>
              <p className="text-2xl font-bold mt-1">{overview?.totalCampaigns || 0}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Failed</span>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {overview?.totalFailed?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Delivery Rate</span>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {overview?.avgDeliveryRate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        {channels && channels.length > 0 && (
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Channel Performance
            </h2>
            <div className="space-y-4">
              {channels.map((ch) => (
                <div key={ch.channel} className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-3 w-32">
                    {channelIcons[ch.channel] || <Mail className="h-5 w-5" />}
                    <span className="font-medium capitalize">{ch.channel}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sent</span>
                      <p className="font-semibold">{ch.totalSent?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delivered</span>
                      <p className="font-semibold text-green-600">{ch.totalDelivered?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Open Rate</span>
                      <p className="font-semibold text-purple-600">{ch.openRate?.toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Click Rate</span>
                      <p className="font-semibold text-orange-600">{ch.clickRate?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
