import type { Lang } from '@shared/i18n'

const en = {
  metaTitle: 'Linky — your links, one keystroke away',
  metaDescription: 'Press Ctrl + Alt + V in any text field, pick a link, and it’s pasted right where you were typing. Free for Windows and macOS.',
  nav: { how: 'How it works', features: 'Features', faq: 'FAQ', github: 'GitHub', download: 'Download' },
  hero: {
    badge: 'Free for Windows & macOS',
    title: ['Your links,', 'one keystroke', 'away.'],
    sub: 'Press Ctrl + Alt + V in any text field, pick a link, and it’s pasted right where you were typing.',
    windows: 'Download for Windows',
    mac: 'Download for macOS',
    meta: 'Windows 10+ · macOS 12+ · Your snippets stay on your computer'
  },
  demo: { eyebrow: 'see it in action', title: '13 seconds. Two links. Zero tabs.' },
  how: {
    eyebrow: 'how it works',
    title: 'Three steps. No tabs.',
    steps: [
      { title: 'Save what you send often', body: 'Portfolio, a booking link, a polite reply. Paste it once, or save it straight from your clipboard.' },
      { title: 'Press the shortcut anywhere', body: 'In a chat, an email, a form — the quick menu opens right next to your cursor.' },
      { title: 'Pick it — it’s pasted', body: 'Arrow keys and Enter, a click, or just press 1–9. Your clipboard stays as it was.' }
    ],
    saveHint: 'Ctrl N · save from clipboard'
  },
  features: {
    eyebrow: 'features',
    title: 'Small app. Saves a lot of clicks.',
    sub: 'Everything you need to keep your go-to links and replies one keystroke away — nothing you don’t.',
    items: [
      { title: 'Instant search', body: 'Type a few letters — fuzzy search finds the link by title or URL.' },
      { title: 'Folders', body: 'Work, personal, replies. Press Tab in the menu to flip between them.' },
      { title: 'Pins & quick keys', body: 'Pin your top links. The first nine get a number you can press.' },
      { title: 'Clipboard stays yours', body: 'After pasting, Linky puts back whatever you had copied before.' },
      { title: 'Learns your habits', body: 'Links you use often and recently float to the top on their own.' },
      { title: 'Private by design', body: 'No account, no cloud, no tracking. Your snippets live in one file on your computer.' }
    ]
  },
  showcase: {
    eyebrow: 'your library',
    title: 'Everything in one calm place.',
    sub: 'Edit titles, sort by folders, see what you paste most. Light and dark, English and Russian.',
    alt: 'The Linky window: a list of saved links with folders and an editor on the right'
  },
  faq: {
    eyebrow: 'faq',
    title: 'Questions, answered.',
    items: [
      { q: 'Is it really free?', a: 'Yes. Linky is free while it’s in early access. A Pro plan with sync may come later — what’s free stays free.' },
      {
        q: 'Does it work in any app?',
        a: 'Anywhere you can type and paste: browsers, Telegram, Slack, Mail, Word, forms. On Windows, apps running as administrator can’t receive pastes from other apps — there Linky copies the link and you press Ctrl+V.'
      },
      { q: 'Where are my snippets stored?', a: 'In a single file on your computer. No account, no servers, nothing leaves your machine.' },
      { q: 'Can I change the shortcut?', a: 'Yes — pick any combination in Settings. Linky checks it isn’t already taken by another app.' },
      {
        q: 'macOS says Linky can’t be opened',
        a: 'Linky isn’t notarized by Apple yet, so macOS asks you to confirm once. Try to open it, then go to System Settings → Privacy & Security, scroll down and click “Open Anyway” next to Linky. (On macOS 14 and earlier, right-click the app → Open works too.) Then allow Accessibility access so Linky can paste for you.'
      }
    ]
  },
  cta: { title: 'Stop hunting for links.', sub: 'Install Linky in a minute. Your next “here’s my portfolio” takes one keystroke.' },
  footer: { made: 'Made by Tony', github: 'GitHub', releases: 'Releases', other: 'Русский' }
}

export type SiteCopy = typeof en

const ru: SiteCopy = {
  metaTitle: 'Linky — ваши ссылки в одно нажатие',
  metaDescription: 'Нажмите Ctrl + Alt + V в любом поле ввода, выберите ссылку — и она вставится туда, где стоит курсор. Бесплатно для Windows и macOS.',
  nav: { how: 'Как работает', features: 'Возможности', faq: 'Вопросы', github: 'GitHub', download: 'Скачать' },
  hero: {
    badge: 'Бесплатно для Windows и macOS',
    title: ['Ваши ссылки —', 'в одно', 'нажатие.'],
    sub: 'Нажмите Ctrl + Alt + V в любом поле ввода, выберите ссылку — и она вставится туда, где стоит курсор.',
    windows: 'Скачать для Windows',
    mac: 'Скачать для macOS',
    meta: 'Windows 10+ · macOS 12+ · Записи хранятся только на вашем компьютере'
  },
  demo: { eyebrow: 'как это выглядит', title: '13 секунд. Две ссылки. Ни одной вкладки.' },
  how: {
    eyebrow: 'как это работает',
    title: 'Три шага. Без вкладок.',
    steps: [
      { title: 'Сохраните то, что отправляете часто', body: 'Портфолио, ссылку на запись, вежливый ответ. Вставьте один раз или сохраните прямо из буфера обмена.' },
      { title: 'Нажмите сочетание где угодно', body: 'В чате, письме, форме — быстрое меню откроется прямо рядом с курсором.' },
      { title: 'Выберите — и готово', body: 'Стрелки и Enter, клик или просто цифра 1–9. Буфер обмена останется как был.' }
    ],
    saveHint: 'Ctrl N · сохранить из буфера'
  },
  features: {
    eyebrow: 'возможности',
    title: 'Маленькая программа. Экономит кучу кликов.',
    sub: 'Всё, чтобы любимые ссылки и ответы были в одном нажатии, — и ничего лишнего.',
    items: [
      { title: 'Мгновенный поиск', body: 'Наберите пару букв — поиск найдёт ссылку по названию или адресу.' },
      { title: 'Папки', body: 'Работа, личное, ответы. Tab в меню переключает папки.' },
      { title: 'Закрепление и цифры', body: 'Закрепите главные ссылки. У первых девяти есть номер — нажмите его.' },
      { title: 'Буфер остаётся вашим', body: 'После вставки Linky возвращает то, что вы копировали до этого.' },
      { title: 'Подстраивается под вас', body: 'Частые и недавние записи сами поднимаются наверх.' },
      { title: 'Приватность', body: 'Без аккаунта, облака и слежки. Записи лежат в одном файле на вашем компьютере.' }
    ]
  },
  showcase: {
    eyebrow: 'ваша библиотека',
    title: 'Всё в одном спокойном месте.',
    sub: 'Редактируйте названия, раскладывайте по папкам, смотрите, что вставляете чаще. Светлая и тёмная тема, русский и английский.',
    alt: 'Окно Linky: список сохранённых ссылок с папками и редактор справа'
  },
  faq: {
    eyebrow: 'вопросы',
    title: 'Ответы на вопросы.',
    items: [
      { q: 'Это правда бесплатно?', a: 'Да. Пока Linky в раннем доступе, он бесплатный. Позже может появиться Pro с синхронизацией — бесплатное останется бесплатным.' },
      {
        q: 'Работает в любой программе?',
        a: 'Везде, где можно печатать и вставлять: браузеры, Telegram, Slack, почта, Word, формы. В Windows программы, запущенные от администратора, не принимают вставку от других — там Linky скопирует ссылку, а вставите вы через Ctrl+V.'
      },
      { q: 'Где хранятся записи?', a: 'В одном файле на вашем компьютере. Без аккаунта и серверов — ничего не уходит наружу.' },
      { q: 'Можно поменять сочетание клавиш?', a: 'Да, любое — в настройках. Linky проверит, что его не заняла другая программа.' },
      {
        q: 'macOS пишет, что Linky нельзя открыть',
        a: 'Linky пока не прошёл нотаризацию Apple, поэтому macOS один раз просит подтверждения. Попробуйте открыть приложение, затем зайдите в Системные настройки → Конфиденциальность и безопасность, прокрутите вниз и нажмите «Всё равно открыть» рядом с Linky. (В macOS 14 и старше достаточно правого клика по приложению → «Открыть».) Затем разрешите «Универсальный доступ», чтобы Linky мог вставлять за вас.'
      }
    ]
  },
  cta: { title: 'Хватит искать ссылки.', sub: 'Установка — минута. Следующее «вот моё портфолио» займёт одно нажатие.' },
  footer: { made: 'Сделал Тони', github: 'GitHub', releases: 'Релизы', other: 'English' }
}

export const SITE_COPY: Record<Lang, SiteCopy> = { en, ru }

const REPO = 'https://github.com/tonybmleoy-crypto/linky'
export const LINKS = {
  repo: REPO,
  releases: `${REPO}/releases`,
  // electron-builder artifact names are version-free, so these always point at the newest release.
  windows: `${REPO}/releases/latest/download/Linky-Setup.exe`,
  macArm: `${REPO}/releases/latest/download/Linky-arm64.dmg`,
  macIntel: `${REPO}/releases/latest/download/Linky-x64.dmg`
}
