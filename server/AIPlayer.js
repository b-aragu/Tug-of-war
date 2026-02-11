class AIPlayer {
    constructor(id, skillLevel = 0.7) {
        this.id = id;
        this.isAI = true;
        this.skillLevel = skillLevel; // Accuracy 0.0 - 1.0
    }

    /**
     * Decides on the answer for the current question.
     * @returns {Object} { delay: number, isCorrect: boolean }
     */
    makeDecision() {
        // Reaction time: Random between 1s (1000ms) and 4s (4000ms)
        const delay = 1000 + Math.random() * 3000;

        // Accuracy check
        const isCorrect = Math.random() < this.skillLevel;

        return {
            delay,
            isCorrect
        };
    }
}

module.exports = AIPlayer;
