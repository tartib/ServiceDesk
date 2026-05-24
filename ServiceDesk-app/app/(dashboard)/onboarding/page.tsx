'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import OnboardingWizard from '@/components/workspace/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <DashboardLayout>
      <OnboardingWizard />
    </DashboardLayout>
  );
}
