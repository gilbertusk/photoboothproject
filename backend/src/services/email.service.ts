import { Resend } from 'resend';
import { env } from '../config/env';

// Resend requires an API key starting with 're_' during instantiation.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

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
    throw new Error('RESEND_API_KEY is required to send photo emails');
  }

  const result = await resend!.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: 'Your bertpixx Photos Are Ready! 📸',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#fff7f2;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
            <div style="background-color:white;border-radius:12px;padding:40px;text-align:center;border:1px solid #f6d3c3;box-shadow:0 2px 8px rgba(255,107,90,0.08);">
              <p style="color:#ff6b5a;font-size:12px;font-weight:700;letter-spacing:3px;margin:0 0 12px;">BERTPIXX</p>
              <h1 style="font-size:24px;color:#3b1d12;margin-bottom:8px;">Your Photos Are Ready! 📸</h1>
              <p style="color:#6e4434;font-size:16px;margin-bottom:24px;">
                Thanks for using bertpixx! Click the button below to view and download your photos.
              </p>
              
              <!-- Embedded Photo Preview -->
              <div style="margin: 24px auto; text-align: center;">
                <img src="${absoluteShareUrl}" alt="Your bertpixx Strip" style="max-width: 140px; height: auto; border-radius: 8px; box-shadow: 0 4px 20px rgba(59,29,18,0.12); border: 1px solid #f6d3c3;" />
              </div>

              <a href="${absoluteShareUrl}" 
                 style="display:inline-block;background-color:#ff6b5a;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;box-shadow: 0 4px 12px rgba(255,107,90,0.25);">
                View & Download Photos
              </a>
              <p style="color:#a57c6b;font-size:12px;margin-top:32px;">
                Session ID: ${sessionId}
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
  if (result.error) throw new Error(result.error.message);
  if (!result.data?.id) throw new Error('Email provider returned no message ID');
};

export async function sendBookingEmail(to: string, subject: string, text: string, idempotencyKey: string): Promise<string> {
  if (!resend) throw new Error('RESEND_API_KEY is required to send booking emails');
  const result = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, text }, { idempotencyKey });
  if (result.error) throw new Error(result.error.message);
  if (!result.data?.id) throw new Error('Email provider returned no message ID');
  return result.data.id;
}
