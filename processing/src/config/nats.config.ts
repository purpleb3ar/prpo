import { registerAs } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

// In production, when multiple instances will be running
// the clientId needs to be randomly generated for each instance
// they, however, still need to share the queueGroupName

export default registerAs('nats', () => ({
  clusterId: process.env.NATS_CLUSTER_ID,
  clientId: process.env.NATS_CLIENT_NAME,
  url: process.env.NATS_CLIENT_URL,

  queueGroupName: 'processing-depl', // user for load balancing purposes
}));
