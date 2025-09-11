const ok = (data) => ({ success: true, data });
const fail = (code, message, details) => ({ success: false, error: { code, message, details } });
module.exports = { ok, fail };
