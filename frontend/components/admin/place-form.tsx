"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlace, updatePlace, uploadAdminMedia, type PlaceInput } from "@/lib/api";
import { validatePlaceForm, type FormErrors } from "@/lib/admin-validation";
import type { AdminGroup } from "@/lib/auth";
import type { ContentStatus, Place, Trip, Visibility } from "@/lib/types";
import { AdminContentActions } from "@/components/admin/admin-content-actions";

type PlaceFormProps = {
  trips: Trip[];
  groups: AdminGroup[];
  availablePlaces?: Place[];
  initialPlace?: Place;
};

type PlaceFormState = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  startDate: string;
  endDate: string;
  markerColor: string;
  tripId: string;
  imageUrl: string;
  gallery: string[];
  tags: string;
  companions: string;
  visibility: Visibility;
  groupIds: string[];
  rating: string;
  tripOrder: string;
  status: ContentStatus;
};

type PlaceField = keyof Pick<PlaceFormState, "title" | "slug" | "summary" | "description" | "city" | "country" | "latitude" | "longitude" | "startDate" | "endDate" | "markerColor" | "tripId" | "imageUrl" | "rating" | "tripOrder" | "groupIds"> | "gallery";

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null;
}

export function PlaceForm({ trips, groups, availablePlaces = [], initialPlace }: PlaceFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingCover, startCoverUpload] = useTransition();
  const [isUploadingGallery, startGalleryUpload] = useTransition();
  const [isAssignmentPending, startAssignmentTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [galleryDraft, setGalleryDraft] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors<PlaceField>>({});
  const [assignmentTargetTripId, setAssignmentTargetTripId] = useState(initialPlace?.tripId ?? "");
  const [form, setForm] = useState<PlaceFormState>({
    title: initialPlace?.title ?? "",
    slug: initialPlace?.slug ?? "",
    summary: initialPlace?.summary ?? "",
    description: initialPlace?.description ?? "",
    city: initialPlace?.city ?? "",
    country: initialPlace?.country ?? "",
    latitude: String(initialPlace?.latitude ?? ""),
    longitude: String(initialPlace?.longitude ?? ""),
    startDate: initialPlace?.startDate ?? "",
    endDate: initialPlace?.endDate ?? "",
    markerColor: initialPlace?.markerColor ?? "#7dd8c6",
    tripId: initialPlace?.tripId ?? "",
    imageUrl: initialPlace?.imageUrl ?? "",
    gallery: initialPlace?.gallery ?? [],
    tags: initialPlace?.tags.join(", ") ?? "",
    companions: initialPlace?.companions.join(", ") ?? "",
    visibility: initialPlace?.visibility ?? "public",
    groupIds: initialPlace?.groupIds ?? [],
    rating: String(initialPlace?.rating ?? 0),
    tripOrder: String(initialPlace?.tripOrder ?? 0),
    status: initialPlace?.status ?? "published"
  });

  const currentTrip = trips.find((trip) => trip.id === form.tripId) ?? null;
  const assignmentTargetTrip = trips.find((trip) => trip.id === assignmentTargetTripId) ?? null;
  const nextAssignmentOrder = useMemo(() => {
    if (!assignmentTargetTripId) {
      return 0;
    }

    const relevantPlaces = availablePlaces.filter((place) => place.tripId === assignmentTargetTripId && place.slug !== initialPlace?.slug);
    const maxTripOrder = relevantPlaces.reduce((max, place) => Math.max(max, place.tripOrder), 0);
    return maxTripOrder + 1;
  }, [assignmentTargetTripId, availablePlaces, initialPlace?.slug]);

  function clearFieldError(field: PlaceField) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function updateField<K extends keyof PlaceFormState>(field: K, value: PlaceFormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "tripId" && value === "" ? { tripOrder: "0" } : {})
    }));
    if (field in fieldErrors) {
      clearFieldError(field as PlaceField);
    }
    if (field === "tripId" && typeof value === "string") {
      setAssignmentTargetTripId(value);
    }
    setError(null);
    setSuccessMessage(null);
  }

  function validateCurrentForm(): boolean {
    const nextErrors = validatePlaceForm(form);
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

  function addGalleryUrl(value: string) {
    const url = value.trim();
    if (!url) {
      return;
    }
    const nextGallery = form.gallery.includes(url) ? form.gallery : [...form.gallery, url];
    setForm((current) => ({ ...current, gallery: nextGallery }));
    setGalleryDraft("");
    clearFieldError("gallery");
    setError(null);
    setSuccessMessage(null);
  }

  function removeGalleryUrl(url: string) {
    setForm((current) => ({
      ...current,
      gallery: current.gallery.filter((item) => item !== url),
      imageUrl: current.imageUrl === url ? current.gallery.find((item) => item !== url) ?? "" : current.imageUrl
    }));
    setError(null);
    setSuccessMessage(null);
  }

  function uploadCover(file: File) {
    setUploadError(null);
    setSuccessMessage(null);
    startCoverUpload(async () => {
      try {
        const url = await uploadAdminMedia(file);
        setForm((current) => ({
          ...current,
          imageUrl: url,
          gallery: current.gallery.includes(url) ? current.gallery : [url, ...current.gallery]
        }));
        clearFieldError("imageUrl");
        clearFieldError("gallery");
      } catch (uploadIssue) {
        setUploadError(uploadIssue instanceof Error ? uploadIssue.message : "Cover upload failed");
      }
    });
  }

  function uploadGalleryFiles(files: FileList) {
    setUploadError(null);
    setSuccessMessage(null);
    startGalleryUpload(async () => {
      try {
        const urls = await Promise.all(Array.from(files).map((file) => uploadAdminMedia(file)));
        setForm((current) => ({
          ...current,
          imageUrl: current.imageUrl || urls[0] || current.imageUrl,
          gallery: [...current.gallery, ...urls.filter((url) => !current.gallery.includes(url))]
        }));
        clearFieldError("gallery");
        if (!form.imageUrl && urls[0]) {
          clearFieldError("imageUrl");
        }
      } catch (uploadIssue) {
        setUploadError(uploadIssue instanceof Error ? uploadIssue.message : "Gallery upload failed");
      }
    });
  }

  function applyTripSelection(tripId: string, tripOrder: number) {
    setForm((current) => ({
      ...current,
      tripId,
      tripOrder: String(tripOrder)
    }));
    clearFieldError("tripId");
    clearFieldError("tripOrder");
    setAssignmentTargetTripId(tripId);
    setError(null);
    setSuccessMessage(tripId ? `Prepared move to ${trips.find((trip) => trip.id === tripId)?.title ?? "selected trip"}. Save to apply.` : "Prepared detach. Save to keep this place standalone.");
  }

  function quickDetach() {
    applyTripSelection("", 0);
  }

  function quickMoveToSelectedTrip() {
    if (!assignmentTargetTripId) {
      setError("Select a target trip before moving this place.");
      return;
    }
    applyTripSelection(assignmentTargetTripId, nextAssignmentOrder);
  }

  function quickPersistAssignment(tripId: string, tripOrder: number) {
    if (!initialPlace) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    startAssignmentTransition(async () => {
      try {
        const saved = await updatePlace(initialPlace.slug, {
          trip_id: tripId || null,
          trip_order: tripOrder
        });
        setForm((current) => ({
          ...current,
          tripId: saved.tripId ?? "",
          tripOrder: String(saved.tripOrder)
        }));
        setAssignmentTargetTripId(saved.tripId ?? "");
        setSuccessMessage(saved.tripId ? `Moved to ${trips.find((trip) => trip.id === saved.tripId)?.title ?? "selected trip"}.` : "Place detached from its trip.");
        router.push(`/admin/places/${saved.slug}`);
        router.refresh();
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : "Assignment update failed.");
      }
    });
  }

  const submit = () => {
    setError(null);
    setSuccessMessage(null);
    if (!validateCurrentForm()) {
      setError("Fix the highlighted fields before saving.");
      return;
    }

    const payload: PlaceInput = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      summary: form.summary.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      start_date: form.startDate,
      end_date: form.endDate,
      marker_color: form.markerColor.trim(),
      trip_id: form.tripId || null,
      image_url: form.imageUrl.trim(),
      gallery: form.gallery,
      tags: splitList(form.tags),
      companions: splitList(form.companions),
      visibility: form.visibility,
      group_ids: form.visibility === "group" ? form.groupIds : [],
      rating: Number(form.rating),
      trip_order: Number(form.tripOrder),
      status: form.status
    };

    startTransition(async () => {
      try {
        const saved = initialPlace ? await updatePlace(initialPlace.slug, payload) : await createPlace(payload);
        setSuccessMessage(initialPlace ? "Place saved." : "Place created.");
        router.push(`/admin/places/${saved.slug}`);
        router.refresh();
      } catch (issue) {
        setError(issue instanceof Error ? issue.message : "Save failed.");
      }
    });
  };

  const isBusy = isPending || isUploadingCover || isUploadingGallery || isAssignmentPending;

  return (
    <section className="rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-mint/70">place editor</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-cloud">{initialPlace ? "Edit place" : "Create place"}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {initialPlace ? <AdminContentActions kind="place" slug={initialPlace.slug} status={form.status} /> : null}
          <button onClick={submit} disabled={isBusy} className="rounded-full bg-accentBrand px-5 py-3 text-sm font-semibold text-ink disabled:opacity-50">
            {isPending ? "Saving..." : "Save place"}
          </button>
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {successMessage ? <p className="mt-4 text-sm text-mint">{successMessage}</p> : null}
      {uploadError ? <p className="mt-2 text-sm text-red-300">{uploadError}</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[["Title","title"],["Slug","slug"],["City","city"],["Country","country"],["Start date","startDate"],["End date","endDate"],["Latitude","latitude"],["Longitude","longitude"],["Marker color","markerColor"],["Rating","rating"],["Trip order","tripOrder"]].map(([label,key]) => (
          <label key={key} className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">{label}</span>
            <input value={form[key as keyof PlaceFormState] as string} onChange={(event) => updateField(key as keyof PlaceFormState, event.target.value as never)} aria-invalid={Boolean(fieldErrors[key as PlaceField])} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" />
            <FieldError message={fieldErrors[key as PlaceField]} />
          </label>
        ))}
        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Trip</span>
          <select value={form.tripId} onChange={(event) => updateField("tripId", event.target.value)} aria-invalid={Boolean(fieldErrors.tripId)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400">
            <option value="">Unassigned / standalone</option>
            {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
          </select>
          <FieldError message={fieldErrors.tripId} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Visibility</span>
          <select value={form.visibility} onChange={(event) => updateField("visibility", event.target.value as Visibility)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
            <option value="public">public</option><option value="authenticated">authenticated</option><option value="group">group</option><option value="admin_only">admin_only</option>
          </select>
        </label>
        <div className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Visible groups</span>
          <div className="rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud">
            <div className="grid gap-2">
              {groups.filter((group) => group.status === "active").map((group) => (
                <label key={group.id} className="flex items-center gap-3">
                  <input type="checkbox" checked={form.groupIds.includes(group.id)} onChange={() => toggleGroupId(group.id)} disabled={form.visibility !== "group"} />
                  {group.name}
                </label>
              ))}
              {groups.filter((group) => group.status === "active").length === 0 ? <span className="text-cloud/55">No active groups available</span> : null}
            </div>
          </div>
          <FieldError message={fieldErrors.groupIds} />
        </div>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Status</span>
          <select value={form.status} onChange={(event) => updateField("status", event.target.value as ContentStatus)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
            <option value="draft">draft</option><option value="published">published</option><option value="hidden">hidden</option><option value="archived">archived</option>
          </select>
        </label>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Summary</span><textarea value={form.summary} onChange={(event) => updateField("summary", event.target.value)} aria-invalid={Boolean(fieldErrors.summary)} rows={3} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" /><FieldError message={fieldErrors.summary} /></label>
        <label className="block md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Description</span><textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} aria-invalid={Boolean(fieldErrors.description)} rows={6} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" /><FieldError message={fieldErrors.description} /></label>
      </div>

      <div className="mt-8 rounded-[24px] border border-line/60 bg-ink/35 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-mint/70">trip assignment</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-cloud">Current assignment</h3>
            <p className="mt-2 text-sm text-cloud/72">
              {currentTrip ? `${currentTrip.title} · stop ${form.tripOrder}` : "This place is currently standalone and not part of a trip route."}
            </p>
          </div>
          {initialPlace ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => quickPersistAssignment("", 0)} disabled={isBusy || (!form.tripId && form.tripOrder === "0")} className="rounded-full border border-red-400/50 px-4 py-3 text-sm font-semibold text-red-200 disabled:opacity-40">
                {isAssignmentPending ? "Updating..." : "Detach now"}
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Move to trip</span>
            <select value={assignmentTargetTripId} onChange={(event) => setAssignmentTargetTripId(event.target.value)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
              <option value="">Select target trip</option>
              {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
            </select>
          </label>
          <div className="rounded-[20px] border border-line/60 bg-panel/55 px-4 py-3 text-sm text-cloud/72">
            <p className="text-xs uppercase tracking-[0.2em] text-mint/70">Next stop</p>
            <p className="mt-2 text-lg font-semibold text-cloud">{assignmentTargetTrip ? nextAssignmentOrder : "-"}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <button type="button" onClick={quickMoveToSelectedTrip} disabled={isBusy || !assignmentTargetTripId} className="rounded-full border border-line/70 px-4 py-3 text-sm font-semibold text-cloud/85 disabled:opacity-40">
              Prepare move
            </button>
            {initialPlace ? (
              <button type="button" onClick={() => quickPersistAssignment(assignmentTargetTripId, nextAssignmentOrder)} disabled={isBusy || !assignmentTargetTripId} className="rounded-full bg-accentBrand px-4 py-3 text-sm font-semibold text-ink disabled:opacity-40">
                {isAssignmentPending ? "Updating..." : "Move now"}
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-cloud/58">
          Prepare move updates the form fields so the next full save keeps the same assignment. Move now writes just the trip assignment and route order immediately.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="block md:col-span-2">
          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-mint/70">Cover image</div>
          <div className="rounded-[24px] border border-line bg-ink/40 p-4">
            <input value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} placeholder="https://... or upload below" aria-invalid={Boolean(fieldErrors.imageUrl)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand aria-[invalid=true]:border-red-400" />
            <FieldError message={fieldErrors.imageUrl} />
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => coverInputRef.current?.click()} disabled={isUploadingCover} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">{isUploadingCover ? "Uploading cover..." : "Upload cover image"}</button>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadCover(file);
                event.target.value = "";
              }} />
            </div>
            {form.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-[20px] border border-line/60 bg-panel/60 p-3">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                  <Image src={form.imageUrl} alt="Place cover preview" fill className="object-cover" unoptimized />
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="block md:col-span-2">
          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-mint/70">Gallery</div>
          <div className="rounded-[24px] border border-line bg-ink/40 p-4">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={isUploadingGallery} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">{isUploadingGallery ? "Uploading gallery..." : "Upload gallery images"}</button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => {
                const files = event.target.files;
                if (files?.length) uploadGalleryFiles(files);
                event.target.value = "";
              }} />
            </div>
            <div className="mt-3 flex gap-3">
              <input value={galleryDraft} onChange={(event) => setGalleryDraft(event.target.value)} placeholder="Add gallery URL manually" className="min-w-0 flex-1 rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
              <button type="button" onClick={() => addGalleryUrl(galleryDraft)} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80">Add URL</button>
            </div>
            <FieldError message={fieldErrors.gallery} />
            {form.gallery.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {form.gallery.map((url) => (
                  <div key={url} className="rounded-[20px] border border-line/60 bg-panel/60 p-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                      <Image src={url} alt="Gallery preview" fill className="object-cover" unoptimized />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.imageUrl !== url ? <button type="button" onClick={() => updateField("imageUrl", url)} className="rounded-full border border-line/70 px-3 py-2 text-xs text-cloud/80">Set as cover</button> : <span className="rounded-full bg-accentBrand px-3 py-2 text-xs font-semibold text-ink">Cover</span>}
                      <button type="button" onClick={() => removeGalleryUrl(url)} className="rounded-full border border-red-400/50 px-3 py-2 text-xs text-red-200">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Tags</span><input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" /></label>
        <label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Companions</span><input value={form.companions} onChange={(event) => updateField("companions", event.target.value)} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" /></label>
      </div>
    </section>
  );
}