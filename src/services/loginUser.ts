import { loginUser as loginUserService } from "./userService";

export interface loginCredentials {
  email: string;
  password: string;
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

export async function loginUser(
  credentials: loginCredentials,
): Promise<LoginResponse> {
  return loginUserService(credentials.email, credentials.password);
}
