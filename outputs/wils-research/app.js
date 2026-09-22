const CONTACT = {
  phoneLocal: "0786609975",
  phoneIntl: "+255 786 609 975",
  whatsapp: "255786609975",
  email: "wilsresearch7@gmail.com"
};

const services = [
  ["assignments", "Assignments", "Academic assignments, reports and structured academic documents.", ["Academic reports", "Structured writing", "Formatting", "References"]],
  ["research-proposals", "Research Proposals & Reports", "Proposal development, research reports, methodology and academic documentation.", ["Proposal writing", "Methodology support", "Literature review", "Complete reports"]],
  ["data-analysis", "Data Collection & Analysis", "Data cleaning, coding, analysis, interpretation and presentation.", ["Data cleaning", "SPSS, STATA, Excel", "Tables and charts", "Interpretation"]],
  ["business-plans", "Business Plans", "Professional business plans, market research and financial planning.", ["Market research", "Feasibility studies", "Financial projections", "Business pitch decks"]],
  ["presentations", "Presentations", "Academic presentations, research findings and professional PowerPoint decks.", ["PowerPoint decks", "Defense slides", "Findings summary", "Visual polish"]],
  ["cv-revamping", "CV Revamping", "Professional CV restructuring and presentation.", ["CV writing", "Cover letters", "LinkedIn profile support", "Academic CVs"]],
  ["spss-stata-excel", "SPSS / STATA / Excel", "Statistical analysis, data cleaning, tables, charts and reporting.", ["Descriptive statistics", "Regression", "Cross-tabs", "Charts"]],
  ["consultation", "Research Consultation", "Research design, topic development, methodology and general research guidance.", ["Topic selection", "Study design", "Analysis plan", "General guidance"]]
];

const paymentMethods = [
  "M-Pesa",
  "Airtel Money",
  "T-Pesa",
  "HaloPesa",
  "CRDB",
  "NMB",
  "NBC",
  "Absa",
  "Exim Bank",
  "Bank Transfer",
  "Cash"
];

const previousWorks = [
  ["previous-results.png", "Research proposal and writing support", "Academic writing, review and structured research support."],
  ["previous-report.png", "Medical research report", "Clean result presentation with tables, figures and interpretation."],
  ["previous-spss.png", "SPSS / statistical analysis", "Regression, coding, outputs and statistical reporting."],
  ["previous-human.png", "Professional document polishing", "Readable, human-written academic and business documents."]
];

const storeKey = "wils-research-state-v2";
let state = loadState();
let currentClientId = sessionStorage.getItem("wilsClientId") || "";
let adminLoggedIn = sessionStorage.getItem("wilsAdmin") === "true";
let countdownTimer = null;

function todayISO(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function loadState() {
  const saved = localStorage.getItem(storeKey);
  if (saved) return JSON.parse(saved);
  const seeded = {
    bookings: [
      {
        id: "WR-20260921-001",
        createdAt: new Date().toISOString(),
        name: "Aisha M.",
        phone: "0786000000",
        email: "aisha@example.com",
        university: "KCMUCo",
        registration: "KCM/2026/001",
        course: "Public Health",
        service: "data-analysis",
        title: "Data Analysis for Hypertension Study",
        design: "Cross-sectional study",
        description: "Clean dataset, analyze hypertension variables and prepare tables.",
        expectedDate: todayISO(7),
        notes: "Demo booking for testing the portal.",
        files: ["hypertension-dataset.xlsx"],
        username: "Aisha2026",
        accessCode: "WR-48291",
        accountExpiresAt: todayISO(30),
        status: "In Progress",
        receivedAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        deadline: todayISO(7),
        completedAt: "",
        deliveredAt: "",
        agreedAmount: 150000,
        messages: [
          { from: "Marjorie", text: "Hey, my name is Marjorie, founder of WILS Research. Thank you so much for working with us. I promise you privacy: this is a temporary account, and after the deadline it can disappear from your side while records remain safely archived. For anything, feel free to talk to us by email.", at: new Date().toISOString() },
          { from: "WILS Research", text: "Your work is in progress. We will update you here.", at: new Date().toISOString() }
        ],
        payments: [
          { id: "PAY-001", amount: 50000, method: "M-Pesa", senderType: "Personal account", senderName: "Aisha M.", senderPhone: "0786000000", accountName: "Aisha M.", reference: "DEMO-50000", receiptName: "mpesa-receipt.jpg", date: todayISO(0), status: "Received" }
        ],
        documents: [
          { id: "DOC-001", name: "Research Proposal Guidelines.pdf", type: "Working Documents", final: false },
          { id: "DOC-002", name: "Final Analysis Report.docx", type: "Final Work", final: true }
        ],
        activity: ["Booking created", "Work started", "Initial payment confirmed"]
      }
    ]
  };
  localStorage.setItem(storeKey, JSON.stringify(seeded));
  return seeded;
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function money(value) {
  return `TSh ${Math.max(0, Number(value || 0)).toLocaleString("en-US")}`;
}

function fmtDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function serviceName(id) {
  return (services.find((service) => service[0] === id) || [null, id])[1];
}

function totals(booking) {
  const paid = booking.payments.filter((p) => p.status === "Received" || p.status === "Confirmed").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const submitted = booking.payments.filter((p) => p.status === "Submitted").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const agreed = Number(booking.agreedAmount || 0);
  const remaining = Math.max(0, agreed - paid);
  const percent = agreed > 0 ? Math.min(100, Math.round((paid / agreed) * 100)) : 0;
  const paymentStatus = paid === 0 ? "Unpaid" : remaining === 0 ? "Paid" : "Partially Paid";
  const unlocked = booking.status === "Completed" && remaining === 0;
  return { agreed, paid, submitted, remaining, percent, paymentStatus, unlocked };
}

function whatsappUrl(message) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
}

function icon(index) {
  return ["AR", "RP", "DA", "BP", "PR", "CV", "SE", "RC"][index] || "WR";
}

function render() {
  clearInterval(countdownTimer);
  const hash = (location.hash || "#home").replace("#", "");
  const [pathPart] = hash.split("?");
  const [page, sub] = pathPart.split("/");
  const app = document.getElementById("app");
  const routes = {
    home: renderHome,
    how: renderHome,
    work: renderHome,
    services: renderServices,
    book: renderBook,
    contact: renderContact,
    login: renderLogin,
    account: renderAccount,
    admin: renderAdmin
  };
  app.innerHTML = (routes[page] || renderHome)(sub);
  bindCommon();
  if (page === "how" || page === "work") document.getElementById(page)?.scrollIntoView();
  app.focus({ preventScroll: true });
}

function renderHome() {
  return `
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Classic research support</span>
        <h1>WILS Research</h1>
        <p class="eyebrow">Where Your Numbers Make Sense.</p>
        <p>Professional academic, medical and business research support - from research proposals and data analysis to polished reports and professional documents.</p>
        <div class="hero-actions">
          <a class="gold-btn" href="#book">Book a Service</a>
          <a class="ghost-btn" data-whatsapp="Hello WILS Research, I would like to book a service." href="#">WhatsApp Us</a>
        </div>
        <div class="trust-strip">
          <div class="trust-pill">Quality</div>
          <div class="trust-pill">Confidential</div>
          <div class="trust-pill">On Time</div>
          <div class="trust-pill">Professional</div>
        </div>
      </div>
      <div class="hero-panel" aria-label="WILS Research visual reference">
        <div class="hero-note">Quality research builds better tomorrows.</div>
      </div>
    </section>
    <section class="section" id="services-preview">
      <div class="section-head">
        <span class="eyebrow">Our Services</span>
        <h2>Research support designed around your project.</h2>
      </div>
      <div class="grid services">${serviceCards(false)}</div>
    </section>
    <section class="section compact" id="how">
      <div class="section-head">
        <span class="eyebrow">How It Works</span>
        <h2>A clear process from request to delivery.</h2>
      </div>
      <div class="steps">
        ${["Book - tell us what you need.", "Confirm - WILS reviews and confirms price.", "Pay Initial Amount - secure your booking.", "Work - your project is tracked and updated.", "Complete Payment & Receive - final work unlocks after full payment."].map((text) => `<div class="step"><h3>${text.split(" - ")[0]}</h3><p>${text.split(" - ")[1]}</p></div>`).join("")}
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <span class="eyebrow">Why WILS Research?</span>
        <h2>Professional support without confusion.</h2>
      </div>
      <div class="grid three">
        ${["Quality", "Confidentiality", "Clear communication", "Deadline tracking", "Transparent payments", "Professional delivery"].map((item) => `<div class="work-card"><h3>${item}</h3><p>Built into the booking, account and admin workflow.</p></div>`).join("")}
      </div>
    </section>
    <section class="section compact" id="work">
      <div class="section-head">
        <span class="eyebrow">Our Work</span>
        <h2>Focused categories, not fake client claims.</h2>
      </div>
      <div class="grid three">
        ${["Research Analysis", "Medical Research", "Academic Writing", "Business Research", "Data Visualization", "Professional Documents"].map((item) => `<div class="work-card"><span class="icon">WR</span><h3>${item}</h3><p>Structured support for real WILS Research client projects.</p></div>`).join("")}
      </div>
    </section>
    ${contactCta()}
  `;
}

function serviceCards(detailed) {
  return services.map((service, index) => `
    <article class="card">
      <span class="icon">${icon(index)}</span>
      <h3>${service[1]}</h3>
      <p>${service[2]}</p>
      ${detailed ? `<ul>${service[3].map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
      <a class="gold-btn" href="#book?service=${service[0]}">Book This Service</a>
    </article>
  `).join("");
}

function renderServices() {
  return `
    <section class="section">
      <div class="section-head">
        <span class="eyebrow">Services</span>
        <h2>Professional support for academic, medical and business research.</h2>
      </div>
      <div class="grid three">${serviceCards(true)}</div>
    </section>
    ${contactCta()}
  `;
}

function renderBook() {
  const params = new URLSearchParams((location.hash.split("?")[1] || ""));
  const picked = params.get("service") || "data-analysis";
  return `
    <section class="section">
      <div class="section-head">
        <span class="eyebrow">Book a Service</span>
        <h2>Tell us what you need and WILS will review your request.</h2>
        <p>The customer submits the request. WILS Research confirms the agreed amount, initial payment and deadline from the admin dashboard.</p>
      </div>
      <form id="bookingForm" class="panel form-grid">
        ${field("Reference Username", "username", "text", true)}
        ${field("Temporary Password", "accessCode", "password", true)}
        ${field("Phone / WhatsApp", "phone", "tel", true)}
        ${field("Email", "email", "email", false)}
        ${field("University / Institution (optional)", "university", "text", false)}
        <label>Service<select name="service">${services.map((s) => `<option value="${s[0]}" ${picked === s[0] ? "selected" : ""}>${s[1]}</option>`).join("")}</select></label>
        ${field("Expected Completion Date", "expectedDate", "date", true)}
        ${field("Work Title", "title", "text", true, "full")}
        ${field("Study Design", "design", "text", false, "full")}
        <label class="field full">Objectives / Brief Description<textarea name="description" required></textarea></label>
        <label class="field full">Additional Notes<textarea name="notes"></textarea></label>
        <label class="field full">Upload Files<input name="files" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"></label>
        <div class="field full notice">Privacy promise: you can use a reference username instead of a full legal name. This temporary account is only for tracking work, payment and documents.</div>
        <button class="gold-btn" type="submit">Submit Booking</button>
      </form>
    </section>
  `;
}

function field(labelText, name, type, required, className = "") {
  return `<label class="field ${className}">${labelText}<input name="${name}" type="${type}" ${required ? "required" : ""}></label>`;
}

function renderContact() {
  return `
    <section class="section">
      <div class="wide-cta">
        <div>
          <span class="eyebrow">Contact</span>
          <h2>Let's work on your project.</h2>
          <p>Have a research, academic, medical or business project? Contact WILS Research and tell us what you need.</p>
          <p><strong>${CONTACT.phoneLocal}</strong> | ${CONTACT.phoneIntl} | ${CONTACT.email}</p>
        </div>
        <div class="row-actions">
          <a class="gold-btn" data-whatsapp="Hello WILS Research, I would like to discuss my project." href="#">WhatsApp Us</a>
          <a class="ghost-btn" href="#book">Book a Service</a>
        </div>
      </div>
    </section>
  `;
}

function contactCta() {
  return `
    <section class="section compact">
      <div class="wide-cta">
        <div>
          <span class="eyebrow">Ready</span>
          <h2>Let's work on your project.</h2>
          <p>Contact WILS Research directly or submit a booking request.</p>
        </div>
        <div class="row-actions">
          <a class="gold-btn" data-whatsapp="Hello WILS Research, I would like to start a project." href="#">WhatsApp Us</a>
          <a class="ghost-btn" href="#book">Book a Service</a>
        </div>
      </div>
    </section>
  `;
}

function renderLogin() {
  return `
    <section class="section">
      <div class="grid two">
        <form id="clientLogin" class="panel">
          <span class="eyebrow">Client Login</span>
          <h2>Temporary customer account.</h2>
          <p>Use the temporary username and password created during booking. Demo login: username <strong>Aisha2026</strong>, password <strong>WR-48291</strong>.</p>
          ${field("Username", "username", "text", true)}
          ${field("Password", "accessCode", "password", true)}
          <div class="row-actions"><button class="gold-btn" type="submit">Login</button><a class="ghost-btn" href="#book">Book First</a></div>
        </form>
        <form id="adminLogin" class="panel">
          <span class="eyebrow">Owner Area</span>
          <h2>Private admin dashboard.</h2>
          <p>Admin is not advertised publicly. Demo PIN: <strong>WILS-2026</strong>.</p>
          ${field("Admin PIN", "pin", "password", true)}
          <button class="gold-btn" type="submit">Open Admin</button>
        </form>
      </div>
    </section>
  `;
}

function getClient() {
  return state.bookings.find((booking) => booking.id === currentClientId);
}

function renderAccount() {
  const booking = getClient();
  if (!booking) return `<section class="section"><div class="panel"><h2>Please log in.</h2><p>Your temporary account opens after booking or login.</p><a class="gold-btn" href="#login">Login</a></div></section>`;
  if (new Date(booking.accountExpiresAt) < new Date()) {
    return `<section class="section"><div class="panel"><h2>Account Expired</h2><p>Your temporary WILS Research account expired on ${fmtDate(booking.accountExpiresAt)}. Financial records remain archived for admin access.</p><a class="gold-btn" data-whatsapp="Hello WILS Research, my temporary account has expired." href="#">Contact WILS</a></div></section>`;
  }
  const t = totals(booking);
  return `
    <section class="portal-shell">
      ${sidebar(booking, "Dashboard")}
      <div class="portal-main">
        <span class="eyebrow">Temporary Account</span>
        <h2>Hello, ${booking.name.split(" ")[0]}.</h2>
        <p>Your project is tracked privately in this temporary WILS Research account. Account expires: ${fmtDate(booking.accountExpiresAt)}.</p>
        <div class="notice founder-note"><strong>Message from Marjorie</strong><br>${booking.messages[0]?.text || ""}</div>
        <div class="metric-grid">
          ${metric("Work Status", booking.status)}
          ${metric("Paid", money(t.paid))}
          ${metric("Remaining", money(t.remaining))}
          ${metric("Deadline", deadlineText(booking))}
        </div>
        <div id="overview" class="grid two">
          <div class="panel">
            <h3>Current Work</h3>
            <p><strong>${booking.title}</strong></p>
            <p>Booking ID: ${booking.id}<br>Received: ${fmtDate(booking.receivedAt)}<br>Started: ${fmtDate(booking.startedAt)}<br>Deadline: ${fmtDate(booking.deadline)}</p>
            <span class="status ${booking.status === "Completed" ? "ok" : "info"}">${booking.status}</span>
            <div id="countdown" class="countdown"></div>
          </div>
          <div class="panel">
            <h3>Payment Summary</h3>
            <p>Agreed Amount: <strong>${money(t.agreed)}</strong><br>Received by WILS: <strong>${money(t.paid)}</strong><br>Submitted awaiting confirmation: <strong>${money(t.submitted)}</strong><br>Remaining: <strong>${money(t.remaining)}</strong></p>
            <span class="status ${t.paymentStatus === "Paid" ? "ok" : "info"}">${t.paymentStatus}</span>
            <div class="progress" aria-label="Payment progress"><span style="width:${t.percent}%"></span></div>
            <p>${t.percent}% paid</p>
          </div>
        </div>
        <div id="payment" class="panel" style="margin-top:16px">
            <h3>Send Payment Receipt</h3>
            <p>Submit the payment details exactly as they appear on your mobile money or bank receipt. The balance changes only after admin marks it as received.</p>
            <form id="paymentForm" class="form-grid">
              ${field("Amount", "amount", "number", true)}
              <label>Payment Method<select name="method">${paymentMethods.map((method) => `<option>${method}</option>`).join("")}</select></label>
              <label>Sender Type<select name="senderType"><option>Personal account</option><option>Agent account</option><option>Business account</option><option>University/Institution account</option></select></label>
              ${field("Sender Name", "senderName", "text", true)}
              ${field("Sender Phone / Account Number", "senderPhone", "text", true)}
              ${field("Account Name Used", "accountName", "text", true)}
              ${field("Transaction Reference", "reference", "text", true)}
              <label>Receipt / Screenshot<input name="receipt" type="file" accept=".png,.jpg,.jpeg,.pdf"></label>
              <button class="gold-btn" type="submit">Submit Payment Info</button>
            </form>
        </div>
        <div class="grid two" style="margin-top:16px">
          <div id="documents" class="panel">
            <h3>Documents</h3>
            ${booking.documents.map((doc) => docRow(booking, doc)).join("") || "<p>No documents yet.</p>"}
          </div>
          <div class="panel">
            <h3>Payment History</h3>
            ${booking.payments.map(paymentRow).join("") || "<p>No payments submitted yet.</p>"}
          </div>
        </div>
        <div class="grid two" style="margin-top:16px">
          <div class="panel">
            <h3>Previous WILS Work</h3>
            <div class="portfolio-mini">${previousWorks.map((work) => `<article><img src="./assets/${work[0]}" alt="${work[1]}"><strong>${work[1]}</strong><span>${work[2]}</span></article>`).join("")}</div>
          </div>
          <div id="feedback" class="panel">
            <h3>Rate Your Experience</h3>
            <p>Your score helps WILS Research improve delivery, privacy and communication.</p>
            <form id="feedbackForm" class="form-grid">
              <label>Stars<select name="stars"><option>5 stars</option><option>4 stars</option><option>3 stars</option><option>2 stars</option><option>1 star</option></select></label>
              <label class="field full">Comment<textarea name="comment"></textarea></label>
              <button class="gold-btn" type="submit">Save Rating</button>
            </form>
            ${booking.feedback ? `<div class="notice">Saved feedback: ${booking.feedback.stars}<br>${booking.feedback.comment || ""}</div>` : ""}
          </div>
        </div>
      </div>
    </section>
  `;
}

function sidebar(booking, active) {
  return `
    <aside class="sidebar">
      <div class="client-card">
        <h3>${booking.username}</h3>
        <p>Temporary account<br>Expires: ${fmtDate(booking.accountExpiresAt)}</p>
      </div>
      <button class="side-link active" data-scroll="overview" type="button">Overview</button>
      <button class="side-link" data-scroll="payment" type="button">Payment</button>
      <button class="side-link" data-scroll="documents" type="button">Documents</button>
      <button class="side-link" data-scroll="feedback" type="button">Feedback</button>
      <a class="side-link" data-whatsapp="Hello WILS Research, I want to ask about my booking ${booking.id}." href="#">WhatsApp WILS</a>
      <button class="side-link" id="logoutBtn" type="button">Logout</button>
    </aside>
  `;
}

function metric(label, value) {
  return `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function deadlineText(booking) {
  if (booking.status === "Completed") return "Completed";
  if (!booking.deadline) return "Pending";
  const diff = new Date(booking.deadline + "T23:59:59") - new Date();
  if (diff < 0) return "Overdue";
  return `${Math.ceil(diff / 86400000)} days left`;
}

function docRow(booking, doc) {
  const t = totals(booking);
  const locked = doc.final && !t.unlocked;
  return `
    <div class="doc-row">
      <span>${doc.type}<br><strong>${doc.name}</strong>${locked ? "<br><small>Complete payment to unlock final document.</small>" : ""}</span>
      <button class="${locked ? "danger-btn" : "gold-btn"}" data-download="${doc.id}" type="button">${locked ? "Locked" : "Download"}</button>
    </div>
  `;
}

function paymentRow(payment) {
  const ok = payment.status === "Received" || payment.status === "Confirmed";
  return `
    <div class="payment-row">
      <span>
        <strong>${money(payment.amount)}</strong> - ${payment.method}<br>
        Sender: ${payment.senderName || "-"} (${payment.senderType || "Not specified"})<br>
        Phone/account: ${payment.senderPhone || "-"} | Account name: ${payment.accountName || "-"}<br>
        Reference: ${payment.reference || "-"} | Receipt: ${payment.receiptName || "No file"}
      </span>
      <span class="status ${ok ? "ok" : "info"}">${ok ? "Received" : payment.status}</span>
    </div>
  `;
}

function renderAdmin() {
  if (!adminLoggedIn) return `<section class="section"><div class="panel"><h2>Admin Login Required</h2><p>Open the private owner area from login.</p><a class="gold-btn" href="#login">Go to Login</a></div></section>`;
  const outstanding = state.bookings.reduce((sum, booking) => sum + totals(booking).remaining, 0);
  return `
    <section class="section">
      <div class="section-head">
        <span class="eyebrow">Owner Dashboard</span>
        <h2>Bookings, deadlines, payments and completion.</h2>
      </div>
      <div class="metric-grid">
        ${metric("New Bookings", state.bookings.filter((b) => b.status === "Pending Review").length)}
        ${metric("Active Work", state.bookings.filter((b) => b.status === "In Progress").length)}
        ${metric("Completed", state.bookings.filter((b) => b.status === "Completed").length)}
        ${metric("Pending Receipts", money(state.bookings.reduce((sum, b) => sum + totals(b).submitted, 0)))}
        ${metric("Outstanding", money(outstanding))}
      </div>
      <div class="admin-toolbar">
        <input id="adminSearch" placeholder="Search customer, phone, title, booking ID or reference">
        <select id="adminFilter">
          ${["All", "Pending Review", "In Progress", "Completed", "Awaiting Payment", "Paid", "Overdue"].map((f) => `<option>${f}</option>`).join("")}
        </select>
        <button class="ghost-btn" id="seedBtn" type="button">Add Demo Booking</button>
        <button class="danger-btn" id="adminLogout" type="button">Logout Admin</button>
      </div>
      <div class="admin-table" id="adminTable"></div>
      <div class="panel" id="adminDetail" style="margin-top:18px"></div>
    </section>
  `;
}

function renderAdminTable() {
  const table = document.getElementById("adminTable");
  if (!table) return;
  const search = (document.getElementById("adminSearch")?.value || "").toLowerCase();
  const filter = document.getElementById("adminFilter")?.value || "All";
  const rows = state.bookings.filter((booking) => {
    const t = totals(booking);
    const haystack = [booking.name, booking.phone, booking.email, booking.title, booking.id, ...booking.payments.map((p) => p.reference)].join(" ").toLowerCase();
    const overdue = deadlineText(booking) === "Overdue";
    const statusMatch = filter === "All" || booking.status === filter || (filter === "Paid" && t.remaining === 0) || (filter === "Overdue" && overdue);
    return haystack.includes(search) && statusMatch;
  });
  table.innerHTML = `
    <div class="admin-row header"><span>Client</span><span>Service</span><span>Work</span><span>Time Left</span><span>Agreed</span><span>Received</span><span>Remaining</span><span>Done</span></div>
    ${rows.map((booking) => {
      const t = totals(booking);
      return `<div class="admin-row" data-admin-booking="${booking.id}">
        <span><strong>${booking.username || booking.name}</strong><br>${booking.phone}</span>
        <span>${serviceName(booking.service)}</span>
        <span>${booking.title}<br><small>${booking.id}</small></span>
        <span>${deadlineText(booking)}<br><small>${fmtDate(booking.deadline)}</small></span>
        <span>${money(t.agreed)}</span>
        <span>${money(t.paid)}</span>
        <span>${money(t.remaining)}</span>
        <button class="${booking.status === "Completed" ? "gold-btn" : "ghost-btn"}" data-done="${booking.id}" type="button">${booking.status === "Completed" ? "Done" : "Mark Done"}</button>
      </div>`;
    }).join("")}
  `;
  const detail = document.getElementById("adminDetail");
  if (detail && rows[0]) detail.innerHTML = adminDetail(rows[0]);
}

function adminDetail(booking) {
  const t = totals(booking);
  const finalLocked = t.unlocked ? "Unlocked" : "Locked until work is completed and full payment is received";
  return `
    <span class="eyebrow">Work Detail</span>
    <h2>${booking.username || booking.name}</h2>
    <div class="grid two">
      <div>
        <h3>Customer</h3>
        <p>Reference: ${booking.username || booking.name}<br>Phone: ${booking.phone || "-"}<br>Email: ${booking.email || "-"}<br>University: ${booking.university || "Not provided"}</p>
        <h3>Work</h3>
        <p>${serviceName(booking.service)}<br>${booking.title}<br>${booking.description || "-"}<br><strong>Time left:</strong> ${deadlineText(booking)}</p>
      </div>
      <form class="form-grid adminUpdate" data-update="${booking.id}">
        ${field("Agreed Amount", "agreedAmount", "number", false)}
        ${field("Deadline", "deadline", "date", false)}
        <label>Status<select name="status">${["Pending Review", "Received", "In Progress", "Correction", "Completed", "Awaiting Payment", "Paid", "Delivered"].map((s) => `<option ${booking.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
        <label>Upload Work For This Client<input name="documentFile" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"></label>
        <label>Document Type<select name="documentType"><option>Working Documents</option><option>Draft</option><option>Final Work</option></select></label>
        <label class="field full">Admin Note<textarea name="adminNote" placeholder="Optional update for this client's record"></textarea></label>
        <button class="gold-btn" type="submit">Save Admin Changes</button>
        <a class="ghost-btn" data-whatsapp="Hello ${booking.name}, WILS Research is updating you about ${booking.title}." href="#">WhatsApp Customer</a>
        <a class="ghost-btn" href="mailto:${booking.email || CONTACT.email}?subject=${encodeURIComponent("WILS Research - " + booking.title)}&body=${encodeURIComponent("Hello " + (booking.username || booking.name) + ",\n\nWILS Research is updating you about your work: " + booking.title + ".")}">Email Customer</a>
      </form>
    </div>
    <div class="notice">Agreed: ${money(t.agreed)} | Received: ${money(t.paid)} | Submitted awaiting confirmation: ${money(t.submitted)} | Remaining: ${money(t.remaining)} | Final document: ${finalLocked}</div>
    <div class="grid two">
      <div>
        <h3>Payment Receipts</h3>
        ${booking.payments.map((payment) => adminPaymentRow(booking, payment)).join("") || "<p>No payment receipts yet.</p>"}
      </div>
      <div>
        <h3>Client Documents</h3>
        ${booking.documents.map((doc) => `<div class="doc-row"><span>${doc.type}<br><strong>${doc.name}</strong></span><span class="status ${doc.final ? "info" : ""}">${doc.final ? "Final" : "File"}</span></div>`).join("") || "<p>No documents yet.</p>"}
      </div>
    </div>
    <h3>Activity Log</h3>
    ${(booking.activity || []).map((item) => `<p>${item}</p>`).join("")}
  `;
}

function adminPaymentRow(booking, payment) {
  const ok = payment.status === "Received" || payment.status === "Confirmed";
  return `
    <div class="payment-row">
      <span>
        <strong>${money(payment.amount)}</strong> - ${payment.method}<br>
        Sender: ${payment.senderName || "-"} | ${payment.senderType || "-"}<br>
        Phone/account: ${payment.senderPhone || "-"} | Account name: ${payment.accountName || "-"}<br>
        Reference: ${payment.reference || "-"} | Receipt: ${payment.receiptName || "No file"}<br>
        Date: ${fmtDate(payment.date)}
      </span>
      ${ok ? `<span class="status ok">Received</span>` : `<button class="gold-btn" data-receive-payment="${booking.id}:${payment.id}" type="button">Mark Received</button>`}
    </div>
  `;
}

function bindCommon() {
  document.querySelector(".menu-toggle")?.addEventListener("click", () => document.querySelector(".main-nav").classList.toggle("open"));
  hydrateLinks();

  document.getElementById("bookingForm")?.addEventListener("submit", submitBooking);
  document.getElementById("clientLogin")?.addEventListener("submit", clientLogin);
  document.getElementById("adminLogin")?.addEventListener("submit", adminLogin);
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("wilsClientId");
    currentClientId = "";
    location.hash = "#login";
  });
  document.getElementById("paymentForm")?.addEventListener("submit", submitPayment);
  document.getElementById("feedbackForm")?.addEventListener("submit", submitFeedback);
  document.querySelectorAll("[data-download]").forEach((btn) => btn.addEventListener("click", handleDownload));

  if (location.hash.startsWith("#account")) startCountdown();
  if (location.hash.startsWith("#admin")) {
    renderAdminTable();
    document.getElementById("adminSearch")?.addEventListener("input", renderAdminTable);
    document.getElementById("adminFilter")?.addEventListener("change", renderAdminTable);
    document.getElementById("seedBtn")?.addEventListener("click", seedBooking);
    document.getElementById("adminLogout")?.addEventListener("click", () => {
      sessionStorage.removeItem("wilsAdmin");
      adminLoggedIn = false;
      location.hash = "#login";
    });
    document.getElementById("adminTable")?.addEventListener("click", adminTableClick);
    document.getElementById("adminDetail")?.addEventListener("click", adminTableClick);
    document.getElementById("adminDetail")?.addEventListener("submit", adminSubmit);
  }
}

function hydrateLinks() {
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.setAttribute("href", whatsappUrl(link.dataset.whatsapp));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noreferrer");
  });
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });
}

function submitBooking(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const files = [...event.currentTarget.elements.files.files].map((file) => file.name);
  const username = data.username.replace(/\s+/g, "").slice(0, 28);
  const accessCode = data.accessCode;
  const booking = {
    id: `WR-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...data,
    name: username,
    files,
    username,
    accessCode,
    accountExpiresAt: todayISO(30),
    status: "Pending Review",
    receivedAt: new Date().toISOString(),
    startedAt: "",
    deadline: data.expectedDate,
    completedAt: "",
    deliveredAt: "",
    agreedAmount: 0,
    payments: [],
    documents: files.map((name, index) => ({ id: `DOC-${Date.now()}-${index}`, name, type: "Client Files", final: false })),
    messages: [
      { from: "Marjorie", text: "Hey, my name is Marjorie, founder of WILS Research. Thank you so much for working with us. I promise you entire privacy. This temporary account does not require your full name. Within a short time after your deadline, your account disappears from your side while records remain safely archived. For anything, feel free to talk to us through our email.", at: new Date().toISOString() },
      { from: "WILS Research", text: "Your booking has been received and is pending review.", at: new Date().toISOString() }
    ],
    activity: ["Booking created"]
  };
  state.bookings.unshift(booking);
  saveState();
  currentClientId = booking.id;
  sessionStorage.setItem("wilsClientId", booking.id);
  document.getElementById("app").innerHTML = `
    <section class="section">
      <div class="panel">
        <span class="eyebrow">Booking Received</span>
        <h2>Thank you. Your request has been received.</h2>
        <p>Booking ID: <strong>${booking.id}</strong><br>Reference: ${booking.username}<br>Service: ${serviceName(booking.service)}<br>Work title: ${booking.title}<br>Expected completion: ${fmtDate(booking.expectedDate)}<br>Status: Pending Review</p>
        <div class="notice"><strong>Temporary Account</strong><br>Username: ${booking.username}<br>Password: the password you created<br>Expires: ${fmtDate(booking.accountExpiresAt)}</div>
        <div class="row-actions">
          <a class="gold-btn" href="#account">Open My Account</a>
          <a class="ghost-btn" target="_blank" rel="noreferrer" href="${whatsappUrl("Hello WILS Research, I have submitted a booking request and would like to follow up.")}">WhatsApp WILS Research</a>
        </div>
      </div>
    </section>
  `;
}

function clientLogin(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const booking = state.bookings.find((b) => b.username.toLowerCase() === data.username.toLowerCase() && b.accessCode === data.accessCode);
  if (!booking) return alert("Login not found. Check username and access code.");
  currentClientId = booking.id;
  sessionStorage.setItem("wilsClientId", booking.id);
  location.hash = "#account";
}

function adminLogin(event) {
  event.preventDefault();
  const pin = new FormData(event.currentTarget).get("pin");
  if (pin !== "WILS-2026") return alert("Wrong admin PIN.");
  adminLoggedIn = true;
  sessionStorage.setItem("wilsAdmin", "true");
  location.hash = "#admin";
}

function submitPayment(event) {
  event.preventDefault();
  const booking = getClient();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const receipt = event.currentTarget.elements.receipt.files[0];
  booking.payments.push({
    id: `PAY-${Date.now()}`,
    amount: Number(data.amount),
    method: data.method,
    senderType: data.senderType,
    senderName: data.senderName,
    senderPhone: data.senderPhone,
    accountName: data.accountName,
    reference: data.reference,
    receiptName: receipt ? receipt.name : "",
    date: todayISO(0),
    status: "Submitted"
  });
  booking.activity.push("Payment submitted");
  saveState();
  alert("Payment information submitted. WILS admin must confirm it before your balance changes.");
  render();
}

function submitFeedback(event) {
  event.preventDefault();
  const booking = getClient();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  booking.feedback = { stars: data.stars, comment: data.comment, at: new Date().toISOString() };
  booking.activity.push(`Client rating saved: ${data.stars}`);
  saveState();
  alert("Thank you. Your rating has been saved.");
  render();
}

function handleDownload(event) {
  const booking = getClient();
  const doc = booking.documents.find((item) => item.id === event.currentTarget.dataset.download);
  const t = totals(booking);
  if (doc.final && !t.unlocked) return alert("Final work is locked until the work is completed and full payment is confirmed.");
  const blob = new Blob([`WILS Research protected document placeholder\nDocument: ${doc.name}\nBooking: ${booking.id}`], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = doc.name.replace(/\.[^.]+$/, "") + ".txt";
  a.click();
  URL.revokeObjectURL(a.href);
  booking.activity.push(`Document downloaded: ${doc.name}`);
  saveState();
}

function startCountdown() {
  const booking = getClient();
  const target = document.getElementById("countdown");
  if (!booking || !target) return;
  function tick() {
    if (booking.status === "Completed") {
      target.innerHTML = `<div class="time-box"><strong>COMPLETED</strong><span>Work status</span></div>`;
      return;
    }
    const ms = new Date(booking.deadline + "T23:59:59") - new Date();
    if (ms < 0) {
      target.innerHTML = `<div class="time-box"><strong>OVERDUE</strong><span>Deadline</span></div>`;
      return;
    }
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    target.innerHTML = [["Days", days], ["Hours", hours], ["Minutes", mins], ["Seconds", secs]].map(([label, value]) => `<div class="time-box"><strong>${String(value).padStart(2, "0")}</strong><span>${label}</span></div>`).join("");
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function adminTableClick(event) {
  const receive = event.target.dataset.receivePayment;
  if (receive) {
    const [bookingId, paymentId] = receive.split(":");
    const booking = state.bookings.find((b) => b.id === bookingId);
    const payment = booking?.payments.find((p) => p.id === paymentId);
    if (booking && payment && confirm(`Confirm receipt of ${money(payment.amount)} from ${payment.senderName || "client"}?`)) {
      payment.status = "Received";
      payment.receivedAt = new Date().toISOString();
      booking.activity.push(`Payment received: ${money(payment.amount)} via ${payment.method}`);
      if (totals(booking).remaining === 0 && booking.status === "Completed") booking.status = "Paid";
      saveState();
      renderAdminTable();
      document.getElementById("adminDetail").innerHTML = adminDetail(booking);
    }
    return;
  }
  const row = event.target.closest("[data-admin-booking]");
  if (row && !event.target.dataset.done) {
    const booking = state.bookings.find((b) => b.id === row.dataset.adminBooking);
    document.getElementById("adminDetail").innerHTML = adminDetail(booking);
  }
  const doneId = event.target.dataset.done;
  if (doneId) {
    const booking = state.bookings.find((b) => b.id === doneId);
    if (confirm("Mark this work as completed? Final document remains locked until full payment is confirmed.")) {
      booking.status = "Completed";
      booking.completedAt = new Date().toISOString();
      booking.messages.push({ from: "WILS Research", text: "Your work has been completed. Please complete any remaining payment to receive your final document.", at: new Date().toISOString() });
      booking.activity.push("Work completed");
      saveState();
      renderAdminTable();
    }
  }
}

function adminSubmit(event) {
  const form = event.target.closest(".adminUpdate");
  if (!form) return;
  event.preventDefault();
  const booking = state.bookings.find((b) => b.id === form.dataset.update);
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.agreedAmount) booking.agreedAmount = Number(data.agreedAmount);
  if (data.deadline) booking.deadline = data.deadline;
  if (data.status) booking.status = data.status;
  if (data.status === "In Progress" && !booking.startedAt) booking.startedAt = new Date().toISOString();
  const upload = form.elements.documentFile.files[0];
  if (upload) booking.documents.push({ id: `DOC-${Date.now()}`, name: upload.name, type: data.documentType, final: data.documentType === "Final Work" });
  if (data.adminNote) booking.messages.push({ from: "WILS Research", text: data.adminNote, at: new Date().toISOString() });
  if (totals(booking).remaining === 0 && booking.status === "Completed") booking.status = "Paid";
  booking.activity.push("Admin updated work");
  saveState();
  renderAdminTable();
  document.getElementById("adminDetail").innerHTML = adminDetail(booking);
}

function seedBooking() {
  const n = state.bookings.length + 1;
  state.bookings.unshift({
    id: `WR-DEMO-${Date.now()}`,
    createdAt: new Date().toISOString(),
    name: `Client ${n}`,
    phone: "0786609975",
    email: `client${n}@example.com`,
    university: "Demo Institution",
    registration: `REG-${n}`,
    course: "Research Methods",
    service: "research-proposals",
    title: `Demo Research Project ${n}`,
    design: "Mixed methods",
    description: "Demo admin booking.",
    expectedDate: todayISO(10),
    notes: "",
    files: [],
    username: `Client${n}2026`,
    accessCode: `WR-${Math.floor(10000 + Math.random() * 89999)}`,
    accountExpiresAt: todayISO(30),
    status: "Pending Review",
    receivedAt: new Date().toISOString(),
    startedAt: "",
    deadline: todayISO(10),
    completedAt: "",
    deliveredAt: "",
    agreedAmount: 0,
    payments: [],
    documents: [],
    messages: [],
    activity: ["Demo booking created"]
  });
  saveState();
  renderAdminTable();
}

window.addEventListener("hashchange", render);
render();
