const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_super_secret_key_change_in_prod';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No token provided.' });
  }

  const tokenParts = token.split(' ');
  const tokenString = tokenParts.length > 1 ? tokenParts[1] : token; // support "Bearer <token>"

  jwt.verify(tokenString, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized!' });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
