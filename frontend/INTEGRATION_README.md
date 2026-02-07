# Frontend-Backend Integration - Quick Start

## Setup Instructions

### 1. Create Environment File

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Start Backend Server

```bash
cd system-deginer
npm run dev
```

Backend runs on `http://localhost:3000`.

### 3. Start Frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:3001`.

### 4. Test the Flow

1. Go to `http://localhost:3001/signup`
2. Register with any email/password
3. Enter a prompt: "Build a video streaming platform like YouTube"
4. Watch real-time agent progress
5. Answer questions if prompted
6. Approve requirements when shown
7. See all 8 agents complete

## Key Features Implemented

✅ **Authentication**: Login, register, protected routes  
✅ **Real-time SSE**: Agent progress updates  
✅ **8 Agents**: Full backend agent pipeline  
✅ **Q&A Workflow**: Interactive clarifications  
✅ **Requirements Approval**: Review before proceeding  
✅ **Modern UI**: Glassmorphism, gradients, responsive

## Files Changed

**API Layer:**

- `src/lib/api/client.ts` - HTTP client with auth
- `src/lib/api/auth.ts` - Auth endpoints
- `src/lib/api/design.ts` - Design workflow

**Auth:**

- `src/lib/stores/auth.store.ts` - User state
- `src/app/signin/page.tsx` - Login page
- `src/app/signup/page.tsx` - Register page

**Dashboard:**

- Stores updated for backend integration
- SSE hook handles all backend events
- Components use API endpoints

## Need Help?

Check `walkthrough.md` for detailed documentation.
