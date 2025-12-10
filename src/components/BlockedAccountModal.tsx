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
            <p className="text-destructive font-semibold text-base">
              This account has been suspended due to suspicious activities.
            </p>
            <p className="text-foreground">
              Your transfer is on hold and cannot be processed at this time.
            </p>
            <p className="text-muted-foreground">
              Kindly reach out to our support center or send an email to resolve this issue.
            </p>
            <div className="bg-muted p-3 rounded-lg mt-4">
              <p className="text-sm font-medium text-foreground">Contact Support:</p>
              <p className="text-sm text-muted-foreground">support@heritagebank.com</p>
            </div>
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
