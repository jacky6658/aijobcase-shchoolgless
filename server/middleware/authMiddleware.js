/**
 * JWT 認證中介層
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

// 不需要認證的路徑
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/health',
  '/auth/login',
  '/health',
];

function isPublicPath(path) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
}

/**
 * requireAuth - 驗證 JWT token
 */
function requireAuth(req, res, next) {
  if (isPublicPath(req.path)) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未授權：請先登入' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, studentId, name, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: '登入已過期，請重新登入' });
    }
    return res.status(401).json({ success: false, error: '無效的認證 token' });
  }
}

/**
 * requireRole - 檢查用戶角色
 * @param  {...string} roles - 允許的角色列表
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: '未授權' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: '權限不足' });
    }
    next();
  };
}

/**
 * 生成 JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, studentId: user.student_id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

module.exports = { requireAuth, requireRole, generateToken, JWT_SECRET };
