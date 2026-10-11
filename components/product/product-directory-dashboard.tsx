"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProductSummary } from "@/lib/bos-roadmap/types";
import { cn } from "@/lib/utils";

import { Eyebrow, Panel, StatChip } from "./section-primitives";

function parseLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ProductDirectoryDashboardProps = {
  initialProducts: ProductSummary[];
};

export function ProductDirectoryDashboard({
  initialProducts,
}: ProductDirectoryDashboardProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    description: "",
    modules: "ERP\nCRM\nHRM",
    owner: "Chief Product Officer",
    summary:
      "Platform product for structured PRDs that define business modules before roadmap execution starts.",
    title: "Business Operating System",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCreateProduct() {
    setError("");

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/roadmaps", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: form.title,
            slug: slugify(form.title),
            status: "active",
            owner: form.owner,
            summary: form.summary,
            description: form.description,
            modules: parseLineList(form.modules),
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(payload?.error ?? "Unable to create product.");
          return;
        }

        const payload = (await response.json()) as { product: { id: string } };
        router.push(`/dashboard/projects/${payload.product.id}`);
      })();
    });
  }

  function handleDeleteProduct(productId: string) {
    const confirmed = window.confirm(
      "Delete this product and all of its PRDs?",
    );

    if (!confirmed) {
      return;
    }

    setError("");

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/roadmaps?productId=${encodeURIComponent(productId)}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setError(payload?.error ?? "Unable to delete product.");
          return;
        }

        setProducts((current) => current.filter((product) => product.id !== productId));
      })();
    });
  }

  const prdTotal = products.reduce((total, product) => total + product.prdCount, 0);
  const approvedTotal = products.reduce(
    (total, product) => total + product.approvedPrdCount,
    0,
  );
  const openQuestions = products.reduce(
    (total, product) => total + product.openQuestionCount,
    0,
  );

  return (
    <div className="space-y-8">
      <FadeIn>
        <Panel className="node-link-pattern overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div>
              <Eyebrow className="mb-5 text-[var(--bridge-teal)]">
                Product_PRD_Studio
              </Eyebrow>
              <h1 className="section-title text-[3rem] leading-[0.94] text-[var(--primary)] md:text-[4rem]">
                Product workspace built around structured PRDs.
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[var(--on-surface-variant)]">
                Treat the PRD as the source definition for roadmap generation, requirement
                modeling, execution planning, and release alignment. Products stay lean.
                PRDs hold the real product thinking.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <StatChip label="Products" value={String(products.length)} />
                <StatChip label="PRDs" value={String(prdTotal)} />
                <StatChip label="Approved" value={String(approvedTotal)} />
                <StatChip label="Open Questions" value={String(openQuestions)} />
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-black/6 bg-[var(--surface-container-low)] p-5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--electric-pink)]">
                New Product Workspace
              </div>
              <div className="mt-4 grid gap-3">
                <Input
                  placeholder="Product title"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Owner"
                    value={form.owner}
                    onChange={(event) => updateField("owner", event.target.value)}
                  />
                  <Input
                    placeholder="Slug preview"
                    value={slugify(form.title)}
                    readOnly
                  />
                </div>
                <Textarea
                  className="min-h-[88px]"
                  placeholder="Summary"
                  value={form.summary}
                  onChange={(event) => updateField("summary", event.target.value)}
                />
                <Textarea
                  className="min-h-[96px]"
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
                <Textarea
                  className="min-h-[104px]"
                  placeholder="Modules, one per line"
                  value={form.modules}
                  onChange={(event) => updateField("modules", event.target.value)}
                />
              </div>
              {error ? (
                <p className="mt-3 text-[13px] font-medium text-[var(--electric-pink)]">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleCreateProduct}
                disabled={isPending || !form.title.trim()}
                className={cn(
                  buttonVariants(),
                  "mt-4 h-auto w-full rounded-full bg-[var(--primary)] px-5 py-3.5 text-[12px] font-black uppercase tracking-[0.16em] text-white disabled:pointer-events-none disabled:opacity-55",
                )}
              >
                {isPending ? "Saving..." : "Create Product"}
              </button>
            </div>
          </div>
        </Panel>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="grid gap-6 xl:grid-cols-2">
          {products.length > 0 ? (
            products.map((product) => (
              <Panel key={product.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--outline)]">
                        {product.slug}
                      </span>
                      <span className="rounded-full bg-[var(--surface-container-low)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--bridge-teal)]">
                        {product.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <h2 className="mt-3 text-[1.75rem] font-black text-[var(--primary)]">
                      {product.title}
                    </h2>
                    <p className="mt-3 text-[15px] leading-7 text-[var(--on-surface-variant)]">
                      {product.summary || "No summary added yet."}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-black/6 bg-[var(--surface-container-low)] px-4 py-3 text-right">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                      Updated
                    </div>
                    <div className="mt-2 text-[13px] font-bold text-[var(--primary)]">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <StatChip label="PRDs" value={String(product.prdCount)} />
                  <StatChip label="Approved" value={String(product.approvedPrdCount)} />
                  <StatChip label="Questions" value={String(product.openQuestionCount)} />
                  <StatChip label="Owner" value={product.owner || "TBD"} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/projects/${product.id}`}
                    className={cn(
                      buttonVariants(),
                      "h-auto rounded-full bg-[var(--primary)] px-5 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-white",
                    )}
                  >
                    Open Workspace
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="rounded-full border border-black/10 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)] transition hover:border-[var(--electric-pink)]/30 hover:bg-[color:color-mix(in_srgb,var(--electric-pink)_8%,white)]"
                  >
                    Delete
                  </button>
                </div>
              </Panel>
            ))
          ) : (
            <Panel className="p-8">
              <Eyebrow className="mb-4 text-[var(--safety-orange)]">
                Empty_State
              </Eyebrow>
              <h2 className="text-[1.8rem] font-black text-[var(--primary)]">
                No product workspace yet.
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--on-surface-variant)]">
                Create the first product above, then manage structured PRDs inside its
                workspace.
              </p>
            </Panel>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
