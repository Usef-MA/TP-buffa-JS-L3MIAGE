// Gestion centralisée des inputs - BONNE PRATIQUE
export default class InputManager {
    constructor() {
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseClicked = false;
        
        this.setupListeners();
    }

    setupListeners() {
        // Écouteurs centralisés - une seule fois au démarrage
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Empêcher le scroll avec espace
            if (e.key === ' ' || e.key === 'ArrowUp') {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        window.addEventListener('mousedown', (e) => {
            this.mouseClicked = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouseClicked = false;
        });

        window.addEventListener('mousemove', (e) => {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        // Touch pour mobile
        window.addEventListener('touchstart', (e) => {
            this.keys[' '] = true; // Simule espace
            e.preventDefault();
        });

        window.addEventListener('touchend', (e) => {
            this.keys[' '] = false;
        });
    }

    isKeyPressed(key) {
        return this.keys[key] === true;
    }

    resetClick() {
        this.mouseClicked = false;
    }
}