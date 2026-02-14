const crypto = require('crypto');

const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

const encodeBase64Url = (value) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const decodeBase64Url = (value) => {
  const padded = value + '==='.slice((value.length + 3) % 4);
  const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
};

const createSignature = (payload, secret) =>
  crypto.createHmac('sha256', secret).update(payload).digest('base64url');

const createToken = (payload, secret, expiresInSec = DEFAULT_EXPIRY_SECONDS) => {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSec
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(body));
  const signature = createSignature(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
};

const verifyToken = (token, secret) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload, secret);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
};

module.exports = {
  createToken,
  verifyToken
};
