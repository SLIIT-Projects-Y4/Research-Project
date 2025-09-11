const client = require('../utils/httpClient');
const { ok } = require('../utils/response');

exports.optimize = async (req, res, next) => {
  try {
    const { data } = await client.post('/plan/optimize', req.body);
    return res.json(ok(data));
  } catch (err) { next(err); }
};
