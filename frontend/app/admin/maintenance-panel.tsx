"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { adminRequest, describeError, isAuthLost } from "./admin-api";
import { AdminField, SaveStatus, type SaveState } from "./admin-ui";

type SiteStatusRecord = {
  maintenance_mode: boolean;
  maintenance_message: string;
  updated_at: string;
};

const siteStatusSchema = z.object({
  maintenance_mode: z.boolean(),
  maintenance_message: z
    .string()
    .trim()
    .min(1, "Enter the message visitors should see.")
    .max(300, "Keep the message under 300 characters."),
});

type SiteStatusValues = z.infer<typeof siteStatusSchema>;

function toValues(record: SiteStatusRecord): SiteStatusValues {
  return { maintenance_mode: record.maintenance_mode, maintenance_message: record.maintenance_message };
}

export function MaintenancePanel({ token, onAuthLost }: { token: string; onAuthLost: () => void }) {
  const [record, setRecord] = useState<SiteStatusRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SiteStatusValues>({
    resolver: zodResolver(siteStatusSchema),
    defaultValues: { maintenance_mode: false, maintenance_message: "" },
  });

  const maintenanceOn = watch("maintenance_mode");

  useEffect(() => {
    let active = true;
    adminRequest<SiteStatusRecord>("/site-status", token)
      .then((data) => {
        if (!active) return;
        setRecord(data);
        reset(toValues(data));
      })
      .catch((err) => {
        if (!active) return;
        if (isAuthLost(err)) {
          onAuthLost();
          return;
        }
        setLoadError(describeError(err));
      });
    return () => {
      active = false;
    };
  }, [token, onAuthLost, reset]);

  const submit = handleSubmit(async (values) => {
    setSave({ kind: "saving" });
    try {
      const saved = await adminRequest<SiteStatusRecord>("/site-status", token, {
        method: "PUT",
        body: JSON.stringify(values),
      });
      setRecord(saved);
      reset(toValues(saved));
      setSave({ kind: "saved" });
    } catch (err) {
      if (isAuthLost(err)) {
        onAuthLost();
        return;
      }
      setSave({ kind: "error", message: describeError(err) });
    }
  });

  return (
    <section className="admin-card admin-card-editor" aria-label="Maintenance mode">
      <header className="admin-editor-head">
        <p className="admin-kicker">Site status</p>
        <h2>Maintenance mode</h2>
        <p className="admin-muted">
          When this is on, visitors to the public website see the maintenance message instead of the site. This admin
          area stays available.
        </p>
      </header>

      {loadError ? (
        <p className="admin-notice admin-notice-error" role="alert">
          {loadError}
        </p>
      ) : record === null ? (
        <p className="admin-panel-state admin-muted">Loading…</p>
      ) : (
        <form className="admin-form" noValidate onSubmit={submit}>
          <div className="admin-form-grid">
            <label className="admin-check">
              <input type="checkbox" {...register("maintenance_mode")} />
              <span>Show the maintenance page on the public website</span>
            </label>
            <AdminField error={errors.maintenance_message?.message} id="maintenance-message" label="Message">
              <textarea className="admin-input" id="maintenance-message" rows={3} {...register("maintenance_message")} />
            </AdminField>
          </div>

          {maintenanceOn ? (
            <p className="admin-notice" role="status">
              Maintenance mode is on. Visitors currently see the maintenance page.
            </p>
          ) : null}

          <div className="admin-editor-actions">
            <SaveStatus state={save} />
            <button
              className="admin-button admin-button-primary"
              disabled={save.kind === "saving" || !isDirty}
              type="submit"
            >
              {save.kind === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
