'use client';

import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useDeleteServiceCatalogItem } from '@/hooks/useServiceCatalog';

interface DeleteServiceDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 serviceId: string | null;
 serviceName: string;
 onSuccess?: () => void;
}

export default function DeleteServiceDialog({
 open,
 onOpenChange,
 serviceId,
 serviceName,
 onSuccess,
}: DeleteServiceDialogProps) {
 const deleteMutation = useDeleteServiceCatalogItem();

 const handleDelete = async () => {
 if (!serviceId) return;
 try {
 await deleteMutation.mutateAsync(serviceId);
 onOpenChange(false);
 onSuccess?.();
 } catch (error) {
 console.error('Failed to delete service:', error);
 }
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader>
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive-soft">
 <AlertTriangle className="h-5 w-5 text-destructive" />
 </div>
 <div>
 <DialogTitle>Delete Service</DialogTitle>
 <DialogDescription>This action cannot be undone</DialogDescription>
 </div>
 </div>
 </DialogHeader>

 <div className="py-4">
 <p className="text-sm text-muted-foreground">
 Are you sure you want to delete{' '}
 <span className="font-semibold text-foreground">{serviceName}</span>?
 This will permanently remove the service from the catalog.
 </p>
 </div>

 <DialogFooter>
 <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
 Cancel
 </Button>
 <Button
 type="button"
 variant="destructive"
 onClick={handleDelete}
 disabled={deleteMutation.isPending}
 className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
 >
 {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
 Delete
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}
