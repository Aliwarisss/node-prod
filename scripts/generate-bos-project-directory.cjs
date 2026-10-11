const fs = require("node:fs");
const path = require("node:path");

function goal(id, title, description, type, priority) {
  return { id, title, description, type, priority };
}

function metric(id, metric, target, measurementMethod, priority) {
  return { id, metric, target, measurementMethod, priority };
}

function persona(id, role, description, goals, painPoints, mainActions, permissionsNeeded) {
  return {
    id,
    role,
    description,
    goals,
    painPoints,
    mainActions,
    permissionsNeeded,
  };
}

function capability(
  id,
  title,
  description,
  outcome,
  priority,
  relatedUsers,
  relatedRequirementIds,
) {
  return {
    id,
    title,
    description,
    outcome,
    priority,
    relatedUsers,
    relatedRequirementIds,
  };
}

function useCase(
  id,
  title,
  actor,
  goalText,
  preconditions,
  flow,
  outcome,
  relatedCapabilityIds,
  relatedRequirementIds,
) {
  return {
    id,
    title,
    actor,
    goal: goalText,
    preconditions,
    flow,
    outcome,
    relatedCapabilityIds,
    relatedRequirementIds,
  };
}

function requirement(
  id,
  type,
  title,
  statement,
  reason,
  priority,
  source,
  relatedCapabilityIds,
  relatedUseCaseIds,
  acceptanceHint,
) {
  return {
    id,
    type,
    title,
    statement,
    reason,
    priority,
    source,
    relatedCapabilityIds,
    relatedUseCaseIds,
    acceptanceHint,
    status: "draft",
  };
}

function rule(id, title, ruleText, reason, priority, relatedRequirementIds) {
  return { id, title, rule: ruleText, reason, priority, relatedRequirementIds };
}

function entity(id, name, description, keyFields, relationships) {
  return { id, name, description, keyFields, relationships };
}

function constraint(id, type, description, impact, priority) {
  return { id, type, description, impact, priority };
}

function dependency(id, title, type, description, owner, riskIfMissing) {
  return { id, title, type, description, owner, riskIfMissing };
}

function risk(id, title, description, impact, likelihood, mitigation, owner) {
  return { id, title, description, impact, likelihood, mitigation, owner };
}

function question(id, questionText, context, owner, status, decisionNeededBy) {
  return {
    id,
    question: questionText,
    context,
    owner,
    status,
    decisionNeededBy,
  };
}

function approvalRole(reviewer, state, notes, updatedAt) {
  return { reviewer, state, notes, updatedAt };
}

function prd(data) {
  return data;
}

const productId = "product-business-operating-system";

const product = {
  id: productId,
  title: "Business Operating System",
  slug: "business-operating-system",
  status: "active",
  owner: "Chief Product Officer",
  summary:
    "Single product workspace that stores structured PRDs for concrete business modules before roadmap generation begins.",
  description:
    "The Business Operating System is the umbrella platform for ERP, CRM, HRM, SCM, CX, GRC, ITSM, BI, work management, and marketing modules. This seed focuses on concrete PRDs that can be reviewed, approved, and later expanded into roadmap execution.",
  modules: ["ERP", "CRM", "HRM", "SCM", "CX"],
  order: 0,
  prds: [
    prd({
      id: "prd-crm-lead-intake-and-qualification",
      title: "CRM Lead Intake and Qualification",
      status: "in_review",
      version: "v0.6",
      productId,
      module: "CRM",
      owner: "CRM Product Manager",
      authors: ["CRM Product Manager", "Sales Systems Analyst"],
      reviewers: ["Engineering Lead", "Design Lead", "Sales Director"],
      stakeholders: ["VP Sales", "Revenue Operations", "Customer Success"],
      createdAt: "2026-07-01T09:00:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
      targetRelease: "2026-Q3 Alpha",
      summary: {
        oneLiner:
          "Define the first CRM flow that captures leads, qualifies them, and promotes qualified demand into a usable pipeline record.",
        description:
          "This PRD covers the operational path from inbound lead creation to qualification outcome so sales teams stop managing early funnel work in spreadsheets and chat threads.",
        whyNow:
          "BOS needs a credible CRM foundation before opportunity, forecasting, and account planning flows can be layered on top.",
        expectedOutcome:
          "Sales can review lead source, ownership, qualification reason, and next action from one workflow.",
      },
      problem: {
        statement:
          "Early-stage demand handling is fragmented and inconsistent, so qualified opportunities arrive in the pipeline without reliable source or ownership context.",
        currentPain:
          "Leads are copied between forms, sheets, and messaging tools. Qualification notes are often incomplete or lost.",
        businessImpact:
          "Sales leadership cannot trust funnel conversion metrics or coach reps from a consistent qualification standard.",
        userImpact:
          "Sellers waste time reconstructing context before they can act, while managers cannot tell why leads are stalling.",
        currentWorkarounds:
          "Teams keep manual lead sheets, forward screenshots, and rely on memory during pipeline reviews.",
        opportunity:
          "A structured intake and qualification workflow creates the reusable foundation for downstream CRM modules.",
      },
      vision: {
        statement:
          "Every lead enters CRM with usable context and exits qualification with a deliberate outcome.",
        futureState:
          "Sales operations can inspect the whole intake funnel, and individual sellers can confidently pick up the next best lead without hidden context.",
        principles: [
          "Capture context once at the source",
          "Make qualification decisions explicit",
          "Preserve ownership and activity traceability",
        ],
      },
      goals: [
        goal(
          "goal-crm-funnel-control",
          "Create controlled lead intake",
          "Standardize the minimum information required to create and work a lead.",
          "business",
          "high",
        ),
        goal(
          "goal-crm-qualification-consistency",
          "Make qualification outcomes consistent",
          "Require explicit outcomes, notes, and ownership changes so managers can audit funnel hygiene.",
          "operational",
          "high",
        ),
      ],
      successMetrics: [
        metric(
          "metric-crm-complete-intake",
          "Leads created with full required context",
          "95%+",
          "Weekly audit of new lead records",
          "high",
        ),
        metric(
          "metric-crm-qualified-cycle-time",
          "Median time from new lead to qualification decision",
          "< 48 hours",
          "CRM event timestamps",
          "medium",
        ),
      ],
      targetUsers: [
        persona(
          "persona-crm-sdr",
          "Sales Development Representative",
          "Works inbound leads, qualifies them, and decides whether to progress or disqualify.",
          ["Quickly understand lead context", "Keep queue clean"],
          ["Missing source details", "Unclear ownership after reassignment"],
          ["Create lead", "Update qualification", "Log notes"],
          ["Create leads", "Edit owned leads", "View qualification history"],
        ),
        persona(
          "persona-crm-revops",
          "Revenue Operations Manager",
          "Monitors funnel health and audits whether qualification standards are followed.",
          ["Trust conversion metrics", "Spot stale leads"],
          ["Inconsistent notes", "No reliable disqualification reason"],
          ["Filter by source", "Audit owner changes", "Review outcomes"],
          ["View all leads", "Export reports", "Adjust lead workflow settings"],
        ),
      ],
      scope: {
        inScope: [
          "Lead creation with required source and owner",
          "Qualification and disqualification outcomes",
          "Lead activity history",
          "Lead queue filters for reps and revops",
        ],
        outOfScope: [
          "Marketing attribution modeling",
          "Account planning",
          "Opportunity forecasting",
        ],
        mvpScope: [
          "Manual lead creation",
          "Qualification decision tracking",
          "Owner and history visibility",
        ],
        futureScope: [
          "Automated enrichment",
          "Scoring",
          "Routing based on territory rules",
        ],
      },
      capabilities: [
        capability(
          "capability-crm-intake",
          "Structured lead intake",
          "Create leads with enough context for a seller to act immediately.",
          "Every new lead enters the queue with clear source, owner, and next action.",
          "high",
          ["persona-crm-sdr", "persona-crm-revops"],
          [
            "req-crm-source-owner",
            "req-crm-required-fields",
            "req-crm-lead-history",
          ],
        ),
        capability(
          "capability-crm-qualification",
          "Qualification decision control",
          "Require a deliberate qualification outcome and preserve the reason behind it.",
          "Managers can review the funnel without guessing why leads moved or stalled.",
          "high",
          ["persona-crm-sdr", "persona-crm-revops"],
          [
            "req-crm-qualification-state",
            "req-crm-disqualification-reason",
            "req-crm-manager-filters",
          ],
        ),
      ],
      highLevelUseCases: [
        useCase(
          "usecase-crm-create-lead",
          "Create and assign inbound lead",
          "Sales Development Representative",
          "Enter a new lead and immediately assign it for work",
          ["Lead source is known", "Rep has create permission"],
          [
            "Rep opens the lead form",
            "Rep enters company, contact, source, and owner",
            "System validates required fields and creates the lead",
          ],
          "Lead appears in the owned queue with activity history started.",
          ["capability-crm-intake"],
          ["req-crm-source-owner", "req-crm-required-fields"],
        ),
        useCase(
          "usecase-crm-qualify-lead",
          "Qualify or disqualify a worked lead",
          "Sales Development Representative",
          "Record a clear qualification decision after outreach",
          ["Lead already exists", "Rep is owner or manager"],
          [
            "Rep opens the lead record",
            "Rep updates status to qualified or disqualified",
            "Rep logs reason and next action when required",
          ],
          "Lead outcome is preserved for later funnel review.",
          ["capability-crm-qualification"],
          [
            "req-crm-qualification-state",
            "req-crm-disqualification-reason",
            "req-crm-manager-filters",
          ],
        ),
      ],
      requirementModel: {
        businessRequirements: [
          "req-crm-disqualification-reason",
          "req-crm-manager-filters",
        ],
        userRequirements: ["req-crm-lead-history"],
        functionalRequirements: [
          "req-crm-source-owner",
          "req-crm-required-fields",
          "req-crm-qualification-state",
        ],
        nonFunctionalRequirements: [],
        domainRequirements: [],
        dataRequirements: [],
        permissionRequirements: [],
        integrationRequirements: [],
        reportingRequirements: [],
        operationalRequirements: [],
        complianceRequirements: [],
        notes: "Grouped manually for the seed. Admins can regenerate after edits.",
        generatedAt: "2026-07-01T12:00:00.000Z",
      },
      requirementItems: [
        requirement(
          "req-crm-source-owner",
          "functional",
          "Lead must store source and owner",
          "Every lead record must be created with source, owner, and created timestamp.",
          "Without source and owner, queue accountability and reporting break immediately.",
          "high",
          "Sales operations policy",
          ["capability-crm-intake"],
          ["usecase-crm-create-lead"],
          "Lead creation should fail if source or owner is missing.",
        ),
        requirement(
          "req-crm-required-fields",
          "functional",
          "Lead creation requires minimum contact context",
          "Lead creation must require company or person name, primary contact channel, source, and owner.",
          "Sellers cannot act on incomplete records.",
          "high",
          "Lead intake workshop",
          ["capability-crm-intake"],
          ["usecase-crm-create-lead"],
          "Form validation should block empty required fields.",
        ),
        requirement(
          "req-crm-qualification-state",
          "functional",
          "Qualification outcome must be explicit",
          "A worked lead must end in qualified or disqualified state; passive abandonment is not acceptable.",
          "Managers need an explicit funnel outcome.",
          "high",
          "Sales management review",
          ["capability-crm-qualification"],
          ["usecase-crm-qualify-lead"],
          "Outcome selection should be required before a lead can leave working state.",
        ),
        requirement(
          "req-crm-disqualification-reason",
          "business",
          "Disqualified leads require a reason",
          "When a lead is disqualified, the rep must choose or enter a reason.",
          "Disqualification patterns feed funnel quality analysis and routing improvements.",
          "medium",
          "Revenue operations reporting need",
          ["capability-crm-qualification"],
          ["usecase-crm-qualify-lead"],
          "Disqualified leads should show a visible reason in list and detail view.",
        ),
        requirement(
          "req-crm-lead-history",
          "user",
          "Lead history must show key actions",
          "The record should display owner changes, status changes, and notes in chronological order.",
          "Reps and managers need rapid context restoration.",
          "medium",
          "Seller workflow interview",
          ["capability-crm-intake", "capability-crm-qualification"],
          ["usecase-crm-create-lead", "usecase-crm-qualify-lead"],
          "History should render newest-first with actor and timestamp.",
        ),
        requirement(
          "req-crm-manager-filters",
          "business",
          "Managers need queue filters by outcome and owner",
          "Lead list views must support filters for owner, source, stale age, and qualification outcome.",
          "Funnel review becomes impractical without controlled filtering.",
          "medium",
          "Pipeline review format",
          ["capability-crm-qualification"],
          ["usecase-crm-qualify-lead"],
          "Managers should be able to isolate stale or disqualified leads quickly.",
        ),
      ],
      domainRules: [
        rule(
          "rule-crm-owner-single",
          "Single active owner",
          "A lead can have only one active owner at a time.",
          "Queue accountability depends on one clear working owner.",
          "high",
          ["req-crm-source-owner"],
        ),
        rule(
          "rule-crm-outcome-terminal",
          "Qualification outcome is terminal until reopened",
          "Qualified and disqualified states are terminal unless a manager or owner deliberately reopens the lead.",
          "Prevents accidental rework and distorted funnel metrics.",
          "medium",
          ["req-crm-qualification-state", "req-crm-disqualification-reason"],
        ),
      ],
      dataContext: {
        coreEntities: [
          entity(
            "entity-crm-lead",
            "Lead",
            "Early-stage demand record before opportunity creation.",
            ["leadId", "source", "ownerId", "status", "createdAt"],
            ["May convert into Account/Opportunity", "Has many Activity entries"],
          ),
          entity(
            "entity-crm-activity",
            "Lead Activity",
            "Timestamped history line for notes, owner changes, and outcome changes.",
            ["activityId", "leadId", "type", "actorId", "timestamp"],
            ["Belongs to Lead"],
          ),
        ],
        dataOwnership: "Revenue operations owns workflow policy. Sales owns execution data quality.",
        dataRetentionNotes:
          "Lead history should remain queryable for at least 24 months for funnel analysis.",
        auditNeeds:
          "Owner changes, qualification state changes, and disqualification reasons must be auditable.",
      },
      uxPrinciples: [
        "Show queue-critical context in list view before opening detail",
        "Keep qualification actions visible without hiding them in deep menus",
        "Make reasons and next steps readable at a glance",
      ],
      constraints: [
        constraint(
          "constraint-crm-no-email-sync",
          "technical",
          "Do not depend on email sync for MVP context capture.",
          "The system must still be usable if external mailbox integration is absent.",
          "high",
        ),
        constraint(
          "constraint-crm-fast-queue",
          "operational",
          "Queue list must remain fast for daily SDR use.",
          "Heavy interaction latency will block adoption.",
          "medium",
        ),
      ],
      dependencies: [
        dependency(
          "dependency-crm-auth-members",
          "Workspace members and permissions",
          "internal",
          "Lead ownership and manager review depend on stable member identity and role access.",
          "Platform Core",
          "Ownership and approval rules cannot be enforced cleanly.",
        ),
        dependency(
          "dependency-crm-form-engine",
          "Configurable form components",
          "internal",
          "Lead creation relies on reusable form validation and field rendering.",
          "Frontend Platform",
          "Lead intake UI becomes custom-coded and slower to evolve.",
        ),
      ],
      risks: [
        risk(
          "risk-crm-overcapture",
          "Lead form becomes too heavy",
          "Adding too many required fields could slow reps and reduce adoption.",
          "high",
          "medium",
          "Limit MVP required fields to the minimum action-enabling set and revisit after usage review.",
          "CRM Product Manager",
        ),
        risk(
          "risk-crm-bad-funnel-data",
          "Qualification reasons become inconsistent",
          "If reps use free text inconsistently, reporting loses comparability.",
          "medium",
          "high",
          "Seed a controlled reason list with optional notes instead of fully freeform input.",
          "Revenue Operations Manager",
        ),
      ],
      releaseExpectation: {
        mvp: "Manual lead intake, owner assignment, qualification outcome, and activity history.",
        alpha:
          "Filtered lead queue with manager visibility and reporting-ready outcome fields.",
        beta: "Stronger audit views, reason taxonomy tuning, and controlled reopen flow.",
        future: "Routing rules, enrichment, and scoring.",
        releaseNotes:
          "This PRD should unlock the first reliable CRM operational dataset for BOS commercial workflows.",
      },
      openQuestions: [
        question(
          "question-crm-reopen-policy",
          "Who is allowed to reopen a disqualified lead?",
          "This affects funnel hygiene, manager workflow, and user permissions.",
          "CRM Product Manager",
          "open",
          "Before beta scope lock",
        ),
      ],
      approval: {
        productOwner: approvalRole("Chief Product Officer", "approved", "Approved for review track.", "2026-07-01T11:30:00.000Z"),
        domainOwner: approvalRole("VP Sales", "approved", "Commercial flow is aligned.", "2026-07-01T11:45:00.000Z"),
        engineeringLead: approvalRole("Platform Engineering Lead", "pending", "", ""),
        designLead: approvalRole("Design Lead", "pending", "", ""),
        qaLead: approvalRole("QA Lead", "pending", "", ""),
      },
      changeLog: [
        {
          version: "v0.6",
          date: "2026-07-01",
          author: "CRM Product Manager",
          change: "Tightened qualification outcome rules and added explicit manager filtering requirement.",
        },
        {
          version: "v0.5",
          date: "2026-06-30",
          author: "Sales Systems Analyst",
          change: "Converted discovery notes into structured personas, capabilities, and use cases.",
        },
      ],
    }),
    prd({
      id: "prd-hrm-onboarding-and-probation-control",
      title: "HRM Onboarding and Probation Control",
      status: "draft",
      version: "v0.3",
      productId,
      module: "HRM",
      owner: "HR Product Manager",
      authors: ["HR Product Manager", "People Operations Analyst"],
      reviewers: ["Engineering Lead", "People Operations Lead"],
      stakeholders: ["Department Managers", "IT Operations", "Finance Operations"],
      createdAt: "2026-07-01T09:30:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
      targetRelease: "2026-Q4 MVP",
      summary: {
        oneLiner:
          "Create one controlled workflow for onboarding employees and managing the first probation checkpoint.",
        description:
          "The PRD defines the HRM flow that starts at offer acceptance, coordinates onboarding tasks, and concludes with a structured probation review checkpoint.",
        whyNow:
          "The business is onboarding through shared documents and ad hoc checklists, which creates inconsistent employee setup quality.",
        expectedOutcome:
          "HR, managers, and IT can see who owns each onboarding step and whether the employee is ready to clear probation.",
      },
      problem: {
        statement:
          "Onboarding is distributed across messages, spreadsheets, and memory, which creates setup delays and weak probation readiness signals.",
        currentPain:
          "Managers do not know whether equipment, access, policy acknowledgment, and training milestones are complete.",
        businessImpact:
          "Time-to-productivity increases, compliance steps are missed, and probation decisions happen without evidence.",
        userImpact:
          "New employees receive uneven onboarding quality and experience uncertainty about expectations.",
        currentWorkarounds:
          "People ops keeps a manual tracker, while managers chase individual owners through chat.",
        opportunity:
          "A single onboarding record can later connect HR, IT, asset, learning, and manager review workflows.",
      },
      vision: {
        statement:
          "Every new employee should move through a visible onboarding plan with explicit readiness signals for probation review.",
        futureState:
          "People operations, hiring managers, and support teams collaborate around one employee setup record and one shared definition of readiness.",
        principles: [
          "Separate ownership from visibility",
          "Track evidence, not just status labels",
          "Keep manager review grounded in completed milestones",
        ],
      },
      goals: [
        goal(
          "goal-hrm-orchestrated-onboarding",
          "Orchestrate onboarding work in one place",
          "Create one onboarding record that shows owner, due state, and completion evidence for major setup steps.",
          "operational",
          "high",
        ),
        goal(
          "goal-hrm-probation-signal",
          "Create a probation readiness signal",
          "Managers should not enter probation review without visible completion of mandatory steps.",
          "business",
          "high",
        ),
      ],
      successMetrics: [
        metric(
          "metric-hrm-day-one-readiness",
          "Employees fully set up by day one",
          "90%+",
          "Onboarding record completion audit",
          "high",
        ),
        metric(
          "metric-hrm-probation-evidence",
          "Probation reviews backed by onboarding evidence",
          "100%",
          "Manager review checklist audit",
          "medium",
        ),
      ],
      targetUsers: [
        persona(
          "persona-hrm-peopleops",
          "People Operations Coordinator",
          "Owns onboarding setup and tracks completion across teams.",
          ["Start onboarding quickly", "See blockers before start date"],
          ["Chasing multiple teams", "Incomplete evidence"],
          ["Create onboarding plan", "Review readiness", "Escalate blockers"],
          ["Create records", "View all tasks", "Mark HR milestones complete"],
        ),
        persona(
          "persona-hrm-manager",
          "Hiring Manager",
          "Reviews whether the employee is ready to clear probation and become fully productive.",
          ["See real readiness", "Avoid manual follow-up"],
          ["No shared view of onboarding", "Subjective probation reviews"],
          ["Review onboarding status", "Approve probation outcome"],
          ["View assigned employee records", "Comment on review checkpoints"],
        ),
      ],
      scope: {
        inScope: [
          "Onboarding record",
          "Cross-functional onboarding checklist visibility",
          "Mandatory evidence tracking",
          "Probation checkpoint summary",
        ],
        outOfScope: ["Payroll processing", "Leave management", "Performance cycles"],
        mvpScope: [
          "Employee onboarding record",
          "Mandatory step visibility",
          "Probation checkpoint readiness summary",
        ],
        futureScope: ["Automated reminders", "Learning module integration", "Manager scorecards"],
      },
      capabilities: [
        capability(
          "capability-hrm-onboarding-record",
          "Onboarding control record",
          "One record that consolidates setup steps, owners, statuses, and evidence.",
          "People ops can inspect onboarding without stitching external trackers.",
          "high",
          ["persona-hrm-peopleops", "persona-hrm-manager"],
          ["req-hrm-record-exists", "req-hrm-evidence-required"],
        ),
        capability(
          "capability-hrm-probation-checkpoint",
          "Probation readiness checkpoint",
          "Present mandatory completion status before a probation review is logged.",
          "Managers can evaluate readiness from evidence instead of memory.",
          "high",
          ["persona-hrm-manager"],
          ["req-hrm-review-gating", "req-hrm-manager-summary"],
        ),
      ],
      highLevelUseCases: [
        useCase(
          "usecase-hrm-start-onboarding",
          "Start onboarding after offer acceptance",
          "People Operations Coordinator",
          "Initialize employee setup work from one record",
          ["Offer is accepted", "Employee start date is known"],
          [
            "People ops creates the onboarding record",
            "System creates the required milestone groups",
            "Owners can view their steps by employee and start date",
          ],
          "Employee onboarding is visible before day one.",
          ["capability-hrm-onboarding-record"],
          ["req-hrm-record-exists", "req-hrm-evidence-required"],
        ),
        useCase(
          "usecase-hrm-run-probation-review",
          "Run probation readiness review",
          "Hiring Manager",
          "See whether mandatory setup and early milestones were completed",
          ["Probation review date is due", "Employee onboarding record exists"],
          [
            "Manager opens the employee record",
            "System shows mandatory milestone completion and missing evidence",
            "Manager records probation decision or requests follow-up",
          ],
          "Probation review uses a visible evidence-backed summary.",
          ["capability-hrm-probation-checkpoint"],
          ["req-hrm-review-gating", "req-hrm-manager-summary"],
        ),
      ],
      requirementModel: {
        businessRequirements: ["req-hrm-review-gating"],
        userRequirements: ["req-hrm-manager-summary"],
        functionalRequirements: ["req-hrm-record-exists", "req-hrm-evidence-required"],
        nonFunctionalRequirements: [],
        domainRequirements: [],
        dataRequirements: [],
        permissionRequirements: [],
        integrationRequirements: [],
        reportingRequirements: [],
        operationalRequirements: [],
        complianceRequirements: [],
        notes: "Seed grouping prepared for first review.",
        generatedAt: "2026-07-01T12:00:00.000Z",
      },
      requirementItems: [
        requirement(
          "req-hrm-record-exists",
          "functional",
          "Employee onboarding record is mandatory",
          "The workflow must create one onboarding record per new employee before start date work begins.",
          "Without a canonical record, work remains scattered.",
          "high",
          "People operations workshop",
          ["capability-hrm-onboarding-record"],
          ["usecase-hrm-start-onboarding"],
          "System should create required onboarding sections automatically.",
        ),
        requirement(
          "req-hrm-evidence-required",
          "functional",
          "Mandatory steps require evidence",
          "Critical onboarding items must capture evidence or explicit completion notes before they are marked complete.",
          "Status-only onboarding hides whether real work happened.",
          "high",
          "Audit concern from people operations",
          ["capability-hrm-onboarding-record"],
          ["usecase-hrm-start-onboarding"],
          "Completion should not pass without evidence on mandatory steps.",
        ),
        requirement(
          "req-hrm-review-gating",
          "business",
          "Probation review cannot ignore missing mandatory work",
          "The manager review view must show incomplete mandatory steps and missing evidence before a probation decision is finalized.",
          "The company should not clear probation blindly.",
          "high",
          "Manager review policy",
          ["capability-hrm-probation-checkpoint"],
          ["usecase-hrm-run-probation-review"],
          "Manager decision flow should surface blocking gaps clearly.",
        ),
        requirement(
          "req-hrm-manager-summary",
          "user",
          "Managers need concise onboarding summary",
          "Manager-facing review should summarize completed steps, blockers, and pending owner actions without forcing deep navigation.",
          "Managers are not daily operators in onboarding detail views.",
          "medium",
          "Manager interview notes",
          ["capability-hrm-probation-checkpoint"],
          ["usecase-hrm-run-probation-review"],
          "Review page should surface summary first and drill-down second.",
        ),
      ],
      domainRules: [
        rule(
          "rule-hrm-mandatory-before-day-one",
          "Mandatory day-one steps",
          "Access, policy acknowledgment, and manager intro steps are mandatory before an onboarding record can be marked day-one ready.",
          "These items create minimum working readiness.",
          "high",
          ["req-hrm-evidence-required"],
        ),
      ],
      dataContext: {
        coreEntities: [
          entity(
            "entity-hrm-onboarding-record",
            "Employee Onboarding Record",
            "Primary record that tracks setup milestones and readiness state.",
            ["employeeId", "startDate", "owner", "readinessState"],
            ["Has many onboarding steps", "Feeds probation review summary"],
          ),
          entity(
            "entity-hrm-onboarding-step",
            "Onboarding Step",
            "One owned milestone inside an onboarding record.",
            ["stepId", "recordId", "owner", "status", "evidence"],
            ["Belongs to Employee Onboarding Record"],
          ),
        ],
        dataOwnership: "People operations owns workflow policy. Step owners own evidence quality.",
        dataRetentionNotes:
          "Onboarding evidence should stay available through probation and basic audit review windows.",
        auditNeeds: "Mandatory step completion and probation decisions must remain reviewable.",
      },
      uxPrinciples: [
        "Show readiness as evidence-backed, not color-only",
        "Keep manager summary concise and action-oriented",
      ],
      constraints: [
        constraint(
          "constraint-hrm-shared-owner",
          "operational",
          "Multiple teams contribute to onboarding, so visibility must span HR, IT, and managers.",
          "Narrow ownership views would recreate shadow trackers.",
          "high",
        ),
      ],
      dependencies: [
        dependency(
          "dependency-hrm-membership",
          "Workspace member identity",
          "internal",
          "Owner assignment depends on stable member records.",
          "Platform Core",
          "Cross-team onboarding ownership becomes ambiguous.",
        ),
      ],
      risks: [
        risk(
          "risk-hrm-fake-completion",
          "Teams mark steps complete without evidence",
          "If evidence is optional in practice, the manager summary becomes untrustworthy.",
          "high",
          "medium",
          "Make evidence required for critical milestones and expose gaps in review UI.",
          "HR Product Manager",
        ),
      ],
      releaseExpectation: {
        mvp: "Onboarding record, mandatory steps, evidence, and manager review summary.",
        alpha: "Role-based views and blocker reporting.",
        beta: "Automation reminders and deeper milestone templates.",
        future: "Learning, asset, and equipment workflow integration.",
        releaseNotes:
          "This PRD creates the first HRM execution record that can later branch into richer lifecycle flows.",
      },
      openQuestions: [
        question(
          "question-hrm-probation-template",
          "Should probation summary be standardized across all roles or configurable by department?",
          "Configurable reviews add flexibility but increase model complexity early.",
          "HR Product Manager",
          "open",
          "Before solution design freeze",
        ),
      ],
      approval: {
        productOwner: approvalRole("Chief Product Officer", "pending", "", ""),
        domainOwner: approvalRole("People Operations Lead", "pending", "", ""),
        engineeringLead: approvalRole("Platform Engineering Lead", "pending", "", ""),
        designLead: approvalRole("Design Lead", "pending", "", ""),
        qaLead: approvalRole("QA Lead", "pending", "", ""),
      },
      changeLog: [
        {
          version: "v0.3",
          date: "2026-07-01",
          author: "HR Product Manager",
          change: "Converted onboarding discovery into structured PRD sections and added probation gating.",
        },
      ],
    }),
    prd({
      id: "prd-erp-inventory-cycle-count-control",
      title: "ERP Inventory Cycle Count Control",
      status: "draft",
      version: "v0.2",
      productId,
      module: "ERP / Inventory",
      owner: "Inventory Product Manager",
      authors: ["Inventory Product Manager", "Operations Analyst"],
      reviewers: ["Warehouse Lead", "Engineering Lead"],
      stakeholders: ["Finance Controller", "Inventory Control Lead", "Warehouse Supervisors"],
      createdAt: "2026-07-01T10:00:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
      targetRelease: "2026-Q4 MVP",
      summary: {
        oneLiner:
          "Define the inventory cycle count flow that identifies stock variances and controls how adjustments are approved.",
        description:
          "This PRD covers scheduled cycle counts, variance review, and approval-gated stock adjustments so inventory accuracy work becomes auditable.",
        whyNow:
          "Inventory accuracy is still managed manually, and correction decisions do not have a reliable system trail.",
        expectedOutcome:
          "Warehouse and finance teams can trust that count variances are visible, reviewed, and approved before stock changes post.",
      },
      problem: {
        statement:
          "Count variance handling is not consistently controlled, which weakens confidence in stock accuracy and auditability.",
        currentPain:
          "Supervisors record counts in sheets, adjustments happen later, and finance cannot always trace who approved the correction.",
        businessImpact:
          "Stock discrepancies distort replenishment, fulfillment confidence, and audit posture.",
        userImpact:
          "Inventory control teams spend time explaining corrections instead of preventing them.",
        currentWorkarounds:
          "Teams export stock data, count offline, and request approvals through chat or email.",
        opportunity:
          "A structured count and adjustment flow becomes a reusable control layer for broader inventory operations.",
      },
      vision: {
        statement:
          "Inventory counts should move through one visible control path from schedule to reviewed correction.",
        futureState:
          "Warehouse teams can execute counts quickly, while finance and inventory control can trust the audit trail behind every variance resolution.",
        principles: [
          "Keep physical count work fast",
          "Do not hide variance review behind spreadsheets",
          "Require explicit approval for material corrections",
        ],
      },
      goals: [
        goal(
          "goal-inventory-count-structure",
          "Structure cycle count execution",
          "Move count entry and variance visibility into the product.",
          "operational",
          "high",
        ),
        goal(
          "goal-inventory-adjustment-control",
          "Control inventory adjustments",
          "Require reason and approval before material stock corrections are posted.",
          "business",
          "high",
        ),
      ],
      successMetrics: [
        metric(
          "metric-inventory-variance-review",
          "Variances reviewed before adjustment posting",
          "100%",
          "Count-to-adjustment audit trail",
          "high",
        ),
        metric(
          "metric-inventory-traceability",
          "Adjustment records with complete audit fields",
          "100%",
          "Monthly finance spot check",
          "high",
        ),
      ],
      targetUsers: [
        persona(
          "persona-inventory-controller",
          "Inventory Control Supervisor",
          "Coordinates count schedules, reviews variances, and submits correction requests.",
          ["Run counts consistently", "Resolve variances with evidence"],
          ["Offline count tracking", "Weak correction traceability"],
          ["Create count batch", "Review variances", "Submit adjustments"],
          ["Manage counts", "View all variances", "Submit adjustments"],
        ),
        persona(
          "persona-inventory-finance",
          "Finance Controller",
          "Reviews adjustment significance and expects reliable approval evidence.",
          ["Trust the audit trail", "Review only material corrections"],
          ["Corrections appear without context", "Hard to trace approval path"],
          ["Approve adjustments", "Audit posted corrections"],
          ["View approvals", "Approve or reject material adjustments"],
        ),
      ],
      scope: {
        inScope: [
          "Cycle count batch creation",
          "Count entry against expected stock",
          "Variance review state",
          "Adjustment request and approval",
        ],
        outOfScope: ["Inventory valuation redesign", "Advanced warehouse optimization"],
        mvpScope: [
          "Count batch",
          "Variance review",
          "Approval-gated adjustment posting",
        ],
        futureScope: ["RF device workflow", "Automated recount routing"],
      },
      capabilities: [
        capability(
          "capability-inventory-count-batch",
          "Count batch execution",
          "Run a controlled count batch and expose variance lines immediately.",
          "Count work stays operational while variance review becomes visible.",
          "high",
          ["persona-inventory-controller"],
          ["req-inventory-count-batch", "req-inventory-variance-visible"],
        ),
        capability(
          "capability-inventory-adjustment-approval",
          "Adjustment approval control",
          "Require approval and reason tracking before material corrections post to stock.",
          "Posted adjustments carry clear business evidence.",
          "high",
          ["persona-inventory-controller", "persona-inventory-finance"],
          ["req-inventory-adjustment-reason", "req-inventory-approval-gating"],
        ),
      ],
      highLevelUseCases: [
        useCase(
          "usecase-inventory-run-count",
          "Run cycle count and identify variances",
          "Inventory Control Supervisor",
          "Create a count batch and capture differences from expected stock",
          ["Items and locations already exist in inventory"],
          [
            "Supervisor creates a count batch",
            "Counters enter counted values for each line",
            "System highlights lines where counted and expected values differ",
          ],
          "Variance lines are available for review before any correction occurs.",
          ["capability-inventory-count-batch"],
          ["req-inventory-count-batch", "req-inventory-variance-visible"],
        ),
        useCase(
          "usecase-inventory-approve-adjustment",
          "Approve material adjustment",
          "Finance Controller",
          "Review a requested correction before it changes stock",
          ["Variance already exists", "Adjustment request has been submitted"],
          [
            "Finance opens the adjustment request",
            "Finance reviews reason, counted value, and proposed correction",
            "Finance approves or rejects the adjustment",
          ],
          "Only approved material corrections post to inventory.",
          ["capability-inventory-adjustment-approval"],
          ["req-inventory-adjustment-reason", "req-inventory-approval-gating"],
        ),
      ],
      requirementModel: {
        businessRequirements: ["req-inventory-approval-gating"],
        userRequirements: [],
        functionalRequirements: [
          "req-inventory-count-batch",
          "req-inventory-variance-visible",
          "req-inventory-adjustment-reason",
        ],
        nonFunctionalRequirements: ["req-inventory-audit-fields"],
        domainRequirements: [],
        dataRequirements: [],
        permissionRequirements: [],
        integrationRequirements: [],
        reportingRequirements: [],
        operationalRequirements: [],
        complianceRequirements: [],
        notes: "Seed grouping for cycle count control.",
        generatedAt: "2026-07-01T12:00:00.000Z",
      },
      requirementItems: [
        requirement(
          "req-inventory-count-batch",
          "functional",
          "Cycle counts run in structured batches",
          "Users must create a count batch that groups the lines to be counted together.",
          "Count work needs an execution container and review boundary.",
          "high",
          "Inventory control workshop",
          ["capability-inventory-count-batch"],
          ["usecase-inventory-run-count"],
          "Count batch must remain visible until every line is resolved.",
        ),
        requirement(
          "req-inventory-variance-visible",
          "functional",
          "Variances stay visible before correction",
          "Any mismatch between expected and counted stock must remain visible until reviewed.",
          "Hidden variances create weak controls and rushed adjustments.",
          "high",
          "Operations audit issue",
          ["capability-inventory-count-batch"],
          ["usecase-inventory-run-count"],
          "Variance lines should display expected, counted, and difference values.",
        ),
        requirement(
          "req-inventory-adjustment-reason",
          "functional",
          "Adjustment requests require reason",
          "A correction request must capture the variance reason before it can be submitted.",
          "Reasonless adjustments are not auditable.",
          "high",
          "Finance control requirement",
          ["capability-inventory-adjustment-approval"],
          ["usecase-inventory-approve-adjustment"],
          "Submission should fail when no reason is provided.",
        ),
        requirement(
          "req-inventory-approval-gating",
          "business",
          "Material corrections require approval",
          "Corrections above the configured threshold must not post until approved.",
          "Material stock changes should not bypass review.",
          "high",
          "Finance policy",
          ["capability-inventory-adjustment-approval"],
          ["usecase-inventory-approve-adjustment"],
          "Approval state should block posting until complete.",
        ),
        requirement(
          "req-inventory-audit-fields",
          "non_functional",
          "Posted adjustments preserve audit metadata",
          "Posted corrections must preserve approver, timestamp, originating count line, and reason.",
          "Audit and reconciliation require a durable trace.",
          "high",
          "Controller audit need",
          ["capability-inventory-adjustment-approval"],
          ["usecase-inventory-approve-adjustment"],
          "Audit metadata must be queryable after posting.",
        ),
      ],
      domainRules: [
        rule(
          "rule-inventory-no-direct-post",
          "No direct material posting",
          "A material variance cannot post directly from count entry without review.",
          "Separates physical counting from financial impact decisions.",
          "high",
          ["req-inventory-approval-gating"],
        ),
      ],
      dataContext: {
        coreEntities: [
          entity(
            "entity-inventory-count-batch",
            "Cycle Count Batch",
            "Execution container for one scheduled count event.",
            ["batchId", "locationId", "status", "createdBy"],
            ["Has many count lines", "Can produce adjustment requests"],
          ),
          entity(
            "entity-inventory-adjustment-request",
            "Adjustment Request",
            "Proposed stock correction created from a variance line.",
            ["requestId", "varianceLineId", "reason", "approvalState"],
            ["Belongs to count line", "Can post stock adjustment"],
          ),
        ],
        dataOwnership: "Inventory control owns count execution. Finance owns approval thresholds.",
        dataRetentionNotes:
          "Adjustment evidence and approval metadata should align to stock audit retention policy.",
        auditNeeds:
          "Material correction trail must remain visible from count batch through posted stock update.",
      },
      uxPrinciples: [
        "Keep count entry fast and line-based",
        "Show variance state before any corrective action",
        "Treat approval as a visible state, not hidden metadata",
      ],
      constraints: [
        constraint(
          "constraint-inventory-count-speed",
          "operational",
          "Count entry must remain practical on the warehouse floor.",
          "Slow or complex flows will push teams back to offline counting.",
          "high",
        ),
      ],
      dependencies: [
        dependency(
          "dependency-inventory-stock-ledger",
          "Stock ledger integrity",
          "internal",
          "Count expectations and posted corrections rely on a trustworthy ledger.",
          "Inventory Platform",
          "Count variance results become unreliable.",
        ),
      ],
      risks: [
        risk(
          "risk-inventory-thresholds",
          "Approval thresholds are defined too loosely",
          "If materiality rules are weak, significant corrections could still move too quickly.",
          "high",
          "medium",
          "Agree threshold policy with finance before beta.",
          "Inventory Product Manager",
        ),
      ],
      releaseExpectation: {
        mvp: "Cycle count batches, variance review, and approval-gated correction posting.",
        alpha: "Supervisor dashboards and variance aging views.",
        beta: "Role tuning and higher-volume warehouse validation.",
        future: "RF-assisted count execution and automated recount suggestions.",
        releaseNotes:
          "This PRD creates the first meaningful inventory control workflow for ERP inside BOS.",
      },
      openQuestions: [
        question(
          "question-inventory-materiality",
          "Should materiality thresholds vary by item class or only by absolute value?",
          "Threshold logic affects approval behavior and reporting complexity.",
          "Finance Controller",
          "open",
          "Before finance sign-off",
        ),
      ],
      approval: {
        productOwner: approvalRole("Chief Product Officer", "pending", "", ""),
        domainOwner: approvalRole("Inventory Control Lead", "pending", "", ""),
        engineeringLead: approvalRole("Platform Engineering Lead", "pending", "", ""),
        designLead: approvalRole("Design Lead", "pending", "", ""),
        qaLead: approvalRole("QA Lead", "pending", "", ""),
      },
      changeLog: [
        {
          version: "v0.2",
          date: "2026-07-01",
          author: "Inventory Product Manager",
          change: "Defined first structured PRD for cycle count and adjustment control.",
        },
      ],
    }),
  ],
};

const outputPath = path.join(__dirname, "..", "data", "bos-project-directory.json");
fs.writeFileSync(outputPath, `${JSON.stringify(product, null, 2)}\n`);
console.log(`Generated ${outputPath}`);
