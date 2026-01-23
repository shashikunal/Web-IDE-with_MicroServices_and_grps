$body = @{
    email    = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Success:`n"
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Error:`n"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.ReadToEnd()
    }
    else {
        Write-Host $_.Exception.Message
    }
}
