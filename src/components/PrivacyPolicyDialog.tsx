import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { policyContents, FormType, ContentType } from '../lib/policyContents';

interface PrivacyPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  formType: FormType;
  contentType: ContentType | null;
}

export function PrivacyPolicyDialog({
  isOpen,
  onClose,
  onAgree,
  formType,
  contentType,
}: PrivacyPolicyDialogProps) {
  if (!contentType) {
    return null;
  }

  const policy = policyContents[formType][contentType];

  const handleAgree = () => {
    onAgree();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-800 rounded-lg p-0 max-w-2xl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">{policy.title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-6 text-sm text-gray-600 whitespace-pre-wrap">
          {policy.content}
        </div>
        <DialogFooter className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            type="button"
            onClick={handleAgree}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold"
          >
            동의하고 닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

