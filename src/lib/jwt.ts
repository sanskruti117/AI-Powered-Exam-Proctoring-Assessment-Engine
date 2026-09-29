import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "EXAMINER" | "STUDENT";
export type AccountStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  status: AccountStatus;
  institution?: string | null;
  department?: string | null;
  [key: string]: unknown;
}

const JWT_SECRET = process.env.JWT_SECRET || "exam_proctoring_super_secure_jwt_secret_key_32bytes_long";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export const AUTH_COOKIE_NAME = "proctor_auth_token";
export const REFRESH_COOKIE_NAME = "proctor_refresh_token";

/**
 * Sign an Edge-compatible JSON Web Token
 */
export async function signToken(payload: TokenPayload, expiresIn: string = "15m"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Sign a Refresh Token
 */
export async function signRefreshToken(userId: string, expiresIn: string = "7d"): Promise<string> {
  return new SignJWT({ userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verify and decode an Edge-compatible JWT
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}
