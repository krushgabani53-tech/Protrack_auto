import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface TokenPayload {
    user_id: string;
    email: string;
    role: 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const TOKEN_EXPIRY = '7d';

export function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as TokenPayload;
    } catch (_error) {
        return null;
    }
}

export function authenticateToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }

    req.user = decoded;
    next();
}

export function authorizeRole(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
            return;
        }

        next();
    };
}
