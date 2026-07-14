import { Resend } from 'resend';
import { env } from '../config/env';

// Resend requires an API key starting with 're_' during instantiation.
// If none is provided, we use a placeholder and mock the email sending process to prevent server crashes.
const resend = new Resend(env.RESEND_API_KEY || 're_dummy_key');

export const sendPhotoEmail = async (
  to: string,
  shareUrl: string,
  sessionId: string
): Promise<void> => {
  // If shareUrl is a relative path (offline mode), prepend it with the FRONTEND_URL to make a valid clickable link
  let absoluteShareUrl = shareUrl;
  if (shareUrl && shareUrl.startsWith('/')) {
    const baseUrl = env.FRONTEND_URL || 'https://localhost:5174';
    absoluteShareUrl = `${baseUrl}${shareUrl}`;
  }

  if (!env.RESEND_API_KEY) {
    console.log(`[EMAIL MOCK] Send email triggered:
    To: ${to}
    Share URL: ${absoluteShareUrl}
    Session ID: ${sessionId}
    (Set RESEND_API_KEY in .env to send real emails via Resend API)`);
    return;
  }

  await resend.emails.send({
    from: 'Photobooth <onboarding@resend.dev>',
    to,
    subject: 'Your Photobooth Photos Are Ready! 📸',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="background-color:white;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <h1 style="font-size:24px;color:#18181b;margin-bottom:8px;">Your Photos Are Ready! 📸</h1>
              <p style="color:#71717a;font-size:16px;margin-bottom:24px;">
                Thanks for using our photobooth! Click the button below to view and download your photos.
              </p>
              
              <!-- Embedded Photo Preview -->
              <div style="margin: 24px auto; text-align: center;">
                <img src="${absoluteShareUrl}" alt="Your Photobooth Strip" style="max-width: 140px; height: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(32,15,12,0.15); border: 1px solid #e7bdb4;" />
              </div>

              <a href="${absoluteShareUrl}" 
                 style="display:inline-block;background-color:#ff5638;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;box-shadow: 0 4px 12px rgba(255,86,56,0.2);">
                View & Download Photos
              </a>
              <p style="color:#a1a1aa;font-size:12px;margin-top:32px;">
                Session ID: ${sessionId}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
};
