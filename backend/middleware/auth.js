const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  let token = req.cookies?.token || req.header('Authorization');
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_123456');
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
