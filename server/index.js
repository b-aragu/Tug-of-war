const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const GameManager = require('./GameManager');
const Matchmaker = require('./Matchmaker');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for MVP
        methods: ["GET", "POST"]
    }
});

const gameManager = new GameManager(io);
const matchmaker = new Matchmaker(gameManager);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_game', () => {
        matchmaker.addPlayer(socket);
    });

    socket.on('submit_answer', (answer) => {
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            game.handleAnswer(socket.id, answer);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        matchmaker.removePlayer(socket.id);
        // Handle game disconnection (optional for MVP - maybe auto-win for other?)
        const game = gameManager.getGameByPlayerId(socket.id);
        if (game) {
            io.to(game.roomId).emit('opponent_disconnected');
            gameManager.endGame(game.roomId);
        }
    });

    // Basic implementation of rematch - just re-join queue
    socket.on('rematch', () => {
        matchmaker.addPlayer(socket);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
