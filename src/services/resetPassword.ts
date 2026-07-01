import { getExternalToken } from "./externalApi";

export async function requestPasswordReset(email: string): Promise<void> {
  const API_URL = process.env.PODCAST_BSE_URL;

  if (!API_URL) {
    throw new Error("Missing PODCAST_BSE_URL");
  }

  const tokenData = await getExternalToken();
  const jwt = tokenData.token;

  if (!jwt) {
    throw new Error("Failed to obtain JWT from external API");
  }

  const response = await fetch(`${API_URL}/api/v1/users/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`
    },
    body: JSON.stringify({ email })
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
}
