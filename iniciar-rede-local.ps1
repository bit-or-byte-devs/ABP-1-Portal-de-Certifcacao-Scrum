[CmdletBinding()]
param(
    [string]$LanIp
)

$ErrorActionPreference = 'Stop'

function Test-LanIPv4 {
    param([string]$Address)

    $parsed = $null
    if (-not [Net.IPAddress]::TryParse($Address, [ref]$parsed) -or
        $parsed.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork -or
        $parsed.ToString() -ne $Address) {
        return $false
    }

    $bytes = $parsed.GetAddressBytes()
    return $bytes[0] -gt 0 -and $bytes[0] -lt 224 -and $bytes[0] -ne 127 -and
        -not ($bytes[0] -eq 169 -and $bytes[1] -eq 254)
}

$addresses = @(Get-NetIPAddress -AddressFamily IPv4 -AddressState Preferred |
    Where-Object { Test-LanIPv4 $_.IPAddress })

if ($PSBoundParameters.ContainsKey('LanIp')) {
    if (-not (Test-LanIPv4 $LanIp) -or $LanIp -notin $addresses.IPAddress) {
        throw 'Informe em -LanIp um IPv4 válido atribuído a uma interface de rede deste computador.'
    }
} else {
    $adapterIndices = @(Get-NetAdapter -Physical | Where-Object Status -eq 'Up' |
        Select-Object -ExpandProperty ifIndex)
    $candidates = @($addresses | Where-Object { $_.InterfaceIndex -in $adapterIndices } |
        Select-Object -ExpandProperty IPAddress -Unique)
    if ($candidates.Count -eq 0) {
        throw 'Nenhum IPv4 de rede local encontrado. Conecte o computador à rede ou informe o endereço com -LanIp.'
    }
    if ($candidates.Count -gt 1) {
        throw ('Há vários IPv4 possíveis ({0}). Informe com -LanIp o endereço da rede usada pelo celular.' -f ($candidates -join ', '))
    }
    $LanIp = $candidates[0]
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker não encontrado. Instale e inicie o Docker Desktop com Docker Compose.'
}

$previousLanIp = $env:PORTAL_LAN_IP
$previousBaseUrl = $env:PUBLIC_BASE_URL
try {
    $env:PORTAL_LAN_IP = $LanIp
    $env:PUBLIC_BASE_URL = "http://${LanIp}:3000"
    $compose = Join-Path $PSScriptRoot 'docker-compose.yml'
    $lanOverride = Join-Path $PSScriptRoot 'docker-compose.lan.yml'
    docker compose -f $compose -f $lanOverride up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose falhou (código $LASTEXITCODE)."
    }
    Write-Output "Portal na rede local: $env:PUBLIC_BASE_URL/pages/index.html"
} finally {
    $env:PORTAL_LAN_IP = $previousLanIp
    $env:PUBLIC_BASE_URL = $previousBaseUrl
}
