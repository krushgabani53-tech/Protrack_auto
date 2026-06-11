import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
    try {
        return await bcryptjs.hash(password, SALT_ROUNDS);
    } catch (error) {
        throw new Error('Password hashing failed', { cause: error });
    }
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    try {
        return await bcryptjs.compare(password, hash);
    } catch (error) {
        throw new Error('Password comparison failed', { cause: error });
    }
}
