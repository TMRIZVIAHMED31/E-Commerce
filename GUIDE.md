# Full Setup & Submission Guideline — Ecommerce (MERN)

This guide walks you through installing, running, and testing the project step by
step, and maps each part of the codebase to the Codveda Full-Stack Development
task list so you know exactly what to show/demo for each level.

---

## 1. Prerequisites

Install these before you start:

| Tool | Why | Check install |
|---|---|---|
| **Node.js** (v18+) | Runs backend & frontend build tools | `node -v` |
| **npm** (comes with Node) | Installs packages | `npm -v` |
| **Git** | Version control, push to GitHub | `git --version` |
| **MongoDB** | Database — local install OR a free MongoDB Atlas cluster | `mongod --version` (if local) |
| **VS Code** (recommended) | Code editor | — |
| **Postman** or **Thunder Client** (VS Code extension) | Test API endpoints manually | — |

If you don't want to install MongoDB locally, create a free cluster at
mongodb.com/atlas and copy its connection string — you'll paste it into
`MONGO_URI` in step 3.

---

## 2. Unzip and open the project

```bash
unzip ecommerce-mern.zip
cd ecommerce-mern
code .        # opens in VS Code, optional
```

You'll see two folders: `backend/` and `frontend/`. They run as two separate
processes (two terminal tabs), talking to each other over HTTP + WebSocket.

---

## 3. Backend setup (do this first)

```bash
cd backend
npm install
```

Create the environment file once, then fill in your own values. Do not repeat
this command after editing `.env`, because it overwrites your settings:

```bash
copy .env.example .env
```

In PowerShell, use this instead to create `.env` only when it does not already
exist:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Open `.env` and edit:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_mern     # use your Atlas URI if MongoDB is not installed locally
MONGO_DB_NAME=ecommerce_mern
JWT_SECRET=replace_with_a_long_random_secret            # any long random string
CLIENT_ORIGIN=http://localhost:5173
```

> **Why a `.env` file?** It keeps secrets (DB credentials, JWT signing key) out of
> your code and out of GitHub. `.env` is already excluded — never commit it.

If `MONGO_URI` starts with `mongodb://127.0.0.1`, start MongoDB locally (skip
this step when using Atlas):

```bash
mongod
```

Seed the one-and-only admin ("author") account — this can't be done through the
public UI on purpose, so run it once from the terminal:

```bash
npm run seed:admin
```

You'll see something like:
```
Admin created: adminecommerce@gmail.com / Admin@12345
```
(You can override these via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before
seeding.)

Now start the API server:

```bash
npm run dev
```

You should see:
```
MongoDB connected
Server running on port 5000
```

Verify it's alive by visiting `http://localhost:5000/api/health` in a browser —
you should get `{"status":"ok"}`.

---

## 4. Frontend setup

Open a **second terminal tab**, leaving the backend running:

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` defaults are already correct for local dev:
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. You should see the product
listing page (empty at first — that's expected, no products yet).

---

## 5. Walkthrough: create accounts and try every feature

Do this in order — it exercises every role and every piece of functionality:

1. **Register a seller.** Go to Register → fill the form → role dropdown →
   "Seller (list products)".
2. **Log in as that seller** → click **Seller Dashboard** → add 2–3 products
   (name, description, price, category, stock, and an image URL — you can use
   any public image link, e.g. from `https://picsum.photos/400/300`).
3. **Log out**, then **register a buyer** (role: "Buyer (browse & chat)").
4. As the buyer, browse the Home page, search for a product, open a product
   detail page, click **Chat with seller**.
5. Type a message and send it. Open a second browser (or incognito window),
   log in as the **seller**, go to **Chat**, open the same conversation — you'll
   see the buyer's message appear, and replies show up live on both sides
   without refreshing (that's Socket.io real-time messaging).
6. **Log out, log in as admin** using the credentials from step 3's seed
  output (`adminecommerce@gmail.com` / `Admin@12345` by default).
   - Go to **Admin** tab → see all registered users → change a user's role or
     delete a non-admin user.
   - Go to **Seller Dashboard** tab as admin → notice it now shows **every**
     seller's products (not just one seller's) → edit or delete any of them.

If all six steps work, every role, every CRUD path, and real-time chat are
confirmed working end to end.

---

## 6. Testing the REST API directly (Postman / Thunder Client)

This is useful to demonstrate the Level 1 "Build a Simple REST API" task
explicitly, independent of the frontend.

**Register:**
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "name": "Test Seller",
  "email": "seller1@test.com",
  "password": "password123",
  "role": "seller"
}
```
Response gives you a `token` — copy it.

**Create a product (needs the token):**
```
POST http://localhost:5000/api/products
Headers: Authorization: Bearer <token>
Body (JSON):
{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse",
  "price": 19.99,
  "category": "electronics",
  "stock": 50
}
```

**List products (no auth needed):**
```
GET http://localhost:5000/api/products
```

**Update / delete** follow the same pattern with `PUT` / `DELETE` on
`/api/products/:id`, using the same seller's token (or the admin's).

Try deleting/editing a product using a **different seller's** token — you
should get a `403 Forbidden`. That's the ownership check in
`productController.js` (`canModify`) doing its job — good to mention when
demonstrating "Authentication and Authorization" (Level 2, Task 2).

---

## 7. How this project maps to the Codveda task list

| Level | Task | Where it lives in this project |
|---|---|---|
| 1 | Setup Development Environment | `backend/package.json`, `.env.example`, Git repo itself |
| 1 | Build a Simple REST API | `backend/routes/productRoutes.js`, `controllers/productController.js` — full CRUD, error handling, tested via Postman (section 6) |
| 1 | Frontend with HTML/CSS/JS | Superseded by Level 2's React frontend below (fetches from the same REST API) |
| 2 | Frontend with a JS Framework | `frontend/` — React (Vite), functional components, Context API for state, `api/axios.js` for API calls, loading states in `Home.jsx`/`ProductDetail.jsx` |
| 2 | Authentication and Authorization | `backend/models/User.js` (bcrypt hashing), `middleware/auth.js` (JWT verify + `authorize(...roles)`), roles enforced on every product/chat/admin route |
| 2 | Database Integration | `backend/models/*.js` — Mongoose schemas/relationships (Product→User, Message→Conversation→User), indexing (`productSchema.index`), validation on save |
| 3 | Build a Full-Stack App (MERN) | The whole repo — React frontend + Express/Node backend + MongoDB, auth, roles, deployed-ready structure |
| 3 | WebSockets for Real-Time Communication | `backend/socket/socketHandler.js` + `frontend/src/context/SocketContext.jsx` + `pages/Chat.jsx` — JWT-authenticated sockets, per-conversation rooms, typing indicator |
| 3 | GraphQL API Development | **Not included** — this build is REST-only throughout, per your request to use MERN. Ask if you'd like a GraphQL layer added alongside the REST API. |

You only need **any two tasks per level** for the internship requirement, so
this project already gives you full coverage to pick from at every level.

---

## 8. Deploying (optional, for Level 3 "deploy both frontend and backend")

Quick free-tier options:
- **Backend** → Render.com or Railway.app (set the same env vars as your
  `.env`, plus a MongoDB Atlas `MONGO_URI` since your laptop's local Mongo
  won't be reachable from the cloud).
- **Frontend** → Vercel or Netlify (set `VITE_API_URL` / `VITE_SOCKET_URL` to
  your deployed backend's public URL, then `npm run build`).

Ask me if you'd like exact step-by-step deploy instructions for a specific
provider.

---

## 9. Submission checklist (per Codveda's instructions)

- [ ] Push this project to a public GitHub repo (`git init`, `git add .`,
      `git commit -m "Ecommerce MERN project"`, then push to GitHub — make
      sure `.env` is in `.gitignore` and never committed).
- [ ] Record a short video demoing: register as seller → add product →
      register as buyer → chat in real time → log in as admin → manage
      users/products.
- [ ] Post the video + GitHub repo link on LinkedIn, tagging **@Codveda** and
      using `#CodvedaJourney`, `#CodvedaExperience`, `#FutureWithCodveda`.
- [ ] Keep a separate submission file per level as instructed, referencing the
      table in section 7 above for which task each level covers.
- [ ] Submit via the Codveda submission form once shared, within the 1-month
      window.

---

## 10. Troubleshooting

| Problem | Likely cause |
|---|---|
| `MongoDB connection error` on backend start | Mongo isn't running locally, or `MONGO_URI` in `.env` is wrong |
| Frontend loads but products never appear | Backend isn't running, or `VITE_API_URL` doesn't match the backend's actual port |
| Chat messages don't appear live | `VITE_SOCKET_URL` mismatch, or browser blocked the WebSocket — check the browser console for socket connection errors |
| `403 Forbidden` when editing a product | You're logged in as a seller who doesn't own that product — expected behavior, log in as the owning seller or as admin |
| Can't register as admin | Correct — admin is seeded via `npm run seed:admin`, not the public register form, by design |
