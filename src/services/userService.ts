import { getExternalToken } from "./externalApi";

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
export async function CreateUser(
    userCreation: CreateUser
): Promise<CreateUserResponse> {
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
        email: userCreation.email,
        password: userCreation.password,
        access_type: userCreation.access_type
    };

    const response = await fetch(`${API_URL}/api/v1/users/register`, {
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