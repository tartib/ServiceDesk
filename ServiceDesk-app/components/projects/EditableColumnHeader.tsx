'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface EditableColumnHeaderProps {
 columnId: string;
 initialName: string;
 onSave: (columnId: string, newName: string) => Promise<void>;
 count: number;
}

export function EditableColumnHeader({ columnId, initialName, onSave, count }: EditableColumnHeaderProps) {
 const [isEditing, setIsEditing] = useState(false);
 const [value, setValue] = useState(initialName);
 const [isSaving, setIsSaving] = useState(false);
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
 if (isEditing && inputRef.current) {
 inputRef.current.focus();
 inputRef.current.select();
 }
 }, [isEditing]);

 const handleSave = async () => {
 if (value.trim() === '' || value === initialName) {
 setValue(initialName);
 setIsEditing(false);
 return;
 }

 setIsSaving(true);
 try {
 await onSave(columnId, value.trim());
 setIsEditing(false);
 } catch (error) {
 console.error('Failed to save column name:', error);
 setValue(initialName);
 } finally {
 setIsSaving(false);
 }
 };

 const handleCancel = () => {
 setValue(initialName);
 setIsEditing(false);
 };

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === 'Enter') {
 handleSave();
 } else if (e.key === 'Escape') {
 handleCancel();
 }
 };

 if (isEditing) {
 return (
 <div className="flex items-center gap-2">
 <input
 ref={inputRef}
 type="text"
 value={value}
 onChange={(e) => setValue(e.target.value)}
 onKeyDown={handleKeyDown}
 disabled={isSaving}
 className="flex-1 px-2 py-1 text-sm font-medium text-foreground uppercase tracking-wide border border-brand rounded focus:outline-none focus:ring-1 focus:ring-ring"
 />
 <button
 onClick={handleSave}
 disabled={isSaving}
 className="p-1 text-success hover:bg-success-soft rounded transition-colors"
 >
 <Check className="h-4 w-4" />
 </button>
 <button
 onClick={handleCancel}
 disabled={isSaving}
 className="p-1 text-destructive hover:bg-destructive-soft rounded transition-colors"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 );
 }

 return (
 <div className="flex items-center gap-2">
 <span
 onDoubleClick={() => setIsEditing(true)}
 className="font-medium text-foreground text-sm uppercase tracking-wide cursor-pointer hover:text-foreground"
 >
 {initialName}
 </span>
 <span className="text-sm text-muted-foreground">{count}</span>
 </div>
 );
}
