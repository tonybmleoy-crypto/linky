import type { Lang } from '@shared/i18n'

/*
 * Copy rules: no em dashes, no "ё" in Russian, active voice, no slogan-style fragments.
 */

const en = {
  metaTitle: 'Linky: your links, one keystroke away',
  metaDescription: 'Press Ctrl + Alt + V in any text field and pick a link. Linky pastes it where you were typing. Free for Windows and macOS.',
  nav: { how: 'How it works', features: 'Features', faq: 'FAQ', github: 'GitHub', download: 'Download' },
  hero: {
    badge: 'Free for Windows & macOS',
    title: ['Your links,', 'one keystroke', 'away.'],
    sub: 'Press Ctrl + Alt + V in any text field and pick a link. Linky pastes it where you were typing.',
    windows: 'Download for Windows',
    mac: 'Download for macOS',
    meta: 'Windows 10+ · macOS 12+ · Your snippets stay on your computer'
  },
  demo: { eyebrow: 'see it in action', title: 'Two links in 13 seconds, without opening a tab.' },
  how: {
    eyebrow: 'how it works',
    title: 'Three steps, no tabs.',
    steps: [
      { title: 'Save what you send often', body: 'Portfolio, a booking link, a polite reply. Add it once, or save what’s on your clipboard.' },
      { title: 'Press the shortcut anywhere', body: 'In a chat, an email or a form, the quick menu opens next to your cursor.' },
      { title: 'Pick it and it’s pasted', body: 'Use the arrow keys and Enter, click, or press 1–9. Your clipboard keeps what you copied.' }
    ],
    saveHint: 'Ctrl N · save from clipboard'
  },
  features: {
    eyebrow: 'features',
    title: 'A small app that saves you a lot of clicks.',
    sub: 'Your go-to links and replies sit one keystroke away. The rest of the time Linky stays in the tray.',
    items: [
      { title: 'Instant search', body: 'Type a few letters and fuzzy search finds the link by title or URL.' },
      { title: 'Folders', body: 'Work, personal, replies. Press Tab in the menu to switch between them.' },
      { title: 'Pins and quick keys', body: 'Pin your top links. The first nine get a number you can press.' },
      { title: 'Your clipboard stays yours', body: 'After pasting, Linky puts back what you had copied before.' },
      { title: 'Learns your habits', body: 'Links you use often and recently move to the top on their own.' },
      { title: 'Private by design', body: 'No account, no cloud, no tracking. Your snippets live in one file on your computer.' }
    ]
  },
  showcase: {
    eyebrow: 'your library',
    title: 'One place for all your links.',
    sub: 'Edit titles, sort links into folders, see what you paste most. Light and dark themes, English and Russian.',
    alt: 'The Linky window: a list of saved links with folders and an editor on the right'
  },
  faq: {
    eyebrow: 'faq',
    title: 'Questions and answers.',
    items: [
      { q: 'Is it free?', a: 'Yes. Linky is free during early access. I may add a Pro plan with sync later, and everything that’s free now will stay free.' },
      {
        q: 'Does it work in any app?',
        a: 'In any app where you can type and paste: browsers, Telegram, Slack, Mail, Word, forms. On Windows, apps that run as administrator don’t accept pastes from other apps. There Linky copies the link and you press Ctrl+V.'
      },
      { q: 'Where are my snippets stored?', a: 'In one file on your computer. Linky has no accounts and no servers, so your data stays on your machine.' },
      { q: 'Can I change the shortcut?', a: 'Yes. Pick any combination in Settings, and Linky checks that no other app uses it.' },
      {
        q: 'macOS says Linky can’t be opened',
        a: 'Apple hasn’t notarized Linky yet, so macOS asks you to confirm once. Try to open the app, then go to System Settings → Privacy & Security, scroll down and click “Open Anyway” next to Linky. On macOS 14 and earlier, right-click the app and choose Open. Then allow Accessibility access so Linky can paste for you.'
      }
    ]
  },
  cta: { title: 'Stop hunting for links.', sub: 'Linky installs in a minute. Next time someone asks for your portfolio, you send it with one keystroke.' },
  footer: { made: 'Made by Tony', github: 'GitHub', releases: 'Releases', other: 'Русский' }
}

export type SiteCopy = typeof en

const ru: SiteCopy = {
  metaTitle: 'Linky: ваши ссылки в одно нажатие',
  metaDescription: 'Нажмите Ctrl + Alt + V в любом поле ввода и выберите ссылку. Linky вставит ее туда, где стоит курсор. Бесплатно для Windows и macOS.',
  nav: { how: 'Как работает', features: 'Возможности', faq: 'Вопросы', github: 'GitHub', download: 'Скачать' },
  hero: {
    badge: 'Бесплатно для Windows и macOS',
    title: ['Ваши ссылки', 'в одно', 'нажатие.'],
    sub: 'Нажмите Ctrl + Alt + V в любом поле ввода и выберите ссылку. Linky вставит ее туда, где стоит курсор.',
    windows: 'Скачать для Windows',
    mac: 'Скачать для macOS',
    meta: 'Windows 10+ · macOS 12+ · Записи хранятся только на вашем компьютере'
  },
  demo: { eyebrow: 'как это выглядит', title: 'Две ссылки за 13 секунд, без единой вкладки.' },
  how: {
    eyebrow: 'как это работает',
    title: 'Три шага без вкладок.',
    steps: [
      { title: 'Сохраните то, что отправляете часто', body: 'Портфолио, ссылка на запись, вежливый ответ. Добавьте один раз или сохраните то, что лежит в буфере обмена.' },
      { title: 'Нажмите сочетание в любой программе', body: 'В чате, письме или форме быстрое меню откроется рядом с курсором.' },
      { title: 'Выберите запись, и она вставится', body: 'Стрелками и Enter, кликом или цифрой от 1 до 9. В буфере обмена останется то, что вы копировали.' }
    ],
    saveHint: 'Ctrl N · сохранить из буфера'
  },
  features: {
    eyebrow: 'возможности',
    title: 'Маленькая программа, которая экономит кучу кликов.',
    sub: 'Ваши ссылки и ответы лежат в одном нажатии. В остальное время Linky ждет в трее.',
    items: [
      { title: 'Быстрый поиск', body: 'Наберите пару букв, и Linky найдет ссылку по названию или адресу.' },
      { title: 'Папки', body: 'Работа, личное, ответы. Tab в меню переключает папки.' },
      { title: 'Закрепление и цифры', body: 'Закрепите главные ссылки. У первых девяти есть номер, его можно нажать.' },
      { title: 'Ваш буфер обмена', body: 'После вставки Linky возвращает то, что вы копировали до этого.' },
      { title: 'Подстраивается под вас', body: 'Частые и недавние записи сами поднимаются наверх.' },
      { title: 'Приватность', body: 'Без аккаунта, облака и слежки. Записи лежат в одном файле на вашем компьютере.' }
    ]
  },
  showcase: {
    eyebrow: 'ваша библиотека',
    title: 'Все ссылки в одном месте.',
    sub: 'Редактируйте названия, раскладывайте ссылки по папкам, смотрите, что вставляете чаще. Светлая и темная тема, русский и английский.',
    alt: 'Окно Linky: список сохраненных ссылок с папками и редактор справа'
  },
  faq: {
    eyebrow: 'вопросы',
    title: 'Вопросы и ответы.',
    items: [
      { q: 'Это бесплатно?', a: 'Да. Пока Linky в раннем доступе, он бесплатный. Позже я могу добавить Pro с синхронизацией, а все бесплатное останется бесплатным.' },
      {
        q: 'Работает в любой программе?',
        a: 'Везде, где можно печатать и вставлять: в браузерах, Telegram, Slack, почте, Word и формах. В Windows программы, запущенные от администратора, не принимают вставку из других программ. Там Linky скопирует ссылку, а вы вставите ее через Ctrl+V.'
      },
      { q: 'Где хранятся записи?', a: 'В одном файле на вашем компьютере. У Linky нет аккаунтов и серверов, поэтому данные никуда не уходят.' },
      { q: 'Можно поменять сочетание клавиш?', a: 'Да, в настройках можно выбрать любое. Linky проверит, что его не заняла другая программа.' },
      {
        q: 'macOS пишет, что Linky нельзя открыть',
        a: 'Linky пока не прошел нотаризацию Apple, поэтому macOS один раз просит подтверждения. Попробуйте открыть приложение, затем зайдите в Системные настройки → Конфиденциальность и безопасность, прокрутите вниз и нажмите «Все равно открыть» рядом с Linky. В macOS 14 и старше достаточно кликнуть по приложению правой кнопкой и выбрать «Открыть». Затем разрешите «Универсальный доступ», чтобы Linky мог вставлять за вас.'
      }
    ]
  },
  cta: { title: 'Хватит искать ссылки.', sub: 'Linky устанавливается за минуту. Когда вас снова попросят портфолио, вы отправите его одним нажатием.' },
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
