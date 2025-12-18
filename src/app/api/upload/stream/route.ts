// src/app/api/upload/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream } from 'fs';
import { stat, mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import path from 'path';
import { sanitizeForPath } from '@/lib/path-utils';
import { getProjectById, deleteProjectFile } from '@/services/project-service'; // Adjusted import
import { Readable } from 'stream';

export const maxDuration = 300; // Increase timeout to 5 minutes

const DB_BASE_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'database'); // Corrected path
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
    // Extract metadata from headers instead of a FormData body
    const projectId = req.headers.get('x-project-id');
    const originalFilename = req.headers.get('x-file-name');
    const uploaderRole = req.headers.get('x-uploader-role');
    const userId = req.headers.get('x-user-id');
    const associatedChecklistItem = req.headers.get('x-checklist-item');

    if (!projectId || !originalFilename || !uploaderRole || !userId) {
      return NextResponse.json({ message: 'Missing required headers: project-id, file-name, uploader-role, user-id' }, { status: 400 });
    }
    if (!req.body) {
      return NextResponse.json({ message: 'No file stream found in request body' }, { status: 400 });
    }
    
    // Sanitize filename based on checklist item if available for better context
    const sanitizedItemName = (associatedChecklistItem ? sanitizeForPath(associatedChecklistItem) : "file").replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const safeFilenameForPath = `${sanitizedItemName}_${sanitizeForPath(originalFilename) || `unnamed_${Date.now()}`}`;

    const projectSpecificDir = path.join(PROJECT_FILES_BASE_DIR, projectId);
    await ensureDirectoryExists(projectSpecificDir);
    
    const relativePath = path.join(projectId, safeFilenameForPath).replace(/\\/g, '/');
    const absoluteFilePath = path.join(projectSpecificDir, safeFilenameForPath);

    // --- REVISION LOGIC ---
    const project = await getProjectById(projectId);
    if (project) {
        // Corrected logic: find file by checking if the base name matches the newly generated safe name
        const existingFile = project.files.find(f => {
            const checklistItemName = f.name.toLowerCase().split(' ').filter(k => k);
            const sanitizedExistingItem = (checklistItemName ? sanitizeForPath(f.name) : "file").replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const existingSafeName = `${sanitizedExistingItem}_${sanitizeForPath(f.name) || `unnamed_${Date.now()}`}`;
            
            // This is a simplification. A more robust solution might store the checklist item key with the file.
            // For now, we assume a file for a checklist item will be named similarly.
            const isForSameChecklistItem = associatedChecklistItem && f.name.includes(associatedChecklistItem);
            
            // Let's be more direct: if a file for this checklist item exists, replace it.
            // This is tricky without a direct link. A simpler rule: if a file with the *exact same generated path* would be created, delete the old one.
            const existingGeneratedPath = path.join(projectId, existingSafeName).replace(/\\/g, '/');

            // The most direct comparison is if the new path we are about to write to already exists in the records.
            return f.path === relativePath;
        });

        if (existingFile) {
            console.log(`[API/StreamUpload] Revision detected. Deleting old file record and physical file for: ${existingFile.path}`);
            // The service function handles both DB record and physical file
            await deleteProjectFile(projectId, existingFile.path, 'system-revision');
        }
    }
    // --- END REVISION LOGIC ---
    
    const writableStream = createWriteStream(absoluteFilePath);
    
    // Convert Web Stream to Node.js Readable stream
    const bodyReader = req.body.getReader();
    const readableNodeStream = new Readable({
      async read() {
        const { done, value } = await bodyReader.read();
        if (done) {
          this.push(null); // End of stream
        } else {
          this.push(value);
        }
      }
    });

    await pipeline(readableNodeStream, writableStream);

    console.log(`[API/StreamUpload] Successfully streamed file to ${absoluteFilePath}`);

    const fileEntry = {
        name: originalFilename, // Return the original name for DB records
        path: relativePath,
        uploadedBy: uploaderRole,
    };
    
    return NextResponse.json({
        message: 'File streamed successfully',
        ...fileEntry,
    });

  } catch (error) {
    console.error("Error during streaming file upload:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to stream file';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
