// src/services/data-access/user-data.ts
'use server';

import * as path from 'path';
import type { User } from '@/types/user-types';
import { readDb } from '@/lib/database-utils';

const DB_PATH = path.resolve(process.cwd(), 'database');

/**
 * Reads the entire user database.
 * This is a low-level data access function.
 * @returns A promise that resolves to an array of all User objects.
 */
export async function getAllUsers(): Promise<User[]> {
    // FIX: Corrected the path to point directly to the users.json file in the `database` directory.
    const filePath = path.join(DB_PATH, 'users.json');
    return await readDb<User[]>(filePath, []);
}

export async function getSubscriptionsForUserIds(userIds: string[]): Promise<{userId: string, subscription: any}[]> {
    const filePath = path.join(DB_PATH, 'subscriptions.json');
    const allSubscriptions = await readDb<{userId: string, subscription: any}[]>(filePath, []);
    return allSubscriptions.filter(sub => userIds.includes(sub.userId));
}
