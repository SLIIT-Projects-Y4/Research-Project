const client = require('../utils/httpClient');
const { ok } = require('../utils/response');

exports.generate = async (req, res, next) => {
  try {
    const { data } = await client.post('/plan/generate', req.body);
    return res.json(ok(data));
  } catch (err) { next(err); }
};
