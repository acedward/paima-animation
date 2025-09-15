# Paima Blockchain Engine

A modular blockchain animation engine that demonstrates Paima Engine's multi-chain merging capabilities. The engine logic is separated from the UI, allowing it to run in both web browsers and Node.js environments.

## 🏗️ Architecture

The project is split into clean, modular components:

### Core Engine (`blockchain-engine.js`)
- **Platform agnostic**: Runs in both browser and Node.js
- **Pure logic**: No UI dependencies
- **Configurable**: Easy to modify blockchain parameters
- **Testable**: Full functionality available for testing

### Web UI (`index.html`)
- **Canvas rendering**: Handles only drawing and visual effects
- **Animation loop**: Manages frame updates and user interactions
- **Responsive design**: Modern UI with Paima Engine branding

### Node.js Testing (`test-engine.js`)
- **Headless simulation**: Test engine logic without browser
- **Performance monitoring**: Track block generation and merging
- **Statistics reporting**: Detailed analysis of blockchain behavior

## 🚀 Features

### Multi-Chain Support
- **Ethereum Chain**: 2-second fixed intervals
- **Paima Chain**: 2-second fixed intervals (merges data from other chains)
- **Solana Chain**: 3-second fixed intervals
- **Polygon Chain**: Variable probability-based timing (250ms - 2000ms)

### Visual Features
- **Block width proportional to timing**: Wider blocks = longer intervals
- **Color-coded merging**: Grey blocks turn colorful when merged by Paima
- **Smooth animations**: Blocks appear and move with scaling/opacity effects
- **Real-time statistics**: Shows active chains and merge counts

### Engine Capabilities
- **Merge detection**: Blocks ending within Paima boundaries get merged
- **Memory management**: Automatic cleanup of off-screen blocks
- **Configurable timing**: Easy to add new blockchain types
- **State tracking**: Complete blockchain state accessible for analysis

## 🌐 Running in Browser

1. **Open in browser**:
   ```bash
   # Simple way - just open the file
   open index.html
   
   # Or serve with a local server (recommended)
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

2. **Features in browser**:
   - Real-time animation with smooth 60fps rendering
   - Interactive canvas display
   - Visual merge detection with colorful blocks
   - Status bar showing chain activity

## 🖥️ Running in Node.js

1. **Install Node.js** (version 12 or higher)

2. **Run the test simulation**:
   ```bash
   node test-engine.js
   # or
   npm test
   ```

3. **What you'll see**:
   ```
   🚀 Testing Paima Blockchain Engine in Node.js
   
   📊 Initial state:
   - Blockchains configured: 4
   - Canvas width: 1000px
   - Merge groups: 0
   
   ⏱️  Starting simulation...
   
   [000] Paima Engine: | 0 active merges | Block width ∝ time
   [010] Paima Engine: Paima (2s), Ethereum (2s) | 2 active merges | Block width ∝ time
     └─ Paima Chain: 3 blocks
     └─ Ethereum Chain: 3 blocks
   ```

## 🔧 Configuration

### Adding New Blockchains
Edit the `blockchains` array in `blockchain-engine.js`:

```javascript
{
    name: 'My New Chain',
    color: () => '#ff6b6b',
    yPosition: chainStartY + chainSpacing * 4,
    timing: { type: 'fixed', interval: 1500 }, // 1.5 second blocks
    activateAfter: 0, // Start immediately
    counter: 0,
    blocks: [],
    lastBlockTime: 0
}
```

### Timing Types

**Fixed timing**:
```javascript
timing: { type: 'fixed', interval: 2000 } // Every 2 seconds
```

**Probability-based timing**:
```javascript
timing: { 
    type: 'probability', 
    possibleIntervals: [250, 500, 1000, 2000],
    currentCheckIndex: 0
}
```

### Visual Customization
- **Colors**: Modify `mergeColors` array for different merge colors
- **Dimensions**: Change `baseBlockWidth`, `blockHeight`, `blockSpacing`
- **Layout**: Adjust `chainStartY` and `chainSpacing` for vertical positioning

## 📊 Understanding the Merge Logic

The core merge rule is simple:
```
If blockEnd >= paimaLeft AND blockEnd <= paimaRight → MERGE
```

This means blocks are merged if their **ending position** falls within the Paima block's boundaries, representing how Paima Engine captures and processes blockchain data that "completes" within its processing window.

## 🧪 Testing & Development

### Run Tests
```bash
npm test
```

### Key Test Scenarios
- **Block generation**: Verify timing intervals work correctly
- **Merge detection**: Ensure proper color assignment
- **Memory management**: Confirm blocks are cleaned up
- **Performance**: Monitor with different block generation rates

### Debugging
Enable console logging by modifying the engine's merge detection function to add debug output.

## 🎯 Use Cases

### Educational
- Demonstrate blockchain concepts
- Visualize multi-chain architectures
- Show consensus and merge mechanisms

### Development
- Test blockchain timing logic
- Prototype new chain integrations
- Performance analysis of merge algorithms

### Presentation
- Live demos of Paima Engine capabilities
- Interactive blockchain visualizations
- Technical presentations with real-time animation

## 📦 File Structure

```
├── blockchain-engine.js   # Core engine logic (universal)
├── index.html            # Web UI and canvas renderer
├── test-engine.js        # Node.js testing and simulation
├── package.json          # Node.js project configuration
└── README.md            # This documentation
```

## 🚀 Future Enhancements

- **Network simulation**: Add latency and connection effects
- **Transaction visualization**: Show individual transactions within blocks
- **Performance metrics**: Real-time performance monitoring
- **Export capabilities**: Save animation data or screenshots
- **Interactive controls**: Pause, speed up, slow down animations

---

**Built for Paima Engine** - Demonstrating multi-chain blockchain merging and data processing capabilities. 