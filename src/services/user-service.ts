
'use server';

import type { User } from '@/types/user-types';
import { readDb } from '@/lib/database-utils';

const USERS_DB_PATH = 'users.json';

/**
 * Reads all users from the database.
 * Returns an empty array if the database file cannot be read or is empty.
 * @returns A promise that resolves to an array of users.
 */
async function getAllUsers(): Promise<User[]> {
    try {
        // readDb is designed to be safe and return default data on failure.
        return await readDb<User[]>(USERS_DB_PATH, []);
    } catch (error) {
        console.error('[user-service] Critical error in getAllUsers:', error);
        // Return an empty array to prevent downstream crashes.
        return [];
    }
}

/**
 * Verifies user credentials against the database.
 * This function is designed to be robust and never throw an unhandled exception.
 * @param usernameInput The username to verify.
 * @param passwordInput The password to verify.
 * @returns A promise that resolves to the user object (without password) on success, or null on failure.
 */
export async function verifyUserCredentials(usernameInput: string, passwordInput: string): Promise<Omit<User, 'password'> | null> {
    const users = await getAllUsers();
    
    // If the database is empty or could not be read, no user can be verified.
    if (!users || users.length === 0) {
        console.error("[user-service] No users found in database or database is unreadable.");
        return null;
    }

    const user = users.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());

    // User not found.
    if (!user) {
        console.log(`[user-service] Login attempt failed: username '${usernameInput}' not found.`);
        return null;
    }

    // Password does not match.
    if (user.password !== passwordInput) {
        console.log(`[user-service] Login attempt failed: incorrect password for username '${usernameInput}'.`);
        return null;
    }

    // On successful verification, return user data without the password.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

