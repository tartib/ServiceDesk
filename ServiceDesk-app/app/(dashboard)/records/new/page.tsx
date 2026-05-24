'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { CreateRequestFlow } from '@/components/records';
import { useSearchParams } from 'next/navigation';
import type { WorkspaceType } from '@/types';

export default function NewRecordPage() {
  const searchParams = useSearchParams();
  const requestTypeId = searchParams.get('requestTypeId') ?? undefined;
  const workspaceType = (searchParams.get('workspaceType') as WorkspaceType) ?? undefined;

  return (
    <DashboardLayout>
      <div className="py-8 px-4">
        <CreateRequestFlow
          requestTypeId={requestTypeId}
          workspaceType={workspaceType}
        />
      </div>
    </DashboardLayout>
  );
}
