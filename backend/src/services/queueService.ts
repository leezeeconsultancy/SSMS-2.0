import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Create a new queue
export const notificationQueue = new Queue('Notifications', { connection });

// Add a job to the queue
export const sendNotification = async (userId: string, title: string, message: string) => {
  await notificationQueue.add('send-notification', { userId, title, message });
};

// Create a worker to process the jobs
export const notificationWorker = new Worker(
  'Notifications',
  async (job: Job) => {
    const { userId, title, message } = job.data;
    
    // Simulate sending email / push notification
    console.log(`[Notification Worker] Sending ${title} to User ${userId}: ${message}`);
    
    // In a real app, this would use FCM, WebSockets, or Nodemailer
    return { success: true, deliveredAt: new Date() };
  },
  { connection }
);

notificationWorker.on('completed', (job: Job) => {
  console.log(`Job with id ${job.id} has been completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Job failed with error ${err.message}`);
});
