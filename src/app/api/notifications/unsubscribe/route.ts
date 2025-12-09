// src/app/api/notifications/unsubscribe/route.ts
import { NextResponse } from 'next/server';
import { deleteSubscription } from '@/services/notification-service';
import type { PushSubscription } from 'web-push';

interface UnsubscribeRequest {
    subscription: PushSubscription;
}

export async function POST(request: Request) {
    try {
        const body: UnsubscribeRequest = await request.json();
        const { subscription } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Missing subscription object or endpoint.' }, { status: 400 });
        }

        await deleteSubscription(subscription);
        
        return NextResponse.json({ success: true, message: 'Subscription removed.' });

    } catch (error: any) {
        console.error('[API/Unsubscribe] Error removing subscription:', error);
        return NextResponse.json({ error: 'Failed to remove subscription.' }, { status: 500 });
    }
}
