// Linkster — быстрая вставка сохранённых ссылок по глобальной горячей клавише.
// Собирается встроенным в Windows компилятором .NET Framework (см. build.bat).

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Linkster
{
    class LinkItem
    {
        public string Name;
        public string Url;
        public LinkItem(string name, string url) { Name = name; Url = url; }
    }

    static class Storage
    {
        public static readonly string Dir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Linkster");
        static readonly string LinksFile = Path.Combine(Dir, "links.txt");
        static readonly string ConfigFile = Path.Combine(Dir, "config.ini");

        // Формат links.txt: одна ссылка на строку, "название<TAB>ссылка" или просто "ссылка".
        public static List<LinkItem> LoadLinks()
        {
            var list = new List<LinkItem>();
            if (!File.Exists(LinksFile)) return list;
            foreach (var raw in File.ReadAllLines(LinksFile, Encoding.UTF8))
            {
                var line = raw.Trim();
                if (line.Length == 0 || line.StartsWith("#")) continue;
                int tab = line.IndexOf('\t');
                if (tab >= 0) list.Add(new LinkItem(line.Substring(0, tab).Trim(), line.Substring(tab + 1).Trim()));
                else list.Add(new LinkItem("", line));
            }
            return list;
        }

        public static void SaveLinks(List<LinkItem> links)
        {
            Directory.CreateDirectory(Dir);
            var lines = new List<string>();
            foreach (var l in links)
                lines.Add(Clean(l.Name) + "\t" + Clean(l.Url));
            File.WriteAllLines(LinksFile, lines.ToArray(), Encoding.UTF8);
        }

        static string Clean(string s)
        {
            return (s ?? "").Replace("\t", " ").Replace("\r", " ").Replace("\n", " ").Trim();
        }

        public static string LoadHotkey()
        {
            if (File.Exists(ConfigFile))
            {
                foreach (var line in File.ReadAllLines(ConfigFile, Encoding.UTF8))
                {
                    var t = line.Trim();
                    if (t.StartsWith("hotkey=", StringComparison.OrdinalIgnoreCase))
                        return t.Substring(7).Trim();
                }
            }
            return "Ctrl+Alt+V";
        }

        public static void EnsureConfig()
        {
            Directory.CreateDirectory(Dir);
            if (!File.Exists(ConfigFile))
                File.WriteAllText(ConfigFile,
                    "# Горячая клавиша вызова меню. Модификаторы: Ctrl, Alt, Shift, Win.\r\n" +
                    "# Примеры: Ctrl+Alt+V, Ctrl+Shift+Space, Win+Alt+L\r\n" +
                    "# После изменения перезапустите Linkster.\r\n" +
                    "hotkey=Ctrl+Alt+V\r\n", Encoding.UTF8);
        }

        public static string ConfigPath { get { return ConfigFile; } }
    }

    static class Native
    {
        public const int WM_HOTKEY = 0x0312;
        public const uint MOD_ALT = 1, MOD_CONTROL = 2, MOD_SHIFT = 4, MOD_WIN = 8, MOD_NOREPEAT = 0x4000;
        public const uint KEYEVENTF_KEYUP = 2;

        [DllImport("user32.dll")] public static extern bool RegisterHotKey(IntPtr hWnd, int id, uint mods, uint vk);
        [DllImport("user32.dll")] public static extern bool UnregisterHotKey(IntPtr hWnd, int id);
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
        [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vk);
        [DllImport("user32.dll")] public static extern bool DestroyIcon(IntPtr hIcon);

        static void Key(Keys k, bool up)
        {
            keybd_event((byte)k, 0, up ? KEYEVENTF_KEYUP : 0, UIntPtr.Zero);
        }

        // Ждём, пока пользователь отпустит модификаторы горячей клавиши, иначе Ctrl+V превратится в Ctrl+Alt+V.
        public static void WaitModifiersReleased()
        {
            int[] mods = { 0x10, 0x11, 0x12, 0x5B, 0x5C }; // Shift, Ctrl, Alt, LWin, RWin
            for (int i = 0; i < 100; i++)
            {
                bool any = false;
                foreach (var m in mods) if ((GetAsyncKeyState(m) & 0x8000) != 0) any = true;
                if (!any) return;
                Thread.Sleep(20);
            }
        }

        public static void SendCtrlV()
        {
            Key(Keys.ControlKey, false);
            Key(Keys.V, false);
            Key(Keys.V, true);
            Key(Keys.ControlKey, true);
        }
    }

    class TrayApp : Form
    {
        const int HotkeyId = 1;
        readonly NotifyIcon tray = new NotifyIcon();
        readonly ContextMenuStrip linksMenu = new ContextMenuStrip();
        IntPtr targetWindow = IntPtr.Zero;
        string hotkeyText;
        EditorForm editor;

        public TrayApp()
        {
            ShowInTaskbar = false;
            FormBorderStyle = FormBorderStyle.None;
            Opacity = 0;
            Size = new Size(1, 1);
            StartPosition = FormStartPosition.Manual;
            Location = new Point(-2000, -2000);

            linksMenu.ShowImageMargin = false;
            linksMenu.Font = new Font("Segoe UI", 10f);

            tray.Icon = MakeIcon();
            tray.Text = "Linkster";
            tray.Visible = true;
            tray.DoubleClick += delegate { OpenEditor(); };
            tray.ContextMenuStrip = BuildTrayMenu();

            Storage.EnsureConfig();
            CreateHandle();
            RegisterConfiguredHotkey();
        }

        protected override void SetVisibleCore(bool value)
        {
            // Окно-невидимка: нужно только для приёма WM_HOTKEY и как владелец меню.
            base.SetVisibleCore(false);
        }

        ContextMenuStrip BuildTrayMenu()
        {
            var m = new ContextMenuStrip();
            m.Items.Add("Редактировать ссылки…", null, delegate { OpenEditor(); });
            var autostart = new ToolStripMenuItem("Запускать вместе с Windows");
            autostart.Checked = Autostart.IsEnabled();
            autostart.Click += delegate
            {
                Autostart.Set(!autostart.Checked);
                autostart.Checked = Autostart.IsEnabled();
            };
            m.Items.Add(autostart);
            m.Items.Add("Сменить горячую клавишу…", null, delegate
            {
                System.Diagnostics.Process.Start("notepad.exe", "\"" + Storage.ConfigPath + "\"");
            });
            m.Items.Add(new ToolStripSeparator());
            m.Items.Add("Выход", null, delegate { Application.Exit(); });
            return m;
        }

        void RegisterConfiguredHotkey()
        {
            hotkeyText = Storage.LoadHotkey();
            uint mods; Keys key;
            if (!ParseHotkey(hotkeyText, out mods, out key))
            {
                tray.ShowBalloonTip(5000, "Linkster", "Не понял горячую клавишу \"" + hotkeyText + "\" в config.ini. Использую Ctrl+Alt+V.", ToolTipIcon.Warning);
                hotkeyText = "Ctrl+Alt+V";
                mods = Native.MOD_CONTROL | Native.MOD_ALT;
                key = Keys.V;
            }
            if (!Native.RegisterHotKey(Handle, HotkeyId, mods | Native.MOD_NOREPEAT, (uint)key))
            {
                tray.ShowBalloonTip(5000, "Linkster", hotkeyText + " уже занята другой программой. Поменяйте её в config.ini (меню в трее).", ToolTipIcon.Warning);
                return;
            }
            tray.Text = "Linkster — " + hotkeyText;
            tray.ShowBalloonTip(2500, "Linkster запущен", "Нажмите " + hotkeyText + " в любом поле ввода.", ToolTipIcon.Info);
        }

        static bool ParseHotkey(string text, out uint mods, out Keys key)
        {
            mods = 0; key = Keys.None;
            foreach (var partRaw in text.Split('+'))
            {
                var part = partRaw.Trim().ToLowerInvariant();
                if (part == "ctrl" || part == "control") mods |= Native.MOD_CONTROL;
                else if (part == "alt") mods |= Native.MOD_ALT;
                else if (part == "shift") mods |= Native.MOD_SHIFT;
                else if (part == "win") mods |= Native.MOD_WIN;
                else
                {
                    if (part.Length == 1 && char.IsDigit(part[0])) part = "D" + part;
                    try { key = (Keys)Enum.Parse(typeof(Keys), part, true); }
                    catch { return false; }
                }
            }
            return key != Keys.None && mods != 0;
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == Native.WM_HOTKEY && m.WParam.ToInt32() == HotkeyId)
                ShowLinksMenu();
            base.WndProc(ref m);
        }

        void ShowLinksMenu()
        {
            if (linksMenu.Visible) { linksMenu.Close(); return; }
            targetWindow = Native.GetForegroundWindow();

            linksMenu.Items.Clear();
            var links = Storage.LoadLinks();
            for (int i = 0; i < links.Count; i++)
            {
                var link = links[i];
                string title = link.Name.Length > 0 ? link.Name : Shorten(link.Url, 60);
                string prefix = i < 9 ? "&" + (i + 1) + "   " : "     ";
                var item = new ToolStripMenuItem(prefix + title.Replace("&", "&&"));
                if (link.Name.Length > 0) item.ShortcutKeyDisplayString = Shorten(link.Url, 40);
                item.ToolTipText = link.Url;
                item.Click += delegate { BeginInvoke(new Action(delegate { Paste(link.Url); })); };
                linksMenu.Items.Add(item);
            }
            if (links.Count == 0)
            {
                var empty = new ToolStripMenuItem("Пока нет ссылок") { Enabled = false };
                linksMenu.Items.Add(empty);
            }
            linksMenu.Items.Add(new ToolStripSeparator());
            linksMenu.Items.Add("+  Сохранить ссылку из буфера", null, delegate { AddFromClipboard(); });
            linksMenu.Items.Add("✎  Редактировать…", null, delegate { BeginInvoke(new Action(OpenEditor)); });

            // Без этого меню не получит клавиатуру и не закроется по клику мимо.
            Native.SetForegroundWindow(Handle);
            linksMenu.Show(Cursor.Position);
            if (linksMenu.Items.Count > 0) linksMenu.Items[0].Select();
        }

        void Paste(string url)
        {
            if (!TrySetClipboard(url)) return;
            Native.WaitModifiersReleased();
            if (targetWindow != IntPtr.Zero) Native.SetForegroundWindow(targetWindow);
            Thread.Sleep(80);
            Native.SendCtrlV();
        }

        static bool TrySetClipboard(string text)
        {
            for (int i = 0; i < 10; i++)
            {
                try { Clipboard.SetText(text); return true; }
                catch (ExternalException) { Thread.Sleep(50); }
            }
            return false;
        }

        void AddFromClipboard()
        {
            string text = "";
            try { text = Clipboard.ContainsText() ? Clipboard.GetText().Trim() : ""; } catch { }
            if (text.Length == 0 || text.Contains("\n"))
            {
                tray.ShowBalloonTip(3000, "Linkster", "В буфере нет подходящего текста — скопируйте ссылку и попробуйте снова.", ToolTipIcon.Warning);
                return;
            }
            var links = Storage.LoadLinks();
            links.Add(new LinkItem("", text));
            Storage.SaveLinks(links);
            tray.ShowBalloonTip(2000, "Сохранено", Shorten(text, 80), ToolTipIcon.Info);
        }

        void OpenEditor()
        {
            if (editor != null && !editor.IsDisposed) { editor.Activate(); return; }
            editor = new EditorForm(tray.Icon);
            editor.Show();
            editor.Activate();
        }

        static string Shorten(string s, int max)
        {
            return s.Length <= max ? s : s.Substring(0, max - 1) + "…";
        }

        static Icon MakeIcon()
        {
            using (var bmp = new Bitmap(32, 32))
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.Clear(Color.Transparent);
                using (var path = new GraphicsPath())
                {
                    int r = 8;
                    path.AddArc(1, 1, r * 2, r * 2, 180, 90);
                    path.AddArc(31 - r * 2, 1, r * 2, r * 2, 270, 90);
                    path.AddArc(31 - r * 2, 31 - r * 2, r * 2, r * 2, 0, 90);
                    path.AddArc(1, 31 - r * 2, r * 2, r * 2, 90, 90);
                    path.CloseFigure();
                    using (var b = new SolidBrush(Color.FromArgb(37, 99, 235))) g.FillPath(b, path);
                }
                using (var pen = new Pen(Color.White, 3.2f))
                {
                    // Два звена цепи.
                    g.TranslateTransform(16, 16);
                    g.RotateTransform(-45);
                    g.DrawArc(pen, -11, -4.5f, 12, 9, 90, 180);
                    g.DrawLine(pen, -5, -4.5f, -1, -4.5f);
                    g.DrawLine(pen, -5, 4.5f, -1, 4.5f);
                    g.DrawArc(pen, -1, -4.5f, 12, 9, 270, 180);
                    g.DrawLine(pen, 1, -4.5f, 5, -4.5f);
                    g.DrawLine(pen, 1, 4.5f, 5, 4.5f);
                    g.DrawLine(pen, -4, 0, 4, 0);
                }
                IntPtr h = bmp.GetHicon();
                var icon = (Icon)Icon.FromHandle(h).Clone();
                Native.DestroyIcon(h);
                return icon;
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                Native.UnregisterHotKey(Handle, HotkeyId);
                tray.Visible = false;
                tray.Dispose();
            }
            base.Dispose(disposing);
        }
    }

    class EditorForm : Form
    {
        readonly DataGridView grid = new DataGridView();

        public EditorForm(Icon icon)
        {
            Text = "Linkster — ссылки";
            Icon = icon;
            Size = new Size(720, 420);
            MinimumSize = new Size(480, 260);
            StartPosition = FormStartPosition.CenterScreen;
            Font = new Font("Segoe UI", 9.5f);

            grid.Dock = DockStyle.Fill;
            grid.AllowUserToAddRows = true;
            grid.AllowUserToDeleteRows = true;
            grid.RowHeadersWidth = 28;
            grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            grid.BackgroundColor = SystemColors.Window;
            grid.BorderStyle = BorderStyle.None;
            grid.Columns.Add("name", "Название (необязательно)");
            grid.Columns.Add("url", "Ссылка / текст");
            grid.Columns[0].FillWeight = 35;
            grid.Columns[1].FillWeight = 65;

            foreach (var l in Storage.LoadLinks()) grid.Rows.Add(l.Name, l.Url);

            var hint = new Label
            {
                Dock = DockStyle.Top,
                Height = 44,
                Padding = new Padding(8, 6, 8, 0),
                ForeColor = SystemColors.GrayText,
                Text = "Новая строка — пустая внизу таблицы. Удалить: выделите строку слева и нажмите Delete.\n" +
                       "Порядок = номер в меню (клавиши 1–9). Перемещайте кнопками ↑ ↓."
            };

            var buttons = new FlowLayoutPanel
            {
                Dock = DockStyle.Bottom,
                Height = 44,
                FlowDirection = FlowDirection.RightToLeft,
                Padding = new Padding(6)
            };
            var save = new Button { Text = "Сохранить", Width = 110, Height = 30 };
            var cancel = new Button { Text = "Отмена", Width = 90, Height = 30 };
            var up = new Button { Text = "↑", Width = 40, Height = 30 };
            var down = new Button { Text = "↓", Width = 40, Height = 30 };
            save.Click += delegate { Save(); Close(); };
            cancel.Click += delegate { Close(); };
            up.Click += delegate { MoveRow(-1); };
            down.Click += delegate { MoveRow(1); };
            buttons.Controls.AddRange(new Control[] { save, cancel, down, up });
            AcceptButton = save;
            CancelButton = cancel;

            Controls.Add(grid);
            Controls.Add(hint);
            Controls.Add(buttons);
        }

        void MoveRow(int delta)
        {
            if (grid.CurrentRow == null || grid.CurrentRow.IsNewRow) return;
            grid.EndEdit();
            int i = grid.CurrentRow.Index, j = i + delta;
            if (j < 0 || j >= grid.Rows.Count - 1) return;
            var row = grid.Rows[i];
            grid.Rows.RemoveAt(i);
            grid.Rows.Insert(j, row);
            grid.CurrentCell = grid.Rows[j].Cells[grid.CurrentCell == null ? 0 : grid.CurrentCell.ColumnIndex];
        }

        void Save()
        {
            grid.EndEdit();
            var list = new List<LinkItem>();
            foreach (DataGridViewRow r in grid.Rows)
            {
                if (r.IsNewRow) continue;
                string name = Convert.ToString(r.Cells[0].Value) ?? "";
                string url = Convert.ToString(r.Cells[1].Value) ?? "";
                if (url.Trim().Length == 0) continue;
                list.Add(new LinkItem(name.Trim(), url.Trim()));
            }
            Storage.SaveLinks(list);
        }
    }

    static class Autostart
    {
        const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";

        public static bool IsEnabled()
        {
            using (var k = Registry.CurrentUser.OpenSubKey(RunKey))
                return k != null && k.GetValue("Linkster") != null;
        }

        public static void Set(bool enabled)
        {
            using (var k = Registry.CurrentUser.CreateSubKey(RunKey))
            {
                if (enabled) k.SetValue("Linkster", "\"" + Application.ExecutablePath + "\"");
                else k.DeleteValue("Linkster", false);
            }
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            bool created;
            using (new Mutex(true, "Linkster.SingleInstance", out created))
            {
                if (!created)
                {
                    MessageBox.Show("Linkster уже запущен — иконка в трее.", "Linkster");
                    return;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                using (var app = new TrayApp())
                    Application.Run(app);
            }
        }
    }
}

