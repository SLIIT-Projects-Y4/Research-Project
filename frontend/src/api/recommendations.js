import { api } from './client';

// Normalize our envelope and older variants
function pickPayload(d) {
  return d?.data ?? d; // our Node returns { success, data }, axios gives you {data}
}

export async function fromProfile(topN = 9) {
  const { data } = await api.post('/api/recommendation/from-profile', { top_n: topN });
  const p = pickPayload(data);
  return {
    status: p?.status ?? 'ok',
    weights: p?.weights ?? null,
    results: Array.isArray(p?.results) ? p.results : [],
    saved: !!p?.saved
  };
}

export async function whatIf(body) {
  const { data } = await api.post('/api/recommendation', body);
  const p = pickPayload(data);
  return {
    status: p?.status ?? 'ok',
    weights: p?.weights ?? null,
    results: Array.isArray(p?.results) ? p.results : []
  };
}
