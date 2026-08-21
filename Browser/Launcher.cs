using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace CoffeeBrowserLauncher
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string currentDir = AppDomain.CurrentDomain.BaseDirectory;
                string distExe = Path.Combine(currentDir, "dist", "CoffeeBrowser-win32-x64", "CoffeeBrowser.exe");

                string arguments = "";
                if (args != null && args.Length > 0)
                {
                    arguments = string.Join(" ", Array.ConvertAll(args, a => "\"" + a.Replace("\"", "\\\"") + "\""));
                }

                if (File.Exists(distExe))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = distExe,
                        Arguments = arguments,
                        WorkingDirectory = Path.GetDirectoryName(distExe)
                    });
                    return;
                }

                // If electron executable in node_modules exists
                string electronExe = Path.Combine(currentDir, "node_modules", "electron", "dist", "electron.exe");
                if (File.Exists(electronExe))
                {
                    string electronArgs = string.Format("\"{0}\"", currentDir);
                    if (!string.IsNullOrEmpty(arguments))
                    {
                        electronArgs += " " + arguments;
                    }

                    Process.Start(new ProcessStartInfo
                    {
                        FileName = electronExe,
                        Arguments = electronArgs,
                        WorkingDirectory = currentDir
                    });
                    return;
                }

                // Fallback: Open index.html in default browser app mode
                string htmlPath = Path.Combine(currentDir, "index.html");
                Process.Start(new ProcessStartInfo
                {
                    FileName = htmlPath,
                    Arguments = arguments,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao iniciar Coffee Browser: " + ex.Message, "Coffee Browser", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
