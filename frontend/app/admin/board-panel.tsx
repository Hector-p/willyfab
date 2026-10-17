"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { describeError, isAuthLost, saveRecord, type BoardMemberRecord } from "./admin-api";
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

const boardSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(160),
  position: z.string().trim().min(2, "Enter at least 2 characters.").max(160),
  image_url: z.string().max(500),
  image_alt: z.string().trim().max(300),
  sort_order: sortOrderField,
  is_published: z.boolean(),
});

type BoardValues = z.infer<typeof boardSchema>;

function toValues(record: BoardMemberRecord | null): BoardValues {
  return {
    name: record?.name ?? "",
    position: record?.position ?? "",
    image_url: record?.image_url ?? "",
    image_alt: record?.image_alt ?? "",
    sort_order: String(record?.sort_order ?? 0),
    is_published: record?.is_published ?? true,
  };
}

function BoardEditor({ record, path, token, onAuthLost, onSaved, onDeleted }: EditorProps<BoardMemberRecord>) {
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const form = useForm<BoardValues>({ resolver: zodResolver(boardSchema), defaultValues: toValues(record) });
  const { register, handleSubmit, watch, setValue, reset, formState } = form;
  const { errors, isDirty } = formState;
  const imageUrl = watch("image_url");
  const name = watch("name");

  const submit = handleSubmit(async (values) => {
    setSave({ kind: "saving" });
    try {
      const saved = await saveRecord<BoardMemberRecord>(path, token, record?.id ?? null, {
        name: values.name,
        position: values.position,
        image_url: nullable(values.image_url),
        image_alt: nullable(values.image_alt),
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
        <p className="admin-kicker">Board member</p>
        <h2>{record ? record.name : "New board member"}</h2>
      </header>

      <div className="admin-form-split">
        <ImageField
          alt={name || "Board member photo"}
          error={errors.image_url?.message}
          onAuthLost={onAuthLost}
          onChange={(url) => setValue("image_url", url, { shouldDirty: true })}
          token={token}
          value={imageUrl}
        />

        <div className="admin-form-grid">
          <AdminField error={errors.name?.message} id="board-name" label="Full name">
            <input className="admin-input" id="board-name" {...register("name")} />
          </AdminField>
          <AdminField error={errors.position?.message} id="board-position" label="Position">
            <input className="admin-input" id="board-position" placeholder="e.g. Chairman" {...register("position")} />
          </AdminField>
          <AdminField
            error={errors.image_alt?.message}
            hint="Describes the photo for screen readers."
            id="board-alt"
            label="Photo description"
            wide
          >
            <input className="admin-input" id="board-alt" {...register("image_alt")} />
          </AdminField>
          <AdminField
            error={errors.sort_order?.message}
            hint="Lower numbers appear first."
            id="board-order"
            label="Display order"
          >
            <input className="admin-input" id="board-order" inputMode="numeric" {...register("sort_order")} />
          </AdminField>
          <label className="admin-check">
            <input type="checkbox" {...register("is_published")} />
            <span>Published on the About page</span>
          </label>
        </div>
      </div>

      <footer className="admin-editor-foot">
        {record ? (
          <DeleteRecordButton
            id={record.id}
            label="member"
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
          <button className="admin-button admin-button-primary" disabled={save.kind === "saving" || (record !== null && !isDirty)} type="submit">
            {save.kind === "saving" ? "Saving…" : "Save changes"}
          </button>
        </div>
      </footer>
    </form>
  );
}

export function BoardPanel({ token, onAuthLost }: { token: string; onAuthLost: () => void }) {
  return (
    <ResourcePanel<BoardMemberRecord>
      describe={(member) => ({ title: member.name, meta: `${member.position} · order ${member.sort_order}` })}
      Editor={BoardEditor}
      description="Names, positions and photos shown in the About page board section."
      noun="board member"
      onAuthLost={onAuthLost}
      path="/board-members"
      title="Board members"
      token={token}
    />
  );
}
