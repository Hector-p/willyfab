"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { describeError, isAuthLost, saveRecord, slugify, type ProjectRecord } from "./admin-api";
import {
  AdminField,
  DeleteRecordButton,
  ImageField,
  SaveStatus,
  dateField,
  nullable,
  sortOrderField,
  type SaveState,
} from "./admin-ui";
import { ResourcePanel, type EditorProps } from "./resource-panel";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const projectSchema = z.object({
  number: z.string().trim().min(1, "Enter a number such as 01.").max(8),
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(200),
  slug: z
    .string()
    .trim()
    .max(140)
    .refine((value) => value === "" || (value.length >= 3 && SLUG_PATTERN.test(value)), {
      message: "Use lowercase letters, numbers and single hyphens (at least 3 characters).",
    }),
  category: z.string().trim().min(2, "Enter a category.").max(100),
  image_url: z.string().max(500),
  image_alt: z.string().trim().max(300),
  short_description: z.string().trim().min(10, "Write at least 10 characters.").max(500),
  brief: z.string().trim().min(10, "Write at least 10 characters.").max(5000),
  scope: z.string().trim().min(10, "Write at least 10 characters.").max(5000),
  client: z.string().trim().max(200),
  location: z.string().trim().max(200),
  start_date: dateField,
  completion_date: dateField,
  featured: z.boolean(),
  sort_order: sortOrderField,
  is_published: z.boolean(),
});

type ProjectValues = z.infer<typeof projectSchema>;

function toValues(record: ProjectRecord | null): ProjectValues {
  return {
    number: record?.number ?? "",
    title: record?.title ?? "",
    slug: record?.slug ?? "",
    category: record?.category ?? "",
    image_url: record?.image_url ?? "",
    image_alt: record?.image_alt ?? "",
    short_description: record?.short_description ?? "",
    brief: record?.brief ?? "",
    scope: record?.scope ?? "",
    client: record?.client ?? "",
    location: record?.location ?? "",
    start_date: record?.start_date ?? "",
    completion_date: record?.completion_date ?? "",
    featured: record?.featured ?? false,
    sort_order: String(record?.sort_order ?? 0),
    is_published: record?.is_published ?? true,
  };
}

function ProjectEditor({ record, path, token, onAuthLost, onSaved, onDeleted }: EditorProps<ProjectRecord>) {
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const form = useForm<ProjectValues>({ resolver: zodResolver(projectSchema), defaultValues: toValues(record) });
  const { register, handleSubmit, watch, setValue, reset, formState } = form;
  const { errors, isDirty } = formState;
  const imageUrl = watch("image_url");
  const title = watch("title");

  const submit = handleSubmit(async (values) => {
    setSave({ kind: "saving" });
    try {
      const saved = await saveRecord<ProjectRecord>(path, token, record?.id ?? null, {
        slug: values.slug || slugify(values.title),
        number: values.number,
        title: values.title,
        category: values.category,
        image_url: nullable(values.image_url),
        image_alt: nullable(values.image_alt),
        short_description: values.short_description,
        brief: values.brief,
        scope: values.scope,
        client: nullable(values.client),
        location: nullable(values.location),
        start_date: nullable(values.start_date),
        completion_date: nullable(values.completion_date),
        featured: values.featured,
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
        <p className="admin-kicker">Project</p>
        <h2>{record ? record.title : "New project"}</h2>
      </header>

      <fieldset className="admin-group">
        <legend>Identity</legend>
        <div className="admin-form-grid">
          <AdminField error={errors.number?.message} id="project-number" label="Number" hint="Shown as 01, 02 …">
            <input className="admin-input" id="project-number" {...register("number")} />
          </AdminField>
          <AdminField error={errors.category?.message} id="project-category" label="Category">
            <input className="admin-input" id="project-category" placeholder="e.g. Agro-processing" {...register("category")} />
          </AdminField>
          <AdminField error={errors.title?.message} id="project-title" label="Title" wide>
            <input className="admin-input" id="project-title" {...register("title")} />
          </AdminField>
          <AdminField
            error={errors.slug?.message}
            hint={record ? "Changing the slug changes the project link." : "Leave blank to generate from the title."}
            id="project-slug"
            label="Link slug"
            wide
          >
            <input className="admin-input" id="project-slug" placeholder={slugify(title) || "project-link"} {...register("slug")} />
          </AdminField>
        </div>
      </fieldset>

      <fieldset className="admin-group">
        <legend>Media</legend>
        <div className="admin-form-split">
          <ImageField
            alt={title || "Project image"}
            error={errors.image_url?.message}
            onAuthLost={onAuthLost}
            onChange={(url) => setValue("image_url", url, { shouldDirty: true })}
            token={token}
            value={imageUrl}
          />
          <div className="admin-form-grid">
            <AdminField error={errors.image_alt?.message} hint="Describes the image for screen readers." id="project-alt" label="Image description" wide>
              <input className="admin-input" id="project-alt" {...register("image_alt")} />
            </AdminField>
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-group">
        <legend>Story</legend>
        <div className="admin-form-grid">
          <AdminField error={errors.short_description?.message} id="project-short" label="Short summary" wide>
            <textarea className="admin-textarea" id="project-short" rows={2} {...register("short_description")} />
          </AdminField>
          <AdminField error={errors.brief?.message} id="project-brief" label="Brief" wide>
            <textarea className="admin-textarea" id="project-brief" rows={5} {...register("brief")} />
          </AdminField>
          <AdminField error={errors.scope?.message} id="project-scope" label="Scope of work" wide>
            <textarea className="admin-textarea" id="project-scope" rows={5} {...register("scope")} />
          </AdminField>
        </div>
      </fieldset>

      <fieldset className="admin-group">
        <legend>Details</legend>
        <div className="admin-form-grid is-three">
          <AdminField error={errors.client?.message} id="project-client" label="Client">
            <input className="admin-input" id="project-client" {...register("client")} />
          </AdminField>
          <AdminField error={errors.location?.message} id="project-location" label="Location">
            <input className="admin-input" id="project-location" {...register("location")} />
          </AdminField>
          <AdminField error={errors.sort_order?.message} hint="Lower numbers appear first." id="project-order" label="Display order">
            <input className="admin-input" id="project-order" inputMode="numeric" {...register("sort_order")} />
          </AdminField>
          <AdminField error={errors.start_date?.message} id="project-start" label="Start date">
            <input className="admin-input" id="project-start" type="date" {...register("start_date")} />
          </AdminField>
          <AdminField error={errors.completion_date?.message} id="project-finish" label="Completion date">
            <input className="admin-input" id="project-finish" type="date" {...register("completion_date")} />
          </AdminField>
        </div>
        <div className="admin-toggles">
          <label className="admin-check">
            <input type="checkbox" {...register("featured")} />
            <span>Featured on the home page</span>
          </label>
          <label className="admin-check">
            <input type="checkbox" {...register("is_published")} />
            <span>Published on the projects page</span>
          </label>
        </div>
      </fieldset>

      <footer className="admin-editor-foot">
        {record ? (
          <DeleteRecordButton
            id={record.id}
            label="project"
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

export function ProjectsPanel({ token, onAuthLost }: { token: string; onAuthLost: () => void }) {
  return (
    <ResourcePanel<ProjectRecord>
      describe={(project) => ({ title: project.title, meta: `${project.number} · ${project.category}` })}
      Editor={ProjectEditor}
      description="Projects shown on the public projects page and the home page."
      noun="Project"
      onAuthLost={onAuthLost}
      path="/projects"
      title="Projects"
      token={token}
    />
  );
}
