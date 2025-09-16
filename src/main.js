/**
 * @file main.js
 * @description The entry point for the blockchain animation.
 * 
 * This file initializes and starts the entire animation by creating an instance
 * of the `CanvasRenderer` and calling its `start` method. It also includes a
 * cleanup mechanism to stop the animation when the page is unloaded, preventing
 * unnecessary resource consumption.
 */
import { CanvasRenderer } from './components/CanvasRenderer.js';

// Initialize and start the animation
const renderer = new CanvasRenderer('animationCanvas');
renderer.start();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    renderer.stop();
});
