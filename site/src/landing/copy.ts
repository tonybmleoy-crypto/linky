import type { Lang } from '@shared/i18n'
import type { FolderColor, Snippet } from '@shared/model'

/*
 * Copy rules: no em dashes, no "ё" in Russian, active voice, no slogan-style fragments.
 * Headings are arrays of lines: the layout reveals them line by line. A `muted` line is dimmed,
 * a `pill` sits inline after the words (Figma: Marketing/Inline pill).
 */

export type Pill = 'link' | 'keys' | 'glow'
export interface HeadingLine {
  text: string
  muted?: boolean
  pill?: Pill
}

export interface UseCase {
  tag: string
  title: string
  body?: string
  row: { title: string; content: string; kind: Snippet['kind'] }
  tone: FolderColor
}

const en = {
  metaTitle: 'Linky: your links, one keystroke away',
  metaDescription: 'Press Ctrl + Alt + V in any text field and pick a link. Linky pastes it where you were typing. Free for Windows and macOS.',
  nav: { home: 'Home', how: 'How it works', features: 'Features', uses: 'Who it’s for', faq: 'FAQ', download: 'Download' },
  hero: {
    title: ['Your links,', 'one keystroke away'],
    sub: 'Press Ctrl + Alt + V in any text field and pick a link. Linky pastes it where you were typing.',
    windows: 'Download for Windows',
    mac: 'Download for macOS',
    meta: 'Windows 10+ · macOS 12+ · Your snippets stay on your computer'
  },
  how: {
    title: ['Three steps,', 'no tabs'],
    sub: 'Save a link once. After that it shows up at your cursor in any app.',
    steps: [
      { title: 'Save what you send often', body: 'Portfolio, a booking link, a polite reply. Add it once, or save what’s on your clipboard.' },
      { title: 'Press the shortcut in any app', body: 'In a chat, an email or a form, the quick menu opens next to your cursor.' },
      { title: 'Pick a snippet and it’s pasted', body: 'Use the arrow keys and Enter, click, or press 1 to 9. Your clipboard keeps what you copied.' }
    ],
    saveHint: 'save from clipboard',
    demo: 'Watch the demo'
  },
  present: {
    title: [
      { text: 'Pastes it', pill: 'link' },
      { text: 'right where', muted: true, pill: 'keys' },
      { text: 'you type' }
    ] as HeadingLine[],
    body: 'Linky waits in the tray. The menu opens at your text cursor, and after you pick a link Linky returns focus to the app and pastes it for you. Your clipboard stays untouched.',
    cta: 'Download for free',
    library: {
      title: [{ text: 'All your links' }, { text: 'in one place', muted: true }] as HeadingLine[],
      body: 'Edit titles, sort links into folders, see what you paste most. Light and dark themes, English and Russian.'
    },
    demoLabel: 'Linky demo',
    libraryAlt: 'The Linky window: a list of saved links with folders and an editor on the right'
  },
  features: {
    title: [
      { text: 'A small app', pill: 'glow' },
      { text: 'that saves you', muted: true },
      { text: 'a lot of clicks' }
    ] as HeadingLine[],
    prev: 'Previous',
    next: 'Next',
    items: [
      { title: 'Instant search', body: 'Type a few letters and Linky finds the link by title or URL.' },
      { title: 'Folders', body: 'Work, personal, replies. Press Tab in the menu to switch between them.' },
      { title: 'Pins and quick keys', body: 'Pin your top links. The first nine get a number you can press.' },
      { title: 'Your clipboard stays yours', body: 'After pasting, Linky puts back what you had copied before.' },
      { title: 'Learns your habits', body: 'Links you use often and recently move to the top on their own.' },
      { title: 'Private by design', body: 'No account, no cloud, no tracking. Your snippets live in one file on your computer.' }
    ]
  },
  uses: {
    title: 'Who it’s for',
    items: [
      {
        tag: 'Designers',
        title: 'Portfolio and Behance in any chat',
        body: 'Send links to your work in Telegram, email and on freelance platforms without opening a tab.',
        row: { title: 'Portfolio', content: 'lopatinanton.vercel.app', kind: 'link' },
        tone: 'peach'
      },
      { tag: 'Sales', title: 'Your booking link on key 2', row: { title: 'Book a 30-min call', content: 'cal.com/tony/30min', kind: 'link' }, tone: 'sky' },
      { tag: 'Recruiters', title: 'Job posts and email templates', row: { title: 'Job: product designer', content: 'Link to the job post', kind: 'link' }, tone: 'mint' },
      { tag: 'Support', title: 'Canned replies without copy-paste', row: { title: 'Quick reply', content: 'Thanks! I’ll get back to you within a day.', kind: 'text' }, tone: 'lilac' },
      { tag: 'Freelancers', title: 'Payment details in a second', row: { title: 'Payment details', content: 'Bank, account, SWIFT', kind: 'text' }, tone: 'rose' }
    ] as UseCase[]
  },
  faq: {
    title: ['Questions', 'and answers'],
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
  cta: {
    title: ['Stop hunting', 'for links'],
    sub: 'Linky installs in a minute. Next time someone asks for your portfolio, you send it with one keystroke.'
  },
  footer: { made: 'Made by Tony', github: 'GitHub', releases: 'Releases', other: 'Русский' }
}

export type SiteCopy = typeof en

const ru: SiteCopy = {
  metaTitle: 'Linky: ваши ссылки в одно нажатие',
  metaDescription: 'Нажмите Ctrl + Alt + V в любом поле ввода и выберите ссылку. Linky вставит ее туда, где стоит курсор. Бесплатно для Windows и macOS.',
  nav: { home: 'Главная', how: 'Как работает', features: 'Возможности', uses: 'Для кого', faq: 'Вопросы', download: 'Скачать' },
  hero: {
    title: ['Ваши ссылки', 'в одно нажатие'],
    sub: 'Нажмите Ctrl + Alt + V в любом поле ввода и выберите ссылку. Linky вставит ее туда, где стоит курсор.',
    windows: 'Скачать для Windows',
    mac: 'Скачать для macOS',
    meta: 'Windows 10+ · macOS 12+ · Записи хранятся только на вашем компьютере'
  },
  how: {
    title: ['Три шага', 'без вкладок'],
    sub: 'Сохраните ссылку один раз. Дальше она появляется у курсора в любой программе.',
    steps: [
      { title: 'Сохраните то, что отправляете часто', body: 'Портфолио, ссылка на запись, вежливый ответ. Добавьте один раз или сохраните то, что лежит в буфере обмена.' },
      { title: 'Нажмите сочетание в любой программе', body: 'В чате, письме или форме быстрое меню откроется рядом с курсором.' },
      { title: 'Выберите запись, и она вставится', body: 'Стрелками и Enter, кликом или цифрой от 1 до 9. В буфере обмена останется то, что вы копировали.' }
    ],
    saveHint: 'сохранить из буфера',
    demo: 'Смотреть демо'
  },
  present: {
    title: [
      { text: 'Вставляет', pill: 'link' },
      { text: 'туда, где', muted: true, pill: 'keys' },
      { text: 'стоит курсор' }
    ],
    body: 'Linky ждет в трее. Меню появляется у текстового курсора, а после выбора возвращает фокус в программу и вставляет ссылку сам. Буфер обмена остается нетронутым.',
    cta: 'Скачать бесплатно',
    library: {
      title: [{ text: 'Все ссылки' }, { text: 'в одном месте', muted: true }],
      body: 'Редактируйте названия, раскладывайте ссылки по папкам, смотрите, что вставляете чаще. Светлая и темная тема, русский и английский.'
    },
    demoLabel: 'Демонстрация Linky',
    libraryAlt: 'Окно Linky: список сохраненных ссылок с папками и редактор справа'
  },
  features: {
    title: [
      { text: 'Маленькая программа,', pill: 'glow' },
      { text: 'которая экономит', muted: true },
      { text: 'кучу кликов' }
    ],
    prev: 'Назад',
    next: 'Дальше',
    items: [
      { title: 'Быстрый поиск', body: 'Наберите пару букв, и Linky найдет ссылку по названию или адресу.' },
      { title: 'Папки', body: 'Работа, личное, ответы. Tab в меню переключает папки.' },
      { title: 'Закрепление и цифры', body: 'Закрепите главные ссылки. У первых девяти есть номер, его можно нажать.' },
      { title: 'Ваш буфер обмена', body: 'После вставки Linky возвращает то, что вы копировали до этого.' },
      { title: 'Подстраивается под вас', body: 'Частые и недавние записи сами поднимаются наверх.' },
      { title: 'Приватность', body: 'Без аккаунта, облака и слежки. Записи лежат в одном файле на вашем компьютере.' }
    ]
  },
  uses: {
    title: 'Кому пригодится',
    items: [
      {
        tag: 'Дизайнерам',
        title: 'Портфолио и Behance в любом чате',
        body: 'Отправляйте ссылки на работы в Telegram, почте и на фриланс-биржах, не открывая вкладки.',
        row: { title: 'Портфолио', content: 'lopatinanton.vercel.app', kind: 'link' },
        tone: 'peach'
      },
      { tag: 'Продажам', title: 'Ссылка на календарь цифрой 2', row: { title: 'Созвон на 30 минут', content: 'cal.com/tony/30min', kind: 'link' }, tone: 'sky' },
      { tag: 'Рекрутерам', title: 'Вакансии и шаблоны писем', row: { title: 'Вакансия: продуктовый дизайнер', content: 'Ссылка на вакансию', kind: 'link' }, tone: 'mint' },
      { tag: 'Поддержке', title: 'Типовые ответы без копипаста', row: { title: 'Быстрый ответ', content: 'Спасибо! Отвечу в течение дня.', kind: 'text' }, tone: 'lilac' },
      { tag: 'Фрилансерам', title: 'Реквизиты и прайс за секунду', row: { title: 'Реквизиты для оплаты', content: 'ИП, счет, БИК', kind: 'text' }, tone: 'rose' }
    ]
  },
  faq: {
    title: ['Вопросы', 'и ответы'],
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
  cta: {
    title: ['Хватит', 'искать ссылки'],
    sub: 'Linky устанавливается за минуту. Когда вас снова попросят портфолио, вы отправите его одним нажатием.'
  },
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
