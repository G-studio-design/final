// src/app/api/upload-file/route.ts
'use server';
import { NextResponse, NextRequest } from 'next/server';
import { stat, mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { sanitizeForPath } from '@/lib/path-utils';
import { getProjectById, deleteProjectFile } from '@/services/project-service';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const DB_BASE_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data');
const PROJECT_FILES_BASE_DIR = path.join(DB_BASE_PATH, 'project_files');

async function ensureDirectoryExists(directoryPath: string) {
  try {
    await stat(directoryPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await mkdir(directoryPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const projectId = formData.get('projectId') as string | null;
        const userId = formData.get('userId') as string | null;
        const uploaderRole = formData.get('uploaderRole') as string | null;

        if (!file || !projectId || !userId || !uploaderRole) {
            return NextResponse.json({ message: 'Missing file, projectId, userId, or uploaderRole' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.length > MAX_FILE_SIZE) {
            return NextResponse.json({ message: 'File size exceeds the limit of 20MB' }, { status: 413 });
        }
        
        const projectSpecificDir = path.join(PROJECT_FILES_BASE_DIR, projectId);
        await ensureDirectoryExists(projectSpecificDir);

        const originalFilename = file.name;
        const safeFilenameForPath = sanitizeForPath(originalFilename) || `file_${Date.now()}`;
        const relativePath = path.join(projectId, safeFilenameForPath).replace(/\\/g, '/');
        const absoluteFilePath = path.join(projectSpecificDir, safeFilenameForPath);

        // --- REVISION LOGIC ---
        // Check if a file with the same sanitized name already exists for this project
        const project = await getProjectById(projectId);
        if (project) {
            const existingFile = project.files.find(f => path.basename(f.path) === safeFilenameForPath);
            if (existingFile) {
                console.log(`[API/UploadFile] Revision detected. Deleting old file: ${existingFile.path}`);
                // The deleteProjectFile service function handles both DB and physical file deletion.
                // We pass a dummy username as this is a system action.
                await deleteProjectFile(projectId, existingFile.path, 'system-revision');
            }
        }
        // --- END REVISION LOGIC ---

        await writeFile(absoluteFilePath, buffer);
        
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
        console.error("Error uploading file:", error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
