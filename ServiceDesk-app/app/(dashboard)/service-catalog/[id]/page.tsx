'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Info,
  Star,
  Users,
  Tag,
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Service {
  _id: string;
  serviceId: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  shortDescription?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  icon?: string;
  color?: string;
  featured: boolean;
  approvalRequired: boolean;
  estimatedFulfillmentTime?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requestForm?: {
    fields: Array<{
      fieldId: string;
      label: string;
      labelAr?: string;
      type: string;
      required: boolean;
      options?: Array<{ value: string; label: string; labelAr?: string }>;
    }>;
  };
  stats?: {
    totalRequests: number;
    completedRequests: number;
    avgFulfillmentTime: number;
    satisfactionScore: number;
  };
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const serviceId = params.id as string;

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ data: Service }>(`/api/v2/itsm/services/${serviceId}`);
        setService(response.data);
      } catch (error) {
        console.error('Failed to fetch service:', error);
        toast.error('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = service?.requestForm?.fields.filter((f) => f.required) || [];
    const missingFields = requiredFields.filter((f) => !formData[f.fieldId]);

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/v2/itsm/requests', {
        serviceId: service?.serviceId,
        formData,
        source: 'web',
      });

      toast.success('Service request submitted successfully!');

      router.push('/service-catalog');
    } catch (error) {
      console.error('Failed to submit request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (field: NonNullable<Service['requestForm']>['fields'][0]) => {
    const value = formData[field.fieldId] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.fieldId}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.value })}
            className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={`Enter ${field.label}`}
          />
        );
      case 'select':
        return (
          <select
            id={field.fieldId}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt: { value: string; label: string; labelAr?: string }) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            id={field.fieldId}
            type={field.type}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={`Enter ${field.label}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-lg mb-2">Service Not Found</CardTitle>
            <CardDescription className="mb-4">
              The service you are looking for does not exist or has been removed.
            </CardDescription>
            <Button onClick={() => router.push('/service-catalog')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/service-catalog')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Catalog
        </Button>

        {/* Service Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center ${service.color || 'bg-blue-100'}`}
            >
              <FileText className="w-8 h-8 text-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{service.name}</h1>
                {service.featured && (
                  <Badge variant="default" className="bg-yellow-500">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-2">
                {service.shortDescription || service.description}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{service.category}</Badge>
                {service.subcategory && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {service.subcategory}
                  </Badge>
                )}
                {service.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="request">Request Form</TabsTrigger>
              </TabsList>

              <TabsContent value="description">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {service.description}
                    </p>

                    {service.descriptionAr && (
                      <>
                        <Separator className="my-4" />
                        <p className="text-muted-foreground whitespace-pre-wrap" dir="rtl">
                          {service.descriptionAr}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="request">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Request Form</CardTitle>
                    <CardDescription>
                      Fill in the details below to request this service.
                      {service.approvalRequired && (
                        <span className="block mt-1 text-orange-600">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          This service requires approval before processing.
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {service.requestForm?.fields?.length ? (
                      <div className="space-y-4">
                        {service.requestForm.fields.map((field) => (
                          <div key={field.fieldId}>
                            <label
                              htmlFor={field.fieldId}
                              className="block text-sm font-medium text-foreground mb-1"
                            >
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {renderFormField(field)}
                          </div>
                        ))}
                        <Button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="w-full mt-4"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Submit Request
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          This service does not require any additional information.
                        </p>
                        <Button
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Submit Request
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.estimatedFulfillmentTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Est. Time
                    </span>
                    <span className="font-medium">{service.estimatedFulfillmentTime}h</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Total Requests
                  </span>
                  <span className="font-medium">
                    {service.stats?.totalRequests || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Satisfaction
                  </span>
                  <span className="font-medium">
                    {service.stats?.satisfactionScore
                      ? `${(service.stats.satisfactionScore / 20).toFixed(1)}/5`
                      : 'N/A'}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Completed
                  </span>
                  <span className="font-medium">
                    {service.stats?.completedRequests || 0}
                  </span>
                </div>

                {service.priority && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Priority</span>
                      <Badge
                        variant={
                          service.priority === 'critical'
                            ? 'destructive'
                            : service.priority === 'high'
                            ? 'default'
                            : 'outline'
                        }
                      >
                        {service.priority}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
