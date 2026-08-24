[CmdletBinding(DefaultParameterSetName = 'InlineKey')]
param(
    [Parameter(Mandatory = $true)]
    [string]$MidUrl,

    [Parameter(Mandatory = $true, ParameterSetName = 'InlineKey')]
    [string]$ApiKey,

    [Parameter(Mandatory = $true, ParameterSetName = 'KeyFile')]
    [string]$ApiKeyFile,

    [ValidateSet('True', 'False')]
    [string]$AllowList = 'True',

    [ValidateSet('Default', 'SYSTEM', 'LOCALSERVICE')]
    [string]$ServiceAccount = 'Default'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$MsiName = 'agent-client-collector-6.1.0-windows-x64.msi'
$ExpectedMsiSha256 = 'E46BC617FF0C326A170D35BCCE29FC732E886B8B32B4765F46511A299AD8E90D'
$ExpectedProductCode = '{12D4F26D-0C4C-429F-ADD9-DFF78E8192EE}'
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$MsiPath = Join-Path $ScriptRoot $MsiName
$LogDirectory = Join-Path $env:ProgramData 'ServiceNow\ACC-Deployment-Logs'
$LogPath = Join-Path $LogDirectory 'ACC_Install.log'

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-ProductInstalled {
    param([Parameter(Mandatory = $true)][string]$ProductCode)

    $paths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$ProductCode",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$ProductCode"
    )
    return [bool]($paths | Where-Object { Test-Path -LiteralPath $_ })
}

if (-not (Test-IsAdministrator)) {
    throw 'Run this script as an administrator or in the MECM SYSTEM context.'
}

if (-not [Environment]::Is64BitOperatingSystem) {
    throw 'This package supports 64-bit Windows only.'
}

if (-not (Test-Path -LiteralPath $MsiPath -PathType Leaf)) {
    throw "MSI file not found: $MsiPath"
}

$actualHash = (Get-FileHash -LiteralPath $MsiPath -Algorithm SHA256).Hash
if ($actualHash -ne $ExpectedMsiSha256) {
    throw "MSI SHA-256 mismatch. Expected $ExpectedMsiSha256 but found $actualHash."
}

$signature = Get-AuthenticodeSignature -LiteralPath $MsiPath
if ($signature.Status -ne 'Valid' -or
    $null -eq $signature.SignerCertificate -or
    $signature.SignerCertificate.Subject -notmatch 'ServiceNow Inc\.') {
    throw "MSI signature validation failed. Status: $($signature.Status)"
}

$midEndpoints = $MidUrl.Split(',')
foreach ($endpoint in $midEndpoints) {
    if ($endpoint -notmatch '^wss://[^,\s]+/ws/events/?$' -or $endpoint -match '"') {
        throw "Invalid MID WebSocket URL: $endpoint"
    }
}

if ($PSCmdlet.ParameterSetName -eq 'KeyFile') {
    if (-not (Test-Path -LiteralPath $ApiKeyFile -PathType Leaf)) {
        throw "API key file not found: $ApiKeyFile"
    }
    $apiKeyValue = (Get-Content -LiteralPath $ApiKeyFile -Raw).Trim()
}
else {
    $apiKeyValue = $ApiKey.Trim()
}

if ([string]::IsNullOrWhiteSpace($apiKeyValue) -or $apiKeyValue -match '[\s"]') {
    throw 'The API key is empty or contains unsupported whitespace/quote characters.'
}

[IO.Directory]::CreateDirectory($LogDirectory) | Out-Null

$arguments = @(
    '/i',
    "`"$MsiPath`"",
    '/quiet',
    '/qn',
    '/norestart',
    "ACC_API_KEY=`"$apiKeyValue`"",
    "ACC_MID=`"$MidUrl`"",
    "ACC_ALLOW_LIST=$AllowList",
    'START_SERVICE=True',
    'MsiHiddenProperties=ACC_API_KEY',
    '/L*v',
    "`"$LogPath`""
)

switch ($ServiceAccount) {
    'SYSTEM' { $arguments += 'LOCALUSERNAME=SYSTEM' }
    'LOCALSERVICE' { $arguments += 'LOCALUSERNAME=LOCALSERVICE' }
    default { }
}

Write-Host 'Installing ServiceNow Agent Client Collector. The API key will not be printed.'
$process = Start-Process -FilePath "$env:SystemRoot\System32\msiexec.exe" `
    -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden

$apiKeyValue = $null
$ApiKey = $null

$acceptedExitCodes = @(0, 1641, 3010)
if ($process.ExitCode -notin $acceptedExitCodes) {
    Write-Error "ACC MSI installation failed with exit code $($process.ExitCode). Log: $LogPath"
    exit $process.ExitCode
}

if (-not (Test-ProductInstalled -ProductCode $ExpectedProductCode)) {
    Write-Error "ACC MSI returned success but product $ExpectedProductCode was not detected. Log: $LogPath"
    exit 1
}

$service = $null
for ($attempt = 1; $attempt -le 15; $attempt++) {
    $service = Get-Service -Name 'AgentClientCollector' -ErrorAction SilentlyContinue
    if ($null -ne $service -and $service.Status -eq 'Running') {
        break
    }
    Start-Sleep -Seconds 2
}

if ($process.ExitCode -eq 0 -and ($null -eq $service -or $service.Status -ne 'Running')) {
    Write-Error "ACC is installed but the AgentClientCollector service is not running. Log: $LogPath"
    exit 1
}

Write-Host "ACC installation completed. ProductCode: $ExpectedProductCode"
Write-Host "Installation log: $LogPath"
exit $process.ExitCode
