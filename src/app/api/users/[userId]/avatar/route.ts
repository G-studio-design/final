// src/app/api/users/[userId]/avatar/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { stat, mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import mime from 'mime';
import { updateUserProfilePicture, findUserById } from '@/services/user-service';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'avatars');

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

    await ensureDirectoryExists(UPLOAD_DIR);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    const fileExtension = mime.getExtension(file.type) || 'jpg';
    const filename = `${userId}_${uniqueSuffix}.${fileExtension}`;
    const relativePath = join('/uploads', 'avatars', filename);

    const updatedUser = await updateUserProfilePicture(userId, relativePath);

    const absolutePath = join(UPLOAD_DIR, filename);
    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      message: 'Profile picture updated successfully.',
      user: updatedUser,
    });

  } catch (error: any) {
    console.error(`[API/AvatarUpload POST] Error for user ${userId}:`, error);
    return NextResponse.json({ message: error.message || 'Failed to upload avatar.' }, { status: 500 });
  }
}
