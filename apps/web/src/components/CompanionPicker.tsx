import { useState } from "react";
import type { CompanionDTO } from "@english-level/contracts";
import { chooseCompanion } from "../api/productClient.ts";

/**
 * Choosing a study buddy. There is deliberately nothing here about needs,
 * mood or health — a companion cannot be neglected, so it can never be
 * used to guilt someone into opening the app.
 */
export function CompanionPicker({
  choices,
  onChosen,
  title = "Кто будет заниматься с тобой",
}: {
  choices: CompanionDTO[];
  onChosen: (companion: CompanionDTO) => void;
  title?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      onChosen(await chooseCompanion(id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel stack-sm">
      <span className="caption">{title}</span>
      <p className="small muted">
        Компаньона не нужно кормить или лечить. Он просто рядом.
      </p>
      {choices.map((companion) => (
        <button
          key={companion.id}
          type="button"
          className="row-card"
          disabled={busy}
          onClick={() => pick(companion.id)}
        >
          <span className="row-card__body">
            <span className="row-card__title">{companion.name}</span>
            <span className="row-card__meta">{companion.tagline}</span>
          </span>
          <span className="row-card__chevron" aria-hidden="true">
            →
          </span>
        </button>
      ))}
    </div>
  );
}
