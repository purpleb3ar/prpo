import { registerAs } from '@nestjs/config';
import { randomBytes } from 'node:crypto';

// In production, when multiple instances will be running
// the clientId needs to be randomly generated for each instance
// they, however, still need to share the queueGroupName

const getClientId = () => {
  const clientName = process.env.NATS_CLIENT_NAME;
  const suffix = randomBytes(8).toString('hex');

  return `${clientName}-${suffix}`;
};

export default registerAs('nats', () => ({
  clusterId: process.env.NATS_CLUSTER_ID,
  clientId: getClientId(),
  url: process.env.NATS_CLIENT_URL,

  queueGroupName: 'auth-depl', // user for load balancing purposes
}));
