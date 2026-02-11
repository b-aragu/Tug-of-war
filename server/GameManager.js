const Game = require('./Game');
// const { v4: uuidv4 } = require('uuid'); // We might need to install uuid, or just use Math.random

class GameManager {
    constructor(io) {
        this.io = io;
        this.games = new Map(); // roomId -> Game instance
        this.playerGameMap = new Map(); // socketId -> roomId
    }

    createGame(player1, player2) {
        const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
        const game = new Game(this.io, roomId, player1, player2);

        this.games.set(roomId, game);
        this.playerGameMap.set(player1.id, roomId);
        this.playerGameMap.set(player2.id, roomId);

        // Join socket.io room
        if (!player1.isAI) {
            const socket1 = this.io.sockets.sockets.get(player1.id);
            if (socket1) socket1.join(roomId);
        }

        if (!player2.isAI) {
            const socket2 = this.io.sockets.sockets.get(player2.id);
            if (socket2) socket2.join(roomId);
        }

        game.start();
        return roomId;
    }

    getGameByPlayerId(playerId) {
        const roomId = this.playerGameMap.get(playerId);
        if (!roomId) return null;
        return this.games.get(roomId);
    }

    endGame(roomId) {
        const game = this.games.get(roomId);
        if (game) {
            game.cleanup();
            game.playerIds.forEach(pid => this.playerGameMap.delete(pid));
            this.games.delete(roomId);
        }
    }
}

module.exports = GameManager;
