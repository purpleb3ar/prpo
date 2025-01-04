import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  secretKey: process.env.MINIO_SECRET_KEY,
  accessKey: process.env.MINIO_ACCESS_KEY,
  port: process.env.MINIO_PORT,
  host: process.env.MINIO_HOST,

  bucketName: 'puzzles',
}));
