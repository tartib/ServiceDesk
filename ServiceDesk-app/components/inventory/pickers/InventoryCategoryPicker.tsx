'use client';

import { useState, useMemo } from 'react';
import { Tag, ChevronDown, X, Check } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import type { InventoryItem } from '@/types';

interface InventoryCategoryPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable category picker derived from distinct groupName values.
 */
export function InventoryCategoryPicker({
  value,
  onChange,
  placeholder = 'Select category...',
  disabled,
  className,
}: InventoryCategoryPickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { data: itemsData } = useInventoryItems();

  const categories: string[] = useMemo(() => {
    const raw = itemsData as { data?: { items?: InventoryItem[] } } | undefined;
    const items = raw?.data?.items ?? [];
    const groups = new Set(items.map((i) => i.groupName).filter(Boolean));
    return Array.from(groups).sort();
  }, [itemsData]);

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
            !value && 'text-muted-foreground',
            className,
          )}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <Tag className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{value}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {placeholder}
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {value && (
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

      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('inventory.actions.search')} />
          <CommandList>
            <CommandEmpty>{t('inventory.messages.noItems')}</CommandEmpty>
            <CommandGroup>
              {categories.map((cat) => (
                <CommandItem
                  key={cat}
                  value={cat}
                  onSelect={() => {
                    onChange(cat);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('w-4 h-4', value === cat ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-sm">{cat}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
