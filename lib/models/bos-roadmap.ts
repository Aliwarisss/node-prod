import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const stringListField = {
  type: [String],
  default: [],
};

const summarySchema = new Schema(
  {
    oneLiner: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    whyNow: { type: String, default: "", trim: true },
    expectedOutcome: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const problemSchema = new Schema(
  {
    statement: { type: String, default: "", trim: true },
    currentPain: { type: String, default: "", trim: true },
    businessImpact: { type: String, default: "", trim: true },
    userImpact: { type: String, default: "", trim: true },
    currentWorkarounds: { type: String, default: "", trim: true },
    opportunity: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const visionSchema = new Schema(
  {
    statement: { type: String, default: "", trim: true },
    futureState: { type: String, default: "", trim: true },
    principles: stringListField,
  },
  { _id: false },
);

const goalSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    type: { type: String, default: "business", trim: true },
    priority: { type: String, default: "medium", trim: true },
  },
  { _id: false },
);

const successMetricSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    metric: { type: String, required: true, trim: true },
    target: { type: String, default: "", trim: true },
    measurementMethod: { type: String, default: "", trim: true },
    priority: { type: String, default: "medium", trim: true },
  },
  { _id: false },
);

const targetUserSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    goals: stringListField,
    painPoints: stringListField,
    mainActions: stringListField,
    permissionsNeeded: stringListField,
  },
  { _id: false },
);

const scopeSchema = new Schema(
  {
    inScope: stringListField,
    outOfScope: stringListField,
    mvpScope: stringListField,
    futureScope: stringListField,
  },
  { _id: false },
);

const capabilitySchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    outcome: { type: String, default: "", trim: true },
    priority: { type: String, default: "medium", trim: true },
    relatedUsers: stringListField,
    relatedRequirementIds: stringListField,
  },
  { _id: false },
);

const useCaseSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    actor: { type: String, default: "", trim: true },
    goal: { type: String, default: "", trim: true },
    preconditions: stringListField,
    flow: stringListField,
    outcome: { type: String, default: "", trim: true },
    relatedCapabilityIds: stringListField,
    relatedRequirementIds: stringListField,
  },
  { _id: false },
);

const requirementItemSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, default: "functional", trim: true },
    title: { type: String, required: true, trim: true },
    statement: { type: String, default: "", trim: true },
    reason: { type: String, default: "", trim: true },
    priority: { type: String, default: "medium", trim: true },
    source: { type: String, default: "", trim: true },
    relatedCapabilityIds: stringListField,
    relatedUseCaseIds: stringListField,
    acceptanceHint: { type: String, default: "", trim: true },
    status: { type: String, default: "draft", trim: true },
  },
  { _id: false },
);

const requirementModelSchema = new Schema(
  {
    businessRequirements: stringListField,
    userRequirements: stringListField,
    functionalRequirements: stringListField,
    nonFunctionalRequirements: stringListField,
    domainRequirements: stringListField,
    dataRequirements: stringListField,
    permissionRequirements: stringListField,
    integrationRequirements: stringListField,
    reportingRequirements: stringListField,
    operationalRequirements: stringListField,
    complianceRequirements: stringListField,
    notes: { type: String, default: "", trim: true },
    generatedAt: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const domainRuleSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    rule: { type: String, default: "", trim: true },
    reason: { type: String, default: "", trim: true },
    priority: { type: String, default: "medium", trim: true },
    relatedRequirementIds: stringListField,
  },
  { _id: false },
);

const coreEntitySchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    keyFields: stringListField,
    relationships: stringListField,
  },
  { _id: false },
);

const dataContextSchema = new Schema(
  {
    coreEntities: { type: [coreEntitySchema], default: [] },
    dataOwnership: { type: String, default: "", trim: true },
    dataRetentionNotes: { type: String, default: "", trim: true },
    auditNeeds: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const constraintSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, default: "technical", trim: true },
    description: { type: String, default: "", trim: true },
    impact: { type: String, default: "", trim: true },
    priority: { type: String, default: "medium", trim: true },
  },
  { _id: false },
);

const dependencySchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, default: "internal", trim: true },
    description: { type: String, default: "", trim: true },
    owner: { type: String, default: "", trim: true },
    riskIfMissing: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const riskSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    impact: { type: String, default: "medium", trim: true },
    likelihood: { type: String, default: "medium", trim: true },
    mitigation: { type: String, default: "", trim: true },
    owner: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const releaseExpectationSchema = new Schema(
  {
    mvp: { type: String, default: "", trim: true },
    alpha: { type: String, default: "", trim: true },
    beta: { type: String, default: "", trim: true },
    future: { type: String, default: "", trim: true },
    releaseNotes: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const openQuestionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    context: { type: String, default: "", trim: true },
    owner: { type: String, default: "", trim: true },
    status: { type: String, default: "open", trim: true },
    decisionNeededBy: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const approvalRoleSchema = new Schema(
  {
    reviewer: { type: String, default: "", trim: true },
    state: { type: String, default: "pending", trim: true },
    notes: { type: String, default: "", trim: true },
    updatedAt: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const approvalSchema = new Schema(
  {
    productOwner: {
      type: approvalRoleSchema,
      default: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    },
    domainOwner: {
      type: approvalRoleSchema,
      default: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    },
    engineeringLead: {
      type: approvalRoleSchema,
      default: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    },
    designLead: {
      type: approvalRoleSchema,
      default: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    },
    qaLead: {
      type: approvalRoleSchema,
      default: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
    },
  },
  { _id: false },
);

const changeLogEntrySchema = new Schema(
  {
    version: { type: String, default: "", trim: true },
    date: { type: String, default: "", trim: true },
    author: { type: String, default: "", trim: true },
    change: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const prdSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, default: "draft", trim: true },
    version: { type: String, default: "v0.1", trim: true },
    productId: { type: String, required: true, trim: true },
    module: { type: String, default: "", trim: true },
    owner: { type: String, default: "", trim: true },
    authors: stringListField,
    reviewers: stringListField,
    stakeholders: stringListField,
    createdAt: { type: String, default: "", trim: true },
    updatedAt: { type: String, default: "", trim: true },
    targetRelease: { type: String, default: "", trim: true },
    summary: {
      type: summarySchema,
      default: {
        oneLiner: "",
        description: "",
        whyNow: "",
        expectedOutcome: "",
      },
    },
    problem: {
      type: problemSchema,
      default: {
        statement: "",
        currentPain: "",
        businessImpact: "",
        userImpact: "",
        currentWorkarounds: "",
        opportunity: "",
      },
    },
    vision: {
      type: visionSchema,
      default: {
        statement: "",
        futureState: "",
        principles: [],
      },
    },
    goals: { type: [goalSchema], default: [] },
    successMetrics: { type: [successMetricSchema], default: [] },
    targetUsers: { type: [targetUserSchema], default: [] },
    scope: {
      type: scopeSchema,
      default: {
        inScope: [],
        outOfScope: [],
        mvpScope: [],
        futureScope: [],
      },
    },
    capabilities: { type: [capabilitySchema], default: [] },
    highLevelUseCases: { type: [useCaseSchema], default: [] },
    requirementModel: {
      type: requirementModelSchema,
      default: {
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
    },
    requirementItems: { type: [requirementItemSchema], default: [] },
    domainRules: { type: [domainRuleSchema], default: [] },
    dataContext: {
      type: dataContextSchema,
      default: {
        coreEntities: [],
        dataOwnership: "",
        dataRetentionNotes: "",
        auditNeeds: "",
      },
    },
    uxPrinciples: stringListField,
    constraints: { type: [constraintSchema], default: [] },
    dependencies: { type: [dependencySchema], default: [] },
    risks: { type: [riskSchema], default: [] },
    releaseExpectation: {
      type: releaseExpectationSchema,
      default: {
        mvp: "",
        alpha: "",
        beta: "",
        future: "",
        releaseNotes: "",
      },
    },
    openQuestions: { type: [openQuestionSchema], default: [] },
    approval: {
      type: approvalSchema,
      default: {
        productOwner: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
        domainOwner: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
        engineeringLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
        designLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
        qaLead: { reviewer: "", state: "pending", notes: "", updatedAt: "" },
      },
    },
    changeLog: { type: [changeLogEntrySchema], default: [] },
  },
  { _id: false },
);

const bosRoadmapSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    status: { type: String, default: "active", trim: true },
    owner: { type: String, default: "", trim: true },
    summary: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    modules: stringListField,
    order: { type: Number, default: 0 },
    prds: { type: [prdSchema], default: [] },
    createdBy: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  },
);

export type BosRoadmapDocument = InferSchemaType<typeof bosRoadmapSchema> & {
  _id: Schema.Types.ObjectId;
};

export const BosRoadmapModel =
  (models.BosRoadmap as Model<BosRoadmapDocument> | undefined) ??
  model<BosRoadmapDocument>("BosRoadmap", bosRoadmapSchema);
