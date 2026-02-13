import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  API_VERSION: Joi.string().default('v1'),
  MONGODB_URI: Joi.string().required().description('MongoDB connection URI'),
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (min 32 characters)'),
  JWT_EXPIRE: Joi.string().default('7d'),
  JWT_REFRESH_EXPIRE: Joi.string().default('30d'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  LOG_FILE_PATH: Joi.string().default('./logs'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(1000),
  FIREBASE_PROJECT_ID: Joi.string().allow('').optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().allow('').optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().allow('').optional(),
  SMS_API_KEY: Joi.string().allow('').optional(),
  SMS_PROVIDER: Joi.string().allow('').optional(),
  TZ: Joi.string().default('Asia/Riyadh'),
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  RABBITMQ_ENABLED: Joi.boolean().default(false),
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_ACCESS_KEY: Joi.string().default('minioadmin'),
  MINIO_SECRET_KEY: Joi.string().default('minioadmin123'),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_DEFAULT_BUCKET: Joi.string().default('servicedesk-files'),
  MINIO_PUBLIC_URL: Joi.string().default('http://localhost:9000'),
}).unknown(true); // Allow other env vars

// Validate environment variables
const { error, value: validatedEnv } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const errorMessages = error.details.map((detail) => detail.message).join(', ');
  throw new Error(`Environment validation error: ${errorMessages}`);
}

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_EXPIRE: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
  LOG_FILE_PATH: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_PRIVATE_KEY?: string;
  FIREBASE_CLIENT_EMAIL?: string;
  SMS_API_KEY?: string;
  SMS_PROVIDER?: string;
  TZ: string;
  RABBITMQ_URL: string;
  RABBITMQ_ENABLED: boolean;
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_USE_SSL: boolean;
  MINIO_DEFAULT_BUCKET: string;
  MINIO_PUBLIC_URL: string;
}

const env: EnvConfig = {
  NODE_ENV: validatedEnv.NODE_ENV,
  PORT: parseInt(validatedEnv.PORT, 10),
  API_VERSION: validatedEnv.API_VERSION,
  MONGODB_URI: validatedEnv.MONGODB_URI,
  JWT_SECRET: validatedEnv.JWT_SECRET,
  JWT_EXPIRE: validatedEnv.JWT_EXPIRE,
  JWT_REFRESH_EXPIRE: validatedEnv.JWT_REFRESH_EXPIRE,
  CORS_ORIGIN: validatedEnv.CORS_ORIGIN,
  LOG_LEVEL: validatedEnv.LOG_LEVEL,
  LOG_FILE_PATH: validatedEnv.LOG_FILE_PATH,
  RATE_LIMIT_WINDOW_MS: parseInt(validatedEnv.RATE_LIMIT_WINDOW_MS, 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(validatedEnv.RATE_LIMIT_MAX_REQUESTS, 10),
  FIREBASE_PROJECT_ID: validatedEnv.FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY: validatedEnv.FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL: validatedEnv.FIREBASE_CLIENT_EMAIL,
  SMS_API_KEY: validatedEnv.SMS_API_KEY,
  SMS_PROVIDER: validatedEnv.SMS_PROVIDER,
  TZ: validatedEnv.TZ,
  RABBITMQ_URL: validatedEnv.RABBITMQ_URL,
  RABBITMQ_ENABLED: validatedEnv.RABBITMQ_ENABLED === 'true' || validatedEnv.RABBITMQ_ENABLED === true,
  MINIO_ENDPOINT: validatedEnv.MINIO_ENDPOINT,
  MINIO_PORT: parseInt(validatedEnv.MINIO_PORT, 10),
  MINIO_ACCESS_KEY: validatedEnv.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: validatedEnv.MINIO_SECRET_KEY,
  MINIO_USE_SSL: validatedEnv.MINIO_USE_SSL === 'true' || validatedEnv.MINIO_USE_SSL === true,
  MINIO_DEFAULT_BUCKET: validatedEnv.MINIO_DEFAULT_BUCKET,
  MINIO_PUBLIC_URL: validatedEnv.MINIO_PUBLIC_URL,
};

export default env;
