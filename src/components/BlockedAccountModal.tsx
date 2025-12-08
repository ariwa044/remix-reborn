import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BlockedAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlockedAccountModal = ({ isOpen, onClose }: BlockedAccountModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 bg-destructive/10 rounded-full p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-center text-xl">Payment Pending</DialogTitle>
          <DialogDescription className="text-center space-y-4">
            <p className="text-destructive font-semibold">
              This account was suspended due to illegal activities.
            </p>
            <p>
              Please message customer support for assistance.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
