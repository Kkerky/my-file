[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProductCode = '{12D4F26D-0C4C-429F-ADD9-DFF78E8192EE}'
$LogDirectory = Join-Path $env:ProgramData 'ServiceNow\ACC-Deployment-Logs'
$LogPath = Join-Path $LogDirectory 'ACC_Uninstall.log'

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-ProductInstalled {
    param([Parameter(Mandatory = $true)][string]$Code)

    $paths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$Code",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$Code"
    )
    return [bool]($paths | Where-Object { Test-Path -LiteralPath $_ })
}

if (-not (Test-IsAdministrator)) {
    throw 'Run this script as an administrator or in the MECM SYSTEM context.'
}

if (-not (Test-ProductInstalled -Code $ProductCode)) {
    Write-Host 'ACC is already absent.'
    exit 0
}

[IO.Directory]::CreateDirectory($LogDirectory) | Out-Null
$arguments = @(
    '/x',
    $ProductCode,
    '/quiet',
    '/qn',
    '/norestart',
    '/L*v',
    "`"$LogPath`""
)

$process = Start-Process -FilePath "$env:SystemRoot\System32\msiexec.exe" `
    -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden

$acceptedExitCodes = @(0, 1605, 1641, 3010)
if ($process.ExitCode -notin $acceptedExitCodes) {
    Write-Error "ACC uninstall failed with exit code $($process.ExitCode). Log: $LogPath"
    exit $process.ExitCode
}

if ($process.ExitCode -eq 0 -and (Test-ProductInstalled -Code $ProductCode)) {
    Write-Error "ACC uninstall returned success but the product is still detected. Log: $LogPath"
    exit 1
}

Write-Host "ACC uninstall completed. Log: $LogPath"
exit $process.ExitCode
