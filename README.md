# Blog REST API

A RESTful API for user accounts, blog posts, and comments, built with Node.js, Express, MongoDB, and Mongoose. Users can register and log in, then manage posts and comments through authenticated, ownership-checked endpoints. Post and comment retrieval endpoints are public.

## Key Features

- User registration, login, and logout
- Password hashing with `bcryptjs`
- JWT authentication stored in an HTTP-only cookie
- Create, read, update, and delete operations for posts and comments
- Post and comment ownership checks for edits and deletion
- Paginated post listing with a maximum page size of 100
- Request validation for post and comment fields and MongoDB document IDs
- Centralized handling for unknown routes and forwarded errors
- Jest and Supertest API tests using MongoDB Memory Server

## Technology Stack

| Technology | Use |
| --- | --- |
| Node.js | JavaScript runtime |
| Express.js | HTTP server and API routing |
| MongoDB | Data storage |
| Mongoose | MongoDB models and database access |
| `jsonwebtoken` | JWT creation and verification |
| `bcryptjs` | Password hashing and comparison |
| `cookie-parser` | Reading authentication cookies |
| `dotenv` | Loading environment variables |
| Jest, Supertest | Automated API tests |
| MongoDB Memory Server | Isolated test database |

## Project Structure

```text
Blog_assignment/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── README.md
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── controller/
│   │   ├── auth.controller.js
│   │   ├── comment.controller.js
│   │   └── post.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── comment.model.js
│   │   ├── post.model.js
│   │   └── user.model.js
│   ├── routes/
│      ├── auth.routes.js
│      ├── comment.routes.js
│      └── post.routes.js
│   
│      
└── tests/
    ├── auth.test.js
    ├── comment.test.js
    ├── post.test.js
    └── setup.js
```

## Installation and Setup

### Prerequisites

- Node.js and npm
- A MongoDB connection string (local MongoDB or MongoDB Atlas)

1. Clone the repository and move into the project directory:

   ```bash
   git clone <repository-url>
   cd Blog_assignment
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root using the safe template below. Replace the placeholders with your own MongoDB connection string and a private JWT signing secret. Do not commit `.env` or put real credentials in source control.

## Environment Variables

Copy `.env.example` to `.env` and replace the placeholders with your own values:

```dotenv
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_JWT_SECRET
NODE_ENV=development
```

`MONGO_URI` and `JWT_SECRET` are required for normal application operation. `NODE_ENV` is read when setting the authentication cookie's `secure` option; it is enabled when `NODE_ENV=production`. `NODE_ENV` is optional and is not otherwise used to configure the server.

## MongoDB Setup and Data Model

The server loads `.env` from the project root, connects through `mongoose.connect(process.env.MONGO_URI)`, and only then listens on port `3000`. For local MongoDB, start the MongoDB service and set `MONGO_URI` to a local connection URI, for example `mongodb://127.0.0.1:27017/blog_api`. For MongoDB Atlas, create a cluster and database user, allow the development machine's IP in the cluster network access settings, and put the Atlas-provided connection URI in `MONGO_URI`. Do not put credentials in this README or commit them.

Mongoose schemas define the persisted document fields. MongoDB creates the database and collections as documents are first written; there is no separate migration, seed, or database setup script in this project. The existing startup connection and schema definitions provide the application's database setup.

All three schemas enable Mongoose timestamps, which add `createdAt` and `updatedAt` fields.

| Model | Field | Type | Constraints and behavior |
| --- | --- | --- | --- |
| `user` | `name` | String | Required |
| `user` | `email` | String | Required, unique, lowercased, and trimmed |
| `user` | `password` | String | Required, minimum length 6, excluded from query results by default (`select: false`) |
| `post` | `title` | String | Required and trimmed |
| `post` | `content` | String | Required |
| `post` | `author` | ObjectId | Required reference to the lowercase `user` model |
| `comment` | `content` | String | Required and trimmed |
| `comment` | `post` | ObjectId | Required reference to the lowercase `post` model |
| `comment` | `author` | ObjectId | Required reference to the lowercase `user` model |

The relationships are references rather than embedded subdocuments: a user can author multiple posts and comments, and a post can have multiple comments. The code does not define cascading deletion; deleting a post does not explicitly delete its comments. Model and reference names remain lowercase (`user`, `post`, and `comment`).

## Running the Application

Start the server:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The API is available at `http://localhost:3000`. The server connects to MongoDB before it starts listening.

## API Documentation

All request bodies are JSON. The examples below use `http://localhost:3000` as the base URL. Authentication uses the `token` cookie issued by registration or login; send it back on protected requests.

### Authentication

| Method | Endpoint | Description | Authentication |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user and set the authentication cookie | No |
| `POST` | `/api/auth/login` | Verify credentials and set the authentication cookie | No |
| `POST` | `/api/auth/logout` | Clear the authentication cookie | No |

**Register** — `POST /api/auth/register`

Request body:

```json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "password": "correct-horse-battery"
}
```

Success (`201 Created`):

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "665f1a2b3c4d5e6f708192a3",
    "name": "Jordan Lee",
    "email": "jordan@example.com"
  }
}
```

The response also sets the `token` cookie. An existing email returns `409 Conflict` with `{"message":"User with this account is already exists"}`. The user schema requires `name`, `email`, and a password of at least six characters; the controller does not perform a separate registration validation step.

**Login** — `POST /api/auth/login`

Request body:

```json
{
  "email": "jordan@example.com",
  "password": "correct-horse-battery"
}
```

Success (`200 OK`): `{"message":"Login successfully"}` and a `token` cookie. Invalid credentials return `401 Unauthorized` with a message indicating the email or password is invalid.

**Logout** — `POST /api/auth/logout`

Success (`200 OK`): `{"message":"User logout successfully"}`. This clears the `token` cookie; the endpoint does not require authentication.

### Posts

| Method | Endpoint | Description | Authentication |
| --- | --- | --- | --- |
| `POST` | `/api/post` | Create a post | Yes |
| `GET` | `/api/post` | List posts with pagination | No |
| `GET` | `/api/post/:postId` | Fetch one post | No |
| `PUT` | `/api/post/:postId` | Update a post | Yes; post owner |
| `DELETE` | `/api/post/:postId` | Delete a post | Yes; post owner |

**Create a post** — `POST /api/post`

Request body:

```json
{
  "title": "A First Post",
  "content": "The post body goes here."
}
```

Both fields must be non-empty strings. Success (`201 Created`) returns `{"message":"post created successfully","post":{...}}`. The post includes its MongoDB `_id`, `title`, `content`, `author` ID, and timestamps.

**List posts** — `GET /api/post?page=1&limit=10`

`page` and `limit` are optional positive integers. Defaults are page `1` and limit `10`; a requested limit above `100` is reduced to `100`. Success (`200 OK`) returns a `posts` array and pagination metadata, for example:

```json
{
  "message": "all posts fetched succfully",
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalPost": 25,
    "limit": 10,
    "hasNextPage": true,
    "hasPreviouspage": false
  },
  "posts": [
    {
      "_id": "665f1a2b3c4d5e6f708192a3",
      "title": "A First Post",
      "content": "The post body goes here.",
      "author": {
        "_id": "665f1a2b3c4d5e6f708192a4",
        "name": "Jordan Lee",
        "email": "jordan@example.com"
      },
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

Posts are sorted newest first. Invalid page or limit values return `400`; a page beyond the available pages when posts exist returns `404`. An empty collection returns an empty `posts` array and `totalPages: 0`.

**Fetch one post** — `GET /api/post/:postId`

Success (`200 OK`): `{"message":"Post fetched successfully","post":{...}}`. The author is populated with `name` and `email`. A malformed ID returns `400`; a valid ID with no matching post returns `404`.

**Update a post** — `PUT /api/post/:postId`

Request body requires both non-empty string fields, `title` and `content` (this is not a partial update). Success (`200 OK`) returns `{"message":"Post updated successfully","post":{...}}`. Invalid input or ID returns `400`, a missing post returns `404`, and a non-owner receives `403`.

**Delete a post** — `DELETE /api/post/:postId`

Success (`200 OK`): `{"message":"Post deleted successfully"}`. Invalid ID returns `400`, missing post returns `404`, and a non-owner receives `403`.

### Comments

| Method | Endpoint | Description | Authentication |
| --- | --- | --- | --- |
| `POST` | `/api/comment` | Add a comment to an existing post | Yes |
| `GET` | `/api/comment?post_id=:postId` | List comments for a post | No |
| `GET` | `/api/comment/:commentId` | Fetch one comment | No |
| `PUT` | `/api/comment/:commentId` | Update a comment | Yes; comment owner |
| `DELETE` | `/api/comment/:commentId` | Delete a comment | Yes; comment owner |

**Create a comment** — `POST /api/comment`

Request body:

```json
{
  "content": "A useful comment.",
  "postId": "665f1a2b3c4d5e6f708192a3"
}
```

Both values are required; `content` must be a non-empty string and `postId` must identify an existing post. Success (`201 Created`) returns `{"message":"comment added","comment":{...}}`. Invalid content or ID returns `400`; a missing post returns `404`.

**List comments** — `GET /api/comment?post_id=665f1a2b3c4d5e6f708192a3`

The `post_id` query parameter is required and must identify an existing post. Success (`200 OK`) returns `{"message":"comments fetched successfully","comments":[...],"totalCount":1}`. Comments are sorted newest first, and each author is populated with `name` and `email`. Invalid ID returns `400`; missing post returns `404`.

**Fetch one comment** — `GET /api/comment/:commentId`

Success (`200 OK`) returns `{"message":"comment fetched successfully","comment":{...}}`; the comment includes populated author (`name`, `email`) and post (`title`). Invalid ID returns `400`; missing comment returns `404`.

**Update a comment** — `PUT /api/comment/:commentId`

Request body:

```json
{
  "content": "The revised comment."
}
```

Success (`200 OK`) returns `{"message":"comment updated successfully","comment":{...}}`. Invalid ID or empty/non-string content returns `400`, missing comment returns `404`, and a non-owner receives `403`.

**Delete a comment** — `DELETE /api/comment/:commentId`

Success (`200 OK`): `{"message":"Comment deleted successfully"}`. Invalid ID returns `400`, missing comment returns `404`, and a non-owner receives `403`.

## Authentication and Authorization

Registration and login create a JWT containing the user's ID with a one-day expiration. The token is sent as an HTTP-only cookie named `token`; the cookie uses `SameSite=Lax`, a one-day max age, and `Secure` only when `NODE_ENV` is `production`. The browser does not expose an HTTP-only cookie to client-side JavaScript.

Protected routes read and verify this cookie, reload the user, and attach that user to the request. Post and comment updates and deletions compare the document's author ID with the authenticated user's ID. A missing cookie or invalid/expired token returns `401`; attempting to modify another user's document returns `403`.

## Pagination

The post listing endpoint accepts `page` and `limit` query parameters. For example, `GET /api/post?page=2&limit=5` skips the first five posts and returns the next five, subject to the 100-item maximum. The response includes `currentPage`, `totalPages`, `totalPost`, the effective `limit`, `hasNextPage`, and `hasPreviouspage`. Sorting is by `createdAt` descending, then `_id` descending.

## Error Handling

Endpoint errors generally return JSON containing a `message`; the exact message and additional fields depend on the controller. Common statuses are:

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Invalid input, query parameter, or MongoDB ID |
| `401 Unauthorized` | Missing, invalid, or expired authentication cookie; invalid login |
| `403 Forbidden` | Authenticated user does not own the requested post or comment |
| `404 Not Found` | Requested document, page, or route does not exist |
| `409 Conflict` | Registration email is already in use |
| `500 Internal Server Error` | An unexpected error occurred |

Unknown routes are handled centrally and return `{"success":false,"message":"Route not found: <path>"}`. Other controller responses do not all use that same envelope; consult the endpoint details above for their response shapes.

## Testing

Run the automated test suite:

```bash
npm test
```

The test setup starts MongoDB Memory Server, sets a test-only JWT secret, and clears database collections between tests. The current suite has **21 passing tests across 3 test suites** and does not require the development MongoDB connection string. These are HTTP API integration tests using Supertest against the Express application and an in-memory MongoDB instance; there are no isolated unit-test suites or measured coverage results in the repository.

The existing cases cover:

| Suite | Tests |
| --- | --- |
| Authentication (5) | Register user; reject duplicate email; login with correct credentials; reject incorrect password; logout |
| Posts (8) | Create post; reject unauthenticated creation; list posts; fetch by ID; update own post; reject another user's update; delete own post; return paginated posts |
| Comments (8) | Create comment; reject unauthenticated creation; list comments for a post; fetch by ID; update own comment; reject another user's update; delete own comment; return 404 for a nonexistent comment |

Run tests in watch mode during development:

```bash
npm run test:watch
```

## Example Requests with curl

Register and save the returned cookie:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jordan Lee","email":"jordan@example.com","password":"correct-horse-battery"}'
```

Log in and save the cookie instead, if the account already exists:

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jordan@example.com","password":"correct-horse-battery"}'
```

Create a post using that cookie:

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/post \
  -H "Content-Type: application/json" \
  -d '{"title":"A First Post","content":"The post body goes here."}'
```

List posts and comments for a post:

```bash
curl "http://localhost:3000/api/post?page=1&limit=10"
curl "http://localhost:3000/api/comment?post_id=665f1a2b3c4d5e6f708192a3"
```

Create a comment and log out:

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/api/comment \
  -H "Content-Type: application/json" \
  -d '{"content":"A useful comment.","postId":"665f1a2b3c4d5e6f708192a3"}'

curl -i -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

## Future Improvements

- Add explicit registration and login input validation with consistent client-facing errors
- Standardize error response formats and status handling across controllers
- Add rate limiting and account protections such as login throttling
- Add configurable server port and deployment-oriented cookie/CORS settings
- Expand pagination and authorization edge-case coverage
- Add API schema documentation, such as an OpenAPI specification