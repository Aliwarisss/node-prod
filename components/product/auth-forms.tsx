"use client";

import type { FormEvent } from "react";

import { useEffect, useMemo, useState, useTransition } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";

import { MaterialSymbol } from "@/components/landing/material-symbol";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";

type LoginValues = LoginInput;
type RegisterValues = RegisterInput & {
  termsAccepted: boolean;
};

type FieldErrors<T extends Record<string, unknown>> = Partial<
  Record<Extract<keyof T, string>, string>
>;

type TouchedFields<T extends Record<string, unknown>> = Partial<
  Record<Extract<keyof T, string>, boolean>
>;

const registerClientSchema = registerSchema.extend({
  termsAccepted: z.boolean().refine((value) => value, {
    message: "Accept the terms to continue.",
  }),
});

const loginInitialValues: LoginValues = {
  email: "",
  password: "",
};

const registerInitialValues: RegisterValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  primaryTrack: "",
  ref: "", // the referral code is kept in its own state (from the link, or typed)
  termsAccepted: true,
};

/* What brings you to Node — stored as the account's primary track */
const goals = [
  { value: "Kick-start a career", icon: "rocket_launch", color: "#e91e63" },
  { value: "Get market-ready", icon: "school", color: "#008080" },
  { value: "Scale or switch domains", icon: "trending_up", color: "#6d48d8" },
];

const passwordSignals = [
  { label: "8+ characters", test: (password: string) => password.length >= 8 },
  { label: "Uppercase", test: (password: string) => /[A-Z]/.test(password) },
  { label: "Lowercase", test: (password: string) => /[a-z]/.test(password) },
  { label: "Number", test: (password: string) => /[0-9]/.test(password) },
];

const fieldLabel = "font-sans text-[13px] font-bold normal-case tracking-normal text-[var(--primary)]";
const inputCls = "h-12 rounded-[14px] border-black/10 bg-[var(--soft-stone)] shadow-none focus-visible:bg-white";
const invalidCls = "border-[var(--electric-pink)] ring-3 ring-[color:color-mix(in_srgb,var(--electric-pink)_16%,transparent)]";

function mapErrors<T extends Record<string, unknown>>(
  issues: z.ZodIssue[],
): FieldErrors<T> {
  const fieldErrors: FieldErrors<T> = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field as Extract<keyof T, string>]) {
      fieldErrors[field as Extract<keyof T, string>] = issue.message;
    }
  }

  return fieldErrors;
}

function validateValues<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>,
  values: T,
): FieldErrors<T> {
  const parsed = schema.safeParse(values);

  if (parsed.success) {
    return {};
  }

  return mapErrors<T>(parsed.error.issues);
}

function mergeTouched<T extends Record<string, unknown>>(values: T): TouchedFields<T> {
  return Object.keys(values).reduce<TouchedFields<T>>((accumulator, key) => {
    accumulator[key as Extract<keyof T, string>] = true;
    return accumulator;
  }, {});
}

function FieldMessage({ message, tone = "neutral" }: { message?: string; tone?: "critical" | "neutral" }) {
  if (!message) return null;
  return (
    <div className={cn("flex items-center gap-1.5 text-[12.5px] font-semibold", tone === "critical" ? "text-[var(--electric-pink)]" : "text-[var(--on-surface-variant)]")}>
      {tone === "critical" ? <MaterialSymbol className="text-[15px]" name="error" /> : null}
      {message}
    </div>
  );
}

function Field({ children, error, id, label, aside }: { children: React.ReactNode; error?: string; id: string; label: string; aside?: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className={fieldLabel} htmlFor={id}>{label}</Label>
        {aside}
      </div>
      {children}
      <FieldMessage message={error} tone="critical" />
    </div>
  );
}

function FormHead({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-heading text-[2rem] font-black uppercase leading-none tracking-[-0.04em] text-[var(--primary)]">{title}</h2>
      <p className="mt-3 text-[15.5px] leading-7 text-[var(--on-surface-variant)]">{lead}</p>
    </div>
  );
}

const submitCls = "rounded-gem h-auto w-full bg-[var(--electric-pink)] py-4 text-[14px] font-black uppercase tracking-[0.12em] text-white shadow-xl shadow-pink-500/25 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [step, setStep] = useState<"email" | "password" | "setup">("email");
  const [values, setValues] = useState<LoginValues>(loginInitialValues);
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<TouchedFields<LoginValues>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  /* a sign-in refused because the account is signed in on another device or browser */
  const [elsewhere, setElsewhere] = useState<{ where: string; mins: number } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const errors = useMemo(() => validateValues(loginSchema, values), [values]);
  const setupErrors = useMemo(() => {
    const parsed = registerSchema.shape.password.safeParse(values.password);
    return parsed.success ? null : parsed.error.issues[0]?.message ?? "Choose a stronger password.";
  }, [values.password]);
  const activeSignals = passwordSignals.filter((s) => s.test(values.password)).length;

  const visibleErrors = useMemo(
    () =>
      Object.entries(errors).reduce<FieldErrors<LoginValues>>((accumulator, [key, value]) => {
        if (touched[key as keyof LoginValues]) {
          accumulator[key as keyof LoginValues] = value;
        }

        return accumulator;
      }, {}),
    [errors, touched],
  );

  function updateField<K extends keyof LoginValues>(field: K, value: LoginValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setAuthError(null);
  }

  function backToEmail() {
    setStep("email");
    setValues((v) => ({ ...v, password: "" }));
    setConfirm("");
    setAuthError(null);
    setTouched({});
  }

  /* sign in with the credentials and open the dashboard */
  async function signInAndGo(welcome: string) {
    const result = await signIn("credentials", { callbackUrl, email: values.email, password: values.password, redirect: false });
    if (!result) {
      const message = "Sign-in is unavailable right now. Try again.";
      setAuthError(message);
      pushToast({ variant: "error", title: "Sign-in unavailable", description: message });
      return;
    }
    if (result.error) {
      /* one device and browser at a time: the account is in use somewhere else */
      const [code, where, seen] = decodeURIComponent(result.error).split("|");
      if (code === "ACTIVE_ELSEWHERE") {
        const mins = Math.max(1, Math.round((Date.now() - new Date(seen).getTime()) / 60000));
        setElsewhere({ where, mins });
        setAuthError(null);
        return;
      }
      const message = "Invalid email or password.";
      setAuthError(message);
      pushToast({ variant: "error", title: "Access denied", description: message });
      return;
    }
    setElsewhere(null);
    pushToast({ variant: "success", title: welcome, description: "Opening your workspace now." });
    router.push(result.url ?? "/dashboard");
    router.refresh();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* step 1: email — find out whether this person signs in or creates their password */
    if (step === "email") {
      setTouched((t) => ({ ...t, email: true }));
      if (errors.email) return;
      startTransition(async () => {
        try {
          const response = await fetch("/api/auth/check-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: values.email }) });
          const data = (await response.json().catch(() => ({}))) as { next?: string; error?: string };
          if (!response.ok) { setAuthError(data.error ?? "Couldn’t check that email. Try again."); return; }
          setStep(data.next === "setup" ? "setup" : "password");
        } catch {
          setAuthError("Couldn’t reach the server. Try again.");
        }
      });
      return;
    }

    /* first sign-in for an account an admin added: create the password, then sign in */
    if (step === "setup") {
      setTouched((t) => ({ ...t, password: true }));
      if (setupErrors) { setAuthError(setupErrors); return; }
      if (values.password !== confirm) { setAuthError("The two passwords don’t match."); return; }
      startTransition(async () => {
        try {
          setAuthError(null);
          const response = await fetch("/api/auth/setup-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: values.email, password: values.password }) });
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) {
            setAuthError(data.error ?? "Couldn’t save your password. Try again.");
            if (response.status === 409) setStep("password");
            return;
          }
          await signInAndGo("Password created");
        } catch (submitError) {
          console.error("Password setup error", submitError);
          setAuthError("Something went wrong. Try again.");
        }
      });
      return;
    }

    /* normal sign-in */
    setTouched(mergeTouched(values));
    if (Object.keys(errors).length > 0) {
      pushToast({ variant: "error", title: "Check your sign-in details", description: "Fix the highlighted fields before continuing." });
      return;
    }
    startTransition(async () => {
      try {
        setAuthError(null);
        await signInAndGo("Welcome back");
      } catch (submitError) {
        console.error("Login error", submitError);
        const message = "Something went wrong while signing you in. Try again.";
        setAuthError(message);
        pushToast({ variant: "error", title: "Sign-in failed", description: message });
      }
    });
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((s) => !s)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--on-surface-variant)] hover:bg-black/5"
    >
      <MaterialSymbol className="text-[19px]" name={showPassword ? "visibility_off" : "visibility"} />
    </button>
  );

  return (
    <div>
      {step === "setup" ? (
        <FormHead title="Create your password" lead="Your account is ready. Choose a password to finish signing in — you’ll use it from now on." />
      ) : (
        <FormHead title="Sign in" lead={step === "email" ? "Welcome back. Enter your email to continue." : "Welcome back. Continue your program right where you left it."} />
      )}

      {authError ? (
        <div className="mb-5 flex items-center gap-2 rounded-[14px] border border-[var(--electric-pink)]/30 bg-[color:color-mix(in_srgb,var(--electric-pink)_7%,white)] px-4 py-3 text-[14px] font-semibold text-[var(--electric-pink)]">
          <MaterialSymbol className="text-[18px]" name="error" />{authError}
        </div>
      ) : null}

      {elsewhere ? (
        <div role="alert" className="mb-5 grid gap-3 rounded-[18px] border border-[#e2b13c]/45 bg-[#fff8e6] p-4 text-[#5c4300]">
          <span className="flex items-start gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-[#e2b13c] text-white"><MaterialSymbol className="text-[21px]" name="devices" /></span>
            <span className="grid gap-0.5">
              <b className="text-[14.5px]">You’re already signed in somewhere else</b>
              <span className="text-[13px] leading-5">This account is signed in on <b>{elsewhere.where}</b>{elsewhere.mins < 60 ? ` (used ${elsewhere.mins} min ago)` : elsewhere.mins < 2880 ? ` (used ${Math.round(elsewhere.mins / 60)} h ago)` : ""}. Node allows one device and browser at a time, so you can’t sign in here while it’s signed in there.</span>
            </span>
          </span>
          <ul className="grid gap-1 border-t border-[#e2b13c]/30 pt-3 text-[12.5px] leading-5">
            <li className="flex gap-2"><MaterialSymbol className="mt-0.5 text-[15px]" name="logout" />Sign out on that device first, then sign in here.</li>
            <li className="flex gap-2"><MaterialSymbol className="mt-0.5 text-[15px]" name="support_agent" />Lost that device, or it isn’t yours? Ask your mentor to sign you out everywhere.</li>
          </ul>
        </div>
      ) : null}

      <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
        {step === "email" ? (
          <Field error={visibleErrors.email} id="login-email" label="Email">
            <Input
              aria-invalid={Boolean(visibleErrors.email)}
              autoComplete="email"
              autoFocus
              className={cn(inputCls, visibleErrors.email && invalidCls)}
              id="login-email"
              name="email"
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={values.email}
            />
          </Field>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[var(--soft-stone)] px-4 py-3">
            <span className="flex min-w-0 items-center gap-2 text-[14.5px] font-semibold text-[var(--primary)]">
              <MaterialSymbol className="text-[19px] text-[var(--on-surface-variant)]" name="mail" />
              <span className="truncate">{values.email}</span>
            </span>
            <button type="button" onClick={backToEmail} className="text-[13px] font-bold text-[var(--electric-pink)]">Change</button>
          </div>
        )}

        {step === "password" ? (
          <Field error={visibleErrors.password} id="login-password" label="Password">
            <div className="relative">
              <Input
                aria-invalid={Boolean(visibleErrors.password || authError)}
                autoComplete="current-password"
                autoFocus
                className={cn(inputCls, "pr-12", (visibleErrors.password || authError) && invalidCls)}
                id="login-password"
                name="password"
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Your password"
                type={showPassword ? "text" : "password"}
                value={values.password}
              />
              {passwordToggle}
            </div>
          </Field>
        ) : null}

        {step === "setup" ? (
          <>
            <Field id="setup-password" label="New password" aside={<span className={cn("font-mono text-[11px] font-bold", activeSignals === 4 ? "text-[var(--bridge-teal)]" : "text-[var(--on-surface-variant)]")}>{activeSignals}/4</span>}>
              <div className="relative">
                <Input
                  autoComplete="new-password"
                  autoFocus
                  className={cn(inputCls, "pr-12")}
                  id="setup-password"
                  name="password"
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                />
                {passwordToggle}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {passwordSignals.map((signal) => {
                  const ok = signal.test(values.password);
                  return (
                    <span key={signal.label} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors", ok ? "bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]" : "bg-[var(--soft-stone)] text-[var(--on-surface-variant)]")}>
                      <MaterialSymbol className="text-[14px]" name={ok ? "check" : "remove"} />{signal.label}
                    </span>
                  );
                })}
              </div>
            </Field>
            <Field id="setup-confirm" label="Confirm password" error={confirm && confirm !== values.password ? "The two passwords don’t match." : undefined}>
              <Input
                autoComplete="new-password"
                className={inputCls}
                id="setup-confirm"
                name="confirm"
                onChange={(event) => { setConfirm(event.target.value); setAuthError(null); }}
                placeholder="Type it again"
                type={showPassword ? "text" : "password"}
                value={confirm}
              />
            </Field>
          </>
        ) : null}

        {step === "password" ? (
          <label className="flex items-center gap-3 text-[14px] text-[var(--on-surface-variant)]">
            <Checkbox defaultChecked />
            Keep me signed in on this device
          </label>
        ) : null}

        <Button className={submitCls} disabled={isPending} type="submit">
          {step === "email" ? (isPending ? "Checking…" : "Continue") : step === "setup" ? (isPending ? "Saving…" : "Create password & sign in") : isPending ? "Signing in…" : "Sign in"}
        </Button>
        {step !== "email" ? (
          <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--on-surface-variant)]">
            <MaterialSymbol className="text-[16px]" name="devices" />You can be signed in on one device and browser at a time.
          </p>
        ) : null}
      </form>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [values, setValues] = useState<RegisterValues>(registerInitialValues);
  const [touched, setTouched] = useState<TouchedFields<RegisterValues>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  /* a referral code from the link (?ref=), or typed in — and who it belongs to */
  const [refCode, setRefCode] = useState((searchParams.get("ref") ?? "").toUpperCase());
  const [inviter, setInviter] = useState<{ code: string; name: string } | null>(null);
  useEffect(() => {
    const code = refCode.trim();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) return;
    let live = true;
    const t = setTimeout(() => {
      fetch(`/api/referrals/check?code=${encodeURIComponent(code)}`).then((r) => (r.ok ? r.json() : null)).then((d: { name?: string } | null) => { if (live) setInviter({ code, name: d?.name ?? "" }); }).catch(() => {});
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [refCode]);
  const checked = inviter && inviter.code === refCode.trim() ? inviter : null;
  const invitedBy = checked?.name || null;

  const errors = useMemo(
    () => validateValues(registerClientSchema, values),
    [values],
  );

  const visibleErrors = useMemo(
    () =>
      Object.entries(errors).reduce<FieldErrors<RegisterValues>>(
        (accumulator, [key, value]) => {
          if (touched[key as keyof RegisterValues]) {
            accumulator[key as keyof RegisterValues] = value;
          }

          return accumulator;
        },
        {},
      ),
    [errors, touched],
  );

  function updateField<K extends keyof RegisterValues>(
    field: K,
    value: RegisterValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setAuthError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTouched = mergeTouched(values);
    setTouched(nextTouched);

    if (Object.keys(errors).length > 0) {
      pushToast({
        variant: "error",
        title: "A few details are missing",
        description: "Fix the highlighted fields to create your account.",
      });
      return;
    }

    startTransition(async () => {
      try {
        setAuthError(null);

        const response = await fetch("/api/auth/register", {
          body: JSON.stringify({
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            password: values.password,
            primaryTrack: values.primaryTrack,
            ref: refCode.trim(),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          const message = data.error ?? "Unable to create your account.";
          setAuthError(message);
          pushToast({ variant: "error", title: "Couldn’t create your account", description: message });
          return;
        }

        pushToast({ variant: "success", title: "Account created", description: "Signing you in and opening your workspace." });

        const result = await signIn("credentials", {
          callbackUrl,
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (!result || result.error) {
          const message = "Account created, but sign-in could not be completed.";
          setAuthError(message);
          pushToast({ variant: "info", title: "Account ready", description: message });
          return;
        }

        router.push(result.url ?? "/dashboard");
        router.refresh();
      } catch (submitError) {
        console.error("Registration form error", submitError);
        const message = "Something went wrong while creating your account. Try again.";
        setAuthError(message);
        pushToast({ variant: "error", title: "Registration failed", description: message });
      }
    });
  }

  const activePasswordSignals = passwordSignals.filter((signal) => signal.test(values.password)).length;

  return (
    <div>
      <FormHead title="Create your account" lead="Free to join. Enrol in a program whenever you’re ready." />

      {authError ? (
        <div className="mb-5 flex items-center gap-2 rounded-[14px] border border-[var(--electric-pink)]/30 bg-[color:color-mix(in_srgb,var(--electric-pink)_7%,white)] px-4 py-3 text-[14px] font-semibold text-[var(--electric-pink)]">
          <MaterialSymbol className="text-[18px]" name="error" />{authError}
        </div>
      ) : null}

      <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field error={visibleErrors.firstName} id="register-first-name" label="First name">
            <Input
              aria-invalid={Boolean(visibleErrors.firstName)}
              autoComplete="given-name"
              className={cn(inputCls, visibleErrors.firstName && invalidCls)}
              id="register-first-name"
              name="firstName"
              onBlur={() => setTouched((current) => ({ ...current, firstName: true }))}
              onChange={(event) => updateField("firstName", event.target.value)}
              placeholder="First name"
              value={values.firstName}
            />
          </Field>
          <Field error={visibleErrors.lastName} id="register-last-name" label="Last name">
            <Input
              aria-invalid={Boolean(visibleErrors.lastName)}
              autoComplete="family-name"
              className={cn(inputCls, visibleErrors.lastName && invalidCls)}
              id="register-last-name"
              name="lastName"
              onBlur={() => setTouched((current) => ({ ...current, lastName: true }))}
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder="Last name"
              value={values.lastName}
            />
          </Field>
        </div>

        <Field error={visibleErrors.email} id="register-email" label="Email">
          <Input
            aria-invalid={Boolean(visibleErrors.email)}
            autoComplete="email"
            className={cn(inputCls, visibleErrors.email && invalidCls)}
            id="register-email"
            name="email"
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={values.email}
          />
        </Field>

        <Field
          error={visibleErrors.password}
          id="register-password"
          label="Password"
          aside={<span className={cn("font-mono text-[11px] font-bold", activePasswordSignals === 4 ? "text-[var(--bridge-teal)]" : "text-[var(--on-surface-variant)]")}>{activePasswordSignals}/4</span>}
        >
          <div className="relative">
            <Input
              aria-invalid={Boolean(visibleErrors.password)}
              autoComplete="new-password"
              className={cn(inputCls, "pr-12", visibleErrors.password && invalidCls)}
              id="register-password"
              name="password"
              onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Create a password"
              type={showPassword ? "text" : "password"}
              value={values.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--on-surface-variant)] hover:bg-black/5"
            >
              <MaterialSymbol className="text-[19px]" name={showPassword ? "visibility_off" : "visibility"} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {passwordSignals.map((signal) => {
              const ok = signal.test(values.password);
              return (
                <span key={signal.label} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors", ok ? "bg-[color:color-mix(in_srgb,var(--bridge-teal)_12%,white)] text-[var(--bridge-teal)]" : "bg-[var(--soft-stone)] text-[var(--on-surface-variant)]")}>
                  <MaterialSymbol className="text-[14px]" name={ok ? "check" : "remove"} />{signal.label}
                </span>
              );
            })}
          </div>
        </Field>

        <div className="grid gap-2">
          <span className={fieldLabel}>What brings you to Node?</span>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="What brings you to Node?">
            {goals.map((g) => {
              const on = values.primaryTrack === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => { updateField("primaryTrack", g.value); setTouched((current) => ({ ...current, primaryTrack: true })); }}
                  className={cn(
                    "grid justify-items-start gap-1.5 rounded-[14px] border p-3 text-left text-[13px] font-bold leading-tight transition-all",
                    on ? "border-[var(--c)] bg-[color:color-mix(in_srgb,var(--c)_8%,white)] text-[var(--primary)]" : "border-black/10 text-[var(--on-surface-variant)] hover:border-black/25",
                  )}
                  style={{ ["--c" as string]: g.color }}
                >
                  <MaterialSymbol className="text-[22px] text-[var(--c)]" name={g.icon} />
                  {g.value}
                </button>
              );
            })}
          </div>
          <FieldMessage message={visibleErrors.primaryTrack ? "Choose what brings you to Node." : undefined} tone="critical" />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="register-ref" className="text-[13px] font-semibold">Referral code <span className="font-normal text-black/45">(optional)</span></Label>
          <Input id="register-ref" name="ref" value={refCode} onChange={(event) => setRefCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} placeholder="e.g. ANAX7K2" className={inputCls} autoComplete="off" />
          {invitedBy ? <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--bridge-teal)]"><MaterialSymbol className="text-[16px]" name="redeem" />Invited by {invitedBy} — when you join, they get PKR 1,000 off their fee.</span> : checked ? <span className="text-[12px] font-semibold text-[#a3104a]">No one has that code — check it, or leave it empty.</span> : refCode.trim().length >= 4 ? <span className="text-[12px] text-black/45">Checking the code…</span> : null}
        </div>

        <label className="flex items-start gap-3 text-[13.5px] leading-6 text-[var(--on-surface-variant)]">
          <Checkbox
            checked={values.termsAccepted}
            className="mt-1"
            onBlur={() => setTouched((current) => ({ ...current, termsAccepted: true }))}
            onChange={(event) => updateField("termsAccepted", event.target.checked)}
          />
          I agree to Node’s terms and community guidelines.
        </label>
        <FieldMessage message={visibleErrors.termsAccepted} tone="critical" />

        <Button className={submitCls} disabled={isPending} type="submit">
          {isPending ? "Creating your account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
