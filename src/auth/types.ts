// F:\NestJS\rbms\src\auth\types.ts
import { Request } from 'express'; // Assuming you use express as platform

// This interface extends the Express Request object to include the user property
// that is attached by NestJS AuthGuard('jwt').
// The properties within 'user' must match your JWT payload structure defined in auth.service.ts login method.
export interface RequestWithUser extends Request {
  user: {
    sub: number; // The user's ID (from the 'sub' claim in JWT)
    email: string; // The user's email
    username: string; // The user's username
    role: string; // The user's role name (e.g., 'user', 'admin')
    userType: 'candidate' | 'employee'; // The user's type
    permissions: string[]; // Array of permission names (e.g., 'read', 'create')
    iat: number; // Issued At timestamp
    exp: number; // Expiration timestamp
  };
}