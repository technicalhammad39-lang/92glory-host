function getToken() {
  try {
    return localStorage.getItem('token') || '';
  } catch {
    return '';
  }
}

async function requestJson(url, options = {}) {
  const { method = 'GET', body, auth = false } = options;
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store'
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data || {};
}

export function getGameIssue(params) {
  const durationSec = Number(params?.durationSec || 30);
  return requestJson(`/api/wingo/current?durationSec=${durationSec}`, { auth: true });
}

export function getGameHistory(durationSec, limit = 10) {
  return requestJson(`/api/wingo/history?durationSec=${Number(durationSec)}&limit=${Number(limit)}`);
}

export function getMyBets(durationSec, limit = 30) {
  return requestJson(`/api/wingo/my-bets?durationSec=${Number(durationSec)}&limit=${Number(limit)}`, { auth: true });
}

export function submitBet(payload) {
  return requestJson('/api/wingo/bet', {
    method: 'POST',
    auth: true,
    body: payload
  });
}

export function getProfile() {
  return requestJson('/api/auth/me', { auth: true });
}

