import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  dismissible?: boolean;
  children: ReactNode;
};

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
        if (event.target === ref.current && dismissible) onClose();
      }}
      className="glass-dialog"
      style={{
        border: '1px solid var(--card-border)',
        margin: 'auto',
      }}
    >
      {open ? children : null}
    </dialog>
  );
}
