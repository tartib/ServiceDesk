'use client';

import { Search, Filter, ChevronDown, MoreHorizontal, Settings, BarChart2, GitBranch } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AssigneeFilter, { Assignee } from './AssigneeFilter';

interface FilterOption {
 id: string;
 label: string;
 onClick?: () => void;
}

interface MemberData {
 _id: string;
 name?: string;
 email?: string;
 profile?: {
 firstName?: string;
 lastName?: string;
 avatar?: string;
 };
}

const avatarColors = [
 'bg-brand',
 'bg-info',
 'bg-success',
 'bg-warning',
 'bg-destructive',
 'bg-success',
 'bg-info',
 'bg-destructive',
 'bg-info',
 'bg-warning',
];

function getInitials(member: MemberData): string {
 const first = member.profile?.firstName?.trim();
 const last = member.profile?.lastName?.trim();
 if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
 if (first) return first.slice(0, 2).toUpperCase();
 if (last) return last.slice(0, 2).toUpperCase();
 if (member.name) {
 const parts = member.name.trim().split(/\s+/);
 if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
 return parts[0].slice(0, 2).toUpperCase();
 }
 if (member.email) return member.email[0].toUpperCase();
 return '?';
}

function getMemberDisplayName(member: MemberData): string {
 const first = member.profile?.firstName?.trim();
 const last = member.profile?.lastName?.trim();
 if (first && last) return `${first} ${last}`;
 if (first) return first;
 if (last) return last;
 if (member.name) return member.name;
 if (member.email) return member.email;
 return 'Unknown';
}

function getAvatarColor(index: number): string {
 return avatarColors[index % avatarColors.length];
}

interface ProjectToolbarProps {
 searchPlaceholder?: string;
 searchValue?: string;
 onSearchChange?: (value: string) => void;
 filters?: FilterOption[];
 showAvatars?: boolean;
 avatars?: { initials: string; color: string }[];
 members?: MemberData[];
 maxVisibleMembers?: number;
 extraCount?: number;
 rightActions?: React.ReactNode;
 primaryAction?: {
 label: string;
 onClick: () => void;
 disabled?: boolean;
 };
 showSettings?: boolean;
 showStats?: boolean;
 showBranch?: boolean;
 // Assignee filter props
 assignees?: Assignee[];
 selectedAssignees?: string[];
 onAssigneeFilterChange?: (selectedIds: string[]) => void;
 showAssigneeFilter?: boolean;
}

export default function ProjectToolbar({
 searchPlaceholder,
 searchValue = '',
 onSearchChange,
 filters = [],
 showAvatars = true,
 avatars,
 members = [],
 maxVisibleMembers = 5,
 extraCount,
 rightActions,
 primaryAction,
 showSettings = true,
 showStats = false,
 showBranch = false,
 // Assignee filter
 assignees = [],
 selectedAssignees = [],
 onAssigneeFilterChange,
 showAssigneeFilter = false,
}: ProjectToolbarProps) {
 const { t } = useLanguage();
 return (
 <div className="bg-background px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
 {/* Left Section */}
 <div className="flex flex-wrap items-center gap-2 sm:gap-3">
 {/* Search */}
 <div className="relative flex-1 sm:flex-none">
 <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder={searchPlaceholder || t('projects.common.search')}
 value={searchValue}
 onChange={(e) => onSearchChange?.(e.target.value)}
 className="w-full sm:w-32 lg:w-40 bg-muted/50 border border-border rounded-lg px-3 py-1.5 ltr:pl-9 rtl:pr-9 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-ring transition-colors"
 />
 </div>

 {/* Assignee Filter */}
 {showAssigneeFilter && onAssigneeFilterChange && (
 <AssigneeFilter
 assignees={assignees}
 selectedAssignees={selectedAssignees}
 onSelectionChange={onAssigneeFilterChange}
 includeUnassigned={true}
 maxVisible={5}
 />
 )}

 {/* Member Avatars - Hidden on mobile (shown when assignee filter is not active) */}
 {showAvatars && !showAssigneeFilter && (() => {
 const hasMembers = members.length > 0;
 const visibleMembers = hasMembers ? members.slice(0, maxVisibleMembers) : [];
 const remaining = hasMembers
 ? members.length - maxVisibleMembers
 : (extraCount ?? 0);
 const fallbackAvatars = avatars || [];

 if (!hasMembers && fallbackAvatars.length === 0) return null;

 return (
 <div className="hidden sm:flex items-center">
 {hasMembers ? (
 <div className="flex items-center -space-x-1.5">
 {visibleMembers.map((member, index) => (
 <div
 key={member._id}
 className="relative group/avatar"
 >
 {member.profile?.avatar ? (
 <img
 src={member.profile.avatar}
 alt={getMemberDisplayName(member)}
 className="w-8 h-8 rounded-full border-2 border-white object-cover ring-0 hover:ring-2 hover:ring-brand-border transition-all hover:z-10"
 />
 ) : (
 <div
 className={`w-8 h-8 rounded-full ${getAvatarColor(index)} border-2 border-white flex items-center justify-center text-[11px] text-white font-semibold ring-0 hover:ring-2 hover:ring-brand-border transition-all hover:z-10 cursor-default`}
 >
 {getInitials(member)}
 </div>
 )}
 {/* Tooltip */}
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-foreground text-background text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all pointer-events-none z-50 shadow-lg">
 {getMemberDisplayName(member)}
 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-foreground" />
 </div>
 </div>
 ))}
 {remaining > 0 && (
 <div className="w-8 h-8 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[11px] text-muted-foreground font-semibold cursor-default hover:bg-muted transition-colors">
 +{remaining}
 </div>
 )}
 </div>
 ) : (
 <div className="flex items-center -space-x-1.5">
 {fallbackAvatars.map((avatar, index) => (
 <div
 key={index}
 className={`w-8 h-8 rounded-full ${avatar.color} border-2 border-white flex items-center justify-center text-[11px] text-white font-semibold`}
 >
 {avatar.initials}
 </div>
 ))}
 {(extraCount ?? 0) > 0 && (
 <div className="w-8 h-8 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[11px] text-muted-foreground font-semibold">
 +{extraCount}
 </div>
 )}
 </div>
 )}
 </div>
 );
 })()}

 {/* Filters */}
 {filters.length > 0 && (
 <div className="flex items-center gap-2">
 {filters.map((filter) => (
 <button
 key={filter.id}
 onClick={filter.onClick}
 className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-foreground border border-border hover:border-border rounded-lg text-sm transition-colors"
 >
 {filter.id === 'filter' && <Filter className="h-4 w-4" />}
 {filter.label}
 {filter.id !== 'filter' && <ChevronDown className="h-3 w-3" />}
 </button>
 ))}
 </div>
 )}

 {/* Default Filter Button */}
 {filters.length === 0 && (
 <button className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground border border-border hover:border-border rounded-lg text-sm transition-colors">
 <Filter className="h-4 w-4" />
 <span className="hidden sm:inline">{t('projects.common.filter')}</span>
 </button>
 )}
 </div>

 {/* Right Section */}
 <div className="flex items-center gap-2 sm:gap-3">
 {rightActions}

 {/* Primary Action */}
 {primaryAction && (
 <button
 onClick={primaryAction.onClick}
 disabled={primaryAction.disabled}
 className="px-4 py-1.5 bg-brand hover:bg-brand-strong disabled:bg-brand-soft disabled:cursor-not-allowed text-brand-foreground rounded-lg text-sm font-medium transition-colors"
 >
 {primaryAction.label}
 </button>
 )}

 {/* Stats */}
 {showStats && (
 <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
 <BarChart2 className="h-4 w-4" />
 </button>
 )}

 {/* Branch */}
 {showBranch && (
 <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
 <GitBranch className="h-4 w-4" />
 </button>
 )}

 {/* Settings */}
 {showSettings && (
 <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
 <Settings className="h-4 w-4" />
 </button>
 )}

 {/* More Options */}
 <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </div>
 </div>
 );
}
