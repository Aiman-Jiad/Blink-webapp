import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { qrToDataURL } from '@/utils/qr';
import { copyProfileLink } from '@/utils/share';
import { toast } from 'sonner';
import type { UserProfile } from '@/types';

interface QRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Pick<UserProfile, 'name' | 'username' | 'photoURL'>;
}

export function QRDialog({ open, onOpenChange, user }: QRDialogProps) {
  const [qrUrl, setQrUrl] = useState('');

  // Generate QR when dialog opens (useEffect avoids stale-closure issues)
  useEffect(() => {
    if (!open || qrUrl) return;
    try {
      const url = `${window.location.origin}${window.location.pathname}#/u/${encodeURIComponent(user.username)}`;
      const dataUrl = qrToDataURL(url, 8, 4);
      if (dataUrl) setQrUrl(dataUrl);
    } catch {
      toast.error('Could not generate QR code');
    }
  }, [open, qrUrl, user.username]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) setQrUrl('');
  }, [open]);

  function handleDownload() {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `blink-qr-${user.username}.png`;
    a.click();
  }

  async function handleCopyLink() {
    const ok = await copyProfileLink(user);
    if (ok) toast.success('Profile link copied');
    else toast.error('Could not copy link');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs gap-0 p-0 sm:rounded-2xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-center text-base font-semibold">Your QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-2">
          {/* QR code */}
          <div className="rounded-2xl border-2 border-border bg-white p-3 shadow-sm">
            {qrUrl ? (
              <img src={qrUrl} alt="QR code" className="h-44 w-44" />
            ) : (
              <div className="h-44 w-44 animate-pulse rounded-lg bg-muted" />
            )}
          </div>

          {/* User identity */}
          <div className="flex items-center gap-2.5">
            <UserAvatar name={user.name} src={user.photoURL} size="sm" />
            <div className="text-left">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Scan this code with your camera to open this profile
          </p>

          {/* Actions */}
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={!qrUrl}>
              <Download className="mr-1.5 h-4 w-4" /> Save
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
