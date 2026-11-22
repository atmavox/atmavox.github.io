# Gera os ícones PNG do PWA a partir da logo "Forma de onda" (mesmas medidas do public/favicon.svg).
# Roda no Windows (usa System.Drawing): powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1
# Rode de novo só se a logo ou as cores mudarem; os PNGs gerados vão para o repositório.

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\public\icons'
New-Item -ItemType Directory -Force $outDir | Out-Null

# Cores do tema claro "Areia" (src/shared/theme/theme.css: --bg, --logo, --logo-center).
$background = [System.Drawing.ColorTranslator]::FromHtml('#ebe2d4')
$side = [System.Drawing.ColorTranslator]::FromHtml('#8a6319')
$center = [System.Drawing.ColorTranslator]::FromHtml('#a5600f')

# Barras no viewBox 64: x e meia-altura em torno de y 32, traço 6 com ponta redonda.
$bars = @(@(12, 5), @(22, 13), @(32, 23), @(42, 13), @(52, 5))

function New-Icon([int]$size, [double]$logoFraction, [string]$name) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear($background)

  # A logo ocupa `logoFraction` do ícone, centralizada.
  $scale = ($size * $logoFraction) / 64
  $offset = ($size - 64 * $scale) / 2

  for ($i = 0; $i -lt $bars.Count; $i++) {
    $x = $bars[$i][0]; $h = $bars[$i][1]
    $color = if ($i -eq 2) { $center } else { $side }
    $pen = New-Object System.Drawing.Pen $color, (6 * $scale)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $px = [single]($offset + $x * $scale)
    $graphics.DrawLine($pen, $px, [single]($offset + (32 - $h) * $scale), $px, [single]($offset + (32 + $h) * $scale))
    $pen.Dispose()
  }

  $bitmap.Save((Join-Path $outDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose(); $bitmap.Dispose()
}

# "any": logo grande no quadrado. "maskable": logo menor, dentro da zona segura (círculo de 80%) que o
# Android recorta em formatos diferentes. apple-touch-icon: o iPhone arredonda os cantos sozinho.
New-Icon 192 0.78 'icon-192.png'
New-Icon 512 0.78 'icon-512.png'
New-Icon 512 0.56 'icon-maskable-512.png'
New-Icon 180 0.72 'apple-touch-icon.png'
