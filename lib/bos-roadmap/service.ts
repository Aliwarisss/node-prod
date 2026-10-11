import { connectToDatabase } from "@/lib/mongodb";
import { BosRoadmapModel } from "@/lib/models/bos-roadmap";

import {
  prdCreateSchema,
  prdStatusValues,
  prdUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  requirementTypeValues,
  type ApprovalInput,
  type PrdInput,
  type ProductInput,
} from "./schemas";
import type {
  Capability,
  ChangeLogEntry,
  Constraint,
  CoreEntity,
  Dependency,
  DomainRule,
  Goal,
  OpenQuestion,
  Prd,
  Product,
  ProductSummary,
  RequirementItem,
  Risk,
  SuccessMetric,
  TargetUser,
  UseCase,
} from "./types";

type RawProductRecord = Record<string, unknown> & {
  _id?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

type ApprovalRoleKey = keyof ApprovalInput;

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeGoal(input: PrdInput["goals"][number]): Goal {
  return {
    ...input,
    id: input.id ?? createId("goal"),
  };
}

function normalizeMetric(input: PrdInput["successMetrics"][number]): SuccessMetric {
  return {
    ...input,
    id: input.id ?? createId("metric"),
  };
}

function normalizeTargetUser(input: PrdInput["targetUsers"][number]): TargetUser {
  return {
    ...input,
    id: input.id ?? createId("persona"),
  };
}

function normalizeCapability(input: PrdInput["capabilities"][number]): Capability {
  return {
    ...input,
    id: input.id ?? createId("capability"),
  };
}

function normalizeUseCase(input: PrdInput["highLevelUseCases"][number]): UseCase {
  return {
    ...input,
    id: input.id ?? createId("use-case"),
  };
}

function normalizeRequirementItem(
  input: PrdInput["requirementItems"][number],
): RequirementItem {
  return {
    ...input,
    id: input.id ?? createId("requirement"),
  };
}

function normalizeDomainRule(input: PrdInput["domainRules"][number]): DomainRule {
  return {
    ...input,
    id: input.id ?? createId("rule"),
  };
}

function normalizeCoreEntity(input: PrdInput["dataContext"]["coreEntities"][number]): CoreEntity {
  return {
    ...input,
    id: input.id ?? createId("entity"),
  };
}

function normalizeConstraint(input: PrdInput["constraints"][number]): Constraint {
  return {
    ...input,
    id: input.id ?? createId("constraint"),
  };
}

function normalizeDependency(input: PrdInput["dependencies"][number]): Dependency {
  return {
    ...input,
    id: input.id ?? createId("dependency"),
  };
}

function normalizeRisk(input: PrdInput["risks"][number]): Risk {
  return {
    ...input,
    id: input.id ?? createId("risk"),
  };
}

function normalizeQuestion(input: PrdInput["openQuestions"][number]): OpenQuestion {
  return {
    ...input,
    id: input.id ?? createId("question"),
  };
}

function normalizeChangeLogEntry(entry: ChangeLogEntry): ChangeLogEntry {
  return {
    version: entry.version ?? "",
    date: entry.date ?? "",
    author: entry.author ?? "",
    change: entry.change ?? "",
  };
}

function normalizeApproval(approval: PrdInput["approval"]): ApprovalInput {
  return {
    productOwner: approval.productOwner,
    domainOwner: approval.domainOwner,
    engineeringLead: approval.engineeringLead,
    designLead: approval.designLead,
    qaLead: approval.qaLead,
  };
}

function buildRequirementModel(requirementItems: RequirementItem[]) {
  const model = {
    businessRequirements: [] as string[],
    userRequirements: [] as string[],
    functionalRequirements: [] as string[],
    nonFunctionalRequirements: [] as string[],
    domainRequirements: [] as string[],
    dataRequirements: [] as string[],
    permissionRequirements: [] as string[],
    integrationRequirements: [] as string[],
    reportingRequirements: [] as string[],
    operationalRequirements: [] as string[],
    complianceRequirements: [] as string[],
  };

  for (const requirement of requirementItems) {
    switch (requirement.type) {
      case "business":
        model.businessRequirements.push(requirement.id);
        break;
      case "user":
        model.userRequirements.push(requirement.id);
        break;
      case "functional":
        model.functionalRequirements.push(requirement.id);
        break;
      case "non_functional":
        model.nonFunctionalRequirements.push(requirement.id);
        break;
      case "domain":
        model.domainRequirements.push(requirement.id);
        break;
      case "data":
        model.dataRequirements.push(requirement.id);
        break;
      case "permission":
        model.permissionRequirements.push(requirement.id);
        break;
      case "integration":
        model.integrationRequirements.push(requirement.id);
        break;
      case "reporting":
        model.reportingRequirements.push(requirement.id);
        break;
      case "operational":
        model.operationalRequirements.push(requirement.id);
        break;
      case "compliance":
        model.complianceRequirements.push(requirement.id);
        break;
      default:
        break;
    }
  }

  return model;
}

function normalizePrd(input: PrdInput, productId: string, existing?: Prd): Prd {
  const parsed = prdCreateSchema.parse({
    ...input,
    productId,
  });
  const createdAt = existing?.createdAt || parsed.createdAt || nowIso();
  const updatedAt = nowIso();
  const requirementItems = parsed.requirementItems.map(normalizeRequirementItem);
  const generatedRequirementModel = buildRequirementModel(requirementItems);

  return {
    id: input.id ?? existing?.id ?? createId("prd"),
    title: parsed.title,
    status: parsed.status,
    version: parsed.version,
    productId,
    module: parsed.module,
    owner: parsed.owner,
    authors: parsed.authors,
    reviewers: parsed.reviewers,
    stakeholders: parsed.stakeholders,
    createdAt,
    updatedAt,
    targetRelease: parsed.targetRelease,
    summary: parsed.summary,
    problem: parsed.problem,
    vision: parsed.vision,
    goals: parsed.goals.map(normalizeGoal),
    successMetrics: parsed.successMetrics.map(normalizeMetric),
    targetUsers: parsed.targetUsers.map(normalizeTargetUser),
    scope: parsed.scope,
    capabilities: parsed.capabilities.map(normalizeCapability),
    highLevelUseCases: parsed.highLevelUseCases.map(normalizeUseCase),
    requirementModel: {
      ...generatedRequirementModel,
      notes: parsed.requirementModel.notes,
      generatedAt:
        parsed.requirementModel.generatedAt || existing?.requirementModel.generatedAt || "",
    },
    requirementItems,
    domainRules: parsed.domainRules.map(normalizeDomainRule),
    dataContext: {
      ...parsed.dataContext,
      coreEntities: parsed.dataContext.coreEntities.map(normalizeCoreEntity),
    },
    uxPrinciples: parsed.uxPrinciples,
    constraints: parsed.constraints.map(normalizeConstraint),
    dependencies: parsed.dependencies.map(normalizeDependency),
    risks: parsed.risks.map(normalizeRisk),
    releaseExpectation: parsed.releaseExpectation,
    openQuestions: parsed.openQuestions.map(normalizeQuestion),
    approval: normalizeApproval(parsed.approval),
    changeLog: parsed.changeLog.map(normalizeChangeLogEntry),
  };
}

function hydratePrd(input: PrdInput, productId: string): Prd {
  const parsed = prdCreateSchema.parse({
    ...input,
    productId,
  });

  return {
    id: input.id ?? createId("prd"),
    title: parsed.title,
    status: parsed.status,
    version: parsed.version,
    productId,
    module: parsed.module,
    owner: parsed.owner,
    authors: parsed.authors,
    reviewers: parsed.reviewers,
    stakeholders: parsed.stakeholders,
    createdAt: parsed.createdAt || nowIso(),
    updatedAt: parsed.updatedAt || parsed.createdAt || nowIso(),
    targetRelease: parsed.targetRelease,
    summary: parsed.summary,
    problem: parsed.problem,
    vision: parsed.vision,
    goals: parsed.goals.map(normalizeGoal),
    successMetrics: parsed.successMetrics.map(normalizeMetric),
    targetUsers: parsed.targetUsers.map(normalizeTargetUser),
    scope: parsed.scope,
    capabilities: parsed.capabilities.map(normalizeCapability),
    highLevelUseCases: parsed.highLevelUseCases.map(normalizeUseCase),
    requirementModel: parsed.requirementModel,
    requirementItems: parsed.requirementItems.map(normalizeRequirementItem),
    domainRules: parsed.domainRules.map(normalizeDomainRule),
    dataContext: {
      ...parsed.dataContext,
      coreEntities: parsed.dataContext.coreEntities.map(normalizeCoreEntity),
    },
    uxPrinciples: parsed.uxPrinciples,
    constraints: parsed.constraints.map(normalizeConstraint),
    dependencies: parsed.dependencies.map(normalizeDependency),
    risks: parsed.risks.map(normalizeRisk),
    releaseExpectation: parsed.releaseExpectation,
    openQuestions: parsed.openQuestions.map(normalizeQuestion),
    approval: normalizeApproval(parsed.approval),
    changeLog: parsed.changeLog.map(normalizeChangeLogEntry),
  };
}

function serializeProduct(doc: RawProductRecord): Product {
  const createdAt =
    doc.createdAt instanceof Date ? doc.createdAt.toISOString() : nowIso();
  const updatedAt =
    doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : nowIso();
  const prds = Array.isArray(doc.prds)
    ? (doc.prds as Prd[]).map((prd) => hydratePrd(prd, prd.productId || String(doc.id)))
    : [];

  return {
    id: String(doc.id),
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    status: (doc.status as Product["status"]) ?? "active",
    owner: String(doc.owner ?? ""),
    summary: String(doc.summary ?? ""),
    description: String(doc.description ?? ""),
    modules: Array.isArray(doc.modules) ? (doc.modules as string[]) : [],
    order: typeof doc.order === "number" ? doc.order : 0,
    prds,
    createdAt,
    updatedAt,
  };
}

function summarizeProduct(product: Product): ProductSummary {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    status: product.status,
    owner: product.owner,
    summary: product.summary,
    updatedAt: product.updatedAt,
    prdCount: product.prds.length,
    approvedPrdCount: product.prds.filter((prd) => prd.status === "approved").length,
    openQuestionCount: product.prds.reduce(
      (total, prd) =>
        total + prd.openQuestions.filter((question) => question.status === "open").length,
      0,
    ),
  };
}

async function findProductRecord(productId: string) {
  await connectToDatabase();
  return (await BosRoadmapModel.collection.findOne({
    id: productId,
  })) as RawProductRecord | null;
}

async function persistProduct(product: Product, actorId: string) {
  await connectToDatabase();
  await BosRoadmapModel.collection.updateOne(
    { id: product.id },
    {
      $set: {
        ...product,
        updatedBy: actorId,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdBy: actorId,
      },
    },
    { upsert: true },
  );

  const saved = await findProductById(product.id);
  if (!saved) {
    throw new Error("Failed to reload saved product.");
  }

  return saved;
}

function assertReadyForReview(prd: Prd) {
  if (!prd.title.trim()) {
    throw new Error("PRD title is required.");
  }
  if (!prd.problem.statement.trim()) {
    throw new Error("Problem statement is required before review.");
  }
  if (prd.goals.length === 0) {
    throw new Error("Add at least one goal before review.");
  }
  if (prd.targetUsers.length === 0) {
    throw new Error("Add at least one target user before review.");
  }
  if (prd.scope.inScope.length === 0 || prd.scope.outOfScope.length === 0) {
    throw new Error("Scope and non-scope are required before review.");
  }
}

function assertReadyForApproval(prd: Prd) {
  assertReadyForReview(prd);
  const unresolvedQuestion = prd.openQuestions.find(
    (question) => question.status === "open",
  );
  if (unresolvedQuestion) {
    throw new Error("Resolve or explicitly accept all open questions before approval.");
  }
}

function assertReadyForRoadmap(prd: Prd) {
  if (prd.capabilities.length === 0) {
    throw new Error("Add at least one capability before roadmap generation.");
  }
}

function replacePrd(product: Product, nextPrd: Prd) {
  return {
    ...product,
    prds: product.prds.map((prd) => (prd.id === nextPrd.id ? nextPrd : prd)),
    updatedAt: nowIso(),
  };
}

function appendChange(productPrd: Prd, author: string, change: string): Prd {
  return {
    ...productPrd,
    changeLog: [
      {
        version: productPrd.version,
        date: new Date().toISOString().slice(0, 10),
        author,
        change,
      },
      ...productPrd.changeLog,
    ],
    updatedAt: nowIso(),
  };
}

export async function listProductSummaries() {
  await connectToDatabase();
  const docs = (await BosRoadmapModel.collection
    .find({})
    .sort({ order: 1, updatedAt: -1 })
    .toArray()) as RawProductRecord[];

  return docs.map((doc) => summarizeProduct(serializeProduct(doc)));
}

export async function findProductById(productId: string) {
  const rawRecord = await findProductRecord(productId);
  return rawRecord ? serializeProduct(rawRecord) : null;
}

export async function createProduct(input: ProductInput, actorId: string) {
  await connectToDatabase();
  const count = await BosRoadmapModel.countDocuments();
  const parsed = productCreateSchema.parse({
    ...input,
    order: input.order ?? count,
  });
  const createdAt = nowIso();
  const product: Product = {
    id: input.id ?? createId("product"),
    title: parsed.title,
    slug: parsed.slug,
    status: parsed.status,
    owner: parsed.owner,
    summary: parsed.summary,
    description: parsed.description,
    modules: parsed.modules,
    order: parsed.order,
    prds: parsed.prds.map((prd) => normalizePrd(prd, input.id ?? createId("product"))),
    createdAt,
    updatedAt: createdAt,
  };

  const normalizedProduct = {
    ...product,
    prds: parsed.prds.map((prd) => normalizePrd(prd, product.id)),
  };

  return persistProduct(normalizedProduct, actorId);
}

export async function updateProduct(
  productId: string,
  input: Partial<ProductInput>,
  actorId: string,
) {
  const current = await findProductById(productId);
  if (!current) {
    return null;
  }

  const parsed = productUpdateSchema.parse(input);
  const nextProduct: Product = {
    ...current,
    ...parsed,
    updatedAt: nowIso(),
  };

  return persistProduct(nextProduct, actorId);
}

export async function deleteProduct(productId: string) {
  await connectToDatabase();
  const rawRecord = await BosRoadmapModel.collection.findOneAndDelete({ id: productId });
  return rawRecord ? serializeProduct(rawRecord as RawProductRecord) : null;
}

export async function createPrd(productId: string, input: PrdInput, actorId: string) {
  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  const prd = normalizePrd(input, product.id);
  const nextProduct: Product = {
    ...product,
    prds: [...product.prds, prd],
    updatedAt: nowIso(),
  };

  const saved = await persistProduct(nextProduct, actorId);
  return {
    prd: saved.prds.find((item) => item.id === prd.id) ?? prd,
    product: saved,
  };
}

export async function updatePrd(
  productId: string,
  prdId: string,
  input: Partial<PrdInput>,
  actorId: string,
) {
  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  const currentPrd = product.prds.find((item) => item.id === prdId);
  if (!currentPrd) {
    return null;
  }

  const parsed = prdUpdateSchema.parse(input);
  const merged = {
    ...currentPrd,
    ...parsed,
    productId: product.id,
    createdAt: currentPrd.createdAt,
  };
  const nextPrd = normalizePrd(merged, product.id, currentPrd);
  const nextProduct = replacePrd(product, nextPrd);
  const saved = await persistProduct(nextProduct, actorId);

  return {
    prd: saved.prds.find((item) => item.id === prdId) ?? nextPrd,
    product: saved,
  };
}

export async function deletePrd(productId: string, prdId: string, actorId: string) {
  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  const prdExists = product.prds.some((item) => item.id === prdId);
  if (!prdExists) {
    return null;
  }

  const nextProduct: Product = {
    ...product,
    prds: product.prds.filter((item) => item.id !== prdId),
    updatedAt: nowIso(),
  };

  return persistProduct(nextProduct, actorId);
}

export async function submitPrdForReview(
  productId: string,
  prdId: string,
  actorId: string,
) {
  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  const currentPrd = product.prds.find((item) => item.id === prdId);
  if (!currentPrd) {
    return null;
  }

  assertReadyForReview(currentPrd);
  const nextPrd = appendChange(
    {
      ...currentPrd,
      status: "in_review",
    },
    actorId,
    "Submitted PRD for review.",
  );

  const saved = await persistProduct(replacePrd(product, nextPrd), actorId);
  return {
    prd: saved.prds.find((item) => item.id === prdId) ?? nextPrd,
    product: saved,
  };
}

export async function approvePrdRole(
  productId: string,
  prdId: string,
  role: ApprovalRoleKey,
  reviewer: string,
  notes: string,
  actorId: string,
) {
  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  const currentPrd = product.prds.find((item) => item.id === prdId);
  if (!currentPrd) {
    return null;
  }

  assertReadyForApproval(currentPrd);
  const nextApproval = {
    ...currentPrd.approval,
    [role]: {
      reviewer,
      state: "approved",
      notes,
      updatedAt: nowIso(),
    },
  };

  const allApproved = Object.values(nextApproval).every(
    (approvalItem) => approvalItem.state === "approved",
  );
  const nextPrd = appendChange(
    {
      ...currentPrd,
      approval: nextApproval,
      status: allApproved ? "approved" : currentPrd.status,
    },
    actorId,
    `${role} approval recorded.`,
  );

  const saved = await persistProduct(replacePrd(product, nextPrd), actorId);
  return {
    prd: saved.prds.find((item) => item.id === prdId) ?? nextPrd,
    product: saved,
  };
}

export async function generateRequirementModel(
  productId: string,
  prdId: string,
  actorId: string,
) {
  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  const currentPrd = product.prds.find((item) => item.id === prdId);
  if (!currentPrd) {
    return null;
  }

  const grouped = buildRequirementModel(currentPrd.requirementItems);
  const nextPrd = appendChange(
    {
      ...currentPrd,
      requirementModel: {
        ...currentPrd.requirementModel,
        ...grouped,
        generatedAt: nowIso(),
      },
    },
    actorId,
    "Regenerated requirement model from requirement items.",
  );

  const saved = await persistProduct(replacePrd(product, nextPrd), actorId);
  return {
    prd: saved.prds.find((item) => item.id === prdId) ?? nextPrd,
    product: saved,
  };
}

export async function generateRoadmapPlaceholder(
  productId: string,
  prdId: string,
  actorId: string,
) {
  const product = await findProductById(productId);
  if (!product) {
    return null;
  }

  const currentPrd = product.prds.find((item) => item.id === prdId);
  if (!currentPrd) {
    return null;
  }

  assertReadyForRoadmap(currentPrd);
  const nextPrd = appendChange(
    currentPrd,
    actorId,
    "Roadmap generation placeholder executed. Roadmap generation is ready to be wired.",
  );

  const saved = await persistProduct(replacePrd(product, nextPrd), actorId);
  return {
    prd: saved.prds.find((item) => item.id === prdId) ?? nextPrd,
    product: saved,
  };
}

export function validatePrdStatusValue(status: string) {
  return (prdStatusValues as readonly string[]).includes(status);
}

export function validateRequirementTypeValue(type: string) {
  return (requirementTypeValues as readonly string[]).includes(type);
}
