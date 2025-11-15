# Save this as tree.ps1
# Run with: powershell -ExecutionPolicy Bypass -File .\tree.ps1

# Global counters
$script:totalFolders = 0
$script:excludedFolders = 0
$script:totalFiles = 0
$script:startTime = Get-Date
$script:fileTypes = @{}
$script:totalSize = 0

function Get-FolderInfo {
    param(
        [string]$Path,
        [ref]$FileCount,
        [ref]$FolderSize
    )
    try {
        $items = Get-ChildItem -Path $Path -Force -ErrorAction Stop
        foreach ($item in $items) {
            if ($item.PSIsContainer) {
                $subCount = 0
                $subSize = 0
                Get-FolderInfo -Path $item.FullName -FileCount ([ref]$subCount) -FolderSize ([ref]$subSize) | Out-Null
                $FileCount.Value += $subCount
                $FolderSize.Value += $subSize
            } else {
                $FileCount.Value++
                $FolderSize.Value += $item.Length
                $ext = [System.IO.Path]::GetExtension($item.Name)
                if (-not $ext) { $ext = "No Extension" }
                if ($script:fileTypes.ContainsKey($ext)) {
                    $script:fileTypes[$ext]++
                } else {
                    $script:fileTypes[$ext] = 1
                }
                $script:totalSize += $item.Length
            }
        }
    } catch {
        # Ignore errors
    }
}

function Get-FolderTree {
    param(
        [string]$Path = ".",
        [string]$Indent = "",
        [int]$MaxDepth = 5,
        [int]$CurrentDepth = 0,
        [System.Text.StringBuilder]$Output,
        [System.Text.StringBuilder]$HtmlOutput
    )

    $excluded = @('node_modules', '.git', '.next', 'dist', 'build', 'out', 
                 '.venv', 'venv', '__pycache__', '.vscode', '.github', '.idea',
                 'coverage', '.cache', '.DS_Store')
    
    try {
        $items = Get-ChildItem -Path $Path -Directory -ErrorAction Stop | 
                 Where-Object { 
                     if ($excluded -contains $_.Name) {
                         $script:excludedFolders++
                         return $false
                     }
                     $script:totalFolders++
                     return $true
                 } |
                 Sort-Object Name

        $itemCount = $items.Count
        $i = 0
        foreach ($item in $items) {
            $i++
            $isLast = $i -eq $itemCount
            
            # Get folder info
            $fileCount = 0
            $folderSize = 0
            Get-FolderInfo -Path $item.FullName -FileCount ([ref]$fileCount) -FolderSize ([ref]$folderSize)
            
            $sizeMB = "{0:N2} MB" -f ($folderSize / 1MB)
            $lastModified = (Get-Item $item.FullName).LastWriteTime.ToString("yyyy-MM-dd HH:mm")
            
            # Format for text output
            if ($isLast) {
                $connector = "\--"
                $newIndent = "   "
            } else {
                $connector = "+--"
                $newIndent = "|  "
            }
            
            $line = "$Indent$connector $($item.Name)/".PadRight(50) + 
                   "[$fileCount files, $sizeMB]".PadLeft(25) + "  " + 
                   "($lastModified)"
            $null = $Output.AppendLine($line)
            
            # Format for HTML output
            $htmlLine = [System.Text.StringBuilder]::new()
            $null = $htmlLine.Append("<div class='folder'><span class='name'>")
            $null = $htmlLine.Append($item.Name)
            $null = $htmlLine.Append("/</span> <span class='details'>")
            $null = $htmlLine.Append("$fileCount files, $sizeMB</span> <span class='date'>")
            $htmlLine.Append("$lastModified</span></div>") | Out-Null
            $null = $HtmlOutput.AppendLine($htmlLine.ToString())

            # Recursively process subfolders
            if ($CurrentDepth -lt $MaxDepth) {
                $htmlIndent = " " * ($CurrentDepth * 20)
                $null = $HtmlOutput.AppendLine("<div class='subfolder' style='margin-left:${htmlIndent}px'>")
                Get-FolderTree -Path $item.FullName -Indent "$Indent$newIndent" -MaxDepth $MaxDepth -CurrentDepth ($CurrentDepth + 1) -Output $Output -HtmlOutput $HtmlOutput
                $null = $HtmlOutput.AppendLine("</div>")
            }
        }
    }
    catch {
        $errorMsg = "$Indent\-- [Error accessing path: $Path]"
        $null = $Output.AppendLine($errorMsg)
        $null = $HtmlOutput.AppendLine("<div class='error'>$errorMsg</div>")
    }
}

# Create output files
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = "project_structure_$timestamp.txt"
$htmlFile = "project_structure_$timestamp.html"
$outputPath = Join-Path $PSScriptRoot $outputFile
$htmlPath = Join-Path $PSScriptRoot $htmlFile

# Initialize outputs
$outputBuilder = [System.Text.StringBuilder]::new()
$htmlBuilder = [System.Text.StringBuilder]::new()

# HTML header
$htmlHeader = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Project Structure - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; }
        .folder { padding: 3px 0; font-family: 'Courier New', monospace; }
        .folder:hover { background-color: #f0f8ff; }
        .name { color: #2980b9; font-weight: bold; }
        .details { color: #27ae60; }
        .date { color: #7f8c8d; font-size: 0.9em; }
        .error { color: #e74c3c; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .file-types { margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        tr:hover {background-color: #f5f5f5;}
    </style>
</head>
<body>
    <div class='container'>
        <h1>Project Structure</h1>
        <div class='summary'>
            <h2>Project Information</h2>
            <p><strong>Path:</strong> $((Get-Location).Path)</p>
            <p><strong>Generated:</strong> $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        </div>
        <div class='structure'>
"@
$null = $htmlBuilder.AppendLine($htmlHeader)

# Add header to text output
$divider = "=" * 90
$null = $outputBuilder.AppendLine($divider)
$null = $outputBuilder.AppendLine(("PROJECT STRUCTURE").PadLeft(($divider.Length + "PROJECT STRUCTURE".Length) / 2))
$null = $outputBuilder.AppendLine($divider)
$null = $outputBuilder.AppendLine(("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")))
$null = $outputBuilder.AppendLine(("Path: {0}" -f (Get-Location).Path))
$null = $outputBuilder.AppendLine("-" * 90)
$null = $outputBuilder.AppendLine(("FOLDER NAME".PadRight(50) + "DETAILS".PadLeft(25) + "  " + "LAST MODIFIED"))
$null = $outputBuilder.AppendLine("-" * 90)

# Generate folder structure
Get-FolderTree -Path $PSScriptRoot -MaxDepth 5 -Output $outputBuilder -HtmlOutput $htmlBuilder

# Calculate execution time
$executionTime = (Get-Date) - $script:startTime

# Add summary to HTML
$htmlFooter = @"
        </div>
        <div class='summary'>
            <h2>Project Summary</h2>
            <p><strong>Total Folders:</strong> $script:totalFolders</p>
            <p><strong>Excluded Folders:</strong> $script:excludedFolders</p>
            <p><strong>Total Files:</strong> $script:totalFiles</p>
            <p><strong>Total Size:</strong> $("{0:N2} MB" -f ($script:totalSize / 1MB))</p>
            <p><strong>Execution Time:</strong> $($executionTime.TotalSeconds.ToString("0.00")) seconds</p>
        </div>
        <div class='file-types'>
            <h2>File Types</h2>
            <table>
                <tr><th>Type</th><th>Count</th></tr>
"@
$null = $htmlBuilder.AppendLine($htmlFooter)

# Add file types to HTML
foreach ($type in $script:fileTypes.Keys | Sort-Object) {
    $null = $htmlBuilder.AppendLine("<tr><td>$type</td><td>$($script:fileTypes[$type])</td></tr>")
}

$htmlEnd = @"
            </table>
        </div>
    </div>
</body>
</html>
"@
$null = $htmlBuilder.AppendLine($htmlEnd)

# Add summary to text output
$null = $outputBuilder.AppendLine("-" * 90)
$null = $outputBuilder.AppendLine("PROJECT SUMMARY:")
$null = $outputBuilder.AppendLine(("  • Total Folders: {0}" -f $script:totalFolders))
$null = $outputBuilder.AppendLine(("  • Excluded Folders: {0}" -f $script:excludedFolders))
$null = $outputBuilder.AppendLine(("  • Total Files: {0}" -f $script:totalFiles))
$null = $outputBuilder.AppendLine(("  • Total Size: {0:N2} MB" -f ($script:totalSize / 1MB)))
$null = $outputBuilder.AppendLine(("  • Execution Time: {0} seconds" -f $executionTime.TotalSeconds.ToString("0.00")))
$null = $outputBuilder.AppendLine($divider)

# Write output files
[System.IO.File]::WriteAllText($outputPath, $outputBuilder.ToString(), [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($htmlPath, $htmlBuilder.ToString(), [System.Text.Encoding]::UTF8)

# Show completion message
Write-Host "`n" + ("*" * 80) -ForegroundColor Green
Write-Host "  PROJECT STRUCTURE GENERATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host ("  " + ("-" * 76)) -ForegroundColor Green
Write-Host ("  Text File:".PadRight(20) + $outputPath) -ForegroundColor Cyan
Write-Host ("  HTML File:".PadRight(20) + $htmlPath) -ForegroundColor Cyan
Write-Host ("  " + ("-" * 76)) -ForegroundColor Green
Write-Host ("  Total Folders:".PadRight(20) + $script:totalFolders) -ForegroundColor Cyan
Write-Host ("  Total Files:".PadRight(20) + $script:totalFiles) -ForegroundColor Cyan
Write-Host ("  Total Size:".PadRight(20) + ("{0:N2} MB" -f ($script:totalSize / 1MB))) -ForegroundColor Cyan
Write-Host ("  Execution Time:".PadRight(20) + ("{0} seconds" -f $executionTime.TotalSeconds.ToString("0.00"))) -ForegroundColor Cyan
Write-Host ("  " + ("-" * 76)) -ForegroundColor Green
Write-Host ("  " + "*" * 76) -ForegroundColor Green

# Open HTML in default browser
Start-Process $htmlPath