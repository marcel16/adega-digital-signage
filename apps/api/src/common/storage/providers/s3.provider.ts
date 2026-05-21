import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from '../storage.service';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private s3Client: any;
  private bucket: string;
  private endpoint: string;
  private region: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'adega-signage';
    this.endpoint = process.env.S3_ENDPOINT || 'https://s3.amazonaws.com';
    this.region = process.env.S3_REGION || 'us-east-1';
    this.initializeClient();
  }

  private initializeClient(): void {
    const { S3Client } = require('@aws-sdk/client-s3');
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
    this.logger.log(`S3 provider initialized: bucket=${this.bucket}, region=${this.region}`);
  }

  async upload(file: Express.Multer.File, filePath: string): Promise<string> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }));
    this.logger.log(`File uploaded to S3: ${filePath}`);
    return filePath;
  }

  async download(key: string): Promise<Buffer> {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    this.logger.log(`File deleted from S3: ${key}`);
  }

  getUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const { HeadObjectCommand } = require('@aws-sdk/client-s3');
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }
}
