# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['app_runner.py'],
    pathex=[],
    binaries=[],
    datas=[('app', 'app'), ('frontend/build', 'frontend/build')],
    hiddenimports=['uvicorn.logging', 'uvicorn.loops', 'uvicorn.loops.auto', 'uvicorn.protocols', 'uvicorn.protocols.http', 'uvicorn.protocols.http.auto', 'uvicorn.lifespan', 'uvicorn.lifespan.on', 'aiosqlite', 'greenlet', 'sqlalchemy', 'sqlalchemy.ext.asyncio', 'sqlalchemy.ext.asyncio.engine', 'sqlalchemy.ext.asyncio.session', 'sqlalchemy.ext.declarative', 'sqlalchemy.dialects.sqlite', 'sqlalchemy.dialects.sqlite.aiosqlite', 'sqlalchemy.orm', 'sqlalchemy.pool', 'alembic', 'demucs', 'demucs.api', 'demucs.pretrained', 'demucs.separate', 'torch', 'torchaudio', 'soundfile', 'librosa', 'numpy', 'scipy', 'scipy.signal', 'julius', 'openunmix', 'app.api.audio', 'app.api.jobs', 'app.core.config', 'app.core.database', 'app.services.audio_processor', 'app.services.db_job_service', 'app.models.audio', 'app.models.db_models'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='StemSeparator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='StemSeparator',
)
