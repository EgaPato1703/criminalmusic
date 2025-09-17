const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const User = require('../models/User');

// Verify Telegram WebApp data
const verifyTelegramWebAppData = (initData) => {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Create data check string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.TELEGRAM_BOT_TOKEN)
      .digest();
    
    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    if (calculatedHash !== hash) {
      return null;
    }
    
    // Parse user data
    const userParam = urlParams.get('user');
    if (!userParam) {
      return null;
    }
    
    const userData = JSON.parse(userParam);
    
    // Check auth date (data should not be older than 1 hour)
    const authDate = parseInt(urlParams.get('auth_date'));
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authDate > 3600) {
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Telegram WebApp data verification error:', error);
    return null;
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '7d' });
};

// Authenticate with Telegram WebApp data
const authenticateWebApp = async (req, res, next) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Telegram WebApp data required',
        code: 'MISSING_WEBAPP_DATA'
      });
    }
    
    const userData = verifyTelegramWebAppData(initData);
    
    if (!userData) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid Telegram WebApp data',
        code: 'INVALID_WEBAPP_DATA'
      });
    }
    
    // Find or create user
    let user = await User.findByTelegramId(userData.id.toString());
    
    if (!user) {
      // Create new user
      user = new User({
        telegramId: userData.id.toString(),
        username: userData.username || `user_${userData.id}`,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: 'listener' // Default role
      });
      await user.save();
    } else {
      // Update user info
      user.firstName = userData.first_name || user.firstName;
      user.lastName = userData.last_name || user.lastName;
      user.username = userData.username || user.username;
      user.lastActive = new Date();
      await user.save();
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('WebApp authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Ошибка аутентификации через Telegram',
      code: 'AUTH_ERROR'
    });
  }
};

// Authenticate with JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }
    
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive || user.isBanned) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive',
        code: 'INVALID_USER'
      });
    }
    
    // Update last active
    user.lastActive = new Date();
    await user.save();
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Token authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Ошибка проверки токена',
      code: 'AUTH_ERROR'
    });
  }
};

// Check if user is artist
const requireArtist = (req, res, next) => {
  if (req.user.role !== 'artist') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Artist role required',
      code: 'ARTIST_REQUIRED'
    });
  }
  next();
};

// Check if user is admin (for future use)
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin role required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive && !user.isBanned) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

module.exports = {
  authenticateWebApp,
  authenticateToken,
  requireArtist,
  requireAdmin,
  optionalAuth,
  generateToken,
  verifyTelegramWebAppData
};
