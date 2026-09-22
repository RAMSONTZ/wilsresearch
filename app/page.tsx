"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CircleDot,
  LockKeyhole,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

const WHATSAPP = "255786609975";
const CONTACT = {
  phone: "0786609975",
  intl: "+255 786 609 975",
  email: "wilsresearch7@gmail.com",
};
const statuses = [
  "Pending Review",
  "Received",
  "In Progress",
  "Correction",
  "Completed",
  "Awaiting Payment",
  "Paid",
  "Delivered",
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
  "Cash",
];
const services = [
  [
    "assignments",
    "Assignments",
    "Academic assignments, reports and structured academic documents.",
    ["Academic reports", "Structured writing", "Formatting", "References"],
  ],
  [
    "research-proposals",
    "Research Proposals & Reports",
    "Proposal development, research reports, methodology and academic documentation.",
    [
      "Proposal writing",
      "Methodology support",
      "Literature review",
      "Complete reports",
    ],
  ],
  [
    "data-analysis",
    "Data Collection & Analysis",
    "Data cleaning, coding, analysis, interpretation and presentation.",
    [
      "Data cleaning",
      "SPSS, STATA, Excel",
      "Tables and charts",
      "Interpretation",
    ],
  ],
  [
    "business-plans",
    "Business Plans",
    "Professional business plans, market research and financial planning.",
    [
      "Market research",
      "Feasibility studies",
      "Financial projections",
      "Business pitch decks",
    ],
  ],
  [
    "presentations",
    "Presentations",
    "Academic presentations, research findings and professional PowerPoint decks.",
    ["PowerPoint decks", "Defense slides", "Findings summary", "Visual polish"],
  ],
  [
    "cv-revamping",
    "CV Revamping",
    "Professional CV restructuring and presentation.",
    ["CV writing", "Cover letters", "LinkedIn profile support", "Academic CVs"],
  ],
  [
    "spss-stata-excel",
    "SPSS / STATA / Excel",
    "Statistical analysis, data cleaning, tables, charts and reporting.",
    ["Descriptive statistics", "Regression", "Cross-tabs", "Charts"],
  ],
  [
    "consultation",
    "Research Consultation",
    "Research design, topic development, methodology and general research guidance.",
    ["Topic selection", "Study design", "Analysis plan", "General guidance"],
  ],
] as const;

type Payment = {
  id: string;
  amount: number;
  method: string;
  senderName: string;
  reference: string;
  status: string;
  receiptName?: string;
};
type Document = {
  id: string;
  name: string;
  type: string;
  final: boolean;
  storagePath?: string;
};
type Booking = {
  id: string;
  username: string;
  accessCode: string;
  name: string;
  phone: string;
  email: string;
  university: string;
  service: string;
  title: string;
  description: string;
  expectedDate: string;
  deadline: string;
  status: string;
  agreedAmount: number;
  accountExpiresAt: string;
  payments: Payment[];
  documents: Document[];
  messages: string[];
  activity: string[];
  feedback?: string;
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const serviceName = (id: string) =>
  services.find(([key]) => key === id)?.[1] ?? id;
const money = (value: number) =>
  `TSh ${Number(value || 0).toLocaleString("en-US")}`;
const wa = (message: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
const seedBooking: Booking = {
  id: "WR-20260921-001",
  username: "Aisha2026",
  accessCode: "WR-48291",
  name: "Aisha M.",
  phone: CONTACT.phone,
  email: "aisha@example.com",
  university: "KCMUCo",
  service: "data-analysis",
  title: "Data Analysis for Hypertension Study",
  description:
    "Clean dataset, analyze hypertension variables and prepare tables.",
  expectedDate: daysFromNow(7),
  deadline: daysFromNow(7),
  status: "In Progress",
  agreedAmount: 150000,
  accountExpiresAt: daysFromNow(30),
  payments: [
    {
      id: "PAY-001",
      amount: 50000,
      method: "M-Pesa",
      senderName: "Aisha M.",
      reference: "DEMO-50000",
      status: "Received",
      receiptName: "mpesa-receipt.jpg",
    },
  ],
  documents: [
    {
      id: "DOC-001",
      name: "Research Proposal Guidelines.pdf",
      type: "Working Documents",
      final: false,
    },
    {
      id: "DOC-002",
      name: "Final Analysis Report.docx",
      type: "Final Work",
      final: true,
    },
  ],
  messages: ["Your work is in progress. We will update you here."],
  activity: ["Booking created", "Work started", "Initial payment confirmed"],
};

function totals(booking: Booking) {
  const paid = booking.payments
    .filter(
      (payment) =>
        payment.status === "Received" || payment.status === "Confirmed",
    )
    .reduce((sum, payment) => sum + payment.amount, 0);
  const submitted = booking.payments
    .filter((payment) => payment.status === "Submitted")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, booking.agreedAmount - paid);
  return {
    paid,
    submitted,
    remaining,
    percent: booking.agreedAmount
      ? Math.min(100, Math.round((paid / booking.agreedAmount) * 100))
      : 0,
    unlocked: booking.status === "Completed" && remaining === 0,
  };
}

const supabase = createSupabaseBrowserClient();

type SupabasePayment = { id: string; amount: number; method: string; sender_name?: string; reference?: string; status: string; receipt_path?: string };
type SupabaseDocument = { id: string; name: string; document_type: string; is_final: boolean; storage_path?: string };
type SupabaseBookingRow = { id: string; email?: string; phone?: string; university?: string; title: string; description?: string; expected_date?: string; deadline?: string; status: string; agreed_amount?: number; profiles?: { username?: string; phone?: string; account_expires_at?: string }; services?: { slug?: string }; payments?: SupabasePayment[]; documents?: SupabaseDocument[]; booking_messages?: { message: string }[]; booking_activity?: { description: string }[] };

function mapBooking(row: SupabaseBookingRow): Booking {
  return {
    id: row.id,
    username: row.profiles?.username || row.email || "Client",
    accessCode: "",
    name: row.profiles?.username || "Client",
    phone: row.phone || row.profiles?.phone || "",
    email: row.email || "",
    university: row.university || "",
    service: row.services?.slug || "",
    title: row.title,
    description: row.description || "",
    expectedDate: row.expected_date || "",
    deadline: row.deadline || "",
    status: row.status,
    agreedAmount: Number(row.agreed_amount || 0),
    accountExpiresAt: row.profiles?.account_expires_at || "",
    payments: (row.payments || []).map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      method: payment.method,
      senderName: payment.sender_name || "",
      reference: payment.reference || "",
      status: payment.status,
      receiptName: payment.receipt_path || "",
    })),
    documents: (row.documents || []).map((document) => ({
      id: document.id,
      name: document.name,
      type: document.document_type,
      final: document.is_final,
      storagePath: document.storage_path,
    })),
    messages: (row.booking_messages || []).map((message) => message.message),
    activity: (row.booking_activity || []).map((activity) => activity.description),
  };
}

export default function Home() {
  const [route, setRoute] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([seedBooking]);
  const [clientId, setClientId] = useState("");
  const [admin, setAdmin] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState(seedBooking.id);

  useEffect(() => {
    const sync = () =>
      setRoute(
        (window.location.hash || "#home").slice(1).split("?")[0] || "home",
      );
    sync();
    window.addEventListener("hashchange", sync);
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const isAdmin = profile?.role === "admin";
      setAdmin(isAdmin);
      let query = supabase
        .from("bookings")
        .select(
          "*, profiles(username, phone, account_expires_at), services(slug), payments(*), documents(*), booking_messages(*), booking_activity(*)",
        );
      if (!isAdmin) query = query.eq("client_id", user.id);
      const { data } = await query;
      if (data) {
        const mapped = data.map(mapBooking);
        setBookings(mapped);
        if (!isAdmin) setClientId(mapped[0]?.id || "");
      }
    };
    void load();
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const client = bookings.find((booking) => booking.id === clientId);
  const selected =
    bookings.find((booking) => booking.id === selectedId) || bookings[0];
  const save = (next: Booking[]) => setBookings(next);
  const go = (target: string) => {
    window.location.hash = target;
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string>;
    if (!data.email) return notify("Email is required for a secure account.");
    let {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const { data: auth, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.accessCode,
        options: { data: { username: data.username, phone: data.phone } },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("rate limit")) {
          return notify(
            "Supabase email rate limit reached. Wait a few minutes, then try again, or log in if this email already has an account.",
          );
        }
        return notify(signUpError.message);
      }

      session = auth.session;
      if (!session) {
        return notify(
          "Check your email to confirm your account, then log in before submitting a booking.",
        );
      }
    }

    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("slug", data.service)
      .single();
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        client_id: session.user.id,
        service_id: service?.id,
        phone: data.phone,
        email: data.email,
        university: data.university,
        registration: data.registration,
        course: data.course,
        title: data.title,
        design: data.design,
        description: data.description,
        notes: data.notes,
        expected_date: data.expectedDate,
        deadline: data.expectedDate,
      })
      .select("id")
      .single();
    if (error || !booking)
      return notify(
        error?.code === "42501"
          ? "Your session expired. Log in again before submitting a booking."
          : error?.message || "Could not submit booking.",
      );
    setClientId(booking.id);
    notify(`Booking ${booking.id} received`);
    go("confirmation");
  }
  async function clientLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string>;
    const { error } = await supabase.auth.signInWithPassword({
      email: data.username,
      password: data.accessCode,
    });
    if (error) return notify(error.message);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: rows } = await supabase
      .from("bookings")
      .select(
        "*, profiles(username, phone, account_expires_at), services(slug), payments(*), documents(*), booking_messages(*), booking_activity(*)",
      )
      .eq("client_id", user?.id);
    const mapped = (rows || []).map(mapBooking);
    setBookings(mapped);
    setClientId(mapped[0]?.id || "");
    go("account");
  }
  async function adminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string>;
    const { error } = await supabase.auth.signInWithPassword({
      email: data.username,
      password: data.pin,
    });
    if (error) return notify(error.message);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      return notify("This account is not an admin account.");
    }
    const { data: rows } = await supabase
      .from("bookings")
      .select(
        "*, profiles(username, phone, account_expires_at), services(slug), payments(*), documents(*), booking_messages(*), booking_activity(*)",
      );
    setAdmin(true);
    setBookings((rows || []).map(mapBooking));
    go("admin");
  }
  async function updateBooking(changes: Partial<Booking>) {
    if (!selected) return;
    const dbChanges: Record<string, unknown> = {};
    if (changes.agreedAmount !== undefined)
      dbChanges.agreed_amount = changes.agreedAmount;
    if (changes.status !== undefined) dbChanges.status = changes.status;
    if (changes.deadline !== undefined) dbChanges.deadline = changes.deadline;
    const { error } = await supabase
      .from("bookings")
      .update(dbChanges)
      .eq("id", selected.id);
    if (error) return notify(error.message);
    save(
      bookings.map((booking) =>
        booking.id === selected.id ? { ...booking, ...changes } : booking,
      ),
    );
  }
  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, string>;
    const receipt = (
      event.currentTarget.elements.namedItem("receipt") as HTMLInputElement
    )?.files?.[0];
    const { error } = await supabase
      .from("payments")
      .insert({
        booking_id: client.id,
        amount: Number(data.amount),
        method: data.method,
        sender_name: data.senderName,
        reference: data.reference,
        status: "Submitted",
        receipt_path: receipt?.name || null,
      });
    if (error) return notify(error.message);
    notify("Payment submitted for admin confirmation.");
  }
  async function downloadDocument(document: Document, booking: Booking) {
    const total = totals(booking);
    if (document.final && !total.unlocked)
      return notify("Final work unlocks after full payment and completion.");
    if (!document.storagePath)
      return notify("This document is not available for download yet.");
    const { data, error } = await supabase.storage
      .from("deliverables")
      .createSignedUrl(document.storagePath, 60);
    if (error || !data?.signedUrl)
      return notify(error?.message || "Could not create a download link.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="product-shell">
      <header className="product-nav">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <CircleDot size={15} />
          </span>
          <span>
            <strong>WILS Research</strong>
            <small>Where Your Numbers Make Sense.</small>
          </span>
        </a>
        <nav className={menuOpen ? "open" : ""}>
          {[
            ["home", "Home"],
            ["services", "Services"],
            ["how", "How It Works"],
            ["work", "Our Work"],
            ["contact", "Contact"],
          ].map(([key, label]) => (
            <a key={key} href={`#${key}`} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a
            className="nav-whatsapp"
            href={wa(
              "Hello WILS Research, I would like to ask about your services.",
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          <a
            className="button gold"
            href="#book"
            onClick={() => setMenuOpen(false)}
          >
            Book Now
          </a>
        </nav>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>
      {notice && <div className="toast">{notice}</div>}
      {route === "home" || route === "how" || route === "work" ? (
        <HomeView go={go} />
      ) : route === "services" ? (
        <ServicesView go={go} />
      ) : route === "book" ? (
        <BookingView onSubmit={submitBooking} />
      ) : route === "contact" ? (
        <ContactView go={go} />
      ) : route === "login" ? (
        <LoginView
          onClientLogin={clientLogin}
          onAdminLogin={adminLogin}
          go={go}
        />
      ) : route === "confirmation" ? (
        <ConfirmationView client={client} go={go} />
      ) : route === "account" ? (
        <AccountView
          client={client}
          go={go}
          onPayment={submitPayment}
          onDownload={downloadDocument}
          onFeedback={(feedback) =>
            client &&
            updateBooking({
              feedback,
              activity: [...client.activity, "Client rating saved"],
            })
          }
          onLogout={() => {
            void supabase.auth.signOut();
            setClientId("");
            go("login");
          }}
        />
      ) : route === "admin" ? (
        <AdminView
          admin={admin}
          bookings={bookings}
          selected={selected}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          updateBooking={updateBooking}
          save={save}
          go={go}
          onLogout={() => {
            void supabase.auth.signOut();
            setAdmin(false);
            go("login");
          }}
        />
      ) : (
        <HomeView go={go} />
      )}
      <a
        className="floating-whatsapp"
        href={wa("Hello WILS Research, I would like to discuss my project.")}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with WILS Research on WhatsApp"
      >
        <MessageCircle size={24} />
      </a>
      <footer className="product-footer">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <CircleDot size={15} />
          </span>
          <span>
            <strong>WILS Research</strong>
            <small>Where Your Numbers Make Sense.</small>
          </span>
        </a>
        <div>
          <strong>Contact</strong>
          <span>{CONTACT.phone}</span>
          <span>{CONTACT.intl}</span>
          <span>{CONTACT.email}</span>
        </div>
        <span>© 2026 WILS Research. All rights reserved.</span>
      </footer>
    </main>
  );
}

function HomeView({ go }: { go: (target: string) => void }) {
  return (
    <>
      <section className="product-hero">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-a-woman-working-on-a-laptop-1572/1080p.mp4"
            type="video/mp4"
          />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="eyebrow">Classic research support</span>
          <h1>
            Where your
            <br />
            <em>numbers</em> make sense.
          </h1>
          <p>
            Professional academic, medical and business research support, from
            research proposals and data analysis to polished reports and
            professional documents.
          </p>
          <div className="hero-actions">
            <a className="button gold" href="#book">
              Book a Service <ArrowUpRight size={16} />
            </a>
            <a
              className="button outline"
              href={wa("Hello WILS Research, I would like to book a service.")}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
          </div>
          <div className="trust-strip">
            <span>Quality</span>
            <span>Confidential</span>
            <span>On Time</span>
            <span>Professional</span>
          </div>
        </div>
        <div className="hero-note">
          Quality research
          <br />
          builds better tomorrows.
        </div>
      </section>
      <section className="section" id="services-preview">
        <SectionHeading
          label="Our Services"
          title="Research support designed around your project."
        />
        <div className="service-grid">
          {services.slice(0, 4).map((service) => (
            <ServiceCard key={service[0]} service={service} go={go} />
          ))}
        </div>
        <a className="arrow-link" href="#services">
          See all services <ArrowUpRight size={16} />
        </a>
      </section>
      <section className="section tinted" id="how">
        <SectionHeading
          label="How It Works"
          title="A clear process from request to delivery."
        />
        <div className="steps">
          {[
            ["Book", "Tell us what you need."],
            ["Confirm", "WILS reviews and confirms price."],
            ["Pay Initial Amount", "Secure your booking."],
            ["Work", "Your project is tracked and updated."],
            ["Complete & Receive", "Final work unlocks after full payment."],
          ].map(([title, text], index) => (
            <div className="step" key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHeading
          label="Our Work"
          title="Focused categories, not fake client claims."
        />
        <div className="work-grid">
          {[
            "Research Analysis",
            "Medical Research",
            "Academic Writing",
            "Business Research",
            "Data Visualization",
            "Professional Documents",
          ].map((item) => (
            <div className="work-card" key={item}>
              <span className="work-icon">WR</span>
              <h3>{item}</h3>
              <p>Structured support for real WILS Research client projects.</p>
            </div>
          ))}
        </div>
      </section>
      <ContactBand go={go} />
    </>
  );
}
function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{label}</span>
      <h2>{title}</h2>
    </div>
  );
}
function ServiceCard({
  service,
  go,
}: {
  service: (typeof services)[number];
  go: (target: string) => void;
}) {
  return (
    <article className="service-card">
      <span className="work-icon">WR</span>
      <h3>{service[1]}</h3>
      <p>{service[2]}</p>
      <ul>
        {service[3].slice(0, 3).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button
        className="button gold small"
        onClick={() => go(`book?service=${service[0]}`)}
      >
        Book This Service <ArrowUpRight size={14} />
      </button>
    </article>
  );
}
function ServicesView({ go }: { go: (target: string) => void }) {
  return (
    <PageIntro
      label="Services"
      title="Professional support for academic, medical and business research."
      text="Choose the support that fits your project. Every request is reviewed before a price and deadline are confirmed."
    >
      <div className="service-grid full">
        {services.map((service) => (
          <ServiceCard key={service[0]} service={service} go={go} />
        ))}
      </div>
      <ContactBand go={go} />
    </PageIntro>
  );
}
function BookingView({
  onSubmit,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <PageIntro
      label="Book a Service"
      title="Tell us what you need and WILS will review your request."
      text="Your booking creates a temporary private account for tracking work, payment and documents."
    >
      <form className="panel form-grid" onSubmit={onSubmit}>
        <Field label="Reference Username" name="username" required />
        <Field
          label="Temporary Password"
          name="accessCode"
          type="password"
          required
        />
        <Field label="Phone / WhatsApp" name="phone" type="tel" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="University / Institution" name="university" />
        <Field label="Registration Number" name="registration" />
        <Field label="Course / Programme" name="course" />
        <label>
          Service
          <select name="service" defaultValue="data-analysis">
            {services.map(([id, name]) => (
              <option value={id} key={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Expected Completion Date"
          name="expectedDate"
          type="date"
          required
        />
        <Field label="Work Title" name="title" required full />
        <Field label="Study Design" name="design" full />
        <Field
          label="Objectives / Brief Description"
          name="description"
          required
          full
          textarea
        />
        <Field label="Additional Notes" name="notes" full textarea />
        <Field label="Upload Files" name="files" type="file" full multiple />
        <div className="notice full">
          <ShieldCheck size={17} /> Privacy promise: use a reference username
          instead of your full legal name. Your temporary account expires after
          the project window.
        </div>
        <button className="button gold" type="submit">
          Submit Booking <ArrowUpRight size={16} />
        </button>
      </form>
    </PageIntro>
  );
}
function Field({
  label,
  name,
  type = "text",
  required = false,
  full = false,
  textarea = false,
  multiple = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  full?: boolean;
  textarea?: boolean;
  multiple?: boolean;
}) {
  return (
    <label className={full ? "field full" : "field"}>
      {label}
      {textarea ? (
        <textarea name={name} required={required} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          multiple={multiple}
        />
      )}
    </label>
  );
}
function PageIntro({
  label,
  title,
  text,
  children,
}: {
  label: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-section">
      <SectionHeading label={label} title={title} />
      <p className="lead">{text}</p>
      {children}
    </section>
  );
}
function ContactBand({ go }: { go: (target: string) => void }) {
  return (
    <section className="contact-band">
      <div>
        <span className="eyebrow">Ready</span>
        <h2>Let&apos;s work on your project.</h2>
        <p>Contact WILS Research directly or submit a booking request.</p>
      </div>
      <div className="hero-actions">
        <a
          className="button gold"
          href={wa("Hello WILS Research, I would like to start a project.")}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp Us
        </a>
        <button className="button outline" onClick={() => go("book")}>
          Book a Service
        </button>
      </div>
    </section>
  );
}
function ContactView({ go }: { go: (target: string) => void }) {
  return (
    <PageIntro
      label="Contact"
      title="Let's work on your project."
      text="Have a research, academic, medical or business project? Contact WILS Research and tell us what you need."
    >
      <div className="contact-details">
        <div>
          <strong>{CONTACT.phone}</strong>
          <span>{CONTACT.intl}</span>
          <span>{CONTACT.email}</span>
        </div>
        <div className="hero-actions">
          <a
            className="button gold"
            href={wa(
              "Hello WILS Research, I would like to discuss my project.",
            )}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp Us
          </a>
          <button className="button outline dark" onClick={() => go("book")}>
            Book a Service
          </button>
        </div>
      </div>
    </PageIntro>
  );
}
function LoginView({
  onClientLogin,
  onAdminLogin,
  go,
}: {
  onClientLogin: (event: FormEvent<HTMLFormElement>) => void;
  onAdminLogin: (event: FormEvent<HTMLFormElement>) => void;
  go: (target: string) => void;
}) {
  return (
    <PageIntro
      label="Private access"
      title="Your work, clearly tracked."
      text="Use the temporary account created during booking, or open the private owner dashboard."
    >
      <div className="auth-grid">
        <form className="panel" onSubmit={onClientLogin}>
          <LockKeyhole size={22} />
          <h3>Client Login</h3>
          <p>Use the email and password created during booking.</p>
          <Field label="Email" name="username" type="email" required />
          <Field label="Password" name="accessCode" type="password" required />
          <button className="button gold" type="submit">
            Login
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => go("book")}
          >
            Book first <ArrowUpRight size={14} />
          </button>
        </form>
        <form className="panel" onSubmit={onAdminLogin}>
          <ShieldCheck size={22} />
          <h3>Owner Area</h3>
          <p>Private admin access for bookings, payments and delivery.</p>
          <Field label="Admin Email" name="username" type="email" required />
          <Field label="Admin Password" name="pin" type="password" required />
          <button className="button gold" type="submit">
            Open Admin
          </button>
        </form>
      </div>
    </PageIntro>
  );
}
function ConfirmationView({
  client,
  go,
}: {
  client?: Booking;
  go: (target: string) => void;
}) {
  return (
    <PageIntro
      label="Booking Received"
      title="Thank you. Your request is in review."
      text="Your temporary account is ready for tracking updates."
    >
      <div className="panel confirmation">
        <p>
          Booking ID: <strong>{client?.id}</strong>
          <br />
          Reference: <strong>{client?.username}</strong>
          <br />
          Service: {client && serviceName(client.service)}
          <br />
          Status: Pending Review
        </p>
        <div className="notice">
          <strong>Temporary Account</strong>
          <br />
          Username: {client?.username}
          <br />
          Password: the password you created
          <br />
          Expires: {client?.accountExpiresAt}
        </div>
        <div className="hero-actions">
          <button className="button gold" onClick={() => go("account")}>
            Open My Account
          </button>
          <a
            className="button outline dark"
            href={wa(
              "Hello WILS Research, I have submitted a booking request and would like to follow up.",
            )}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp WILS
          </a>
        </div>
      </div>
    </PageIntro>
  );
}
function AccountView({
  client,
  go,
  onPayment,
  onDownload,
  onFeedback,
  onLogout,
}: {
  client?: Booking;
  go: (target: string) => void;
  onPayment: (event: FormEvent<HTMLFormElement>) => void;
  onDownload: (document: Document, booking: Booking) => void;
  onFeedback: (feedback: string) => void;
  onLogout: () => void;
}) {
  if (!client)
    return (
      <PageIntro
        label="Client Account"
        title="Please log in first."
        text="Your private account opens after booking or login."
      >
        <button className="button gold" onClick={() => go("login")}>
          Go to Login
        </button>
      </PageIntro>
    );
  const total = totals(client);
  return (
    <section className="portal-section">
      <aside className="portal-sidebar">
        <strong>{client.username}</strong>
        <span>Temporary account</span>
        <span>Expires {client.accountExpiresAt}</span>
        <button
          onClick={() => document.getElementById("payment")?.scrollIntoView()}
        >
          Payment
        </button>
        <button
          onClick={() => document.getElementById("documents")?.scrollIntoView()}
        >
          Documents
        </button>
        <button
          onClick={() => document.getElementById("feedback")?.scrollIntoView()}
        >
          Feedback
        </button>
        <a
          href={wa(
            `Hello WILS Research, I want to ask about booking ${client.id}.`,
          )}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp WILS
        </a>
        <button onClick={onLogout}>Logout</button>
      </aside>
      <div className="portal-main">
        <span className="eyebrow">Temporary Account</span>
        <h1>Hello, {client.name.split(" ")[0]}.</h1>
        <p className="lead">
          Your project is tracked privately here. Account expires{" "}
          {client.accountExpiresAt}.
        </p>
        <div className="metric-grid">
          <Metric label="Work Status" value={client.status} />
          <Metric label="Paid" value={money(total.paid)} />
          <Metric label="Remaining" value={money(total.remaining)} />
          <Metric label="Deadline" value={client.deadline} />
        </div>
        <div className="account-grid">
          <div className="panel">
            <h3>Current Work</h3>
            <p>
              <strong>{client.title}</strong>
            </p>
            <p>
              Booking ID: {client.id}
              <br />
              Service: {serviceName(client.service)}
              <br />
              Expected completion: {client.expectedDate}
            </p>
            <span className="status">{client.status}</span>
          </div>
          <div className="panel">
            <h3>Payment Summary</h3>
            <p>
              Agreed: <strong>{money(client.agreedAmount)}</strong>
              <br />
              Received: <strong>{money(total.paid)}</strong>
              <br />
              Submitted: {money(total.submitted)}
              <br />
              Remaining: {money(total.remaining)}
            </p>
            <div className="progress">
              <span style={{ width: `${total.percent}%` }} />
            </div>
            <small>{total.percent}% paid</small>
          </div>
        </div>
        <div className="panel" id="payment">
          <h3>Send Payment Receipt</h3>
          <p>Payment changes only after admin confirmation.</p>
          <form className="form-grid" onSubmit={onPayment}>
            <Field label="Amount" name="amount" type="number" required />
            <label>
              Payment Method
              <select name="method">
                {paymentMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>
            <Field label="Sender Name" name="senderName" required />
            <Field label="Transaction Reference" name="reference" required />
            <Field label="Receipt / Screenshot" name="receipt" type="file" />
            <button className="button gold" type="submit">
              Submit Payment Info
            </button>
          </form>
        </div>
        <div className="account-grid">
          <div className="panel" id="documents">
            <h3>Documents</h3>
            {client.documents.map((document) => (
              <div className="doc-row" key={document.id}>
                <span>
                  <small>{document.type}</small>
                  <br />
                  <strong>{document.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onDownload(document, client)}
                  className={
                    document.final && !total.unlocked ? "locked" : "status"
                  }
                >
                  {document.final && !total.unlocked ? "Locked" : "Download"}
                </button>
              </div>
            ))}
          </div>
          <div className="panel">
            <h3>Payment History</h3>
            {client.payments.map((payment) => (
              <div className="doc-row" key={payment.id}>
                <span>
                  {money(payment.amount)}
                  <br />
                  <small>
                    {payment.method} / {payment.reference}
                  </small>
                </span>
                <span className="status">{payment.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="account-grid">
          <div className="panel">
            <h3>Previous WILS Work</h3>
            <p>
              Research analysis, medical research, academic writing, business
              research, data visualization and professional documents.
            </p>
          </div>
          <div className="panel" id="feedback">
            <h3>Rate Your Experience</h3>
            <textarea id="feedbackText" placeholder="Your feedback" />
            <button
              className="button gold"
              onClick={() =>
                onFeedback(
                  (
                    document.getElementById(
                      "feedbackText",
                    ) as HTMLTextAreaElement
                  ).value,
                )
              }
            >
              Save Rating
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function AdminView({
  admin,
  bookings,
  selected,
  selectedId,
  setSelectedId,
  updateBooking,
  save,
  go,
  onLogout,
}: {
  admin: boolean;
  bookings: Booking[];
  selected?: Booking;
  selectedId: string;
  setSelectedId: (id: string) => void;
  updateBooking: (changes: Partial<Booking>) => void;
  save: (next: Booking[]) => void;
  go: (target: string) => void;
  onLogout: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const rows = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          `${booking.username} ${booking.phone} ${booking.email} ${booking.title} ${booking.id}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (filter === "All" || booking.status === filter),
      ),
    [bookings, search, filter],
  );
  if (!admin)
    return (
      <PageIntro
        label="Owner Area"
        title="Admin login required."
        text="Open the private owner dashboard from the login page."
      >
        <button className="button gold" onClick={() => go("login")}>
          Go to Login
        </button>
      </PageIntro>
    );
  const totalOutstanding = bookings.reduce(
    (sum, booking) => sum + totals(booking).remaining,
    0,
  );
  return (
    <section className="page-section admin-page">
      <SectionHeading
        label="Owner Dashboard"
        title="Bookings, deadlines, payments and completion."
      />
      <div className="metric-grid">
        <Metric
          label="New Bookings"
          value={String(
            bookings.filter((booking) => booking.status === "Pending Review")
              .length,
          )}
        />
        <Metric
          label="Active Work"
          value={String(
            bookings.filter((booking) => booking.status === "In Progress")
              .length,
          )}
        />
        <Metric
          label="Completed"
          value={String(
            bookings.filter((booking) => booking.status === "Completed").length,
          )}
        />
        <Metric label="Outstanding" value={money(totalOutstanding)} />
      </div>
      <div className="admin-toolbar">
        <div className="search-input">
          <Search size={16} />
          <input
            placeholder="Search customer, title, booking ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option>All</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <button className="button outline dark" onClick={onLogout}>
          Logout
        </button>
      </div>
      <div className="admin-layout">
        <div className="admin-list">
          {rows.map((booking) => (
            <button
              className={
                booking.id === selectedId ? "admin-row selected" : "admin-row"
              }
              key={booking.id}
              onClick={() => setSelectedId(booking.id)}
            >
              <span>
                <strong>{booking.username}</strong>
                <small>{booking.id}</small>
              </span>
              <span>{serviceName(booking.service)}</span>
              <span>{booking.status}</span>
              <span>{money(totals(booking).remaining)}</span>
            </button>
          ))}
        </div>
        {selected && (
          <AdminDetail
            booking={selected}
            updateBooking={updateBooking}
            save={save}
            bookings={bookings}
          />
        )}
      </div>
    </section>
  );
}
function AdminDetail({
  booking,
  updateBooking,
  save,
  bookings,
}: {
  booking: Booking;
  updateBooking: (changes: Partial<Booking>) => void;
  save: (next: Booking[]) => void;
  bookings: Booking[];
}) {
  const [status, setStatus] = useState(booking.status);
  const [amount, setAmount] = useState(String(booking.agreedAmount));
  const [documentType, setDocumentType] = useState("Final Work");
  const [uploading, setUploading] = useState(false);
  const confirmPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("payments")
      .update({ status: "Received", received_at: new Date().toISOString() })
      .eq("id", paymentId);
    if (error) return;
    const next = bookings.map((item) =>
      item.id === booking.id
        ? {
            ...item,
            payments: item.payments.map((payment) =>
              payment.id === paymentId
                ? { ...payment, status: "Received" }
                : payment,
            ),
            activity: [...item.activity, "Payment received"],
          }
        : item,
    );
    save(next);
  };
  const uploadDocument = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = (event.currentTarget.elements.namedItem("deliverable") as HTMLInputElement)?.files?.[0];
    if (!file) return;
    setUploading(true);
    const storagePath = `${booking.id}/${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("deliverables").upload(storagePath, file, { upsert: false });
    if (upload.error) { setUploading(false); return; }
    const { data: document, error } = await supabase.from("documents").insert({ booking_id: booking.id, name: file.name, document_type: documentType, storage_path: storagePath, is_final: documentType === "Final Work" }).select("*").single();
    setUploading(false);
    if (error || !document) return;
    save(bookings.map((item) => item.id === booking.id ? { ...item, documents: [...item.documents, { id: document.id, name: document.name, type: document.document_type, final: document.is_final, storagePath: document.storage_path }] } : item));
  };
  return (
    <div className="panel admin-detail">
      <span className="eyebrow">Work Detail</span>
      <h2>{booking.username}</h2>
      <p>
        {booking.phone} · {booking.email}
        <br />
        {serviceName(booking.service)} · {booking.title}
      </p>
      <div className="form-grid">
        <label>
          Agreed Amount
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          Deadline
          <input
            type="date"
            value={booking.deadline}
            onChange={(event) =>
              updateBooking({ deadline: event.target.value })
            }
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button
          className="button gold"
          onClick={() =>
            updateBooking({ agreedAmount: Number(amount), status })
          }
        >
          Save Admin Changes
        </button>
      </div>
      <div className="notice">
        Agreed: {money(booking.agreedAmount)} · Received:{" "}
        {money(totals(booking).paid)} · Remaining:{" "}
        {money(totals(booking).remaining)}
      </div>
      <form className="form-grid" onSubmit={uploadDocument}>
        <label>
          Upload Deliverable
          <input name="deliverable" type="file" required />
        </label>
        <label>
          Document Type
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
            <option>Working Documents</option>
            <option>Draft</option>
            <option>Final Work</option>
          </select>
        </label>
        <button className="button gold" type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Work"}
        </button>
      </form>
      <h3>Payment Receipts</h3>
      {booking.payments.map((payment) => (
        <div className="doc-row" key={payment.id}>
          <span>
            {money(payment.amount)} · {payment.method}
            <br />
            <small>
              {payment.senderName} · {payment.reference}
            </small>
          </span>
          {payment.status === "Submitted" ? (
            <button
              className="button gold small"
              onClick={() => confirmPayment(payment.id)}
            >
              Mark Received
            </button>
          ) : (
            <span className="status">{payment.status}</span>
          )}
        </div>
      ))}
      <h3>Activity Log</h3>
      {booking.activity.map((item, index) => (
        <p key={`${item}-${index}`} className="activity-item">
          {item}
        </p>
      ))}
    </div>
  );
}
