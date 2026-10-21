import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  /** When false the dialog cannot be dismissed while a request is pending. */
  dismissible?: boolean;
  children: ReactNode;
};

/**
 * Accessible native <dialog> modal.
 * `showModal()` gives us the browser's focus trap, Escape handling and
 * top-layer/backdrop rendering. While a write is pending we keep the dialog
 * open and refuse to dismiss it so the user never loses the pending state.
 */
export function Modal({ open, onClose, label, dismissible = true, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') {
        try {
          el.showModal();
        } catch {
          el.setAttribute('open', '');
        }
      } else {
        el.setAttribute('open', '');
      }
    } else if (!open && el.open) {
      if (typeof el.close === 'function') {
        el.close();
      } else {
        el.removeAttribute('open');
      }
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancelEvent = (event: Event) => {
      if (!dismissible) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancelEvent);
    return () => el.removeEventListener('cancel', onCancelEvent);
  }, [dismissible, onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(event) => {
        // Clicks on the backdrop land on the dialog element itself.
        if (event.target === ref.current && dismissible) onClose();
      }}
      style={{
        border: 'none',
        borderRadius: 12,
        padding: 20,
        maxWidth: 480,
        maxHeight: '85vh',
        overflow: 'auto',
        fontFamily: 'system-ui',
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
