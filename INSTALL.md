# Stem Separator - Installation & Usage Guide

## What is Stem Separator?

Stem Separator is a standalone application that uses AI to separate audio tracks into individual components (stems):
- **Vocals** - Isolated vocal track
- **Drums** - Isolated drum track  
- **Bass** - Isolated bass track
- **Other** - Other instruments (guitars, keyboards, etc.)

## System Requirements

- **macOS**: 10.13 or later (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for the app + space for audio files
- **Audio Files**: Supports WAV, MP3, FLAC, OGG, M4A formats up to 500MB

## Installation

1. **Download** the Stem Separator application
2. **Extract** the files to your desired location (e.g., Applications folder)
3. **Double-click** the `StemSeparator` executable to launch

## First Run

When you first run the application:

1. The app will start automatically
2. Your web browser will open to `http://localhost:8000`
3. You'll see the Stem Separator interface

## How to Use

### Basic Usage

1. **Upload Audio**: 
   - Drag and drop an audio file onto the upload area, OR
   - Click "Choose File" to select an audio file

2. **Processing**: 
   - The file will be uploaded and processing will begin automatically
   - You'll see a progress indicator showing the separation status
   - Processing typically takes 0.5-1x the length of your audio file

3. **Download Results**:
   - Once complete, you'll see links to download each stem
   - Click individual stem names to download them
   - Files are saved as high-quality WAV files

### Theme Customization

- Click the **palette icon** in the top-right corner
- Choose from 5 built-in themes:
  - Default (light)
  - Dark
  - Blue
  - Purple  
  - Green
- Your theme preference is saved automatically

### Supported Audio Formats

- **Input**: WAV, MP3, FLAC, OGG, M4A, AAC
- **Output**: WAV (44.1kHz, 16-bit stereo)
- **Max File Size**: 500MB

## Troubleshooting

### App Won't Start
- Make sure you have sufficient RAM (4GB minimum)
- Try running from Terminal to see error messages: `./StemSeparator`
- Check that port 8000 isn't being used by another application

### Browser Doesn't Open
- Manually navigate to `http://localhost:8000` in your browser
- Try refreshing the page if it doesn't load immediately

### Processing Fails
- Ensure your audio file is in a supported format
- Check that the file isn't corrupted
- Verify you have enough free disk space (at least 2x the audio file size)

### Performance Issues
- Close other applications to free up RAM
- For large files, processing may take longer - be patient
- GPU acceleration is used automatically if available

## Privacy & Security

- **Local Processing**: All audio processing happens on your computer
- **No Cloud**: Your audio files never leave your device
- **No Internet Required**: Works completely offline after download
- **Automatic Cleanup**: Temporary files are cleaned up after processing

## Tips for Best Results

- **High Quality Input**: Use uncompressed or high-bitrate files for best results
- **Avoid Heavily Processed Audio**: Simple mixes separate better than heavily produced tracks
- **Stereo Files**: Mono files work but stereo provides better separation
- **Length**: Any length works, but very long files (>20 minutes) take more time and memory

## Technical Details

- **AI Model**: Uses Demucs Hybrid Transformer v4
- **Processing**: Utilizes PyTorch with GPU acceleration when available
- **Architecture**: FastAPI backend with React frontend
- **Port**: Runs on localhost:8000

## Uninstalling

To remove Stem Separator:
1. Quit the application
2. Delete the `StemSeparator` folder
3. Clear browser cache if desired

## Support

For issues or questions:
- Check this documentation first
- Ensure you meet the system requirements
- Try restarting the application

---

**Version**: 1.0  
**Last Updated**: January 2025 