$token = Get-Content "$env:USERPROFILE\.coding_platform_token.txt" -ErrorAction SilentlyContinue

if (-not $token) {
    Write-Host "No token found. Please login first." -ForegroundColor Red
    exit 1
}

$body = @{
    templateId = "node-hello"
    language = "javascript"
    title = "Test Workspace"
} | ConvertTo-Json

Write-Host "Creating workspace..." -ForegroundColor Yellow
Write-Host "Request body: $body" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/workspaces" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -Body $body `
        -TimeoutSec 300

    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Body:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response: $responseBody" -ForegroundColor Red
    }
}
