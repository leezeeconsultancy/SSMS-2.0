import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

// Redis connection instance
// We use 'any' cast here only if the types strictly conflict due to version mismatch in node_modules,
// but first we try to use ConnectionOptions which is the recommended way.
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Create a new queue
export const notificationQueue = new Queue('Notifications', { 
  connection: connection as unknown as ConnectionOptions 
});

// Add a job to the queue
export const sendNotification = async (userId: string, title: string, message: string): Promise<void> => {
  await notificationQueue.add('send-notification', { userId, title, message });
};

// Create a worker to process the jobs
export const notificationWorker = new Worker(
  'Notifications',
  async (job: Job) => {
    const { userId, title, message } = job.data as { userId: string, title: string, message: string };
    
    // Simulate sending email / push notification
    console.log(`[Notification Worker] Sending ${title} to User ${userId}: ${message}`);
    
    return { success: true, deliveredAt: new Date() };
  },
  { connection: connection as unknown as ConnectionOptions }
);

notificationWorker.on('completed', (job: Job) => {
  console.log(`Job with id ${job.id} has been completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Job failed with error ${err.message}`);
});
