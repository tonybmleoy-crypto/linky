@echo off
cd /d "%~dp0"
"%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /codepage:65001 /target:winexe /optimize+ /out:Linkster.exe /r:System.Windows.Forms.dll /r:System.Drawing.dll Linkster.cs
if errorlevel 1 (echo Build failed & pause & exit /b 1)
echo Built Linkster.exe
