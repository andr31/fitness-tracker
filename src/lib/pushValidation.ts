const PUSH_HOSTS = new Set([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
]);

export function isValidPushEndpoint(endpoint: string): boolean {
  if (endpoint.length > 2048) return false;
  try {
    const url = new URL(endpoint);
    const allowedHost =
      PUSH_HOSTS.has(url.hostname) || url.hostname.endsWith('.push.apple.com');
    return (
      url.protocol === 'https:' &&
      allowedHost &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function isValidTimeZone(timeZone: string): boolean {
  if (timeZone.length > 100) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function isValidPushKey(value: string, length: number): boolean {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return false;
  const decoded = Buffer.from(value, 'base64url');
  return decoded.length === length && decoded.toString('base64url') === value;
}
