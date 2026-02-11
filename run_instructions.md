# Tug-of-War Math Game - Run Instructions

## Prerequisites
- Node.js (v18+)
- npm

## Setup & Run

### 1. Start the Backend Server
Open a terminal and run:
```bash
cd "/home/baragu/Documents/Tug of war/server"
npm install
node index.js
```
The server will start on port **3001**.

### 2. Start the Frontend Client
Open a new terminal and run:
```bash
cd "/home/baragu/Documents/Tug of war/client"
npm install
npm run dev
```
The client will start on **http://localhost:3000**.

## How to Play
1.  Open **http://localhost:3000** in your browser.
2.  Click **"PLAY NOW"**.
3.  Wait for an opponent.
    - If another player joins, you play instantly.
    - If no one joins within 5 seconds, an **AI Bot** will challenge you.
4.  Answer math questions as fast as you can!
    - Correct & Fast = Pull harder.
    - Wrong = No pull.
5.  First to pull the flag to their side wins!

## Troubleshooting
- If "Connection Error", ensure the server is running on port 3001.
- If styling looks off, ensure Tailwind CSS is built (happens automatically with `npm run dev`).
