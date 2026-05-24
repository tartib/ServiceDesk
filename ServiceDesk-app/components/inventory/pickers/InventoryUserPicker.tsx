'use client';

import { useState } from 'react';
import { User, ChevronDown, X, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';

interface UserOption {
  id: string;
  _id?: string;
  name: string;
  email?: string;
  department?: string;
}

interface InventoryUserPickerProps {
  value?: string;
  onChange: (value: string, user?: UserOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable user picker.
 */
export function InventoryUserPicker({
  value,
  onChange,
  placeholder = 'Select user...',
  disabled,
  className,
}: InventoryUserPickerProps) {
  const [open, setOpen] = useState(false);
  const { data: usersData } = useUsers();

  const users: UserOption[] = (() => {
    const raw = usersData as { data?: { users?: UserOption[] } } | UserOption[] | undefined;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'data' in raw) {
      const d = raw.data;
      if (d && 'users' in d && Array.isArray(d.users)) return d.users;
    }
    return [];
  })();

  const selected = users.find((u) => (u.id || u._id) === value);

  const handleSelect = (user: UserOption) => {
    const id = user.id || user._id || '';
    onChange(id, user);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between h-9 px-3 font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <User className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {placeholder}
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="p-0.5 hover:bg-muted rounded"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => {
                const id = user.id || user._id || '';
                const isSelected = value === id;
                return (
                  <CommandItem
                    key={id}
                    value={`${user.name} ${user.email || ''}`}
                    onSelect={() => handleSelect(user)}
                  >
                    <Check className={cn('w-4 h-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm">{user.name}</span>
                      {user.email && (
                        <span className="text-xs text-muted-foreground ml-1.5">{user.email}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
