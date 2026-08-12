# ============================================================
# CONTROLESCOLAR50 -- Aplicar Sprint 0.1, 0.2, 0.3 automaticamente
# ============================================================
# Uso:
#   1. Abre PowerShell en Cursor (terminal integrada)
#   2. Ajusta $root abajo si tu proyecto NO esta en C:\Proyectos\CONTROLESCOLAR50
#   3. Ejecuta:  .\aplicar-sprint-0.ps1
#
# Que hace:
#   Sprint 0.1 -> renombra 'caracter' a 'caracteristicas.ts' y corrige imports
#   Sprint 0.2 -> hace que 'npm run build' empaquete el React (no el legacy)
#   Sprint 0.3 -> conecta los feature flags de verdad (CARACTERISTICAS_ACTIVAS)
#
# Es seguro correrlo mas de una vez: si un cambio ya esta aplicado, lo detecta
# y lo salta en vez de duplicarlo o romperlo.
# ============================================================

$ErrorActionPreference = "Stop"
$root = "C:\Proyectos\CONTROLESCOLAR50"   # <-- ajusta esta ruta si es necesario

if (-not (Test-Path $root)) {
    Write-Host "ERROR: no se encontro la carpeta $root" -ForegroundColor Red
    Write-Host "Edita la variable root al inicio del script con la ruta correcta." -ForegroundColor Yellow
    exit 1
}

Set-Location $root
Write-Host "Trabajando en: $root" -ForegroundColor Cyan
Write-Host ""

$huboError = $false

# ------------------------------------------------------------
# SPRINT 0.1a -- Renombrar el archivo corrupto
# ------------------------------------------------------------
$oldFile = Join-Path $root "src\interfaz\router\caracter"
$newFile = Join-Path $root "src\interfaz\router\caracteristicas.ts"

if (Test-Path $newFile) {
    Write-Host "[0.1a] OK (ya aplicado): caracteristicas.ts ya existe" -ForegroundColor Green
} elseif (Test-Path $oldFile) {
    Rename-Item -Path $oldFile -NewName "caracteristicas.ts"
    Write-Host "[0.1a] HECHO: 'caracter' renombrado a 'caracteristicas.ts'" -ForegroundColor Green
} else {
    Write-Host "[0.1a] AVISO: no se encontro ni 'caracter' ni 'caracteristicas.ts'. Revisa manualmente src\interfaz\router\" -ForegroundColor Yellow
    $huboError = $true
}

# ------------------------------------------------------------
# SPRINT 0.1b + 0.3 -- Corregir router.tsx
# ------------------------------------------------------------
$routerPath = Join-Path $root "src\interfaz\router\router.tsx"

if (Test-Path $routerPath) {
    $content = Get-Content -Raw -Path $routerPath -Encoding UTF8
    $original = $content

    $content = $content.Replace(
        "import { CARACTERISTICAS, Caracteristica } from './caracter" + [char]0xED + "sticas'",
        "import { CARACTERISTICAS_ACTIVAS, Caracteristica } from './caracteristicas'"
    )
    $content = $content.Replace(
        "import { CARACTERISTICAS, Caracteristica } from './caracteristicas'",
        "import { CARACTERISTICAS_ACTIVAS, Caracteristica } from './caracteristicas'"
    )
    $content = $content.Replace(
        "caracteristicas = CARACTERISTICAS }: RouterProps",
        "caracteristicas = CARACTERISTICAS_ACTIVAS }: RouterProps"
    )
    $content = $content.Replace(
        "export { CARACTERISTICAS } from './caracter" + [char]0xED + "sticas'",
        "export { CARACTERISTICAS, CARACTERISTICAS_ACTIVAS } from './caracteristicas'"
    )
    $content = $content.Replace(
        "export { CARACTERISTICAS } from './caracteristicas'",
        "export { CARACTERISTICAS, CARACTERISTICAS_ACTIVAS } from './caracteristicas'"
    )
    $content = $content.Replace(
        "export type { Caracteristica } from './caracter" + [char]0xED + "sticas'",
        "export type { Caracteristica } from './caracteristicas'"
    )

    if ($content -ne $original) {
        Set-Content -Path $routerPath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "[0.1b/0.3] HECHO: router.tsx actualizado" -ForegroundColor Green
    } else {
        Write-Host "[0.1b/0.3] OK (ya aplicado o no coincide el texto esperado en router.tsx)" -ForegroundColor Green
    }
} else {
    Write-Host "[0.1b/0.3] ERROR: no se encontro router.tsx" -ForegroundColor Red
    $huboError = $true
}

# ------------------------------------------------------------
# SPRINT 0.1c + 0.3 -- Corregir src/interfaz/index.ts
# ------------------------------------------------------------
$indexPath = Join-Path $root "src\interfaz\index.ts"

if (Test-Path $indexPath) {
    $content = Get-Content -Raw -Path $indexPath -Encoding UTF8
    $original = $content

    $content = $content.Replace(
        "export { Router, CARACTERISTICAS } from './router/router'",
        "export { Router, CARACTERISTICAS, CARACTERISTICAS_ACTIVAS } from './router/router'"
    )
    $content = $content.Replace(
        "export type { Caracteristica } from './router/caracter" + [char]0xED + "sticas'",
        "export type { Caracteristica } from './router/caracteristicas'"
    )

    if ($content -ne $original) {
        Set-Content -Path $indexPath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "[0.1c/0.3] HECHO: src/interfaz/index.ts actualizado" -ForegroundColor Green
    } else {
        Write-Host "[0.1c/0.3] OK (ya aplicado o no coincide el texto esperado en index.ts)" -ForegroundColor Green
    }
} else {
    Write-Host "[0.1c/0.3] ERROR: no se encontro src/interfaz/index.ts" -ForegroundColor Red
    $huboError = $true
}

# ------------------------------------------------------------
# SPRINT 0.2 -- vite.config.ts
# ------------------------------------------------------------
$vitePath = Join-Path $root "vite.config.ts"

if (Test-Path $vitePath) {
    $content = Get-Content -Raw -Path $vitePath -Encoding UTF8

    if ($content -match "rollupOptions") {
        Write-Host "[0.2] OK (ya aplicado): rollupOptions ya esta en vite.config.ts" -ForegroundColor Green
    } else {
        $original = $content
        $content = $content.Replace(
            "emptyOutDir: true",
            "emptyOutDir: true,`r`n    rollupOptions: {`r`n      input: 'index-react.html'`r`n    }"
        )
        if ($content -ne $original) {
            Set-Content -Path $vitePath -Value $content -Encoding UTF8 -NoNewline
            Write-Host "[0.2] HECHO: vite.config.ts actualizado con rollupOptions.input" -ForegroundColor Green
        } else {
            Write-Host "[0.2] AVISO: no se encontro el texto esperado en vite.config.ts, revisa manualmente" -ForegroundColor Yellow
            $huboError = $true
        }
    }
} else {
    Write-Host "[0.2] ERROR: no se encontro vite.config.ts" -ForegroundColor Red
    $huboError = $true
}

# ------------------------------------------------------------
# SPRINT 0.2b -- package.json (script dev opcional)
# ------------------------------------------------------------
$pkgPath = Join-Path $root "package.json"

if (Test-Path $pkgPath) {
    $content = Get-Content -Raw -Path $pkgPath -Encoding UTF8
    $original = $content

    $content = $content.Replace(
        '"dev": "vite",',
        '"dev": "vite --open /index-react.html",'
    )

    if ($content -ne $original) {
        Set-Content -Path $pkgPath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "[0.2b] HECHO: package.json actualizado (dev abre index-react.html)" -ForegroundColor Green
    } else {
        Write-Host "[0.2b] OK (ya aplicado o no coincide el texto esperado en package.json)" -ForegroundColor Green
    }
} else {
    Write-Host "[0.2b] ERROR: no se encontro package.json" -ForegroundColor Red
    $huboError = $true
}

# ------------------------------------------------------------
# VERIFICACION FINAL
# ------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Corriendo 'npm run build' para verificar..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "BUILD EXITOSO. Revisa arriba que diga varios 'modules transformed'" -ForegroundColor Green
    Write-Host "(no solo 2, eso confirmaria que sigue empaquetando el legacy)." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "El build fallo. Copia el error de arriba y compartelo para revisarlo." -ForegroundColor Red
    $huboError = $true
}

Write-Host ""
if ($huboError) {
    Write-Host "Hubo al menos un aviso/error arriba, revisalo antes de continuar." -ForegroundColor Yellow
} else {
    Write-Host "Todo aplicado sin problemas. Corre 'npm run dev' para verlo en el navegador." -ForegroundColor Green
}
