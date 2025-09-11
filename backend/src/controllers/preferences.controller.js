// src/controllers/preferences.controller.js
const User = require('../models/User');
const { ok, fail } = require('../utils/response');

function onboardingComplete(u) {
  const acts = Array.isArray(u.preferred_activities) ? u.preferred_activities : [];
  return Boolean(u.age_group && u.gender && u.travel_companion && acts.length >= 2);
}

exports.getMine = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json(fail('UNAUTHORIZED', 'Unauthorized'));

    const user = await User.findById(
      userId,
      'age_group gender country travel_companion preferred_activities travel_style budget onboarding_completed updatedAt'
    ).lean();

    if (!user) return res.status(404).json(fail('NOT_FOUND', 'User not found'));

    const data = {
      age_group: user.age_group ?? null,
      gender: user.gender ?? null,
      country: user.country ?? null,
      travel_companion: user.travel_companion ?? null,
      preferred_activities: user.preferred_activities ?? [],
      travel_style: user.travel_style ?? null,
      budget: user.budget ?? null,
      onboarding_completed: Boolean(user.onboarding_completed || onboardingComplete(user)),
      updatedAt: user.updatedAt
    };
    return res.json(ok(data));
  } catch (err) {
    console.error('preferences.getMine error:', err);
    return res.status(500).json(fail('SERVER_ERROR', 'Failed to read preferences'));
  }
};

exports.updateMine = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json(fail('UNAUTHORIZED', 'Unauthorized'));

    const allowed = [
      'age_group',
      'gender',
      'country',
      'travel_companion',
      'preferred_activities',
      'travel_style',
      'budget'
    ];
    const updates = {};
    for (const k of allowed) if (k in req.body && req.body[k] !== undefined) updates[k] = req.body[k];

    // normalize
    if ('preferred_activities' in updates) {
      if (!Array.isArray(updates.preferred_activities)) {
        return res.status(400).json(fail('VALIDATION_ERROR', 'preferred_activities must be an array of strings'));
      }
      updates.preferred_activities = updates.preferred_activities.map((s) => String(s).trim()).filter(Boolean);
    }
    for (const k of ['age_group','gender','country','travel_companion','travel_style','budget']) {
      if (k in updates && updates[k] != null) updates[k] = String(updates[k]).trim();
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, projection: { password_hash: 0 } }).lean();
    if (!user) return res.status(404).json(fail('NOT_FOUND', 'User not found'));

    const ob = Boolean(user.onboarding_completed || onboardingComplete(user));
    if (ob !== user.onboarding_completed) {
      await User.findByIdAndUpdate(userId, { $set: { onboarding_completed: ob } }, { new: false });
    }

    return res.json(ok({ ...updates, onboarding_completed: ob }));
  } catch (err) {
    console.error('preferences.updateMine error:', err);
    return res.status(500).json(fail('SERVER_ERROR', 'Failed to update preferences'));
  }
};
