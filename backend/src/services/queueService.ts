import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

/**
 * Queue Service — Redis-backed notification queue.
 * Made safe for deployments where Redis is unavailable.
 * Falls back to console logging when Redis connection fails.
 */

let connection: Redis | null = null;
let notificationQueueInstance: Queue | null = null;
let notificationWorkerInstance: Worker | null = null;

const initRedis = (): boolean => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('[QUEUE] ⚠️ REDIS_URL not set — Queue service DISABLED (notifications will be logged only)');
    return false;
  }

  try {
    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.error(`[QUEUE] ❌ Redis connection failed after ${times} retries — giving up`);
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true, // Don't connect until first command
    });

    connection.on('error', (err: Error) => {
      console.error(`[QUEUE] ❌ Redis error: ${err.message}`);
    });

    connection.on('connect', () => {
      console.log('[QUEUE] ✅ Redis connected');
    });

    return true;
  } catch (error: unknown) {
    console.error('[QUEUE] ❌ Failed to initialize Redis:', error instanceof Error ? error.message : error);
    return false;
  }
};

const redisAvailable = initRedis();

// Create queue and worker only if Redis is available
if (redisAvailable && connection) {
  try {
    notificationQueueInstance = new Queue('Notifications', {
      connection: connection as unknown as ConnectionOptions
    });

    notificationWorkerInstance = new Worker(
      'Notifications',
      async (job: Job) => {
        const { userId, title, message } = job.data as { userId: string; title: string; message: string };
        console.log(`[Notification Worker] Sending ${title} to User ${userId}: ${message}`);
        return { success: true, deliveredAt: new Date() };
      },
      { connection: connection as unknown as ConnectionOptions }
    );

    notificationWorkerInstance.on('completed', (job: Job) => {
      console.log(`[QUEUE] Job ${job.id} completed`);
    });

    notificationWorkerInstance.on('failed', (job, err) => {
      console.error(`[QUEUE] Job failed: ${err.message}`);
    });

    console.log('[QUEUE] ✅ Notification queue and worker initialized');
  } catch (error: unknown) {
    console.error('[QUEUE] ❌ Failed to create queue/worker:', error instanceof Error ? error.message : error);
  }
}

// Public API — safe to call even when Redis is unavailable
export const notificationQueue = notificationQueueInstance;

export const sendNotification = async (userId: string, title: string, message: string): Promise<void> => {
  if (notificationQueueInstance) {
    await notificationQueueInstance.add('send-notification', { userId, title, message });
  } else {
    // Fallback: just log the notification
    console.log(`[NOTIFICATION FALLBACK] ${title} → User ${userId}: ${message}`);
  }
};

export const notificationWorker = notificationWorkerInstance;
