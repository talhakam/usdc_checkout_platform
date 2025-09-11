export const CACHE_KEYS = {
  // User data
  USER: (id: string) => `user:${id}`,
  USER_REWARDS: (id: string) => `user:${id}:rewards`,
  USER_TRANSACTIONS: (id: string) => `user:${id}:transactions`,
  
  // Merchant data
  MERCHANT: (id: string) => `merchant:${id}`,
  MERCHANT_SALES: (id: string) => `merchant:${id}:sales`,
  MERCHANT_QR: (id: string) => `merchant:${id}:qr`,
  
  // Transaction data
  TRANSACTION: (id: string) => `transaction:${id}`,
  TRANSACTION_STATUS: (id: string) => `transaction:${id}:status`,
  
  // Analytics
  DAILY_STATS: (date: string) => `stats:daily:${date}`,
  MERCHANT_ANALYTICS: (id: string, period: string) => `analytics:merchant:${id}:${period}`,
  
  // Session data
  SESSION: (sessionId: string) => `session:${sessionId}`,
  RATE_LIMIT: (ip: string) => `ratelimit:${ip}`,
}

export const CACHE_DURATIONS = {
  DEFAULT: 3600,           // 1 hour
  USER_DATA: 1800,         // 30 minutes
  MERCHANT_DATA: 3600,     // 1 hour
  TRANSACTION_DATA: 300,   // 5 minutes
  ANALYTICS: 7200,         // 2 hours
  RATE_LIMIT: 60,          // 1 minute
  SESSION: 86400,          // 24 hours
}