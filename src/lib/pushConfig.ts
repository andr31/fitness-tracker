import { isValidPushKey } from './pushValidation';

export function getPushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  const cronSecret = process.env.CRON_SECRET;

  if (
    !publicKey || !isValidPushKey(publicKey, 65) ||
    !privateKey || !isValidPushKey(privateKey, 32) ||
    !subject || !cronSecret || cronSecret.length < 16
  ) {
    return null;
  }
  try {
    const url = new URL(subject);
    if (!['https:', 'mailto:'].includes(url.protocol) || url.hostname === 'localhost') {
      return null;
    }
  } catch {
    return null;
  }
  return { publicKey, privateKey, subject };
}
