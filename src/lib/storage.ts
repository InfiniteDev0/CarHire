import type { SupabaseClient } from "@supabase/supabase-js";

// Shared photo-upload rules (staff + client ID documents).
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB per image

/** Client-side friendly validation. Returns an error message or null. */
export function photoError(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Only image files are allowed.";
  if (file.size > MAX_PHOTO_BYTES) return "Each image must be under 4MB.";
  return null;
}

/** Pull an optional File out of a FormData field (empty inputs come back as size-0). */
export function formFile(formData: FormData, key: string): File | null {
  const v = formData.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

function extOf(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] || "jpg";
}

/**
 * Upload a photo into `{bucket}/{dir}/{name}-{ts}.{ext}` and return the path.
 * Call with the SERVICE-ROLE client (uploads bypass storage RLS); reads happen
 * via signed URLs under the member-read policies from migration 0006.
 */
export async function uploadPhoto(
  client: SupabaseClient,
  bucket: string,
  dir: string,
  name: string,
  file: File
): Promise<string> {
  const err = photoError(file);
  if (err) throw new Error(err);
  const path = `${dir}/${name}-${Date.now()}.${extOf(file)}`;
  const { error } = await client.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

/** Signed URL for a stored path (1h default). Null path/failure → null. */
export async function signPath(
  client: SupabaseClient,
  bucket: string,
  path: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!path) return null;
  try {
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
