// src/controllers/locations.controller.js
const Location = require('../models/Location');
const client = require('../utils/httpClient');
const { ok, fail } = require('../utils/response');

const LOC_ID_RE = /^LOC_\d+$/i;

const normalizeOut = (doc) => ({
  location_id: doc.locationId,
  name: doc.name,
  city: doc.city,
  province: doc.province,
  lat: doc.lat,
  lng: doc.lng,
  type: doc.type,
  avg_rating: doc.avg_rating,
  rating_count: doc.rating_count,
  tags: doc.tags
});

function unslug(s) {
  return String(s || '').replace(/-/g, ' ').trim();
}

exports.cities = async (_req, res, next) => {
  try {
    const { data } = await client.get('/locations/cities');
    return res.json(ok(data));
  } catch (err) {
    return next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim();

    // 1) Direct Location_ID path (e.g., LOC_12)
    if (LOC_ID_RE.test(id)) {
      try {
        const { data } = await client.get(`/locations/${id}`);
        // ML returns { status:"ok", location:{...}, raw:{...} }
        const loc = data?.location || data;
        const raw = data?.raw || null;

        const saved = await Location.findOneAndUpdate(
          { locationId: loc.location_id || id },
          {
            locationId: loc.location_id || id,
            name: loc.name,
            city: loc.city ?? null,
            province: loc.province ?? null,
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            type: loc.type ?? null,
            avg_rating: loc.avg_rating ?? null,
            rating_count: loc.rating_count ?? null,
            tags: Array.isArray(loc.tags) ? loc.tags : [],
            source: 'ml',
            raw: raw || loc
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return res.json(ok({ location: normalizeOut(saved), raw: saved.raw || {} }));
      } catch (e) {
        return res.status(404).json(fail('NOT_FOUND', 'Location not found', { id }));
      }
    }

    // 2) Legacy slug path (name__city)
    const cached = await Location.findOne({ locationId: id }).lean();
    if (cached) return res.json(ok({ location: normalizeOut(cached), raw: cached.raw || {} }));

    const [nameSlug, citySlug] = id.split('__');
    const name = unslug(nameSlug);
    const city = citySlug ? unslug(citySlug) : undefined;

    try {
      const { data } = await client.get('/locations/lookup', { params: { name, city } });
      const loc = data?.location || data;

      const saved = await Location.findOneAndUpdate(
        { locationId: loc.location_id || id },
        {
          locationId: loc.location_id || id,
          name: loc.name,
          city: loc.city ?? null,
          province: loc.province ?? null,
          lat: Number(loc.lat),
          lng: Number(loc.lng),
          type: loc.type ?? null,
          avg_rating: loc.avg_rating ?? null,
          rating_count: loc.rating_count ?? null,
          tags: Array.isArray(loc.tags) ? loc.tags : [],
          source: 'ml',
          raw: loc
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return res.json(ok({ location: normalizeOut(saved), raw: saved.raw || {} }));
    } catch (e) {
      return res.status(404).json(fail('NOT_FOUND', 'Location not found', { id, name, city }));
    }
  } catch (err) {
    return next(err);
  }
};


/**
 * POST /api/locations
 * Create a website-only location (NOT in ML CSV). Assigns next Location_ID starting from LOC_77.
 * Body: { name, lat, lng, city?, province?, type?, avg_rating?, rating_count?, tags?[] }
 */
exports.create = async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name || typeof b.lat !== 'number' || typeof b.lng !== 'number') {
      return res.status(400).json(fail('VALIDATION_ERROR', 'name, lat, lng are required'));
    }

    // Compute next numeric suffix safely
    const existing = await Location.find({ locationId: { $regex: /^LOC_\d+$/i } }, { locationId: 1, _id: 0 }).lean();
    const maxNum = existing.reduce((acc, cur) => {
      const m = String(cur.locationId).match(/LOC_(\d+)$/i);
      const n = m ? parseInt(m[1], 10) : NaN;
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 76);
    const nextId = `LOC_${maxNum + 1}`;

    const saved = await Location.create({
      locationId: nextId,
      name: b.name,
      city: b.city ?? null,
      province: b.province ?? null,
      lat: Number(b.lat),
      lng: Number(b.lng),
      type: b.type ?? null,
      avg_rating: b.avg_rating ?? null,
      rating_count: b.rating_count ?? null,
      tags: Array.isArray(b.tags) ? b.tags : [],
      source: 'user',
      raw: b
    });

    return res.status(201).json(ok({
      location_id: saved.locationId,
      name: saved.name,
      city: saved.city,
      province: saved.province,
      lat: saved.lat,
      lng: saved.lng,
      type: saved.type,
      avg_rating: saved.avg_rating,
      rating_count: saved.rating_count,
      tags: saved.tags
    }));
  } catch (err) {
    return next(err);
  }
};
