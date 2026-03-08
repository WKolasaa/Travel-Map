"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTrip, updatePlace, updateTrip, uploadAdminMedia, type TripInput } from "@/lib/api";
import { validateTripForm, type FormErrors } from "@/lib/admin-validation";
import type { AdminGroup } from "@/lib/auth";
import type { ContentStatus, Place, Trip, Visibility } from "@/lib/types";
import { AdminContentActions } from "@/components/admin/admin-content-actions";

type TripFormProps = {
  initialTrip?: Trip;
  availablePlaces?: Place[];
  groups: AdminGroup[];
};

type TripField = "title" | "slug" | "summary" | "description" | "startDate" | "endDate" | "color" | "coverImageUrl" | "groupIds";

type RoutePlace = Pick<Place, "id" | "slug" | "title" | "city" | "country" | "startDate" | "endDate" | "tripId" | "tripOrder" | "status">;

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

function buildInitialRoutePlaces(initialTrip: Trip | undefined, availablePlaces: Place[] | undefined): RoutePlace[] {
  if (!initialTrip || !availablePlaces) {
    return [];
  }

  return availablePlaces
    .filter((place) => place.tripId === initialTrip.id)
    .sort((left, right) => {
      if (left.tripOrder !== right.tripOrder) {
        return left.tripOrder - right.tripOrder;
      }
      return left.startDate.localeCompare(right.startDate) || left.title.localeCompare(right.title);
    })
    .map((place) => ({
      id: place.id,
      slug: place.slug,
      title: place.title,
      city: place.city,
      country: place.country,
      startDate: place.startDate,
      endDate: place.endDate,
      tripId: place.tripId,
      tripOrder: place.tripOrder,
      status: place.status
    }));
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);
  return next;
}

export function TripForm({ initialTrip, availablePlaces, groups }: TripFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors<TripField>>({});
  const [form, setForm] = useState({
    title: initialTrip?.title ?? "",
    slug: initialTrip?.slug ?? "",
    summary: initialTrip?.summary ?? "",
    description: initialTrip?.description ?? "",
    startDate: initialTrip?.startDate ?? "",
    endDate: initialTrip?.endDate ?? "",
    routeEnabled: initialTrip?.routeEnabled ?? true,
    color: initialTrip?.color ?? "#7dd8c6",
    coverImageUrl: initialTrip?.coverImageUrl ?? "",
    tags: initialTrip?.tags.join(", ") ?? "",
    visibility: initialTrip?.visibility ?? "public",
    groupIds: initialTrip?.groupIds ?? [],
    status: initialTrip?.status ?? "published"
  });
  const [routePlaces, setRoutePlaces] = useState<RoutePlace[]>(() => buildInitialRoutePlaces(initialTrip, availablePlaces));
  const [selectedPlaceSlug, setSelectedPlaceSlug] = useState("");

  const candidatePlaces = useMemo(() => {
    if (!initialTrip || !availablePlaces) {
      return [];
    }

    const assignedIds = new Set(routePlaces.map((place) => place.id));
    return availablePlaces
      .filter((place) => !assignedIds.has(place.id))
      .sort((left, right) => {
        const leftTripId = left.tripId ?? "";
        const rightTripId = right.tripId ?? "";
        if (leftTripId !== rightTripId) {
          return leftTripId.localeCompare(rightTripId);
        }
        return left.startDate.localeCompare(right.startDate) || left.title.localeCompare(right.title);
      });
  }, [availablePlaces, initialTrip, routePlaces]);

  function clearFieldError(field: TripField) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (["title", "slug", "summary", "description", "startDate", "endDate", "color", "coverImageUrl"].includes(field)) {
      clearFieldError(field as TripField);
    }
    setError(null);
    setSuccessMessage(null);
  }

  function validateCurrentForm(): boolean {
    const nextErrors = validateTripForm(form);
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function toggleGroupId(groupId: string) {
    setForm((current) => ({
      ...current,
      groupIds: current.groupIds.includes(groupId)
        ? current.groupIds.filter((id) => id !== groupId)
        : [...current.groupIds, groupId]
    }));
    clearFieldError("groupIds");
    setError(null);
    setSuccessMessage(null);
  }

  function uploadCover(file: File) {
    setUploadError(null);
    setSuccessMessage(null);
    startUploadTransition(async () => {
      try {
        const url = await uploadAdminMedia(file);
        setForm((current) => ({ ...current, coverImageUrl: url }));
        clearFieldError("coverImageUrl");
      } catch (uploadIssue) {
        setUploadError(uploadIssue instanceof Error ? uploadIssue.message : "Upload failed");
      }
    });
  }

  function moveRoutePlace(index: number, direction: -1 | 1) {
    setRoutePlaces((current) => moveItem(current, index, direction));
    setError(null);
    setSuccessMessage(null);
  }

  function addPlaceToRoute() {
    if (!selectedPlaceSlug || !availablePlaces) {
      return;
    }

    const place = availablePlaces.find((entry) => entry.slug === selectedPlaceSlug);
    if (!place) {
      return;
    }

    setRoutePlaces((current) => ([
      ...current,
      {
        id: place.id,
        slug: place.slug,
        title: place.title,
        city: place.city,
        country: place.country,
        startDate: place.startDate,
        endDate: place.endDate,
        tripId: place.tripId,
        tripOrder: current.length + 1,
        status: place.status
      }
    ]));
    setSelectedPlaceSlug("");
    setError(null);
    setSuccessMessage(null);
  }

  function removePlaceFromRoute(placeId: string) {
    setRoutePlaces((current) => current.filter((place) => place.id !== placeId));
    setError(null);
    setSuccessMessage(null);
  }

  async function syncRoutePlaces(tripId: string) {
    if (!initialTrip) {
      return;
    }

    const originalRoute = buildInitialRoutePlaces(initialTrip, availablePlaces);
    const originalById = new Map(originalRoute.map((place) => [place.id, place]));

    for (const [index, place] of routePlaces.entries()) {
      const nextOrder = index + 1;
      const original = originalById.get(place.id);
      const tripChanged = place.tripId !== tripId;
      const orderChanged = original?.tripOrder !== nextOrder || original?.tripId !== tripId;

      if (!tripChanged && !orderChanged) {
        continue;
      }

      await updatePlace(place.slug, {
        trip_id: tripId,
        trip_order: nextOrder
      });
    }

    const nextRouteIds = new Set(routePlaces.map((place) => place.id));
    for (const place of originalRoute) {
      if (nextRouteIds.has(place.id)) {
        continue;
      }

      await updatePlace(place.slug, {
        trip_id: null,
        trip_order: 0
      });
    }
  }

  const submit = () => {
    setError(null);
    setSuccessMessage(null);
    if (!validateCurrentForm()) {
      setError("Fix the highlighted fields before saving.");
      return;
    }

    const payload: TripInput = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      summary: form.summary.trim(),
      description: form.description.trim(),
      start_date: form.startDate,
      end_date: form.endDate,
      route_enabled: form.routeEnabled,
      color: form.color.trim(),
      cover_image_url: form.coverImageUrl.trim(),
      tags: splitList(form.tags),
      visibility: form.visibility as Visibility,
      group_ids: form.visibility === "group" ? form.groupIds : [],
      status: form.status as ContentStatus
    };

    startTransition(async () => {
      try {
        const saved = initialTrip ? await updateTrip(initialTrip.slug, payload) : await createTrip(payload);
        if (initialTrip) {
          await syncRoutePlaces(saved.id);
        }
        setSuccessMessage(initialTrip ? "Trip saved." : "Trip created.");
        router.push(`/admin/trips/${saved.slug}`);
        router.refresh();
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : "Save failed.");
      }
    });
  };

  const isBusy = isPending || isUploading;

  return (
    <section className="rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-mint/70">trip editor</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-cloud">{initialTrip ? "Edit trip" : "Create trip"}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {initialTrip ? <AdminContentActions kind="trip" slug={initialTrip.slug} status={form.status as ContentStatus} /> : null}
          <button onClick={submit} disabled={isBusy} className="rounded-full bg-accentBrand px-5 py-3 text-sm font-semibold text-ink disabled:opacity-50">{isPending ? "Saving..." : "Save trip"}</button>
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-mint">{successMessage}</p> : null}
      {uploadError ? <p className="mt-2 text-sm text-red-300">{uploadError}</p> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[["Title","title"],["Slug","slug"],["Start date","startDate"],["End date","endDate"],["Color","color"]].map(([label,key]) => (
          <label key={key} className="block"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">{label}</span><input value={String(form[key as keyof typeof form])} onChange={(event) => updateField(key as keyof typeof form, event.target.value as never)} aria-invalid={Boolean(fieldErrors[key as TripField])} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" /><FieldError message={fieldErrors[key as TripField]} /></label>
        ))}
        <label className="flex items-center gap-3 pt-7"><input type="checkbox" checked={form.routeEnabled} onChange={(event) => updateField("routeEnabled", event.target.checked)} /><span className="text-sm text-cloud">Route enabled</span></label>
        <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Visibility</span><select value={form.visibility} onChange={(event) => updateField("visibility", event.target.value as Visibility)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand"><option value="public">public</option><option value="authenticated">authenticated</option><option value="group">group</option><option value="admin_only">admin_only</option></select></label>
        <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Status</span><select value={form.status} onChange={(event) => updateField("status", event.target.value as ContentStatus)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand"><option value="draft">draft</option><option value="published">published</option><option value="hidden">hidden</option><option value="archived">archived</option></select></label>
        <div className="block md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Visible groups</span><div className="rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud"><div className="grid gap-2 md:grid-cols-2">{groups.filter((group) => group.status === "active").map((group) => (<label key={group.id} className="flex items-center gap-3"><input type="checkbox" checked={form.groupIds.includes(group.id)} onChange={() => toggleGroupId(group.id)} disabled={form.visibility !== "group"} />{group.name}</label>))}{groups.filter((group) => group.status === "active").length === 0 ? <span className="text-cloud/55">No active groups available</span> : null}</div></div><FieldError message={fieldErrors.groupIds} /></div>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Summary</span><textarea value={form.summary} onChange={(event) => updateField("summary", event.target.value)} aria-invalid={Boolean(fieldErrors.summary)} rows={3} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" /><FieldError message={fieldErrors.summary} /></label>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Description</span><textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} aria-invalid={Boolean(fieldErrors.description)} rows={6} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" /><FieldError message={fieldErrors.description} /></label>
        <div className="block md:col-span-2">
          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-mint/70">Cover image</div>
          <div className="rounded-[24px] border border-line bg-ink/40 p-4">
            <input value={form.coverImageUrl} onChange={(event) => updateField("coverImageUrl", event.target.value)} placeholder="https://... or upload below" aria-invalid={Boolean(fieldErrors.coverImageUrl)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" />
            <FieldError message={fieldErrors.coverImageUrl} />
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => coverInputRef.current?.click()} disabled={isUploading} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">{isUploading ? "Uploading cover..." : "Upload cover image"}</button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadCover(file);
                event.target.value = "";
              }} />
            </div>
            {form.coverImageUrl ? (
              <div className="mt-4 overflow-hidden rounded-[20px] border border-line/60 bg-panel/60 p-3">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                  <Image src={form.coverImageUrl} alt="Trip cover preview" fill className="object-cover" unoptimized />
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Tags</span><input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" /></label>
      </div>

      <div className="mt-8 rounded-[24px] border border-line/60 bg-ink/35 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-mint/70">route management</p>
            <h3 className="mt-2 text-xl font-semibold text-cloud">Ordered stops for this trip</h3>
            <p className="mt-2 max-w-2xl text-sm text-cloud/70">
              Places can now be detached from a trip. Use this editor to reorder stops, add an existing place, or remove a stop back to the unassigned pool.
            </p>
          </div>
        </div>

        {!initialTrip ? (
          <p className="mt-5 rounded-2xl border border-line/60 bg-panel/60 px-4 py-3 text-sm text-cloud/75">
            Save the trip first, then come back here to manage its route stops.
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="space-y-3">
              {routePlaces.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line/70 px-4 py-5 text-sm text-cloud/65">
                  No places are assigned to this trip yet.
                </div>
              ) : (
                routePlaces.map((place, index) => (
                  <div key={place.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-line/60 bg-panel/65 px-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-accentBrand px-3 py-1 text-xs font-semibold text-ink">Stop {index + 1}</span>
                        <p className="font-semibold text-cloud">{place.title}</p>
                        <span className="text-xs uppercase tracking-[0.2em] text-cloud/50">{place.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-cloud/70">{place.city}, {place.country} · {place.startDate} to {place.endDate}</p>
                      {place.tripId !== initialTrip.id ? (
                        <p className="mt-2 text-xs text-mint/80">Will be reassigned into this trip on save.</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveRoutePlace(index, -1)} disabled={isBusy || index === 0} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-40">Up</button>
                      <button type="button" onClick={() => moveRoutePlace(index, 1)} disabled={isBusy || index === routePlaces.length - 1} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-40">Down</button>
                      <button type="button" onClick={() => removePlaceFromRoute(place.id)} disabled={isBusy} className="rounded-full border border-red-400/50 px-4 py-2 text-sm text-red-200 disabled:opacity-40">Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-[22px] border border-line/60 bg-panel/55 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-mint/70">Add existing place</p>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <select value={selectedPlaceSlug} onChange={(event) => setSelectedPlaceSlug(event.target.value)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  <option value="">Select a place to append to the route</option>
                  {candidatePlaces.map((place) => (
                    <option key={place.id} value={place.slug}>
                      {place.title} · {place.city}, {place.country} · current trip {place.tripId ?? "unassigned"}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={addPlaceToRoute} disabled={isBusy || !selectedPlaceSlug} className="rounded-full border border-line/70 px-4 py-3 text-sm font-semibold text-cloud/80 disabled:opacity-40">
                  Add stop
                </button>
              </div>
              <p className="mt-3 text-xs text-cloud/55">
                Adding a place here reassigns it from its current trip. Removing a stop will leave it unassigned when you save.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}