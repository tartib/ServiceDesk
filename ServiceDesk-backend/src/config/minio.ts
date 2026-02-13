import * as Minio from 'minio';
import { Readable } from 'stream';
import env from './env';
import logger from '../utils/logger';

class MinIOClient {
  private client: Minio.Client;
  private defaultBucket: string;

  constructor() {
    this.client = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });

    this.defaultBucket = env.MINIO_DEFAULT_BUCKET;
    this.initializeBuckets();
  }

  private async initializeBuckets(): Promise<void> {
    try {
      const buckets = [
        this.defaultBucket,
        `${this.defaultBucket}-images`,
        `${this.defaultBucket}-documents`,
        `${this.defaultBucket}-videos`,
        `${this.defaultBucket}-temp`,
      ];

      for (const bucket of buckets) {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket, 'us-east-1');
          logger.info(`MinIO bucket created: ${bucket}`);

          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          };

          if (bucket.includes('-temp')) {
            await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
          }
        }
      }

      logger.info('MinIO buckets initialized successfully');
    } catch (error) {
      logger.error('Error initializing MinIO buckets:', error);
    }
  }

  getClient(): Minio.Client {
    return this.client;
  }

  getDefaultBucket(): string {
    return this.defaultBucket;
  }

  async uploadFile(
    bucket: string,
    objectName: string,
    stream: Buffer | NodeJS.ReadableStream,
    size: number,
    metadata?: Minio.ItemBucketMetadata
  ): Promise<void> {
    try {
      const metaData = metadata || {};
      const uploadStream = Buffer.isBuffer(stream) ? Readable.from(stream) : Readable.from(stream);
      await this.client.putObject(bucket, objectName, uploadStream, size, metaData);
    } catch (error) {
      logger.error('Error uploading file to MinIO:', error);
      throw error;
    }
  }

  async downloadFile(bucket: string, objectName: string): Promise<NodeJS.ReadableStream> {
    try {
      return await this.client.getObject(bucket, objectName);
    } catch (error) {
      logger.error('Error downloading file from MinIO:', error);
      throw error;
    }
  }

  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, objectName);
      logger.info(`File deleted from MinIO: ${bucket}/${objectName}`);
    } catch (error) {
      logger.error('Error deleting file from MinIO:', error);
      throw error;
    }
  }

  async deleteFiles(bucket: string, objectNames: string[]): Promise<void> {
    try {
      await this.client.removeObjects(bucket, objectNames);
      logger.info(`${objectNames.length} files deleted from MinIO bucket: ${bucket}`);
    } catch (error) {
      logger.error('Error deleting files from MinIO:', error);
      throw error;
    }
  }

  async getFileStats(bucket: string, objectName: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.client.statObject(bucket, objectName);
    } catch (error) {
      logger.error('Error getting file stats from MinIO:', error);
      throw error;
    }
  }

  async generatePresignedUrl(
    bucket: string,
    objectName: string,
    expiry: number = 3600
  ): Promise<string> {
    try {
      return await this.client.presignedGetObject(bucket, objectName, expiry);
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw error;
    }
  }

  async generatePresignedUploadUrl(
    bucket: string,
    objectName: string,
    expiry: number = 3600
  ): Promise<string> {
    try {
      return await this.client.presignedPutObject(bucket, objectName, expiry);
    } catch (error) {
      logger.error('Error generating presigned upload URL:', error);
      throw error;
    }
  }

  async copyFile(
    sourceBucket: string,
    sourceObject: string,
    destBucket: string,
    destObject: string
  ): Promise<void> {
    try {
      const conds = new Minio.CopyConditions();
      await this.client.copyObject(
        destBucket,
        destObject,
        `/${sourceBucket}/${sourceObject}`,
        conds
      );
    } catch (error) {
      logger.error('Error copying file in MinIO:', error);
      throw error;
    }
  }

  async listFiles(
    bucket: string,
    prefix?: string,
    recursive: boolean = false
  ): Promise<Minio.BucketItem[]> {
    try {
      const stream = this.client.listObjects(bucket, prefix, recursive);
      const objects: Minio.BucketItem[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (obj: Minio.BucketItem) => objects.push(obj));
        stream.on('error', reject);
        stream.on('end', () => resolve(objects));
      });
    } catch (error) {
      logger.error('Error listing files from MinIO:', error);
      throw error;
    }
  }

  async getBucketSize(bucket: string): Promise<number> {
    try {
      const objects = await this.listFiles(bucket, '', true);
      return objects.reduce((total, obj) => total + (obj.size || 0), 0);
    } catch (error) {
      logger.error('Error calculating bucket size:', error);
      throw error;
    }
  }
}

export default new MinIOClient();
