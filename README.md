# Ecommerce (MERN) — Full-Stack Project

A full-stack ecommerce app built with **MongoDB, Express, React, Node.js**, covering
setup, REST API, frontend, JWT auth/roles, database integration, a full MERN app,
and real-time chat via **Socket.io**.

## Roles

| Role   | Can do |
|--------|--------|
| **user**   | Browse/search products, chat in real time with sellers |
| **seller** | Everything a user does with products, plus create/edit/delete **their own** products, and chat with buyers |
| **admin** ("author") | Everything: create/edit/delete **any** product from any seller, manage users (change role, delete), see all conversations |

Admin accounts are **not** self-registrable — they're created with a seed script so a
random visitor can never grant themselves admin/author access.

## Project structure

```
ecommerce-mern/
  backend/     Express API + MongoDB models + Socket.io server
  frontend/    React (Vite) app
```

## Backend setup

```bash
cd backend
npm install
# Create .env only if it does not already exist, then edit MONGO_URI / JWT_SECRET.
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run seed:admin        # creates adminecommerce@gmail.com / Admin@12345 (or your .env values)
npm run dev                # starts on http://localhost:5000
```

Requires a running MongoDB instance (local `mongod` or a MongoDB Atlas URI in `MONGO_URI`).

### Key backend endpoints

- `POST /api/auth/register` — register as `user` or `seller`
- `POST /api/auth/login`
- `GET  /api/auth/me`
- `GET  /api/products` — public, supports `?search=&category=&page=&limit=`
- `POST /api/products` — seller/admin only
- `PUT  /api/products/:id` — owning seller or admin only
- `DELETE /api/products/:id` — owning seller or admin only
- `GET  /api/products/mine/list` — seller sees own products, admin sees all
- `POST /api/chat/conversations` — start/reopen a chat with a seller
- `GET  /api/chat/conversations` — list my conversations
- `GET  /api/chat/messages/:conversationId`
- `GET/DELETE/PUT /api/admin/users...` — admin-only user management

### Real-time chat (Socket.io)

Client connects with the JWT in `socket.handshake.auth.token`. Events:
- `joinConversation` (conversationId)
- `sendMessage` ({ conversationId, text }) → broadcasts `newMessage`
- `typing` ({ conversationId, isTyping })

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env       # point VITE_API_URL / VITE_SOCKET_URL at your backend
npm run dev                 # starts on http://localhost:5173
```

## Trying it out

1. Start MongoDB, then the backend (`npm run dev` in `backend/`), then run `npm run seed:admin` once.
2. Start the frontend (`npm run dev` in `frontend/`).
3. Register one account as **seller** and one as **user** (buyer).
4. Log in as the seller → "Seller Dashboard" → add a product.
5. Log in as the user (buyer) → open the product → "Chat with seller" → send messages in real time.
6. Log in as admin (`adminecommerce@gmail.com` / `Admin@12345` by default) → "Admin" tab manages users, and "Seller Dashboard" tab shows/edit/deletes **every** product.

## Notes / what's intentionally simple

This is a learning/internship-scope project, not production-hardened:
- Product images are plain URL strings (no file upload/storage pipeline).
- No payment/checkout flow — the focus is roles, CRUD, auth, and real-time chat.
- No pagination UI on the frontend beyond the API supporting `page`/`limit`.
- GraphQL (an optional advanced-level task) isn't included since this build uses REST throughout.

Feel free to ask for any of the above to be added.
