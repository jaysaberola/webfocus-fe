import ConfirmModal from "@/components/UI/ConfirmModal";

export type FormActionIntent = "cancel" | "save" | "save-and-new";

type Props = {
  intent: FormActionIntent | null;
  entity: string;
  onConfirm: () => void;
  onDismiss: () => void;
};

function copyFor(intent: FormActionIntent, entity: string) {
  if (intent === "cancel") {
    return {
      title: "Cancel without saving?",
      message: `Leave this ${entity} without saving? Unsaved changes will be lost.`,
      confirmLabel: "Yes, cancel",
      cancelLabel: "Keep editing",
      danger: true,
    };
  }
  if (intent === "save-and-new") {
    return {
      title: "Save and create another?",
      message: `Save this ${entity}, then open a blank form for a new ${entity}.`,
      confirmLabel: "Yes, save and new",
      cancelLabel: "Go back",
      danger: false,
    };
  }
  return {
    title: `Save this ${entity}?`,
    message: `Save this ${entity} now? You can still edit it later.`,
    confirmLabel: "Yes, save",
    cancelLabel: "Go back",
    danger: false,
  };
}

export default function FormActionConfirmModal({ intent, entity, onConfirm, onDismiss }: Props) {
  if (!intent) return null;
  const copy = copyFor(intent, entity);

  return (
    <ConfirmModal
      show
      title={copy.title}
      message={copy.message}
      confirmLabel={copy.confirmLabel}
      cancelLabel={copy.cancelLabel}
      danger={copy.danger}
      onConfirm={onConfirm}
      onCancel={onDismiss}
    />
  );
}
