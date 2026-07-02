import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const DIST = path.join(
  process.cwd(),
  "node_modules/swagger-ui-dist",
);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".map": "application/json",
};

function checkAuth(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;

  const user = process.env.SWAGGER_USER;
  const pass = process.env.SWAGGER_PASSWORD;
  if (!user || !pass) return false;

  try {
    const decoded = atob(authHeader.slice(6));
    const colon = decoded.indexOf(":");
    if (colon === -1) return false;
    return (
      decoded.slice(0, colon) === user &&
      decoded.slice(colon + 1) === pass
    );
  } catch {
    return false;
  }
}

function buildSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Stellarcast API",
      version: "1.0.0",
      description:
        "API for managing podcasts, episodes, categories, and user authentication.",
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        machineToken: {
          type: "http",
          scheme: "bearer",
          description:
            "Machine JWT token obtained from POST /auth/token",
        },
        userToken: {
          type: "http",
          scheme: "bearer",
          description:
            "User JWT token obtained from POST /api/auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "string" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Podcast: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            podcast_category_id: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            cover_image_url: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        PodcastWithCategory: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            podcast_category_id: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            cover_image_url: { type: "string", nullable: true },
            category: {
              allOf: [
                { $ref: "#/components/schemas/Category" },
                { nullable: true },
              ],
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Episode: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            podcast_id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            masked_video_token: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "processing", "published", "failed"],
            },
            duration_seconds: { type: "number", nullable: true },
            thumbnail_url: { type: "string", nullable: true },
            published_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
            play_count: { type: "number" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            access_type: {
              type: "string",
              enum: ["producer", "viewer"],
            },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            expires_at: { type: "string", format: "date-time" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
          },
        },
        TokenValidateResponse: {
          type: "object",
          properties: {
            message: { type: "string", enum: ["SUCCESS"] },
            status: { type: "string", enum: ["AUTHORIZED"] },
          },
        },
      },
    },
    paths: {
      "/auth/token": {
        post: {
          tags: ["Auth"],
          summary: "Generate a machine token",
          description:
            "Generates a short-lived JWT (120s). Uses server-side credentials — no request body required.",
          responses: {
            "201": {
              description: "Token generated successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TokenResponse",
                  },
                },
              },
            },
            "400": {
              description: "Missing credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Invalid client_id or secret",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/auth/token/validate": {
        post: {
          tags: ["Auth"],
          summary: "Validate a token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: { token: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Token is valid",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TokenValidateResponse",
                  },
                },
              },
            },
            "400": {
              description: "Token is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Token not found, expired, or invalid",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Request a password reset",
          description:
            "Validates the email exists in the database. Requires a machine token.",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Generic success message (does not reveal if email exists)",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Email is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "access_type"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    access_type: {
                      type: "string",
                      enum: ["producer", "viewer"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
            "400": {
              description: "Missing or invalid fields",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "409": {
              description: "Email already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email and password",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LoginResponse",
                  },
                },
              },
            },
            "400": {
              description: "Missing email or password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/categories": {
        get: {
          tags: ["Categories"],
          summary: "List all categories",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
          ],
          responses: {
            "200": {
              description: "List of categories",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Categories"],
          summary: "Create a category",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Category created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Category" },
                },
              },
            },
            "400": {
              description: "Name is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/categories/{name}": {
        get: {
          tags: ["Categories"],
          summary: "Get a category by name",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Category details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Category" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Categories"],
          summary: "Update a category",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Category updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Category" },
                },
              },
            },
            "400": {
              description: "Name is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Categories"],
          summary: "Delete a category",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "204": { description: "Deleted successfully" },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/podcasts": {
        get: {
          tags: ["Podcasts"],
          summary: "List all podcasts",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
          ],
          responses: {
            "200": {
              description: "List of podcasts",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Podcast" },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Podcasts"],
          summary: "Create a podcast",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "category_name"],
                  properties: {
                    title: { type: "string" },
                    category_name: { type: "string" },
                    email: { type: "string", format: "email" },
                    description: { type: "string" },
                    cover_image_url: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Podcast created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Podcast" },
                },
              },
            },
            "400": {
              description: "Missing required fields",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "User or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/podcasts/{title}": {
        get: {
          tags: ["Podcasts"],
          summary: "Get a podcast by title (includes category)",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "title",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Podcast details with embedded category",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PodcastWithCategory",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Podcast not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Podcasts"],
          summary: "Update a podcast",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "title",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category_name: { type: "string" },
                    cover_image_url: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Podcast updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Podcast" },
                },
              },
            },
            "400": {
              description: "Title is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Podcast or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Podcasts"],
          summary: "Delete a podcast",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "title",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "204": { description: "Deleted successfully" },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Podcast not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/podcasts/{title}/episodes": {
        get: {
          tags: ["Episodes"],
          summary: "List episodes for a podcast",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "title",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "List of episodes",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Episode" },
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Podcast not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Episodes"],
          summary: "Create an episode for a podcast",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "title",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    duration_seconds: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Episode created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Episode" },
                },
              },
            },
            "400": {
              description: "Title is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Podcast not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/podcasts/{title}/cover": {
        post: {
          tags: ["Podcasts"],
          summary: "Upload a cover image for a podcast",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "title",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Cover image updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Podcast" },
                },
              },
            },
            "400": {
              description: "Missing title or image",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Podcast not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/podcasts/mine": {
        get: {
          tags: ["Podcasts"],
          summary: "List podcasts for a user",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "user_email",
              in: "query",
              required: true,
              schema: { type: "string", format: "email" },
            },
          ],
          responses: {
            "200": {
              description: "List of user podcasts",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Podcast" },
                  },
                },
              },
            },
            "400": {
              description: "user_email is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/episodes/{token}": {
        get: {
          tags: ["Episodes"],
          summary: "Get an episode by token",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Episode details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Episode" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Episode not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Episodes"],
          summary: "Update an episode",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title"],
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    thumbnail_url: { type: "string" },
                    duration_seconds: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Episode updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Episode" },
                },
              },
            },
            "400": {
              description: "Title is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Episode not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Episodes"],
          summary: "Delete an episode",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "204": { description: "Deleted successfully" },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Episode not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/episodes/{token}/upload": {
        post: {
          tags: ["Episodes"],
          summary: "Upload a video for an episode",
          security: [{ userToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "User JWT from POST /api/auth/login",
            },
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    video: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            "202": { description: "Upload accepted" },
            "400": {
              description: "Upload failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/episodes/{token}/thumbnail": {
        post: {
          tags: ["Episodes"],
          summary: "Upload a thumbnail for an episode",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "token",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Thumbnail updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Episode" },
                },
              },
            },
            "400": {
              description: "Image is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Episode not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/feeds": {
        post: {
          tags: ["Feeds"],
          summary: "Create a feed entry",
          description:
            "Inserts a new feed record linking a podcast and an episode. Called automatically when a producer creates a podcast with episodes. Requires a machine token.",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["podcast_id", "episode_id"],
                  properties: {
                    podcast_id: {
                      type: "string",
                      format: "uuid",
                      description: "ID of the podcast",
                    },
                    episode_id: {
                      type: "string",
                      format: "uuid",
                      description: "ID of the episode",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Feed entry created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Missing podcast_id or episode_id",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "podcast_id or episode_id not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Failed to create feed entry",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/feeds/{slug}": {
        get: {
          tags: ["Feeds"],
          summary: "Get RSS 2.0 feed for a podcast",
          description:
            "Returns a valid RSS 2.0 feed with iTunes namespace for the podcast identified by its title or hyphenated slug. Requires a machine token.",
          security: [{ machineToken: [] }],
          parameters: [
            {
              in: "header",
              name: "Authorization",
              required: true,
              schema: { type: "string" },
              description: "Machine Bearer token from POST /auth/token",
            },
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              description:
                "Podcast title or hyphenated slug (e.g. 'my-podcast' or 'My Podcast')",
            },
          ],
          responses: {
            "200": {
              description: "RSS XML feed",
              content: {
                "application/rss+xml": {
                  schema: {
                    type: "string",
                    description: "RSS 2.0 XML with iTunes namespace",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "404": {
              description: "Podcast not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "500": {
              description: "Failed to generate feed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
    },
  };
}

export async function GET(request, { params }) {
  if (!checkAuth(request)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Swagger Docs"',
      },
    });
  }

  const { slug } = await params;

  if (!slug || slug.length === 0 || slug[0] === "") {
    return serveIndex();
  }

  if (slug[0] === "spec.json") {
    return NextResponse.json(buildSpec());
  }

  const fileName = slug[slug.length - 1];
  const filePath = path.join(DIST, fileName);
  const ext = path.extname(filePath).toLowerCase();

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "not found" },
      { status: 404 },
    );
  }

  let content = fs.readFileSync(filePath);
  let contentType = MIME[ext] || "application/octet-stream";

  if (fileName === "swagger-initializer.js") {
    const specUrl = "/api/docs/spec.json";
    content = Buffer.from(
      content
        .toString()
        .replace(
          '"https://petstore.swagger.io/v2/swagger.json"',
          `"${specUrl}"`,
        ),
    );
  }

  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

function serveIndex() {
  const template = fs.readFileSync(
    path.join(DIST, "index.html"),
    "utf-8",
  );

  const html = template
    .replace('href="./swagger-ui.css"', 'href="/api/docs/swagger-ui.css"')
    .replace('href="index.css"', 'href="/api/docs/index.css"')
    .replace('href="./favicon-32x32.png"', 'href="/api/docs/favicon-32x32.png"')
    .replace('href="./favicon-16x16.png"', 'href="/api/docs/favicon-16x16.png"')
    .replace('src="./swagger-ui-bundle.js"', 'src="/api/docs/swagger-ui-bundle.js"')
    .replace(
      'src="./swagger-ui-standalone-preset.js"',
      'src="/api/docs/swagger-ui-standalone-preset.js"',
    )
    .replace(
      'src="./swagger-initializer.js"',
      'src="/api/docs/swagger-initializer.js"',
    );

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "method not allowed" },
    { status: 405 },
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "method not allowed" },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "method not allowed" },
    { status: 405 },
  );
}
