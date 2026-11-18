import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, ApiError, staffSession } from "./api";
import type {
  Registration,
  RegistrationStatus,
  RegistrationSummary,
  Staff,
  Student,
  SupportRequest,
} from "./types";
import "./styles.css";

type View = "dashboard" | "registrations" | "requests";
const registrationLabels: Record<RegistrationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  contacted: "Contacted",
  support_active: "Support active",
};
const pretty = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={compact ? "logo-mark compact" : "logo-mark"}
      aria-hidden="true"
      viewBox="0 0 48 48"
    >
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <circle
        cx="18"
        cy="24"
        r="9"
        fill="none"
        stroke="#f6cf72"
        strokeWidth="4"
      />
      <circle cx="30" cy="24" r="9" fill="none" stroke="#fff" strokeWidth="4" />
    </svg>
  );
}

function App() {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [checking, setChecking] = useState(Boolean(staffSession.get()));
  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(() => {
    if (!staffSession.get()) return;
    api
      .me()
      .then(({ staff }) => setStaff(staff))
      .catch(() => staffSession.clear())
      .finally(() => setChecking(false));
  }, []);
  if (checking)
    return <main className="centre">Checking your secure session…</main>;
  return staff ? (
    <Workspace
      staff={staff}
      onLogout={() => {
        api.logout().catch(() => undefined);
        staffSession.clear();
        setStaff(null);
      }}
    />
  ) : (
    <>
      <Landing onLogin={() => setLoginOpen(true)} />
      <AuthModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSignedIn={setStaff}
      />
    </>
  );
}

function AuthModal({
  open,
  onClose,
  onSignedIn,
}: {
  open: boolean;
  onClose: () => void;
  onSignedIn: (staff: Staff) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) {
      setError("");
      setPassword("");
    }
  }, [open]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.login(email, password);
      staffSession.set(res.token);
      onSignedIn(res.staff);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  if (!open) return null;
  return (
    <div className="auth-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          aria-label="Close sign in"
          onClick={onClose}
        >
          ×
        </button>
        <div className="login-intro">
          <LogoMark />
          <div>
            <p className="eyebrow">KNUST · GIV Office</p>
            <h1 id="auth-title">Staff sign in</h1>
            <p>Ability Connect workspace</p>
          </div>
        </div>
        <p className="login-copy">
          Use your authorised GIV Office work email and password to review
          registrations, coordinate support, and respond to students.
        </p>
        <form onSubmit={submit}>
          <label>
            <span>GIV Office work email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            <span>Staff password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button disabled={busy}>
            {busy ? "Verifying…" : "Verify and enter workspace"}
          </button>
        </form>
        <p className="hint">
          This is for active GIV staff accounts only. Student portal credentials
          cannot be used here.
        </p>
      </section>
    </div>
  );
}

type Prefs = {
  textScale: "0" | "1" | "2" | "3";
  colorScheme: "system" | "light" | "dark";
  contrast: "normal" | "high";
  font: "default" | "readable";
  spacing: "normal" | "wide";
  links: "default" | "underline";
  motion: "normal" | "reduce";
};
const storageKey = "ac.a11y";
const allowedPrefs: { [K in keyof Prefs]: readonly Prefs[K][] } = {
  textScale: ["0", "1", "2", "3"],
  colorScheme: ["system", "light", "dark"],
  contrast: ["normal", "high"],
  font: ["default", "readable"],
  spacing: ["normal", "wide"],
  links: ["default", "underline"],
  motion: ["normal", "reduce"],
};

function systemDefaults(): Prefs {
  const matches = (query: string) => window.matchMedia?.(query).matches;
  return {
    textScale: "0",
    colorScheme: "system",
    contrast: matches("(prefers-contrast: more)") ? "high" : "normal",
    font: "default",
    spacing: "normal",
    links: "default",
    motion: matches("(prefers-reduced-motion: reduce)") ? "reduce" : "normal",
  };
}

function savedPrefs(): Prefs {
  const defaults = systemDefaults();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!saved || typeof saved !== "object") return defaults;
    const clean = Object.fromEntries(
      (Object.keys(allowedPrefs) as (keyof Prefs)[])
        .filter((key) => {
          const value = (saved as Record<string, unknown>)[key];
          return (
            typeof value === "string" &&
            (allowedPrefs[key] as readonly string[]).includes(value)
          );
        })
        .map((key) => [key, (saved as Record<string, string>)[key]]),
    );
    return { ...defaults, ...clean } as Prefs;
  } catch {
    return defaults;
  }
}
function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(savedPrefs);
  const [speaking, setSpeaking] = useState(false);
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(prefs).forEach(
      ([key, value]) => (root.dataset[key] = value),
    );
    try {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
    } catch {
      // Preferences still apply when storage is unavailable.
    }
  }, [prefs]);
  useEffect(() => {
    const root = document.documentElement;
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset.theme =
        prefs.colorScheme === "system"
          ? query?.matches
            ? "dark"
            : "light"
          : prefs.colorScheme;
    };
    apply();
    if (prefs.colorScheme !== "system" || !query) return;
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [prefs.colorScheme]);
  useEffect(
    () => () => {
      if (speechSupported) window.speechSynthesis.cancel();
    },
    [speechSupported],
  );
  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    setPrefs((current) => ({ ...current, [key]: value }));
  const readPage = () => {
    if (!speechSupported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const main = document.getElementById("main");
    const copy = main?.innerText.replace(/\s+/g, " ").trim();
    if (!copy) return;
    const utterance = new SpeechSynthesisUtterance(copy);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => voice.lang === "en-GH") ??
      voices.find((voice) => voice.lang === "en-GB") ??
      voices.find((voice) => voice.lang.startsWith("en")) ??
      null;
    utterance.rate = 0.95;
    utterance.onend = utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  return (
    <div className="a11y">
      <button
        className="a11y-trigger"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Accessibility
      </button>
      {open && (
        <section className="a11y-panel" aria-label="Accessibility settings">
          <div>
            <b>Accessibility</b>
            <button
              className="a11y-close"
              aria-label="Close accessibility settings"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <p>
            Change how Ability Connect looks and reads. Your choices are saved
            on this device.
          </p>
          <fieldset>
            <legend>Text size</legend>
            <div className="choice-row">
              {(["0", "1", "2", "3"] as const).map((value) => (
                <button
                  className={prefs.textScale === value ? "selected" : ""}
                  key={value}
                  onClick={() => set("textScale", value)}
                  aria-pressed={prefs.textScale === value}
                >
                  A
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Colour theme</legend>
            <div className="choice-row">
              {(["system", "light", "dark"] as const).map((value) => (
                <button
                  className={prefs.colorScheme === value ? "selected" : ""}
                  key={value}
                  onClick={() => set("colorScheme", value)}
                  aria-pressed={prefs.colorScheme === value}
                >
                  {value === "system" ? "Match device" : pretty(value)}
                </button>
              ))}
            </div>
          </fieldset>
          {(
            [
              ["contrast", "High contrast", "high", "normal"],
              ["font", "Easy-read font", "readable", "default"],
              ["spacing", "Wider spacing", "wide", "normal"],
              ["links", "Underline links", "underline", "default"],
              ["motion", "Reduce motion", "reduce", "normal"],
            ] as const
          ).map(([key, label, active, inactive]) => (
            <label className="toggle" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={prefs[key] === active}
                onChange={(event) =>
                  set(key, event.target.checked ? active : inactive)
                }
              />
            </label>
          ))}
          {speechSupported && (
            <button className="a11y-read" onClick={readPage}>
              {speaking ? "Stop reading" : "Read this page aloud"}
            </button>
          )}
          <button
            className="a11y-reset"
            onClick={() => {
              try {
                localStorage.removeItem(storageKey);
              } catch {
                // A fresh in-memory set is still useful in private browsing.
              }
              setPrefs(systemDefaults());
            }}
          >
            Reset settings
          </button>
        </section>
      )}
    </div>
  );
}

export function LegacyLanding({ onLogin }: { onLogin: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="public">
      <header className="public-header">
        <div className="public-header-inner">
          <div className="identity">
            <LogoMark compact />
            <span>
              <b>Ability Connect</b>
              <small>GIV Office · KNUST</small>
            </span>
          </div>
          <nav className="public-nav" aria-label="Main">
            <a href="#how-it-works">How it works</a>
            <a href="#privacy">Privacy</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="public-actions">
            <AccessibilityMenu />
            <button className="login-link" onClick={onLogin}>
              Staff sign in →
            </button>
            <button
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Main">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#privacy" onClick={() => setMenuOpen(false)}>
              Privacy
            </a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>
              Contact
            </a>
          </nav>
        )}
      </header>
      <main id="main">
        <section className="public-hero">
          <div className="public-wrap">
            <p className="eyebrow">
              Gender Inclusion &amp; Vulnerability Office
            </p>
            <h1>
              Support starts with <em>listening.</em>
            </h1>
            <p className="hero-copy">
              Ability Connect gives GIV staff one careful, secure place to
              understand student needs and coordinate the support that helps
              students thrive at KNUST.
            </p>
            <div className="hero-actions">
              <button onClick={onLogin}>Enter staff workspace →</button>
              <a href="#how-it-works">How it works</a>
            </div>
          </div>
        </section>
        <section className="principle">
          <div className="public-wrap">
            <p>“Nothing about us without us.”</p>
            <span>
              Every student record begins with the student’s own words, choices,
              and consent.
            </span>
          </div>
        </section>
        <section id="how-it-works" className="public-section">
          <div className="public-wrap">
            <p className="eyebrow">A connected service</p>
            <h2>From a student’s request to meaningful support</h2>
            <div className="public-steps">
              <article>
                <span>01</span>
                <h3>Students share their needs</h3>
                <p>
                  Students use the Ability Connect portal to register, request
                  support, and choose how their information may be used.
                </p>
              </article>
              <article>
                <span>02</span>
                <h3>GIV reviews with care</h3>
                <p>
                  Authorised staff review submitted records, understand what
                  matters, and move each case forward.
                </p>
              </article>
              <article>
                <span>03</span>
                <h3>Support stays visible</h3>
                <p>
                  Students can follow their case, receive a response, and return
                  whenever their circumstances change.
                </p>
              </article>
            </div>
          </div>
        </section>
        <section id="privacy" className="public-section privacy">
          <div className="public-wrap privacy-grid">
            <div>
              <p className="eyebrow">Privacy by design</p>
              <h2>Only the information needed to help.</h2>
              <p>
                Student disability information is sensitive. Unfinished drafts
                are never available to staff, submitted records are accessed
                only by authorised GIV colleagues, and significant staff actions
                are logged.
              </p>
            </div>
            <ul>
              <li>
                <b>Student-led consent</b>
                <span>
                  Sharing with faculty or halls happens only when a student
                  agrees.
                </span>
              </li>
              <li>
                <b>Secure case handling</b>
                <span>
                  Every staff workspace session is authenticated and
                  time-limited.
                </span>
              </li>
              <li>
                <b>Clear next steps</b>
                <span>
                  Status notes and request replies are written for students, not
                  systems.
                </span>
              </li>
            </ul>
          </div>
        </section>
        <section className="public-cta">
          <div className="public-wrap">
            <p className="eyebrow">GIV staff</p>
            <h2>Ready to coordinate support?</h2>
            <p>
              Sign in to review registrations, respond to requests, and keep
              students informed.
            </p>
            <button onClick={onLogin}>Enter staff workspace →</button>
          </div>
        </section>
      </main>
      <footer id="contact" className="public-footer">
        <div className="public-wrap">
          <div className="identity">
            <LogoMark compact />
            <span>
              <b>Ability Connect</b>
              <small>Built for the KNUST GIV Office</small>
            </span>
          </div>
          <p>Built with care by the Responsible AI Lab, KNUST.</p>
        </div>
      </footer>
    </div>
  );
}

function Landing({ onLogin }: { onLogin: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = (
    <>
      <a href="#how-it-works">Case workflow</a>
      <a href="#what-we-ask">Information</a>
      <a href="#support">Support pathways</a>
      <a href="#questions">Guidance</a>
    </>
  );
  return (
    <div className="public pwd-public">
      <header className="public-header">
        <div className="public-header-inner">
          <div className="identity">
            <LogoMark compact />
            <span>
              <b>Ability Connect</b>
              <small>GIV Office · KNUST</small>
            </span>
          </div>
          <nav className="public-nav" aria-label="Main">
            {nav}
          </nav>
          <div className="public-actions">
            <AccessibilityMenu />
            <button className="login-link" onClick={onLogin}>
              Staff sign in →
            </button>
            <button
              className="menu-toggle"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Main">
            {nav}
          </nav>
        )}
      </header>
      <main id="main">
        <section className="pwd-hero">
          <video
            className="hero-video"
            src="/media/hero-loop.mp4"
            poster="/media/hero-poster.webp"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="hero-scrim" />
          <div className="public-wrap hero-content">
            <h1>
              Coordinate support with care.
              <span>Keep every student informed.</span>
            </h1>
            <p>
              The GIV Office workspace brings submitted registrations, support
              requests, and student conversations into one secure view.
            </p>
            <div className="hero-actions">
              <button onClick={onLogin}>Verify staff access →</button>
              <a href="#how-it-works">Explore the workflow</a>
            </div>
          </div>
        </section>
        <section className="principle">
          <div className="public-wrap">
            <p>
              “Nothing about us
              <br />
              without us.”
            </p>
            <span>
              Ability Connect was shaped with students with disabilities at
              KNUST. The GIV Office uses their words, consent choices, and
              priorities to plan support with them, not for them.
            </span>
          </div>
        </section>
        <section id="how-it-works" className="pwd-section">
          <div className="public-wrap split">
            <div>
              <p className="eyebrow">How it works</p>
              <h2>
                One secure workflow for every support case
              </h2>
              <ol className="feature-steps">
                <li>
                  <b>01</b>
                  <div>
                    <h3>Review submitted registrations</h3>
                    <p>
                      Prioritise new records and understand each student’s
                      requested support, access needs, and consent choices.
                    </p>
                  </div>
                </li>
                <li>
                  <b>02</b>
                  <div>
                    <h3>Coordinate the next step</h3>
                    <p>
                      Record a clear case status, plan appropriate support, and
                      keep the case history organised.
                    </p>
                  </div>
                </li>
                <li>
                  <b>03</b>
                  <div>
                    <h3>Keep students informed</h3>
                    <p>
                      Respond to requests and write clear, student-facing
                      updates as support moves forward.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <figure className="feature-photo">
              <img
                src="/media/student-speaking-workshop-1280.webp"
                alt="A student speaks during an Ability Connect workshop."
              />
              <figcaption>
                Student input continues to guide how the GIV Office coordinates
                support.
              </figcaption>
            </figure>
          </div>
        </section>
        <section id="what-we-ask" className="pwd-section surface">
          <div className="public-wrap">
            <p className="eyebrow">Information</p>
            <h2>Everything needed to coordinate support — and nothing more</h2>
            <p className="section-intro">
              Each submitted registration is organised around the information
              the office needs to make informed, respectful decisions.
            </p>
            <ol className="ask-grid">
              {[
                [
                  "Student profile",
                  "Contact details, course context, and how the student prefers to be reached.",
                ],
                [
                  "Functional needs",
                  "The student’s own description of barriers in study and daily campus life.",
                ],
                [
                  "Requested support",
                  "Support requested for teaching, assessments, accommodation, technology, and wellbeing.",
                ],
                [
                  "Support context",
                  "Relevant emergency or support-contact details for informed coordination.",
                ],
                ["Consent choices", "The student controls how their information may be shared."],
                [
                  "Case history",
                  "Submission details, current status, notes, and replies in one place.",
                ],
              ].map(([title, copy], index) => (
                <li key={title}>
                  <b>Step {index + 1}</b>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </li>
              ))}
            </ol>
            <aside className="privacy-banner">
              <b>Protected information</b>
              <span>
                Student records are protected. Only submitted registrations
                reach the GIV workspace; unfinished drafts remain private.
              </span>
            </aside>
          </div>
        </section>
        <section id="support" className="pwd-section">
          <div className="public-wrap">
            <p className="eyebrow">Support pathways</p>
            <h2>Support the GIV Office can coordinate</h2>
            <div className="support-layout">
              <div className="gallery">
                <img
                  src="/media/sign-interpreter-stage-1280.webp"
                  alt="A sign language interpreter on stage."
                />
                <img
                  src="/media/ramp-wheelchair-users-1280.webp"
                  alt="Students using an accessible ramp."
                />
                <img
                  src="/media/sign-language-seminar-1280.webp"
                  alt="A speaker presents in sign language."
                />
              </div>
              <div className="support-grid">
                {[
                  [
                    "Learning access",
                    "Coordinate lecture notes, interpreters, captions, and accessible venues.",
                  ],
                  [
                    "Assessment access",
                    "Plan extra time, separate rooms, scribes or readers, large print, and braille.",
                  ],
                  [
                    "Accommodation",
                    "Liaise on accessible rooms, bathrooms, and appropriate support for assistants.",
                  ],
                  [
                    "Assistive technology",
                    "Connect students to devices, training, screen readers, and other tools.",
                  ],
                  [
                    "Wellbeing referrals",
                    "Connect students with counselling, health services, and financial support.",
                  ],
                  ["Community", "Support mentors, peer groups, and inclusive events."],
                ].map(([title, copy]) => (
                  <article key={title}>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="community">
          <img
            src="/media/workshop-audience-1280.webp"
            alt="Students and guests at an Ability Connect Workshop."
          />
          <div className="public-wrap">
            <p className="eyebrow">Student partnership</p>
            <h2>A service shaped with students</h2>
            <p>
              Student feedback informs how the GIV Office handles records,
              communicates decisions, and delivers support.
            </p>
          </div>
        </section>
        <section id="questions" className="pwd-section">
          <div className="public-wrap faq">
            <div>
              <p className="eyebrow">Guidance</p>
              <h2>Questions for GIV staff</h2>
            </div>
            <div>
              {[
                [
                  "Who can access this workspace?",
                  "Only authorised, active GIV Office staff can use the staff workspace. Students use the separate student portal.",
                ],
                [
                  "What information can staff see?",
                  "Staff can see submitted records, including the student’s support request and consent choices. Unfinished student drafts are never shown here.",
                ],
                [
                  "How are consent choices handled?",
                  "Review a student’s recorded consent before sharing information or coordinating with another service. Consent remains central to every case decision.",
                ],
                [
                  "What happens when a student needs urgent help?",
                  "Use the office’s established urgent-support procedure and record the next step clearly, so the student receives an appropriate response.",
                ],
              ].map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="public-cta">
          <div className="public-wrap">
            <p className="eyebrow">GIV staff</p>
            <h2>Ready to coordinate support?</h2>
            <p>
              Sign in to review registrations, respond to requests, and keep
              students informed.
            </p>
            <button onClick={onLogin}>Enter staff workspace →</button>
          </div>
        </section>
      </main>
      <footer className="public-footer">
        <div className="public-wrap">
          <div className="identity">
            <LogoMark compact />
            <span>
              <b>Ability Connect</b>
              <small>Built for the KNUST GIV Office</small>
            </span>
          </div>
          <p>Built with care by the Responsible AI Lab, KNUST.</p>
        </div>
      </footer>
    </div>
  );
}

function Workspace({
  staff,
  onLogout,
}: {
  staff: Staff;
  onLogout: () => void;
}) {
  const [view, setView] = useState<View>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<
    string | null
  >(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const navigate = (next: View) => {
    setSelectedRegistration(null);
    setSelectedRequest(null);
    setView(next);
  };
  return (
    <div className={`shell portal-shell ${collapsed ? "is-collapsed" : ""}`}>
      <header className="portal-topbar">
        <button
          className="sidebar-toggle"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          ☰
        </button>
        <div className="profile-area">
          <button
            className="profile-trigger"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="profile-avatar" aria-hidden="true">
              {staff.fullName.slice(0, 1)}
            </span>
            <span className="profile-name">{staff.fullName}</span>
          </button>
          {profileOpen && (
            <div className="profile-menu">
              <b>{staff.fullName}</b>
              <small>{staff.role}</small>
              <hr />
              <button onClick={onLogout}>Sign out</button>
            </div>
          )}
        </div>
      </header>
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <LogoMark compact />
          <span>
            <b>Ability Connect</b>
            <small>GIV Office · KNUST</small>
          </span>
        </div>
        <nav aria-label="Workspace">
          <p className="nav-label">Navigation</p>
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => navigate("dashboard")}
          >
            <span aria-hidden="true">▦</span><i>Dashboard</i>
          </button>
          <button
            className={view === "registrations" ? "active" : ""}
            onClick={() => navigate("registrations")}
          >
            <span aria-hidden="true">▤</span><i>Registrations</i>
          </button>
          <button
            className={view === "requests" ? "active" : ""}
            onClick={() => navigate("requests")}
          >
            <span aria-hidden="true">✦</span><i>Support requests</i>
          </button>
        </nav>
        <div className="sidebar-footer">
          <small>Secure staff workspace</small>
        </div>
      </aside>
      <div className="body portal-body">
        <main id="workspace-main">
          {selectedRegistration ? (
            <RegistrationDetail
              id={selectedRegistration}
              onBack={() => setSelectedRegistration(null)}
            />
          ) : selectedRequest ? (
            <RequestDetail
              id={selectedRequest}
              onBack={() => setSelectedRequest(null)}
            />
          ) : view === "dashboard" ? (
            <Dashboard
              openRegistrations={() => setView("registrations")}
              openRequests={() => setView("requests")}
            />
          ) : view === "registrations" ? (
            <Registrations onSelect={setSelectedRegistration} />
          ) : (
            <Requests onSelect={setSelectedRequest} />
          )}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  openRegistrations,
  openRequests,
}: {
  openRegistrations: () => void;
  openRequests: () => void;
}) {
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.registrations(), api.requests()])
      .then(([r, q]) => {
        setRegistrations(r);
        setRequests(q);
      })
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "Could not load the overview.",
        ),
      );
  }, []);
  const activeRequests = requests.filter(
    (r) => r.status === "open" || r.status === "in_progress",
  );
  return (
    <>
      <section className="portal-notice" role="status">
        <b>GIV Office workspace</b>
        <span>
          Review newly submitted registrations and respond to student support
          requests from one protected workspace.
        </span>
      </section>
      {error && <p className="error">{error}</p>}
      <section className="portal-card-grid" aria-label="GIV Office work areas">
        <button className="portal-card" onClick={openRegistrations}>
          <span className="portal-icon" aria-hidden="true">▤</span>
          <h2>Registrations</h2>
          <strong>{registrations.filter((r) => r.status === "submitted").length}</strong>
          <p>New student registrations waiting for their first review.</p>
        </button>
        <button className="portal-card" onClick={openRequests}>
          <span className="portal-icon" aria-hidden="true">✦</span>
          <h2>Support requests</h2>
          <strong>{activeRequests.length}</strong>
          <p>Open student requests that need a response or next step.</p>
        </button>
        <button className="portal-card" onClick={openRegistrations}>
          <span className="portal-icon" aria-hidden="true">✓</span>
          <h2>Active support</h2>
          <strong>{registrations.filter((r) => r.status === "support_active").length}</strong>
          <p>Cases with support in progress across the GIV Office.</p>
        </button>
        <button className="portal-card" onClick={openRegistrations}>
          <span className="portal-icon" aria-hidden="true">⌕</span>
          <h2>Find a student</h2>
          <p>Search submitted registrations by student name or university ID.</p>
        </button>
      </section>
    </>
  );
}

function Registrations({ onSelect }: { onSelect: (id: string) => void }) {
  const [rows, setRows] = useState<RegistrationSummary[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    api
      .registrations(params.size ? `?${params}` : "")
      .then(setRows)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "Could not load registrations.",
        ),
      );
  }, [query, status]);
  return (
    <>
      <p className="eyebrow">Student records</p>
      <h1>Registrations</h1>
      <div className="toolbar">
        <input
          aria-label="Search by student name or ID"
          placeholder="Search a name or student ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All active records</option>
          {Object.entries(registrationLabels)
            .filter(([key]) => key !== "draft")
            .map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      <article className="card">
        <RegistrationRows rows={rows} onSelect={onSelect} />
      </article>
    </>
  );
}
function RegistrationRows({
  rows,
  onSelect,
}: {
  rows: RegistrationSummary[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rows">
      {rows.length ? (
        rows.map((row) => (
          <button
            key={row.studentId}
            className="row"
            onClick={() => onSelect(row.studentId)}
          >
            <span>
              <b>{row.fullName}</b>
              <small>
                {row.studentId} · {row.programme}
              </small>
            </span>
            <Status value={row.status} />
            <time>{date(row.updatedAt)}</time>
          </button>
        ))
      ) : (
        <p className="empty">No registrations match this view.</p>
      )}
    </div>
  );
}

function Requests({ onSelect }: { onSelect: (id: string) => void }) {
  const [rows, setRows] = useState<SupportRequest[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .requests(status ? `?status=${status}` : "")
      .then(setRows)
      .catch((e) =>
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load support requests.",
        ),
      );
  }, [status]);
  return (
    <>
      <p className="eyebrow">Case coordination</p>
      <h1>Support requests</h1>
      <div className="toolbar">
        <select
          aria-label="Filter by request status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All requests</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      <article className="card">
        <RequestRows rows={rows} onSelect={onSelect} />
      </article>
    </>
  );
}
function RequestRows({
  rows,
  onSelect,
}: {
  rows: SupportRequest[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rows">
      {rows.length ? (
        rows.map((row) => (
          <button key={row.id} className="row" onClick={() => onSelect(row.id)}>
            <span>
              <b>{row.title}</b>
              <small>
                {row.id} · {pretty(row.category)} · {pretty(row.urgency)}
              </small>
            </span>
            <Status value={row.status} />
            <time>{date(row.updatedAt)}</time>
          </button>
        ))
      ) : (
        <p className="empty">No requests match this view.</p>
      )}
    </div>
  );
}
function Status({ value }: { value: string }) {
  return <span className={`status ${value}`}>{pretty(value)}</span>;
}

function RegistrationDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const [record, setRecord] = useState<{
    student: Student;
    registration: Registration;
  } | null>(null);
  const [status, setStatus] =
    useState<Exclude<RegistrationStatus, "draft">>("in_review");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .registration(id)
      .then((res) => {
        setRecord(res);
        setStatus(
          res.registration.status === "draft"
            ? "submitted"
            : res.registration.status,
        );
      })
      .catch((e) =>
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load this registration.",
        ),
      );
  }, [id]);
  async function update() {
    if (!record) return;
    setBusy(true);
    setError("");
    try {
      const next = await api.setRegistrationStatus(id, status, note);
      setRecord({ ...record, registration: next });
      setNote("");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Could not save the status.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!record) return <p>{error || "Loading registration…"}</p>;
  const data = record.registration.data || {};
  return (
    <>
      <button className="back" onClick={onBack}>
        ← Back to registrations
      </button>
      <p className="eyebrow">Student registration</p>
      <h1>{record.student.fullName}</h1>
      <p className="muted">
        {record.student.studentId} · {record.student.programme} ·{" "}
        {record.student.level}
      </p>
      <div className="detail-grid">
        <section className="card">
          <h2>Registration details</h2>
          {Object.entries(data).map(([section, values]) => (
            <div className="detail-section" key={section}>
              <h3>{pretty(section)}</h3>
              <Details values={values} />
            </div>
          ))}
        </section>
        <aside className="stack">
          <section className="card">
            <h2>Case status</h2>
            <Status value={record.registration.status} />
            <label>
              Update status
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as Exclude<RegistrationStatus, "draft">,
                  )
                }
              >
                {Object.entries(registrationLabels)
                  .filter(([value]) => value !== "draft")
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Note to student
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain the next step in clear, student-facing language."
              />
            </label>
            <button onClick={update} disabled={busy}>
              {busy ? "Saving…" : "Save update"}
            </button>
            {error && <p className="error">{error}</p>}
          </section>
          <section className="card">
            <h2>Student information</h2>
            <p>
              <b>Email</b>
              <br />
              {record.student.universityEmail}
            </p>
            <p>
              <b>Campus</b>
              <br />
              {record.student.campus}
            </p>
            <p>
              <b>Submitted</b>
              <br />
              {date(record.registration.submittedAt)}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
function Details({ values }: { values: unknown }) {
  if (!values || typeof values !== "object")
    return <p>{String(values ?? "—")}</p>;
  return (
    <dl>
      {Object.entries(values as Record<string, unknown>).map(([key, value]) => (
        <div key={key}>
          <dt>{pretty(key)}</dt>
          <dd>
            {Array.isArray(value)
              ? value.map(String).map(pretty).join(", ") || "None selected"
              : typeof value === "object"
                ? Object.entries(value as Record<string, string>)
                    .map(([a, b]) => `${pretty(a)}: ${pretty(b)}`)
                    .join(", ")
                : String(value || "—")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RequestDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [data, setData] = useState<{
    request: SupportRequest;
    student: Student;
  } | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api
      .request(id)
      .then(setData)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "Could not load this request.",
        ),
      );
  }, [id]);
  async function saveStatus(status: "open" | "in_progress" | "resolved") {
    if (!data) return;
    setBusy(true);
    try {
      setData({ ...data, request: await api.setRequestStatus(id, status) });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Could not update the request.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (!data || !reply.trim()) return;
    setBusy(true);
    try {
      setData({ ...data, request: await api.reply(id, reply) });
      setReply("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send the reply.");
    } finally {
      setBusy(false);
    }
  }
  if (!data) return <p>{error || "Loading support request…"}</p>;
  const request = data.request;
  return (
    <>
      <button className="back" onClick={onBack}>
        ← Back to requests
      </button>
      <p className="eyebrow">{pretty(request.category)}</p>
      <h1>{request.title}</h1>
      <p className="muted">
        {data.student.fullName} · {data.student.studentId} · Needed by{" "}
        {request.neededBy || "not specified"}
      </p>
      <div className="detail-grid">
        <section className="card">
          <h2>Request details</h2>
          <p>{request.details}</p>
          <hr />
          <h2>Conversation</h2>
          <div className="messages">
            {request.messages.length ? (
              request.messages.map((message) => (
                <article className={`message ${message.from}`} key={message.id}>
                  <b>
                    {message.from === "giv"
                      ? message.author || "GIV Office"
                      : data.student.fullName}
                  </b>
                  <p>{message.body}</p>
                  <small>{date(message.at)}</small>
                </article>
              ))
            ) : (
              <p className="empty">No messages yet.</p>
            )}
          </div>
          {request.status !== "withdrawn" && (
            <label>
              Reply to student
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a clear, respectful reply."
              />
            </label>
          )}
          <button
            onClick={send}
            disabled={busy || !reply.trim() || request.status === "withdrawn"}
          >
            {busy ? "Sending…" : "Send reply"}
          </button>
        </section>
        <aside className="stack">
          <section className="card">
            <h2>Request status</h2>
            <Status value={request.status} />
            <div className="actions">
              {(["open", "in_progress", "resolved"] as const).map((status) => (
                <button
                  className="secondary"
                  key={status}
                  onClick={() => saveStatus(status)}
                  disabled={
                    busy ||
                    request.status === status ||
                    request.status === "withdrawn"
                  }
                >
                  Mark {pretty(status)}
                </button>
              ))}
            </div>
            {error && <p className="error">{error}</p>}
          </section>
          <section className="card">
            <h2>Student</h2>
            <p>
              <b>{data.student.fullName}</b>
              <br />
              {data.student.programme}
              <br />
              {data.student.universityEmail}
            </p>
            <p>
              <b>Urgency</b>
              <br />
              {pretty(request.urgency)}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
