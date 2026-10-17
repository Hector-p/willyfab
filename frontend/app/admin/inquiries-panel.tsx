"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail } from "lucide-react";

import {
  adminRequest,
  describeError,
  isAuthLost,
  type InquiryRecord,
  type InquiryStatus,
  type ListResponse,
} from "./admin-api";
import { AdminField } from "./admin-ui";

type InquiryPage = ListResponse<InquiryRecord>;

const PAGE_SIZE = 100;

const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "archived", label: "Archived" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export function InquiriesPanel({ token, onAuthLost }: { token: string; onAuthLost: () => void }) {
  const [page, setPage] = useState<InquiryPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPage(await adminRequest<InquiryPage>(`/inquiries?limit=${PAGE_SIZE}`, token));
    } catch (err) {
      if (isAuthLost(err)) {
        onAuthLost();
        return;
      }
      setError(describeError(err));
    }
  }, [token, onAuthLost]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = page?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  async function changeStatus(inquiry: InquiryRecord, status: InquiryStatus) {
    if (status === inquiry.status) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const updated = await adminRequest<InquiryRecord>(`/inquiries/${inquiry.id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setPage((current) =>
        current ? { ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) } : current,
      );
    } catch (err) {
      if (isAuthLost(err)) {
        onAuthLost();
        return;
      }
      setStatusError(describeError(err));
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div className="admin-workspace">
      <section className="admin-card admin-card-list" aria-label="Enquiries list">
        <header className="admin-card-head">
          <div>
            <h2>Enquiries</h2>
            <p>Messages from the contact form, newest first.</p>
          </div>
        </header>

        {error ? (
          <div className="admin-panel-state">
            <p className="admin-notice admin-notice-error" role="alert">{error}</p>
            <button className="admin-button admin-button-ghost" onClick={() => void load()} type="button">
              Try again
            </button>
          </div>
        ) : page === null ? (
          <p className="admin-panel-state admin-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="admin-panel-state admin-muted">No enquiries have arrived yet.</p>
        ) : (
          <>
            <p className="admin-list-count">
              Showing {items.length} of {page.total}
            </p>
            <ul className="admin-list">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    aria-current={selected?.id === item.id ? "true" : undefined}
                    className="admin-list-item"
                    onClick={() => {
                      setSelectedId(item.id);
                      setStatusError(null);
                    }}
                    type="button"
                  >
                    <span className="admin-list-title">{item.name}</span>
                    <span className="admin-list-meta">{item.service_interest ?? "General enquiry"}</span>
                    <span className="admin-list-date">
                      {formatDate(item.created_at)} · {STATUS_OPTIONS.find((option) => option.value === item.status)?.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="admin-card admin-card-editor" aria-label="Enquiry details">
        {selected ? (
          <article className="admin-inquiry">
            <header className="admin-editor-head">
              <p className="admin-kicker">{formatDate(selected.created_at)}</p>
              <h2>{selected.name}</h2>
              <p className="admin-tag">{selected.service_interest ?? "General enquiry"}</p>
            </header>

            <div className="admin-form-grid">
              <AdminField id="inquiry-status" label="Status">
                <select
                  className="admin-input"
                  disabled={statusBusy}
                  id="inquiry-status"
                  onChange={(event) => void changeStatus(selected, event.target.value as InquiryStatus)}
                  value={selected.status}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </AdminField>
              {statusError ? (
                <p className="admin-notice admin-notice-error is-wide" role="alert">
                  {statusError}
                </p>
              ) : null}
            </div>

            <dl className="admin-facts">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${selected.email}`}>{selected.email}</a>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone ? <a href={`tel:${selected.phone}`}>{selected.phone}</a> : "Not given"}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{selected.company ?? "Not given"}</dd>
              </div>
            </dl>

            <div className="admin-message">
              <p className="admin-kicker">Message</p>
              <p>{selected.message}</p>
            </div>

            <a
              className="admin-button admin-button-primary admin-inquiry-reply"
              href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: your enquiry to Willyfab Engineering`)}`}
            >
              <Mail aria-hidden="true" size={16} strokeWidth={1.8} />
              Reply by email
            </a>
          </article>
        ) : (
          <div className="admin-empty-editor">
            <p className="admin-kicker">Enquiries</p>
            <h2>Select a message</h2>
            <p className="admin-muted">Pick an enquiry from the list to read the full message.</p>
          </div>
        )}
      </section>
    </div>
  );
}
