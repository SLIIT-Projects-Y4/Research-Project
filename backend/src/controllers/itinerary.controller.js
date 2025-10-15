const client = require('../utils/httpClient');
const { ok } = require('../utils/response');

exports.options = async (req, res, next) => {
  try {
    const { data } = await client.post('/itinerary/options', req.body);
    return res.json(ok(data));
  } catch (err) { next(err); }
};
