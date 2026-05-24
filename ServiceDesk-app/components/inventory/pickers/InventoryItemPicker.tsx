'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Package, Search, Loader2, ChevronDown, X } from 'lucide-react';
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
import { useInventorySearch } from '@/hooks/inventory/useInventorySearch';
import type { InventoryItem } from '@/types';

interface InventoryItemPickerProps {
  value?: string;
  onChange: (value: string, item?: InventoryItem) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  groupFilter?: string;
}

/**
 * Searchable item picker using cmdk Command + Popover.
 * Features server-side search with 300ms debounce, item summary card.
 */
export function InventoryItemPicker({
  value,
  onChange,
  placeholder = 'Search items...',
  disabled,
  className,
  groupFilter,
}: InventoryItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { items, isLoading, isFetching, searchTerm, setSearchTerm } =
    useInventorySearch({
      groupName: groupFilter,
      enabled: open,
    });

  // Debounced search input
  const handleSearch = useCallback(
    (term: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchTerm(term);
      }, 300);
    },
    [setSearchTerm],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Try to find selected item from search results if value is set
  useEffect(() => {
    if (value && !selectedItem) {
      const found = items.find((i) => (i.id || i._id) === value);
      if (found) setSelectedItem(found);
    }
  }, [value, items, selectedItem]);

  const handleSelect = (item: InventoryItem) => {
    const id = item.id || item._id || '';
    setSelectedItem(item);
    onChange(id, item);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(null);
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
            'w-full justify-between h-auto min-h-9 px-3 py-2 font-normal',
            !selectedItem && 'text-muted-foreground',
            className,
          )}
        >
          {selectedItem ? (
            <div className="flex items-center gap-2 text-left min-w-0">
              <Package className="w-4 h-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <span className="font-medium text-foreground text-sm">
                  {selectedItem.partNo}
                </span>
                <span className="text-muted-foreground text-xs ml-1.5 truncate">
                  {selectedItem.partDescription}
                </span>
              </div>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              {placeholder}
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {selectedItem && (
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

      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by part no, name, or group..."
            onValueChange={handleSearch}
          />
          <CommandList>
            {isLoading || isFetching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <CommandEmpty>
                {searchTerm
                  ? 'No items found. Try a different search.'
                  : 'Type to search for items.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => {
                  const id = item.id || item._id || '';
                  const isSelected = value === id;
                  return (
                    <CommandItem
                      key={id}
                      value={id}
                      onSelect={() => handleSelect(item)}
                      className={cn(isSelected && 'bg-accent')}
                    >
                      <Package className="w-4 h-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.partNo}</span>
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {item.groupName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.partDescription}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {item.uom}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
