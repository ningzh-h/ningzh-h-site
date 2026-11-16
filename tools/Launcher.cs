using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string bat = Path.Combine(dir, "启动站点.bat");

        if (!File.Exists(bat))
        {
            MessageBox.Show(
                "找不到 启动站点.bat。\n请把 exe 放在站点根目录后再运行。",
                "种下大雪",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c start \"\" \"" + bat + "\"",
                WorkingDirectory = dir,
                UseShellExecute = true,
                CreateNoWindow = true
            });
        }
        catch (Exception error)
        {
            MessageBox.Show(
                "启动失败：\n" + error.Message,
                "种下大雪",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }
}
