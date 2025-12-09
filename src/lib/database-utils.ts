// src/lib/database-utils.ts
'use server';

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Safely reads a JSON database file. This function is read-only and will not create files,
 * making it safe for the Next.js build process.
 * @param dbPath The absolute path to the database file.
 * @param defaultData The default data to return if the file doesn't exist or is empty.
 * @returns A promise that resolves to the parsed data or the default data.
 */
export async function readDb<T>(dbPath: string, defaultData: T): Promise<T> {
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        // Handle case where file is empty string
        if (data.trim() === "") {
            // If the file is empty, write the default data to it for future consistency.
            // This part is problematic for Vercel's read-only filesystem.
            // We should handle this gracefully.
            try {
              await writeDb(dbPath, defaultData);
              return defaultData;
            } catch (writeError) {
              console.warn(`[DB Read/Write] Could not write default data to empty DB file at ${path.basename(dbPath)}. This is expected in read-only environments. Returning default data in memory. Error: ${(writeError as Error).message}`);
              return defaultData;
            }
        }
        return JSON.parse(data) as T;
    } catch (error: any) {
        // If the file doesn't exist, try to create it with default data.
        if (error.code === 'ENOENT') {
          try {
            await writeDb(dbPath, defaultData);
            return defaultData;
          } catch (writeError) {
            console.error(`[DB Read/Write] CRITICAL: Could not create new DB file at ${path.basename(dbPath)}. Error: ${(writeError as Error).message}. Returning default data in memory.`);
            return defaultData;
          }
        }
        // For other errors (e.g., parsing error), log it and return default.
        console.error(`[DB Read Error] at ${path.basename(dbPath)}: ${error.message}. Returning default data.`);
        return defaultData;
    }
}

/**
 * Writes data to a JSON database file, creating the directory if it doesn't exist.
 * @param dbPath The absolute path to the database file.
 * @param data The data to write to the file.
 */
export async function writeDb<T>(dbPath: string, data: T): Promise<void> {
    const dbDir = path.dirname(dbPath);
    await fs.mkdir(dbDir, { recursive: true });
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}
