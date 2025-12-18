// src/app/api/upload/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream } from 'fs';
import { stat, mkdir, unlink, rename } from 'fs/promises';
import path from 'path';
import { sanitizeForPath } from '@/lib/path-utils';
import { getProjectById, deleteProjectFile, addFilesToProject } from '@/services/project-service';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export const maxDuration = 300; // 5 minutes timeout

const DB_BASE_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'database');
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
  const projectId = req.headers.get('x-project-id');
  const originalFilename = req.headers.get('x-file-name');
  const uploaderRole = req.headers.get('x-uploader-role');
  const uploaderUsername = req.headers.get('x-user-id'); // In this context, it's the user's username for logging history
  const associatedChecklistItem = req.headers.get('x-checklist-item') || '';

  if (!projectId || !originalFilename || !uploaderRole || !uploaderUsername || !req.body) {
    return NextResponse.json({ message: 'Missing required headers or request body.' }, { status: 400 });
  }

  const sanitizedItemName = sanitizeForPath(associatedChecklistItem).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const safeFilenameForPath = `${sanitizedItemName}_${sanitizeForPath(originalFilename) || `unnamed_${Date.now()}`}`;
  
  const projectSpecificDir = path.join(PROJECT_FILES_BASE_DIR, projectId);
  const relativePath = path.join(projectId, safeFilenameForPath).replace(/\\/g, '/');
  const absoluteFilePath = path.join(projectSpecificDir, safeFilenameForPath);
  
  const tempFilePath = `${absoluteFilePath}.${Date.now()}.part`;

  try {
    await ensureDirectoryExists(projectSpecificDir);
    
    const project = await getProjectById(projectId);
    if (!project) {
        return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }
    
    // Check for existing files associated with the same checklist item to perform revision
    if (associatedChecklistItem) {
        // Simplified logic: find any file whose name indicates it belongs to this checklist item.
        const fileToDelete = project.files.find(f => 
            f.name.toLowerCase().includes(associatedChecklistItem.toLowerCase()) || 
            f.path.toLowerCase().includes(sanitizedItemName)
        );

        if (fileToDelete) {
            console.log(`[API/StreamUpload] Revision detected for item '${associatedChecklistItem}'. Deleting old file: ${fileToDelete.path}`);
            await deleteProjectFile(projectId, fileToDelete.path, 'system-revision');
        }
    }
    
    console.log(`[API/StreamUpload] Starting robust stream to temp file: ${tempFilePath}`);
    
    const webStream = req.body as ReadableStream<Uint8Array>;
    const nodeReadable = Readable.fromWeb(webStream);
    const fileWriteStream = createWriteStream(tempFilePath);
    
    await pipeline(nodeReadable, fileWriteStream);
    
    console.log(`[API/StreamUpload] Successfully wrote temp file: ${tempFilePath}`);

    // Atomically move the file to its final destination
    await rename(tempFilePath, absoluteFilePath);
    console.log(`[API/StreamUpload] Renamed temp file to final destination: ${absoluteFilePath}`);

    const fileEntry = {
      name: originalFilename,
      path: relativePath,
      uploadedBy: uploaderRole,
    };
    
    await addFilesToProject(projectId, [fileEntry], uploaderUsername, associatedChecklistItem || `File uploaded: ${originalFilename}`);

    return NextResponse.json({
        message: 'File streamed successfully',
        ...fileEntry
    });

  } catch (error) {
    console.error(`[API/StreamUpload] Error during streaming for ${originalFilename}:`, error);
    
    try {
      await unlink(tempFilePath);
      console.log(`[API/StreamUpload] Cleaned up partial file: ${tempFilePath}`);
    } catch (cleanupError: any) {
      if (cleanupError.code !== 'ENOENT') {
          console.error(`[API/StreamUpload] Failed to clean up partial file ${tempFilePath}:`, cleanupError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to stream file';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
