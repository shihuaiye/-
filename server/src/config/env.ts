export const env = {
  port: Number(process.env.PORT) || 3100,
  jwtSecret: process.env.JWT_SECRET || "secondhand-dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "secondhand",
  },
};
