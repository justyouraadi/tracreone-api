import { Queue } from "bullmq";
import { queueConnectionOptions } from "../config/redis";

export const NOTIFICATION_QUEUE = "notifications";
export const FOLLOW_UP_QUEUE = "follow-up-reminders";

export const notificationQueue = new Queue(NOTIFICATION_QUEUE, { connection: queueConnectionOptions });
export const followUpQueue = new Queue(FOLLOW_UP_QUEUE, { connection: queueConnectionOptions });

export interface NotificationJob {
  userId: number;
  title: string;
  body: string;
}

export interface FollowUpReminderJob {
  followUpId: number;
  leadId: number;
}

// Retry transient failures (e.g. provider/network hiccups) with exponential
// backoff instead of dropping the job after a single attempt.
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: 500,
  removeOnFail: 1000,
};

export async function enqueueNotification(job: NotificationJob) {
  await notificationQueue.add("send", job, defaultJobOptions);
}

export async function scheduleFollowUpReminder(job: FollowUpReminderJob, dueAt: Date) {
  const delay = Math.max(0, dueAt.getTime() - Date.now());
  await followUpQueue.add("remind", job, { ...defaultJobOptions, delay });
}
