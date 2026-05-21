export const config = {
  port: parseInt(process.env.PORT || '4001'),
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'secret',
  iptvSecret: process.env.IPTV_SECRET || 'secret',
  tokenExpiration: parseInt(process.env.TOKEN_EXPIRATION || '3600'),
  logLevel: process.env.LOG_LEVEL || 'info',
};
