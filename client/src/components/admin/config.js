// Field definitions that drive every admin form. Add a field here and the form,
// payload conversion and API call all pick it up.

const order = { name: 'order', label: 'Display order (lower shows first)', type: 'number', default: 0 };
const icon = (def) => ({ name: 'icon', label: 'Icon class (Font Awesome, e.g. fas fa-code)', type: 'text', maxLength: 80, default: def });

export const projectFields = [
  { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 120 },
  { name: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 2000, rows: 4 },
  { name: 'technologies', label: 'Technologies (comma separated)', type: 'tags', required: true, placeholder: 'React, Node.js' },
  { name: 'category', label: 'Category', type: 'text', maxLength: 80, placeholder: 'Personal Project' },
  { name: 'status', label: 'Status', type: 'select', default: 'in-progress', options: [{ value: 'in-progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }] },
  { name: 'sourceUrl', label: 'GitHub / source URL', type: 'url' },
  { name: 'liveUrl', label: 'Live demo URL', type: 'url' },
  { name: 'imageUrl', idName: 'imagePublicId', label: 'Project image', type: 'image' },
  order,
];

export const skillFields = [
  { name: 'name', label: 'Skill name', type: 'text', required: true, maxLength: 80 },
  { name: 'category', label: 'Category', type: 'select', default: 'Technical', options: ['Technical', 'Soft'] },
  icon('fas fa-star'),
];

export const educationFields = [
  { name: 'degree', label: 'Degree / program', type: 'text', required: true, maxLength: 160 },
  { name: 'institution', label: 'Institution', type: 'text', required: true, maxLength: 160 },
  { name: 'startDate', label: 'Start', type: 'text', maxLength: 20, placeholder: '2022' },
  { name: 'endDate', label: 'End', type: 'text', maxLength: 20, placeholder: 'Present' },
  { name: 'description', label: 'Description', type: 'textarea', maxLength: 1500 },
  order,
];

export const experienceFields = [
  { name: 'title', label: 'Role / title', type: 'text', required: true, maxLength: 160 },
  { name: 'company', label: 'Company / organization', type: 'text', maxLength: 160 },
  { name: 'startDate', label: 'Start', type: 'text', maxLength: 20, placeholder: 'Jan 2024' },
  { name: 'endDate', label: 'End', type: 'text', maxLength: 20, placeholder: 'Present' },
  { name: 'description', label: 'Description', type: 'textarea', maxLength: 1500 },
  order,
];

export const serviceFields = [
  { name: 'title', label: 'Service title', type: 'text', required: true, maxLength: 120 },
  { name: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 1000 },
  icon('fas fa-code'),
  { name: 'price', label: 'Price label', type: 'text', maxLength: 40, default: 'Free' },
  order,
];

export const socialFields = [
  { name: 'platform', label: 'Platform name', type: 'text', required: true, maxLength: 60, placeholder: 'GitHub' },
  { name: 'url', label: 'URL (https://, mailto: or tel:)', type: 'text', required: true, maxLength: 500 },
  icon('fas fa-link'),
  order,
];

export const profileFields = [
  { name: 'avatarUrl', idName: 'avatarPublicId', label: 'Profile picture', type: 'image' },
  { name: 'fullName', label: 'Full name', type: 'text', required: true, maxLength: 120 },
  { name: 'headline', label: 'Headline (hero subtitle)', type: 'text', maxLength: 160 },
  { name: 'badge', label: 'Hero badge text', type: 'text', maxLength: 160 },
  { name: 'heroDescription', label: 'Hero description', type: 'textarea', maxLength: 1000 },
  { name: 'aboutParagraphs', label: 'About me (one paragraph per line)', type: 'lines', rows: 6 },
  { name: 'aboutStats', label: 'About stats (one per line: value | label | icon class)', type: 'stats', rows: 3, help: 'Example: 5th | Semester Student   or   | Frontend Focused | fas fa-code' },
  { name: 'email', label: 'Public contact email', type: 'email', maxLength: 254 },
  { name: 'whatsapp', label: 'WhatsApp number (with country code)', type: 'text', maxLength: 30 },
  { name: 'location', label: 'Location', type: 'text', maxLength: 120 },
  { name: 'resumeUrl', label: 'Resume / CV link', type: 'text', maxLength: 500 },
];

const SECTIONS = ['about', 'skills', 'projects', 'services', 'experience', 'education', 'contact'];
const cap = (word) => word[0].toUpperCase() + word.slice(1);

export const settingsFields = [
  { name: 'siteTitle', label: 'Browser tab title', type: 'text', maxLength: 120 },
  { name: 'metaDescription', label: 'Meta description (SEO)', type: 'text', maxLength: 300 },
  { name: 'footerText', label: 'Footer text', type: 'text', maxLength: 200 },
  { name: 'contactIntro', label: 'Contact section intro', type: 'textarea', maxLength: 300 },
  { name: 'projectsFooterText', label: 'Text above the GitHub button under projects', type: 'text', maxLength: 300 },
  ...SECTIONS.map((id) => ({ name: id, key: `sections.${id}`, nested: 'sections', label: `Show "${cap(id)}" section`, type: 'checkbox' })),
  ...SECTIONS.map((id) => ({ name: id, key: `sectionTitles.${id}`, nested: 'sectionTitles', label: `${cap(id)} section heading`, type: 'text', maxLength: 80 })),
];
