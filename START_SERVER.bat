@echo off
title Ivan Food Court Server & ngrok
cd /d "D:\caffe\agon-agent_1-2a41a194"
set "PATH=C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\User\AppData\Local\OpenAI\Codex\runtimes\cua_node\b474a88d5d105afa\bin;%PATH%"
echo ========================================================
echo   Ivan Food Court - Starting Local Server and ngrok...
echo   Local:   http://localhost:5173/
echo   Kitchen: http://localhost:5173/kitchen
echo   Admin:   http://localhost:5173/admin
echo ========================================================
start cmd /k "npx ngrok http 5173"
start http://localhost:5173/
npm run dev -- --host
pause
