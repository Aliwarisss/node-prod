"use client";

import { useState, useTransition } from "react";

import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Prd, Product } from "@/lib/bos-roadmap/types";
import { cn } from "@/lib/utils";

import { PrdDetailView } from "./prd-detail-view";
import { Eyebrow, Panel, StatChip } from "./section-primitives";

type ProductPrdWorkspaceProps = {
  initialProduct: Product;
};

function parseLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatLineList(value: string[]) {
  return value.join("\n");
}

function createEmptyPrd(productId: string, moduleLabel: string): Omit<Prd, "id"> {
  const now = new Date().toISOString();

  return {
    title: `${moduleLabel} PRD`,
    status: "draft",
    version: "v0.1",
    productId,
    module: moduleLabel,
    owner: "",
    authors: [],
    reviewers: [],
    stakeholders: [],
    createdAt: now,
    updatedAt: now,
    targetRelease: "",
    summary: {
      oneLiner: "",
      description: "",
      whyNow: "",
      expectedOutcome: "",
    },
    problem: {
      statement: "",
      currentPain: "",
      businessImpact: "",
      userImpact: "",
      currentWorkarounds: "",
      opportunity: "",
    },
    vision: {
      statement: "",
      futureState: "",
      principles: [],
    },
    goals: [],
    successMetrics: [],
    targetUsers: [],
    scope: {
      inScope: [],
      outOfScope: [],
      mvpScope: [],
      futureScope: [],
    },
    capabilities: [],
    highLevelUseCases: [],
    requirementModel: {
      businessRequirements: [],
      userRequirements: [],
      functionalRequirements: [],
      nonFunctionalRequirements: [],
      domainRequirements: [],
      dataRequirements: [],
      permissionRequirements: [],
      integrationRequirements: [],
      reportingRequirements: [],
      operationalRequirements: [],
      complianceRequirements: [],
      notes: "",
      generatedAt: "",
    },
    requirementItems: [],
    domainRules: [],
    dataContext: {
      coreEntities: [],
      dataOwnership: "",
      dataRetentionNotes: "",
      auditNeeds: "",
    },
    uxPrinciples: [],
    constraints: [],
    dependencies: [],
    risks: [],
    releaseExpectation: {
      mvp: "",
      alpha: "",
      beta: "",
      future: "",
      releaseNotes: "",
    },
    openQuestions: [],
    approval: {
      productOwner: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
      domainOwner: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
      engineeringLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
      designLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
      qaLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    },
    changeLog: [],
  };
}

export function ProductPrdWorkspace({
  initialProduct,
}: ProductPrdWorkspaceProps) {
  const [product, setProduct] = useState(initialProduct);
  const [selectedPrdId, setSelectedPrdId] = useState(initialProduct.prds[0]?.id ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedPrd =
    product.prds.find((prd) => prd.id === selectedPrdId) ?? product.prds[0] ?? null;

  function applyProduct(nextProduct: Product) {
    setProduct(nextProduct);

    if (selectedPrdId && !nextProduct.prds.some((prd) => prd.id === selectedPrdId)) {
      setSelectedPrdId(nextProduct.prds[0]?.id ?? "");
    }
  }

  function runMutation(work: () => Promise<void>) {
    setError("");
    setMessage("");
    startTransition(() => {
      void work().catch((mutationError) => {
        console.error(mutationError);
        setError("Something went wrong while saving. Please try again.");
      });
    });
  }

  function updateProductField<K extends keyof Product>(field: K, value: Product[K]) {
    setProduct((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateSelectedPrd(nextPrd: Prd) {
    setProduct((current) => ({
      ...current,
      prds: current.prds.map((prd) => (prd.id === nextPrd.id ? nextPrd : prd)),
    }));
  }

  function saveProductMeta() {
    runMutation(async () => {
      const response = await fetch(
        `/api/roadmaps?productId=${encodeURIComponent(product.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: product.title,
            slug: product.slug,
            status: product.status,
            owner: product.owner,
            summary: product.summary,
            description: product.description,
            modules: product.modules,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; product?: Product }
        | null;

      if (!response.ok || !payload?.product) {
        setError(payload?.error ?? "Unable to update product.");
        return;
      }

      applyProduct(payload.product);
      setMessage("Product header saved.");
    });
  }

  function createPrd() {
    runMutation(async () => {
      const draft = createEmptyPrd(
        product.id,
        product.modules[product.prds.length] ?? `Module ${product.prds.length + 1}`,
      );
      const response = await fetch(
        `/api/roadmaps/prds?productId=${encodeURIComponent(product.id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(draft),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; prd?: Prd; product?: Product }
        | null;

      if (!response.ok || !payload?.product || !payload.prd) {
        setError(payload?.error ?? "Unable to create PRD.");
        return;
      }

      applyProduct(payload.product);
      setSelectedPrdId(payload.prd.id);
      setMessage("PRD created.");
    });
  }

  function saveSelectedPrd() {
    if (!selectedPrd) {
      return;
    }

    runMutation(async () => {
      const response = await fetch(
        `/api/roadmaps/prds?productId=${encodeURIComponent(product.id)}&prdId=${encodeURIComponent(selectedPrd.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedPrd),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; prd?: Prd; product?: Product }
        | null;

      if (!response.ok || !payload?.product || !payload.prd) {
        setError(payload?.error ?? "Unable to save PRD.");
        return;
      }

      applyProduct(payload.product);
      setMessage("PRD saved.");
    });
  }

  function deleteSelectedPrd() {
    if (!selectedPrd) {
      return;
    }

    const confirmed = window.confirm("Delete this PRD?");
    if (!confirmed) {
      return;
    }

    runMutation(async () => {
      const response = await fetch(
        `/api/roadmaps/prds?productId=${encodeURIComponent(product.id)}&prdId=${encodeURIComponent(selectedPrd.id)}`,
        {
          method: "DELETE",
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; product?: Product }
        | null;

      if (!response.ok || !payload?.product) {
        setError(payload?.error ?? "Unable to delete PRD.");
        return;
      }

      applyProduct(payload.product);
      setMessage("PRD deleted.");
    });
  }

  function runPrdAction(
    action: "submit_review" | "generate_requirement_model" | "generate_roadmap" | "approve_role",
    payload?: Record<string, string>,
  ) {
    if (!selectedPrd) {
      return;
    }

    runMutation(async () => {
      const response = await fetch("/api/roadmaps/prds/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          productId: product.id,
          prdId: selectedPrd.id,
          ...payload,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; prd?: Prd; product?: Product }
        | null;

      if (!response.ok || !result?.product || !result.prd) {
        setError(result?.error ?? "Unable to run PRD action.");
        return;
      }

      applyProduct(result.product);
      setMessage(
        action === "submit_review"
          ? "PRD submitted for review."
          : action === "generate_requirement_model"
            ? "Requirement model refreshed."
            : action === "generate_roadmap"
              ? "Roadmap generation placeholder executed."
              : "Approval recorded.",
      );
    });
  }

  const approvedPrds = product.prds.filter((prd) => prd.status === "approved").length;
  const totalRequirements = product.prds.reduce(
    (total, prd) => total + prd.requirementItems.length,
    0,
  );
  const totalQuestions = product.prds.reduce(
    (total, prd) => total + prd.openQuestions.filter((item) => item.status === "open").length,
    0,
  );

  return (
    <div className="space-y-8">
      <FadeIn>
        <Panel className="node-link-pattern overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div>
              <Link
                href="/dashboard/projects"
                className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--outline)] transition hover:text-[var(--primary)]"
              >
                Back to product directory
              </Link>
              <Eyebrow className="mb-5 mt-5 text-[var(--bridge-teal)]">
                Product_Workspace
              </Eyebrow>
              <div className="grid gap-3 lg:grid-cols-2">
                <Input
                  value={product.title}
                  onChange={(event) => updateProductField("title", event.target.value)}
                />
                <Input
                  value={product.owner}
                  placeholder="Owner"
                  onChange={(event) => updateProductField("owner", event.target.value)}
                />
              </div>
              <Input
                className="mt-3"
                value={product.slug}
                onChange={(event) => updateProductField("slug", event.target.value)}
              />
              <Textarea
                className="mt-3 min-h-[96px]"
                value={product.summary}
                onChange={(event) => updateProductField("summary", event.target.value)}
              />
              <Textarea
                className="mt-3 min-h-[120px]"
                value={product.description}
                onChange={(event) => updateProductField("description", event.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatChip label="PRDs" value={String(product.prds.length)} />
                <StatChip label="Approved" value={String(approvedPrds)} />
                <StatChip label="Requirements" value={String(totalRequirements)} />
                <StatChip label="Questions" value={String(totalQuestions)} />
              </div>
              <Textarea
                className="min-h-[154px]"
                placeholder="Modules, one per line"
                value={formatLineList(product.modules)}
                onChange={(event) =>
                  updateProductField("modules", parseLineList(event.target.value))
                }
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveProductMeta}
                  className={cn(
                    buttonVariants(),
                    "h-auto rounded-full bg-[var(--primary)] px-5 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-white disabled:pointer-events-none disabled:opacity-55",
                  )}
                >
                  {isPending ? "Saving..." : "Save Product"}
                </button>
                <button
                  type="button"
                  onClick={createPrd}
                  className="rounded-full border border-black/10 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]"
                >
                  Add PRD
                </button>
                {selectedPrd ? (
                  <button
                    type="button"
                    onClick={deleteSelectedPrd}
                    className="rounded-full border border-black/10 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--electric-pink)]"
                  >
                    Delete PRD
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </Panel>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="h-fit p-5 xl:sticky xl:top-30">
          <Eyebrow className="mb-4 text-[var(--electric-pink)]">PRD Sidebar</Eyebrow>
          <div className="space-y-3">
            {product.prds.length > 0 ? (
              product.prds.map((prd) => {
                const isActive = prd.id === selectedPrd?.id;
                return (
                  <button
                    key={prd.id}
                    type="button"
                    onClick={() => setSelectedPrdId(prd.id)}
                    className={cn(
                      "w-full rounded-[1.2rem] border px-4 py-4 text-left transition",
                      isActive
                        ? "border-[var(--primary)] bg-[var(--surface-container-low)]"
                        : "border-black/6 bg-white hover:bg-[var(--surface-container-low)]",
                    )}
                  >
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--outline)]">
                      {prd.module || "General"}
                    </div>
                    <div className="mt-2 text-[15px] font-black text-[var(--primary)]">
                      {prd.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--bridge-teal)]">
                        {prd.status.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--outline)]">
                        {prd.requirementItems.length} reqs
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-black/12 bg-[var(--surface-container-low)] px-4 py-5 text-[14px] leading-6 text-[var(--on-surface-variant)]">
                No PRDs yet. Create the first one to start building the structured product
                definition.
              </div>
            )}
          </div>
        </Panel>

        {selectedPrd ? (
          <PrdDetailView
            error={error}
            isPending={isPending}
            message={message}
            onAction={runPrdAction}
            onChange={updateSelectedPrd}
            onSave={saveSelectedPrd}
            prd={selectedPrd}
            product={product}
          />
        ) : (
          <Panel className="p-8">
            <Eyebrow className="mb-4 text-[var(--safety-orange)]">Empty_State</Eyebrow>
            <h2 className="text-[1.8rem] font-black text-[var(--primary)]">
              Create a PRD to start this workspace.
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[var(--on-surface-variant)]">
              The PRD becomes the structured source definition for requirement modeling,
              review, and later roadmap generation.
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
}
