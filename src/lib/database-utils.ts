
'use server';

import * as fs from 'fs/promises';
import * as path from 'path';

// This is the correct, reliable path to the data directory from the project root.
const dataDirectory = path.join(process.cwd(), 'src', 'data');

/**
 * Reads a JSON database file securely from the `src/data` directory.
 * To be used ONLY from server-side components or API routes.
 * @param dbPath Relative path to the file from the `src/data` directory (e.g., 'users.json').
 * @param defaultData Default data to return if the file does not exist.
 * @returns A promise that resolves to the parsed data or default data.
 */
export async function readDb<T>(dbPath: string, defaultData: T): Promise<T> {
  const absolutePath = path.join(dataDirectory, dbPath);
  try {
    const data = await fs.readFile(absolutePath, 'utf8');
    return data ? (JSON.parse(data) as T) : defaultData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`[DB Read] CRITICAL: File not found at ${absolutePath}. Check if the file exists. Returning default data.`);
      return defaultData;
    }
    console.error(`[DB Read Error] at ${dbPath}: ${error.message}`);
    // In case of a critical error, returning default data might prevent a crash.
    return defaultData;
  }
}

/**
 * Writes data to a JSON database file securely in the `src/data` directory.
 * To be used ONLY from server-side components or API routes.
 * @param dbPath Relative path to the file from the `src/data` directory.
 * @param data The data to be written.
 */
export async function writeDb<T>(dbPath: string, data: T): Promise<void> {
  const absolutePath = path.join(dataDirectory, dbPath);
  try {
    // Ensure the directory exists before writing.
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`[DB Write Error] at ${dbPath}:`, error);
    throw new Error('Could not write to the database.');
  }
}

