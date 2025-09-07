const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const http = require('../utils/httpClient');
const { haversineKm } = require('../utils/geo');


const norm = (s) => String(s || '').trim().toLowerCase();

const canonProvince = (p) => {
  if (!p) return null;
  const v = String(p).trim();
  return v.length ? v : null;
};
const isUnknownProvince = (p) =>
  /^unknown/i.test(String(p || '').trim());

function pickCityPOI(catalog, { city, province, coords }) {
  let candidates = catalog.filter((c) => norm(c.city) === norm(city));
  if (candidates.length === 0 && province) {
    candidates = catalog.filter((c) => norm(c.province) === norm(province));
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (coords && typeof a.lat === 'number' && typeof b.lat === 'number') {
      const da = haversineKm(coords, { lat: a.lat, lng: a.lng });
      const db = haversineKm(coords, { lat: b.lat, lng: b.lng });
      if (isFinite(da) && isFinite(db) && Math.abs(da - db) > 1e-6) return da - db; // nearer first
    }
    const rc = (b.rating_count || 0) - (a.rating_count || 0);
    if (rc) return rc;
    return (b.avg_rating || 0) - (a.avg_rating || 0);
  });

  return candidates[0];
}

function rebuildDistances(items) {
  let prev = null;
  return items.map((it, idx) => {
    if (idx === 0) {
      prev = it;
      return { ...it, distance_from_prev: undefined };
    }
    const hasPrev = typeof prev?.lat === 'number' && typeof prev?.lng === 'number';
    const hasCur = typeof it?.lat === 'number' && typeof it?.lng === 'number';
    const d = hasPrev && hasCur ? haversineKm(prev, it) : undefined;
    prev = it;
    return { ...it, distance_from_prev: d };
  });
}

function buildCatalog(user) {
  const arr = [];
  const push = (x) => {
    if (!x) return;
    arr.push({
      location_id: x.location_id || x.id,
      name: x.name || x.Location_Name,
      city: x.city || x.located_city || '',
      province: x.province || '',
      lat: typeof x.lat === 'number' ? x.lat : undefined,
      lng: typeof x.lng === 'number' ? x.lng : undefined,
      avg_rating: x.avg_rating,
      rating_count: x.rating_count,
      description: x.description || '',
      activities: Array.isArray(x.activities) ? x.activities : [],
      type: x.type || x.category || undefined,
    });
  };

  (user?.plan_pool || []).forEach(push);
  (user?.recommended_locations || []).forEach(push);
  (user?.last_recommendations?.results || []).forEach(push);

  const byKey = new Map();
  for (const p of arr) {
    const key = `${norm(p.name)}|${norm(p.city)}`;
    const prev = byKey.get(key);
    if (!prev || (p.rating_count || 0) > (prev.rating_count || 0)) byKey.set(key, p);
  }
  return Array.from(byKey.values());
}

function validate(body) {
  if (!body) return 'Missing body';
  const {
    start_city,
    end_city,
    plan_pool,
    include_city_attractions,
    min_attractions,
    corridor_radius_km,
    start_lat,
    start_lng,
  } = body;

  if (!end_city || typeof end_city !== 'string') return 'end_city (string) is required';
  if (!(corridor_radius_km > 0)) return 'corridor_radius_km must be > 0';
  if (min_attractions != null && Number(min_attractions) < 0) return 'min_attractions must be >= 0';
  if (include_city_attractions != null && typeof include_city_attractions !== 'boolean')
    return 'include_city_attractions must be boolean';

  if (start_lat != null || start_lng != null) {
    if (typeof start_lat !== 'number' || typeof start_lng !== 'number') {
      return 'start_lat and start_lng must both be numbers when provided';
    }
  }
  if (!Array.isArray(plan_pool) || plan_pool.length === 0) {
  }
  return null;
}

function normalizeItinerary(mlData, user) {
  if (!mlData || !Array.isArray(mlData.itinerary)) return mlData;
  const catalog = buildCatalog(user);

  const replaced = mlData.itinerary.map((it) => {
    const isCityAnchor =
      String(it.type || (it.is_city ? 'City' : '')).toLowerCase() === 'city' || it.is_city;
    const canonProv = canonProvince(it.province);

    if (!isCityAnchor && canonProv) {
      return { ...it, province: canonProv };
    }

    const poi = pickCityPOI(catalog, {
      city: it.city || it.name,
      province: it.province,
      coords:
        typeof it.lat === 'number' && typeof it.lng === 'number'
          ? { lat: it.lat, lng: it.lng }
          : null,
    });

    if (!poi) {
      return { ...it, province: canonProv || null };
    }

    return {
      ...it,
      name: poi.name,
      type: poi.type || it.type,
      city: poi.city || it.city,
      province: canonProvince(poi.province) || canonProv || null,
      lat: typeof poi.lat === 'number' ? poi.lat : it.lat,
      lng: typeof poi.lng === 'number' ? poi.lng : it.lng,
      rating: typeof poi.avg_rating === 'number' ? poi.avg_rating : it.rating,
      location_id: poi.location_id,
      original_city_label: isCityAnchor ? (it.city || it.name) : undefined,
      is_city: false,
    };
  });

  const toRad = (d) => (d * Math.PI) / 180;
  const distKm = (a, b) => {
    if (
      typeof a?.lat !== 'number' || typeof a?.lng !== 'number' ||
      typeof b?.lat !== 'number' || typeof b?.lng !== 'number'
    ) return Infinity;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const key = (x) => `${String(x?.name||'').trim().toLowerCase()}|${String(x?.city||'').trim().toLowerCase()}`;
  const approxSame = (a, b) => key(a) === key(b) || (isFinite(distKm(a, b)) && distKm(a, b) < 0.25);

  const richness = (x) =>
    (x?.rating_count ? 1 : 0) +
    (typeof x?.rating === 'number' ? 1 : 0) +
    ((x?.description?.length || 0) > 0 ? 1 : 0) +
    ((Array.isArray(x?.activities) && x.activities.length > 0) ? 1 : 0) +
    (x?.original_city_label ? 0 : 1); // prefer non-anchor

  const deduped = [];
  for (const cur of replaced) {
    const prev = deduped[deduped.length - 1];
    if (prev && approxSame(prev, cur)) {
      // keep the richer of the two
      deduped[deduped.length - 1] = richness(cur) >= richness(prev) ? cur : prev;
    } else {
      deduped.push(cur);
    }
  }

  const withDistances = rebuildDistances(deduped);

  const corridor = [];
  const seen = new Set();
  for (const it of withDistances) {
    const cp = canonProvince(it.province);
    if (cp && !isUnknownProvince(cp) && !seen.has(cp)) {
      seen.add(cp);
      corridor.push(cp);
    }
  }

  const startPoi = withDistances[0] || mlData.start || null;
  const endPoi = withDistances[withDistances.length - 1] || mlData.end || null;

  return {
    ...mlData,
    itinerary: withDistances,
    province_corridor: corridor,
    start: startPoi
      ? { name: startPoi.name, province: canonProvince(startPoi.province) || null, lat: startPoi.lat, lng: startPoi.lng }
      : mlData.start,
    end: endPoi
      ? { name: endPoi.name, province: canonProvince(endPoi.province) || null, lat: endPoi.lat, lng: endPoi.lng }
      : mlData.end,
  };
}

router.post('/plan/generate', auth, async (req, res) => {
  try {
    let {
      start_city = null,
      end_city,
      plan_pool,
      include_city_attractions = false,
      min_attractions = 3,
      corridor_radius_km,
      start_lat,
      start_lng,
      city_attraction_radius_km,
    } = req.body || {};

    const vErr = validate({
      start_city,
      end_city,
      plan_pool,
      include_city_attractions,
      min_attractions,
      corridor_radius_km,
      start_lat,
      start_lng,
    });
    if (vErr) return res.status(400).json({ error: vErr });

    if (!Array.isArray(plan_pool) || plan_pool.length === 0) {
      const u = await User.findById(req.user.id, 'plan_pool').lean();
      plan_pool = Array.isArray(u?.plan_pool) ? u.plan_pool.map((x) => x?.name).filter(Boolean) : [];
    }

    const mlBody = {
      start_city,
      end_city,
      plan_pool,
      include_city_attractions: !!include_city_attractions,
      min_attractions: Number(min_attractions),
      corridor_radius_km: Number(corridor_radius_km),
    };
    if (typeof start_lat === 'number' && typeof start_lng === 'number') {
      mlBody.start_lat = Number(start_lat);
      mlBody.start_lng = Number(start_lng);
    }
    if (typeof city_attraction_radius_km === 'number') {
      mlBody.city_attraction_radius_km = Number(city_attraction_radius_km);
    }

    const r = await http.post('/plan/generate', mlBody);
    const mlData = r?.data || {};

    const user = await User.findById(
      req.user.id,
      'plan_pool recommended_locations last_recommendations'
    ).lean();

    const payload = normalizeItinerary(mlData, user);

    return res.status(200).json(payload);
  } catch (e) {
    console.error('POST /plan/generate → error:', e?.response?.data || e.message);
    return res.status(502).json({ error: 'Planner service unavailable' });
  }
});

module.exports = router;
