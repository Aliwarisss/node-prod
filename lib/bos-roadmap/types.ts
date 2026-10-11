import type {
  ApprovalInput,
  CapabilityInput,
  ChangeLogEntryInput,
  ConstraintInput,
  CoreEntityInput,
  DataContextInput,
  DependencyInput,
  DomainRuleInput,
  GoalInput,
  OpenQuestionInput,
  PrdInput,
  ProductInput,
  ReleaseExpectationInput,
  RequirementItemInput,
  RequirementModelInput,
  RiskInput,
  ScopeInput,
  SuccessMetricInput,
  SummaryInput,
  TargetUserInput,
  UseCaseInput,
  VisionInput,
  ProblemInput,
} from "./schemas";

export type Summary = SummaryInput;
export type Problem = ProblemInput;
export type Vision = VisionInput;
export type Goal = GoalInput & { id: string };
export type SuccessMetric = SuccessMetricInput & { id: string };
export type TargetUser = TargetUserInput & { id: string };
export type ScopeModel = ScopeInput;
export type Capability = CapabilityInput & { id: string };
export type UseCase = UseCaseInput & { id: string };
export type RequirementItem = RequirementItemInput & { id: string };
export type RequirementModel = RequirementModelInput;
export type DomainRule = DomainRuleInput & { id: string };
export type CoreEntity = CoreEntityInput & { id: string };
export type DataContext = Omit<DataContextInput, "coreEntities"> & {
  coreEntities: CoreEntity[];
};
export type Constraint = ConstraintInput & { id: string };
export type Dependency = DependencyInput & { id: string };
export type Risk = RiskInput & { id: string };
export type ReleaseExpectation = ReleaseExpectationInput;
export type OpenQuestion = OpenQuestionInput & { id: string };
export type Approval = ApprovalInput;
export type ChangeLogEntry = ChangeLogEntryInput;

export type Prd = Omit<
  PrdInput,
  | "id"
  | "goals"
  | "successMetrics"
  | "targetUsers"
  | "capabilities"
  | "highLevelUseCases"
  | "requirementItems"
  | "domainRules"
  | "dataContext"
  | "constraints"
  | "dependencies"
  | "risks"
  | "openQuestions"
> & {
  id: string;
  goals: Goal[];
  successMetrics: SuccessMetric[];
  targetUsers: TargetUser[];
  capabilities: Capability[];
  highLevelUseCases: UseCase[];
  requirementItems: RequirementItem[];
  domainRules: DomainRule[];
  dataContext: DataContext;
  constraints: Constraint[];
  dependencies: Dependency[];
  risks: Risk[];
  openQuestions: OpenQuestion[];
};

export type Product = Omit<ProductInput, "id" | "prds"> & {
  id: string;
  prds: Prd[];
  createdAt: string;
  updatedAt: string;
};

export type ProductSummary = {
  id: string;
  title: string;
  slug: string;
  status: Product["status"];
  owner: string;
  summary: string;
  updatedAt: string;
  prdCount: number;
  approvedPrdCount: number;
  openQuestionCount: number;
};
