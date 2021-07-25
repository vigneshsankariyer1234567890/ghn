declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    REDIS_URL: string;
    PORT: string;
    SESSION_SECRET: string;
    CORS: string;
    TELE_API_ID: string;
    TELE_API_HASH: string;
    TELE_SESSION_STR: string;
    SMTP_PASSWORD: string;
  }
}