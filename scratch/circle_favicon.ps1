Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "public/logo.png"
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$srcImg = [System.Drawing.Image]::FromStream($ms)

$w = $srcImg.Width
$h = $srcImg.Height
$dim = [Math]::Min($w, $h)

Write-Host "Image size: ${w}x${h}"

$bmp = New-Object System.Drawing.Bitmap($dim, $dim, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $dim, $dim)
$g.SetClip($path)

$srcX = [int](($w - $dim) / 2)
$srcY = [int](($h - $dim) / 2)
$rect = New-Object System.Drawing.Rectangle(0, 0, $dim, $dim)

$g.DrawImage($srcImg, $rect, $srcX, $srcY, $dim, $dim, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$srcImg.Dispose()
$ms.Dispose()

# Save out to public/logo.png and public/icon.png
$outPath = [System.IO.Path]::GetFullPath("public/logo.png")
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$iconPath = [System.IO.Path]::GetFullPath("public/icon.png")
$bmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()

Write-Host "SUCCESS: Created circular logo.png and icon.png!"
