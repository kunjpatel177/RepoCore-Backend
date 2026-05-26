
---

# BACKEND README.md

```md id="l8g5sx"
# RepoCore Backend

RepoCore Backend powers a Git-inspired distributed version control platform with cloud-based repository hosting, authentication, commit management, issue tracking, and CLI integration.

The backend exposes REST APIs used by both the web frontend and RepoCore CLI.

---

# Features

## Authentication & Security
- JWT authentication
- Protected API routes
- Role-based repository access
- Secure password hashing
- Input sanitization
- Rate limiting
- Helmet security middleware

## Repository Management
- Create/update/delete repositories
- Public & private repositories
- Repository ownership validation
- Repository starring system

## Commit Management
- Push/pull commit APIs
- Commit history management
- Commit deletion
- Latest commit tracking
- Commit file metadata management

## File Storage
- AWS S3 cloud storage integration
- Secure file upload/download APIs
- Repository file versioning

## Issue Tracking
- Create/edit/delete issues
- Open/close issue workflow
- Repository issue management

## Collaboration
- Followers & following system
- User profile management
- Real-time communication using Socket.IO

## RepoCore CLI Support
- Login authentication
- Remote repository configuration
- Clone repositories
- Push & pull synchronization
- Global authentication support

---

# Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- AWS S3
- Socket.IO
- Express Rate Limit
- Helmet
- Morgan

---

# Installation

## Clone Repository

```bash
git clone https://github.com/kunjpatel177/RepoCore-Backend.git