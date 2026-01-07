# Task Tracker (Auth-Based Todo App)

A simple task-tracking web application that allows users to manage their daily tasks with create, update, and delete functionality. Each user has a private task list secured through authentication.

## Features
- User signup and login (username-based)
- JWT authentication
- Add, update, and delete tasks
- Per-user task storage
- Secure password hashing
- Clean and responsive UI

## Tech Stack
Frontend:
- HTML
- CSS
- Vanilla JavaScript

Backend:
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT (JSON Web Tokens)
- bcrypt

## Project Structure
backend/
- server.js
- package.json
- package-lock.json

frontend/
- index.html
- styles.css
- script.js

## Setup Instructions

1. Clone the repository
git clone https://github.com/durgeshkhushlani/Task-Tracker.git
cd Task-Tracker

2. Backend setup
cd backend
npm install

Create a .env file in the backend folder:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

Start the backend server:
node server.js

3. Frontend setup
cd frontend
npx serve

Open the provided localhost URL in your browser.

## How It Works
- Users must log in to manage tasks. (Yet to add 'Guest Mode'
- JWT token is stored in localStorage
- All task routes are protected
- Tasks are accessible only to their respective users

## Notes
- node_modules and .env are intentionally excluded
- This project is created for learning and educational purposes. 

## Author
Durgesh Khushlani
