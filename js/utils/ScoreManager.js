// Gestion des scores et high scores - localStorage
export default class ScoreManager {
    constructor() {
        this.currentScore = 0;
        this.highScore = this.loadHighScore();
    }

    loadHighScore() {
        const saved = localStorage.getItem('marocRunnerHighScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            localStorage.setItem('marocRunnerHighScore', this.highScore);
            return true; // Nouveau record !
        }
        return false;
    }

    reset() {
        this.currentScore = 0;
    }

    addPoints(points) {
        this.currentScore += points;
    }

    getCurrentScore() {
        return this.currentScore;
    }

    getHighScore() {
        return this.highScore;
    }
}