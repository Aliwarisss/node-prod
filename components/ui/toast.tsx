"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  description?: string;
  id: string;
  title: string;
  variant: ToastVariant;
};

type ToastInput = Omit<ToastItem, "id">;

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4200;

function getToastClasses(variant: ToastVariant) {
  if (variant === "success") {
    return {
      accent: "bg-[var(--bridge-teal)]",
      border:
        "border-[color:color-mix(in_srgb,var(--bridge-teal)_22%,transparent)]",
      description: "text-[color:color-mix(in_srgb,var(--on-surface)_76%,white)]",
      glow: "shadow-[0_22px_60px_-24px_rgba(0,128,128,0.45)]",
    };
  }

  if (variant === "error") {
    return {
      accent: "bg-[var(--electric-pink)]",
      border:
        "border-[color:color-mix(in_srgb,var(--electric-pink)_20%,transparent)]",
      description: "text-[color:color-mix(in_srgb,var(--on-surface)_76%,white)]",
      glow: "shadow-[0_22px_60px_-24px_rgba(233,30,99,0.4)]",
    };
  }

  return {
    accent: "bg-[var(--safety-orange)]",
    border:
      "border-[color:color-mix(in_srgb,var(--safety-orange)_18%,transparent)]",
    description: "text-[color:color-mix(in_srgb,var(--on-surface)_76%,white)]",
    glow: "shadow-[0_22px_60px_-24px_rgba(255,87,34,0.36)]",
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[160] flex w-[min(27rem,calc(100vw-2rem))] flex-col gap-3 md:right-6 md:top-6">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} onDismiss={dismissToast} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  onDismiss,
  toast,
}: {
  onDismiss: (id: string) => void;
  toast: ToastItem;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onDismiss, toast.id]);

  const styles = getToastClasses(toast.variant);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-[1.5rem] border bg-white/96 p-4 backdrop-blur-xl",
        styles.border,
        styles.glow,
      )}
      role="status"
    >
      <div className={cn("absolute inset-y-0 left-0 w-1.5", styles.accent)} />
      <button
        aria-label="Dismiss notification"
        className="absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--on-surface-variant)] transition-colors hover:text-[var(--primary)]"
        onClick={() => onDismiss(toast.id)}
        type="button"
      >
        Close
      </button>
      <div className="pl-3 pr-12">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--on-surface-variant)]">
          Node
        </div>
        <div className="mt-2 text-[16px] font-black text-[var(--primary)]">
          {toast.title}
        </div>
        {toast.description ? (
          <p className={cn("mt-2 text-[14px] leading-6", styles.description)}>
            {toast.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
