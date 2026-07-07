# 🛒 NexusStore Backend API

A high-performance, production-ready backend e-commerce RESTful API engine built with **Node.js**, **Express**, and **PostgreSQL**. This system features zero-config integration for asset compilation, secure token-based authentication, an optimized unified "Upsert" shopping cart model, strict database-level inventory validation management, and a complete secure Stripe payment settlement cycle automated via signed cryptographic event webhooks.

---

## 🏗️ Core Architecture & Data Flow

The system is designed with a clean separation of concerns, decoupling routes, controllers, database query layers, and security middleware to maintain predictable performance and high scannability under load.

┌────────────────────────────────────────────────────────────────────────┐
│                          Client Application                            │
└──────────────────────────────────┬─────────────────────────────────────┘
│ HTTPS Requests
▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Express Router Layer                          │
├────────────────────────────────────────────────────────────────────────┤
│  • Security Shields (Helmet, CORS)     • Global Rate Limiter           │
└──────────────────────────────────┬─────────────────────────────────────┘
│ Passing Sanitized Traffic
▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Middleware Pipeline                             │
├────────────────────────────────────────────────────────────────────────┤
│  • JWT Authentication Verifier         • Request Body Validators       │
└──────────────────────────────────┬─────────────────────────────────────┘
│ Validated Execution Flow
▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Controller Handlers                             │
├────────────────────────────────────────────────────────────────────────┤
│  • Business Logic Processing           • Stripe SDK Integrations       │
└──────────────────────────────────┬─────────────────────────────────────┘
│ Parameterized Queries
▼
┌────────────────────────────────────────────────────────────────────────┐
│                       PostgreSQL Database Storage                      │
├────────────────────────────────────────────────────────────────────────┤
│  • Users      • Products (Stock)      • Cart Items     • Order Tasks   │
└────────────────────────────────────────────────────────────────────────┘


---

## 🚀 Key Architectural Features

* **🛡️ Hardened Security Infrastructure:** Engineered with `helmet` HTTP headers protection, cross-origin resource sharing (`cors`) configured dynamically for development/production loops, and `express-rate-limit` to neutralize brute-force attacks and resource spamming.
* **📦 Relational Inventory Guardrails:** Implements manual table alteration definitions directly in PostgreSQL. Ensures strict inventory boundary conditions at the database level, preventing overselling or invalid cart accumulation values before reaching checkouts.
* **🔄 Streamlined "Upsert" Cart Logic:** Replaces individual add, increment, and decrement configurations with a high-performance database `ON CONFLICT (user_id, product_id) DO UPDATE` query architecture. Handles dynamic qty adjustments and automatic eviction upon hitting zero seamlessly.
* **📈 Server-Side Cursor Pagination:** Product retrieval optimization through strict `LIMIT` and `OFFSET` SQL querying matrices. Returns pagination metadata (total rows, current coordinates, and boolean completion states) to support high-fidelity infinite-loading layouts.
* **🔌 Closed-Loop Webhook Processing:** Real-time event settlement listeners acting directly on cryptographic event handshakes via the `Stripe CLI`. Automatically handles payment tracking, mass-updates item inventories, clears processing carts, and initializes fulfillment tracking workers.

---

## 🛠️ Tech Stack Matrix

* **Runtime Environment:** Node.js (v18+)
* **Application Framework:** Express.js
* **Database Management:** PostgreSQL (Pg Pool Instance)
* **Encryption & Auth:** JSON Web Tokens (JWT), Bcrypt.js
* **Payment Processing Gateway:** Stripe SDK & Stripe CLI Automated Handshakes
* **Security & Utility:** Helmet, Express Rate Limit, Cors, Dotenv

---

## 🗃️ Database Layout (Schema Blueprint)

The system manages relationship states across four primary physical tables inside PostgreSQL:

### `users`
Tracks customer profile credentials and credentials handshakes.
* `id` (SERIAL, PRIMARY KEY)
* `name` (VARCHAR, NOT NULL)
* `email` (VARCHAR, UNIQUE, NOT NULL)
* `password` (VARCHAR, NOT NULL)

### `products`
The core catalog ledger housing retail items and physical stock parameters.
* `id` (SERIAL, PRIMARY KEY)
* `name` (VARCHAR, NOT NULL)
* `description` (TEXT)
* `price` (NUMERIC(10,2), NOT NULL)
* `image` (TEXT)
* `category` (VARCHAR(100))
* `stock` (INT, DEFAULT 10)

### `cart_items`
Relational middleman mapping customer ownership vectors to specific product selections.
* `user_id` (INT, REFERENCES users)
* `product_id` (INT, REFERENCES products)
* `quantity` (INT, NOT NULL)
* *Composite Constraint:* `PRIMARY KEY (user_id, product_id)`

### `tasks`
Fulfillment microservice rows processing transaction completions down the assembly line.
* `id` (SERIAL, PRIMARY KEY)
* `user_id` (INT, REFERENCES users)
* `title` (VARCHAR)
* `description` (TEXT)
* `status` (VARCHAR, DEFAULT 'processing')

---

## 🔌 API Endpoints Reference Specification

### 🔑 Authentication Module (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Compiles user profile parameters into DB rows | Public |
| `POST` | `/login` | Audits hash strings and returns signed JWT strings | Public |
| `GET` | `/users` | Returns verified profile arrays linked to current tokens | Private |

### 🛍️ Product Catalog Module (`/api/products`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Fetches a server-paginated chunk of products | Public |
| `POST` | `/` | Injects a new commercial item configuration into rows | Admin/Dev |

### 🛒 Cart Workspace Module (`/api/cart`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Compiles total amounts and lists mapped cart items | Private |
| `POST` | `/` | Core Unified Upsert entry. Adjusts quantities safely | Private |

---
