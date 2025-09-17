require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/criminal-music',
  JWT_SECRET: process.env.JWT_SECRET || 'criminal_music_secret_key_2024',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8454342252:AAHQDVIO_88fzt1o0yf6Ash43sc7Ho030o4',
  
  // File Storage (AWS S3 or similar)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'criminal-music-files',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  
  // Telegram Mini App
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
  WEBAPP_URL: process.env.WEBAPP_URL || 'http://localhost:3000',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // File Upload Limits
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB) || 200,
  MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB) || 200) * 1024 * 1024,
  ALLOWED_AUDIO_TYPES: (process.env.ALLOWED_AUDIO_TYPES || 'audio/mpeg,audio/wav,audio/ogg').split(','),
  ALLOWED_IMAGE_TYPES: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  
  // Mood categories for radio
  MOOD_CATEGORIES: {
    AGGRESSION: { icon: '🔫', name: 'Агрессия', tags: ['rage', 'anger', 'fight', 'hardcore'] },
    MELANCHOLY: { icon: '🌧️', name: 'Меланхолия', tags: ['sad', 'rain', 'lonely', 'blues'] },
    LOVE: { icon: '❤️‍🔥', name: 'Любовь', tags: ['love', 'romance', 'passion', 'heart'] },
    MYSTERY: { icon: '🎭', name: 'Тайна', tags: ['mystery', 'dark', 'secret', 'underground'] },
    ENERGY: { icon: '🏃', name: 'Энергия', tags: ['energy', 'run', 'fast', 'adrenaline'] }
  }
};

// Validation
if (!config.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using default (not secure for production)');
}

if (!config.TELEGRAM_BOT_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN not set, Telegram integration will not work');
}

module.exports = config;
