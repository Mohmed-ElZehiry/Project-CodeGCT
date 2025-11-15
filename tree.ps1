
# powershell -ExecutionPolicy Bypass -File .\tree.ps1

Function Show-Tree {
    param(
        [string]$Path,
        [string]$Indent = "",
        [System.Collections.Generic.List[string]]$Output
    )

    # قائمة المجلدات المستبعدة
    $excludedFolders = @('__pycache__', 'env', '.venv', 'venv', 'site-packages', 'node_modules')

    # الحصول على العناصر مع استبعاد المجلدات غير المرغوبة
    $items = Get-ChildItem -LiteralPath $Path | Where-Object { $excludedFolders -notcontains $_.Name }
    
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            $Output.Add("$Indent|-- " + $item.Name)
            Show-Tree -Path $item.FullName -Indent ("$Indent|   ") -Output $Output
        }
        else {
            $Output.Add("$Indent|-- " + $item.Name)
        }
    }
}

# إنشاء قائمة لتجميع النتائج
$outputList = New-Object System.Collections.Generic.List[string]
$outputList.Add("D:\Works\Projects\Project_Delta\delta")  # 🔧 المسار الرئيسي لمشروع Delta
Show-Tree -Path "D:\Works\Projects\Project_Delta\delta" -Output $outputList

# حفظ النتائج في ملف نصي
$outputFile = "D:\Works\Projects\Project_Delta\delta\tree.txt"
$outputList | Out-File -FilePath $outputFile -Encoding utf8

# فتح الملف باستخدام Notepad
notepad $outputFile
