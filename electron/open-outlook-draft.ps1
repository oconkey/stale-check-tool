param(
  [Parameter(Mandatory = $true)]
  [string]$AttachmentPath,

  [Parameter(Mandatory = $true)]
  [string]$Subject
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $AttachmentPath)) {
  throw "Attachment not found: $AttachmentPath"
}

$outlook = New-Object -ComObject Outlook.Application
$mail = $outlook.CreateItem(0)
$mail.Subject = $Subject
$null = $mail.Attachments.Add($AttachmentPath)
$null = $mail.Display()
