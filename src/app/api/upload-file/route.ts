// src/app/api/upload-file/route.ts
'use server';
import { NextResponse, NextRequest } from 'next/server';
import { stat, mkdir, createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { sanitizeForPath } from '@/lib/path-utils';
import { getProjectById, deleteProjectFile } from '@/services/project-service';

const DB_BASE_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data');
const PROJECT_FILES_BASE_DIR = path.join(DB_BASE_PATH, 'project_files');

async function ensureDirectoryExists(directoryPath: string) {
  return new Promise<void>((resolve, reject) => {
    stat(directoryPath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          mkdir(directoryPath, { recursive: true }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          reject(err);
        }
      } else {
        if (!stats.isDirectory()) {
          reject(new Error(`Path exists but is not a directory: ${directoryPath}`));
        } else {
          resolve();
        }
      }
    });
  });
}

// THIS IS THE DEPRECATED ROUTE and should be removed later.
// It is kept for compatibility if any part of the app still uses it.
// It now redirects its logic to the new streaming handler.
export async function POST(req: NextRequest) {
    console.warn("[API/UploadFile] Deprecation Warning: This route is outdated. Use /api/upload/stream instead.");
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const projectId = formData.get('projectId') as string | null;
        const userId = formData.get('userId') as string | null;
        const uploaderRole = formData.get('uploaderRole') as string | null;

        if (!file || !projectId || !userId || !uploaderRole) {
            return NextResponse.json({ message: 'Missing file, projectId, userId, or uploaderRole' }, { status: 400 });
        }

        const projectSpecificDir = path.join(PROJECT_FILES_BASE_DIR, projectId);
        await ensureDirectoryExists(projectSpecificDir);

        const originalFilename = file.name;
        const safeFilenameForPath = sanitizeForPath(originalFilename) || `file_${Date.now()}`;
        const relativePath = path.join(projectId, safeFilenameForPath).replace(/\\/g, '/');
        const absoluteFilePath = path.join(projectSpecificDir, safeFilenameForPath);

        // --- REVISION LOGIC ---
        const project = await getProjectById(projectId);
        if (project) {
            const existingFile = project.files.find(f => path.basename(f.path) === safeFilenameForPath);
            if (existingFile) {
                console.log(`[API/UploadFile] Revision detected. Deleting old file: ${existingFile.path}`);
                await deleteProjectFile(projectId, existingFile.path, 'system-revision');
            }
        }
        // --- END REVISION LOGIC ---

        // Pipe the file stream directly to the filesystem
        const readableStream = file.stream();
        const writableStream = createWriteStream(absoluteFilePath);
        await pipeline(readableStream, writableStream);
        
        const fileEntry = {
            name: originalFilename,
            path: relativePath,
            uploadedBy: uploaderRole,
        };

        return NextResponse.json({ 
            message: 'File uploaded successfully', 
            ...fileEntry
        });

    } catch (error) {
        console.error("Error uploading file (legacy route):", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
