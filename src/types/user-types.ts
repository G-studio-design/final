
export interface User {
    id: string;
    username: string;
    roles: string[];
    password?: string;
    email?: string | null;
    displayName?: string | null;
    createdAt?: string;
}
