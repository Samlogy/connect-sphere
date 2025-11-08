
## 1. System Architecture Diagram (conceptually)

                    ┌──────────────────────────┐
                    │        Frontend          │
                    │ (React + Vite + GraphQL) │
                    └──────────┬───────────────┘
                               │
                      ┌────────▼────────┐
                      │  API Gateway /  │
                      │ Authentication  │
                      └────────┬────────┘
                               │
       ┌──────────────────────────────────────────────────┐
       │                      Services                    │
       │──────────────────────────────────────────────────│
       │  User     │  Feed    │ Chat │ Notify │ Market │ Search │ Storage │
       └───────────┴──────────┴──────┴────────┴────────┴────────┴────────┘
                               │
         ┌──────────────────────────────────────────────────────────┐
         │             Infrastructure & Data Layer                   │
         │ PostgreSQL | Redis | RabbitMQ | Elasticsearch | MinIO     │
         └──────────────────────────────────────────────────────────┘
                               │
                        ┌────────────┐
                        │ Monitoring │
                        │ (Prom+Graf)│
                        └────────────┘

## 2.1. High-Level Concept

ConnectSphere is a full-featured platform that allows users to:

- Create profiles and posts (social feed)
- Chat in real time
- Upload and share files/media
- Buy and sell digital goods (marketplace)
- Search for users, products, and posts
- Get real-time notifications and emails
- Scale automatically under load
- Be monitored, cached, and fault-tolerant

---

## 2.2. Low-Level Components & Details

Below are the core services/components with their details.

#### Service: Authentication & API Gateway

- Responsibilities: user login/signup, token issuance (JWT or similar), routing requests to appropriate services.
- Data store: a relational DB (PostgreSQL) for user credentials, plus Redis for session/cache.
- Key flows:

  1. Client submits credentials → Auth service verifies → issues JWT.
  2. Client sends request with JWT → API Gateway verifies token, forwards to correct service.
- Scaling: stateless instances behind load-balancer → scale horizontally easily.
- Reason: centralising entrypoint simplifies cross-cutting concerns (auth, rate limit, logging).

#### Service: User Profile Service

- Responsibilities: manage user profile, user relationships (followers/following)
- Schema (simplified):

  ```sql
  users (
    id UUID PK,
    username VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    hashed_password VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );

  followers (
    user_id UUID FK users.id,
    follower_id UUID FK users.id,
    created_at TIMESTAMP,
    PRIMARY KEY(user_id, follower_id)
  );
  ```

* Scaling: Read replicas for heavy read loads; partition/shard if user base grows large.
- Reason: relational DB suits structured relationship data.

#### Service: Feed Service

- Responsibilities: handle posts/comments/likes, serve timelines.
- Schema (simplified):

  ```sql
  posts (
    id UUID PK,
    user_id UUID FK users.id,
    content TEXT,
    media_url VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );

  comments (
    id UUID PK,
    post_id UUID FK posts.id,
    user_id UUID FK users.id,
    content TEXT,
    created_at TIMESTAMP
  );

  likes (
    post_id UUID FK posts.id,
    user_id UUID FK users.id,
    created_at TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
  );
  ```

* Caching: Use Redis to cache recent posts per user or pre-computed feed.
- Pagination: Use keyset pagination (e.g., created_at + id) for infinite scroll.
- Scaling: Posts table may grow large → partition by time or user_id; replicate read traffic.
- Reason: Combining relational DB + cache gives good read performance and simpler writes.

#### Service: Storage/Media Service

- Responsibilities: file uploads (images/videos), retrieval, serving large objects.
- Storage: Use object storage (S3 / MinIO) for large media; use CDN for delivery.
- Flow: Client uploads media → signed URL or service uploads → store in object store → record metadata in DB → serve via CDN.
- Scaling: Object storage scales well, CDN handles delivery globally; minimize load on origin.
- Reason: Media objects require scalable storage and efficient delivery.

#### Service: Chat Service

- Responsibilities: handle real-time messaging between users.
- Technology: WebSockets (e.g., Socket.IO) for realtime connection.
- Flow:

  1. Client connects via WebSocket to Chat service (authenticated via token).
  2. Message arrives → Chat service persists in DB or message store → publish event to subscribers (other user(s) connected) via Redis pub/sub / message broker.
  3. If recipient offline → store unread message count, send notification (via Notification service).
- Scaling: WebSocket connections are stateful — need sticky sessions or connection routing (via load-balancer + consistent hashing) or delegate to a message broker for fan-out. Cluster plus Redis to share state/room membership.
- Reason: WebSockets allow low-latency, bi-directional real-time communication essential for chat.

#### Service: Notification & Email Service

- Responsibilities: send in-app notifications and email notifications (e.g., when someone likes your post, sends you chat message, etc).
- Technology: Use message queue (RabbitMQ) for asynchronous processing of notification tasks.
- Flow:

  1. Event emitted from Feed/Chat service (e.g., “post liked”) → publish to queue.
  2. Notification service subscribes to queue → processes event → creates in-app notification (DB) and/or sends email via SMTP.
- Scaling: Multiple workers can consume from queue; queue decouples producers and consumers, gives retry/back-off options, dead-letter queue for failures.
- Reason: Asynchronous processing prevents blocking user flows, increases reliability and throughput.

#### Service: Search Service

- Responsibilities: support search queries across users, posts, media, marketplace items. Provide analytics.
- Technology: Use Elasticsearch for full-text search, faceted search, analytics indexing.
- Flow: On content creation/update (post, media, item) → service publishes event → Search service indexes document into Elasticsearch. Client search request → hits Search service → queries Elasticsearch and returns results.
- Scaling: Elasticsearch cluster can be sharded/replicated; index updates can be batched or near-real-time; monitoring of shards/heap is necessary.
- Reason: Relational DBs are poor for full-text search and analytics; Elasticsearch is optimized for such workloads.

#### Service: Marketplace/Transaction Service

- Responsibilities: allow users to list digital goods, purchase, order management.
- Schema (simplified):

  ```sql
  items (
    id UUID PK,
    seller_id UUID FK users.id,
    title VARCHAR,
    description TEXT,
    price DECIMAL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );

  orders (
    id UUID PK,
    item_id UUID FK items.id,
    buyer_id UUID FK users.id,
    seller_id UUID FK users.id,
    status ENUM('pending','paid','shipped','completed','cancelled'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );
  ```

* Data consistency: Cross-service transactions (e.g., update item and create order). Use Saga pattern for distributed transactions. ([Medium][1])
- Scaling: Partition orders by seller_id or buyer_id; read replicas for order queries.
- Reason: E-commerce type flows require careful consistency management and microservice boundaries.

---

## 3. Core System components

```text
connectsphere/
│
├── frontend/              # React + Vite app
│
├── gateway/               # API Gateway + Auth
│
├── services/
│   ├── user-service/
│   ├── feed-service/
│   ├── chat-service/
│   ├── notification-service/
│   ├── marketplace-service/
│   ├── search-service/
│   └── storage-service/
│
├── infra/
│   ├── docker-compose.yml
│   ├── k8s/               # Kubernetes manifests
│   ├── prometheus/
│   ├── grafana/
│   └── nginx/
│
├── ci-cd/
│   ├── jenkins/
│   └── github-actions/
│
└── docs/
    ├── architecture.md
    ├── api-specs.md
    └── system-design.md
```

---

## 4. Infrastructure Stack

| Layer                       | Tools                                                                              |
| :-------------------------- | :--------------------------------------------------------------------------------- |
| **Containerization**        | Docker Compose (local) → Kubernetes (scaling)                                      |
| **Storage**                 | PostgreSQL (relational data), MinIO (files), Redis (cache), Elasticsearch (search) |
| **Messaging**               | RabbitMQ (notifications)                                                           |
| **Monitoring**              | Prometheus + Grafana                                                               |
| **CI/CD**                   | Jenkins or GitHub Actions                                                          |
| **Versioning & Deployment** | GitHub + Docker Hub + K8s manifests                                                |
| **Load Balancing**          | Nginx or Kubernetes Service                                                        |
| **Alerting**                | Alertmanager + Telegram notifications                                              |

---

##  5. User-Service Endpoints

| Method   | Endpoint              | Description               | Body Example                                                        |
| -------- | --------------------- | ------------------------- | ------------------------------------------------------------------- |
| **POST** | `/register`           | Register new user         | `{ "username": "string", "email": "string", "password": "string" }` |
| **POST** | `/login`              | User login                | `{ "email": "string", "password": "string" }`                       |
| **GET**  | `/{userId}`           | Get user by ID            | —                                                                   |
| **PUT**  | `/{userId}`           | Update user info          | —                                                                   |
| **POST** | `/follow`             | Follow a user             | `{ "followerId": "uuid", "followingId": "uuid" }`                   |
| **POST** | `/unfollow`           | Unfollow a user           | `{ "followerId": "uuid", "followingId": "uuid" }`                   |
| **GET**  | `/{userId}/followers` | List user followers       | —                                                                   |
| **GET**  | `/{userId}/following` | List users being followed | —                                                                   |

---