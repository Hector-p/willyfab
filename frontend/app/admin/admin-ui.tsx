"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { z } from "zod";

import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  adminRequest,
  deleteRecord,
  describeError,
  isAuthLost,
  uploadImage,
  type ListResponse,
} from "./admin-api";

export const sortOrderField = z
  .string()
  .trim()
  .regex(/^\d{1,5}$/, "Use a whole number from 0 to 10000.")
  .refine((value) => Number(value) <= 10000, "Use a whole number from 0 to 10000.");

export const dateField = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Pick a valid date.");

export function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

export function SaveStatus({ state }: { state: SaveState }) {
  if (state.kind === "saved") return <p className="admin-notice admin-notice-success" role="status">Changes saved.</p>;
  if (state.kind === "error") return <p className="admin-notice admin-notice-error" role="alert">{state.message}</p>;
  return null;
}

export function AdminField({
  id,
  label,
  error,
  hint,
  wide,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`admin-field${wide ? " is-wide" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="admin-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="admin-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function useCollection<T>(token: string, path: string, onAuthLost: () => void) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const body = await adminRequest<ListResponse<T>>(path, token);
      setItems(body.items);
    } catch (err) {
      if (isAuthLost(err)) {
        onAuthLost();
        return;
      }
      setError(describeError(err));
    }
  }, [path, token, onAuthLost]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, setItems, error, reload: load };
}

export function DeleteRecordButton({
  token,
  path,
  id,
  label,
  onAuthLost,
  onDeleted,
}: {
  token: string;
  path: string;
  id: number;
  label: string;
  onAuthLost: () => void;
  onDeleted: (id: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setMessage(null);
    try {
      await deleteRecord(path, token, id);
      onDeleted(id);
    } catch (err) {
      if (isAuthLost(err)) {
        onAuthLost();
        return;
      }
      setMessage(describeError(err));
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="admin-delete">
      {confirming ? (
        <>
          <span className="admin-delete-question">Delete this {label}?</span>
          <button className="admin-button admin-button-danger" disabled={busy} onClick={remove} type="button">
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
          <button className="admin-button admin-button-quiet" disabled={busy} onClick={() => setConfirming(false)} type="button">
            Keep it
          </button>
        </>
      ) : (
        <button className="admin-button admin-button-quiet is-danger" onClick={() => setConfirming(true)} type="button">
          Delete {label}
        </button>
      )}
      {message ? (
        <p className="admin-field-error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function ImageField({
  token,
  value,
  alt,
  onChange,
  onAuthLost,
  error,
}: {
  token: string;
  value: string;
  alt: string;
  onChange: (url: string) => void;
  onAuthLost: () => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setMessage("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage("Images must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      onChange(await uploadImage(token, file));
    } catch (err) {
      if (isAuthLost(err)) {
        onAuthLost();
        return;
      }
      setMessage(describeError(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-image-field">
      <div className={`admin-image-preview${value ? "" : " is-empty"}`}>
        {value ? <img alt={alt} src={value} /> : <ImagePlus aria-hidden="true" size={28} strokeWidth={1.4} />}
        {uploading ? (
          <span className="admin-image-busy">
            <Loader2 aria-hidden="true" className="admin-spin" size={22} />
          </span>
        ) : null}
      </div>
      <div className="admin-image-actions">
        <button
          className="admin-button admin-button-ghost"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {value ? "Replace photo" : "Upload photo"}
        </button>
        {value ? (
          <button className="admin-button admin-button-quiet" disabled={uploading} onClick={() => onChange("")} type="button">
            Remove
          </button>
        ) : null}
        <p className="admin-field-hint">JPEG, PNG or WebP, up to 5 MB.</p>
        {message || error ? (
          <p className="admin-field-error" role="alert">
            {message ?? error}
          </p>
        ) : null}
      </div>
      <input
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        hidden
        onChange={handleFile}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
