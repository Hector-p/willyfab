"use client";

import { useState, type ComponentType } from "react";

import { useCollection } from "./admin-ui";

export type EditorProps<T> = {
  record: T | null;
  path: string;
  token: string;
  onAuthLost: () => void;
  onSaved: (record: T) => void;
  onDeleted: (id: number) => void;
};

type ResourcePanelProps<T extends RecordShape> = {
  title: string;
  description: string;
  noun: string;
  path: string;
  token: string;
  onAuthLost: () => void;
  describe: (item: T) => { title: string; meta: string };
  Editor: ComponentType<EditorProps<T>>;
};

type RecordShape = { id: number; is_published: boolean; sort_order: number };

export function ResourcePanel<T extends RecordShape>({
  title,
  description,
  noun,
  path,
  token,
  onAuthLost,
  describe,
  Editor,
}: ResourcePanelProps<T>) {
  const { items, setItems, error, reload } = useCollection<T>(token, path, onAuthLost);
  const [selection, setSelection] = useState<number | "new" | null>(null);

  const selected = typeof selection === "number" ? (items?.find((item) => item.id === selection) ?? null) : null;
  const editorOpen = selection === "new" || selected !== null;

  function handleSaved(saved: T) {
    setItems((current) => {
      const list = current ?? [];
      const exists = list.some((item) => item.id === saved.id);
      const next = exists ? list.map((item) => (item.id === saved.id ? saved : item)) : [...list, saved];
      return next.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    });
    setSelection(saved.id);
  }

  function handleDeleted(id: number) {
    setItems((current) => (current ?? []).filter((item) => item.id !== id));
    setSelection(null);
  }

  return (
    <div className="admin-workspace">
      <section className="admin-card admin-card-list" aria-label={`${title} list`}>
        <header className="admin-card-head">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="admin-button admin-button-primary" onClick={() => setSelection("new")} type="button">
            New {noun}
          </button>
        </header>

        {error ? (
          <div className="admin-panel-state">
            <p className="admin-notice admin-notice-error" role="alert">{error}</p>
            <button className="admin-button admin-button-ghost" onClick={() => void reload()} type="button">
              Try again
            </button>
          </div>
        ) : items === null ? (
          <p className="admin-panel-state admin-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="admin-panel-state admin-muted">No {noun.toLowerCase()}s yet. Create the first one.</p>
        ) : (
          <ul className="admin-list">
            {items.map((item) => {
              const info = describe(item);
              return (
                <li key={item.id}>
                  <button
                    aria-current={selection === item.id ? "true" : undefined}
                    className="admin-list-item"
                    onClick={() => setSelection(item.id)}
                    type="button"
                  >
                    <span className="admin-list-title">{info.title}</span>
                    <span className="admin-list-meta">{info.meta}</span>
                    <span className={`admin-status${item.is_published ? " is-live" : ""}`}>
                      {item.is_published ? "Published" : "Draft"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="admin-card admin-card-editor" aria-label={`${noun} editor`}>
        {editorOpen ? (
          <Editor
            key={String(selection)}
            onAuthLost={onAuthLost}
            onDeleted={handleDeleted}
            onSaved={handleSaved}
            path={path}
            record={selection === "new" ? null : selected}
            token={token}
          />
        ) : (
          <div className="admin-empty-editor">
            <p className="admin-kicker">{title}</p>
            <h2>Select an item to edit</h2>
            <p className="admin-muted">Choose one from the list, or create a new {noun.toLowerCase()}.</p>
          </div>
        )}
      </section>
    </div>
  );
}
