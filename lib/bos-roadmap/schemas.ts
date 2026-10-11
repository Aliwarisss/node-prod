import { z } from "zod";

const trimmedString = z.string().trim().default("");
const optionalId = z.string().trim().min(1).optional();
const stringList = z.array(z.string().trim().min(1)).default([]);

export const productStatusValues = ["planning", "active", "archived"] as const;
export const prdStatusValues = [
  "draft",
  "in_review",
  "approved",
  "in_execution",
  "released",
  "deprecated",
] as const;
export const itemPriorityValues = ["low", "medium", "high", "critical"] as const;
export const goalTypeValues = ["business", "user", "operational", "technical"] as const;
export const requirementTypeValues = [
  "business",
  "user",
  "functional",
  "non_functional",
  "domain",
  "data",
  "permission",
  "integration",
  "reporting",
  "operational",
  "compliance",
] as const;
export const openQuestionStatusValues = ["open", "resolved", "accepted"] as const;
export const approvalStateValues = ["pending", "approved", "rejected"] as const;
export const dependencyTypeValues = [
  "internal",
  "external",
  "integration",
  "data",
  "compliance",
] as const;
export const constraintTypeValues = [
  "technical",
  "design",
  "data",
  "security",
  "legal",
  "operational",
  "resourcing",
] as const;
export const impactValues = ["low", "medium", "high", "critical"] as const;
export const likelihoodValues = ["low", "medium", "high"] as const;

const summarySchema = z.object({
  oneLiner: trimmedString,
  description: trimmedString,
  whyNow: trimmedString,
  expectedOutcome: trimmedString,
});

const problemSchema = z.object({
  statement: trimmedString,
  currentPain: trimmedString,
  businessImpact: trimmedString,
  userImpact: trimmedString,
  currentWorkarounds: trimmedString,
  opportunity: trimmedString,
});

const visionSchema = z.object({
  statement: trimmedString,
  futureState: trimmedString,
  principles: stringList,
});

const goalSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  description: trimmedString,
  type: z.enum(goalTypeValues).default("business"),
  priority: z.enum(itemPriorityValues).default("medium"),
});

const successMetricSchema = z.object({
  id: optionalId,
  metric: z.string().trim().min(1),
  target: trimmedString,
  measurementMethod: trimmedString,
  priority: z.enum(itemPriorityValues).default("medium"),
});

const targetUserSchema = z.object({
  id: optionalId,
  role: z.string().trim().min(1),
  description: trimmedString,
  goals: stringList,
  painPoints: stringList,
  mainActions: stringList,
  permissionsNeeded: stringList,
});

const scopeSchema = z.object({
  inScope: stringList,
  outOfScope: stringList,
  mvpScope: stringList,
  futureScope: stringList,
});

const capabilitySchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  description: trimmedString,
  outcome: trimmedString,
  priority: z.enum(itemPriorityValues).default("medium"),
  relatedUsers: stringList,
  relatedRequirementIds: stringList,
});

const useCaseSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  actor: trimmedString,
  goal: trimmedString,
  preconditions: stringList,
  flow: stringList,
  outcome: trimmedString,
  relatedCapabilityIds: stringList,
  relatedRequirementIds: stringList,
});

const requirementItemSchema = z.object({
  id: optionalId,
  type: z.enum(requirementTypeValues).default("functional"),
  title: z.string().trim().min(1),
  statement: trimmedString,
  reason: trimmedString,
  priority: z.enum(itemPriorityValues).default("medium"),
  source: trimmedString,
  relatedCapabilityIds: stringList,
  relatedUseCaseIds: stringList,
  acceptanceHint: trimmedString,
  status: trimmedString.default("draft"),
});

const requirementModelSchema = z.object({
  businessRequirements: stringList,
  userRequirements: stringList,
  functionalRequirements: stringList,
  nonFunctionalRequirements: stringList,
  domainRequirements: stringList,
  dataRequirements: stringList,
  permissionRequirements: stringList,
  integrationRequirements: stringList,
  reportingRequirements: stringList,
  operationalRequirements: stringList,
  complianceRequirements: stringList,
  notes: trimmedString,
  generatedAt: trimmedString,
});

const domainRuleSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  rule: trimmedString,
  reason: trimmedString,
  priority: z.enum(itemPriorityValues).default("medium"),
  relatedRequirementIds: stringList,
});

const coreEntitySchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1),
  description: trimmedString,
  keyFields: stringList,
  relationships: stringList,
});

const dataContextSchema = z.object({
  coreEntities: z.array(coreEntitySchema).default([]),
  dataOwnership: trimmedString,
  dataRetentionNotes: trimmedString,
  auditNeeds: trimmedString,
});

const constraintSchema = z.object({
  id: optionalId,
  type: z.enum(constraintTypeValues).default("technical"),
  description: trimmedString,
  impact: trimmedString,
  priority: z.enum(itemPriorityValues).default("medium"),
});

const dependencySchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  type: z.enum(dependencyTypeValues).default("internal"),
  description: trimmedString,
  owner: trimmedString,
  riskIfMissing: trimmedString,
});

const riskSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  description: trimmedString,
  impact: z.enum(impactValues).default("medium"),
  likelihood: z.enum(likelihoodValues).default("medium"),
  mitigation: trimmedString,
  owner: trimmedString,
});

const releaseExpectationSchema = z.object({
  mvp: trimmedString,
  alpha: trimmedString,
  beta: trimmedString,
  future: trimmedString,
  releaseNotes: trimmedString,
});

const openQuestionSchema = z.object({
  id: optionalId,
  question: z.string().trim().min(1),
  context: trimmedString,
  owner: trimmedString,
  status: z.enum(openQuestionStatusValues).default("open"),
  decisionNeededBy: trimmedString,
});

const approvalRoleSchema = z.object({
  reviewer: trimmedString,
  state: z.enum(approvalStateValues).default("pending"),
  notes: trimmedString,
  updatedAt: trimmedString,
});

const approvalSchema = z.object({
  productOwner: approvalRoleSchema.default({
    reviewer: "",
    state: "pending",
    notes: "",
    updatedAt: "",
  }),
  domainOwner: approvalRoleSchema.default({
    reviewer: "",
    state: "pending",
    notes: "",
    updatedAt: "",
  }),
  engineeringLead: approvalRoleSchema.default({
    reviewer: "",
    state: "pending",
    notes: "",
    updatedAt: "",
  }),
  designLead: approvalRoleSchema.default({
    reviewer: "",
    state: "pending",
    notes: "",
    updatedAt: "",
  }),
  qaLead: approvalRoleSchema.default({
    reviewer: "",
    state: "pending",
    notes: "",
    updatedAt: "",
  }),
});

const changeLogEntrySchema = z.object({
  version: trimmedString,
  date: trimmedString,
  author: trimmedString,
  change: trimmedString,
});

export const prdSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  status: z.enum(prdStatusValues).default("draft"),
  version: trimmedString.default("v0.1"),
  productId: z.string().trim().min(1),
  module: trimmedString,
  owner: trimmedString,
  authors: stringList,
  reviewers: stringList,
  stakeholders: stringList,
  createdAt: trimmedString,
  updatedAt: trimmedString,
  targetRelease: trimmedString,
  summary: summarySchema.default({
    oneLiner: "",
    description: "",
    whyNow: "",
    expectedOutcome: "",
  }),
  problem: problemSchema.default({
    statement: "",
    currentPain: "",
    businessImpact: "",
    userImpact: "",
    currentWorkarounds: "",
    opportunity: "",
  }),
  vision: visionSchema.default({
    statement: "",
    futureState: "",
    principles: [],
  }),
  goals: z.array(goalSchema).default([]),
  successMetrics: z.array(successMetricSchema).default([]),
  targetUsers: z.array(targetUserSchema).default([]),
  scope: scopeSchema.default({
    inScope: [],
    outOfScope: [],
    mvpScope: [],
    futureScope: [],
  }),
  capabilities: z.array(capabilitySchema).default([]),
  highLevelUseCases: z.array(useCaseSchema).default([]),
  requirementModel: requirementModelSchema.default({
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
  }),
  requirementItems: z.array(requirementItemSchema).default([]),
  domainRules: z.array(domainRuleSchema).default([]),
  dataContext: dataContextSchema.default({
    coreEntities: [],
    dataOwnership: "",
    dataRetentionNotes: "",
    auditNeeds: "",
  }),
  uxPrinciples: stringList,
  constraints: z.array(constraintSchema).default([]),
  dependencies: z.array(dependencySchema).default([]),
  risks: z.array(riskSchema).default([]),
  releaseExpectation: releaseExpectationSchema.default({
    mvp: "",
    alpha: "",
    beta: "",
    future: "",
    releaseNotes: "",
  }),
  openQuestions: z.array(openQuestionSchema).default([]),
  approval: approvalSchema.default({
    productOwner: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    domainOwner: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    engineeringLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    designLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    qaLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
  }),
  changeLog: z.array(changeLogEntrySchema).default([]),
});

export const productSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  status: z.enum(productStatusValues).default("active"),
  owner: trimmedString,
  summary: trimmedString,
  description: trimmedString,
  modules: stringList,
  order: z.number().int().default(0),
  prds: z.array(prdSchema).default([]),
});

export const productCreateSchema = productSchema.omit({ id: true });
export const productUpdateSchema = productSchema
  .omit({ id: true, prds: true })
  .partial();
export const prdCreateSchema = prdSchema.omit({ id: true });
export const prdUpdateSchema = prdSchema.omit({ id: true, productId: true }).partial();

export type ProductStatus = (typeof productStatusValues)[number];
export type PrdStatus = (typeof prdStatusValues)[number];
export type ItemPriority = (typeof itemPriorityValues)[number];
export type GoalType = (typeof goalTypeValues)[number];
export type RequirementType = (typeof requirementTypeValues)[number];
export type OpenQuestionStatus = (typeof openQuestionStatusValues)[number];
export type ApprovalState = (typeof approvalStateValues)[number];
export type DependencyType = (typeof dependencyTypeValues)[number];
export type ConstraintType = (typeof constraintTypeValues)[number];
export type ImpactValue = (typeof impactValues)[number];
export type LikelihoodValue = (typeof likelihoodValues)[number];

export type SummaryInput = z.infer<typeof summarySchema>;
export type ProblemInput = z.infer<typeof problemSchema>;
export type VisionInput = z.infer<typeof visionSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type SuccessMetricInput = z.infer<typeof successMetricSchema>;
export type TargetUserInput = z.infer<typeof targetUserSchema>;
export type ScopeInput = z.infer<typeof scopeSchema>;
export type CapabilityInput = z.infer<typeof capabilitySchema>;
export type UseCaseInput = z.infer<typeof useCaseSchema>;
export type RequirementItemInput = z.infer<typeof requirementItemSchema>;
export type RequirementModelInput = z.infer<typeof requirementModelSchema>;
export type DomainRuleInput = z.infer<typeof domainRuleSchema>;
export type CoreEntityInput = z.infer<typeof coreEntitySchema>;
export type DataContextInput = z.infer<typeof dataContextSchema>;
export type ConstraintInput = z.infer<typeof constraintSchema>;
export type DependencyInput = z.infer<typeof dependencySchema>;
export type RiskInput = z.infer<typeof riskSchema>;
export type ReleaseExpectationInput = z.infer<typeof releaseExpectationSchema>;
export type OpenQuestionInput = z.infer<typeof openQuestionSchema>;
export type ApprovalRoleInput = z.infer<typeof approvalRoleSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;
export type ChangeLogEntryInput = z.infer<typeof changeLogEntrySchema>;
export type PrdInput = z.infer<typeof prdSchema>;
export type ProductInput = z.infer<typeof productSchema>;
