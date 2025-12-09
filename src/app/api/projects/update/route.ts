// src/app/api/projects/update/route.ts
import { NextResponse } from 'next/server';
import { 
    updateProject, 
    reviseProject, 
    markParallelUploadsAsCompleteByDivision,
    manuallyUpdateProjectStatusAndAssignment
} from '@/services/project-service';
import type { UpdateProjectParams } from '@/types/project-types';

interface SpecialActionBody extends UpdateProjectParams {
    specialAction?: 'revise' | 'markDivisionComplete' | 'manualUpdate';
    newStatus?: string;
    newAssignedDivision?: string;
    newNextAction?: string | null;
    newProgress?: number;
    adminUsername?: string;
    reasonNote?: string;
}


export async function POST(request: Request) {
  try {
    const body: SpecialActionBody = await request.json();
    
    let updatedProject;

    switch (body.specialAction) {
        case 'revise':
             if (!body.updaterRoles || body.updaterRoles.length === 0) {
                return NextResponse.json({ message: 'Updater role is required for revision.' }, { status: 400 });
            }
            updatedProject = await reviseProject(
                body.projectId,
                body.updaterUsername,
                body.updaterRoles[0], // Pass the first role as a string
                body.note,
                body.actionTaken
            );
            break;
        case 'markDivisionComplete':
            // Logic to determine the relevant design role from the user's roles
            const designRoles = ['Arsitek', 'Struktur', 'MEP'];
            const actingDivision = body.updaterRoles.find(role => designRoles.includes(role));

            if (!actingDivision) {
                return NextResponse.json({ message: 'No relevant design division role found for this action.' }, { status: 400 });
            }

            updatedProject = await markParallelUploadsAsCompleteByDivision(
                body.projectId,
                actingDivision, // Pass the determined division role
                body.updaterUsername
            );
            break;
        case 'manualUpdate':
             if (!body.newStatus || !body.adminUsername || !body.reasonNote || typeof body.newProgress === 'undefined') {
                return NextResponse.json({ message: 'Missing required fields for manual update.' }, { status: 400 });
            }
            updatedProject = await manuallyUpdateProjectStatusAndAssignment({
                projectId: body.projectId,
                newStatus: body.newStatus,
                newAssignedDivision: body.newAssignedDivision || '',
                newNextAction: body.newNextAction || null,
                newProgress: body.newProgress,
                adminUsername: body.adminUsername,
                reasonNote: body.reasonNote,
            });
            break;
        default:
            updatedProject = await updateProject(body);
            break;
    }


    if (!updatedProject) {
        return NextResponse.json({ message: 'Failed to update project or project not found.' }, { status: 404 });
    }

    return NextResponse.json(updatedProject);

  } catch (error: any) {
    console.error('[API/Projects/Update] Error:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
       if (error.message.includes('REVISION_NOT_SUPPORTED')) {
           errorMessage = 'Revision is not supported for the current project step.';
       } else if (error.message.includes('PROJECT_NOT_FOUND')) {
           errorMessage = 'Project not found.';
       } else {
           errorMessage = error.message;
       }
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
