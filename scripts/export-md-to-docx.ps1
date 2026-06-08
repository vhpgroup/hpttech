param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"

function Escape-XmlText([string]$Value) {
  if ($null -eq $Value) { return "" }
  return [System.Security.SecurityElement]::Escape($Value)
}

function New-RunXml([string]$Text, [bool]$Bold = $false) {
  $escaped = Escape-XmlText $Text
  $runProps = if ($Bold) { "<w:rPr><w:b/></w:rPr>" } else { "" }
  return "<w:r>$runProps<w:t xml:space=`"preserve`">$escaped</w:t></w:r>"
}

function New-ParagraphXml([string]$Text, [string]$Style = $null, [int]$Indent = 0) {
  $styleXml = if ($Style) { "<w:pStyle w:val=`"$Style`"/>" } else { "" }
  $indentXml = if ($Indent -gt 0) { "<w:ind w:left=`"$Indent`"/>" } else { "" }
  $propsXml = if ($styleXml -or $indentXml) { "<w:pPr>$styleXml$indentXml</w:pPr>" } else { "" }

  $runs = ""
  $cursor = 0
  $matches = [regex]::Matches($Text, "\*\*(.+?)\*\*")
  foreach ($match in $matches) {
    if ($match.Index -gt $cursor) {
      $runs += New-RunXml $Text.Substring($cursor, $match.Index - $cursor)
    }
    $runs += New-RunXml $match.Groups[1].Value $true
    $cursor = $match.Index + $match.Length
  }
  if ($cursor -lt $Text.Length) {
    $runs += New-RunXml $Text.Substring($cursor)
  }
  if (-not $runs) {
    $runs = New-RunXml ""
  }

  return "<w:p>$propsXml$runs</w:p>"
}

$resolvedInput = Resolve-Path -LiteralPath $InputPath
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("docx-export-" + [System.Guid]::NewGuid().ToString("N"))
$wordDir = Join-Path $tempRoot "word"
$relsDir = Join-Path $tempRoot "_rels"

New-Item -ItemType Directory -Path $wordDir -Force | Out-Null
New-Item -ItemType Directory -Path $relsDir -Force | Out-Null

$lines = Get-Content -LiteralPath $resolvedInput -Encoding UTF8
$paragraphs = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
  $trimmed = $line.TrimEnd()
  if (-not $trimmed) {
    $paragraphs.Add((New-ParagraphXml ""))
    continue
  }

  if ($trimmed.StartsWith("# ")) {
    $paragraphs.Add((New-ParagraphXml $trimmed.Substring(2) "Title"))
  } elseif ($trimmed.StartsWith("## ")) {
    $paragraphs.Add((New-ParagraphXml $trimmed.Substring(3) "Heading1"))
  } elseif ($trimmed.StartsWith("### ")) {
    $paragraphs.Add((New-ParagraphXml $trimmed.Substring(4) "Heading2"))
  } elseif ($trimmed.StartsWith("- ")) {
    $paragraphs.Add((New-ParagraphXml ("* " + $trimmed.Substring(2)) "ListParagraph" 360))
  } elseif ($trimmed.StartsWith("  - ")) {
    $paragraphs.Add((New-ParagraphXml ("- " + $trimmed.Substring(4)) "ListParagraph" 720))
  } else {
    $paragraphs.Add((New-ParagraphXml $trimmed))
  }
}

$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@

$rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@

$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="22"/></w:rPr>
    <w:pPr><w:spacing w:after="160"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
    <w:pPr><w:spacing w:after="240"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
    <w:pPr><w:spacing w:before="240" w:after="140"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
    <w:pPr><w:spacing w:before="180" w:after="120"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="100"/></w:pPr>
  </w:style>
</w:styles>
'@

$body = [string]::Join("`n", $paragraphs)
$document = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $body
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

Set-Content -LiteralPath (Join-Path $tempRoot "[Content_Types].xml") -Value $contentTypes -Encoding UTF8
Set-Content -LiteralPath (Join-Path $relsDir ".rels") -Value $rootRels -Encoding UTF8
Set-Content -LiteralPath (Join-Path $wordDir "styles.xml") -Value $styles -Encoding UTF8
Set-Content -LiteralPath (Join-Path $wordDir "document.xml") -Value $document -Encoding UTF8

$outputDir = Split-Path -Parent $resolvedOutput
if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}
if (Test-Path -LiteralPath $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Force
}

$tempZip = Join-Path ([System.IO.Path]::GetTempPath()) ("docx-export-" + [System.Guid]::NewGuid().ToString("N") + ".zip")
Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $tempZip -Force
Move-Item -LiteralPath $tempZip -Destination $resolvedOutput -Force
Remove-Item -LiteralPath $tempRoot -Recurse -Force

Write-Output $resolvedOutput
