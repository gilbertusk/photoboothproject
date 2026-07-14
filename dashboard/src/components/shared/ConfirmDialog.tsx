import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'default' | 'destructive'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = 'Apakah Anda yakin ingin melakukan tindakan ini? Tindakan ini tidak dapat dibatalkan.',
  confirmText = 'Hapus',
  cancelText = 'Batal',
  isLoading = false,
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-border text-foreground hover:bg-secondary"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={onConfirm}
            disabled={isLoading}
            className="shadow-sm shadow-destructive/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
export default ConfirmDialog
