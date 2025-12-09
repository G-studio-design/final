// src/app/api/upload-file/route.ts
'use server';
import { NextResponse, NextRequest } from 'next/server';
import { readdir, stat, mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';
import path from 'path';
import { sanitizeForPath } from '@/lib/path-utils';
import { addFilesToProject } from '@/services/project-service';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const PROJECT_FILES_BASE_DIR = path.resolve(process.cwd(), 'database', 'project_files');

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
        // Sanitize filename to prevent path traversal issues and ensure it's valid for filesystems
        const safeFilenameForPath = sanitizeForPath(originalFilename) || `file_${Date.now()}`;
        
        const absoluteFilePath = path.join(projectSpecificDir, safeFilenameForPath);
        await writeFile(absoluteFilePath, buffer);
        
        // Use a relative path (from the base dir) for storage in the JSON database
        const relativePath = path.join(projectId, safeFilenameForPath).replace(/\\/g, '/');

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
