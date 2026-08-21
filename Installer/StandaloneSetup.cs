using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

namespace CoffeeBrowserInstaller
{
    public class SetupForm : Form
    {
        // Colors from Coffee Browser Design System
        private static readonly Color ColorBg = Color.FromArgb(18, 10, 6);       // #120A06
        private static readonly Color ColorCard = Color.FromArgb(30, 18, 11);    // #1E120B
        private static readonly Color ColorElev = Color.FromArgb(44, 26, 18);    // #2C1A12
        private static readonly Color ColorLine = Color.FromArgb(61, 36, 24);    // #3D2418
        private static readonly Color ColorLineStr = Color.FromArgb(90, 53, 34); // #5A3522
        private static readonly Color ColorCrema = Color.FromArgb(253, 246, 226); // #FDF6E2
        private static readonly Color ColorT2 = Color.FromArgb(212, 195, 179);   // #D4C3B3
        private static readonly Color ColorMut = Color.FromArgb(156, 130, 115);  // #9C8273
        private static readonly Color ColorCaramel = Color.FromArgb(217, 119, 6); // #D97706
        private static readonly Color ColorAmber = Color.FromArgb(245, 158, 11);  // #F59E0B
        private static readonly Color ColorGreen = Color.FromArgb(34, 197, 94);   // #22C55E

        private int currentStep = 1;
        private string selectedRoast = "medio";
        private string destinationPath;

        // UI Controls
        private Panel pnlTitlebar;
        private Label lblTitle;
        private Panel pnlSteps;
        private Label[] stepIndicators;
        private Panel pnlBody;
        private Panel pnlFooter;

        // Step Panels
        private Panel pnlStep1;
        private Panel pnlStep2;
        private Panel pnlStep3;
        private Panel pnlStep4;

        // Step 2 controls
        private TextBox txtDestPath;
        private CheckBox chkDesktop;
        private CheckBox chkStartMenu;
        private CheckBox chkAutoStart;
        private CheckBox chkDefaultBrowser;
        private CheckBox chkCoador;
        private Panel[] roastCards;

        // Step 3 controls
        private Label lblStatus;
        private Label lblPercent;
        private ProgressBar prgBar;
        private RichTextBox rtbLogs;

        // Step 4 controls
        private Label lblFinishSummary;
        private CheckBox chkLaunch;

        // Footer buttons
        private Button btnCancel;
        private Button btnBack;
        private Button btnNext;

        // Window drag variables
        private bool isDragging = false;
        private Point dragStartPoint;

        public SetupForm()
        {
            InitializeComponent();
            destinationPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CoffeeBrowser");
            if (txtDestPath != null) txtDestPath.Text = destinationPath;
            ShowStep(1);
        }

        private void InitializeComponent()
        {
            this.Text = "Instalador do Coffee Browser";
            this.Size = new Size(740, 540);
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = ColorBg;
            this.DoubleBuffered = true;

            // Titlebar
            pnlTitlebar = new Panel
            {
                Dock = DockStyle.Top,
                Height = 42,
                BackColor = Color.FromArgb(13, 7, 4)
            };
            pnlTitlebar.MouseDown += (s, e) => { if (e.Button == MouseButtons.Left) { isDragging = true; dragStartPoint = e.Location; } };
            pnlTitlebar.MouseMove += (s, e) => { if (isDragging) { Point p = PointToScreen(e.Location); Location = new Point(p.X - dragStartPoint.X, p.Y - dragStartPoint.Y); } };
            pnlTitlebar.MouseUp += (s, e) => { isDragging = false; };

            lblTitle = new Label
            {
                Text = "☕  COFFEE BROWSER — INSTALADOR OFICIAL",
                ForeColor = ColorCrema,
                Font = new Font("Segoe UI", 10f, FontStyle.Bold),
                Location = new Point(14, 12),
                AutoSize = true
            };
            pnlTitlebar.Controls.Add(lblTitle);

            Button btnMin = new Button
            {
                Text = "—",
                ForeColor = ColorMut,
                BackColor = Color.Transparent,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(28, 26),
                Location = new Point(660, 8),
                Cursor = Cursors.Hand
            };
            btnMin.FlatAppearance.BorderSize = 0;
            btnMin.Click += (s, e) => { this.WindowState = FormWindowState.Minimized; };
            pnlTitlebar.Controls.Add(btnMin);

            Button btnClose = new Button
            {
                Text = "✕",
                ForeColor = ColorMut,
                BackColor = Color.Transparent,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(28, 26),
                Location = new Point(695, 8),
                Cursor = Cursors.Hand
            };
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.MouseEnter += (s, e) => { btnClose.BackColor = Color.FromArgb(239, 68, 68); btnClose.ForeColor = Color.White; };
            btnClose.MouseLeave += (s, e) => { btnClose.BackColor = Color.Transparent; btnClose.ForeColor = ColorMut; };
            btnClose.Click += (s, e) => { Application.Exit(); };
            pnlTitlebar.Controls.Add(btnClose);

            this.Controls.Add(pnlTitlebar);

            // Step Indicator Navigation Bar
            pnlSteps = new Panel
            {
                Dock = DockStyle.Top,
                Height = 44,
                BackColor = ColorCard
            };

            stepIndicators = new Label[4];
            string[] stepTitles = { "1. Boas-Vindas", "2. Personalização", "3. Instalação", "4. Conclusão" };
            for (int i = 0; i < 4; i++)
            {
                stepIndicators[i] = new Label
                {
                    Text = stepTitles[i],
                    ForeColor = ColorMut,
                    Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                    Size = new Size(160, 44),
                    Location = new Point(40 + i * 165, 0),
                    TextAlign = ContentAlignment.MiddleCenter
                };
                pnlSteps.Controls.Add(stepIndicators[i]);
            }
            this.Controls.Add(pnlSteps);

            // Footer Actions
            pnlFooter = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 56,
                BackColor = Color.FromArgb(13, 7, 4)
            };

            btnCancel = new Button
            {
                Text = "Cancelar",
                ForeColor = ColorT2,
                BackColor = ColorCard,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(95, 34),
                Location = new Point(20, 11),
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                Cursor = Cursors.Hand
            };
            btnCancel.FlatAppearance.BorderColor = ColorLine;
            btnCancel.Click += (s, e) => { Application.Exit(); };
            pnlFooter.Controls.Add(btnCancel);

            btnBack = new Button
            {
                Text = "← Voltar",
                ForeColor = ColorT2,
                BackColor = ColorCard,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(95, 34),
                Location = new Point(510, 11),
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                Visible = false,
                Cursor = Cursors.Hand
            };
            btnBack.FlatAppearance.BorderColor = ColorLine;
            btnBack.Click += (s, e) => { if (currentStep == 2) ShowStep(1); };
            pnlFooter.Controls.Add(btnBack);

            btnNext = new Button
            {
                Text = "Avançar →",
                ForeColor = Color.White,
                BackColor = ColorCaramel,
                FlatStyle = FlatStyle.Flat,
                Size = new Size(115, 34),
                Location = new Point(615, 11),
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnNext.FlatAppearance.BorderColor = ColorAmber;
            btnNext.Click += (s, e) =>
            {
                if (currentStep == 1) ShowStep(2);
                else if (currentStep == 2) StartInstallation();
                else if (currentStep == 4) FinishAndLaunch();
            };
            pnlFooter.Controls.Add(btnNext);

            this.Controls.Add(pnlFooter);

            // Main Body
            pnlBody = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = ColorBg,
                Padding = new Padding(24)
            };
            this.Controls.Add(pnlBody);

            BuildStep1();
            BuildStep2();
            BuildStep3();
            BuildStep4();
        }

        private void BuildStep1()
        {
            pnlStep1 = new Panel { Dock = DockStyle.Fill, Visible = false };

            Panel hero = new Panel
            {
                Location = new Point(10, 10),
                Size = new Size(670, 120),
                BackColor = ColorCard
            };
            hero.Paint += (s, e) => { ControlPaint.DrawBorder(e.Graphics, hero.ClientRectangle, ColorLine, ButtonBorderStyle.Solid); };

            Label lblHeroTitle = new Label
            {
                Text = "☕ Instalação do Coffee Browser",
                ForeColor = ColorCrema,
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                Location = new Point(20, 20),
                AutoSize = true
            };
            Label lblHeroDesc = new Label
            {
                Text = "Deguste uma navegação web artesanal, ultrarrápida, com Coador AdBlock nativo,\nresolução DNS Cloudflare segura (1.1.1.1 DoH) e total privacidade.",
                ForeColor = ColorT2,
                Font = new Font("Segoe UI", 10f),
                Location = new Point(22, 58),
                AutoSize = true
            };
            hero.Controls.Add(lblHeroTitle);
            hero.Controls.Add(lblHeroDesc);
            pnlStep1.Controls.Add(hero);

            // 4 Feature boxes
            string[,] features = {
                { "🛡️ Coador AdBlock Nativo", "Bloqueio de rastreadores e anúncios em toda a web." },
                { "☕ Modo Torra Adaptativo", "Interface Dark Roast aconchegante (Clara, Média, Escura)." },
                { "⚡ DNS Seguro 1.1.1.1", "Consultas web criptografadas com velocidade máxima." },
                { "🔒 Zero Telemetria", "100% privativo. Seus dados nunca saem do seu computador." }
            };

            for (int i = 0; i < 4; i++)
            {
                int row = i / 2;
                int col = i % 2;
                Panel card = new Panel
                {
                    Location = new Point(10 + col * 345, 145 + row * 90),
                    Size = new Size(330, 78),
                    BackColor = ColorCard
                };
                card.Paint += (s, e) => { ControlPaint.DrawBorder(e.Graphics, card.ClientRectangle, ColorLine, ButtonBorderStyle.Solid); };

                Label title = new Label
                {
                    Text = features[i, 0],
                    ForeColor = ColorCrema,
                    Font = new Font("Segoe UI", 10.5f, FontStyle.Bold),
                    Location = new Point(14, 12),
                    AutoSize = true
                };
                Label desc = new Label
                {
                    Text = features[i, 1],
                    ForeColor = ColorMut,
                    Font = new Font("Segoe UI", 9f),
                    Location = new Point(14, 38),
                    Size = new Size(300, 32)
                };
                card.Controls.Add(title);
                card.Controls.Add(desc);
                pnlStep1.Controls.Add(card);
            }

            pnlBody.Controls.Add(pnlStep1);
        }

        private void BuildStep2()
        {
            pnlStep2 = new Panel { Dock = DockStyle.Fill, Visible = false };

            Label lblTitle = new Label
            {
                Text = "Personalização e Opções de Instalação",
                ForeColor = ColorCrema,
                Font = new Font("Segoe UI", 13f, FontStyle.Bold),
                Location = new Point(10, 8),
                AutoSize = true
            };
            pnlStep2.Controls.Add(lblTitle);

            // Roast selector
            Label lblRoast = new Label
            {
                Text = "ESCOLHA A TORRA INICIAL DO NAVEGADOR:",
                ForeColor = ColorT2,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Location = new Point(10, 42),
                AutoSize = true
            };
            pnlStep2.Controls.Add(lblRoast);

            roastCards = new Panel[3];
            string[] roasts = { "claro", "medio", "escuro" };
            string[] roastNames = { "Torra Clara", "Torra Média", "Torra Escura" };
            string[] roastDescs = { "Tons quentes de caramelo suave", "Equilíbrio perfeito âmbar (Padrão)", "Preto profundo minimalista" };

            for (int i = 0; i < 3; i++)
            {
                int idx = i;
                Panel card = new Panel
                {
                    Location = new Point(10 + i * 228, 66),
                    Size = new Size(218, 64),
                    BackColor = (roasts[i] == "medio") ? ColorElev : ColorCard,
                    Cursor = Cursors.Hand
                };
                card.Paint += (s, e) =>
                {
                    Color border = (selectedRoast == roasts[idx]) ? ColorCaramel : ColorLine;
                    ControlPaint.DrawBorder(e.Graphics, card.ClientRectangle, border, ButtonBorderStyle.Solid);
                };

                Label rTitle = new Label { Text = roastNames[i], ForeColor = ColorCrema, Font = new Font("Segoe UI", 10f, FontStyle.Bold), Location = new Point(10, 10), AutoSize = true };
                Label rDesc = new Label { Text = roastDescs[i], ForeColor = ColorMut, Font = new Font("Segoe UI", 8f), Location = new Point(10, 32), Size = new Size(200, 26) };

                Action selectAction = () =>
                {
                    selectedRoast = roasts[idx];
                    for (int k = 0; k < 3; k++)
                    {
                        roastCards[k].BackColor = (roasts[k] == selectedRoast) ? ColorElev : ColorCard;
                        roastCards[k].Invalidate();
                    }
                };

                card.Click += (s, e) => selectAction();
                rTitle.Click += (s, e) => selectAction();
                rDesc.Click += (s, e) => selectAction();

                card.Controls.Add(rTitle);
                card.Controls.Add(rDesc);
                roastCards[i] = card;
                pnlStep2.Controls.Add(card);
            }

            // Path selector
            Label lblPath = new Label
            {
                Text = "PASTA DE INSTALAÇÃO:",
                ForeColor = ColorT2,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Location = new Point(10, 144),
                AutoSize = true
            };
            pnlStep2.Controls.Add(lblPath);

            txtDestPath = new TextBox
            {
                Location = new Point(10, 168),
                Size = new Size(570, 26),
                BackColor = Color.FromArgb(13, 7, 4),
                ForeColor = ColorCrema,
                Font = new Font("Consolas", 9.5f),
                BorderStyle = BorderStyle.FixedSingle
            };
            pnlStep2.Controls.Add(txtDestPath);

            Button btnBrowse = new Button
            {
                Text = "Procurar...",
                Location = new Point(590, 166),
                Size = new Size(90, 28),
                BackColor = ColorElev,
                ForeColor = ColorCrema,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnBrowse.FlatAppearance.BorderColor = ColorLine;
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtDestPath.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtDestPath.Text = Path.Combine(fbd.SelectedPath, "CoffeeBrowser");
                        destinationPath = txtDestPath.Text;
                    }
                }
            };
            pnlStep2.Controls.Add(btnBrowse);

            // Checkboxes
            chkDesktop = new CheckBox { Text = "Criar atalho na Área de Trabalho (Desktop)", Checked = true, ForeColor = ColorT2, Font = new Font("Segoe UI", 9.5f), Location = new Point(14, 205), AutoSize = true };
            chkStartMenu = new CheckBox { Text = "Adicionar ao Menu Iniciar do Windows", Checked = true, ForeColor = ColorT2, Font = new Font("Segoe UI", 9.5f), Location = new Point(14, 230), AutoSize = true };
            chkAutoStart = new CheckBox { Text = "Iniciar o Coffee Browser automaticamente com o Windows", Checked = true, ForeColor = ColorT2, Font = new Font("Segoe UI", 9.5f), Location = new Point(14, 255), AutoSize = true };
            chkDefaultBrowser = new CheckBox { Text = "Definir o Coffee Browser como o navegador padrão do sistema", Checked = true, ForeColor = ColorT2, Font = new Font("Segoe UI", 9.5f), Location = new Point(14, 280), AutoSize = true };
            chkCoador = new CheckBox { Text = "Ativar Coador AdBlock e proteção de privacidade nativamente", Checked = true, ForeColor = ColorT2, Font = new Font("Segoe UI", 9.5f), Location = new Point(14, 305), AutoSize = true };

            pnlStep2.Controls.Add(chkDesktop);
            pnlStep2.Controls.Add(chkStartMenu);
            pnlStep2.Controls.Add(chkAutoStart);
            pnlStep2.Controls.Add(chkDefaultBrowser);
            pnlStep2.Controls.Add(chkCoador);

            pnlBody.Controls.Add(pnlStep2);
        }

        private void BuildStep3()
        {
            pnlStep3 = new Panel { Dock = DockStyle.Fill, Visible = false };

            lblStatus = new Label
            {
                Text = "☕ Preparando instalação do Coffee Browser...",
                ForeColor = ColorCrema,
                Font = new Font("Segoe UI", 11f, FontStyle.Bold),
                Location = new Point(10, 10),
                AutoSize = true
            };
            pnlStep3.Controls.Add(lblStatus);

            lblPercent = new Label
            {
                Text = "0%",
                ForeColor = ColorAmber,
                Font = new Font("Consolas", 11f, FontStyle.Bold),
                Location = new Point(630, 10),
                AutoSize = true
            };
            pnlStep3.Controls.Add(lblPercent);

            prgBar = new ProgressBar
            {
                Location = new Point(10, 38),
                Size = new Size(670, 14),
                Value = 0,
                Maximum = 100
            };
            pnlStep3.Controls.Add(prgBar);

            Panel pnlTerm = new Panel
            {
                Location = new Point(10, 64),
                Size = new Size(670, 275),
                BackColor = Color.FromArgb(13, 7, 4)
            };
            pnlTerm.Paint += (s, e) => { ControlPaint.DrawBorder(e.Graphics, pnlTerm.ClientRectangle, ColorLine, ButtonBorderStyle.Solid); };

            rtbLogs = new RichTextBox
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(13, 7, 4),
                ForeColor = ColorT2,
                Font = new Font("Consolas", 9f),
                BorderStyle = BorderStyle.None,
                ReadOnly = true
            };
            pnlTerm.Controls.Add(rtbLogs);
            pnlStep3.Controls.Add(pnlTerm);

            pnlBody.Controls.Add(pnlStep3);
        }

        private void BuildStep4()
        {
            pnlStep4 = new Panel { Dock = DockStyle.Fill, Visible = false };

            Panel card = new Panel
            {
                Location = new Point(35, 20),
                Size = new Size(620, 260),
                BackColor = ColorCard
            };
            card.Paint += (s, e) => { ControlPaint.DrawBorder(e.Graphics, card.ClientRectangle, ColorLine, ButtonBorderStyle.Solid); };

            Label lblSuccessIcon = new Label
            {
                Text = "✔",
                ForeColor = ColorGreen,
                Font = new Font("Segoe UI", 32f, FontStyle.Bold),
                Location = new Point(275, 14),
                AutoSize = true
            };
            Label lblSuccessTitle = new Label
            {
                Text = "Instalação Concluída com Sucesso!",
                ForeColor = ColorCrema,
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                Location = new Point(125, 80),
                AutoSize = true
            };
            Label lblSuccessSub = new Label
            {
                Text = "O Coffee Browser foi instalado e configurado perfeitamente no seu computador.",
                ForeColor = ColorT2,
                Font = new Font("Segoe UI", 10f),
                Location = new Point(70, 118),
                AutoSize = true
            };

            lblFinishSummary = new Label
            {
                Text = "Destino: C:\\...\nTorra: Torra Média\nProteção: Coador AdBlock Ativo",
                ForeColor = ColorCrema,
                Font = new Font("Consolas", 9.5f),
                Location = new Point(40, 160),
                Size = new Size(540, 75),
                BackColor = Color.FromArgb(13, 7, 4)
            };

            card.Controls.Add(lblSuccessIcon);
            card.Controls.Add(lblSuccessTitle);
            card.Controls.Add(lblSuccessSub);
            card.Controls.Add(lblFinishSummary);
            pnlStep4.Controls.Add(card);

            chkLaunch = new CheckBox
            {
                Text = "Iniciar o Coffee Browser agora",
                Checked = true,
                ForeColor = ColorCrema,
                Font = new Font("Segoe UI", 10.5f, FontStyle.Bold),
                Location = new Point(240, 295),
                AutoSize = true
            };
            pnlStep4.Controls.Add(chkLaunch);

            pnlBody.Controls.Add(pnlStep4);
        }

        private void ShowStep(int step)
        {
            currentStep = step;
            pnlStep1.Visible = (step == 1);
            pnlStep2.Visible = (step == 2);
            pnlStep3.Visible = (step == 3);
            pnlStep4.Visible = (step == 4);

            for (int i = 0; i < 4; i++)
            {
                if (i + 1 == step)
                {
                    stepIndicators[i].ForeColor = ColorAmber;
                    stepIndicators[i].Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
                }
                else if (i + 1 < step)
                {
                    stepIndicators[i].ForeColor = ColorGreen;
                    stepIndicators[i].Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
                }
                else
                {
                    stepIndicators[i].ForeColor = ColorMut;
                    stepIndicators[i].Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
                }
            }

            if (step == 1)
            {
                btnBack.Visible = false;
                btnCancel.Visible = true;
                btnNext.Text = "Avançar →";
                btnNext.BackColor = ColorCaramel;
                btnNext.Enabled = true;
            }
            else if (step == 2)
            {
                btnBack.Visible = true;
                btnCancel.Visible = true;
                btnNext.Text = "Instalar Agora ☕";
                btnNext.BackColor = ColorCaramel;
                btnNext.Enabled = true;
            }
            else if (step == 3)
            {
                btnBack.Visible = false;
                btnCancel.Visible = false;
                btnNext.Text = "Instalando...";
                btnNext.Enabled = false;
            }
            else if (step == 4)
            {
                btnBack.Visible = false;
                btnCancel.Visible = false;
                btnNext.Text = "Concluir & Degustar 🚀";
                btnNext.BackColor = ColorGreen;
                btnNext.ForeColor = Color.Black;
                btnNext.Enabled = true;
            }
        }

        private void AppendLog(string message, Color color)
        {
            if (rtbLogs.InvokeRequired)
            {
                rtbLogs.Invoke(new Action(() => AppendLog(message, color)));
                return;
            }

            rtbLogs.SelectionStart = rtbLogs.TextLength;
            rtbLogs.SelectionLength = 0;
            rtbLogs.SelectionColor = ColorMut;
            rtbLogs.AppendText(string.Format("[{0}] ", DateTime.Now.ToString("HH:mm:ss")));

            rtbLogs.SelectionColor = color;
            rtbLogs.AppendText(message + "\n");
            rtbLogs.ScrollToCaret();
        }

        private void UpdateProgress(int percent, string status)
        {
            if (prgBar.InvokeRequired)
            {
                prgBar.Invoke(new Action(() => UpdateProgress(percent, status)));
                return;
            }

            prgBar.Value = Math.Min(100, Math.Max(0, percent));
            lblPercent.Text = percent + "%";
            if (!string.IsNullOrEmpty(status)) lblStatus.Text = status;
        }

        private void StartInstallation()
        {
            destinationPath = txtDestPath.Text.Trim();
            if (string.IsNullOrEmpty(destinationPath))
            {
                destinationPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "CoffeeBrowser");
            }

            ShowStep(3);

            Thread installThread = new Thread(RunInstallRoutine);
            installThread.IsBackground = true;
            installThread.Start();
        }

        private void RunInstallRoutine()
        {
            try
            {
                UpdateProgress(5, "Verificando processos ativos...");
                AppendLog("Iniciando rotina de instalação do Coffee Browser...", ColorT2);

                // Terminate running CoffeeBrowser process to avoid locked files
                try
                {
                    Process[] procs = Process.GetProcessesByName("CoffeeBrowser");
                    foreach (var p in procs)
                    {
                        try { p.Kill(); p.WaitForExit(1000); } catch {}
                    }
                }
                catch {}

                UpdateProgress(12, "Preparando pasta de destino...");
                AppendLog("Criando diretório: " + destinationPath, ColorT2);
                if (!Directory.Exists(destinationPath))
                {
                    Directory.CreateDirectory(destinationPath);
                }

                bool extracted = false;

                // STRATEGY 1: Extract Embedded Resource Payload (Self-Contained inside this single .exe)
                Assembly asm = Assembly.GetExecutingAssembly();
                Stream resStream = asm.GetManifestResourceStream("CoffeeBrowserPayload");

                if (resStream != null)
                {
                    UpdateProgress(25, "Extraindo pacote incorporado autônomo...");
                    AppendLog("Localizado pacote autônomo embutido (100% offline). Extraindo...", ColorAmber);

                    using (ZipArchive archive = new ZipArchive(resStream, ZipArchiveMode.Read))
                    {
                        int total = archive.Entries.Count;
                        int current = 0;
                        foreach (ZipArchiveEntry entry in archive.Entries)
                        {
                            string targetPath = Path.Combine(destinationPath, entry.FullName);
                            if (string.IsNullOrEmpty(entry.Name))
                            {
                                Directory.CreateDirectory(targetPath);
                            }
                            else
                            {
                                string parent = Path.GetDirectoryName(targetPath);
                                if (!Directory.Exists(parent)) Directory.CreateDirectory(parent);
                                entry.ExtractToFile(targetPath, true);
                            }
                            current++;
                            if (current % 10 == 0 || current == total)
                            {
                                int p = 25 + (int)((double)current / total * 45);
                                UpdateProgress(p, string.Format("Extraindo: {0} ({1}/{2})", entry.Name, current, total));
                            }
                        }
                    }
                    extracted = true;
                    AppendLog("Extração do pacote autônomo concluída com sucesso!", ColorGreen);
                }

                // STRATEGY 2: Extract from local payload.zip if present alongside
                if (!extracted)
                {
                    string localZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "payload.zip");
                    if (!File.Exists(localZip)) localZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Installer", "payload.zip");

                    if (File.Exists(localZip))
                    {
                        UpdateProgress(30, "Extraindo de payload.zip local...");
                        AppendLog("Extraindo arquivo: " + localZip, ColorAmber);
                        ZipFile.ExtractToDirectory(localZip, destinationPath);
                        extracted = true;
                        AppendLog("Extração local concluída!", ColorGreen);
                    }
                }

                // STRATEGY 3: Copy from packaged dist directory if present
                if (!extracted)
                {
                    string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                    string distDir = Path.Combine(baseDir, "Browser", "dist", "CoffeeBrowser-win32-x64");
                    if (!Directory.Exists(distDir)) distDir = Path.Combine(baseDir, "dist", "CoffeeBrowser-win32-x64");
                    if (!Directory.Exists(distDir)) distDir = Path.Combine(baseDir, "..", "Browser", "dist", "CoffeeBrowser-win32-x64");

                    if (Directory.Exists(distDir))
                    {
                        UpdateProgress(30, "Copiando binários do navegador...");
                        AppendLog("Copiando de: " + distDir, ColorAmber);
                        CopyDirectory(distDir, destinationPath);
                        extracted = true;
                        AppendLog("Cópia de binários concluída!", ColorGreen);
                    }
                }

                // STRATEGY 4: Copy from source Browser directory
                if (!extracted)
                {
                    string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                    string srcDir = Path.Combine(baseDir, "Browser");
                    if (!Directory.Exists(srcDir)) srcDir = Path.Combine(baseDir, "..", "Browser");

                    if (Directory.Exists(srcDir) && File.Exists(Path.Combine(srcDir, "index.html")))
                    {
                        UpdateProgress(30, "Copiando arquivos de origem...");
                        AppendLog("Copiando de: " + srcDir, ColorAmber);
                        CopyDirectory(srcDir, destinationPath);
                        extracted = true;
                        AppendLog("Cópia de arquivos concluída!", ColorGreen);
                    }
                }

                if (!extracted)
                {
                    throw new Exception("Não foi possível encontrar o pacote de arquivos do navegador.");
                }

                // Write preferences
                UpdateProgress(75, "Gravando perfil e configurações...");
                AppendLog("Registrando tema inicial: " + selectedRoast, ColorT2);
                string prefJson = string.Format("{{\n  \"roast\": \"{0}\",\n  \"shieldsEnabled\": {1},\n  \"installPath\": \"{2}\"\n}}",
                    selectedRoast, chkCoador.Checked ? "true" : "false", destinationPath.Replace("\\", "\\\\"));
                File.WriteAllText(Path.Combine(destinationPath, "install_preferences.json"), prefJson);

                // Create Shortcuts
                UpdateProgress(88, "Criando atalhos no Windows...");
                string exeTarget = Path.Combine(destinationPath, "CoffeeBrowser.exe");
                if (!File.Exists(exeTarget)) exeTarget = Path.Combine(destinationPath, "Launcher.cs");

                string iconTarget = Path.Combine(destinationPath, "assets", "logo.jpg");

                if (chkDesktop.Checked)
                {
                    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                    CreateShortcut(Path.Combine(desktop, "Coffee Browser.lnk"), exeTarget, destinationPath, iconTarget, "Coffee Browser");
                    AppendLog("Atalho criado na Área de Trabalho.", ColorGreen);
                }

                if (chkStartMenu.Checked)
                {
                    string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");
                    CreateShortcut(Path.Combine(startMenu, "Coffee Browser.lnk"), exeTarget, destinationPath, iconTarget, "Coffee Browser");
                    AppendLog("Atalho adicionado ao Menu Iniciar.", ColorGreen);
                }

                if (chkAutoStart.Checked)
                {
                    try
                    {
                        using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true))
                        {
                            if (key != null) key.SetValue("CoffeeBrowser", "\"" + exeTarget + "\"");
                        }
                        AppendLog("Configurada inicialização automática com o Windows.", ColorGreen);
                    }
                    catch {}
                }

                if (chkDefaultBrowser.Checked)
                {
                    try
                    {
                        string cmdVal = "\"" + exeTarget + "\" \"%1\"";
                        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Classes\CoffeeBrowserHTML\shell\open\command")) { if (k != null) k.SetValue("", cmdVal); }
                        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Classes\CoffeeBrowserURL\shell\open\command")) { if (k != null) k.SetValue("", cmdVal); }
                        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Classes\http\shell\open\command")) { if (k != null) k.SetValue("", cmdVal); }
                        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Classes\https\shell\open\command")) { if (k != null) k.SetValue("", cmdVal); }
                        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\RegisteredApplications")) { if (k != null) k.SetValue("CoffeeBrowser", @"Software\CoffeeBrowser\Capabilities"); }
                        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\CoffeeBrowser\Capabilities\URLAssociations"))
                        {
                            if (k != null) { k.SetValue("http", "CoffeeBrowserURL"); k.SetValue("https", "CoffeeBrowserURL"); }
                        }
                        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\CoffeeBrowser\Capabilities\FileAssociations"))
                        {
                            if (k != null) { k.SetValue(".html", "CoffeeBrowserHTML"); k.SetValue(".htm", "CoffeeBrowserHTML"); }
                        }
                        AppendLog("Coffee Browser registrado como navegador padrão do sistema.", ColorGreen);
                    }
                    catch {}
                }

                UpdateProgress(100, "Instalação concluída com sucesso!");
                AppendLog("Coffee Browser pronto para uso!", ColorGreen);

                Thread.Sleep(500);

                this.Invoke(new Action(() =>
                {
                    lblFinishSummary.Text = string.Format("Destino: {0}\nTorra: {1}\nProteção: Coador AdBlock Ativo",
                        destinationPath, (selectedRoast == "claro" ? "Torra Clara" : (selectedRoast == "escuro" ? "Torra Escura" : "Torra Média")));
                    ShowStep(4);
                }));
            }
            catch (Exception ex)
            {
                AppendLog("ERRO: " + ex.Message, Color.FromArgb(239, 68, 68));
                this.Invoke(new Action(() =>
                {
                    MessageBox.Show("Erro durante a instalação: " + ex.Message, "Coffee Browser Setup", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    ShowStep(2);
                }));
            }
        }

        private void CopyDirectory(string sourceDir, string destDir)
        {
            if (!Directory.Exists(destDir)) Directory.CreateDirectory(destDir);
            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string fName = Path.GetFileName(file);
                if (fName == "package-lock.json") continue;
                File.Copy(file, Path.Combine(destDir, fName), true);
            }
            foreach (string sub in Directory.GetDirectories(sourceDir))
            {
                string sName = Path.GetFileName(sub);
                if (sName == "dist" || sName == ".git") continue;
                CopyDirectory(sub, Path.Combine(destDir, sName));
            }
        }

        private void CreateShortcut(string shortcutPath, string targetPath, string workingDir, string iconPath, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = targetPath;
                    shortcut.WorkingDirectory = workingDir;
                    shortcut.Description = description;
                    if (File.Exists(iconPath)) shortcut.IconLocation = iconPath;
                    shortcut.Save();
                }
            }
            catch {}
        }

        private void FinishAndLaunch()
        {
            if (chkLaunch.Checked)
            {
                try
                {
                    string exePath = Path.Combine(destinationPath, "CoffeeBrowser.exe");
                    if (File.Exists(exePath))
                    {
                        Process.Start(new ProcessStartInfo { FileName = exePath, WorkingDirectory = destinationPath });
                    }
                    else
                    {
                        string electronExe = Path.Combine(destinationPath, "node_modules", "electron", "dist", "electron.exe");
                        if (File.Exists(electronExe))
                        {
                            Process.Start(new ProcessStartInfo { FileName = electronExe, Arguments = string.Format("\"{0}\"", destinationPath), WorkingDirectory = destinationPath });
                        }
                    }
                }
                catch {}
            }
            Application.Exit();
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
