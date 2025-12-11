// src/app/api/users/[userId]/avatar/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { stat, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import mime from 'mime';
import { updateUserProfilePicture } from '@/services/user-service';

// The base directory for uploads is now pointing to the 'public' folder directly.
// The 'uploads/avatars' part will be handled by the volume mapping in docker-compose.
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'avatars');

async function ensureDirectoryExists(directoryPath: string) {
  try {
    await stat(directoryPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Create the directory recursively if it doesn't exist.
      // This is crucial for the Docker volume mapping to work correctly on first run.
      await mkdir(directoryPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ message: 'User ID is required.' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No avatar file provided.' }, { status: 400 });
    }

    // Ensure the final directory exists. This is now safe.
    await ensureDirectoryExists(UPLOAD_DIR);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique filename
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    const fileExtension = mime.getExtension(file.type) || 'jpg';
    const filename = `${userId}_${uniqueSuffix}.${fileExtension}`;
    const filePath = join(UPLOAD_DIR, filename);

    // Write the file to the correct path inside the container,
    // which Docker will map to the NAS.
    await writeFile(filePath, buffer);

    // The URL served to the client remains the same public-facing path.
    const fileUrl = `/uploads/avatars/${filename}`;

    // Update user record in the database with the new URL
    const updatedUser = await updateUserProfilePicture(userId, fileUrl);

    return NextResponse.json({
      message: 'Profile picture updated successfully.',
      user: updatedUser,
    });

  } catch (error: any) {
    console.error(`[API/AvatarUpload] Error for user ${userId}:`, error);
    return NextResponse.json({ message: error.message || 'Failed to upload avatar.' }, { status: 500 });
  }
}
