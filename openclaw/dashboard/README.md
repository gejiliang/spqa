# SPQA Dashboard MVP

A single-page React application serving as the command center for SPQA — an AI-Native organizational architecture with a Roman Republic theme.

## Features

- **Curia (指挥中心)** - Command center overview with real-time agent status, active tasks, and cost tracking
- **Senatus (元老院)** - Deliberation management with phase tracking (Cogitatio → Contentio → Consensus → Decretum)
- **Castra (军营)** - Task management for legion and mercenary tasks with cost allocation
- **Tabularium (档案馆)** - Archive search and historical record browser
- **Configuratio (配置)** - System settings, configuration viewer, and agent management

## Quick Start

### Option 1: Simple HTTP Server (Recommended for MVP)

```bash
cd /sessions/wizardly-festive-bohr/mnt/SPQA/openclaw/dashboard

# Python 3
python3 -m http.server 5173

# Then open browser to http://localhost:5173
```

### Option 2: Using npm (if you prefer)

```bash
cd /sessions/wizardly-festive-bohr/mnt/SPQA/openclaw/dashboard

npm install
npm run dev
```

## Tech Stack

- **Framework**: React 18.2.0 (via CDN)
- **Styling**: Tailwind CSS (via CDN) with custom Roman theme
- **JSX**: Babel Standalone for client-side transformation
- **Build**: Static HTML — no build step required for MVP
- **API**: Fetch API with fallback to mock data

## Architecture

### Single-Page Application (index.html)

All components are bundled in a single `index.html` file for MVP simplicity:

1. **Tailwind CSS** via CDN for styling
2. **React & ReactDOM** via ES module imports
3. **Babel Standalone** for JSX transformation
4. **All components** in a single `<script type="text/babel">` block

### Component Structure

```
index.html
├── App (main container with sidebar + content)
├── Curia (dashboard overview)
├── Senatus (deliberation management)
├── Castra (task management)
├── Tabularium (archives)
└── Configuratio (settings)
```

### API Integration

The dashboard connects to the Engine API Server at `http://localhost:3000/api`:

- Mock data is provided in all pages for MVP
- Graceful fallback when API is unavailable
- Real-time updates via WebSocket (prepared, not active in MVP)

## Design System

### Color Palette (Roman Dark Theme)

- **Background**: `#1a1a2e` (Deep navy-black)
- **Surface**: `#16213e` (Dark blue)
- **Light Surface**: `#0f3460` (Lighter blue)
- **Text**: `#e0e0e0` (Light gray)
- **Secondary Text**: `#a0a0a0` (Medium gray)
- **Accent Red**: `#8B0000` (Roman red)
- **Accent Gold**: `#DAA520` (Roman gold)

### Component Classes

- `.roman-card` - Main content card with gradient and hover effects
- `.roman-btn` - Primary action button
- `.phase-bar` - Progress visualization for deliberation phases
- `.task-level` - Level badges (L0-L3)
- `.status-indicator` - Online/offline status dots
- `.sidebar-nav-item` - Navigation menu items with active state

## File Structure

```
dashboard/
├── index.html              # Main entry point with all components
├── package.json            # NPM configuration
├── README.md              # This file
├── src/
│   ├── api.js             # API client (prepared, not used in MVP)
│   ├── app.jsx            # App component (reference)
│   ├── pages/
│   │   ├── Curia.jsx      # Command center
│   │   ├── Senatus.jsx    # Senate/Deliberations
│   │   ├── Castra.jsx     # Task management
│   │   ├── Tabularium.jsx # Archives
│   │   └── Configuratio.jsx # Settings
│   └── components/
│       ├── AgentCard.jsx  # Reusable agent status card
│       └── TaskCard.jsx   # Reusable task card
```

## Key Features by Page

### Curia (指挥中心)

- Real-time agent status (Consul, Annalist, Curator)
- Active task progress tracking
- Cost summary (today/month)
- Quick action buttons for new deliberations and tasks
- Recent deliberations timeline

### Senatus (元老院)

- Create new deliberation with topic and senator selection
- 4-phase progress visualization
- Senatus Consultum (decree) display
- List of active and completed deliberations

### Castra (军营)

- Filter tasks by type (legion/mercenary) and status
- Task cards with level badges (L0-L3)
- Cost tracking per task
- Quick stats: total tasks, mercenary count, cost total

### Tabularium (档案馆)

- Full-text search across records
- Filter by type (decision, task completion, deliberation, policy)
- Sort by date or title
- Click to view full entry details

### Configuratio (配置)

- SPQA configuration viewer/editor
- OpenClaw configuration display
- Agent role enable/disable toggles
- Theme color preview and component showcase

## Mock Data

All pages include realistic mock data that demonstrates:

- Multiple agents with different statuses
- Tasks at various completion levels
- Deliberations at different phases
- Archive entries with timestamps
- Configuration sections

## Extending the Dashboard

### Adding a New Page

1. Create a new component function in the main script
2. Add it to the `pages` array in the App component
3. Update the `renderPage()` switch statement
4. The sidebar will automatically show the new page

### Connecting to Real API

1. Update `api.js` with actual endpoints
2. Replace mock data in each page with `useEffect` + API calls
3. Add error handling and loading states

### Styling Customization

- Edit color values in the Tailwind config script tag
- Modify `.roman-card`, `.roman-btn` CSS in the `<style>` section
- All styles are inline or in the style tag — no external CSS files

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ support required
- No IE11 support (uses ES modules)

## Performance Notes

- Single HTML file (~50KB) — very fast load time
- React 18 via CDN — no build/compile step
- CSS-in-JS prevents style conflicts
- Mock data is lightweight and loads instantly

## Future Enhancements (Post-MVP)

- Real API connection and WebSocket updates
- Component library extraction (separate .jsx files)
- Build process with Vite for optimization
- Authentication and user sessions
- Dark/light theme toggle
- Responsive design for mobile
- Advanced analytics dashboard
- Real-time collaboration features

## License

MIT

## Author

SPQA Team
