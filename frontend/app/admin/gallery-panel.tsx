"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { describeError, isAuthLost, saveRecord, type GalleryRecord } from "./admin-api";
import {
  AdminField,
  DeleteRecordButton,
  ImageField,
  SaveStatus,
  nullable,
  sortOrderField,
  type SaveState,
} from "./admin-ui";
import { ResourcePanel, type EditorProps } from "./resource-panel";

const gallerySchema = z.object({
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(200),
  category: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  image_url: z.string().trim().min(1, "Upload a photo for this item."),
  image_alt: z.string().trim().min(3, "Describe the photo in at least 3 characters.").max(300),
  caption: z.string().trim().max(500),
  featured: z.boolean(),
  sort_order: sortOrderField,
  is_published: z.boolean(),
});

type GalleryValues = z.infer<typeof gallerySchema>;

function toValues(record: GalleryRecord | null): GalleryValues {
  return {
    title: record?.title ?? "",
    category: record?.category ?? "",
    image_url: record?.image_url ?? "",
    image_alt: record?.image_alt ?? "",
    caption: record?.caption ?? "",
    featured: record?.featured ?? false,
    sort_order: String(record?.sort_order ?? 0),
    is_published: record?.is_published ?? true,
  };
}

function GalleryEditor({ record, path, token, onAuthLost, onSaved, onDeleted }: EditorProps<GalleryRecord>) {
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const form = useForm<GalleryValues>({ resolver: zodResolver(gallerySchema), defaultValues: toValues(record) });
  const { register, handleSubmit, watch, setValue, reset, formState } = form;
  const { errors, isDirty } = formState;
  const imageUrl = watch("image_url");
  const title = watch("title");

  const submit = handleSubmit(async (values) => {
    setSave({ kind: "saving" });
    try {
      const saved = await saveRecord<GalleryRecord>(path, token, record?.id ?? null, {
        title: values.title,
        category: values.category,
        image_url: values.image_url,
        image_alt: values.image_alt,
        caption: nullable(values.caption),
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

  return (
    <form className="admin-form" noValidate onSubmit={submit}>
      <header className="admin-editor-head">
        <p className="admin-kicker">Gallery</p>
        <h2>{record ? record.title : "New gallery item"}</h2>
      </header>

      <div className="admin-form-split">
        <ImageField
          alt={title || "Gallery photo"}
          error={errors.image_url?.message}
          onAuthLost={onAuthLost}
          onChange={(url) => setValue("image_url", url, { shouldDirty: true, shouldValidate: true })}
          token={token}
          value={imageUrl}
        />

        <div className="admin-form-grid">
          <AdminField error={errors.title?.message} id="gallery-title" label="Title">
            <input className="admin-input" id="gallery-title" {...register("title")} />
          </AdminField>
          <AdminField
            error={errors.category?.message}
            hint="For example Fabrication, Installation or Equipment."
            id="gallery-category"
            label="Category"
          >
            <input className="admin-input" id="gallery-category" {...register("category")} />
          </AdminField>
          <AdminField
            error={errors.image_alt?.message}
            hint="Describes the photo for screen readers."
            id="gallery-alt"
            label="Photo description"
            wide
          >
            <input className="admin-input" id="gallery-alt" {...register("image_alt")} />
          </AdminField>
          <AdminField
            error={errors.caption?.message}
            hint="Optional. Stored with the photo for later use on the site."
            id="gallery-caption"
            label="Caption"
            wide
          >
            <input className="admin-input" id="gallery-caption" {...register("caption")} />
          </AdminField>
          <AdminField
            error={errors.sort_order?.message}
            hint="Lower numbers appear first."
            id="gallery-order"
            label="Display order"
          >
            <input className="admin-input" id="gallery-order" inputMode="numeric" {...register("sort_order")} />
          </AdminField>
          <label className="admin-check">
            <input type="checkbox" {...register("featured")} />
            <span>Featured</span>
          </label>
          <label className="admin-check">
            <input type="checkbox" {...register("is_published")} />
            <span>Published on the gallery page</span>
          </label>
        </div>
      </div>

      <footer className="admin-editor-foot">
        {record ? (
          <DeleteRecordButton
            id={record.id}
            label="gallery item"
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
          <button
            className="admin-button admin-button-primary"
            disabled={save.kind === "saving" || (record !== null && !isDirty)}
            type="submit"
          >
            {save.kind === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </footer>
    </form>
  );
}

export function GalleryPanel({ token, onAuthLost }: { token: string; onAuthLost: () => void }) {
  return (
    <ResourcePanel<GalleryRecord>
      describe={(image) => ({
        title: image.title,
        meta: `${image.category}${image.featured ? " · Featured" : ""} · order ${image.sort_order}`,
      })}
      Editor={GalleryEditor}
      description="Photos shown on the public gallery page. The first four published photos fill the feature layout."
      noun="gallery item"
      onAuthLost={onAuthLost}
      path="/gallery"
      title="Gallery"
      token={token}
    />
  );
}
