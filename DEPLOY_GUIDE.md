# Deployment Guide: MERN Ecommerce App

This guide deploys this repository's `backend/` and `frontend/` directories using:

- MongoDB Atlas for the database
- Render for the Express + Socket.IO backend
- Vercel for the Vite + React frontend

The free tiers are sufficient for a demo. Render free services may sleep after inactivity, so the first request can take several seconds.

## 1. Prepare the repository

1. Create a GitHub repository and push the project root, including both `backend/` and `frontend/`.
2. Confirm that `.env` files are ignored and are not committed:

   ```bash
   git status
   git check-ignore backend/.env frontend/.env
   ```

3. Do not put MongoDB credentials, `JWT_SECRET`, or admin passwords in GitHub.

The project already uses the correct production-friendly configuration points:

- Backend: `PORT` and `CLIENT_ORIGIN`
- Frontend REST API: `VITE_API_URL`
- Frontend Socket.IO connection: `VITE_SOCKET_URL` (optional when `VITE_API_URL` is set)

## 2. Create the production database

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free cluster.
2. Create a database user with a strong password.
3. In **Network Access**, add `0.0.0.0/0` so Render can connect. Restrict this later if your hosting setup provides a fixed outbound IP.
4. Select **Connect > Drivers** and copy the connection string.
5. Replace the password placeholder with the database user's password. A typical value is:

   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

`backend/config/db.js` uses the optional `MONGO_DB_NAME` value and otherwise selects `ecommerce_mern`.

## 3. Deploy the backend to Render

1. Open [Render](https://render.com) and choose **New > Web Service**.
2. Connect the GitHub repository.
3. Use these service settings:

   | Setting | Value |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Plan | Free |

4. Add these environment variables in Render's **Environment** tab:

   ```text
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   MONGO_DB_NAME=ecommerce_mern
   JWT_SECRET=<long-random-secret>
   CLIENT_ORIGIN=https://<your-vercel-project>.vercel.app
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   NODE_ENV=production
   ADMIN_EMAIL=<your-admin-email>
   ADMIN_PASSWORD=<strong-admin-password>
   ```

   Do not set `PORT` manually unless Render specifically requires it. The server already reads Render's assigned `PORT` from `process.env.PORT`.

5. Create the service and wait for a successful deployment.
6. Copy the Render URL, for example:

   ```text
   https://e-commerce-lk03.onrender.com
   ```

7. Verify the backend before deploying the frontend:

   ```text
   https://e-commerce-lk03.onrender.com/api/health
   ```

   It should return:

   ```json
   {"status":"ok"}
   ```

### Seed the admin account

The admin account is not created by public registration. Run the seed script once against the production database. From a local terminal in `backend/`, use a temporary `.env` containing the production `MONGO_URI`, `MONGO_DB_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, then run:

```bash
npm install
npm run seed:admin
```

Remove the temporary production `.env` afterward. Alternatively, run `npm run seed:admin` from a Render Shell if that feature is available for the service.

## 4. Deploy the frontend to Vercel

1. Open [Vercel](https://vercel.com) and choose **Add New > Project**.
2. Import the same GitHub repository.
3. Set:

   | Setting | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Framework Preset | `Vite` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

4. Before deploying, add these Vercel environment variables for **Production** (and Preview if you want preview deployments to work):

   ```text
   VITE_API_URL=https://e-commerce-lk03.onrender.com/api
   ```

   `VITE_API_URL` must include `/api`; `VITE_SOCKET_URL` must not include `/api`.
   The frontend derives the socket origin from `VITE_API_URL` when `VITE_SOCKET_URL` is omitted.

5. Deploy the project and copy the Vercel URL, for example:

   ```text
   https://ecommerce-mern.vercel.app
   ```

## 5. Finish CORS configuration

Update the Render environment variable `CLIENT_ORIGIN` to the exact Vercel origin:

```text
CLIENT_ORIGIN=https://ecommerce-mern.vercel.app
```

Use no trailing slash. Save the variable and redeploy or restart the Render service. This value controls both Express CORS and Socket.IO CORS in `backend/server.js`.

If you later add a custom domain, replace `CLIENT_ORIGIN` with that exact `https://` origin and redeploy the backend.

## 6. Production verification

Run this checklist in the deployed Vercel app:

- Open the home page and confirm products load.
- Register a seller and create a product.
- Register a normal user and open the product.
- Start a chat and verify messages arrive in real time in two browser sessions.
- Log in with the seeded admin account and verify the admin pages work.
- Refresh the page on a nested route and confirm Vercel serves the React app.
- Check browser DevTools: API requests should use the Render URL, and the Socket.IO connection should use the Render URL without `/api`.

## 7. Troubleshooting

### Products do not load

Check that `VITE_API_URL` is exactly the Render URL plus `/api`, then redeploy Vercel. Vite variables are embedded during the build, so changing them in Vercel requires a new deployment.

### Chat does not connect

Check that `VITE_SOCKET_URL` is the Render origin without `/api`, that `CLIENT_ORIGIN` exactly matches the Vercel origin, and that the Render service is awake.

### CORS errors appear

The frontend origin in `CLIENT_ORIGIN` must match the browser URL exactly, including `https://` and excluding a trailing slash. Save the Render variable and restart the service.

### MongoDB connection fails

Confirm the Atlas database user's password is URL-encoded when it contains characters such as `@`, `#`, or `/`. Also confirm the Atlas Network Access rule allows Render's connection.

### The first request is slow

This is expected on Render's free plan when the service has been sleeping. Subsequent requests should be faster.

### Product images are not persistent

Product uploads are stored in Cloudinary and the returned HTTPS URLs are saved in MongoDB. Confirm all three `CLOUDINARY_*` variables are set in Render, then redeploy the backend. Do not remove or rotate the Cloudinary account that owns the product images.

## 8. Redeploying changes

Push changes to the connected GitHub branch. Render will rebuild the backend and Vercel will rebuild the frontend automatically. If only a Vite environment variable changes, trigger a new Vercel deployment so the value is embedded in the generated frontend bundle.
