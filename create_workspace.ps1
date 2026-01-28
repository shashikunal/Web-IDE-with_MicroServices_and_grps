$userId = "6978478fdb581466241a608c"
$body = @{
    userId     = $userId
    templateId = "react-app"
    title      = "Test React Fix 2"
} | ConvertTo-Json

try {
    $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTc4NDc4ZmRiNTgxNDY2MjQxYTYwOGMiLCJlbWFpbCI6InRlc3R1c2VyXzE5NTAwNDQwMTNAZXhhbXBsZS5jb20iLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc2OTQ5MDMxOSwiZXhwIjoxNzY5NDkxMjE5fQ.Mwb8eO_rgbSrkYJl0NSf5VFgu51pizaI9bbt_13b_P4"
    $headers = @{
        Authorization = "Bearer $token"
    }
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/workspaces" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    Write-Host "Success:`n"
    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Error:`n"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.ReadToEnd()
    }
}
