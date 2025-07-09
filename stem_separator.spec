# -*- mode: python ; coding: utf-8 -*-
import sys
from pathlib import Path

# Get the project root
project_root = Path(__file__).parent

a = Analysis(
    ['app_runner.py'],
    pathex=[str(project_root)],
    binaries=[],
    datas=[
        # Include the app package
        ('app', 'app'),
        # Include any example tracks (optional)
        ('example_tracks', 'example_tracks'),
    ],
    hiddenimports=[
        # FastAPI and dependencies
        'fastapi',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvloop',
        'httptools',
        'websockets',
        'watchfiles',
        
        # Demucs and audio processing
        'demucs',
        'demucs.pretrained',
        'demucs.separate',
        'demucs.apply',
        'demucs.audio',
        'demucs.model',
        'demucs.utils',
        'julius',
        'openunmix',
        'torchaudio',
        'torchaudio.transforms',
        'torchaudio.functional',
        'soundfile',
        'librosa',
        
        # PyTorch
        'torch',
        'torch.nn',
        'torch.nn.functional',
        'torch.utils',
        'torch.utils.data',
        
        # Other dependencies
        'numpy',
        'scipy',
        'sklearn',
        'yaml',
        'omegaconf',
        'hydra',
        'einops',
        'dora_search',
        'submitit',
        'treetable',
        'retrying',
        'lameenc',
        
        # Pydantic
        'pydantic',
        'pydantic_core',
        'pydantic.dataclasses',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib',
        'pandas',
        'notebook',
        'jupyterlab',
        'ipython',
        'pytest',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='StemSeparator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # Don't use UPX compression for compatibility
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Show console for server output
    disable_windowed_traceback=False,
    argv_emulation=True if sys.platform == 'darwin' else False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico' if sys.platform == 'win32' else None,
) 