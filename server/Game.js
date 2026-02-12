const AIPlayer = require('./AIPlayer');

class Game {
    constructor(io, roomId, player1, player2) {
        this.io = io;
        this.roomId = roomId;
        this.players = {
            [player1.id]: player1,
            [player2.id]: player2,
        };
        this.playerIds = [player1.id, player2.id];

        // Game State
        this.ropePosition = 0; // -100 to 100
        this.isRunning = false;
        this.currentQuestion = null;
        this.questionTimer = null;
        this.aiTimer = null;

        // Config
        this.maxRope = 100;
        this.questionDuration = 10000; // 10 seconds per question

        // Bind methods
        this.handleAnswer = this.handleAnswer.bind(this);
    }

    start() {
        this.isRunning = true;
        this.io.to(this.roomId).emit('game_start', {
            players: this.playerIds,
            ropePosition: this.ropePosition
        });

        setTimeout(() => this.nextQuestion(), 1000); // 1s delay before first q
    }

    nextQuestion() {
        if (!this.isRunning) return;

        // Generate Question — ensure answer is always non-negative
        let a = Math.floor(Math.random() * 10) + 1; // 1-10
        let b = Math.floor(Math.random() * 10) + 1; // 1-10
        const isAddition = Math.random() > 0.5;

        // For subtraction, make sure a >= b so answer is positive
        if (!isAddition && a < b) {
            const temp = a;
            a = b;
            b = temp;
        }

        const questionText = isAddition ? `${a} + ${b}` : `${a} - ${b}`;
        const correctAnswer = isAddition ? a + b : a - b;

        this.currentQuestion = {
            text: questionText,
            answer: correctAnswer,
            startTime: Date.now()
        };

        this.io.to(this.roomId).emit('new_question', {
            question: questionText,
            duration: this.questionDuration
        });

        // Start Timer for next question
        clearTimeout(this.questionTimer);
        clearTimeout(this.aiTimer); // Clear any pending AI moves from previous question!

        this.questionTimer = setTimeout(() => {
            this.nextQuestion();
        }, this.questionDuration + 2000); // Wait full duration + 2s pause

        // Handle AI if present
        this.checkAI();
    }

    checkAI() {
        Object.values(this.players).forEach(player => {
            if (player.isAI) {
                const decision = player.makeDecision();

                // Schedule AI answer
                if (decision.delay < this.questionDuration) {
                    this.aiTimer = setTimeout(() => {
                        if (this.isRunning && this.currentQuestion) {
                            // Calculate remaining time for force
                            const now = Date.now();
                            const timeElapsed = decision.delay; // Approximate
                            // In reality, we should use the actual time relative to start
                            // But for simulation, let's just pretend it answered now

                            const answer = decision.isCorrect ? this.currentQuestion.answer : this.currentQuestion.answer + 1;
                            this.handleAnswer(player.id, answer);
                        }
                    }, decision.delay);
                }
            }
        });
    }

    handleAnswer(playerId, answer) {
        if (!this.isRunning || !this.currentQuestion) return;

        // Check if correct
        const isCorrect = parseInt(answer) === this.currentQuestion.answer;

        // Broadcast answer to everyone (so opponent can see)
        this.io.to(this.roomId).emit('player_answer', {
            playerId,
            isCorrect,
            value: answer
        });

        if (isCorrect) {
            const now = Date.now();
            const timeTaken = now - this.currentQuestion.startTime;
            const remainingTime = Math.max(0, this.questionDuration - timeTaken);

            // Force calculation: remaining time / total time (0.0 to 1.0)
            const force = (remainingTime / this.questionDuration) * 15; // Increased from 10 to 15 for faster games

            const direction = (playerId === this.playerIds[0]) ? 1 : -1;

            this.ropePosition += force * direction;

            // Clamp
            if (this.ropePosition > this.maxRope) this.ropePosition = this.maxRope;
            if (this.ropePosition < -this.maxRope) this.ropePosition = -this.maxRope;

            // Emit update to everyone
            this.io.to(this.roomId).emit('rope_update', {
                ropePosition: this.ropePosition,
                playerId,
                force
            });

            // Emit specific feedback to the player who answered
            const socket = this.io.sockets.sockets.get(playerId);
            if (socket) {
                socket.emit('answer_result', {
                    correct: true,
                    force: parseFloat(force.toFixed(1))
                });
            }

            this.checkWin();

            // IMMEDIATELY go to next question on correct answer!
            if (this.isRunning) {
                this.nextQuestion();
            }
        } else {
            // Emit failure feedback
            const socket = this.io.sockets.sockets.get(playerId);
            if (socket) {
                socket.emit('answer_result', {
                    correct: false
                });
            }
        }
    }

    checkWin() {
        if (this.ropePosition >= 100) {
            this.endGame(this.playerIds[0]);
        } else if (this.ropePosition <= -100) {
            this.endGame(this.playerIds[1]);
        }
    }

    endGame(winnerId) {
        this.isRunning = false;
        clearTimeout(this.questionTimer);
        clearTimeout(this.aiTimer);

        this.io.to(this.roomId).emit('game_over', {
            winnerId,
            ropePosition: this.ropePosition
        });
    }

    cleanup() {
        this.isRunning = false;
        clearTimeout(this.questionTimer);
        clearTimeout(this.aiTimer);
    }
}

module.exports = Game;
