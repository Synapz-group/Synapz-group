# Run from evidence-bus. Environment values come from your secret manager, never from this file.
param([Parameter(Mandatory=$true)][string]$StructuredManifest, [switch]$DryRun)
$ErrorActionPreference = 'Stop'
$emitterArgs = @('python/emitter.py', $StructuredManifest, '--create', '--output', 'manifest.json', '--send')
if ($DryRun) { $emitterArgs += '--dry-run' }
python @emitterArgs
if ($LASTEXITCODE -ne 0) { throw 'Evidence emitter failed' }
