#!/bin/bash

# Stem Separator Launch Script

echo "🎵 Starting Stem Separator..."
echo "=============================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Check if the executable exists
EXECUTABLE="$SCRIPT_DIR/dist/StemSeparator/StemSeparator"

if [ ! -f "$EXECUTABLE" ]; then
    echo "❌ Error: StemSeparator executable not found!"
    echo "Expected location: $EXECUTABLE"
    echo "Please make sure you have built the application first."
    exit 1
fi

echo "📁 Executable found: $EXECUTABLE"
echo "🚀 Launching Stem Separator..."
echo "🌐 The web interface will open in your browser automatically"
echo ""
echo "To stop the application, press Ctrl+C in this terminal"
echo "=============================="

# Launch the executable
"$EXECUTABLE" 