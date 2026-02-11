const AIPlayer = require('./AIPlayer');

class Matchmaker {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.queue = []; // Array of { socket, joinTime }
        this.checkInterval = setInterval(() => this.processQueue(), 1000);
    }

    addPlayer(socket) {
        // Check if player already in queue
        if (this.queue.find(p => p.socket.id === socket.id)) return;

        console.log(`Player ${socket.id} joined queue`);
        this.queue.push({
            socket,
            joinTime: Date.now()
        });

        // Try to match immediately
        this.processQueue();
    }

    removePlayer(socketId) {
        this.queue = this.queue.filter(p => p.socket.id !== socketId);
    }

    processQueue() {
        // 1. Match Real Players
        while (this.queue.length >= 2) {
            const player1 = this.queue.shift();
            const player2 = this.queue.shift();

            console.log(`Matching ${player1.socket.id} with ${player2.socket.id}`);
            this.createMatch(player1.socket, player2.socket);
        }

        // 2. Check for AI Fallback
        const now = Date.now();
        for (let i = this.queue.length - 1; i >= 0; i--) {
            const item = this.queue[i];
            if (now - item.joinTime > 5000) {
                // 5 seconds elapsed, match with AI
                this.queue.splice(i, 1);
                const aiOpponent = new AIPlayer('AI_' + Math.random().toString(36).substr(2, 5));

                console.log(`Matching ${item.socket.id} with AI`);
                this.createMatch(item.socket, aiOpponent);
            }
        }
    }

    createMatch(p1, p2) {
        // p1 is always a real socket from queue
        // p2 can be a socket or AIPlayer instance

        // Construct player objects expected by Game
        const player1Obj = { id: p1.id, isAI: false };
        const player2Obj = p2.isAI ? p2 : { id: p2.id, isAI: false };

        this.gameManager.createGame(player1Obj, player2Obj);
    }
}

module.exports = Matchmaker;
