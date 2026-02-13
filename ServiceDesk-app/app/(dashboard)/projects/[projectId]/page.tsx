'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  useEffect(() => {
    // Redirect to board page
    if (projectId) {
      router.replace(`/projects/${projectId}/board`);
    }
  }, [projectId, router]);

  return (
    <div className="flex items-center justify-center h-full bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
