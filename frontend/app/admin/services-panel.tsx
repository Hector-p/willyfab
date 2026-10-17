"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { describeError, isAuthLost, saveRecord, slugify, type ServiceRecord } from "./admin-api";
import { AdminField, DeleteRecordButton, SaveStatus, nullable, sortOrderField, type SaveState } from "./admin-ui";
import { ResourcePanel, type EditorProps } from "./resource-panel";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const serviceSchema = z.object({
  number: z.string().trim().min(1, "Enter a number such as 01.").max(8),
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(180),
  slug: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value === "" || (value.length >= 3 && SLUG_PATTERN.test(value)), {
      message: "Use lowercase letters, numbers and single hyphens (at least 3 characters).",
    }),
  category: z.string().trim().min(2, "Enter a category.").max(80),
  capacity: z.string().trim().max(100),
  summary: z.string().trim().min(10, "Write at least 10 characters.").max(500),
  description: z.string().trim().min(10, "Write at least 10 characters.").max(10000),
  sort_order: sortOrderField,
  is_published: z.boolean(),
});

type ServiceValues = z.infer<typeof serviceSchema>;

function toValues(record: ServiceRecord | null): ServiceValues {
  return {
    number: record?.number ?? "",
    title: record?.title ?? "",
    slug: record?.slug ?? "",
    category: record?.category ?? "",
    capacity: record?.capacity ?? "",
    summary: record?.summary ?? "",
    description: record?.description ?? "",
    sort_order: String(record?.sort_order ?? 0),
    is_published: record?.is_published ?? true,
  };
}

function ServiceEditor({ record, path, token, onAuthLost, onSaved, onDeleted }: EditorProps<ServiceRecord>) {
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const form = useForm<ServiceValues>({ resolver: zodResolver(serviceSchema), defaultValues: toValues(record) });
  const { register, handleSubmit, watch, reset, formState } = form;
  const { errors, isDirty } = formState;
  const title = watch("title");

  const submit = handleSubmit(async (values) => {
    setSave({ kind: "saving" });
    try {
      const saved = await saveRecord<ServiceRecord>(path, token, record?.id ?? null, {
        slug: values.slug || slugify(values.title),
        number: values.number,
        title: values.title,
        category: values.category,
        capacity: nullable(values.capacity),
        summary: values.summary,
        description: values.description,
        sort_order: Number(values.sort_order),
        is_published: values.is_published,
      });
      reset(toValues(saved));
      onSaved(saved);
      setSave({ kind: "saved" });
    } catch (err) {
      if (isAuthLost(err)) {
        onAuthLost();
        return;
      }
      setSave({ kind: "error", message: describeError(err) });
    }
  });

  const canSave = save.kind !== "saving" && (record === null || isDirty);

  return (
    <form className="admin-form" noValidate onSubmit={submit}>
      <header className="admin-editor-head">
        <p className="admin-kicker">Service</p>
        <h2>{record ? record.title : "New service"}</h2>
      </header>

      <fieldset className="admin-group">
        <legend>Identity</legend>
        <div className="admin-form-grid">
          <AdminField error={errors.number?.message} id="service-number" label="Number" hint="Shown as 01, 02 …">
            <input className="admin-input" id="service-number" {...register("number")} />
          </AdminField>
          <AdminField error={errors.category?.message} id="service-category" label="Category">
            <input className="admin-input" id="service-category" placeholder="e.g. Fabrication" {...register("category")} />
          </AdminField>
          <AdminField error={errors.title?.message} id="service-title" label="Title" wide>
            <input className="admin-input" id="service-title" {...register("title")} />
          </AdminField>
          <AdminField
            error={errors.slug?.message}
            hint={record ? "Changing the slug changes the service link." : "Leave blank to generate from the title."}
            id="service-slug"
            label="Link slug"
            wide
          >
            <input className="admin-input" id="service-slug" placeholder={slugify(title) || "service-link"} {...register("slug")} />
          </AdminField>
        </div>
      </fieldset>

      <fieldset className="admin-group">
        <legend>Content</legend>
        <div className="admin-form-grid">
          <AdminField error={errors.summary?.message} id="service-summary" label="Summary" wide>
            <textarea className="admin-textarea" id="service-summary" rows={2} {...register("summary")} />
          </AdminField>
          <AdminField error={errors.description?.message} id="service-description" label="Full description" wide>
            <textarea className="admin-textarea" id="service-description" rows={7} {...register("description")} />
          </AdminField>
          <AdminField error={errors.capacity?.message} hint="Optional, e.g. 10 tonnes per hour." id="service-capacity" label="Capacity" wide>
            <input className="admin-input" id="service-capacity" {...register("capacity")} />
          </AdminField>
        </div>
      </fieldset>

      <fieldset className="admin-group">
        <legend>Publishing</legend>
        <div className="admin-form-grid">
          <AdminField error={errors.sort_order?.message} hint="Lower numbers appear first." id="service-order" label="Display order">
            <input className="admin-input" id="service-order" inputMode="numeric" {...register("sort_order")} />
          </AdminField>
          <label className="admin-check admin-check-end">
            <input type="checkbox" {...register("is_published")} />
            <span>Published on the services page</span>
          </label>
        </div>
      </fieldset>

      <footer className="admin-editor-foot">
        {record ? (
          <DeleteRecordButton
            id={record.id}
            label="service"
            onAuthLost={onAuthLost}
            onDeleted={onDeleted}
            path={path}
            token={token}
          />
        ) : (
          <span />
        )}
        <div className="admin-editor-actions">
          <SaveStatus state={save} />
          <button className="admin-button admin-button-primary" disabled={!canSave} type="submit">
            {save.kind === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </footer>
    </form>
  );
}

export function ServicesPanel({ token, onAuthLost }: { token: string; onAuthLost: () => void }) {
  return (
    <ResourcePanel<ServiceRecord>
      describe={(service) => ({ title: service.title, meta: `${service.number} · ${service.category}` })}
      Editor={ServiceEditor}
      description="Services listed on the public services page."
      noun="Service"
      onAuthLost={onAuthLost}
      path="/services"
      title="Services"
      token={token}
    />
  );
}
