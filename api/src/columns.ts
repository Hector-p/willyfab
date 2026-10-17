// Column lists mirror the Python response models, so JSON output keeps the same fields.
const services = ['slug', 'number', 'title', 'category', 'capacity', 'summary', 'description'];
const projects = [
  'slug', 'number', 'title', 'category', 'image_url', 'image_alt', 'short_description',
  'brief', 'scope', 'client', 'location', 'start_date', 'completion_date', 'featured',
];
const boardMembers = ['id', 'name', 'position', 'image_url', 'image_alt'];
const galleryImages = ['id', 'title', 'category', 'image_url', 'image_alt', 'caption', 'featured'];
const inquiries = [
  'id', 'name', 'email', 'phone', 'company', 'service_interest', 'message', 'status', 'created_at',
];

const adminSuffix = ['sort_order', 'is_published'];

export const SERVICE_PUBLIC = services.join(', ');
export const SERVICE_ADMIN = ['id', ...services, ...adminSuffix].join(', ');
export const PROJECT_PUBLIC = projects.join(', ');
export const PROJECT_ADMIN = ['id', ...projects, ...adminSuffix].join(', ');
export const BOARD_PUBLIC = boardMembers.join(', ');
export const BOARD_ADMIN = [...boardMembers, ...adminSuffix].join(', ');
export const GALLERY_PUBLIC = galleryImages.join(', ');
export const GALLERY_ADMIN = [...galleryImages, ...adminSuffix].join(', ');
export const INQUIRY_ADMIN = inquiries.join(', ');
