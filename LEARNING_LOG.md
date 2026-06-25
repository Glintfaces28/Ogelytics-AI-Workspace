## BACKEND FOUNDATION

Day1:  23. 06.2026
Step 1: Create Project Folder:

Opened VS Code terminal and created the main project folder.

Command:

mkdir Enterprise-AI-Workspace

Moved into the folder:

cd Enterprise-AI-Workspace
Step 2: Create Project Structure

Created the project folder:

mkdir enterprise-ai-workspace

Moved into the folder:

cd enterprise-ai-workspace

Created backend folder:

mkdir backend

Moved into backend folder:

cd backend
Step 3: Verify Python Installation

Checked whether Python was installed.

Command:

python --version

Result:

Python 3.13.14

Learning:

Python is correctly installed and available in the terminal.

Step 4: Create Virtual Environment

Created a virtual environment.

Command:

python -m venv venv

Learning:

A virtual environment creates an isolated Python environment for this project.

Benefits:

Keeps project dependencies separate
Prevents conflicts with other projects
Makes deployment easier
Step 5: Activate Virtual Environment

Activated the virtual environment.

Command:

venv\Scripts\activate

Result:

The terminal changed to:

(venv)

Learning:

When "(venv)" appears in the terminal, the virtual environment is active.

Step 6: Install FastAPI and Uvicorn

Installed required packages.

Command:

pip install fastapi uvicorn

Learning:

FastAPI:

Framework used to build APIs
Fast and modern Python backend framework

Uvicorn:

ASGI server
Runs FastAPI applications

## Step 7: Understanding the First FastAPI Application

### Code Overview

The application starts by importing FastAPI:

```python
from fastapi import FastAPI
```

Learning:

This imports the FastAPI framework so that we can build a backend API application.

---

### Creating the Application

```python
app = FastAPI(
    title="Enterprise AI Workspace API",
    version="1.0.0"
)
```

Learning:

This creates the backend application object called `app`.

The application is given metadata:

* Title: Enterprise AI Workspace API
* Version: 1.0.0

All routes and backend functionality will be connected to this application object.

---

### Home Endpoint

```python
@app.get("/")
```

Learning:

This creates the root endpoint of the API.

When a user visits:

```
http://127.0.0.1:8000
```

the function runs and returns:

```json
{
  "message": "Enterprise AI Workspace API is running"
}
```

Purpose:

To confirm that the backend application is running correctly.

---

### Health Endpoint

```python
@app.get("/health")
```

Learning:

This creates a health-check endpoint.

When a user, cloud service, monitoring system, Docker container, AWS service, or load balancer visits:

```
/health
```

the application returns:

```json
{
  "status": "healthy"
}
```

Purpose:

To verify that the backend application is alive, healthy, and responding correctly.

---

## Step 8: Running the Application

Command:

```bash
uvicorn main:app --reload
```

Learning:

* main = main.py file
* app = FastAPI application object
* --reload = automatically restarts the server when code changes

Result:

The FastAPI server started successfully and the application became accessible through a web browser.

---

## Key Understanding

The FastAPI application is created first.

Endpoints are then attached to the application using:

```python
@app.get(...)
```

Endpoints are URLs that users or systems can visit to receive data from the backend.

Current endpoints:

* /
* /health

Both endpoints are functioning correctly.

Interview Answer

If someone asked:

What does your first FastAPI application do?

You could say:

I imported the FastAPI framework, created an application object called app, then created two endpoints. The root endpoint / returns a message confirming the API is running. The /health endpoint returns a health status used by monitoring systems and cloud services to verify that the backend is operational.

Created a professional FastAPI project structure.

Folders created:
- uploads
- routers
- services

Files created:
- routers/documents.py
- services/pdf_reader.py

Learning:
- routers contain API endpoints
- services contain business logic
- uploads stores files uploaded by users

This structure makes the project easier to maintain and scale.

Learned:
- How to upload files using FastAPI
- How UploadFile works
- How files are saved to disk
- How to test APIs with Swagger

Successfully uploaded a file into the uploads folder.
## Day1 Goal Achieved
✅ Created the project structure
✅ Created the backend folder
✅ Verified Python installation
✅ Created and activated a virtual environment
✅ Installed FastAPI and Uvicorn
✅ Created my first main.py
✅ Learned what FastAPI() does
✅ Learned what an endpoint is
✅ Learned what / and /health are for
✅ Successfully started the FastAPI server
✅ Created project documentation (PROJECT_NOTES.md)
✅ Created a learning journal (LEARNING_LOG.md)

---

## Day 2 — 24.06.2026: DATABASE + AUTHENTICATION

### Module 2: PostgreSQL Database

#### What we built:
- Connected FastAPI to a real PostgreSQL database using SQLAlchemy
- Created a `.env` file to store database credentials securely
- Created `database.py` — handles the database connection and session
- Created `models.py` with the `Document` model — maps to a `documents` table in PostgreSQL
- Updated the upload endpoint to save file records into the database
- Added `GET /documents` endpoint to list all uploaded documents from the database

#### New files:
- `database.py` — SQLAlchemy engine, session, and Base
- `models.py` — Document database model

#### Key learnings:
- SQLAlchemy is an ORM (Object Relational Mapper) — it lets you write Python instead of SQL
- `Base.metadata.create_all()` creates all tables automatically when the app starts
- `SessionLocal` is a factory that creates one database session per request
- `get_db()` is a FastAPI dependency that opens and closes the DB session for each request

---

### Module 3: Authentication (JWT)

#### What we built:
- Added a `User` model to `models.py` — stores username, email, hashed password
- Created `schemas.py` — Pydantic models that define what shape request data must have
- Created `services/auth.py` — handles password hashing (bcrypt) and JWT token creation/verification
- Created `dependencies.py` — a reusable `get_current_user` function that reads and validates a JWT
- Created `routers/auth.py` — two new endpoints:
  - `POST /auth/register` — creates a new user account
  - `POST /auth/login` — verifies credentials and returns a JWT token
- Protected `POST /upload` so only logged-in users with a valid token can upload files

#### New files:
- `schemas.py` — UserCreate, UserLogin, Token Pydantic schemas
- `services/auth.py` — hash_password, verify_password, create_access_token, decode_access_token
- `dependencies.py` — get_current_user dependency
- `routers/auth.py` — /auth/register and /auth/login endpoints

#### Key learnings:
- Passwords are NEVER stored in plain text — they are hashed using bcrypt before saving
- A hash is a one-way transformation: you can verify a password but you cannot reverse it back
- JWT (JSON Web Token) is a signed string given to users after login
  - It contains: user identity (email, id) + an expiry time
  - The server signs it with a SECRET_KEY so it cannot be faked
- A `dependency` in FastAPI is a reusable function injected into endpoints
- `get_current_user` reads the JWT from the `Authorization: Bearer <token>` header and identifies the user
- Endpoints that depend on `get_current_user` are automatically protected — no token = 401 Unauthorized

#### Full flow tested and working:
1. `POST /auth/register` → creates user in database with hashed password
2. `POST /auth/login` → verifies password, returns JWT token
3. `POST /upload` with `Authorization: Bearer <token>` → file saved, record stored in DB
4. `POST /upload` without token → 401 Not Authenticated

---

### Module 4: Document Management

#### What we built:
- `GET /documents/{id}` — fetch a single document's details by its ID
- `GET /documents/{id}/download` — download the actual file to your computer
- `GET /documents/{id}/content` — extract and return the text content from a PDF
- `DELETE /documents/{id}` — delete the database record AND the file from disk (requires login)
- Removed the old hardcoded `/read-pdf` endpoint and replaced it with the proper dynamic version

#### Key learnings:
- HTTP has 4 main methods that map to actions on data:
  - `GET` — read (safe, no changes)
  - `POST` — create new
  - `PUT/PATCH` — update existing
  - `DELETE` — remove
- `FileResponse` tells FastAPI to send a real file back, not just JSON
- `404 Not Found` is returned when a resource doesn't exist
- `401 Unauthorized` is returned when no valid token is provided
- A good API always validates the data exists before trying to use it

#### Behaviour proven and tested:
- `GET /documents/2` → returns document details
- `GET /documents/999` → 404 Not Found
- `DELETE /documents/2` with valid token → file deleted from disk, record removed from DB
- `GET /documents/2` after delete → 404 Not Found (confirmed gone)
- `DELETE /documents/1` without token → 401 Not Authenticated

## Day 2 Goals Achieved
✅ Connected FastAPI to PostgreSQL
✅ Created Document database model
✅ Saved uploaded files to database
✅ Listed documents from database
✅ Created User model with hashed password storage
✅ Built /auth/register endpoint
✅ Built /auth/login endpoint returning JWT
✅ Protected /upload with JWT authentication
✅ Confirmed unauthenticated upload is rejected
✅ Built GET /documents/{id} — fetch single document
✅ Built GET /documents/{id}/download — download the file
✅ Built GET /documents/{id}/content — extract PDF text
✅ Built DELETE /documents/{id} — delete document + file (auth required)
✅ All edge cases tested: 404 on missing ID, 401 on missing token

---

## Current Backend Architecture Explained

This project now follows a simple layered FastAPI architecture:

- `main.py` starts and assembles the application
- `routers/` contains API endpoints
- `services/` contains reusable business logic
- `models.py` defines database tables
- `schemas.py` defines request/response data shapes
- `database.py` connects the app to PostgreSQL
- `dependencies.py` contains reusable FastAPI dependency logic

---

### `main.py`

#### Purpose:
`main.py` is the entry point of the FastAPI backend.

It creates the FastAPI app, creates database tables, and connects routers to the app.

#### How it works:
- Imports `FastAPI`
- Imports `Base` and `engine` from `database.py`
- Imports `models` so SQLAlchemy knows which tables exist
- Runs `Base.metadata.create_all(bind=engine)` to create missing database tables
- Creates the `app = FastAPI(...)` object
- Defines basic `/` and `/health` endpoints
- Includes the authentication and document routers

#### Files that depend on it:
- Uvicorn depends on it when running:

```bash
uvicorn main:app --reload
```

- The whole backend depends on `main.py` because it connects all routers into one application.

#### Interview questions:
- What is the purpose of `main.py` in a FastAPI project?
- What does `uvicorn main:app --reload` mean?
- Why do we include routers in `main.py`?
- What does `Base.metadata.create_all()` do?
- Why is `/health` useful in backend applications?

---

### `database.py`

#### Purpose:
`database.py` manages the connection between FastAPI and PostgreSQL.

It creates the SQLAlchemy engine, session factory, and base class used by database models.

#### How it works:
- Loads environment variables from `.env`
- Reads the database connection settings
- Creates a SQLAlchemy `engine`
- Creates `SessionLocal`, which produces database sessions
- Creates `Base`, which models inherit from
- Defines `get_db()`, a FastAPI dependency that opens and closes a database session for each request

#### Files that depend on it:
- `main.py` uses `Base` and `engine`
- `models.py` uses `Base`
- `routers/auth.py` uses `get_db`
- `routers/documents.py` uses `get_db`
- `dependencies.py` uses `get_db`

#### Interview questions:
- What is SQLAlchemy?
- What is an SQLAlchemy engine?
- What is a database session?
- Why do we open and close a database session per request?
- Why should database credentials live in `.env` instead of directly in code?

---

### `.env`

#### Purpose:
`.env` stores secret or environment-specific settings, such as database credentials and JWT secret keys.

#### How it works:
- `database.py` calls `load_dotenv()`
- Python reads variables like `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_NAME`
- The app uses these values to connect to PostgreSQL

#### Files that depend on it:
- `database.py` depends on it for database settings
- `services/auth.py` can depend on it for `SECRET_KEY`

#### Interview questions:
- What is a `.env` file?
- Why should secrets not be hardcoded?
- What kind of values belong in environment variables?
- Should `.env` be committed to GitHub?

---

### `models.py`

#### Purpose:
`models.py` defines the database tables using SQLAlchemy ORM classes.

It currently defines:
- `Document`
- `User`

#### How it works:
- Each class inherits from `Base`
- `__tablename__` defines the actual table name in PostgreSQL
- Each `Column(...)` defines a database column
- SQLAlchemy maps Python objects to database rows

Example:

```python
class User(Base):
    __tablename__ = "users"
```

This means SQLAlchemy creates or uses a table named `users`.

#### Files that depend on it:
- `main.py` imports `models` so tables can be created
- `routers/auth.py` creates and queries `User`
- `routers/documents.py` creates, queries, and deletes `Document`
- `dependencies.py` queries `User`

#### Interview questions:
- What is an ORM model?
- What is the difference between a model and a schema?
- Why do models inherit from `Base`?
- What does `primary_key=True` mean?
- Why should passwords be stored as `hashed_password` instead of `password`?

---

### `schemas.py`

#### Purpose:
`schemas.py` defines the shape of API request and response data using Pydantic.

It currently defines:
- `UserCreate`
- `UserLogin`
- `Token`

#### How it works:
- FastAPI reads the request body
- Pydantic validates that the required fields exist
- If the data is invalid, FastAPI automatically returns an error
- If the data is valid, the endpoint receives a clean Python object

Example:

```python
class UserLogin(BaseModel):
    email: str
    password: str
```

This means login requests must contain an email and password.

#### Files that depend on it:
- `routers/auth.py` uses `UserCreate` for registration
- `routers/auth.py` uses `UserLogin` for login

#### Interview questions:
- What is Pydantic used for in FastAPI?
- What is the difference between request validation and database storage?
- Why do we use schemas instead of accepting raw dictionaries?
- What happens if a request body is missing a required field?

---

### `dependencies.py`

#### Purpose:
`dependencies.py` stores reusable FastAPI dependency logic.

Right now it contains `get_current_user`, which protects routes by requiring a valid JWT token.

#### How it works:
- `OAuth2PasswordBearer` reads the bearer token from the request header
- `decode_access_token()` verifies and decodes the JWT
- The token payload contains the user's email in `sub`
- The database is queried to find that user
- If the token or user is invalid, the request gets `401 Unauthorized`
- If valid, the current user object is returned to the endpoint

#### Files that depend on it:
- `routers/documents.py` uses `get_current_user` to protect upload and delete endpoints

#### Interview questions:
- What is a FastAPI dependency?
- What does `Depends(...)` do?
- What is a bearer token?
- How does a protected endpoint know who the current user is?
- Why should authentication logic be reusable instead of copied into every route?

---

### `routers/auth.py`

#### Purpose:
`routers/auth.py` contains authentication API endpoints.

It handles:
- User registration
- User login
- JWT token creation

#### How it works:
- `POST /auth/register`
  - Accepts username, email, and password
  - Checks if the email already exists
  - Hashes the password
  - Saves the new user in PostgreSQL

- `POST /auth/login`
  - Accepts email and password
  - Finds the user by email
  - Verifies the password against the stored hash
  - Returns a JWT access token

#### Files that depend on it:
- `main.py` includes this router

#### Files it depends on:
- `models.py`
- `schemas.py`
- `database.py`
- `services/auth.py`

#### Interview questions:
- What happens during user registration?
- Why do we check for existing emails?
- What happens during login?
- Why does login return a token instead of storing login state on the server?
- What status code should be returned for invalid credentials?

---

### `routers/documents.py`

#### Purpose:
`routers/documents.py` contains document management API endpoints.

It handles:
- Listing documents
- Fetching one document
- Uploading documents
- Downloading files
- Reading PDF text content
- Deleting documents

#### How it works:
- `GET /documents`
  - Reads all document records from PostgreSQL

- `GET /documents/{document_id}`
  - Finds one document by ID
  - Returns `404 Not Found` if it does not exist

- `POST /upload`
  - Requires a logged-in user
  - Saves the uploaded file to the `uploads/` folder
  - Saves metadata in PostgreSQL

- `GET /documents/{document_id}/download`
  - Finds the document record
  - Checks that the file exists on disk
  - Returns the file using `FileResponse`

- `GET /documents/{document_id}/content`
  - Finds the document record
  - Allows only PDF files
  - Reads PDF text using `read_pdf()`

- `DELETE /documents/{document_id}`
  - Requires a logged-in user
  - Deletes the file from disk
  - Deletes the database record

#### Files that depend on it:
- `main.py` includes this router

#### Files it depends on:
- `models.py`
- `database.py`
- `dependencies.py`
- `services/pdf_reader.py`

#### Interview questions:
- What is a router in FastAPI?
- Why separate document endpoints into `routers/documents.py`?
- What is the difference between storing a file on disk and storing metadata in a database?
- Why should upload and delete require authentication?
- Why do we return `404` when a document ID does not exist?
- What does `FileResponse` do?

---

### `services/auth.py`

#### Purpose:
`services/auth.py` contains reusable authentication helper functions.

It handles:
- Password hashing
- Password verification
- JWT creation
- JWT decoding

#### How it works:
- `hash_password(password)`
  - Converts a plain password into a bcrypt hash

- `verify_password(plain_password, hashed_password)`
  - Checks whether a login password matches the stored hash

- `create_access_token(data)`
  - Copies user data into a JWT payload
  - Adds an expiration time
  - Signs the token using `SECRET_KEY`

- `decode_access_token(token)`
  - Verifies the token signature
  - Returns the payload if valid

#### Files that depend on it:
- `routers/auth.py` uses password hashing, verification, and token creation
- `dependencies.py` uses token decoding

#### Interview questions:
- Why should passwords be hashed?
- What is bcrypt?
- What is a JWT?
- What does the JWT `exp` field mean?
- What does the JWT `sub` field usually represent?
- Why does the server need a `SECRET_KEY`?

---

### `services/pdf_reader.py`

#### Purpose:
`services/pdf_reader.py` contains the reusable PDF text extraction logic.

#### How it works:
- Opens a PDF using `PdfReader`
- Loops through every page
- Extracts text from each page
- Combines the text into one string
- Returns the extracted text

#### Files that depend on it:
- `routers/documents.py` uses `read_pdf()` in `GET /documents/{document_id}/content`

#### Interview questions:
- Why put PDF reading logic in a service file instead of directly in the route?
- What does `PdfReader` do?
- What might happen if a PDF page has no extractable text?
- Why might scanned PDFs need OCR instead of normal text extraction?

---

### `requirements.txt`

#### Purpose:
`requirements.txt` lists the Python packages needed to run the backend.

#### How it works:
When setting up the project, run:

```bash
pip install -r requirements.txt
```

This installs FastAPI, Uvicorn, SQLAlchemy, PostgreSQL drivers, authentication packages, and PDF tools.

#### Files that depend on it:
- The whole backend depends on these packages being installed

#### Interview questions:
- What is the purpose of `requirements.txt`?
- Why is dependency tracking important?
- What happens if a package is missing from the environment?
- How is `requirements.txt` used during deployment?

---

### `uploads/`

#### Purpose:
`uploads/` stores the actual uploaded files on disk.

The database stores metadata, but the file bytes are stored in this folder.

#### How it works:
- `routers/documents.py` receives an uploaded file
- The file is written into `uploads/`
- PostgreSQL stores the filename, content type, file path, file size, and upload time
- Download and content-reading endpoints use the stored file path to find the file

#### Files that depend on it:
- `routers/documents.py` reads from and writes to this folder
- `services/pdf_reader.py` indirectly depends on files stored here when reading PDF content

#### Interview questions:
- Why store files on disk instead of directly in PostgreSQL?
- What is metadata?
- What problems can happen if the database record exists but the file is missing?
- How would this change in production with cloud storage like S3?

---

## Current Request Flow Examples

### Register flow:
1. Client sends `POST /auth/register`
2. `routers/auth.py` validates the request using `schemas.UserCreate`
3. Password is hashed using `services/auth.py`
4. User is saved using SQLAlchemy session from `database.py`
5. A new row appears in the `users` table

### Login flow:
1. Client sends `POST /auth/login`
2. `routers/auth.py` validates the request using `schemas.UserLogin`
3. Database is queried for the user
4. Password is verified using bcrypt
5. JWT token is created and returned

### Protected upload flow:
1. Client sends `POST /upload` with `Authorization: Bearer <token>`
2. `dependencies.py` verifies the token
3. `routers/documents.py` saves the file into `uploads/`
4. Document metadata is saved into the `documents` table
5. API returns the new document ID and metadata

### PDF content flow:
1. Client sends `GET /documents/{id}/content`
2. `routers/documents.py` finds the document row
3. The endpoint checks that the file is a PDF
4. `services/pdf_reader.py` extracts text
5. API returns the extracted text

---

## Interview Questions With Sample Answers

### `main.py`

#### What is the purpose of `main.py` in a FastAPI project?
Sample answer:
`main.py` is the entry point of the FastAPI application. It creates the `app` object, connects routers, defines basic endpoints, and starts application-level setup like database table creation.

#### What does `uvicorn main:app --reload` mean?
Sample answer:
`main` means the `main.py` file, `app` means the FastAPI application object inside that file, and `--reload` restarts the server automatically when code changes during development.

#### Why do we include routers in `main.py`?
Sample answer:
Routers let us split endpoints into separate files, like auth routes and document routes. `main.py` includes them so FastAPI knows those endpoints belong to the application.

#### What does `Base.metadata.create_all()` do?
Sample answer:
It tells SQLAlchemy to look at all model classes and create any missing database tables. It is useful while learning, but production projects often use migrations like Alembic.

#### Why is `/health` useful in backend applications?
Sample answer:
`/health` lets tools, servers, or cloud platforms check whether the API is running and responding correctly.

---

### `database.py`

#### What is SQLAlchemy?
Sample answer:
SQLAlchemy is a Python ORM and database toolkit. It lets the app work with database tables using Python classes and objects instead of writing raw SQL for every operation.

#### What is an SQLAlchemy engine?
Sample answer:
The engine manages the connection between the Python application and the database. It knows the database URL, driver, host, port, username, password, and database name.

#### What is a database session?
Sample answer:
A session is a temporary workspace for database operations. We use it to query, add, update, delete, commit, or roll back database changes.

#### Why do we open and close a database session per request?
Sample answer:
Each request gets its own database session so database work is isolated and cleaned up properly. Closing the session prevents connection leaks.

#### Why should database credentials live in `.env` instead of directly in code?
Sample answer:
Credentials are sensitive and can change between environments. Keeping them in `.env` avoids hardcoding secrets and makes the app easier to configure.

---

### `.env`

#### What is a `.env` file?
Sample answer:
A `.env` file stores environment variables for local development, such as database credentials and secret keys.

#### Why should secrets not be hardcoded?
Sample answer:
Hardcoded secrets can accidentally be committed to GitHub or shared with others. Environment variables keep secrets separate from the source code.

#### What kind of values belong in environment variables?
Sample answer:
Database credentials, API keys, secret keys, hostnames, ports, environment names, and other configuration values belong in environment variables.

#### Should `.env` be committed to GitHub?
Sample answer:
No. `.env` usually contains private secrets and should be added to `.gitignore`. A project can include `.env.example` with fake placeholder values.

---

### `models.py`

#### What is an ORM model?
Sample answer:
An ORM model is a Python class that represents a database table. Each object represents a row, and each class attribute represents a column.

#### What is the difference between a model and a schema?
Sample answer:
A model defines how data is stored in the database. A schema defines how data enters or leaves the API through request and response validation.

#### Why do models inherit from `Base`?
Sample answer:
`Base` connects the model class to SQLAlchemy’s metadata system. SQLAlchemy uses that metadata to create and manage tables.

#### What does `primary_key=True` mean?
Sample answer:
It marks a column as the unique identifier for each row in the table. In this project, `id` is the primary key for users and documents.

#### Why should passwords be stored as `hashed_password` instead of `password`?
Sample answer:
Plain passwords should never be stored. A hash lets the app verify a password without keeping the original password in the database.

---

### `schemas.py`

#### What is Pydantic used for in FastAPI?
Sample answer:
Pydantic validates request and response data. It checks that incoming data has the correct fields and types before the endpoint logic runs.

#### What is the difference between request validation and database storage?
Sample answer:
Request validation checks whether incoming API data is valid. Database storage saves approved data permanently in tables.

#### Why do we use schemas instead of accepting raw dictionaries?
Sample answer:
Schemas make data predictable, typed, and validated. They also make the API documentation clearer in Swagger.

#### What happens if a request body is missing a required field?
Sample answer:
FastAPI automatically returns a validation error, usually `422 Unprocessable Entity`, before the endpoint function runs.

---

### `dependencies.py`

#### What is a FastAPI dependency?
Sample answer:
A dependency is reusable logic that FastAPI runs before or during an endpoint. It can provide things like a database session or the current logged-in user.

#### What does `Depends(...)` do?
Sample answer:
`Depends(...)` tells FastAPI to run another function and inject its result into the endpoint.

#### What is a bearer token?
Sample answer:
A bearer token is a token sent in the `Authorization` header. The client sends it as `Authorization: Bearer <token>` to prove they are logged in.

#### How does a protected endpoint know who the current user is?
Sample answer:
The endpoint uses `get_current_user`. That function reads the JWT token, verifies it, extracts the user's email, and loads the matching user from the database.

#### Why should authentication logic be reusable instead of copied into every route?
Sample answer:
Reusable authentication keeps the code cleaner, reduces bugs, and makes it easy to protect more endpoints with the same logic.

---

### `routers/auth.py`

#### What happens during user registration?
Sample answer:
The API receives username, email, and password, checks if the email already exists, hashes the password, saves the user, and returns basic user information.

#### Why do we check for existing emails?
Sample answer:
Emails must be unique so one account maps to one identity. It also prevents duplicate users with the same login email.

#### What happens during login?
Sample answer:
The API finds the user by email, verifies the password against the stored hash, creates a JWT token, and returns it to the client.

#### Why does login return a token instead of storing login state on the server?
Sample answer:
JWT authentication is stateless. The server does not need to store a session for every user; the client sends the token with each protected request.

#### What status code should be returned for invalid credentials?
Sample answer:
`401 Unauthorized` is commonly used when the email or password is invalid.

---

### `routers/documents.py`

#### What is a router in FastAPI?
Sample answer:
A router groups related endpoints together. For example, document endpoints are grouped in `routers/documents.py`.

#### Why separate document endpoints into `routers/documents.py`?
Sample answer:
Separating endpoints keeps the project organized. It prevents `main.py` from becoming too large and makes document logic easier to maintain.

#### What is the difference between storing a file on disk and storing metadata in a database?
Sample answer:
The actual file bytes are saved in the `uploads/` folder. The database stores information about the file, such as filename, path, size, content type, and upload time.

#### Why should upload and delete require authentication?
Sample answer:
Uploading and deleting change system data. Requiring authentication prevents anonymous users from adding or removing files.

#### Why do we return `404` when a document ID does not exist?
Sample answer:
`404 Not Found` means the requested resource does not exist. If no document has that ID, the correct response is `404`.

#### What does `FileResponse` do?
Sample answer:
`FileResponse` sends an actual file back to the client instead of normal JSON data. It is used for file downloads.

---

### `services/auth.py`

#### Why should passwords be hashed?
Sample answer:
Hashing protects users if the database is leaked. The app can verify a password without storing the original password.

#### What is bcrypt?
Sample answer:
Bcrypt is a password hashing algorithm designed to be slow and secure, making it harder for attackers to crack passwords.

#### What is a JWT?
Sample answer:
A JWT is a signed token that stores user identity information and an expiration time. The client sends it with protected requests.

#### What does the JWT `exp` field mean?
Sample answer:
`exp` means expiration. It tells the server when the token should stop being valid.

#### What does the JWT `sub` field usually represent?
Sample answer:
`sub` means subject. It usually stores the identity of the user, such as their user ID or email.

#### Why does the server need a `SECRET_KEY`?
Sample answer:
The `SECRET_KEY` signs and verifies JWT tokens. Without the correct secret, someone cannot create a valid fake token.

---

### `services/pdf_reader.py`

#### Why put PDF reading logic in a service file instead of directly in the route?
Sample answer:
Service files keep business logic reusable and separate from HTTP route logic. The route handles the request, and the service handles PDF extraction.

#### What does `PdfReader` do?
Sample answer:
`PdfReader` opens a PDF file and lets the app read its pages and extract text.

#### What might happen if a PDF page has no extractable text?
Sample answer:
`extract_text()` may return `None`, so the code uses `or ""` to avoid errors and continue safely.

#### Why might scanned PDFs need OCR instead of normal text extraction?
Sample answer:
Scanned PDFs are often images of text, not real text. OCR is needed to recognize letters from the image.

---

### `requirements.txt`

#### What is the purpose of `requirements.txt`?
Sample answer:
It lists the Python packages the project needs. A developer or server can install them with `pip install -r requirements.txt`.

#### Why is dependency tracking important?
Sample answer:
It makes the project reproducible. Another machine can install the same packages and run the app correctly.

#### What happens if a package is missing from the environment?
Sample answer:
The app may fail to start with an import error or crash when it reaches code that needs that package.

#### How is `requirements.txt` used during deployment?
Sample answer:
Deployment systems install the packages listed in `requirements.txt` before starting the application.

---

### `uploads/`

#### Why store files on disk instead of directly in PostgreSQL?
Sample answer:
Files can be large, and storing them on disk is simpler for this stage. PostgreSQL stores metadata so the app can find and manage the files.

#### What is metadata?
Sample answer:
Metadata is information about a file, such as its filename, file path, content type, size, and upload time.

#### What problems can happen if the database record exists but the file is missing?
Sample answer:
The API may find the document record but fail to download or read the file. That is why the code checks whether the file exists on disk.

#### How would this change in production with cloud storage like S3?
Sample answer:
The file would be uploaded to cloud storage, and the database would store the cloud file URL or storage key instead of a local path.

---

### Module 5: AI Document Search & Chat

Day 5: 25.06.2026

Step 1: Add document search and chat API structure

Created:

`enterprise-ai-workspace/backend/services/document_search.py`

Purpose:
This service contains the reusable logic for searching uploaded PDF documents. It reads PDF text, splits the text into smaller passages, scores passages against the user's question, and builds a simple grounded answer from the best result.

Created:

`enterprise-ai-workspace/backend/routers/ai.py`

Purpose:
This router contains the AI-related API endpoints:

`GET /ai/search`

Searches uploaded PDF documents and returns matching passages.

`POST /ai/chat`

Accepts a question, searches document content, and returns an answer with source passages.

Updated:

`enterprise-ai-workspace/backend/schemas.py`

Purpose:
Added request and response schemas for document search results, chat requests, search responses, and chat responses.

Updated:

`enterprise-ai-workspace/backend/main.py`

Purpose:
Registered the new AI router so the new endpoints become part of the FastAPI application.

Learning:

AI document chat does not have to start with a full external AI model. A first working version can search document text, find relevant passages, and return answers grounded in those passages. Later, embeddings and an LLM can improve answer quality without changing the overall route structure.

Step 2: Add request validation for chat

Updated:

`enterprise-ai-workspace/backend/schemas.py`

Purpose:
The chat request now uses Pydantic `Field` validation. The question must contain at least one character, and `max_results` must stay between 1 and 20.

Learning:

Validation should happen at the API boundary. Pydantic helps reject invalid input before the route tries to use it.

Step 3: Verify changed Python files

Command:

`enterprise-ai-workspace\backend\venv\Scripts\python.exe -m py_compile enterprise-ai-workspace\backend\main.py enterprise-ai-workspace\backend\schemas.py enterprise-ai-workspace\backend\routers\ai.py enterprise-ai-workspace\backend\services\document_search.py`

Result:

The changed Python files compiled successfully.

Learning:

`py_compile` checks Python syntax and import-time parse errors for specific files. It is useful when a full app run or database-backed test is not needed for the current step.

---

## Module 6: Teams & Permissions

Day 5: 25.06.2026

Step 1: Add Team and TeamMember database models

Updated:

`enterprise-ai-workspace/backend/models.py`

Added two new SQLAlchemy models:

**`Team`**

Represents an organisation team. Each team has:

- `id` — primary key
- `name` — unique team name
- `description` — optional description
- `owner_id` — foreign key pointing to the user who created the team
- `created_at` — timestamp

**`TeamMember`**

Represents membership of a user in a team. Each row has:

- `id` — primary key
- `team_id` — foreign key pointing to the team
- `user_id` — foreign key pointing to the user
- `role` — either `"admin"` or `"member"`
- `joined_at` — timestamp

Learning:

A `ForeignKey` links one table's column to another table's primary key. This enforces referential integrity — you cannot create a `TeamMember` row that points to a team or user that does not exist.

Two roles keep permissions simple at this stage:

- `admin` — can add and remove members
- `member` — can view team data

The team owner is automatically added as an `admin` member when the team is created.

---

Step 2: Add team schemas

Updated:

`enterprise-ai-workspace/backend/schemas.py`

Added four new Pydantic schemas:

**`TeamCreate`**

Validates the request body when creating a team. The name must have at least one character and no more than 100.

**`TeamOut`**

Defines the shape of team data returned by the API. Uses `model_config = ConfigDict(from_attributes=True)` so Pydantic v2 can read data directly from a SQLAlchemy ORM object.

**`TeamMemberAdd`**

Validates the request body when adding a member. The `role` field uses Python's `Literal["admin", "member"]` type to restrict values to exactly those two strings.

**`TeamMemberOut`**

Defines the shape of member data returned by the API. Also uses `from_attributes=True`.

Learning:

`Literal["admin", "member"]` is a type annotation that restricts a field to a fixed set of allowed string values. FastAPI and Pydantic will automatically reject any other value, returning a validation error before the endpoint logic runs.

`ConfigDict(from_attributes=True)` is the Pydantic v2 way to enable ORM mode. It tells Pydantic to read attribute values from an ORM object instead of requiring a plain dictionary.

---

Step 3: Create the teams router

Created:

`enterprise-ai-workspace/backend/routers/teams.py`

This router contains six endpoints:

**`POST /teams`** — Create a team

- Requires login
- Checks that the team name is not already taken
- Creates the `Team` row
- Automatically adds the creator as an `admin` member in `TeamMember`
- Returns the new team

**`GET /teams`** — List my teams

- Requires login
- Finds all `TeamMember` rows for the current user
- Returns all teams the user belongs to

**`GET /teams/{team_id}`** — Get one team

- Requires login
- Returns `404 Not Found` if the team does not exist
- Returns `403 Forbidden` if the current user is not a member

**`POST /teams/{team_id}/members`** — Add a member

- Requires login and admin role in that team
- Returns `404 Not Found` if the team or user does not exist
- Returns `400 Bad Request` if the user is already a member
- Adds the user to the team with the specified role

**`DELETE /teams/{team_id}/members/{user_id}`** — Remove a member

- Requires login and admin role in that team
- Returns `400 Bad Request` if someone tries to remove the team owner
- Deletes the `TeamMember` row

**`DELETE /teams/{team_id}`** — Delete a team

- Requires login and ownership of the team
- Returns `403 Forbidden` if the caller is not the owner
- Deletes all `TeamMember` rows first, then deletes the `Team` row

Learning:

Deleting all team members before deleting the team avoids a foreign key constraint error. Databases enforce that child rows (members) cannot point to a parent row (team) that no longer exists. You must remove children before removing the parent.

`403 Forbidden` means the user is authenticated but does not have permission. `401 Unauthorized` means the user is not authenticated at all. These are different status codes with different meanings.

---

Step 4: Register the teams router

Updated:

`enterprise-ai-workspace/backend/main.py`

Added import and `app.include_router(teams_router)` so the new team endpoints become part of the FastAPI application.

---

Step 5: Verify changed Python files

Command:

`enterprise-ai-workspace\backend\venv\Scripts\python.exe -m py_compile enterprise-ai-workspace\backend\models.py enterprise-ai-workspace\backend\schemas.py enterprise-ai-workspace\backend\routers\teams.py enterprise-ai-workspace\backend\main.py`

Result:

The changed Python files compiled successfully.

---

## Module 7: Reports & Analytics

Day 5: 25.06.2026

Step 1: Add uploaded_by to the Document model

Updated:

`enterprise-ai-workspace/backend/models.py`

Added a new column to `Document`:

```python
uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
```

This links each document to the user who uploaded it.

The column is `nullable=True` because existing document rows in the database were created before this column existed. Making it nullable means PostgreSQL will not reject those old rows.

Learning:

When you add a new column to an existing SQLAlchemy model, `Base.metadata.create_all()` does **not** automatically alter the table — it only creates tables that are completely missing. To add a column to an existing table in production, you use a database migration tool called **Alembic**. For learning purposes, you can drop and recreate the `documents` table to pick up the new column.

This is why production projects set up Alembic early. We will add Alembic in a later module.

Updated:

`enterprise-ai-workspace/backend/routers/documents.py`

The upload endpoint now stores the uploader's ID when saving a new document:

```python
uploaded_by=current_user.id,
```

Without this, analytics queries cannot group documents by user. Storing who uploaded what is also important for security and auditing.

---

Step 2: Add report schemas

Updated:

`enterprise-ai-workspace/backend/schemas.py`

Added two new Pydantic schemas:

**`WorkspaceSummary`**

Represents the overall workspace statistics returned by `GET /reports/summary`:

- `total_documents` — how many documents exist
- `total_users` — how many registered users exist
- `total_teams` — how many teams exist
- `total_storage_bytes` — total disk space used by all uploaded files
- `recent_uploads_7_days` — documents uploaded in the last 7 days

**`UserUploadStats`**

Represents one row in the per-user report returned by `GET /reports/documents/by-user`:

- `username` — the user's username
- `document_count` — how many documents they have uploaded

---

Step 3: Create the reports router

Created:

`enterprise-ai-workspace/backend/routers/reports.py`

This router contains two endpoints:

**`GET /reports/summary`**

Returns workspace-wide statistics. Uses SQLAlchemy aggregate functions:

- `func.count(Document.id)` — counts total documents
- `func.sum(Document.file_size)` — sums all file sizes
- `func.count(User.id)` — counts users
- `func.count(Team.id)` — counts teams
- A `timedelta(days=7)` filter counts recent uploads

**`GET /reports/documents/by-user`**

Returns each user's upload count, sorted from highest to lowest. Uses a SQL `LEFT OUTER JOIN` between `users` and `documents`:

```python
db.query(User.username, func.count(Document.id).label("document_count"))
  .outerjoin(Document, Document.uploaded_by == User.id)
  .group_by(User.id, User.username)
  .order_by(func.count(Document.id).desc())
  .all()
```

Learning:

**What is `func` in SQLAlchemy?**

`sqlalchemy.func` lets you call SQL aggregate functions like `COUNT`, `SUM`, `AVG`, and `MAX` directly from Python. SQLAlchemy translates them into SQL for you.

**What is a LEFT OUTER JOIN?**

A regular (inner) join only returns rows that have matching data in both tables. A left outer join returns all rows from the left table (users) even if there are no matching rows in the right table (documents). This means users with zero uploads still appear in the report with a count of zero.

**What does `.label("document_count")` do?**

It gives a name to the calculated column in the query result. This allows you to access the value by name (`row.document_count`) instead of by index.

**Why use `or 0` after `.scalar()`?**

`.scalar()` returns the single query result. If no documents exist, `func.sum()` returns `None` instead of `0`. The `or 0` converts `None` to `0` so the response always contains a valid integer.

---

Step 4: Register the reports router

Updated:

`enterprise-ai-workspace/backend/main.py`

Added import and `app.include_router(reports_router)` so the new analytics endpoints become part of the FastAPI application.

---

Step 5: Verify changed Python files

Command:

`enterprise-ai-workspace\backend\venv\Scripts\python.exe -m py_compile enterprise-ai-workspace\backend\models.py enterprise-ai-workspace\backend\schemas.py enterprise-ai-workspace\backend\routers\documents.py enterprise-ai-workspace\backend\routers\reports.py enterprise-ai-workspace\backend\main.py`

Result:

The changed Python files compiled successfully.

---

## Module 9: AWS Deployment

Day 5: 25.06.2026

### Overview

The goal of this module is to deploy the FastAPI backend to AWS so it is accessible on the internet. The architecture uses two AWS services:

- **EC2** (Elastic Compute Cloud) — a virtual machine in the cloud that runs the Docker container
- **RDS** (Relational Database Service) — a managed PostgreSQL database in the cloud

Locally, Docker Compose ran both the backend and the database together. In production, RDS replaces the `db` service. The backend container running on EC2 connects to RDS instead.

---

### AWS Architecture Diagram

```
Internet
    │
    ▼
EC2 Instance (port 8000)
    │  FastAPI backend container
    │  docker-compose.prod.yml
    │
    ▼
RDS Instance (port 5432)
    PostgreSQL database
```

---

### Step 1: Create a docker-compose.prod.yml

Created:

`enterprise-ai-workspace/backend/docker-compose.prod.yml`

```yaml
services:
  backend:
    build: .
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
```

Learning:

The production compose file has only one service: `backend`. There is no `db` service because RDS manages the database.

`env_file: .env` tells Docker Compose to read all environment variables from `.env`. On EC2, the `.env` file will have `DB_HOST` set to the RDS endpoint instead of `localhost`. Everything else in the app stays the same.

---

### Step 2: Create the EC2 setup script

Created:

`enterprise-ai-workspace/backend/aws/ec2-setup.sh`

This script runs once on a fresh Amazon Linux 2023 EC2 instance. It:

- Updates system packages
- Installs Docker and Git
- Starts Docker and enables it on reboot
- Adds the `ec2-user` to the `docker` group (so Docker commands work without `sudo`)
- Installs the Docker Compose plugin

Learning:

**What is EC2?**

EC2 (Elastic Compute Cloud) is AWS's virtual machine service. You choose the operating system, CPU, RAM, and disk size. The machine runs in AWS's data centres and is accessible over the internet.

**What is Amazon Linux 2023?**

Amazon Linux 2023 is the default Linux distribution for EC2. It is maintained by AWS and optimised for running on EC2 instances.

**Why run `sudo usermod -aG docker ec2-user`?**

By default, the Docker daemon requires root. Adding `ec2-user` to the `docker` group lets you run Docker commands without `sudo`. You must log out and back in for this change to take effect.

---

### Step 3: Create the deployment script

Created:

`enterprise-ai-workspace/backend/aws/deploy.sh`

This script runs on EC2 every time you want to deploy or update the application. It:

- Pulls the latest code from Git
- Rebuilds the Docker image
- Restarts the backend container in detached mode (`-d`)
- Prints the EC2 public IP so you can test the API

Learning:

`set -e` at the top of a bash script means "exit immediately if any command fails". This is a safety measure — if `git pull` fails, the script stops instead of running the next command on stale code.

`docker compose up --build -d` rebuilds the image and restarts the container in the background. The old container is replaced automatically.

The `curl http://169.254.169.254/latest/meta-data/public-ipv4` command reads the EC2 instance's public IP from the AWS metadata service. This special address (`169.254.169.254`) is only accessible from inside EC2 instances.

---

### Step 4: Add aws/ to .dockerignore

Updated:

`enterprise-ai-workspace/backend/.dockerignore`

Added `aws/` so the deployment scripts are not copied into the Docker image. The scripts are only needed on the host and EC2, not inside the running container.

---

### How to Deploy — Step-by-Step

#### Part A: AWS Console — Create RDS

1. Go to **AWS Console → RDS → Create database**
2. Choose **PostgreSQL**, engine version **16**
3. Template: **Free tier**
4. DB instance identifier: `enterprise-ai-workspace-db`
5. Master username: `postgres`
6. Master password: choose a strong password
7. DB name: `enterprise_ai_workspace`
8. **VPC**: keep the default VPC
9. **Public access**: No (only EC2 inside the same VPC can connect)
10. **Create database** — wait ~5 minutes
11. Copy the **Endpoint** from the RDS console (e.g. `enterprise-ai-workspace-db.xxxx.eu-west-1.rds.amazonaws.com`)

#### Part B: AWS Console — Create EC2

1. Go to **AWS Console → EC2 → Launch Instance**
2. Name: `enterprise-ai-workspace`
3. AMI: **Amazon Linux 2023**
4. Instance type: **t2.micro** (free tier)
5. Key pair: create a new one, download the `.pem` file, keep it safe
6. **Security group** — Add inbound rules:
   - Port **22** (SSH) — Source: **My IP** (your current IP only)
   - Port **8000** (Custom TCP) — Source: **0.0.0.0/0** (internet)
7. **Launch instance**

#### Part C: RDS Security Group — allow EC2 to connect

1. Go to **RDS → your database → Connectivity & security**
2. Click the VPC security group
3. Add inbound rule:
   - Port **5432** (PostgreSQL) — Source: **EC2 security group ID**
4. This means only your EC2 instance can reach the database — not the internet.

#### Part D: EC2 — Run setup script

```bash
# Copy setup script to EC2
scp -i your-key.pem aws/ec2-setup.sh ec2-user@<EC2_PUBLIC_IP>:~

# SSH into EC2
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Run setup
chmod +x ec2-setup.sh
./ec2-setup.sh

# Log out and back in (needed for docker group)
exit
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

#### Part E: EC2 — Clone project and configure

```bash
# Clone your project
git clone <your-github-repo-url> ~/enterprise-ai-workspace

cd ~/enterprise-ai-workspace/backend

# Create .env with production values
cp .env.example .env
nano .env
```

Update `.env` with:

```
DB_USER=postgres
DB_PASSWORD=<your RDS password>
DB_HOST=<your RDS endpoint>
DB_PORT=5432
DB_NAME=enterprise_ai_workspace
SECRET_KEY=<generate a strong random key>
```

#### Part F: EC2 — Deploy

```bash
chmod +x aws/deploy.sh
./aws/deploy.sh
```

#### Part G: Test

```
http://<EC2_PUBLIC_IP>:8000
http://<EC2_PUBLIC_IP>:8000/docs
```

---

### Security Groups Explained

| Resource | Port | Source | Why |
|----------|------|--------|-----|
| EC2 | 22 | Your IP | SSH access — only you can connect |
| EC2 | 8000 | 0.0.0.0/0 | The API must be reachable from the internet |
| RDS | 5432 | EC2 Security Group | Database must only be reachable from EC2, not the internet |

**Never expose your RDS port 5432 to 0.0.0.0/0.** This would put your database directly on the internet.

---

### What is an IAM User?

IAM (Identity and Access Management) controls who can access AWS services and what they can do.

When you sign up for AWS you get a root account. You should never use the root account for day-to-day tasks. Instead, create an IAM user with only the permissions needed.

For this project:
- The EC2 instance needs no special IAM role to access RDS — they communicate over the private VPC network.
- If you later add S3 for file storage, the EC2 instance needs an IAM role with S3 read/write permissions.

---

## Module 9 Goals Achieved
✅ Created `docker-compose.prod.yml` — backend-only production compose file
✅ Created `aws/ec2-setup.sh` — bootstraps a fresh Amazon Linux 2023 EC2 instance
✅ Created `aws/deploy.sh` — pulls latest code and restarts the container
✅ Added `aws/` to `.dockerignore`
✅ Documented full deployment steps: RDS creation, EC2 launch, security groups, SSH setup, deploy
✅ Learned: EC2, RDS, Security Groups, IAM basics, VPC networking, metadata service

---

## Interview Questions — Module 9

### What is EC2?
Sample answer:
EC2 (Elastic Compute Cloud) is AWS's virtual machine service. It lets you rent servers in the cloud and choose the operating system, CPU, RAM, and storage. You SSH into the instance, install software, and run applications just like a regular Linux machine.

### What is RDS?
Sample answer:
RDS (Relational Database Service) is a managed database service. AWS handles backups, patching, failover, and scaling. You choose the database engine — PostgreSQL in this project. You do not manage the operating system or database installation yourself.

### What is a Security Group?
Sample answer:
A Security Group is a cloud firewall that controls inbound and outbound traffic for an AWS resource. Each rule specifies a port, protocol, and source. For example, allowing port 8000 from 0.0.0.0/0 lets the internet reach the API, while allowing port 5432 only from the EC2 security group keeps the database private.

### Why should you never expose the RDS port to 0.0.0.0/0?
Sample answer:
PostgreSQL on port 5432 would be directly accessible from the internet. An attacker could attempt brute-force logins against the database. By allowing only the EC2 security group, only the application server can connect to the database.

### What is the difference between docker-compose.yml and docker-compose.prod.yml?
Sample answer:
`docker-compose.yml` is for local development — it runs both the backend and a local PostgreSQL container. `docker-compose.prod.yml` is for production on EC2 — it runs only the backend container. The database is provided by RDS and configured through environment variables in `.env`.

### What does `set -e` do in a bash script?
Sample answer:
`set -e` tells bash to exit immediately if any command returns a non-zero exit code (meaning it failed). Without it, the script would continue running even if a command failed, which could deploy broken code.

### What is the AWS metadata service?
Sample answer:
The metadata service at `169.254.169.254` is an HTTP endpoint accessible only from inside an EC2 instance. It provides information about the instance itself, such as its public IP address, region, instance type, and IAM role credentials. It requires no authentication from inside the instance.

---

## Module 8: Docker

Day 5: 25.06.2026

Step 1: Create the Dockerfile

Created:

`enterprise-ai-workspace/backend/Dockerfile`

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Learning:

**`FROM python:3.13-slim`**

This is the base image. Every Docker image starts from an existing image. `python:3.13-slim` gives us a minimal Linux system with Python 3.13 already installed, without unnecessary extras.

**`WORKDIR /app`**

Sets the working directory inside the container. All following commands run from `/app`. This is where the application code will live inside the container.

**`COPY requirements.txt .`** then **`RUN pip install --no-cache-dir -r requirements.txt`**

We copy `requirements.txt` first and install packages before copying the rest of the code. This is a Docker caching trick: if only your code changes (not your dependencies), Docker reuses the cached layer with installed packages and skips the slow `pip install` step.

**`COPY . .`**

Copies all remaining backend files into `/app` inside the container.

**`EXPOSE 8000`**

Documents that the container uses port 8000. It does not actually publish the port — that is handled in docker-compose.

**`CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`**

Starts the FastAPI server when the container runs. `--host 0.0.0.0` is required inside a container — without it, the server only listens on `localhost` inside the container and cannot be reached from outside.

---

Step 2: Create .dockerignore

Created:

`enterprise-ai-workspace/backend/.dockerignore`

```
venv/
__pycache__/
*.pyc
*.pyo
.env
uploads/
.git/
```

Learning:

`.dockerignore` works like `.gitignore` but for Docker. It tells Docker which files to exclude when it copies the project into the image.

- `venv/` — the virtual environment is not needed inside the container. Docker installs packages fresh using `requirements.txt`.
- `.env` — secrets must never be baked into a Docker image. The image could be shared or pushed to a registry. Environment variables are passed in at runtime via docker-compose.
- `uploads/` — uploaded files live on the host. A Docker volume mounts the folder into the container so files persist without being part of the image.
- `__pycache__/` — compiled Python bytecode is environment-specific and should not be shared across machines.

---

Step 3: Create docker-compose.yml

Created:

`enterprise-ai-workspace/backend/docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-enterprise_ai_workspace}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: .
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-enterprise_ai_workspace}
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
```

Learning:

**Two services**

Docker Compose defines multiple services (containers) that work together. Here we have `db` (PostgreSQL) and `backend` (FastAPI).

**`${DB_USER:-postgres}`**

Docker Compose reads values from the `.env` file automatically. The `:-postgres` part is a default — if `DB_USER` is not set, it falls back to `postgres`. The `.env` file is read by Docker Compose on the host; it is never copied into the image.

**`DB_HOST: db`**

This is the most important Docker networking concept. When containers run together in Docker Compose, each service is reachable by its service name. The backend connects to the database using `db` as the hostname instead of `localhost`. `localhost` inside the backend container refers to the backend container itself, not the database.

**`healthcheck`**

`pg_isready` checks whether PostgreSQL is ready to accept connections. This is different from `depends_on` alone — `depends_on` only waits for the container to start, not for PostgreSQL to actually be ready. Without a healthcheck, the backend can start before PostgreSQL is ready and crash on the first database connection.

**`condition: service_healthy`**

Tells Docker Compose to wait until the `db` service passes its healthcheck before starting the `backend` service.

**`volumes`**

Two types of volumes are used here:

- `postgres_data` — a named volume managed by Docker. PostgreSQL data is stored here so the database survives container restarts and rebuilds.
- `./uploads:/app/uploads` — a bind mount. The `uploads/` folder on your host machine is mounted into the container at `/app/uploads`. Files uploaded through the API are stored on the host, not inside the container.

**`restart: unless-stopped`**

The container automatically restarts if it crashes, unless you explicitly stop it. This is useful in a server environment.

---

Step 4: Create .env.example

Created:

`enterprise-ai-workspace/backend/.env.example`

```
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enterprise_ai_workspace
SECRET_KEY=your_secret_key_here
```

Learning:

`.env.example` is a template with fake placeholder values. It is safe to commit to GitHub. New developers clone the project, copy `.env.example` to `.env`, and fill in their real values. The real `.env` file stays in `.gitignore` and is never committed.

---

## How to run with Docker

```bash
# Build the images and start all services
docker compose up --build

# Stop all services
docker compose down

# Stop and delete the database volume (resets all data)
docker compose down -v
```

---

## Module 8 Goals Achieved
✅ Created `Dockerfile` — builds the FastAPI backend image
✅ Created `.dockerignore` — excludes venv, .env, uploads, and cache from the image
✅ Created `docker-compose.yml` — runs backend + PostgreSQL together
✅ Database healthcheck ensures backend waits for PostgreSQL to be ready
✅ Named volume keeps PostgreSQL data across restarts
✅ Bind mount keeps uploaded files on the host
✅ Created `.env.example` — safe placeholder template for new developers
✅ Learned: base images, layer caching, WORKDIR, --host 0.0.0.0, service names, volumes, healthchecks

---

## Interview Questions — Module 8

### What is Docker?
Sample answer:
Docker is a containerisation platform. It packages an application and all its dependencies into a container — a lightweight, isolated environment that runs the same way on any machine. It solves the "works on my machine" problem.

### What is the difference between a Docker image and a container?
Sample answer:
An image is a read-only template built from the Dockerfile. A container is a running instance of an image. You can run many containers from the same image.

### Why does the backend use `--host 0.0.0.0`?
Sample answer:
Inside a container, `localhost` refers to the container itself, not the host machine. `0.0.0.0` means "listen on all network interfaces", which allows traffic to reach the server from outside the container.

### Why does `DB_HOST` change from `localhost` to `db` in Docker?
Sample answer:
In Docker Compose, each service is reachable by its service name. The database service is named `db`, so the backend connects to it using `db` as the hostname. `localhost` inside the backend container refers to the backend container itself.

### What is the difference between a named volume and a bind mount?
Sample answer:
A named volume (`postgres_data`) is managed by Docker and stored in Docker's own storage area. It is good for databases because Docker controls its lifecycle. A bind mount (`./uploads:/app/uploads`) maps a specific folder on the host into the container. It is good for user-uploaded files because the files persist on the host and survive container rebuilds.

### Why copy `requirements.txt` and install packages before copying the rest of the code?
Sample answer:
Docker builds images in layers. If you copy the whole project first, any code change invalidates the layer that installs packages, forcing a slow `pip install` every time. Copying `requirements.txt` first means the package layer is only rebuilt when dependencies actually change, not on every code edit.

### What does a healthcheck do and why is it better than `depends_on` alone?
Sample answer:
`depends_on` only waits for the database container to start. PostgreSQL takes a few seconds to initialise after the container starts. The healthcheck runs `pg_isready` every 5 seconds and marks the service healthy only when PostgreSQL is accepting connections. `condition: service_healthy` makes the backend wait for that signal, preventing connection errors on startup.

---

## Module 7 Goals Achieved
✅ Added `uploaded_by` FK to `Document` — links documents to the user who uploaded them
✅ Updated upload endpoint to record the uploader's ID
✅ Added `WorkspaceSummary` schema for workspace-wide statistics
✅ Added `UserUploadStats` schema for per-user upload counts
✅ Built `GET /reports/summary` — total docs, users, teams, storage, and recent uploads
✅ Built `GET /reports/documents/by-user` — per-user document count using LEFT OUTER JOIN
✅ Both endpoints require login (JWT)
✅ Learned `func.count`, `func.sum`, LEFT OUTER JOIN, `.label()`, and `.scalar()` with SQLAlchemy

---

## Interview Questions — Module 7

### What is the difference between an INNER JOIN and a LEFT OUTER JOIN?
Sample answer:
An inner join returns only rows that have matching records in both tables. A left outer join returns all rows from the left table and fills in `NULL` for columns from the right table when there is no match. In this module, users with zero uploads still appear in the report because we use a left outer join.

### What does `func.count()` do in SQLAlchemy?
Sample answer:
`func.count()` calls the SQL `COUNT` aggregate function. It counts the number of rows or non-null values in a column. SQLAlchemy translates it into the correct SQL for whichever database you are using.

### What is `func.sum()` and why use `or 0` after `.scalar()`?
Sample answer:
`func.sum()` adds up all values in a column. When the table is empty, `SUM` returns `NULL` in SQL. SQLAlchemy's `.scalar()` returns `None` for `NULL`. The `or 0` converts `None` to a safe integer `0` so the API never returns `None` where a number is expected.

### Why was `uploaded_by` added as nullable?
Sample answer:
Existing rows in the database were created before the column existed. Making it nullable means those rows are still valid — they just have no uploader recorded. A strict `NOT NULL` column would require every existing row to have a value, which is not possible without a migration that backfills old data.

### What is Alembic and when would you use it?
Sample answer:
Alembic is a database migration tool for SQLAlchemy. It tracks changes to your models over time and generates migration scripts that safely alter existing tables. You would use it any time you add, rename, or remove a column in a live database instead of dropping and recreating tables.

---

## Module 6 Goals Achieved
✅ Added `Team` model with `ForeignKey` to `users`
✅ Added `TeamMember` model with role-based membership
✅ Added `TeamCreate`, `TeamOut`, `TeamMemberAdd`, `TeamMemberOut` schemas
✅ Built `POST /teams` — create team, owner auto-added as admin
✅ Built `GET /teams` — list teams the current user belongs to
✅ Built `GET /teams/{id}` — get team details (members only)
✅ Built `POST /teams/{id}/members` — add member (admins only)
✅ Built `DELETE /teams/{id}/members/{user_id}` — remove member (admins only, owner protected)
✅ Built `DELETE /teams/{id}` — delete team (owner only)
✅ All permission checks enforce 401, 403, and 404 correctly

---

## Interview Questions — Module 6

### What is a ForeignKey in SQLAlchemy?
Sample answer:
A ForeignKey links one table's column to the primary key of another table. It enforces that a value in the linking column must exist in the referenced table. For example, `owner_id` in `teams` must point to a real row in `users`.

### What is the difference between 401 and 403?
Sample answer:
`401 Unauthorized` means the request has no valid authentication — no token or an expired token. `403 Forbidden` means the user is authenticated but is not allowed to perform the action — for example, a regular member trying to delete another user.

### Why delete TeamMember rows before deleting a Team?
Sample answer:
The `team_members` table has a foreign key pointing to `teams`. If you delete the team first, the database raises a constraint error because child rows still reference it. You must remove the children first.

### What does `Literal["admin", "member"]` do?
Sample answer:
It restricts a field to exactly those two string values. Pydantic will reject any other value before the endpoint runs, so the database never receives an invalid role string.

### Why does `TeamOut` use `ConfigDict(from_attributes=True)`?
Sample answer:
Pydantic v2 cannot read values directly from a SQLAlchemy ORM object by default. `from_attributes=True` tells Pydantic to access attributes on the object rather than expecting a plain dictionary.

