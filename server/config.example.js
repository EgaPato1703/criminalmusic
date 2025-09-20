module.exports = {
  NODE_ENV: 'development',
  PORT: 5000,
  MONGODB_URI: 'mongodb://localhost:27017/criminal-music',
  JWT_SECRET: 'your_super_secret_jwt_key_here',
  TELEGRAM_BOT_TOKEN: '8454342252:AAHQDVIO_88fzt1o0yf6Ash43sc7Ho030o4',
  
  // File Storage (AWS S3 or similar)
  AWS_ACCESS_KEY_ID: 'your_aws_access_key',
  AWS_SECRET_ACCESS_KEY: 'your_aws_secret_key',
  AWS_BUCKET_NAME: 'criminal-music-files',
  AWS_REGION: 'us-east-1',
  
  // Telegram Mini App
  TELEGRAM_BOT_USERNAME: 'your_bot_username',
  WEBAPP_URL: 'https://your-domain.com',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // File Upload Limits
  MAX_FILE_SIZE_MB: 200,
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};
