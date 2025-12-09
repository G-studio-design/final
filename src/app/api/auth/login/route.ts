
import { NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/services/user-service';

// Ensures that this route is treated as a dynamic function,
// preventing it from being cached.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 1. Basic input validation
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required.' },
        { status: 400 } // Bad Request
      );
    }

    // 2. Verify credentials using the robust service
    const user = await verifyUserCredentials(username, password);

    // 3. Handle successful login
    if (user) {
      // Login successful, return user data
      return NextResponse.json(user, { status: 200 });
    } 
    
    // 4. Handle failed login (invalid credentials or other service-level issue)
    else {
      // The service already logged the specific reason (user not found, wrong password).
      // Return a generic but correct "Unauthorized" response.
      return NextResponse.json(
        { message: 'Invalid username or password.' },
        { status: 401 } // Unauthorized
      );
    }

  } catch (error) {
    // 5. Catch any unexpected exceptions during request processing
    console.error('[API/Login] A critical, unhandled exception occurred:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 } // Internal Server Error
    );
  }
}

