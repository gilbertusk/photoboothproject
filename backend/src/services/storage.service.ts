import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

// Check if Cloudflare R2 configurations are provided
const hasR2 = !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);

const s3Client = hasR2
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

export const uploadFile = async (
  file: Buffer,
  key: string,
  mimeType: string
): Promise<string> => {
  // Always save file locally for local development, kiosk preview, and printing fallback
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Ensure the local uploads directory exists
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const filename = path.basename(key);
  const filePath = path.join(uploadDir, filename);

  // Save the file to local disk
  await fs.promises.writeFile(filePath, file);

  if (!hasR2) {
    console.log(`⚠️ Cloudflare R2 is not configured. Saving file locally to disk: ${key}`);
    // Return relative path to avoid Mixed Content (HTTPS -> HTTP) blocks on localhost
    return `/public/uploads/${filename}`;
  }

  // Real Cloudflare R2 upload
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: mimeType,
  });

  await s3Client!.send(command);

  // Return the public URL
  const publicUrl = env.R2_PUBLIC_URL.endsWith('/')
    ? `${env.R2_PUBLIC_URL}${key}`
    : `${env.R2_PUBLIC_URL}/${key}`;

  return publicUrl;
};

export const deleteFile = async (key: string): Promise<void> => {
  if (!hasR2) {
    // Local fallback deletion
    const filename = path.basename(key);
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.error('Failed to delete local static file:', err);
    }
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  await s3Client!.send(command);
};
