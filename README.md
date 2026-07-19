# StellarCast

Podcast management platform built with Next.js (App Router).

---

## English

### Overview

StellarCast is a web application for creating and managing podcasts and their episodes. Users can create podcasts, upload cover images, manage episodes, and upload videos to streaming platforms.

### Architecture

```
Component (React)
    ↓  calls functions from @/lib/api
@/lib/api.ts (client-side fetch)
    ↓  HTTP requests to Next.js routes
Next.js API Routes (src/app/api/)
    ↓  delegates to service layer
@/services/* (server-side)
    ↓  HTTP requests to external API
External API (PODCAST_BSE_URL / API_URL)
```

### Implemented Features

| Feature | Frontend Component | Next.js API Route | Service |
|---|---|---|---|
| **Categories listing** | `CreatePodcast.tsx` → `fetchCategories()` | `GET /api/categories` | `externalApi.ts` |
| **User registration** | Auth forms → `registerUser()` | `POST /api/auth/register` | — |
| **User login** | Auth forms → `loginUser()` | `POST /api/auth/login` | — |
| **Token refresh** | — | `POST /api/auth/token` | — |
| **Create podcast** | `CreatePodcast.tsx` → `createPodcast()` | `POST /api/podcasts` | `podcastService.ts` |
| **Upload podcast cover** | `CreatePodcast.tsx` → `uploadPodcastCover()` | `POST /api/podcasts/[title]/cover` | `podcastService.ts` |
| **List my podcasts** | `PodcastList.tsx` → `listMyPodcasts()` | `GET /api/podcasts/mine` | `podcastService.ts` |
| **Get podcast by title** | `EpisodeList.tsx` → `getPodcastByTitle()` | `GET /api/podcasts/[title]` | `podcastService.ts` |
| **List episodes** | `EpisodeList.tsx` → `listEpisodes()` | `GET /api/podcasts/[title]/episodes` | `podcastService.ts` |
| **Create episode** | `CreateEpisode.tsx` → `createEpisode()` | `POST /api/podcasts/[title]/episodes` | `podcastService.ts` |
| **Get episode** | `VideoUpload.tsx` → `getEpisode()` | `GET /api/episodes/[token]` | `externalApi.ts` |
| **Upload episode video** | `VideoUpload.tsx` → `uploadEpisodeVideo()` | `POST /api/episodes/[token]/upload` | `api.ts` |
| **Upload episode thumbnail** | `CreateEpisode.tsx` → `uploadEpisodeThumbnail()` | `POST /api/episodes/[token]/thumbnail` | `api.ts` |

### Project Structure

```
src/
├── app/
│   ├── (pages)/
│   │   └── podcasts/
│   │       ├── page.tsx                    # /podcasts — Create Podcast page
│   │       ├── mine/
│   │       │   └── page.tsx                # /podcasts/mine — My Podcasts list
│   │       └── [title]/
│   │           └── episodes/
│   │               ├── page.tsx            # Episode list
│   │               ├── create/page.tsx     # Create episode
│   │               └── [token]/upload/page.tsx  # Video upload
│   └── api/
│       ├── auth/ (login, register, token)
│       ├── categories/route.ts
│       ├── podcasts/
│       │   ├── route.ts
│       │   ├── mine/route.ts
│       │   └── [title]/
│       │       ├── route.ts
│       │       ├── cover/route.ts
│       │       └── episodes/route.ts
│       └── episodes/
│           └── [token]/
│               ├── route.ts
│               ├── upload/route.ts
│               └── thumbnail/route.ts
├── components/
│   ├── podcasts/
│   │   ├── CreatePodcast.tsx
│   │   ├── PodcastList.tsx
│   │   └── styles.ts
│   └── episodes/
│       ├── CreateEpisode.tsx
│       ├── EpisodeList.tsx
│       ├── VideoUpload.tsx
│       └── styles.ts
├── lib/
│   ├── api.ts             # Client-side API functions
│   ├── api-client.ts      # Generic fetch helpers
│   └── auth-context.ts    # Auth context provider
└── services/
    ├── api.ts             # Server-side API client (uses API_URL)
    ├── externalApi.ts     # Server-side API client (uses PODCAST_BSE_URL)
    ├── podcastService.ts  # Podcast-specific service functions
    ├── userService.ts     # User-related service functions
    ├── loginUser.ts       # Login helper
    └── resetPassword.ts   # Password reset
```

### Environment Variables

| Variable | Description |
|---|---|
| `PODCAST_BSE_URL` | External podcast API base URL |
| `API_URL` | Alternative external API base URL |
| `CLIENT_ID_1` | Client ID for machine-to-machine auth |
| `SECRET_1` | Client secret for machine-to-machine auth |

> **Stable — do not modify:**  
> `src/app/api/auth/token/route.js`  
> `src/app/api/auth/token/validate/route.js`  
> These routes are complete, tested, and will not be changed.

### API Reference

#### POST /api/auth/token

Generates a machine-to-machine JWT token using client credentials.

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "xxxxxxxxx",
    "secret": "yyyyyyyyyyyyyy"
  }'
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "client_id": "xxxxxxxxx"
}
```

### Getting Started

```bash
npm install
npm run dev
```

### Running Unit Tests

```bash
npx vitest run --config vitest.config.ts
```

---

### Next implementations

1*
##2
##3
