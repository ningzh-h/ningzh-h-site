# 启动器工具

## 生成图标

```powershell
python tools/make-icon.py
```

会生成 `tools/icon.ico`（exe 图标）和 `tools/icon-256.png`（预览用）。

## 编译 exe

Windows 自带 .NET Framework 的编译器即可：

```powershell
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' `
  /nologo /target:winexe /optimize+ /codepage:65001 `
  /win32icon:tools\icon.ico `
  /out:种下大雪.exe tools\Launcher.cs `
  /r:System.Windows.Forms.dll
```

生成后的 `种下大雪.exe` 是一个很轻的启动器：

1. 找到同目录下的 `启动站点.bat`；
2. 用一个新的命令行窗口运行它；
3. bat 负责检查 Node、安装依赖、启动 `npm run dev` 并打开浏览器。

所以 exe 不包含站点内容，也不替代 Node.js。换电脑时需要把整个项目一起复制过去。
