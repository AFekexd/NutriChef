import { toast } from "sonner";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Show a confirmation dialog using toast with action buttons
 * Better UX than window.confirm()
 */
export const confirmDialog = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmOptions) => {
  toast(title, {
    description: message,

    duration: 10000,
    action: {
      label: confirmText,
      onClick: () => {
        onConfirm();
        toast.dismiss();
      },
    },
    cancel: {
      label: cancelText,
      onClick: () => {
        if (onCancel) onCancel();
        toast.dismiss();
      },
    },
  });
};

/**
 * Quick confirm for delete actions
 */
export const confirmDelete = (itemName: string, onConfirm: () => void) => {
  confirmDialog({
    title: `Delete ${itemName}?`,
    message: "This action cannot be undone.",
    confirmText: "Delete",
    onConfirm,
  });
};
