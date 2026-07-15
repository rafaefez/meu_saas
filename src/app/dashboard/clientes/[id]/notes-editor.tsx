"use client";

import { useState, useTransition } from "react";
import { updateCustomerNotes } from "./actions";

export default function NotesEditor({
  customerId,
  initialNotes,
}: {
  customerId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateCustomerNotes(customerId, notes);
      setSaved(true);
    });
  }

  return (
    <div>
      <label className="text-sm font-medium text-neutral-700 mb-1 block">Observações</label>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        rows={3}
        placeholder="Preferências, alergias, combinados..."
        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-neutral-900"
      />
      {!saved && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="mt-2 text-sm bg-neutral-900 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar observação"}
        </button>
      )}
    </div>
  );
}
