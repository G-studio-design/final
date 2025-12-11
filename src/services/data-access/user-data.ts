// src/services/data-access/user-data.ts
'use server';

import * as path from 'path';
import type { User } from '@/types/user-types';
import { readDb } from '@/lib/database-utils';

const DB_BASE_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'database');
const DB_PATH_USERS = path.join(DB_BASE_PATH, 'users.json');
const DB_PATH_SUBSCRIPTIONS = path.join(DB_BASE_PATH, 'subscriptions.json');

/**
 * Reads the entire user database.
 * This is a low-level data access function.
 * @returns A promise that resolves to an array of all User objects.
 */
export async function getAllUsers(): Promise<User[]> {
    return await readDb<User[]>(DB_PATH_USERS, []);
}

export async function getSubscriptionsForUserIds(userIds: string[]): Promise<{userId: string, subscription: any}[]> {
    const allSubscriptions = await readDb<{userId: string, subscription: any}[]>(DB_PATH_SUBSCRIPTIONS, []);
    return allSubscriptions.filter(sub => userIds.includes(sub.userId));
}
