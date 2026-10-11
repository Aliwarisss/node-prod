/*
 * ACT I — DISCOVER · technical discovery: the artifact templates and knowledge entries the
 * technical units use that artifacts.js and knowledge.js don't already hold.
 * Status: draft (awaiting review). Loaded after the core libraries, before acts/discover-units.js.
 *
 * Same shapes as artifacts.js and knowledge.js. Example values continue the running example
 * from an engineer's seat: Northwind Supplies' clerks re-type emailed PDF orders into the ERP
 * (~14 min an order, ~1,140 orders in two weeks, 3% entry errors). REQ-014 is the brief.
 * The ERP (on-premises, v9) accepts orders only through its REST import API; orders arrive in a
 * Microsoft 365 shared inbox; customer codes live in clerks' spreadsheets; data stays in the EU.
 * Trace IDs created here: Q-## (technical question), SYS-## (system element), DF-## (data flow),
 * INT-## (integration), C-## / A-## (constraint / assumption).
 */
(function () {
  /* ═══════════════ Artifact templates ═══════════════ */
  const doc = (title, meta, sections, extra = {}) => ({ fmt: "doc", title, meta, sections, ...extra });
  const sheet = (file, tab, cols, rows, extra = {}) => ({ fmt: "sheet", file, tab, cols, rows, blank: 3, ...extra });
  const form = (title, fields) => ({ fmt: "form", title, fields });
  const canvas = (board, structure) => ({ fmt: "canvas", board, structure });
  const pack = (title, parts) => ({ fmt: "pack", title, parts });
  const S = { table: (cols, ...rows) => ({ kind: "table", cols, rows }) };
  const META = ["Initiative", "Owner", "Version", "Status: Draft / In review / Approved", "Last updated"];
  const A = (type, format, aliases, what, purpose, owner, users, tpl, good, extra = {}) => ({ type, format, aliases, what, purpose, owner, users, tpl, good, ...extra });

  Object.assign(window.NODE_ARTIFACTS, {
    /* ═══════════ Inputs ═══════════ */
    "client-brief": A("Input", "Doc", ["Client brief", "Project brief"],
      "The brief the client handed over: what they want, the problem as they see it, the numbers and the limits they know about.", "The starting point every technical question traces back to.", "Client", ["Engineer", "Tech lead"],
      doc("Client brief", ["Client", "Date received", "Contact"], [
        ["What they asked for", "In the client's words.", "“We keep re-typing orders from email into the ERP — can you automate it before peak season?”"],
        ["What happens today", "The current way of working.", "PDF orders land in a shared inbox; four clerks re-type each line into the ERP and email a confirmation."],
        ["Numbers they gave", "Volumes, times, error rates.", "~14 minutes an order · ~6 hours a day of re-typing · 3% of orders have entry errors."],
        ["Limits they mentioned", "What can't change.", "ERP can't be replaced this year · customer data stays in-country · no new headcount."],
      ]),
      ["Received in writing", "Client contact named"], { external: true }),
    "system-access": A("Input", "Form", ["Repository & environment access", "System access"],
      "The access an engineer needs to look at the real system: repositories, a test environment, documentation and logs.", "You can't audit what you can't open — access comes before any claim about the system.", "Tech lead", ["Engineer"],
      form("Access request", [["Repositories", "long", "Which repos, read access"], ["Environment", "text", "Test / staging URL and credentials route"], ["Documentation", "long", "Wiki, API docs, runbooks"], ["Logs & monitoring", "text", "Read-only access"], ["Requested by", "person", ""], ["Approved by", "person", ""], ["Date granted", "date", ""]]),
      ["Read-only by default", "Granted through the client's own process"], { external: true }),

    /* ═══════════ 1.1 Understand the Brief & the System ═══════════ */
    "technical-brief": A("Summary", "Doc", ["Technical brief summary", "Technical brief"],
      "The client brief restated by an engineer: what the system must do, what goes in and comes out, for whom, at what volume, and where the edges are.", "Turns a business request into something you can reason about technically, without designing the solution yet.", "Engineer", ["Tech lead", "Architect"],
      doc("Technical brief — REQ-014 Order intake", META, [
        ["The ask in one line", "What must the system do, in a sentence a developer would write. No technology yet.", "Turn emailed PDF orders into ERP sales orders without a clerk re-typing them."],
        ["What it must do", "Capabilities as verbs, numbered.", "1 Receive orders from the shared inbox · 2 Read customer, lines, quantities and dates from the PDF · 3 Match the customer code · 4 Create the order in the ERP · 5 Flag anything it isn't sure of for a clerk."],
        ["Inputs and outputs", "Every input and output, with its format.", "In: email + PDF attachment (scanned or generated). Out: ERP sales order (import API, JSON), confirmation email, exception item for a clerk."],
        ["Users and volumes", "Who touches it and how much traffic it sees — with sources.", "4 clerks; ~1,140 orders in two weeks (inbox sample), doubling at peak; 1–40 lines an order."],
        ["In scope / out of scope", "Draw the edge explicitly.", "In: email PDF orders, EU sites. Out: EDI customers, phone orders, ERP changes."],
        ["What “working” means technically", "Measurable signs, not features.", "Order created correctly without re-typing; clerk time per order falls; no order lost or duplicated."],
        ["Open questions", "Anything you can't answer from the brief → the question log.", "See Q-01 … Q-07."],
      ]),
      ["Says what, not how — no solution chosen", "Every input and output has a format", "Volumes cite a source or are marked assumed", "Scope edge stated both ways"]),
    "technical-question-log": A("Log", "Sheet", ["Technical question log", "Question log"],
      "Every technical question the brief leaves open, with why it matters, who can answer it and the answer once you have it.", "Makes unknowns visible and owned, so they're answered on purpose instead of discovered in BUILD.", "Engineer", ["Tech lead", "Architect"],
      sheet("Technical questions — REQ-014.xlsx", "Questions", [["Q ID", "id"], ["Question", "long"], ["Area", "select:Data/Integration/Performance/Security/Infrastructure/Code/AI-ML"], ["Why it matters", "text"], ["Who can answer", "person"], ["Status", "select:Open/Answered/Needs a spike"], ["Answer & evidence", "long"]],
        [["Q-01", "How does the ERP accept orders — API, file drop or database?", "Integration", "Decides the whole integration approach", "ERP admin", "Answered", "REST import API only (ERP admin guide §7)"], ["Q-02", "What share of PDFs are scans vs generated?", "Data", "Scans need OCR — accuracy risk", "Inbox sample", "Needs a spike", ""], ["Q-03", "Where do customer codes live?", "Data", "Matching needs a trusted source", "Order-clerk lead", "Open", ""]]),
      ["Every question has an area and an owner", "Why it matters is stated", "Answers cite evidence", "Questions a spike must answer are marked"]),
    "system-audit": A("Assessment", "Doc", ["System audit", "System & codebase audit"],
      "What the current system really is, found by running and reading it: components, stack, how it's built and deployed, code health and the debt that will bite.", "Grounds every later design decision in the system as built, not as documented or remembered.", "Engineer", ["Tech lead", "Architect"],
      doc("System audit — order handling", META, [
        ["Access and how to run it", "What you got access to and the steps to run it locally or in test. If you couldn't run it, say so.", "Read access to erp-extensions repo; ERP test tenant; no access to production logs yet (requested)."],
        ["Components and stack", "Each part, its language/runtime and version, where it runs.", "SYS-01 ERP v9 (vendor, on-prem, Windows Server) · SYS-02 Microsoft 365 shared inbox · SYS-03 erp-extensions (C#/.NET 6, 14k LOC) · SYS-04 clerks' customer-code spreadsheets."],
        ["How it's built and deployed", "Build, tests, pipeline, environments.", "Manual build on a developer laptop; no CI; deploys copied to the ERP server by IT."],
        ["Code health", "Tests, coverage, dependencies, docs — with numbers.", "9 unit tests, no coverage report; 3 dependencies two major versions behind; README out of date (2022)."],
        ["Debt and hotspots", "What will slow or break new work, and why.", "Order import code duplicated in two places; hard-coded ERP credentials in config (flag to security)."],
        ["Operations", "Hosting, logging, monitoring, backups, who's on call.", "ERP logs to local files; no alerting; nightly backup by IT."],
        ["Verdict", "Can new work safely build on this? What must be true first?", "Yes, beside it — a separate service calling the import API; don't extend erp-extensions until it has CI and tests."],
      ]),
      ["Based on running and reading the system, not only docs", "Versions and numbers, not adjectives", "Every component has an ID (SYS-##)", "Risks found are flagged to an owner"]),
    "system-context-diagram": A("Diagram", "Canvas", ["System context diagram", "Context diagram (C4 level 1)"],
      "The system at C4 level 1: the people and systems around it, and how each one talks to it.", "One picture everyone can point at — the scope boundary and every connection that could fail.", "Engineer", ["Tech lead", "Architect", "Security"],
      canvas("System context — Order intake (C4 level 1)", S.table(["Element", "Type", "Talks to", "How (protocol / format)"],
        ["Customer", "Person (external)", "Shared inbox", "Email + PDF attachment"],
        ["Order clerk", "Person", "ERP, exception queue", "ERP client; web UI (new)"],
        ["Order-intake service (new)", "Software system — in scope", "Inbox, ERP, clerk", "Graph API (read mail) · ERP import API (REST/JSON)"],
        ["Microsoft 365 shared inbox", "External system", "Order-intake service", "Microsoft Graph, OAuth 2.0"],
        ["ERP v9", "External system (vendor)", "Order-intake service", "REST import API, API key, EU data centre"])),
      ["The system in scope is drawn as one box", "Every arrow names protocol and format", "People and external systems are separate from the system in scope", "No internal detail yet — that's DESIGN"]),
    "data-flow-map": A("Map", "Sheet", ["Data flow map"],
      "Every place data moves in the current flow: from where, to where, what, in which format, how often and how sensitive it is.", "Shows where data is created, copied, re-typed and lost — the technical heart of most problems.", "Engineer", ["Architect", "Data analyst", "Privacy officer"],
      sheet("Data flows — order handling.xlsx", "Flows", [["DF ID", "id"], ["From", "text"], ["To", "text"], ["Data", "text"], ["Format", "text"], ["Trigger / frequency", "text"], ["Volume", "text"], ["Sensitivity", "select:Public/Internal/Personal/Confidential"], ["Manual step?", "select:Yes/No"]],
        [["DF-01", "Customer", "Shared inbox", "Order (customer, lines, dates)", "PDF attachment", "Per order", "~80 a day", "Personal", "No"], ["DF-02", "Clerk (reads PDF)", "ERP", "Sales order", "Re-typed in ERP client", "Per order", "~80 a day", "Personal", "Yes"], ["DF-03", "Clerk spreadsheet", "Clerk", "Customer code", "XLSX lookup", "Per order", "~80 a day", "Internal", "Yes"]]),
      ["Every flow has format, frequency and volume", "Manual steps are marked", "Personal data is flagged", "Flows trace to SYS-## components"]),
    "integration-inventory": A("Inventory", "Sheet", ["Integration inventory", "Integration & dependency inventory"],
      "Every system, API and service the solution will depend on: how you connect, how you authenticate, the limits, the contract and who owns it.", "Integration is where technical projects fail; this makes every dependency and its limits known before anyone designs around a guess.", "Engineer", ["Architect", "Security", "Vendor manager"],
      sheet("Integrations — REQ-014.xlsx", "Integrations", [["INT ID", "id"], ["System / service", "text"], ["Direction", "select:In/Out/Both"], ["Interface", "select:REST API/SOAP/File/Database/Email/Queue/Manual"], ["Auth", "text"], ["Limits (rate, size, hours)", "text"], ["Contract / docs", "link"], ["Owner", "person"], ["Risk", "select:High/Medium/Low"]],
        [["INT-01", "ERP v9 import API", "Out", "REST API", "API key per tenant", "Unknown rate limit; 500 lines per request", "ERP admin guide §7", "ERP admin", "High"], ["INT-02", "Microsoft 365 shared inbox", "In", "REST API", "OAuth 2.0 app registration", "Graph throttling 10k requests / 10 min", "Microsoft Graph docs", "IT", "Low"], ["INT-03", "PDF parsing / OCR (to choose)", "Both", "REST API", "—", "Accuracy on poor scans unknown", "—", "Tech lead", "High"]]),
      ["Every dependency has an interface, auth and owner", "Limits are numbers or marked unknown", "Docs or contract linked", "High-risk dependencies become questions or spikes"]),
    "technical-constraint-log": A("Log", "Sheet", ["Technical constraint log", "Technical constraints & assumptions log"],
      "The technical constraints (facts you must design within) and assumptions (beliefs you haven't proved), each with its source, confidence and how you'd test it.", "Stops a guess from being designed around as if it were a fact.", "Engineer", ["Tech lead", "Architect"],
      sheet("Technical constraints & assumptions — REQ-014.xlsx", "Log", [["ID", "id"], ["Statement", "long"], ["Kind", "select:Constraint/Assumption"], ["Area", "select:Integration/Data/Security/Infrastructure/Performance/Code"], ["Hard / soft", "select:Hard/Soft"], ["Source", "text"], ["Confidence", "select:High/Medium/Low"], ["How we'd test it", "text"], ["Owner", "person"]],
        [["C-01", "Orders enter the ERP only through its REST import API", "Constraint", "Integration", "Hard", "ERP admin guide §7; ERP admin", "High", "—", "ERP admin"], ["C-02", "Customer data stays in the EU", "Constraint", "Security", "Hard", "Client brief; data-protection policy", "High", "—", "Privacy officer"], ["A-01", "80% of order PDFs are machine-generated, not scans", "Assumption", "Data", "Soft", "Order-clerk lead, verbally", "Low", "Classify a 2-week inbox sample", "Engineer"]]),
      ["Constraints and assumptions kept apart", "Every entry has a source", "Every assumption has a test", "Hard constraints confirmed by their owner"]),
    "system-context-pack": A("Pack", "Pack", ["System context pack"],
      "Day 1's technical picture in one place: the brief as an engineer reads it, the system as built, its data and integrations, and the limits on any solution.", "Gives the tech lead one thing to review and the next step one thing to start from.", "Engineer", ["Tech lead", "Architect"],
      pack("System context pack — REQ-014", [["technical-brief", "What must be built, in an engineer's words"], ["system-audit", "What exists today, from running and reading it"], ["system-context-diagram", "The boundary and every connection"], ["data-flow-map", "Where data moves and gets re-typed"], ["integration-inventory", "Every dependency and its limits"], ["technical-constraint-log", "Facts to design within, guesses to test"], ["technical-question-log", "What's still open, and who answers it"]]),
      ["Every part present or marked not applicable", "Open questions carried, not hidden", "Accepted by the tech lead"]),

    /* ═══════════ 1.2 Frame the Technical Problem ═══════════ */
    "technical-problem-split": A("Analysis", "Doc", ["Technical problem / solution split", "Problem / solution split (technical)"],
      "The solution someone proposed, recorded exactly, and the technical failure it is meant to fix, stated without naming any technology.", "Keeps the first idea as one option instead of letting it become the design by default.", "Engineer", ["Tech lead", "Architect"],
      doc("Problem / solution split — REQ-014", META, [
        ["The proposed solution, as asked", "Verbatim, with who proposed it.", "“Use an AI tool to read the PDFs and push them into the ERP” — operations lead."],
        ["Why-chain", "From the solution down to the failure, one 'why' per line.", "Why AI? → to read PDFs · Why read them? → clerks re-type every line · Why re-type? → the ERP only takes structured orders via its API · Why a problem? → 14 min an order, 3% errors."],
        ["The problem, without solution words", "What fails, where, in system terms. Cite SYS / DF IDs.", "Order data arrives unstructured (DF-01) and reaches the ERP only by manual re-keying (DF-02), so throughput is capped by clerk time and errors enter at DF-02."],
        ["What would prove we fixed it", "Observable signs, not features.", "Orders reach the ERP import API without re-keying; clerk minutes and entry errors per order fall."],
        ["The proposal, kept as an option", "Where it goes next.", "AI/OCR parsing → listed as OPT candidate for 1.4."],
      ]),
      ["Proposal kept verbatim", "No technology named in the problem", "Problem cites SYS / DF evidence"]),
    "technical-hypotheses": A("List", "Sheet", ["Technical hypothesis list", "Unknowns & hypotheses"],
      "Every technical unknown written as a hypothesis that could be proved wrong, rated by impact and uncertainty and ranked.", "Points discovery at the questions that could sink the build, not the easy ones.", "Engineer", ["Tech lead", "Architect"],
      sheet("Technical hypotheses — REQ-014.xlsx", "Hypotheses", [["H ID", "id"], ["We believe…", "long"], ["We're wrong if…", "long"], ["From (Q / A)", "text"], ["Impact", "select:High/Medium/Low"], ["Uncertainty", "select:High/Medium/Low"], ["Rank", "num"], ["Test", "select:Spike/Measure/Ask/Docs"]],
        [["H-01", "Off-the-shelf OCR reads ≥95% of order lines correctly on our PDFs", "Line accuracy < 95% on a 200-PDF sample", "A-01, Q-02", "High", "High", "1", "Spike"], ["H-02", "The ERP import API sustains peak volume (≈160 orders/h)", "Sustained throughput < 160/h in test", "Q-01", "High", "Medium", "2", "Spike"], ["H-03", "Customer codes can be matched from the e-mail sender", "Match rate < 90% on the inbox sample", "Q-03", "Medium", "High", "3", "Measure"]]),
      ["Each hypothesis falsifiable", "Impact and uncertainty rated", "Ranked, top three marked"]),
    "quality-attribute-priorities": A("Priorities", "Sheet", ["Quality attribute priorities"],
      "The ISO/IEC 25010 quality attributes that matter for this problem, ranked, each written as a measurable scenario.", "Defines 'good' before options are compared, so the choice is judged on agreed terms.", "Engineer", ["Tech lead", "Architect", "VERIFY"],
      sheet("Quality attributes — REQ-014.xlsx", "Attributes", [["QA ID", "id"], ["Attribute (ISO/IEC 25010)", "select:Functional correctness/Performance efficiency/Reliability/Security/Maintainability/Usability/Compatibility/Portability"], ["Rank", "num"], ["Scenario: when… the system… measured as…", "long"], ["Why it matters here", "text"]],
        [["QA-1", "Functional correctness", "1", "When a generated or scanned PDF order arrives, the system creates the ERP order with ≥ 98% of lines correct; anything below confidence goes to a clerk.", "Errors cost credit notes"], ["QA-2", "Reliability", "2", "When the ERP API is down, no order is lost; all are retried within 15 min of recovery.", "Lost orders are worse than slow ones"], ["QA-3", "Performance efficiency", "3", "At peak (≈160 orders/h) median e-mail-to-ERP time stays under 5 min.", "Peak season"]]),
      ["Ranked — at most three at the top", "Every scenario has a number", "Attributes from ISO/IEC 25010"]),
    "technical-success-metrics": A("Metrics", "Sheet", ["Technical success metrics"],
      "The measures that will show the solution worked, each with a target and exactly how it will be measured.", "Turns 'better' into numbers the baseline and later VERIFY can check.", "Engineer", ["Tech lead", "VERIFY", "EVOLVE"],
      sheet("Success metrics — REQ-014.xlsx", "Metrics", [["M ID", "id"], ["Metric", "text"], ["Baseline (from 1.3.2)", "text"], ["Target", "text"], ["How measured", "text"], ["Linked QA", "text"]],
        [["M-1", "Clerk minutes per e-mail order", "~14 min (to confirm)", "≤ 5 min", "ERP timestamps vs inbox received", "QA-3"], ["M-2", "Order lines entered wrongly", "3% (to confirm)", "≤ 1%", "Credit notes with 'wrong line' reason", "QA-1"], ["M-3", "Orders lost or duplicated", "unknown", "0", "Inbox IDs reconciled with ERP orders daily", "QA-2"]]),
      ["Target and method for every metric", "Baselines confirmed in 1.3.2", "Each metric links to a quality attribute"]),
    "spike-plan": A("Plan", "Sheet", ["Spike plan"],
      "The small, time-boxed experiments that will test the riskiest hypotheses, each with its success signal set in advance.", "Spends discovery time where it buys the most certainty, and stops spikes from running forever.", "Engineer", ["Tech lead"],
      sheet("Spike plan — REQ-014.xlsx", "Spikes", [["SPK ID", "id"], ["Hypothesis", "text"], ["Smallest test", "long"], ["Timebox", "text"], ["Success signal (set now)", "text"], ["Data / environment", "text"], ["Owner", "person"]],
        [["SPK-1", "H-01 OCR accuracy", "Run 2 OCR services over 200 masked inbox PDFs; compare to clerk-entered orders", "1 day", "≥ 95% of lines exact on generated, ≥ 85% on scans", "Masked sample, vendor trials", "Engineer"], ["SPK-2", "H-02 ERP throughput", "Script 1,000 synthetic orders into the ERP test tenant", "½ day", "≥ 160 orders/h sustained, no errors", "ERP test tenant", "Engineer"]]),
      ["One hypothesis per spike", "Timebox and signal set before running", "No production systems"]),
    "technical-framing-pack": A("Pack", "Pack", ["Technical framing pack"],
      "Day 2's framing in one place: the problem without solution words, the ranked unknowns, the quality targets and the spike plan.", "Gives investigation one agreed frame to work inside.", "Engineer", ["Tech lead"],
      pack("Technical framing pack — REQ-014", [["technical-problem-split", "The problem, without the proposed solution"], ["technical-hypotheses", "What could sink it, ranked"], ["quality-attribute-priorities", "What 'good' means"], ["technical-success-metrics", "How success is measured"], ["spike-plan", "How the riskiest unknowns get tested"]]),
      ["Every part present", "Accepted by the tech lead"]),

    /* ═══════════ 1.3 Investigate the Real Problem ═══════════ */
    "flow-trace": A("Trace", "Sheet", ["Current flow trace"],
      "Today's flow reproduced and traced step by step: which system, how long, what data, and where a person does it by hand.", "Shows exactly where the problem happens, so nobody fixes a story about it.", "Engineer", ["Tech lead", "Architect"],
      sheet("Flow trace — order handling.xlsx", "Trace", [["Step", "num"], ["What happens", "text"], ["System (SYS)", "text"], ["Data in → out", "text"], ["Manual?", "select:Yes/No"], ["Time (median)", "text"], ["Goes wrong here?", "text"]],
        [["1", "Order e-mail lands in shared inbox", "SYS-02", "E-mail + PDF", "No", "—", ""], ["2", "Clerk opens PDF, finds customer code in spreadsheet", "SYS-04", "PDF → customer code", "Yes", "2.5 min", "Wrong code picked (1 in 60)"], ["3", "Clerk re-types lines into ERP client", "SYS-01", "PDF lines → order lines", "Yes", "9 min", "Typos in qty / item (most errors)"], ["4", "Clerk e-mails confirmation", "SYS-02", "Order no. → e-mail", "Yes", "1.5 min", ""]]),
      ["Reproduced on real, masked samples", "System, data and time per step", "Manual steps and failure points marked"]),
    "baseline-measurements": A("Evidence", "Sheet", ["Baseline measurements"],
      "Today's measured numbers for every success metric, with the method, sample and period so they can be re-run later.", "Replaces anecdotes with numbers every option — and later VERIFY — is judged against.", "Engineer", ["Tech lead", "VERIFY", "EVOLVE"],
      sheet("Baseline — REQ-014.xlsx", "Baseline", [["Metric (M ID)", "text"], ["Method / query", "long"], ["Period", "text"], ["Sample", "num"], ["Median", "text"], ["P95", "text"], ["Confidence", "select:High/Medium/Low"]],
        [["M-1 Clerk minutes per order", "Inbox received → ERP order.created, e-mail channel", "2 weeks, normal season", "1,140", "13 min", "24 min", "High"], ["M-2 Wrong lines", "Credit notes with reason 'wrong line/qty' ÷ e-mail orders", "Q1", "29,400", "3.1%", "—", "High"], ["M-3 Lost / duplicate orders", "Inbox message IDs vs ERP order refs", "2 weeks", "1,140", "0.4% missing", "—", "Medium"]]),
      ["Method, period and sample per number", "Median and p95, not averages alone", "Re-runnable by someone else"]),
    "technical-root-causes": A("Analysis", "Doc", ["Technical root-cause analysis"],
      "The symptoms traced down why-chains to their technical causes, sorted by category and backed by evidence.", "Makes sure the solution targets causes, not symptoms.", "Engineer", ["Tech lead", "Architect"],
      doc("Root causes — REQ-014", META, [
        ["Symptoms", "From the trace and baseline, with numbers.", "13 min median per order; 3.1% wrong lines; 0.4% orders missing."],
        ["Why-chains", "One chain per symptom.", "Wrong lines → typed by hand → no structured input → orders arrive as PDF and the ERP only accepts API input."],
        ["Causes by category", "Data · Integration · Code · Infrastructure · Manual step.", "RC-1 Data: orders unstructured (PDF). RC-2 Integration: no path from inbox to ERP API. RC-3 Data: customer codes only in personal spreadsheets."],
        ["Evidence per cause", "Trace step, baseline or log.", "RC-1: trace steps 2–3; RC-2: integration inventory INT-01/02; RC-3: trace step 2, 1 in 60 wrong codes."],
        ["Ranked by contribution", "Which causes explain most of the baseline.", "RC-1 + RC-2 explain ~85% of time and ~80% of errors."],
      ]),
      ["Every cause cites evidence", "Causes are system conditions, not people", "Ranked by contribution"]),
    "technical-problem-statement": A("Statement", "Doc", ["Technical problem statement"],
      "One statement of the problem in the system: what fails, where, how much, why, within which limits, and what a solution must achieve.", "The yardstick every option in 1.4 and 1.5 is judged against.", "Engineer", ["Tech lead", "Architect", "PLAN"],
      doc("Technical problem statement — TPS-01", META, [
        ["What fails, where", "In system terms, citing trace steps.", "Order data from e-mailed PDFs reaches the ERP only by manual re-keying (trace steps 2–3)."],
        ["How much", "From the baseline.", "Median 13 min per order (p95 24), 3.1% wrong lines, 0.4% orders missing — at ~80 orders a day, doubling at peak."],
        ["Why", "Root causes.", "RC-1 orders are unstructured; RC-2 no path from inbox to the ERP import API; RC-3 customer codes not in any system."],
        ["Within which limits", "Hard constraints.", "C-01 import API only; C-02 data stays in the EU."],
        ["A solution must", "Targets from the success metrics — no technology.", "Get ≥ 98% of lines into the ERP correctly without re-keying, lose no orders, keep median time under 5 min at peak."],
      ]),
      ["Every clause links to evidence", "No solution named", "Targets included"]),

    /* ═══════════ 1.4 Research Solution Options ═══════════ */
    "technology-scan": A("Scan", "Sheet", ["Technology scan"],
      "Every existing way to solve the problem — products, open-source libraries, platform features, improve-what's-there and do nothing — checked for fit, maturity, licence and cost.", "Stops the team building what it could adopt, and adopting what doesn't fit.", "Engineer", ["Tech lead", "Architect", "Procurement"],
      sheet("Technology scan — TPS-01.xlsx", "Options", [["OPT ID", "id"], ["Option", "text"], ["Route", "select:Buy/Open source/Platform feature/Build/Improve existing/Do nothing"], ["What it does for TPS-01", "text"], ["Fits hard constraints?", "select:Yes/No/Unknown"], ["Maturity", "select:Mature/Growing/Early"], ["Licence", "text"], ["Cost band", "select:Free/€/€€/€€€"], ["Shortlist?", "check"]],
        [["OPT-1", "Cloud document-AI service (EU region)", "Buy", "Extracts order fields from PDFs", "Yes", "Mature", "Commercial, per page", "€€", "☑"], ["OPT-2", "Open-source OCR + rules", "Open source", "OCR text, rules map to fields", "Yes", "Mature", "Apache-2.0", "Free", "☑"], ["OPT-3", "Vendor X ERP connector", "Buy", "E-mail-to-ERP add-on", "Unknown", "Growing", "Commercial", "€€€", "☐"], ["OPT-0", "Do nothing", "Do nothing", "Clerks keep re-typing", "Yes", "—", "—", "Clerk time", "☑"]]),
      ["Buy, open-source and build routes all considered", "'Do nothing' included", "Licence checked for every candidate"]),
    "option-evaluation": A("Matrix", "Sheet", ["Option evaluation matrix"],
      "The shortlisted options scored against weighted criteria taken from the quality attributes, with the evidence for each score.", "Makes the comparison fair and the choice defensible.", "Engineer", ["Tech lead", "Architect"],
      sheet("Option evaluation — TPS-01.xlsx", "Scores", [["Criterion (from QA)", "text"], ["Weight", "pct"], ["OPT-1 score (1–5)", "num"], ["OPT-1 evidence", "text"], ["OPT-2 score (1–5)", "num"], ["OPT-2 evidence", "text"]],
        [["Line accuracy (QA-1)", "40%", "4", "Trial on 50 PDFs: 96% generated, 88% scans", "3", "Trial: 93% generated, 71% scans"], ["No lost orders (QA-2)", "25%", "4", "Async API with retries", "4", "Runs in our queue"], ["Peak latency (QA-3)", "15%", "4", "~6 s a page (docs + trial)", "5", "~2 s a page locally"], ["EU data (C-02)", "20%", "5", "EU region, DPA available", "5", "Self-hosted"]]),
      ["Weights set before scoring", "Every score cites evidence", "Remaining unknowns listed per option"]),
    "architecture-options": A("Design", "Doc", ["Architecture options"],
      "Two or three ways to build the solution, each sketched at C4 container level with how it meets the quality targets, its risks and an effort band.", "Puts the real choices side by side before one is recommended.", "Engineer", ["Tech lead", "Architect", "Security"],
      doc("Architecture options — TPS-01", META, [
        ["Option A — managed document AI", "Containers and flow.", "Inbox watcher (Graph API) → queue → extraction (cloud doc-AI, EU) → validation & customer match → ERP import API; low-confidence → clerk review UI."],
        ["Option B — self-hosted OCR + rules", "Containers and flow.", "Inbox watcher → queue → OCR service (container) → rules engine → validation → ERP import API; review UI as in A."],
        ["How each meets the targets", "Per QA scenario.", "QA-1: A 96% / B 93% on generated PDFs; QA-2: both queue + retry; QA-3: both well under 5 min."],
        ["Risks", "Top three per option.", "A: per-page cost at peak, vendor dependency. B: scan accuracy (71%), rules upkeep."],
        ["Effort band", "Rough, to be estimated in 1.5.2.", "A: M · B: L"],
      ]),
      ["Each option at C4 container level", "Each traced to the quality targets", "Risks named for each"]),

    /* ═══════════ 1.5 Feasibility & the Technical Decision ═══════════ */
    "effort-estimate": A("Estimate", "Sheet", ["Effort estimate"],
      "Each option broken into work items and estimated as low / likely / high, with its basis, plus run cost and support.", "Shows how big each option is without pretending to precision.", "Engineer", ["Tech lead", "PLAN"],
      sheet("Effort estimate — TPS-01.xlsx", "Estimate", [["Option", "text"], ["Work item", "text"], ["Low (days)", "num"], ["Likely (days)", "num"], ["High (days)", "num"], ["Basis", "text"], ["Confidence", "select:High/Medium/Low"]],
        [["A", "Inbox watcher + queue", "3", "5", "8", "Similar Graph integration last year", "High"], ["A", "Extraction + validation + customer match", "8", "12", "20", "Spike SPK-1 code as reference", "Medium"], ["A", "Clerk review UI", "5", "8", "12", "Reference stories", "Medium"], ["A", "Run cost (per month)", "€300", "€550", "€900", "Vendor pricing × peak volume", "Medium"]]),
      ["Three-point ranges with a basis", "Run cost included", "Confidence stated"]),
    "option-comparison": A("Comparison", "Doc", ["Option comparison & recommendation"],
      "The options side by side on the same evidence — targets, feasibility, effort, run cost, risk — with the trade-offs named and one option recommended.", "One clear, defensible recommendation the tech lead can accept or challenge.", "Engineer", ["Tech lead", "Architect", "PLAN"],
      doc("Option comparison — TPS-01", META, [
        ["Side by side", "Same rows for every option: targets, feasibility, effort, run cost, top risk.", "A: meets QA-1–3, feasibility High, 16–40 days, ~€550/month, vendor cost at peak. B: misses QA-1 on scans, Medium, 25–55 days, ~€150/month, scan accuracy."],
        ["Trade-offs", "What each choice gives up.", "A trades run cost and some vendor dependency for accuracy and speed to build."],
        ["Recommendation", "One option, and why.", "Option A — the only option meeting QA-1 on scanned PDFs."],
        ["Reversibility", "How hard it is to change later.", "Extraction behind an adapter, so B can replace A later if costs rise."],
        ["Conditions", "What must stay true.", "Vendor confirms EU processing and a DPA."],
      ]),
      ["Every option on the same rows", "Trade-offs stated", "Reversibility addressed"]),
    "discovery-adr": A("Decision", "Doc", ["Technical decision record (ADR)", "Discovery ADR"],
      "The technical decision recorded the ADR way: context, decision, options considered, consequences and conditions, with the evidence linked.", "Makes the decision explicit and traceable, so nobody has to rediscover it.", "Engineer", ["Tech lead", "PLAN", "DESIGN", "EVOLVE"],
      doc("ADR-001 — Extract orders with a managed document-AI service", ["ADR ID", "Date", "Decided by", "Status: Proposed / Accepted / Superseded"], [
        ["Context", "The problem statement and the forces.", "TPS-01: orders re-keyed by hand, 13 min and 3.1% wrong lines; C-01 import API only; C-02 EU data."],
        ["Decision", "What we will do, in one or two sentences.", "Build an order-intake service that extracts PDF orders with a managed document-AI service (EU region) behind an adapter, and creates orders through the ERP import API; low-confidence orders go to a clerk review screen."],
        ["Options considered", "Each with why it lost.", "B self-hosted OCR — failed QA-1 on scans (71%). Vendor X connector — no confirmed support for ERP v9. Do nothing — 13 min an order at double peak volume."],
        ["Consequences", "Good and bad.", "+ meets QA-1–3, ~16–40 days. − ~€550/month run cost; vendor dependency (mitigated by the adapter)."],
        ["Conditions & evidence", "Dated conditions; links to spikes, estimates and risks.", "DPA signed by 30 May · SPK-1, SPK-2, EST-A, RSK-01–04."],
      ], { signoff: ["Tech lead"] }),
      ["Context, decision, options and consequences all present", "Evidence linked", "Conditions dated"]),
    "technical-handoff": A("Pack", "Pack", ["Technical discovery handoff pack"],
      "Everything PLAN needs from technical discovery in one pack: the decision, the problem, the options, the estimates, the risks and the system context.", "PLAN starts from evidence instead of re-asking the same questions.", "Engineer", ["PLAN team", "Tech lead"],
      pack("Technical discovery handoff — REQ-014", [["discovery-adr", "What we decided and why"], ["technical-problem-statement", "The problem, measured"], ["architecture-options", "The options considered"], ["effort-estimate", "How big"], ["risk-register", "What could go wrong"], ["system-context-pack", "The system as it is today"], ["technical-success-metrics", "How success is measured"]]),
      ["Every part present", "Received by PLAN"]),
  });

  /* evidence names the technical units use, on artifacts that already exist */
  const addAliases = (id, names) => { const a = window.NODE_ARTIFACTS[id]; if (a) a.aliases.push(...names.filter((n) => !a.aliases.includes(n))); };
  addAliases("review-record", ["Tech lead review notes", "Constraint owner confirmations"]);
  addAliases("spike-results", ["Test call results"]);

  /* ═══════════════ Knowledge ═══════════════ */
  const steps = (...items) => ({ kind: "steps", items });
  const fields = (...items) => ({ kind: "fields", items });
  const table = (cols, ...rows) => ({ kind: "table", cols, rows });
  const dodont = (dos, donts) => ({ kind: "dodont", dos, donts });
  const K = (type, what, how, structure, extra = {}) => ({ type, what, how, structure, ...extra });

  Object.assign(window.NODE_KNOWLEDGE, {
    "Reproduce before you fix": K("Principle",
      "Make the problem happen on demand, in a safe environment, before you explain it or change anything.",
      ["Pick real (masked) samples or a recorded case", "Reproduce in a test environment", "Write the steps so someone else can repeat them", "Only then trace causes or try fixes"],
      dodont(["“Reproduced on 20 masked inbox PDFs in the ERP test tenant — steps in the trace”"], ["“Users say it's slow, so we'll add caching”"]),
      { use: "The first step of any technical investigation." }),
    "Baseline measurement": K("Technique",
      "Measuring today's numbers for each success metric from logs, data or timed samples, with a method another engineer can re-run.",
      ["Pick the metric and its definition", "Choose the source — logs, database, timed sample", "Pull a representative period (normal and peak)", "Compute median and p95, and error rates", "Write down the query or method, period and sample size"],
      table(["Metric", "Method", "Period", "Sample", "Median", "P95"], ["Clerk minutes per order", "Inbox received → ERP created", "2 weeks", "1,140", "13 min", "24 min"]),
      { use: "Before comparing options, and again in VERIFY and EVOLVE with the same method.", pitfalls: ["Averages hiding a slow tail", "A quiet week used as the baseline"] }),
    "Three-point estimation": K("Technique",
      "Estimating each work item as low, likely and high, with the basis for each, so uncertainty is visible instead of hidden in one number.",
      ["Break the work into items you can picture", "For each, write low / likely / high", "Note the basis — reference work, spike, guess", "Sum as a range; flag items with the widest spread", "Narrow wide items with a spike, not optimism"],
      table(["Item", "Low", "Likely", "High", "Basis"], ["Inbox watcher", "3 d", "5 d", "8 d", "Similar integration last year"]),
      { use: "Estimating options in discovery and backlog items in PLAN.", pitfalls: ["Padding the likely value instead of widening the range", "Presenting the likely value as a promise"] }),
    "Brief decomposition": K("Technique",
      "Breaking a client brief into the things an engineer can reason about: capabilities, inputs and outputs, users and volumes, the scope edge and the open questions.",
      ["Rewrite the ask as one sentence with a verb and no technology", "List the capabilities it implies, as verbs", "List every input and output with its format", "Note users and volumes, each with a source", "Draw the scope edge both ways", "Turn everything you can't answer into a question with an owner"],
      fields(["The ask", "Turn … into … without …"], ["Capabilities", "Receive · read · match · create · flag"], ["Inputs / outputs", "Thing — format — source"], ["Volumes", "Number — source — or 'assumed'"], ["In / out of scope", "In: … Out: …"], ["Questions", "Q-## — who can answer"]),
      { use: "The first hour with any brief, before opening the code.", pitfalls: ["Choosing the technology in the first sentence", "Copying the brief's numbers without their source", "Leaving the out-of-scope list empty"] }),
    "Codebase walkthrough": K("Technique",
      "A structured first read of an unfamiliar system: get it running, follow one real request end to end, then measure what you see.",
      ["Get read access and run it locally or in a test environment", "Read the README, build files and dependency manifest", "Follow one real transaction from entry point to database and back", "Sketch the components you passed through", "Measure: tests, coverage, dependency age, build steps, open issues", "Write down what surprised you — that's where the risk is"],
      steps("Run it", "Read the build", "Trace one request", "Sketch the parts", "Measure health", "Note surprises"),
      { use: "Auditing an existing system before proposing changes to it.", pitfalls: ["Reading files alphabetically instead of following a request", "Judging code health by feel instead of numbers", "Trusting the documentation over the running system"] }),
    "API contract review": K("Technique",
      "Checking an interface you'll depend on before you design around it: what it accepts, how you authenticate, its limits and what happens when it fails.",
      ["Find the real contract — OpenAPI spec, vendor guide or the code", "Note auth, versioning and environments", "Record limits: rate, payload size, timeouts, opening hours", "Note error responses and whether calls are idempotent", "Make one real call in a test environment", "Log every gap as a question or a spike"],
      table(["Check", "What to write down"], ["Contract", "Spec or doc link and version"], ["Auth", "Method, who issues credentials"], ["Limits", "Rate, size, timeout — numbers or 'unknown'"], ["Errors", "Codes, retries, idempotency"], ["Proof", "One real call made, with the response"]),
      { use: "Every external system on the integration inventory.", pitfalls: ["Assuming limits from another vendor's API", "Never making a real call before the design review"] }),
    "Facts are sourced, guesses are labelled": K("Principle",
      "Every statement about the system is either a fact with a source you could show someone, or an assumption labelled as one, with a confidence and a way to test it.",
      ["Write the source next to every fact", "Tag anything without a source as an assumption", "Give each assumption a confidence and a test", "Promote an assumption to a fact only with evidence"],
      dodont(["“The import API takes 500 lines a request (ERP guide §7.3)”", "“A-01, low confidence: most PDFs are generated — test on the inbox sample”"], ["“The API is fast enough”", "“Most orders are PDFs” with no source"]),
      { use: "All of technical discovery, and every review of it." }),
  });
})();
