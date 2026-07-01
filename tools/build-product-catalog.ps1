param(
  [Parameter(Mandatory = $true)]
  [string]$CsvPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $CsvPath)) {
  throw "Arquivo CSV não encontrado: $CsvPath"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $projectRoot "js\products-catalog.js"
$rows = Import-Csv -LiteralPath $CsvPath -Encoding UTF8

$catalog = @(
  $rows |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_.name) } |
    ForEach-Object {
      $categories = @(
        $_.category_1
        $_.category_2
        $_.category_3
      ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

      [ordered]@{
        name       = $_.name.Trim()
        url        = $_.url
        categories = @($categories)
        search     = (@(
          $_.brand
          $_.model
          $_.meta_title
          $_.meta_keywords
        ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join " "
      }
    }
)

$json = $catalog | ConvertTo-Json -Depth 4 -Compress
$content = "window.CAMPAGNARO_PRODUCTS = $json;`n"
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputPath, $content, $encoding)

Write-Output "Catálogo gerado: $($catalog.Count) produtos em $outputPath"
