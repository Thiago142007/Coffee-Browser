using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace CoffeeBrowserInstallerLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string currentDir = AppDomain.CurrentDomain.BaseDirectory;
                string installerDir = currentDir;

                // Check if current directory is root or inside Installer
                if (Directory.Exists(Path.Combine(currentDir, "Installer")))
                {
                    installerDir = Path.Combine(currentDir, "Installer");
                }

                // 1. Check if pre-packaged setup exe exists
                string distExe = Path.Combine(installerDir, "dist", "CoffeeBrowserSetup-win32-x64", "CoffeeBrowserSetup.exe");
                if (File.Exists(distExe))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = distExe,
                        WorkingDirectory = Path.GetDirectoryName(distExe)
                    });
                    return;
                }

                // 2. Check if electron executable in Browser node_modules exists
                string electronExe = Path.Combine(currentDir, "Browser", "node_modules", "electron", "dist", "electron.exe");
                if (!File.Exists(electronExe))
                {
                    electronExe = Path.Combine(currentDir, "..", "Browser", "node_modules", "electron", "dist", "electron.exe");
                }

                if (File.Exists(electronExe))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = electronExe,
                        Arguments = string.Format("\"{0}\"", installerDir),
                        WorkingDirectory = installerDir
                    });
                    return;
                }

                // 3. Fallback: Open installer HTML in default browser
                string htmlPath = Path.Combine(installerDir, "index.html");
                if (File.Exists(htmlPath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = htmlPath,
                        UseShellExecute = true
                    });
                    return;
                }

                MessageBox.Show("Não foi possível localizar os arquivos do instalador.", "Coffee Browser Setup", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao iniciar o instalador: " + ex.Message, "Coffee Browser Setup", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
