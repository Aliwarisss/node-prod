/*
 * NODE OFFER — what the program promises, in one place, for the program page and the overview.
 * One price for everything: PKR 5,000, one-time, for the full 30-day program — keep in step with
 * the landing page's pricing (lib/node-landing-data.ts). Draft.
 */
window.NODE_OFFER = {
  /* The fee: one price, everything included */
  fee: {
    amount: "PKR 5,000",
    note: "One-time · the full 30-day program · everything included",
    short: "PKR 5,000 one-time",
    includes: ["All 10 modules and the full book", "Prompts and agent kits for every step", "Project vetting and weekly mentor syncs", "Your Node certificate", "Claude Academy guidance and Claude certification prep", "Hiring-partner access and a capstone showcase", "Community and lifetime access"],
  },
  /* The headline and the one-liners that say what Node is — used at the top of every page */
  headline: {
    title: "Develop apps end to end with agentic AI",
    sub: "From requirements to deployment, in 30 days. No experience needed.",
    lines: [
      ["conversion_path", "Requirements to deployment", "Learn every step of building an app — not just the code."],
      ["content_paste", "Copy, paste, go", "Use the ready agent workflows as they are, or configure them to your way of working."],
      ["groups", "Agents become your team", "No team needed: your agents research, plan, code and test — you decide."],
    ],
  },

  /* Node is a project-based learning roadmap */
  pbl: {
    title: "A project-based learning roadmap",
    short: "A project-based learning roadmap — you take one real project through the whole lifecycle.",
    body: "Node is a project-based learning roadmap. On Day 0 you choose one real project — your own idea, a brief from your work or a client, or one of ours — and you take it through every act. Every prompt, artifact and gate is about your project, so by Day 30 you haven't just studied the lifecycle: you've run it, and you have the evidence to prove it.",
    steps: [
      ["flag", "Pick a real project", "Day 0. Your own idea, a work or client brief, or a Node starter project."],
      ["conversion_path", "Run it through every act", "Days 1–27. Each day you apply one process to your project, with your agent."],
      ["verified", "Pass the gates", "Each act ends with a gate: your project's evidence is checked against clear criteria."],
      ["rocket_launch", "Ship and present it", "Days 28–30. The capstone: your project end to end, presented with its evidence."],
    ],
  },

  /* Unique selling points */
  usps: [
    ["construction", "Project-based, end to end", "You learn by running one real project through all eight acts — not by watching lessons."],
    ["conversion_path", "The whole lifecycle", "Product, design, architecture, code, testing, release and operations — one connected map, not one slice."],
    ["smart_toy", "Agent-native", "Prompts at every level and a complete agent kit, built for people who direct agents and check their work."],
    ["engineering", "Engineering, not just coding", "Decisions, trade-offs, evidence and gates — the judgement that separates engineers from code writers."],
    ["view_stream", "How real teams deliver", "Dual-track agile, three backlog levels, Definition of Ready and Done — the way modern teams actually work."],
    ["straighten", "Any scale", "The same lifecycle for a solo builder, a product team, an enterprise or a platform team."],
    ["inventory_2", "A toolkit you keep", "Templates, rubrics and agent-kit files you reuse on every project after the program."],
    ["fact_check", "Evidence over opinion", "Every claim traced to evidence, every decision recorded — work you can defend in any review."],
  ],

  /* How it works, start to finish */
  howItWorks: [
    ["how_to_reg", "Enroll — PKR 5,000", "Before Day 0", "One price, one-time, for the full 30-day program — everything included. Then pick your scale: solo, team, enterprise or platform."],
    ["flag", "Kick-off: set up and pick your project", "Day 0", "Get access to a flagship model (like Claude), learn how people work with agents, set up your agent kit, start your first Claude Academy course, and choose the real project you'll build."],
    ["conversion_path", "Work the acts on your project", "Days 1–27", "One process a day. Use the prompts and kit with your agent, produce the artifacts for your project, and log progress."],
    ["all_inclusive", "Keep discovering while you build", "Every week", "Feature mode runs alongside delivery: a weekly loop of customer conversations and assumption tests."],
    ["verified", "Pass each gate", "End of every act", "Score your work against the rubrics, then get it reviewed through project vetting and weekly mentor syncs."],
    ["rocket_launch", "Capstone: ship and present", "Days 28–30", "Take your project end to end and present the decision, the evidence and what you learned."],
    ["workspace_premium", "Certify and showcase", "After Day 30", "Earn your verified Node certificate, collect your Claude Academy certificates, plan your Claude certification exam, publish your portfolio, and get hiring-partner access."],
  ],

  /* What you get out of it */
  get: [
    ["workspace_premium", "Verified certificate", "Earned by passing every gate and the capstone — shows you can run a project end to end with agents.", "Included"],
    ["military_tech", "Claude certifications", "Earn Anthropic's free, official Claude Academy certificates along the way, and get prepared for the Claude Certification Program exams (Associate, Developer, Architect).", "Academy: included · Exams: via the Claude Partner Network"],
    ["bolt", "Access to the flagship models", "Step-by-step help getting Claude's most capable models — in the Claude apps, Claude Code, the API or your company's cloud — and other agents like Codex.", "Included"],
    ["work", "Real project experience", "One real project taken from idea to production, with the full evidence trail — the experience employers ask for.", "Included"],
    ["folder_special", "A portfolio employers can read", "Opportunity brief, decision record, requirements, architecture decisions, test evidence, release notes, postmortem and outcome report.", "Included"],
    ["inventory_2", "Your own agent kit", "Context file, skills, commands, workflows, subagents, guardrails and rubrics — reusable on any project.", "Included"],
    ["rate_review", "Project vetting and mentor feedback", "Your project's work reviewed at the gates, plus weekly syncs with industry mentors.", "Included"],
    ["handshake", "Opportunities", "Hiring-partner access, a capstone showcase, and a portfolio that opens doors with employers and clients.", "Included"],
    ["groups", "Community", "Learn alongside other builders in the Node community.", "Included"],
    ["all_inclusive", "Lifetime access", "Keep the book, prompts and kits — and every update as new acts are released.", "Included"],
  ],

  /* Why agents, and why now */
  agents: {
    title: "Why agents — and why now",
    body: "AI agents now draft documents, research markets, write code, write tests and review changes. Teams that use them well move much faster. But an agent amplifies whatever judgement it's given: without a clear process, it just produces mistakes faster. The scarce skill is no longer typing code — it's knowing what to build, directing agents through the whole lifecycle, and checking their work. That's exactly what Node trains.",
    points: [
      ["bolt", "Agents are part of everyday work", "Coding agents and assistants are now standard tools across product and engineering."],
      ["warning", "Speed without judgement is risk", "Fast output on the wrong problem, or untested and insecure code, costs more than it saves."],
      ["psychology", "The new core skill: directing and checking", "Briefing agents with the right context, setting guardrails, and verifying the result."],
      ["school", "Node teaches the judgement, not just the tool", "Tools change every few months; the lifecycle, the decisions and the evidence don't."],
    ],
  },

  /* Developer vs engineer */
  devEng: {
    title: "Developer or engineer?",
    intro: "A developer makes the code work. An engineer makes the product work — and keeps it working. As agents make writing code cheaper, the value is moving to engineering. Node is built to move you from one to the other.",
    rows: [
      ["Starts from", "A ticket or a spec", "A problem and the evidence behind it"],
      ["Decides", "How to implement it", "What to build, the trade-offs, the risks, and when to stop"],
      ["Scope", "A feature", "The whole lifecycle — discovery to operations"],
      ["Quality bar", "It runs", "It's tested, secure, observable and maintainable"],
      ["With agents", "Asks an agent for code", "Directs agents across the lifecycle and verifies their work"],
      ["Measured by", "Output — tickets closed", "Outcomes — value delivered and sustained"],
    ],
  },

  /* The course outline: the journey as a story, module by module. Act I's story comes from its
     real walkthrough; the rest continue the same example project. Draft. */
  course: {
    example: "Our example project: an operations team where order clerks re-type emailed PDF orders into the company system by hand. It's slow, error-prone, and peak season is coming.",
    stories: {
      kickoff: "You get access to an AI model, learn how to work with it, and pick the project you'll build this month — your own idea, a brief from work, or a starter project. In our example, it's the order clerks re-typing PDF orders.",
      plan: "The idea got a Go. Now you decide exactly what to build first and why: the requirements, what's in and out, how big it is, the release plan, and the go-ahead to invest. In the example: release one reads clean PDFs automatically; tricky orders come later.",
      design: "Before any code, you shape the solution: how it looks and feels, how it's structured, how data flows, and how it stays secure. In the example: a review screen for clerks, a small parsing service, and orders kept for 90 days.",
      build: "You build it in small slices, sprint by sprint — your agent writes much of the code, you direct and review it — through an automated pipeline. In the example: upload, then read, then review, then send to the company system.",
      verify: "You prove it works and fits: automated tests at every level, plus performance, security and accessibility checks, and real users accepting it. In the example: clerks try it on last month's orders.",
      release: "You ship it safely: a small group first, watch the signals, then everyone — always with a way back. In the example: one team for a week behind a switch, then all teams.",
      operate: "You keep it healthy: dashboards, alerts, calm incident handling, and an eye on cost. In the example: an alert fires when reading accuracy drops below 90%.",
      evolve: "Did it work? You measure against the goal you set in Module 1, learn, and decide what's next. In the example: handling time fell from 14 to 9 minutes; next up, supplier e-invoices.",
      capstone: "Now it's your turn, end to end: you present your own project — the decision, the evidence and what you learned — and earn your certificate.",
    },
    /* Module 1's story in plain words (the book's walkthrough carries the detailed version), keyed by unit */
    discoverStory: {
      "discover": "A brief lands: clerks spend hours re-typing orders that arrive as PDFs by email, and peak season is coming. Before anyone writes code, you find out what the system really is, what the real problem is inside it, and which way of solving it will actually work.",
      "discover.context.brief": "You read the brief like an engineer: what must the system do, what comes in, what goes out, how much of it — and what nobody has told you yet.",
      "discover.context.system": "You get the system running and follow one real order through the code. The ERP is a vendor box; the little custom code there has no tests. You decide to build beside it, not inside it.",
      "discover.context.integrations": "You follow the data: orders arrive by email and get re-typed by hand. The ERP only takes orders through one API, and nobody knows its rate limit yet — so you ask in writing.",
      "discover.context.constraints": "You sort facts from guesses: the API-only rule and EU-only data are confirmed. 'Most PDFs aren't scans' is just a guess — you'll test it.",
      "discover.frame.separate": "Someone asked for 'an AI tool'. You write that down, then keep asking why until you reach the real failure: orders arrive as PDFs and only reach the ERP by re-typing.",
      "discover.frame.unknowns": "You list what you don't know as guesses that could be proved wrong — can a parser read our PDFs? can the ERP keep up at peak? — and rank the scariest first.",
      "discover.frame.quality": "You decide what 'good' means in numbers: almost no wrong lines, no lost orders, under five minutes at peak.",
      "discover.frame.spikes": "You plan tiny, time-boxed experiments for the scariest guesses, and write down what success looks like before you start.",
      "discover.problem.reproduce": "You make the problem happen in a test system with real (masked) orders and time every step. Most of the time goes on re-typing lines.",
      "discover.problem.baseline": "You measure today's numbers from timestamps and credit notes: 13 minutes an order, 3% wrong lines, a few orders lost.",
      "discover.problem.causes": "You dig past the symptoms: the cause isn't the clerks, it's that orders arrive unstructured and there's no path into the ERP's API.",
      "discover.problem.statement": "You write one clear technical problem statement, with every claim linked to what you measured — and no solution in it.",
      "discover.validate.scan": "You look at what already exists — a cloud document-AI service, open-source OCR, a vendor connector — and don't forget 'do nothing'.",
      "discover.validate.evaluate": "You score the options fairly against your targets, with real test calls, setting the weights before you look at the scores.",
      "discover.validate.prototype": "You build a throwaway prototype for the scariest part. On scanned PDFs only one option passes — good to know now, not later.",
      "discover.validate.architecture": "You sketch two real ways to build it, box by box, and show how each meets the targets and what each risks.",
      "discover.decide.feasibility": "You rate which options you can really build and run, and write the conditions — like a signed data agreement.",
      "discover.decide.estimate": "You estimate each option as a range, add the running cost, and list what could go wrong with an owner for each.",
      "discover.decide.compare": "You put the options side by side and recommend one, saying plainly what it trades away.",
      "discover.decide.record": "You write the decision down as an ADR, hand everything to the planning team, and note what you'd do differently next time.",
      "discover.continuous": "With the project approved, you keep talking to clerks every week and testing small ideas while the team builds.",
    },
    glossary: [
      ["Software development", "Everything it takes to go from an idea to software people use — and keep it working. Writing code is one part of it."],
      ["AI agent", "An AI assistant that can do real work for you — research, write, code, test — when you give it clear instructions. You stay in charge."],
      ["Claude", "Anthropic's AI model and assistant. Its flagship models are among the most capable for this kind of work; Node works with Claude and other agents."],
      ["Act", "One big stage of building software — there are eight, from Discover to Evolve. Each act is a module here."],
      ["Lesson (process)", "One part of an act, done in about a day. In the book these are called processes."],
      ["Checkpoint (gate)", "The decision at the end of a module: is the work good enough to move on? You need evidence to pass."],
      ["Artifact", "Something you make — a brief, a plan, a test report — using a ready template."],
      ["Prompt", "Instructions you paste into your AI agent. Node gives you one for every lesson and every step."],
      ["Agent kit", "A ready folder of files that sets your agent up properly: context, skills, commands, checklists."],
      ["Scale", "How big your setting is — solo, product team, enterprise or platform. The course adapts to it."],
      ["Feature mode", "A small weekly loop of talking to users and testing ideas that keeps running while you build."],
    ],
  },

  /* Claude certifications and access to the flagship models.
     Facts checked October 2026 against academy.claude.com, claude.com/blog and claude.com/pricing:
     Claude Academy courses and their certificates of completion are free; the proctored Claude
     Certification Program (Pearson, Credly badges) is open to members of the Claude Partner Network.
     Node prepares learners and points them to both — it does not issue Claude certifications. */
  claude: {
    title: "Claude certifications and the flagship models",
    intro: "Node is built around working with AI agents, so you also get a clear path to official Claude credentials from Anthropic, and step-by-step help getting access to Claude's most capable models.",
    certs: [
      ["school", "Claude Academy certificates", "Anthropic's own free courses — AI fluency, using Claude, Claude Code, the Claude API and MCP — each with an official certificate of completion. Node tells you which course to take at each point in the program.", "Free · during the program", "https://academy.claude.com"],
      ["military_tech", "Claude Certification Program", "Anthropic's proctored, role-based exams: Claude Certified Associate, Developer and Architect. Node's project work prepares you for the Foundations level; the exams are taken through the Claude Partner Network, which Node shows you how to join through your employer or firm.", "Exam prep · after the program", "https://claude.com/blog/four-role-based-claude-certifications"],
    ],
    academyMap: [
      ["Kick-off", "AI fluency, and getting started with Claude"],
      ["Modules 1–3 (Discover, Plan, Design)", "Using Claude for research, writing and analysis"],
      ["Modules 4–5 (Build, Verify)", "Claude Code, the Claude API and MCP"],
      ["Capstone", "Review your certificates and plan your certification exam"],
    ],
    access: [
      ["chat", "Start free", "Create a free account at claude.ai to try Claude in the browser, desktop or mobile apps."],
      ["upgrade", "Upgrade for the flagship models and Claude Code", "The Pro and Max plans include Claude Code and Claude's most capable models (the latest Opus and Sonnet). Max adds much more usage for heavy build weeks."],
      ["groups", "In a team or company", "The Team and Enterprise plans give everyone the same models and Claude Code, with admin controls and security."],
      ["code", "Build with the API", "Developers use the Claude Console (platform.claude.com) to get an API key and call the latest models from their own code, paying for what they use."],
      ["cloud", "Through your company's cloud", "Claude's models are also available through major cloud platforms — AWS, Google Cloud and Microsoft — if that's where your company works."],
    ],
    note: "Node works with any capable agent — Claude, Codex and others. Plans, model names and limits change often, so check claude.com/pricing for what's current.",
  },

  /* Plain-language names for every module and lesson, for newcomers.
     Keys: act id → [plain name, plain question]; process id → [plain title, one plain line]. */
  plain: {
    modules: {
      discover: ["Understand the system and the problem", "What are we really building on — and which approach will work?"],
      plan: ["Decide what to build first", "What exactly will we build, and is it worth the investment?"],
      design: ["Design it before you build it", "How will it look, work and stay safe?"],
      build: ["Build it, piece by piece", "How do we turn the design into working software?"],
      verify: ["Test that it really works", "Does it work — and does it do what people need?"],
      release: ["Launch it safely", "How do we get it to users without breaking anything?"],
      operate: ["Keep it running", "Is it healthy, and what do we do when something goes wrong?"],
      evolve: ["Learn and improve", "Did it work, and what should we do next?"],
    },
    makes: {
      discover: ["A clear picture of the system — code, data and integrations", "A technical problem statement with real measurements", "Prototypes that prove the risky parts", "A recorded technical decision (ADR) for the next step"],
      plan: ["A clear list of what's needed", "An ordered to-do list (your backlog)", "A release plan", "Approval to go ahead"],
      design: ["Screen designs tested with users", "A diagram of how the system fits together — and why", "A security and privacy check", "Clear targets for speed and reliability"],
      build: ["Working software, added piece by piece", "Automatic checks that run on every change", "Reviewed code you can trace back to the plan", "A record of what's inside your software"],
      verify: ["Test results linked to what was needed", "A list of known problems and risks", "Users' sign-off"],
      release: ["Your software live — with a way back", "Release notes and announcements", "Support ready to help users"],
      operate: ["A health dashboard and alerts", "Incident notes and lessons learned", "A clear view of running costs"],
      evolve: ["A results report against your goal", "A list of improvements", "Ideas for the next round", "A plan for retiring old parts"],
    },
    lessons: {
      context: ["Understand the brief and the system", "Read the brief like an engineer, run the system, and map its data, integrations and limits."],
      frame: ["Frame the technical problem", "Pull the problem apart from the proposed solution, list what you don't know, set targets and plan small experiments."],
      problem: ["Investigate the real problem", "Reproduce it, measure it, find its causes and state it clearly."],
      validate: ["Research the solution options", "See what exists, compare it fairly, prototype the risky part and sketch real options."],
      decide: ["Decide and record it", "Check feasibility, estimate effort and risk, recommend one option and write the ADR."],
      "plan-1": ["Write down what's needed", "Turn the problem into clear requirements."],
      "plan-2": ["Choose what comes first", "Decide what's in, what's out, and what waits."],
      "plan-3": ["Estimate the effort", "How big is it, and who do you need?"],
      "plan-4": ["Plan the releases", "Put the work in order, in small steps."],
      "plan-5": ["Get the go-ahead", "Make the case and get approval to invest."],
      "design-1": ["Design the experience", "Sketch the screens and flows, and test them with users."],
      "design-2": ["Map the business rules", "Name the key things and rules the software must respect."],
      "design-3": ["Choose the structure", "Decide how the system fits together — and why."],
      "design-4": ["Design the data", "Decide what data you keep, where, and for how long."],
      "design-5": ["Make it safe", "Think like an attacker, and protect people's data."],
      "design-6": ["Set the quality bar", "Decide how fast, reliable and accessible it must be."],
      "build-1": ["Set up your workshop", "Your code repository, automatic checks and environments."],
      "build-2": ["Plan small slices", "Break the work into small pieces you can test."],
      "build-3": ["Write the code", "Build features with your agent — JavaScript/TypeScript or Rust, on MERN or Next.js."],
      "build-4": ["Review and combine", "Check every change, then merge it safely."],
      "build-5": ["Test as you go", "Write automatic tests for your code."],
      "build-6": ["Document it", "Explain how it works and how to run it."],
      "verify-1": ["Plan the testing", "Decide what to test first, based on risk."],
      "verify-2": ["Test the features", "Check every feature works from start to finish."],
      "verify-3": ["Test speed, security and access", "Performance, security and accessibility checks."],
      "verify-4": ["Let users try it", "Real users confirm it does the job."],
      "verify-5": ["Fix what's broken", "Sort, fix and re-check the problems you found."],
      "release-1": ["Prepare the launch", "Plan the launch — and a way back if needed."],
      "release-2": ["Deploy automatically", "Ship the same safe way every time."],
      "release-3": ["Roll out gradually", "A few users first, then everyone."],
      "release-4": ["Get ready for users", "Support, announcements and training."],
      "release-5": ["Check it after launch", "Make sure it's healthy once it's live."],
      "operate-1": ["Watch how it's doing", "Dashboards and alerts that warn you early."],
      "operate-2": ["Handle incidents", "Fix problems calmly when they happen."],
      "operate-3": ["Find root causes", "Stop the same problem coming back."],
      "operate-4": ["Support your users", "Answer questions and requests."],
      "operate-5": ["Manage capacity and cost", "Right-size it, and keep costs in check."],
      "operate-6": ["Keep it secure", "Spot threats and fix weaknesses."],
      "evolve-1": ["Measure the results", "Compare what happened with your original goal."],
      "evolve-2": ["Listen to feedback", "Gather what users, support and data are telling you."],
      "evolve-3": ["Pay down shortcuts", "Fix the quick fixes before they slow you down."],
      "evolve-4": ["Decide what's next", "Grow it, change it, or stop it."],
      "evolve-5": ["Retire it well", "Switch old things off safely."],
    },
  },

  /* Using Node to grow your career */
  career: [
    ["Newcomer or career switcher", "Run a small project at solo scale. Learn the whole map first, then the code.", "A real project, a portfolio and a certificate for your first role"],
    ["Developer", "Go beyond code: lean into Discover, Plan, Design, Verify, Release and Operate on your project.", "From developer to engineer — senior and tech-lead readiness"],
    ["Engineer or tech lead", "Run your project at team or enterprise scale and adopt the agent kit with your team.", "Lead agent-native delivery; standardise how your team works"],
    ["Product manager, designer or founder", "Go deep on Discover and Plan; learn to direct agents and work with engineers.", "Ship MVPs faster and make evidence-based product calls"],
  ],
};
