import { z } from 'zod';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()\-]{7,20}$/;
const IMAGE_URL_MESSAGE = 'Image URLs must be site-relative or start with http:// or https://.';

const blankToNull = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? null : value);

export function isAllowedImageUrl(value: string): boolean {
  return value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://');
}

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const nullableText = (max: number) => z.string().trim().max(max).nullable().default(null);
const slug = (min: number, max: number) =>
  text(min, max).regex(SLUG_PATTERN, 'Use lowercase letters, numbers and single hyphens only.');
const sortOrder = z.number().int().min(0).max(10_000).default(0);
const isPublished = z.boolean().default(false);
const isoDate = z.iso.date().nullable().default(null);

// Empty or missing image URLs become null. Anything else must be site-relative or http(s).
const optionalImageUrl = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .default(null)
    .refine((value) => !value || isAllowedImageUrl(value), IMAGE_URL_MESSAGE)
    .transform((value) => value || null);

export const serviceWriteSchema = z.strictObject({
  slug: slug(3, 120),
  number: text(1, 8),
  title: text(2, 180),
  category: text(2, 80),
  capacity: nullableText(100),
  summary: text(10, 500),
  description: text(10, 10_000),
  sort_order: sortOrder,
  is_published: isPublished,
});

export const projectWriteSchema = z.strictObject({
  slug: slug(3, 140),
  number: text(1, 8),
  title: text(2, 200),
  category: text(2, 100),
  image_url: optionalImageUrl(500),
  image_alt: nullableText(300),
  short_description: text(10, 500),
  brief: text(10, 5000),
  scope: text(10, 5000),
  client: nullableText(200),
  location: nullableText(200),
  start_date: isoDate,
  completion_date: isoDate,
  featured: z.boolean().default(false),
  sort_order: sortOrder,
  is_published: isPublished,
});

export const boardMemberWriteSchema = z.strictObject({
  name: text(2, 160),
  position: text(2, 160),
  image_url: optionalImageUrl(500),
  image_alt: nullableText(300),
  sort_order: sortOrder,
  is_published: isPublished,
});

export const galleryWriteSchema = z.strictObject({
  title: text(2, 200),
  category: text(2, 100),
  image_url: z
    .string()
    .trim()
    .min(1, 'An image is required.')
    .max(500)
    .refine((value) => isAllowedImageUrl(value), IMAGE_URL_MESSAGE),
  image_alt: text(3, 300),
  caption: z.string().trim().max(500).nullable().default(null).transform((value) => value || null),
  featured: z.boolean().default(false),
  sort_order: sortOrder,
  is_published: isPublished,
});

export const galleryReorderSchema = z.strictObject({
  ids: z
    .array(z.number().int())
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, 'Each gallery image may appear only once.'),
});

export const inquiryCreateSchema = z.strictObject({
  name: text(2, 120),
  email: z.string().trim().max(254).regex(EMAIL_PATTERN, 'Enter a valid email address.'),
  phone: z.preprocess(
    blankToNull,
    z.string().trim().max(32).regex(PHONE_PATTERN, 'Enter a valid phone number.').nullable().default(null),
  ),
  company: z.preprocess(blankToNull, z.string().trim().max(160).nullable().default(null)),
  service_interest: z.preprocess(blankToNull, z.string().trim().max(120).nullable().default(null)),
  message: text(10, 3000),
  // Honeypot field. Real visitors leave it empty.
  website: z.string().trim().max(200).nullable().default(null),
});

export const inquiryStatusSchema = z.enum(['new', 'contacted', 'archived']);

export const inquiryStatusUpdateSchema = z.strictObject({
  status: inquiryStatusSchema,
});

export const siteStatusWriteSchema = z.strictObject({
  maintenance_mode: z.boolean(),
  maintenance_message: z.string().trim().min(1).max(300),
});

export const loginSchema = z.strictObject({
  email: text(3, 254),
  password: text(1, 512),
});

// Query-string helpers. Missing values fall back to the given default.
const queryValue = (value: unknown) => (value === undefined || value === '' ? undefined : value);

export function intQuery(min: number, max: number, fallback: number) {
  return z.preprocess(
    (value) => queryValue(value) ?? fallback,
    z.coerce.number().int().min(min).max(max),
  );
}

export function offsetQuery() {
  return z.preprocess((value) => queryValue(value) ?? 0, z.coerce.number().int().min(0));
}

export function optionalTextQuery() {
  return z.preprocess(queryValue, z.string().optional());
}

export function boolQuery() {
  return z.preprocess((value) => {
    const raw = queryValue(value);
    if (typeof raw !== 'string') return raw;
    const normalized = raw.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return raw;
  }, z.boolean().optional());
}

export function inquiryStatusQuery() {
  return z.preprocess(queryValue, inquiryStatusSchema.optional());
}
