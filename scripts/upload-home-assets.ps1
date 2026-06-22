param(
  [string]$HostName = "103.232.121.114",
  [string]$UserName = "root",
  [string]$Password = $env:PASSWORD_VPS,
  [string]$ContainerPrefix = "y4qlzjmugtn4i4ahuw6p3a6k",
  [string]$LocalAssetRoot = "public/assets"
)

$ErrorActionPreference = "Stop"

if (-not $Password) {
  throw "Missing VPS password. Set PASSWORD_VPS in the shell or pass -Password."
}

$assetRoot = Resolve-Path -LiteralPath $LocalAssetRoot
$files = @(
  "herobanner/herobanner1.png",
  "herobanner/herobanner2.png",
  "herobanner/herobanner3.png",
  "herobanner/herobanner4.png",
  "commercial-blocks/scanner.jpg",
  "commercial-blocks/printer.jpg",
  "commercial-blocks/office.jpg",
  "commercial-blocks/solution.jpg",
  "commercial-blocks/service.jpg"
)

$sec = ConvertTo-SecureString $Password -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($UserName, $sec)

Import-Module Posh-SSH
$session = New-SSHSession -ComputerName $HostName -Credential $cred -AcceptKey
$scpSession = New-SFTPSession -ComputerName $HostName -Credential $cred -AcceptKey

try {
  $container = (Invoke-SSHCommand -SSHSession $session -Command "docker ps --format '{{.Names}}' | grep '^$ContainerPrefix' | head -1").Output | Select-Object -First 1
  if (-not $container) {
    throw "Could not find running container with prefix '$ContainerPrefix'."
  }

  $remoteTmp = "/tmp/hpt-home-assets-$([guid]::NewGuid().ToString('N'))"
  Invoke-SSHCommand -SSHSession $session -Command "mkdir -p '$remoteTmp/herobanner' '$remoteTmp/commercial-blocks'" | Out-Null

  foreach ($relative in $files) {
    $localPath = Join-Path $assetRoot.Path $relative
    if (-not (Test-Path -LiteralPath $localPath)) {
      Write-Warning "Skip missing file: $relative"
      continue
    }

    $remoteDir = "$remoteTmp/$([IO.Path]::GetDirectoryName($relative).Replace('\', '/'))"
    Set-SFTPItem -SFTPSession $scpSession -Path $localPath -Destination $remoteDir -Force | Out-Null
    Write-Host "Uploaded $relative"
  }

  $copyCommand = "docker cp '$remoteTmp/.' '${container}:/app/public/assets/' && docker exec '$container' find /app/.next/cache/images -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true"
  Invoke-SSHCommand -SSHSession $session -Command $copyCommand | Out-Null
  Invoke-SSHCommand -SSHSession $session -Command "rm -rf '$remoteTmp'" | Out-Null

  Write-Host "Done. Assets copied into container: $container"
  Write-Host "Hard refresh the browser with Ctrl+Shift+R."
} finally {
  if ($scpSession) { Remove-SFTPSession -SFTPSession $scpSession | Out-Null }
  if ($session) { Remove-SSHSession -SSHSession $session | Out-Null }
}
