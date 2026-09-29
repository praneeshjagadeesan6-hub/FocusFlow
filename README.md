# FocusFlow

FocusFlow is a student study platform with a React/Vite frontend and an Express/MongoDB backend.

## Repository layout

- `frontend/`: Vite application, deployed separately to Vercel from this repository with the project root set to `frontend`.
- `backend/`: Express API and Socket.IO server, deployed from the root Render Blueprint in `render.yaml`.

## Deploy

1. Create one GitHub repository and push this project root. The root `.gitignore` excludes local environment files, dependencies, and build output.
2. In Vercel, import the repository and set the project root to `frontend`. Set `VITE_API_URL` to the deployed backend origin, without `/api`, and `VITE_SOCKET_URL` to the same backend origin. For example, both values should be `https://your-api.onrender.com`.
3. In Render, create a Blueprint from the same repository using `render.yaml`. Set the required secrets in the Render service environment: `MONGO_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Add provider credentials for Gemini, Cloudinary, and SMTP if those features are enabled.
4. Redeploy the Vercel frontend after setting its environment variables.

The final three links are the single GitHub repository URL, the Vercel frontend URL, and the Render backend URL. They are assigned by GitHub, Vercel, and Render after you create and publish the services.

For local setup, copy `backend/.env.example` to `backend/.env`, fill the required values, then run `npm install` and `npm run dev` in both `backend/` and `frontend/`.