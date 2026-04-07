param()

Write-Host "Creating Vite Client..."
cmd /c "npx -y create-vite@latest client --template react"

Write-Host "Installing Client Dependencies..."
Set-Location "client"
cmd /c "npm install"
cmd /c "npm install react-router-dom socket.io-client"

Write-Host "Creating Server..."
Set-Location ".."
New-Item -ItemType Directory -Force -Path "server"
Set-Location "server"

Write-Host "Initializing Server and Installing Dependencies..."
cmd /c "npm init -y"
cmd /c "npm install express cors sqlite3 socket.io jsonwebtoken bcryptjs body-parser"
cmd /c "npm install --save-dev nodemon"

Write-Host "Setup Complete!"
