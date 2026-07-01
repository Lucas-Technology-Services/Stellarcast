import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }
  return _pool;
}

export interface CreateUser {
  email: string;
  password: string;
  access_type: string;
}

export interface CreateUserResponse {
  id: string;
  email: string;
  access_type: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  user: {
    id: string;
    email: string;
    access_type: string;
    created_at: string;
    updated_at: string;
  };
}

function mapAccessTypeForDB(accessType: string): string {
  if (accessType === "viewer") return "spector";
  return accessType;
}

function mapAccessTypeForAPI(accessType: string): string {
  if (accessType === "spector") return "viewer";
  return accessType;
}

export async function CreateUser(
  userCreation: CreateUser,
): Promise<CreateUserResponse> {
  const hashed = await bcrypt.hash(userCreation.password, 10);

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO public.users (email, password, access_type)
     VALUES ($1, $2, $3)
     RETURNING id, email, access_type, created_at, updated_at`,
    [userCreation.email, hashed, mapAccessTypeForDB(userCreation.access_type)],
  );

  return {
    ...result.rows[0],
    access_type: mapAccessTypeForAPI(result.rows[0].access_type),
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT id, email, password, access_type, created_at, updated_at
     FROM public.users WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  );

  if (result.rows.length === 0) {
    throw new Error("invalid email or password");
  }

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("invalid email or password");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not configured");
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const token = jwt.sign(
    {
      user_id: user.id,
      email: user.email,
      access_type: mapAccessTypeForAPI(user.access_type),
      exp: Math.floor(expiresAt.getTime() / 1000),
    },
    jwtSecret,
    { algorithm: "HS256" },
  );

  return {
    token,
    expires_at: expiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      access_type: mapAccessTypeForAPI(user.access_type),
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
}
