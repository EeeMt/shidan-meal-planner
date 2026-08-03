<#
  启动食单本地服务并打开浏览器。
  自动查找系统 Node，找不到时使用 Codex 自带运行时。
  PowerShell 运行：.\serve.ps1
#>
$ErrorActionPreference = 'Stop'
$port = 8765

$node = $null
$cmd = Get-Command node -ErrorAction SilentlyContinue
if ($cmd) { $node = $cmd.Source }
if (-not $node) {
  $candidates = @(
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
    "C:\Program Files\nodejs\node.exe",
    "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  )
  foreach ($c in $candidates) { if (Test-Path $c) { $node = $c; break } }
}

if (-not $node) {
  Write-Host "未找到 Node.js，请先安装 Node.js，或直接双击 index.html 使用（离线功能不可用）。" -ForegroundColor Yellow
  Start-Process (Join-Path $PSScriptRoot 'index.html')
  exit 0
}

$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "端口 $port 已在监听，直接打开浏览器。"
} else {
  Start-Process -FilePath $node -ArgumentList @((Join-Path $PSScriptRoot 'server.js'), $port) -WindowStyle Hidden
  Start-Sleep -Seconds 1
}

Start-Process "http://localhost:$port"
Write-Host "食单已启动：http://localhost:$port"
