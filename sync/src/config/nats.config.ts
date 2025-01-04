import { registerAs } from '@nestjs/config';

export default registerAs('nats', () => ({
  clusterId: process.env.NATS_CLUSTER_ID,
  clientId: process.env.NATS_CLIENT_NAME,
  url: process.env.NATS_CLIENT_URL,

  queueGroupName: 'sync-service', // user for load balancing purposes
}));
