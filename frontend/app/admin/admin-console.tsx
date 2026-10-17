"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Images, LogOut, MessageSquare, Newspaper, Users, Wrench } from "lucide-react";
import { z } from "zod";

import { SESSION_KEY, describeError, signIn } from "./admin-api";
import { BoardPanel } from "./board-panel";
import { GalleryPanel } from "./gallery-panel";
import { InquiriesPanel } from "./inquiries-panel";
import { ProjectsPanel } from "./projects-panel";
import { ServicesPanel } from "./services-panel";

type Section = "board" | "projects" | "services" | "gallery" | "inquiries";

const SECTIONS: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "board", label: "Board members", icon: Users },
  { id: "projects", label: "Projects", icon: Newspaper },
  { id: "services", label: "Services", icon: Wrench },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "inquiries", label: "Enquiries", icon: MessageSquare },
];

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginView({ onSignedIn, notice }: { onSignedIn: (token: string) => void; notice: string | null }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const token = await signIn(values.email, values.password);
      sessionStorage.setItem(SESSION_KEY, token);
      onSignedIn(token);
    } catch (err) {
      setServerError(describeError(err));
    }
  });

  return (
    <main className="admin-login">
      <aside className="admin-login-brand" aria-hidden="true">
        <p className="admin-kicker is-light">Willyfab Engineering</p>
        <h1>Site administration</h1>
        <p>Manage the team, projects, services and enquiries that appear on the public website.</p>
      </aside>

      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-card">
          <p className="admin-kicker">Sign in</p>
          <h2 id="admin-login-title">Welcome back</h2>
          {notice ? (
            <p className="admin-notice admin-notice-error" role="status">
              {notice}
            </p>
          ) : null}

          <form className="admin-form is-login" noValidate onSubmit={submit}>
            <div className="admin-field">
              <label htmlFor="admin-email">Email</label>
              <input
                autoComplete="username"
                className="admin-input"
                id="admin-email"
                type="email"
                {...register("email")}
              />
              {errors.email ? <p className="admin-field-error" role="alert">{errors.email.message}</p> : null}
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">Password</label>
              <input
                autoComplete="current-password"
                className="admin-input"
                id="admin-password"
                type="password"
                {...register("password")}
              />
              {errors.password ? <p className="admin-field-error" role="alert">{errors.password.message}</p> : null}
            </div>

            {serverError ? (
              <p className="admin-notice admin-notice-error" role="alert">
                {serverError}
              </p>
            ) : null}

            <button className="admin-button admin-button-primary is-block" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export function AdminConsole() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("board");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setToken(sessionStorage.getItem(SESSION_KEY));
    setReady(true);
  }, []);

  const endSession = useCallback((message: string | null) => {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setNotice(message);
  }, []);

  const handleAuthLost = useCallback(() => {
    endSession("Your session has ended. Please sign in again.");
  }, [endSession]);

  if (!ready) {
    return <main className="admin-boot" aria-busy="true" />;
  }

  if (!token) {
    return (
      <LoginView
        notice={notice}
        onSignedIn={(next) => {
          setNotice(null);
          setToken(next);
        }}
      />
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <p className="admin-kicker is-light">Willyfab</p>
          <p className="admin-brand-title">Administration</p>
        </div>

        <nav aria-label="Administration sections">
          <ul className="admin-nav">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  aria-current={section === id ? "page" : undefined}
                  className="admin-nav-item"
                  onClick={() => setSection(id)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button className="admin-nav-item admin-signout" onClick={() => endSession(null)} type="button">
          <LogOut aria-hidden="true" size={17} strokeWidth={1.7} />
          Sign out
        </button>
      </aside>

      <main className="admin-main">
        {section === "board" ? <BoardPanel onAuthLost={handleAuthLost} token={token} /> : null}
        {section === "projects" ? <ProjectsPanel onAuthLost={handleAuthLost} token={token} /> : null}
        {section === "services" ? <ServicesPanel onAuthLost={handleAuthLost} token={token} /> : null}
        {section === "gallery" ? <GalleryPanel onAuthLost={handleAuthLost} token={token} /> : null}
        {section === "inquiries" ? <InquiriesPanel onAuthLost={handleAuthLost} token={token} /> : null}
      </main>
    </div>
  );
}
