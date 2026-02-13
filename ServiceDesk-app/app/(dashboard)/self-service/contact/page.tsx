'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Phone, Mail, MessageSquare, Clock, MapPin, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function ContactSupportPage() {
  const { locale } = useLanguage();

  const contactMethods = [
    {
      icon: Phone,
      title: locale === 'ar' ? 'الهاتف' : 'Phone',
      value: '+966 11 XXX XXXX',
      desc: locale === 'ar' ? 'للحالات العاجلة' : 'For urgent issues',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: Mail,
      title: locale === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: 'support@company.com',
      desc: locale === 'ar' ? 'الرد خلال 24 ساعة' : 'Response within 24 hours',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: MessageSquare,
      title: locale === 'ar' ? 'الدردشة المباشرة' : 'Live Chat',
      value: locale === 'ar' ? 'متاح الآن' : 'Available Now',
      desc: locale === 'ar' ? 'تحدث مع فريق الدعم' : 'Chat with support team',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const workingHours = [
    { day: locale === 'ar' ? 'الأحد - الخميس' : 'Sunday - Thursday', hours: '8:00 AM - 5:00 PM' },
    { day: locale === 'ar' ? 'الجمعة' : 'Friday', hours: locale === 'ar' ? 'مغلق' : 'Closed' },
    { day: locale === 'ar' ? 'السبت' : 'Saturday', hours: locale === 'ar' ? 'مغلق' : 'Closed' },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/self-service">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Headphones className="h-6 w-6 text-purple-500" />
              {locale === 'ar' ? 'اتصل بالدعم' : 'Contact Support'}
            </h1>
            <p className="text-muted-foreground">
              {locale === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help you'}
            </p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-full ${method.color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="font-medium text-primary">{method.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{method.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Working Hours & Location */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {locale === 'ar' ? 'ساعات العمل' : 'Working Hours'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workingHours.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-muted-foreground">{item.day}</span>
                    <span className="font-medium">{item.hours}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {locale === 'ar' ? 'الموقع' : 'Location'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {locale === 'ar' 
                  ? 'مبنى تقنية المعلومات، الطابق الثاني، غرفة 201'
                  : 'IT Building, 2nd Floor, Room 201'}
              </p>
              <p className="text-sm text-muted-foreground">
                {locale === 'ar'
                  ? 'للزيارات الشخصية، يرجى حجز موعد مسبقاً'
                  : 'For in-person visits, please schedule an appointment'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Support */}
        <Card className="mt-6 border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {locale === 'ar' ? 'الدعم الطارئ' : 'Emergency Support'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? 'للحالات الحرجة التي تؤثر على العمل بشكل كامل'
                : 'For critical issues affecting business operations'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">+966 11 XXX XXXX</p>
            <p className="text-sm text-muted-foreground mt-2">
              {locale === 'ar' ? 'متاح 24/7' : 'Available 24/7'}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
