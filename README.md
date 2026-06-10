# RepoCore

A Git-inspired Distributed Version Control & Cloud Repository Platform built with Node.js, Express.js, MongoDB, React.js, AWS S3, and a custom CLI.

RepoCore enables developers to create repositories, manage commits, push/pull code, clone repositories, track issues, collaborate through a cloud-based workflow, and interact through both a modern web interface and a custom terminal CLI.

---

## Features

### Repository Management
- Create public and private repositories
- Repository description and metadata management
- Repository visibility controls
- Repository deletion and updates
- Repository starring system

### Version Control
- Initialize repositories locally
- Stage files using CLI
- Create commits with commit messages
- Push commits to cloud storage
- Pull latest repository state
- Clone repositories from cloud
- View complete commit history
- Commit timeline tracking
- Commit deletion support

### Cloud Storage
- AWS S3 based file storage
- Folder structure preservation
- File metadata tracking
- Secure file retrieval
- Repository file browser

### CLI Support
- Global CLI installation via npm
- Repository initialization
- Login authentication
- Remote repository configuration
- Push/Pull operations
- Clone repositories
- Repository status tracking
- Remote information lookup
- Interactive workflow guide

### Issue Tracking
- Create issues
- Update issues
- Close/Reopen issues
- Delete issues
- Repository-level issue management

### Social Features
- Follow users
- Followers/Following system
- User profiles
- Repository stars

### Security
- JWT Authentication
- Protected API Routes
- XSS Protection
- Rate Limiting
- Repository Ownership Validation
- Access Control for Private Repositories
- Secure File Access Validation

### User Experience
- Syntax Highlighted Code Viewer
- File Tree Explorer
- Repository Statistics
- Commit Explorer
- Responsive UI


---

# Tech Stack

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- AWS S3
- Express Rate Limit
- Helmet
- Morgan

## CLI

- Node.js
- Yargs
- Axios


---

# Environment Variables

Create a `.env` file inside backend.

```env
PORT=3002

MONGODB_URI=your_mongodb_connection

JWT_SECRET=your_jwt_secret

AWS_ACCESS_KEY_ID=your_access_key

AWS_SECRET_ACCESS_KEY=your_secret_key

AWS_REGION=your_region

AWS_BUCKET_NAME=your_bucket_name

FRONTEND_URL=http://localhost:5173
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/kunjpatel177/RepoCore-Backend.git

cd repocore/backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

or

```bash
node server.js start
```


# CLI Workflow

## Install RepoCore CLI

```bash
npm install -g repocore-cli
```

## CLI Guide

```bash
repocore guide
```

## Login

```bash
repocore login your_email your_password
```

## Initialize Repository

```bash
repocore init
```

## Add a Single File or a Single Folder

```bash
repocore add file_name
```

or 

```bash
repocore add folder_name
```

## Add all Files

```bash
repocore add .
```

## Create Commit

```bash
repocore commit "Initial Commit"
```

## Connect Remote Repository

```bash
repocore remote repocore://username/repository
```

## Push

```bash
repocore push
```

## Pull

```bash
repocore pull
```

## Pull using commit hash

```bash
repocore pull commit_hash
```

## Clone

```bash
repocore clone repocore://username/repository
```

## Check Status

```bash
repocore status
```

## Remote Information

```bash
repocore remote-info
```

---

# CLI Code

GitHub Link: https://github.com/kunjpatel177/RepoCore-CLI.git



# Deployment

Frontend deployed using: Render Static Site
Backend: Render Web Service
Database: MongoDB Atlas
Storage: AWS S3


---

# Author

**Kunj Patel**

GitHub: https://github.com/kunjpatel177

Website Link: https://repocore-p0nu.onrender.com/