/* The practice projects: small, self-contained client briefs a trainee picks on day 0 and carries through the month.
 * Each behaves like a real engagement — a client, a problem with numbers, the people involved, constraints — so every
 * document drafted in the workflow is about something concrete. The people are fictional; the roles they play are
 * the roles the workflows report to (played in review by Node's admins). The tech lead reviews the technical work. */

export type Project = {
  id: string;
  name: string;
  client: string;
  industry: string;
  icon: string;
  color: string;
  brief: string;
  problem: string;
  today: string;
  whyNow: string;
  affected: string[];
  numbers: string[];
  constraints: string[];
  /* what exists today, as an engineer would audit it — the systems, data and integrations behind the problem */
  systems: string[];
  people: { role: string; name: string }[];
};

export const PROJECTS: Project[] = [
  {
    id: "order-intake",
    name: "Order intake",
    client: "Northwind Supplies",
    industry: "Wholesale distribution",
    icon: "inventory_2",
    color: "#007373",
    brief: "Customers email their orders as PDFs; clerks re-type every one into the ERP.",
    problem: "Order entry is slow, error-prone and won’t scale for peak season.",
    today: "PDF orders arrive in a shared inbox. Four clerks re-type each line into the ERP and email a confirmation.",
    whyNow: "Peak season is eight weeks away and order volume doubles.",
    affected: ["Order clerks", "Customers", "Warehouse team", "Finance"],
    numbers: ["~14 minutes per order", "6 hours a day of re-typing", "3% of orders have entry errors"],
    constraints: ["ERP can’t be replaced this year", "Customer data stays in-country", "No new headcount"],
    systems: ["ERP v9 (vendor, on-premises) — orders go in only through its REST import API", "Microsoft 365 shared inbox — customers email PDF orders here", "Customer-code lookup spreadsheets kept by each clerk", "erp-extensions — a small .NET 6 add-on with 9 tests and no CI"],
    people: [{ role: "Sponsor", name: "Daniel Reyes, COO" }, { role: "Portfolio owner", name: "Priya Nair, PMO" }, { role: "Order-clerk lead", name: "Ana Costa" }, { role: "Finance", name: "Grace Liu" }, { role: "Tech lead", name: "Ravi Kumar" }],
  },
  {
    id: "clinic-noshows",
    name: "Appointment no-shows",
    client: "CareFirst Clinics",
    industry: "Healthcare",
    icon: "medical_services",
    color: "#0284c7",
    brief: "Patients miss booked appointments; reception phones each one the day before.",
    problem: "Empty slots waste doctors’ time while other patients wait weeks.",
    today: "Receptionists call tomorrow’s patients from a printed list; cancellations are written on paper and rarely re-filled.",
    whyNow: "A new clinic opens next quarter and the waiting list is already six weeks.",
    affected: ["Patients", "Receptionists", "Doctors", "Clinic managers"],
    numbers: ["22% no-show rate", "~90 reminder calls a day per clinic", "6-week wait for a new appointment"],
    constraints: ["Patient data is regulated (consent needed)", "Many patients only use SMS", "Existing booking system stays"],
    systems: ["Booking system (vendor, cloud) — read-only reporting API, no write access yet", "SMS gateway account used for one-off messages", "Printed call lists exported from the booking system each afternoon", "Patient records in the booking system — regulated, consent recorded per patient"],
    people: [{ role: "Sponsor", name: "Dr. Sana Iqbal, Medical director" }, { role: "Portfolio owner", name: "Bilal Ahmed, Operations head" }, { role: "Reception lead", name: "Maria Lopes" }, { role: "Compliance", name: "Hamza Raza" }, { role: "Tech lead", name: "Usman Javed, IT lead" }],
  },
  {
    id: "school-fees",
    name: "Fee collection",
    client: "Bright Path School",
    industry: "Education",
    icon: "school",
    color: "#6d48d8",
    brief: "Parents pay fees in cash or by bank transfer; the office reconciles it all in Excel.",
    problem: "Late and unmatched payments eat the accounts team’s month and annoy parents.",
    today: "Parents bring cash or send transfer screenshots on WhatsApp; two accountants match them to students by hand.",
    whyNow: "Enrolment grows 30% next year and the board wants monthly cash-flow reports.",
    affected: ["Parents", "Accounts office", "Principal", "Teachers (fee reminders)"],
    numbers: ["18% of fees paid late", "~40 unmatched transfers a month", "4 days to close each month"],
    constraints: ["Many parents prefer cash", "Small budget", "Must work in Urdu and English"],
    systems: ["Excel workbook of students, fees and payments — one per term", "Bank statements downloaded as CSV each week", "WhatsApp group where parents send transfer screenshots", "Student register in the school's admin software (export to CSV only)"],
    people: [{ role: "Sponsor", name: "Ayesha Khan, Principal" }, { role: "Portfolio owner", name: "Imran Siddiqui, Board member" }, { role: "Accounts lead", name: "Faisal Mehmood" }, { role: "Parent representative", name: "Nadia Shah" }, { role: "Tech lead", name: "Ali Raza, IT administrator" }],
  },
  {
    id: "courier-tracking",
    name: "Where’s my parcel?",
    client: "SwiftDrop Couriers",
    industry: "Logistics",
    icon: "local_shipping",
    color: "#c2410c",
    brief: "Customers call the hotline to ask where their parcel is; agents check three systems to answer.",
    problem: "The call centre is swamped by status questions instead of real problems.",
    today: "Riders update status on paper slips that are typed in at night; agents search the dispatch sheet, rider WhatsApp and the warehouse log.",
    whyNow: "A new e-commerce partner will triple volume in four months.",
    affected: ["Customers", "Call-centre agents", "Riders", "Merchant partners"],
    numbers: ["~400 status calls a day", "6-minute average call", "12% of parcels marked delivered late"],
    constraints: ["Riders have basic Android phones", "Patchy mobile data", "Merchant API must stay unchanged"],
    systems: ["Dispatch sheet in Google Sheets, updated by supervisors", "Merchant API (REST) that pushes new parcels — must stay unchanged", "Warehouse log in a local Access database", "Paper status slips typed in at night; riders on basic Android phones"],
    people: [{ role: "Sponsor", name: "Kamran Ali, COO" }, { role: "Portfolio owner", name: "Sara Javed, Strategy" }, { role: "Call-centre lead", name: "Tariq Hussain" }, { role: "Rider supervisor", name: "Asif Nawaz" }, { role: "Tech lead", name: "Nida Hassan, Engineering lead" }],
  },
  {
    id: "restaurant-waste",
    name: "Kitchen waste",
    client: "Saffron Kitchen",
    industry: "Food & hospitality",
    icon: "restaurant",
    color: "#a16207",
    brief: "Three branches order stock by gut feel; counts are on paper and food gets thrown away.",
    problem: "Over-ordering wastes money; under-ordering runs dishes out at peak hours.",
    today: "Each branch chef counts stock on paper at closing and phones orders to suppliers the next morning.",
    whyNow: "Ingredient prices rose 20% this year and a fourth branch is planned.",
    affected: ["Branch chefs", "Branch managers", "Suppliers", "The owner"],
    numbers: ["~9% of food purchased is wasted", "2–3 dishes sold out each weekend", "45 minutes a night counting stock"],
    constraints: ["Kitchen staff have little time for data entry", "Suppliers take orders by phone", "Tablets only in the office"],
    systems: ["POS system in each branch (vendor, cloud) with a sales export", "Paper stock-count sheets filled in at closing", "Supplier orders by phone; prices kept in a notebook", "One office tablet and Wi-Fi in each branch"],
    people: [{ role: "Sponsor", name: "Omar Farooq, Owner" }, { role: "Portfolio owner", name: "Hina Malik, Operations manager" }, { role: "Head chef", name: "Rashid Khan" }, { role: "Finance", name: "Zara Qureshi" }, { role: "Tech lead", name: "Bilal Qadir, IT contractor" }],
  },
  {
    id: "agency-invoicing",
    name: "Invoicing & payments",
    client: "Studio Loop",
    industry: "Creative agency",
    icon: "request_quote",
    color: "#be185d",
    brief: "Invoices are typed in Word from timesheets; chasing payment is done from memory.",
    problem: "Cash arrives late and nobody can see which client owes what.",
    today: "At month end the office manager builds invoices from spreadsheets of hours, emails PDFs, and tracks payments in a notebook.",
    whyNow: "Two late-paying clients nearly caused a missed payroll last quarter.",
    affected: ["Office manager", "Project leads", "Clients’ finance teams", "Founders"],
    numbers: ["45-day average time to get paid", "~6 invoices with errors a month", "2 days to build month-end invoices"],
    constraints: ["Clients pay in PKR and USD", "Accountant uses a separate tool", "Team of 12 — no IT staff"],
    systems: ["Timesheets in Google Sheets, one tab per project", "Invoices typed in Word and emailed as PDF", "Accountant's tool (cloud) with a CSV import", "Payments tracked in a notebook; bank feed in PKR and USD"],
    people: [{ role: "Sponsor", name: "Leena Aziz, Co-founder" }, { role: "Portfolio owner", name: "Usman Tariq, Co-founder" }, { role: "Office manager", name: "Mehwish Ali" }, { role: "Accountant", name: "Junaid Akhtar" }, { role: "Tech lead", name: "Hamid Sheikh, Freelance developer" }],
  },
];

export const projectById = (id: string | null | undefined) => PROJECTS.find((p) => p.id === id) ?? null;
