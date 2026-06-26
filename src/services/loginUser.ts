import { getExternalToken } from "./externalApi";

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
  credentials: loginCredentials
): Promise<LoginResponse> {
  const API_URL = process.env.PODCAST_BSE_URL;

  if (!API_URL) {
    throw new Error("Missing PODCAST_BSE_URL");
  }

  const tokenData = await getExternalToken();
  const jwt = tokenData.token;

  if (!jwt) {
    throw new Error("Failed to obtain JWT from external API");
  }

  const requestBody = {
    email: credentials.email,
    password: credentials.password
  };

  const response = await fetch(`${API_URL}/api/v1/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`
    },
    body: JSON.stringify(requestBody)
  });

  if (response.status === 401) {
    throw new Error("401 Unauthorized");
  }

  if (response.status === 404) {
    throw new Error("404 Not Found");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`External API error: ${response.status} - ${text}`);
  }

  return response.json();
}
