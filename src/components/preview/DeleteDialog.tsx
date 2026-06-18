import { AlertDialog } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Trash-icon trigger + confirm dialog, shared by the trash / purge actions. */
export function DeleteDialog({
  triggerLabel,
  heading,
  body,
  confirmLabel,
  status,
  disabled,
  onConfirm,
}: {
  triggerLabel: string;
  heading: string;
  body: string;
  confirmLabel: string;
  status: "danger" | "warning";
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <Button isIconOnly aria-label={triggerLabel} size="sm" variant="ghost">
        <Trash2 className="size-3.5" />
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="max-w-sm">
            <AlertDialog.Header>
              <AlertDialog.Icon status={status} />
              <AlertDialog.Heading>{heading}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-ink-subtle">{body}</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancel
              </Button>
              <Button slot="close" isDisabled={disabled} variant="danger" onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
