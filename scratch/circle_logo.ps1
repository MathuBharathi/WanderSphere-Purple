Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "scratch/temp_logo.png").Path
Write-Host "Loading image from: $srcPath"

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$w = $srcImg.Width
$h = $srcImg.Height
$dim = [Math]::Min($w, $h)
Write-Host "Loaded successfully. Dimensions: ${w}x${h}"

# Create circular bitmap with Argb transparent background
$bmp = New-Object System.Drawing.Bitmap($dim, $dim, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Create circular clip path
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $dim, $dim)
$g.SetClip($path)

$srcX = [int](($w - $dim) / 2)
$srcY = [int](($h - $dim) / 2)
$rect = New-Object System.Drawing.Rectangle(0, 0, $dim, $dim)

$g.DrawImage($srcImg, $rect, $srcX, $srcY, $dim, $dim, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$srcImg.Dispose()

# Save circular image to public/logo.png and public/icon.png
$outLogo = Join-Path (Get-Location) "public/logo.png"
$outIcon = Join-Path (Get-Location) "public/icon.png"

$bmp.Save($outLogo, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($outIcon, [System.Drawing.Imaging.ImageFormat]::Png)

# Create 64x64 icon thumbnail
$smallBmp = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gSmall = [System.Drawing.Graphics]::FromImage($smallBmp)
$gSmall.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gSmall.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gSmall.DrawImage($bmp, 0, 0, 64, 64)
$gSmall.Dispose()

$outFavicon = Join-Path (Get-Location) "public/favicon.ico"
$smallBmp.Save($outFavicon, [System.Drawing.Imaging.ImageFormat]::Png)

$smallBmp.Dispose()
$bmp.Dispose()

Write-Host "CROP COMPLETE! Created circular public/logo.png, public/icon.png, and public/favicon.ico"
