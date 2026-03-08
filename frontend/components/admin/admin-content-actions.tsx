"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePlace, deleteTrip, updatePlace, updateTrip } from "@/lib/api";
import type { ContentStatus } from "@/lib/types";

type AdminContentActionsProps =
  | { kind: "place"; slug: string; status: ContentStatus }
  | { kind: "trip"; slug: string; status: ContentStatus };

export function AdminContentActions(props: AdminContentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function updateStatus(status: ContentStatus) {
    setActionError(null);
    startTransition(async () => {
      try {
        if (props.kind === "place") {
          await updatePlace(props.slug, { status });
        } else {
          await updateTrip(props.slug, { status });
        }
        router.refresh();
      } catch (issue) {
        setActionError(issue instanceof Error ? issue.message : "Status update failed.");
      }
    });
  }

  function archive() {
    const ok = window.confirm(
      `Archive this ${props.kind}? It will disappear from public views and can be restored later.`
    );
    if (!ok) {
      return;
    }
    updateStatus("archived");
  }

  function restore() {
    updateStatus("draft");
  }

  function removePermanently() {
    const ok = window.confirm(
      `Permanently delete this archived ${props.kind}? This cannot be undone.`
    );
    if (!ok) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        if (props.kind === "place") {
          await deletePlace(props.slug);
          router.push("/admin/places");
        } else {
          await deleteTrip(props.slug);
          router.push("/admin/trips");
        }
        router.refresh();
      } catch (issue) {
        setActionError(issue instanceof Error ? issue.message : "Delete failed.");
      }
    });
  }

  const nextVisibilityStatus: ContentStatus = props.status === "hidden" ? "published" : "hidden";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {props.status === "archived" ? (
          <button type="button" disabled={isPending} onClick={restore} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">
            Restore to draft
          </button>
        ) : (
          <button type="button" disabled={isPending} onClick={() => updateStatus(nextVisibilityStatus)} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">
            {props.status === "hidden" ? "Unhide" : "Hide"}
          </button>
        )}
        {props.status !== "archived" ? (
          props.status !== "draft" ? (
            <button type="button" disabled={isPending} onClick={() => updateStatus("draft")} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">
              Move to draft
            </button>
          ) : (
            <button type="button" disabled={isPending} onClick={() => updateStatus("published")} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">
              Publish
            </button>
          )
        ) : null}
        {props.status !== "archived" ? (
          <button type="button" disabled={isPending} onClick={archive} className="rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-100 disabled:opacity-50">
            Archive
          </button>
        ) : (
          <button type="button" disabled={isPending} onClick={removePermanently} className="rounded-full border border-red-400/50 px-4 py-2 text-sm text-red-200 disabled:opacity-50">
            {isPending ? "Working..." : "Delete permanently"}
          </button>
        )}
      </div>
      {actionError ? <p className="text-xs text-red-300">{actionError}</p> : null}
    </div>
  );
}