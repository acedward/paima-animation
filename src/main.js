import { CanvasRenderer } from './components/CanvasRenderer.js';

// Initialize and start the animation
const renderer = new CanvasRenderer('animationCanvas');
renderer.start();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    renderer.stop();
});
