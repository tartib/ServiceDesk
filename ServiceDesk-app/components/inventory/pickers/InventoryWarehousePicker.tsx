'use client';

import { useState, useEffect } from 'react';
import { Warehouse, ChevronDown, X, Check } from 'lucide-react';
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
import { useWarehouses } from '@/hooks/useWarehouses';
import type { InvWarehouse } from '@/types';

interface InventoryWarehousePickerProps {
  value?: string;
  onChange: (value: string, warehouse?: InvWarehouse) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  excludeId?: string;
}

/**
 * Searchable warehouse picker using cmdk.
 */
export function InventoryWarehousePicker({
  value,
  onChange,
  placeholder = 'Select warehouse...',
  disabled,
  className,
  excludeId,
}: InventoryWarehousePickerProps) {
  const [open, setOpen] = useState(false);
  const { data: whData } = useWarehouses();

  const warehouses: InvWarehouse[] = (() => {
    const raw = whData as { data?: { warehouses?: InvWarehouse[] } } | undefined;
    const list = raw?.data?.warehouses ?? [];
    return excludeId ? list.filter((w) => (w.id || w._id) !== excludeId) : list;
  })();

  const selected = warehouses.find((w) => (w.id || w._id) === value);

  const handleSelect = (warehouse: InvWarehouse) => {
    const id = warehouse.id || warehouse._id || '';
    onChange(id, warehouse);
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
              <Warehouse className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{selected.warehouseName}</span>
              {selected.code && (
                <span className="text-xs text-muted-foreground">({selected.code})</span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Warehouse className="w-4 h-4" />
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
          <CommandInput placeholder="Search warehouses..." />
          <CommandList>
            <CommandEmpty>No warehouses found.</CommandEmpty>
            <CommandGroup>
              {warehouses.map((wh) => {
                const id = wh.id || wh._id || '';
                const isSelected = value === id;
                return (
                  <CommandItem
                    key={id}
                    value={`${wh.warehouseName} ${wh.code || ''}`}
                    onSelect={() => handleSelect(wh)}
                  >
                    <Check className={cn('w-4 h-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm">{wh.warehouseName}</span>
                      {wh.code && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          {wh.code}
                        </span>
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
