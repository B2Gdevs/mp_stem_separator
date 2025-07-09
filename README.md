# Stem Separator Web App

A fast, modern web application for separating audio tracks into individual stems (vocals, drums, bass, and other instruments) using state-of-the-art AI models.

## Overview

This project creates an executable web application that allows users to:
- Upload audio files through a web interface
- Separate tracks into individual stems using Demucs
- Download separated stems individually or as a bundle
- Process multiple files efficiently

## Architecture

The application consists of three main components:

1. **Backend**: FastAPI server that handles audio processing using Demucs
2. **Frontend**: React-based UI for easy file upload and management
3. **Executable**: Packaged application that users can run without installation

## Current Status

✅ **Phase 1: Demucs Integration** (Complete)
- Successfully integrated Demucs 4.0.1
- Tested with example track
- Outputs high-quality separated stems (vocals, drums, bass, other)

✅ **Phase 2: FastAPI Backend** (Complete)
- Created REST API endpoints for file upload
- Implemented async processing with background tasks
- Added job tracking and progress monitoring
- Created download endpoints for individual stems
- Full API documentation available at `/docs`

📋 **Phase 3: React Frontend** (Planned)
- Build modern, responsive UI
- Drag-and-drop file upload
- Real-time progress indicators
- Audio preview players

📦 **Phase 4: Executable Packaging** (Planned)
- Package as standalone executable
- Cross-platform support (Windows, macOS, Linux)
- Auto-update functionality

## Installation (Development)

### Prerequisites
- Python 3.11 (Python 3.13 is not yet supported by PyTorch)
- Git

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd stem_separator
```

2. Create and activate virtual environment:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Command Line (Current)

Separate an audio file:
```bash
source venv/bin/activate
python -m demucs path/to/your/audio.wav
```

Output files will be saved to `separated/htdemucs/<track_name>/`:
- `vocals.wav` - Isolated vocals
- `drums.wav` - Isolated drums
- `bass.wav` - Isolated bass
- `other.wav` - Other instruments

### Web App (Coming Soon)

```bash
# Start the FastAPI server
uvicorn app.main:app --reload

# Navigate to http://localhost:8000
```

## Technical Details

### Audio Processing
- **Engine**: Demucs 4.0.1 (Hybrid Transformer model)
- **Supported Formats**: WAV, MP3, FLAC, OGG, and more
- **Processing Time**: ~0.5x realtime on modern hardware
- **Quality**: State-of-the-art separation quality

### API Design (Planned)
- RESTful API with FastAPI
- WebSocket support for real-time progress
- Async processing with job queue
- Rate limiting and authentication

### Frontend Stack (Planned)
- React 18+ with TypeScript
- Tailwind CSS for styling
- Audio visualization with Web Audio API
- Progressive Web App capabilities

## Project Structure

```
stem_separator/
├── venv/              # Virtual environment
├── example_tracks/    # Sample audio files
├── separated/         # Output directory for stems
├── app/              # FastAPI application (coming)
│   ├── main.py
│   ├── api/
│   ├── core/
│   └── services/
├── frontend/         # React application (coming)
│   ├── src/
│   ├── public/
│   └── package.json
├── requirements.txt  # Python dependencies
├── .gitignore
└── README.md
```

## Development Roadmap

- [x] Set up Python environment with best practices
- [x] Integrate Demucs for audio separation
- [x] Test with example tracks
- [ ] Create FastAPI backend structure
- [ ] Implement file upload endpoint
- [ ] Add async processing with progress tracking
- [ ] Create download endpoints for stems
- [ ] Build React frontend
- [ ] Implement drag-and-drop upload
- [ ] Add audio preview functionality
- [ ] Package as executable
- [ ] Add auto-update system
- [ ] Create installer for different platforms

## Contributing

This project is in active development. Contributions are welcome!

## License

[To be determined]

## Acknowledgments

- [Demucs](https://github.com/facebookresearch/demucs) by Facebook Research for the amazing audio separation technology 