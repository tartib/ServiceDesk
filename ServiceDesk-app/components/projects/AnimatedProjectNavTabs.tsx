'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  ListTodo,
  Calendar,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react';

interface TabItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface AnimatedProjectNavTabsProps {
  projectId: string;
}

export default function AnimatedProjectNavTabs({ projectId }: AnimatedProjectNavTabsProps) {
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabs: TabItem[] = [
    { label: 'Board', href: `/projects/${projectId}/board`, icon: <LayoutGrid className="h-4 w-4" /> },
    { label: 'Backlog', href: `/projects/${projectId}/backlog`, icon: <ListTodo className="h-4 w-4" /> },
    { label: 'Planning', href: `/projects/${projectId}/planning`, icon: <Calendar className="h-4 w-4" /> },
    { label: 'Reports', href: `/projects/${projectId}/reports`, icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'Team', href: `/projects/${projectId}/team`, icon: <Users className="h-4 w-4" /> },
    { label: 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onMouseEnter={() => setHoveredTab(tab.href)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                  transition-all duration-300 ease-out
                  whitespace-nowrap
                  ${active
                    ? 'text-blue-600'
                    : hoveredTab === tab.href
                    ? 'text-gray-900'
                    : 'text-gray-600'
                  }
                  hover:text-gray-900
                  group
                `}
              >
                {/* Icon with animation */}
                <span className={`
                  transition-transform duration-300
                  ${active ? 'scale-110' : hoveredTab === tab.href ? 'scale-105' : 'scale-100'}
                  ${active ? 'text-blue-600' : hoveredTab === tab.href ? 'text-gray-700' : 'text-gray-500'}
                `}>
                  {tab.icon}
                </span>

                {/* Label */}
                <span className={`
                  transition-all duration-300
                  ${active ? 'font-semibold' : 'font-medium'}
                `}>
                  {tab.label}
                </span>

                {/* Active indicator - animated underline */}
                {active && (
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600
                    transition-all duration-300 ease-out
                    origin-left
                  `} />
                )}

                {/* Hover effect - subtle background */}
                {hoveredTab === tab.href && !active && (
                  <div className={`
                    absolute inset-0 bg-gray-100 opacity-40 rounded-t-lg
                    transition-opacity duration-300
                    -z-10
                  `} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
