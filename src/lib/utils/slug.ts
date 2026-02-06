import { nanoid } from 'nanoid';

/**
 * Generate a human-readable URL slug from an organization name.
 * Examples:
 * - "Boys & Girls Club of Permian Basin" -> "boys-girls-club-permian-basin"
 * - "The Nature Conservancy" -> "nature-conservancy"
 */
export function generateOrgSlug(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/^the\s+/i, '') // Remove leading "The"
    .replace(/[&]/g, 'and') // Replace & with 'and'
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length
}

/**
 * Generate a unique slug with a short random suffix.
 * Used when collision is detected.
 */
export function generateUniqueSlug(baseSlug: string): string {
  const suffix = nanoid(6).toLowerCase();
  return `${baseSlug}-${suffix}`;
}

/**
 * Generate a donor slug from donor name.
 * Examples:
 * - "John Smith" -> "john-smith"
 * - "Dr. Jane Doe" -> "jane-doe"
 */
export function generateDonorSlug(donorName: string): string {
  return donorName
    .toLowerCase()
    .replace(/^(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)\s+/i, '') // Remove titles
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 40); // Limit length
}

/**
 * Generate a unique donor slug with a short random suffix.
 */
export function generateUniqueDonorSlug(donorName: string): string {
  const baseSlug = generateDonorSlug(donorName);
  const suffix = nanoid(4).toLowerCase();
  return `${baseSlug}-${suffix}`;
}

/**
 * Validate if a slug is valid (no special characters, reasonable length).
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{2,60}[a-z0-9]$/.test(slug);
}
