Param(
[string[]]$IncludeExtensions = @('.js','.jsx'),
[string[]]$ExcludeDirs = @('node_modules','.git','dist','.vite','build','out'),
[switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Is-Excluded {
param(
[string]$Path,
[string[]]$Dirs
)
foreach ($d in $Dirs) {
# Checa tanto separadores Windows () quanto POSIX (/)
if ($Path -like "$d*" -or $Path -like "/$d/*") { return $true }
}
return $false
}

function Repair-Mojibake {
param([byte[]]$Bytes)

$latin1 = [System.Text.Encoding]::GetEncoding(28591)
$utf8 = [System.Text.Encoding]::UTF8

Interpreta os bytes como Latin-1; se detectar mojibake, reinterpreta corretamente
$textLatin1 = $latin1.GetString($Bytes)
if ($textLatin1 -match 'Ã|Â| |ǜ|ǭ') {
$reEncoded = $latin1.GetBytes($textLatin1) # volta para bytes Latin-1
$fixedText = $utf8.GetString($reEncoded) # lê em UTF-8 corretamente
return $fixedText
} else {
# Caso não haja sinais de mojibake, lê como UTF-8 normal
return $utf8.GetString($Bytes)
}
}

$root = Get-Location
$files = @()

foreach ($pat in $IncludeExtensions) {
$candidates = Get-ChildItem -Recurse -File -Include $pat
foreach ($f in $candidates) {
if (-not (Is-Excluded -Path $f.FullName -Dirs $ExcludeDirs)) {
$files += $f
}
}
}

$backupDir = Join-Path $root '.encoding-backup'
if (-not $DryRun) {
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$changed = 0
foreach ($f in $files) {
$bytes = [System.IO.File]::ReadAllBytes($f.FullName)
$fixed = Repair-Mojibake -Bytes $bytes

Normaliza EOL para LF
$fixed = $fixed -replace "rn","`n"

$origUtf8 = [System.Text.Encoding]::UTF8.GetString($bytes)

if ($fixed -ne $origUtf8) {
if ($DryRun) {
Write-Host "[DRY] Would fix: $($f.FullName)"
} else {
# Faz backup com estrutura de diretórios
$rel = $f.FullName.Substring($root.Path.Length).TrimStart('','/')
$dest = Join-Path $backupDir ($rel.Replace(':','_'))
$destDir = [System.IO.Path]::GetDirectoryName($dest)
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

  Copy-Item $f.FullName $dest -Force
  [System.IO.File]::WriteAllText($f.FullName, $fixed, [System.Text.Encoding]::UTF8)
  Write-Host "UTF-8 fixed: $($f.FullName)"
  $changed++
}
}
}

if ($DryRun) {
Write-Host "Arquivos potencialmente afetados (DRY-RUN): $changed"
} else {
Write-Host "Arquivos corrigidos: $changed"
Write-Host "Backup criado em: $backupDir"
}