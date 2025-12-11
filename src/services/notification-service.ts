
// src/services/notification-service.ts
'use server';

import * as path from 'path';
import webPush, { type PushSubscription } from 'web-push';
import { getAllUsers } from './data-access/user-data';
import { readDb, writeDb } from '../lib/database-utils';

export interface Notification {
    id: string;
    userId: string;
    projectId?: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    url?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
}

interface StoredSubscriptions {
  userId: string;
  subscriptions: PushSubscription[];
}

const DB_BASE_PATH = path.resolve(process.cwd(), 'database');
const NOTIFICATION_DB_PATH = path.join(DB_BASE_PATH, 'notifications.json');
const SUBSCRIPTION_DB_PATH = path.join(DB_BASE_PATH, 'subscriptions.json');

const NOTIFICATION_LIMIT = 300;

// Initialize VAPID details once
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    try {
        webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        console.log("[NotificationService] VAPID keys loaded successfully.");
    } catch (error) {
        console.error("[NotificationService] CRITICAL: Failed to load VAPID keys.", error);
    }
} else {
    console.warn("[NotificationService] VAPID keys are not configured. Push notifications will be disabled.");
}

async function sendPushNotification(subscription: PushSubscription, payload: NotificationPayload) {
    try {
        const payloadString = JSON.stringify(payload);
        await webPush.sendNotification(subscription, payloadString);
        console.log(`[NotificationService] Push notification sent successfully to endpoint: ${subscription.endpoint.slice(0, 50)}...`);
    } catch (error: any) {
        console.error(`[NotificationService] Failed to send push notification. Status: ${error.statusCode}, Message: ${error.body || error.message}`);
        if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`[NotificationService] Subscription has expired or is no longer valid. Deleting...`);
            await deleteSubscription(subscription);
        }
    }
}

async function addInAppNotifications(userIds: string[], payload: NotificationPayload, projectId?: string): Promise<void> {
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const now = new Date().toISOString();

    for (const userId of userIds) {
        const newNotification: Notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId: userId,
            projectId: projectId,
            message: payload.body,
            url: payload.url,
            timestamp: now,
            isRead: false,
        };
        notifications.unshift(newNotification);
    }
    
    if (notifications.length > NOTIFICATION_LIMIT) {
        notifications.splice(NOTIFICATION_LIMIT);
    }
    
    await writeDb(NOTIFICATION_DB_PATH, notifications);
}

async function findUsersByRole(rolesToFind: string[]): Promise<string[]> {
    const allUsers = await getAllUsers();
    const normalizedRolesToFind = rolesToFind.map(r => r.trim().toLowerCase());

    const userIds = allUsers
        .filter(user => 
            user.roles && Array.isArray(user.roles) &&
            user.roles.some(userRole => normalizedRolesToFind.includes(userRole.trim().toLowerCase()))
        )
        .map(user => user.id);

    console.log(`[NotificationService] Roles to find: [${normalizedRolesToFind.join(', ')}]. Found ${userIds.length} user(s).`);
    return userIds;
}

export async function notifyUsersByRole(roles: string | string[], payload: NotificationPayload, projectId?: string): Promise<void> {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    console.log(`[NotificationService] Preparing to notify roles: ${JSON.stringify(rolesArray)}`);

    const userIdsToNotify = await findUsersByRole(rolesArray);

    if (userIdsToNotify.length === 0) {
        console.warn(`[NotificationService] No users found for role(s): ${rolesArray.join(', ')}. Aborting notification.`);
        return;
    }
    
    await addInAppNotifications(userIdsToNotify, payload, projectId);
    
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        console.log("[NotificationService] Skipping push notifications because VAPID keys are not set.");
        return;
    }

    const allSubscriptions = await readDb<StoredSubscriptions[]>(SUBSCRIPTION_DB_PATH, []);
    const targetSubscriptions = allSubscriptions.filter(s => userIdsToNotify.includes(s.userId));

    for (const userSub of targetSubscriptions) {
        console.log(`[NotificationService] Found ${userSub.subscriptions.length} subscription(s) for user ${userSub.userId}.`);
        await Promise.all(
            userSub.subscriptions.map(subscription => 
                sendPushNotification(subscription, payload)
            )
        );
    }
}

export async function notifyUserById(userId: string, payload: NotificationPayload, projectId?: string): Promise<void> {
    if (!userId) return;
    const userIdsToNotify = [userId];

    if (userIdsToNotify.length === 0) {
        console.warn(`[NotificationService] No users found for ID: ${userId}. Aborting notification.`);
        return;
    }
    
    await addInAppNotifications(userIdsToNotify, payload, projectId);
    
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        console.log("[NotificationService] Skipping push notifications because VAPID keys are not set.");
        return;
    }

    const allSubscriptions = await readDb<StoredSubscriptions[]>(SUBSCRIPTION_DB_PATH, []);

    for (const id of userIdsToNotify) {
        const userSubscriptionRecord = allSubscriptions.find(sub => sub.userId === id);
        if (userSubscriptionRecord && userSubscriptionRecord.subscriptions.length > 0) {
            console.log(`[NotificationService] Found ${userSubscriptionRecord.subscriptions.length} subscription(s) for user ${id}.`);
            await Promise.all(
                userSubscriptionRecord.subscriptions.map(subscription => 
                    sendPushNotification(subscription, payload)
                )
            );
        } else {
             console.log(`[NotificationService] No push subscriptions found for user ${id}.`);
        }
    }
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
    const allNotifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    return allNotifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);

    if (notificationIndex !== -1 && !notifications[notificationIndex].isRead) {
        notifications[notificationIndex].isRead = true;
        await writeDb(NOTIFICATION_DB_PATH, notifications);
    }
}

export async function deleteNotificationsByProjectId(projectId: string): Promise<void> {
    if (!projectId) return;
    const notifications = await readDb<Notification[]>(NOTIFICATION_DB_PATH, []);
    const filtered = notifications.filter(n => n.projectId !== projectId);
    if (notifications.length !== filtered.length) {
        await writeDb(NOTIFICATION_DB_PATH, filtered);
    }
}

export async function clearAllNotifications(): Promise<void> {
    await writeDb(NOTIFICATION_DB_PATH, []);
}

export async function saveSubscription(userId: string, newSubscription: PushSubscription): Promise<void> {
    const allStoredSubscriptions = await readDb<StoredSubscriptions[]>(SUBSCRIPTION_DB_PATH, []);
    let userSubscriptionRecord = allStoredSubscriptions.find(s => s.userId === userId);

    if (userSubscriptionRecord) {
        const subscriptionExists = userSubscriptionRecord.subscriptions.some(
            s => s.endpoint === newSubscription.endpoint
        );
        if (!subscriptionExists) {
            userSubscriptionRecord.subscriptions.push(newSubscription);
        } else {
             console.log(`[NotificationService] Subscription with endpoint ${newSubscription.endpoint.slice(0,50)}... already exists for user ${userId}.`);
        }
    } else {
        userSubscriptionRecord = { userId, subscriptions: [newSubscription] };
        allStoredSubscriptions.push(userSubscriptionRecord);
    }

    await writeDb(SUBSCRIPTION_DB_PATH, allStoredSubscriptions);
    console.log(`[NotificationService] Subscription saved for user ${userId}. User now has ${userSubscriptionRecord.subscriptions.length} subscription(s).`);
}

export async function deleteSubscription(subscriptionToDelete: PushSubscription): Promise<void> {
    const allStoredSubscriptions = await readDb<StoredSubscriptions[]>(SUBSCRIPTION_DB_PATH, []);
    
    const updatedSubscriptions = allStoredSubscriptions.map(userSub => {
        const filteredSubs = userSub.subscriptions.filter(
            s => s.endpoint !== subscriptionToDelete.endpoint
        );
        if (filteredSubs.length > 0) {
            return { ...userSub, subscriptions: filteredSubs };
        }
        return null;
    }).filter((s): s is StoredSubscriptions => s !== null);

    await writeDb(SUBSCRIPTION_DB_PATH, updatedSubscriptions);
    console.log(`[NotificationService] Subscription with endpoint ${subscriptionToDelete.endpoint.slice(0, 50)}... has been deleted.`);
}
