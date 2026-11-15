# Downloads the CDN dependencies once so the site never needs the internet for its UI.
# Run from repo root: powershell -File vendor\download-vendor.ps1
$ErrorActionPreference = 'Stop'
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
New-Item -ItemType Directory -Force -Path "$PSScriptRoot\fonts", "$PSScriptRoot\webfonts" | Out-Null

# 1. Tailwind (pinned 3.4.16, same JIT script the CDN served)
Invoke-WebRequest -Uri 'https://cdn.tailwindcss.com/3.4.16' -UserAgent $UA -OutFile "$PSScriptRoot\tailwind.js"

# 2. supabase-js UMD (exact version the pages reference)
Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js' -UserAgent $UA -OutFile "$PSScriptRoot\supabase.js"

# 3. Font Awesome 6.4.0 + its webfont files (CSS paths rewritten to sit in vendor/)
Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' -UserAgent $UA -OutFile "$PSScriptRoot\fontawesome.css"
$faCss = (Get-Content "$PSScriptRoot\fontawesome.css" -Raw).Replace('../webfonts/','webfonts/')
Set-Content -Path "$PSScriptRoot\fontawesome.css" -Value $faCss -Encoding UTF8 -NoNewline
[regex]::Matches($faCss, 'url\((?:["'']?)(\.\./webfonts/[^)"'']+)') | ForEach-Object {
  $rel = $_.Groups[1].Value
  $file = Split-Path $rel -Leaf
  if (-not (Test-Path "$PSScriptRoot\webfonts\$file")) {
    Invoke-WebRequest -Uri ("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/$file") -UserAgent $UA -OutFile "$PSScriptRoot\webfonts\$file"
  }
}

# 4. Google Fonts: fetch the css2 stylesheet, then every woff2 it references
$cssUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap'
$css = Invoke-WebRequest -Uri $cssUrl -UserAgent $UA
$cssText = $css.Content
$urls = ([regex]::Matches($cssText, 'https://fonts\.gstatic\.com/[^)]+\.woff2') | ForEach-Object { $_.Value } | Sort-Object -Unique)
$n = 0
foreach ($u in $urls) {
  $n++
  $file = 'f{0}.woff2' -f $n
  if (-not (Test-Path "$PSScriptRoot\fonts\$file")) {
    Invoke-WebRequest -Uri $u -UserAgent $UA -OutFile "$PSScriptRoot\fonts\$file"
  }
  $cssText = $cssText.Replace($u, "fonts/$file")
}
Set-Content -Path "$PSScriptRoot\fonts.css" -Value $cssText -Encoding UTF8

Write-Host 'done'
Get-ChildItem $PSScriptRoot -Recurse -File | Where-Object Name -ne 'download-vendor.ps1' | ForEach-Object { '{0,8:N0} KB  {1}' -f ($_.Length/1KB), $_.FullName.Substring($PSScriptRoot.Length+1) }
