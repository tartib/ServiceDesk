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
  KAFKA_ENABLED: Joi.boolean().default(false),
  KAFKA_BROKERS: Joi.string().default('localhost:19092'),
  KAFKA_CLIENT_ID: Joi.string().default('servicedesk-backend'),
  KAFKA_CONSUMER_GROUP: Joi.string().default('servicedesk-consumers'),
  KAFKA_SASL_MECHANISM: Joi.string().valid('plain', 'scram-sha-256', 'scram-sha-512', '').default(''),
  KAFKA_SASL_USERNAME: Joi.string().allow('').default(''),
  KAFKA_SASL_PASSWORD: Joi.string().allow('').default(''),
  KAFKA_SSL_ENABLED: Joi.boolean().default(false),
  KAFKA_CONNECTION_TIMEOUT: Joi.number().default(3000),
  KAFKA_REQUEST_TIMEOUT: Joi.number().default(30000),
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_ACCESS_KEY: Joi.string().default('minioadmin'),
  MINIO_SECRET_KEY: Joi.string().default('minioadmin123'),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_DEFAULT_BUCKET: Joi.string().default('servicedesk-files'),
  MINIO_PUBLIC_URL: Joi.string().default('http://localhost:9000'),
  BASE_URL: Joi.string().default('http://localhost:5000'),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  JWT_REFRESH_SECRET: Joi.string().allow('').optional(),
  POSTGRES_URL: Joi.string().allow('').default(''),
  DB_STRATEGY_ITSM: Joi.string().valid('mongodb', 'postgresql').default('mongodb'),
  DB_STRATEGY_PM: Joi.string().valid('mongodb', 'postgresql').default('mongodb'),
  DB_STRATEGY_FORMS: Joi.string().valid('mongodb', 'postgresql').default('mongodb'),
  DB_STRATEGY_WORKFLOW: Joi.string().valid('mongodb', 'postgresql').default('mongodb'),
  DB_STRATEGY_PLATFORM: Joi.string().valid('mongodb', 'postgresql').default('mongodb'),
  DB_STRATEGY_ANALYTICS: Joi.string().valid('mongodb', 'postgresql').default('mongodb'),
  DB_STRATEGY_SLA: Joi.string().valid('mongodb', 'postgresql').default('mongodb'),
  WORKFLOW_ENGINE_MODE: Joi.string().valid('local', 'remote').default('local'),
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
  KAFKA_ENABLED: boolean;
  KAFKA_BROKERS: string;
  KAFKA_CLIENT_ID: string;
  KAFKA_CONSUMER_GROUP: string;
  KAFKA_SASL_MECHANISM: string;
  KAFKA_SASL_USERNAME: string;
  KAFKA_SASL_PASSWORD: string;
  KAFKA_SSL_ENABLED: boolean;
  KAFKA_CONNECTION_TIMEOUT: number;
  KAFKA_REQUEST_TIMEOUT: number;
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_USE_SSL: boolean;
  MINIO_DEFAULT_BUCKET: string;
  MINIO_PUBLIC_URL: string;
  BASE_URL: string;
  REDIS_URL: string;
  JWT_REFRESH_SECRET?: string;
  POSTGRES_URL: string;
  DB_STRATEGY_ITSM: string;
  DB_STRATEGY_PM: string;
  DB_STRATEGY_FORMS: string;
  DB_STRATEGY_WORKFLOW: string;
  DB_STRATEGY_PLATFORM: string;
  DB_STRATEGY_ANALYTICS: string;
  DB_STRATEGY_SLA: string;
  WORKFLOW_ENGINE_MODE: string;
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
  KAFKA_ENABLED: validatedEnv.KAFKA_ENABLED === 'true' || validatedEnv.KAFKA_ENABLED === true,
  KAFKA_BROKERS: validatedEnv.KAFKA_BROKERS,
  KAFKA_CLIENT_ID: validatedEnv.KAFKA_CLIENT_ID,
  KAFKA_CONSUMER_GROUP: validatedEnv.KAFKA_CONSUMER_GROUP,
  KAFKA_SASL_MECHANISM: validatedEnv.KAFKA_SASL_MECHANISM,
  KAFKA_SASL_USERNAME: validatedEnv.KAFKA_SASL_USERNAME,
  KAFKA_SASL_PASSWORD: validatedEnv.KAFKA_SASL_PASSWORD,
  KAFKA_SSL_ENABLED: validatedEnv.KAFKA_SSL_ENABLED === 'true' || validatedEnv.KAFKA_SSL_ENABLED === true,
  KAFKA_CONNECTION_TIMEOUT: parseInt(validatedEnv.KAFKA_CONNECTION_TIMEOUT, 10),
  KAFKA_REQUEST_TIMEOUT: parseInt(validatedEnv.KAFKA_REQUEST_TIMEOUT, 10),
  MINIO_ENDPOINT: validatedEnv.MINIO_ENDPOINT,
  MINIO_PORT: parseInt(validatedEnv.MINIO_PORT, 10),
  MINIO_ACCESS_KEY: validatedEnv.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: validatedEnv.MINIO_SECRET_KEY,
  MINIO_USE_SSL: validatedEnv.MINIO_USE_SSL === 'true' || validatedEnv.MINIO_USE_SSL === true,
  MINIO_DEFAULT_BUCKET: validatedEnv.MINIO_DEFAULT_BUCKET,
  MINIO_PUBLIC_URL: validatedEnv.MINIO_PUBLIC_URL,
  BASE_URL: validatedEnv.BASE_URL,
  REDIS_URL: validatedEnv.REDIS_URL,
  JWT_REFRESH_SECRET: validatedEnv.JWT_REFRESH_SECRET,
  POSTGRES_URL: validatedEnv.POSTGRES_URL,
  DB_STRATEGY_ITSM: validatedEnv.DB_STRATEGY_ITSM,
  DB_STRATEGY_PM: validatedEnv.DB_STRATEGY_PM,
  DB_STRATEGY_FORMS: validatedEnv.DB_STRATEGY_FORMS,
  DB_STRATEGY_WORKFLOW: validatedEnv.DB_STRATEGY_WORKFLOW,
  DB_STRATEGY_PLATFORM: validatedEnv.DB_STRATEGY_PLATFORM,
  DB_STRATEGY_ANALYTICS: validatedEnv.DB_STRATEGY_ANALYTICS,
  DB_STRATEGY_SLA: validatedEnv.DB_STRATEGY_SLA,
  WORKFLOW_ENGINE_MODE: validatedEnv.WORKFLOW_ENGINE_MODE,
};

export default env;
