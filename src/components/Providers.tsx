'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { useModalA11y } from '@/lib/useModalA11y';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ToastContext = createContext<ToastApi | null>(null);
const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <Providers>');
  return ctx;
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <Providers>');
  return ctx;
}

const TOAST_STYLES: Record<ToastKind, { border: string; icon: React.ReactNode }> =
  {
    success: {
      border: 'rgb(34, 197, 94)',
      icon: <CheckCircle2 size={18} className="text-green-400" />,
    },
    error: {
      border: 'rgb(239, 68, 68)',
      icon: <XCircle size={18} className="text-red-400" />,
    },
    info: {
      border: 'rgb(59, 130, 246)',
      icon: <Info size={18} className="text-blue-400" />,
    },
  };

function ConfirmDialog({
  options,
  onResult,
}: {
  options: ConfirmOptions;
  onResult: (result: boolean) => void;
}) {
  const ref = useModalA11y<HTMLDivElement>(true, () => onResult(false));
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
      onClick={() => onResult(false)}
    >
      <motion.div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.message ? 'confirm-message' : undefined}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border p-6 shadow-2xl outline-none"
        style={{
          backgroundColor: 'rgb(31, 41, 55)',
          borderColor: 'rgb(55, 65, 81)',
        }}
      >
        <div className="flex items-start gap-3">
          {options.destructive && (
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={22} />
          )}
          <div>
            <h2 id="confirm-title" className="text-lg font-bold text-white">
              {options.title}
            </h2>
            {options.message && (
              <p id="confirm-message" className="text-sm text-gray-300 mt-1">
                {options.message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => onResult(false)}
            className="px-4 py-2.5 rounded-lg border text-gray-300 hover:bg-gray-700"
            style={{ borderColor: 'rgb(75, 85, 99)' }}
          >
            {options.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => onResult(true)}
            className={`px-4 py-2.5 rounded-lg text-white font-semibold ${
              options.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {options.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, kind, message }]);
      if (kind === 'success') haptic('success');
      if (kind === 'error') haptic('error');
      window.setTimeout(() => dismiss(id), kind === 'error' ? 5000 : 3000);
    },
    [dismiss],
  );

  const toast = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ options, resolve });
      }),
    [],
  );

  const settle = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
          role="region"
          aria-label="Notifications"
          aria-live="polite"
        >
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                role={t.kind === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-white shadow-xl"
                style={{
                  backgroundColor: 'rgb(31, 41, 55)',
                  borderColor: TOAST_STYLES[t.kind].border,
                }}
              >
                {TOAST_STYLES[t.kind].icon}
                <span className="flex-1">{t.message}</span>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(t.id)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {confirmState && (
          <ConfirmDialog options={confirmState.options} onResult={settle} />
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
