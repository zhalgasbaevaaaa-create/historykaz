const CLIENT_KEY = 'historykaz-google-client-id';
const DEFAULT_CLIENT =
  '133952241899-upfqc77aol6laa4jk99mnn4lr7e920jo.apps.googleusercontent.com';

export function getGoogleClientId(): string {
  try {
    return (localStorage.getItem(CLIENT_KEY) || DEFAULT_CLIENT).trim();
  } catch {
    return DEFAULT_CLIENT;
  }
}

export function setGoogleClientId(id: string): void {
  localStorage.setItem(CLIENT_KEY, id.trim());
}

export interface GoogleProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

function decodeJwt(token: string): Record<string, any> {
  const payload = token.split('.')[1];
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(json);
}

export function redirectUri(): string {
  const u = new URL(window.location.href);
  u.hash = '';
  u.search = '';
  let path = u.pathname;
  if (!path.endsWith('/')) path += '/';
  return `${u.origin}${path}`;
}

export function startGoogleRedirect(): void {
  const nonce = crypto.randomUUID();
  sessionStorage.setItem('historykaz-g-nonce', nonce);
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: redirectUri(),
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account'
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export function consumeGoogleRedirect(): GoogleProfile | null {
  const raw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : '';
  if (!raw) return null;
  const hash = new URLSearchParams(raw);
  const idToken = hash.get('id_token');
  if (!idToken) return null;

  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

  try {
    const p = decodeJwt(idToken);
    const email = String(p.email || '').toLowerCase();
    if (!email) return null;
    return {
      uid: String(p.sub || email),
      email,
      displayName: String(p.name || email.split('@')[0]),
      photoURL: p.picture || null
    };
  } catch {
    return null;
  }
}
