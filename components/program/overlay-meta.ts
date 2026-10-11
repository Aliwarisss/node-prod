/* The little that the day page needs from the full-screen Learn board and Story mode before they open — kept apart
   so those two (large) components load only when the trainee opens them. */

/* the Learn board's chapters, in order */
export const BOARD_CHAPTERS = [
  { id: "intro", label: "Intro", icon: "play_circle" },
  { id: "questions", label: "Why · what · who", icon: "help" },
  { id: "lenses", label: "Lenses", icon: "visibility" },
  { id: "workflow", label: "Workflow", icon: "account_tree" },
  { id: "whatif", label: "What if", icon: "call_split" },
  { id: "gate", label: "Gate", icon: "verified" },
  { id: "routes", label: "Routes", icon: "alt_route" },
  { id: "handoff", label: "Hand on", icon: "east" },
] as const;

/* Story mode's project */
export const PROJECT = {
  client: "Northwind Supplies",
  what: "a wholesale distributor",
  initiative: "Order intake",
  premise: "Customers email their orders as PDFs. Order clerks re-type every one into the ERP — about 14 minutes an order, six hours a day. Peak season is eight weeks away.",
};
