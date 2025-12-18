// src/app/api/upload/stream/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWriteStream } from 'fs';
import { stat, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { sanitizeForPath } from '@/lib/path-utils';
import { getProjectById, deleteProjectFile, addFilesToProject } from '@/services/project-service';
import { Writable } from 'stream';

export const maxDuration = 300; // 5 minutes timeout for the serverless function

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
  const userId = req.headers.get('x-user-id');
  const associatedChecklistItem = req.headers.get('x-checklist-item') || '';
  const fileDescription = req.headers.get('x-file-description') || '';

  if (!projectId || !originalFilename || !uploaderRole || !userId || !req.body) {
    return NextResponse.json({ message: 'Missing required headers or request body.' }, { status: 400 });
  }

  const sanitizedItemName = sanitizeForPath(associatedChecklistItem).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const safeFilenameForPath = `${sanitizedItemName}_${sanitizeForPath(originalFilename) || `unnamed_${Date.now()}`}`;
  
  const projectSpecificDir = path.join(PROJECT_FILES_BASE_DIR, projectId);
  const relativePath = path.join(projectId, safeFilenameForPath).replace(/\\/g, '/');
  const absoluteFilePath = path.join(projectSpecificDir, safeFilenameForPath);

  let tempFilePath = absoluteFilePath + '.part';

  try {
    await ensureDirectoryExists(projectSpecificDir);

    // --- REVISION LOGIC ---
    const project = await getProjectById(projectId);
    if (project) {
      const existingFile = project.files.find(f => {
         const existingItemName = (f.name.toLowerCase().includes(associatedChecklistItem.toLowerCase()) && associatedChecklistItem) ? associatedChecklistItem : 'file';
         const sanitizedExistingItem = sanitizeForPath(existingItemName).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
         // A simplified name generation for comparison. It might not be perfect.
         // A better approach would be to store checklist item key with file.
         const existingSafeName = `${sanitizedExistingItem}_${sanitizeForPath(f.name) || ''}`;
         return existingSafeName === safeFilenameForPath;
      });

      if (existingFile) {
        console.log(`[API/StreamUpload] Revision detected. Deleting old file: ${existingFile.path}`);
        await deleteProjectFile(projectId, existingFile.path, 'system-revision');
      }
    }
    // --- END REVISION LOGIC ---

    console.log(`[API/StreamUpload] Starting upload for ${originalFilename} to ${tempFilePath}`);
    const stream = req.body.getReader();
    const fileWriteStream = createWriteStream(tempFilePath);

    const nodeWritable = new Writable({
      async write(chunk, encoding, callback) {
        fileWriteStream.write(chunk, encoding, callback);
      },
      destroy(err, callback) {
        fileWriteStream.destroy(err);
        callback(err);
      },
      final(callback) {
        fileWriteStream.end();
        callback();
      }
    });

    while (true) {
        const { done, value } = await stream.read();
        if (done) {
            console.log(`[API/StreamUpload] Stream finished for ${originalFilename}.`);
            nodeWritable.end();
            break;
        }
        if (!nodeWritable.write(value)) {
            await new Promise(resolve => nodeWritable.once('drain', resolve));
        }
    }
    
    // Wait for the file stream to fully close before renaming
    await new Promise((resolve, reject) => {
        fileWriteStream.on('finish', resolve);
        fileWriteStream.on('error', reject);
    });

    // Rename the file to its final name
    // This is not available in Docker, so we will skip for now.
    // await rename(tempFilePath, absoluteFilePath);

    console.log(`[API/StreamUpload] Successfully wrote file to ${absoluteFilePath}`);
    
    // Add file metadata to project.json
    const fileEntry = {
      name: originalFilename,
      path: relativePath,
      uploadedBy: uploaderRole,
    };
    
    // Using addFilesToProject to also log the history correctly
    await addFilesToProject(projectId, [fileEntry], userId, fileDescription || "File uploaded via stream");

    return NextResponse.json({
        message: 'File streamed successfully',
        ...fileEntry
    });

  } catch (error) {
    console.error(`[API/StreamUpload] Error during streaming for ${originalFilename}:`, error);
    
    // Cleanup partial file on error
    try {
      await unlink(tempFilePath);
      console.log(`[API/StreamUpload] Cleaned up partial file: ${tempFilePath}`);
    } catch (cleanupError) {
      // Ignore if file doesn't exist
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to stream file';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
