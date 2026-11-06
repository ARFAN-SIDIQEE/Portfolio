import emailjs from '@emailjs/browser';

// These three values are public by design (EmailJS public key, not the private key).
// Restrict the allowed domains in the EmailJS dashboard to stop abuse.
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const emailConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/**
 * Sends the contact form via EmailJS. The template should use:
 * {{from_name}}, {{from_email}}, {{message}} (and "Reply To" = {{from_email}}).
 */
export async function sendContactEmail({ name, email, message }) {
  if (!emailConfigured) {
    throw new Error('The contact form is not configured yet. Please email me directly.');
  }
  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      { from_name: name, from_email: email, reply_to: email, message },
      { publicKey: PUBLIC_KEY },
    );
  } catch (error) {
    const detail = error?.text || error?.message || '';
    throw new Error(`Your message could not be sent${detail ? `: ${detail}` : '.'} Please try again or email me directly.`);
  }
}
