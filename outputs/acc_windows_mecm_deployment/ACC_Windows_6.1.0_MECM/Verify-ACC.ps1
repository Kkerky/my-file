[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProductCode = '{12D4F26D-0C4C-429F-ADD9-DFF78E8192EE}'
$ExpectedVersion = [version]'6.1.0.2'
$ConfigPath = Join-Path $env:ProgramData 'ServiceNow\agent-client-collector\config\acc.yml'
$AccLogPath = Join-Path $env:ProgramData 'ServiceNow\agent-client-collector\log\acc.log'
$failed = $false

$registryPaths = @(
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$ProductCode",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$ProductCode"
)
$productPath = $registryPaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

Write-Host '=== ACC MSI ==='
if ($null -eq $productPath) {
    Write-Error "NG: ProductCode $ProductCode is not installed."
    $failed = $true
}
else {
    $product = Get-ItemProperty -LiteralPath $productPath
    Write-Host "OK: $($product.DisplayName) $($product.DisplayVersion)"
    if ([version]$product.DisplayVersion -lt $ExpectedVersion) {
        Write-Error "NG: Installed version is older than $ExpectedVersion."
        $failed = $true
    }
}

Write-Host '=== ACC service ==='
$service = Get-Service -Name 'AgentClientCollector' -ErrorAction SilentlyContinue
if ($null -eq $service) {
    Write-Error 'NG: AgentClientCollector service was not found.'
    $failed = $true
}
elseif ($service.Status -ne 'Running') {
    Write-Error "NG: AgentClientCollector service status is $($service.Status)."
    $failed = $true
}
else {
    Write-Host 'OK: AgentClientCollector service is Running.'
}

Write-Host '=== ACC configuration ==='
if (Test-Path -LiteralPath $ConfigPath) {
    Write-Host "OK: $ConfigPath"
    Get-Content -LiteralPath $ConfigPath |
        Where-Object { $_ -match '^backend-url:' -or $_ -match '^\s*-\s*"?wss://' -or $_ -match '^connect-without-mid:' } |
        ForEach-Object { Write-Host $_ }
}
else {
    Write-Error "NG: ACC configuration was not found: $ConfigPath"
    $failed = $true
}

Write-Host "ACC runtime log: $AccLogPath"
Write-Host 'Also confirm the agent connection and CI update on the ServiceNow instance.'

if ($failed) {
    exit 1
}
exit 0
