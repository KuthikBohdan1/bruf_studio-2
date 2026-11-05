import { usePathname } from '@/lib/router'

/**
 * Two site languages. Ukrainian lives at the root, English under `/en/`
 * (mirrored by the URL patterns in django/config/urls.py). Content comes from
 * the API already translated (`?lang=en`); this file holds the interface copy.
 */
export type Lang = 'uk' | 'en'

export const LANGS: readonly Lang[] = ['uk', 'en']

const EN_PREFIX = '/en'

export function langOf(pathname: string): Lang {
  return pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`) ? 'en' : 'uk'
}

/** `/en/blog/` → `/blog/`: the route without its language prefix. */
export function routeOf(pathname: string): string {
  return langOf(pathname) === 'en' ? pathname.slice(EN_PREFIX.length) || '/' : pathname
}

// Server paths that are the same for both languages.
const SHARED = /^\/(api|admin|media|static)\//

/** Adds `/en` to an internal `/path` or `/#anchor` on the English site; leaves everything else alone. */
export function localizeHref(href: string, lang: Lang): string {
  if (lang === 'uk' || !href.startsWith('/') || href.startsWith('//') || SHARED.test(href)) return href
  if (langOf(href) === 'en') return href
  return `${EN_PREFIX}${href}`
}

/** The same page in another language, e.g. `/blog/x/` ↔ `/en/blog/x/`. */
export function switchLanguage(pathname: string, hash: string, to: Lang): string {
  return localizeHref(routeOf(pathname), to) + hash
}

export function useLang(): Lang {
  return langOf(usePathname())
}

const uk = {
  locale: 'uk-UA',
  skipToContent: 'Перейти до змісту',
  languageName: 'Українська',
  switchTo: 'Українська версія',

  nav: {
    main: 'Головне меню',
    home: 'на головну',
    projects: 'Кейси',
    pricing: 'Послуги й ціни',
    siteTypes: 'Які сайти',
    process: 'Процес',
    blog: 'Блог',
    faq: 'Питання',
    contact: 'Контакти',
    toTop: 'На початок',
    menu: 'Меню',
    close: 'Закрити',
  },
  cta: {
    discuss: 'Обговорити проєкт',
    discussShort: 'Обговорити',
    ourWork: 'Наші роботи',
  },
  theme: { toLight: 'Увімкнути світлу тему', toDark: 'Увімкнути темну тему' },

  hero: {
    services: 'Що робимо',
    scroll: 'Гортати далі',
  },
  cases: {
    title: 'Що ми зробили і що це дало клієнтам',
    count: (count: string) => `${count} проєкти`,
    open: 'Дивитись кейс',
  },
  pricing: {
    title: 'Скільки коштує сайт',
    factorsTitle: 'Від чого залежить ціна',
    factors: [
      'Кількість сторінок і блоків',
      'Унікальний дизайн чи адаптація готового',
      'Анімації та 3D-сцени',
      'Інтеграції: оплата, доставка, CRM, Telegram',
      'Тексти й фото — ваші чи готуємо разом',
      'Терміновість запуску',
    ],
    note: 'Точну суму називаємо після короткого брифу й фіксуємо в договорі — без доплат посеред роботи.',
    readMore: 'Детальніше в блозі',
    allArticles: 'Усі статті',
    telegram: 'Написати в Telegram',
    request: 'або залишити заявку',
    bannerTitle: 'Найшвидше — напишіть у Telegram',
    bannerText: 'Кількома словами опишіть задачу — назвемо ціну й терміни в тому ж діалозі. Можна голосовим.',
  },
  telegramButton: { label: (handle: string) => `Написати в Telegram ${handle}`, short: 'Telegram' },
  telegram: {
    /** Pre-filled in the chat that every Telegram button opens. */
    message: '👋 Потрібно обговорити проєкт',
    about: (topic: string) => `👋 Потрібно обговорити проєкт: ${topic}`,
    cta: 'Написати в Telegram',
    request: 'або залишити заявку на сайті',
  },
  siteTypes: { title: 'Які сайти ми створюємо', examples: 'Приклади' },
  process: {
    title: 'Як ми працюємо',
    leadBefore: 'Від старту до робочої версії\u00a0— ',
    leadMarked: '7 днів',
    day: (day: number) => `День ${day}`,
    start: 'Почати проєкт у Telegram',
    startNote: 'Напишіть сьогодні — завтра вже буде бриф, а за тиждень робоча версія сайту.',
    intro: 'Кожен етап закінчується результатом, який ви бачите й приймаєте. Ніяких «ще два тижні, і покажемо».',
  },
  facts: { label: 'Студія в цифрах' },
  faq: { title: 'Те, про що питають на першому дзвінку' },

  contact: {
    title: 'Розкажіть про вашу задачу',
    reply: 'Відповідаємо протягом робочого дня',
    email: 'Пошта',
    phone: 'Телефон',
    address: 'Де ми',
  },
  form: {
    projectType: 'Що потрібно?',
    other: 'Інше',
    name: "Ім'я",
    namePlaceholder: 'Як до вас звертатися',
    method: "Як з вами зв'язатися?",
    methods: { telegram: 'Telegram', phone: 'Телефон', email: 'Email' },
    telegram: 'Нік або номер у Telegram',
    phone: 'Телефон',
    email: 'Email',
    budget: 'Орієнтовний бюджет',
    budgets: {
      lt10: 'до 10 тис. ₴',
      '10-20': '10–20 тис. ₴',
      '20-30': '20–30 тис. ₴',
      gt30: 'понад 30 тис. ₴',
      unknown: 'ще не знаю',
    },
    message: 'Кілька слів про задачу',
    optional: "необов'язково",
    messagePlaceholder: 'Що треба зробити, до якого терміну, що вже є',
    sending: 'Надсилаємо…',
    submit: 'Надіслати заявку',
    consent: 'Натискаючи кнопку, ви погоджуєтесь, що ми зв’яжемося з вами щодо проєкту. Без розсилок.',
    privacy: 'Політика конфіденційності',
    networkError: 'Помилка мережі — спробуйте ще раз.',
    sentTitle: 'Заявку отримали',
    sentText: 'Дякуємо! Відповімо протягом робочого дня — тим способом, який ви обрали.',
    sendAnother: 'Надіслати ще одну',
  },
  social: {
    telegramLabel: 'Найшвидше — Telegram',
    telegramText: 'Пишіть одразу, без форм. Можна голосовим.',
    instagramText: 'Процес, бекстейдж і нові кейси — раніше, ніж вони з’являться тут.',
  },
  footer: {
    newProject: 'Новий проєкт',
    site: 'Сайт',
    services: 'Послуги',
    socials: 'Соцмережі',
    studioTime: 'Час у студії',
    privacy: 'Конфіденційність',
    toTop: 'Нагору',
    madeIn: 'Зроблено в Україні',
  },

  servicePage: {
    all: 'Усі послуги',
    more: 'Детальніше про послугу',
    included: 'Що входить',
    details: 'Детальніше',
    process: 'Від старту до робочої версії — 7 днів: бриф, прототип, дизайн, розробка, тестування й запуск. Кожен етап закінчується результатом, який ви бачите.',
    processLink: 'Як це відбувається',
    cases: 'Наші роботи',
    ctaTitle: 'Обговоримо ваш проєкт?',
    ctaText: 'Опишіть задачу кількома словами — назвемо ціну й терміни в тому ж діалозі.',
    others: 'Інші послуги',
  },
  casePage: {
    service: 'Послуга',
    all: 'Усі кейси',
    client: 'Клієнт',
    year: 'Рік',
    category: 'Напрям',
    site: 'Сайт',
    challenge: 'Задача',
    solution: 'Рішення',
    result: 'Результат',
    stack: 'Технології',
    metrics: 'Результати в цифрах',
    gallery: 'Галерея',
    next: 'Наступний кейс',
    whatNext: 'Що далі',
    similar: 'Маєте схожу задачу?',
    similarText: 'Розкажіть про неї — за день повернемося з питаннями або планом.',
    title: (title: string, site: string) => `${title} | кейс ${site}`,
  },
  blog: {
    label: 'Блог студії',
    heading: 'Блог',
    /** Mirrors the blog description in django/main/seo.py (COPY). */
    intro: 'Пишемо про сайти для бізнесу: скільки коштують, як працюють, як приводять клієнтів із Google.',
    title: (site: string) => `Блог ${site} — про сайти, ціни й розробку`,
    empty: 'Перші статті вже пишуться.',
    nothing: 'Нічого не знайшли.',
    showAll: 'Показати всі статті',
    categories: 'Рубрики',
    allPosts: 'Усі статті',
    search: 'Пошук статей',
    pages: 'Сторінки блогу',
    nextPage: 'Наступна сторінка',
    read: 'Читати статтю',
    minutes: (minutes: number, long: boolean) => `${minutes} хв${long ? ' читання' : ''}`,
    categoryNames: {
      guides: 'Гайди',
      seo: 'SEO',
      comparison: 'Порівняння',
      cases: 'Кейси',
      speed: 'Швидкість',
      studio: 'Студія',
    },
  },
  post: {
    all: 'Усі статті',
    ctaLabel: 'Обговорити проєкт',
    ctaTitle: 'Порахуємо ваш сайт?',
    ctaText: 'Опишіть задачу — відповімо з оцінкою термінів і вартості.',
    telegram: 'Написати в Telegram',
    request: 'Залишити заявку',
    more: 'Читати далі',
  },
  newsletter: {
    label: 'Розсилка',
    title: 'Напишемо, коли вийде нова стаття',
    consent: 'Лише про нові статті. Відписатися можна будь-коли.',
    submit: 'Підписатися',
    sending: 'Підписуємо…',
    sent: (email: string) => `Готово — напишемо на ${email}, коли вийде нова стаття.`,
    error: 'Не вдалося підписатися. Спробуйте ще раз.',
  },
  privacy: {
    title: 'Політика конфіденційності',
    home: 'На головну',
    updated: 'Оновлено 5 листопада 2026',
    sections: [
      {
        title: 'Які дані ми збираємо',
        text: 'Лише те, що ви самі залишаєте у формах: ім’я, контакт (Telegram, телефон або email), тип сайту, бюджет і текст повідомлення. У блозі — email, якщо ви підписалися на нові статті.',
      },
      {
        title: 'Навіщо вони потрібні',
        text: 'Щоб відповісти на вашу заявку й обговорити проєкт, а для підписників — щоб повідомити про нову статтю. Ми не продаємо ці дані й не передаємо їх для реклами.',
      },
      {
        title: 'Де вони зберігаються',
        text: 'На сервері сайту, доступ до них має лише студія. Сповіщення про нову заявку може надходити нам через Telegram. Заявки ми зберігаємо стільки, скільки потрібно для роботи над проєктом.',
      },
      {
        title: 'Файли cookie й аналітика',
        text: 'Сайт не використовує рекламних і аналітичних cookie. У браузері зберігається лише ваш вибір теми, і він лишається на вашому пристрої.',
      },
      {
        title: 'Ваші права',
        text: 'Ви можете попросити показати, виправити або видалити ваші дані чи відписатися від статей. Напишіть нам, і ми зробимо це.',
      },
    ],
  },
  notFound: {
    title: 'Сторінку не знайдено',
    label: 'Помилка 404',
    before: 'Це не та сторінка, ',
    marked: 'яку ви шукаєте',
    text: 'Можливо, її перейменували або прибрали. Рухайтеся далі — решта робіт на головній.',
    back: 'До кейсів',
    jump: 'Стрибнути в гіперпростір',
  },
  eggs: {
    darkSideTitle: 'Ласкаво просимо на темний бік.',
    darkSideText: 'Печива не буде — зате сайт за 7 днів.',
  },
  status: {
    loading: 'Завантаження',
    errorTitle: 'Не вдалося завантажити сайт',
    retry: 'Спробувати ще раз',
    emptyTitle: 'Контенту ще немає',
    emptyText: 'У базі немає налаштувань сайту. Додайте їх в адмінці або завантажте демо-контент командою',
    admin: 'Відкрити адмінку',
  },
  api: {
    throttled: 'Забагато запитів. Спробуйте трохи пізніше.',
    checkFields: 'Перевірте виділені поля.',
    failed: (status: number) => `Помилка запиту (${status}).`,
  },
}

export type Strings = typeof uk

const en: Strings = {
  locale: 'en-GB',
  skipToContent: 'Skip to content',
  languageName: 'English',
  switchTo: 'English version',

  nav: {
    main: 'Main menu',
    home: 'home',
    projects: 'Work',
    pricing: 'Services & prices',
    siteTypes: 'What we build',
    process: 'Process',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    toTop: 'Back to top',
    menu: 'Menu',
    close: 'Close',
  },
  cta: {
    discuss: 'Discuss a project',
    discussShort: 'Discuss',
    ourWork: 'Our work',
  },
  theme: { toLight: 'Switch to light theme', toDark: 'Switch to dark theme' },

  hero: {
    services: 'What we do',
    scroll: 'Scroll down',
  },
  cases: {
    title: 'What we built and what it gave our clients',
    count: (count: string) => `${count} projects`,
    open: 'View case',
  },
  pricing: {
    title: 'What a website costs',
    factorsTitle: 'What the price depends on',
    factors: [
      'Number of pages and sections',
      'Custom design or an adapted template',
      'Animation and 3D scenes',
      'Integrations: payments, delivery, CRM, Telegram',
      'Copy and photos — yours, or we prepare them together',
      'How soon it has to launch',
    ],
    note: 'We name the exact sum after a short brief and fix it in the contract — no surprise extras halfway through.',
    readMore: 'More on the blog',
    allArticles: 'All articles',
    telegram: 'Message on Telegram',
    request: 'or leave a request',
    bannerTitle: 'Fastest — message us on Telegram',
    bannerText: 'Describe the task in a few words — we will name the price and timeline in the same chat. Voice messages are fine.',
  },
  telegramButton: { label: (handle: string) => `Message on Telegram ${handle}`, short: 'Telegram' },
  telegram: {
    message: '👋 I’d like to discuss a project',
    about: (topic: string) => `👋 I’d like to discuss a project: ${topic}`,
    cta: 'Message on Telegram',
    request: 'or leave a request on the site',
  },
  siteTypes: { title: 'What sites we build', examples: 'Examples' },
  process: {
    title: 'How we work',
    leadBefore: 'From kick-off to a working version\u00a0— ',
    leadMarked: '7 days',
    day: (day: number) => `Day ${day}`,
    start: 'Start a project on Telegram',
    startNote: 'Write today — the brief is tomorrow, and a working version of the site is a week away.',
    intro: 'Every stage ends with a result you can see and sign off. No “two more weeks and we’ll show you”.',
  },
  facts: { label: 'The studio in numbers' },
  faq: { title: 'What people ask on the first call' },

  contact: {
    title: 'Tell us about your project',
    reply: 'We reply within one working day',
    email: 'Email',
    phone: 'Phone',
    address: 'Where we are',
  },
  form: {
    projectType: 'What do you need?',
    other: 'Other',
    name: 'Name',
    namePlaceholder: 'How should we address you',
    method: 'How should we reach you?',
    methods: { telegram: 'Telegram', phone: 'Phone', email: 'Email' },
    telegram: 'Telegram username or number',
    phone: 'Phone',
    email: 'Email',
    budget: 'Approximate budget',
    budgets: {
      lt10: 'up to ₴10k',
      '10-20': '₴10–20k',
      '20-30': '₴20–30k',
      gt30: 'over ₴30k',
      unknown: 'not sure yet',
    },
    message: 'A few words about the task',
    optional: 'optional',
    messagePlaceholder: 'What needs doing, by when, what you already have',
    sending: 'Sending…',
    submit: 'Send request',
    consent: 'By pressing the button you agree that we will contact you about the project. No newsletters.',
    privacy: 'Privacy policy',
    networkError: 'Network error — please try again.',
    sentTitle: 'Request received',
    sentText: 'Thank you! We will reply within one working day — the way you chose.',
    sendAnother: 'Send another one',
  },
  social: {
    telegramLabel: 'Fastest — Telegram',
    telegramText: 'Write straight away, no forms. Voice messages are fine.',
    instagramText: 'Process, behind the scenes and new cases — before they show up here.',
  },
  footer: {
    newProject: 'New project',
    site: 'Site',
    services: 'Services',
    socials: 'Social',
    studioTime: 'Studio time',
    privacy: 'Privacy',
    toTop: 'Back to top',
    madeIn: 'Made in Ukraine',
  },

  servicePage: {
    all: 'All services',
    more: 'More about this service',
    included: 'What is included',
    details: 'In detail',
    process: 'From kick-off to a working version in 7 days: brief, prototype, design, development, testing and launch. Every stage ends with a result you can see.',
    processLink: 'How it goes',
    cases: 'Our work',
    ctaTitle: 'Shall we discuss your project?',
    ctaText: 'Describe the task in a few words — we will name the price and timeline in the same chat.',
    others: 'Other services',
  },
  casePage: {
    service: 'Service',
    all: 'All cases',
    client: 'Client',
    year: 'Year',
    category: 'Type',
    site: 'Website',
    challenge: 'Challenge',
    solution: 'Solution',
    result: 'Result',
    stack: 'Stack',
    metrics: 'Results in numbers',
    gallery: 'Gallery',
    next: 'Next case',
    whatNext: 'What next',
    similar: 'Have a similar task?',
    similarText: 'Tell us about it — within a day we will come back with questions or a plan.',
    title: (title: string, site: string) => `${title} | case study ${site}`,
  },
  blog: {
    label: 'Studio blog',
    heading: 'Blog',
    intro: 'On websites for business: what they cost, how they work and how they bring clients from Google.',
    title: (site: string) => `${site} blog — websites, prices and development`,
    empty: 'The first articles are on their way.',
    nothing: 'Nothing found.',
    showAll: 'Show all articles',
    categories: 'Topics',
    allPosts: 'All articles',
    search: 'Search articles',
    pages: 'Blog pages',
    nextPage: 'Next page',
    read: 'Read the article',
    minutes: (minutes: number, long: boolean) => `${minutes} min${long ? ' read' : ''}`,
    categoryNames: {
      guides: 'Guides',
      seo: 'SEO',
      comparison: 'Comparisons',
      cases: 'Cases',
      speed: 'Speed',
      studio: 'Studio',
    },
  },
  post: {
    all: 'All articles',
    ctaLabel: 'Discuss a project',
    ctaTitle: 'Shall we estimate your website?',
    ctaText: 'Describe the task — we will reply with a timeline and a price.',
    telegram: 'Message on Telegram',
    request: 'Leave a request',
    more: 'Read next',
  },
  newsletter: {
    label: 'Newsletter',
    title: 'We will write when a new article is out',
    consent: 'Only about new articles. Unsubscribe any time.',
    submit: 'Subscribe',
    sending: 'Subscribing…',
    sent: (email: string) => `Done — we will write to ${email} when a new article is out.`,
    error: 'Could not subscribe. Please try again.',
  },
  privacy: {
    title: 'Privacy policy',
    home: 'Home',
    updated: 'Updated 5 November 2026',
    sections: [
      {
        title: 'What we collect',
        text: 'Only what you leave in the forms yourself: your name, a contact (Telegram, phone or email), the website type, budget and your message. On the blog, your email if you subscribe to new articles.',
      },
      {
        title: 'Why we need it',
        text: 'To answer your request and discuss the project, and to tell subscribers about a new article. We do not sell this data or pass it on for advertising.',
      },
      {
        title: 'Where it is kept',
        text: 'On the site’s server, available only to the studio. We may get a notification about a new request through Telegram. Requests are kept for as long as the project work needs them.',
      },
      {
        title: 'Cookies and analytics',
        text: 'The site uses no advertising or analytics cookies. The browser only keeps your theme choice, and it stays on your device.',
      },
      {
        title: 'Your rights',
        text: 'You can ask us to show, correct or delete your data, or to unsubscribe you from articles. Write to us and we will do it.',
      },
    ],
  },
  notFound: {
    title: 'Page not found',
    label: 'Error 404',
    before: 'This is not the page ',
    marked: 'you are looking for',
    text: 'It may have been renamed or removed. Move along — the rest of our work is on the home page.',
    back: 'To our work',
    jump: 'Jump to hyperspace',
  },
  eggs: {
    darkSideTitle: 'Welcome to the dark side.',
    darkSideText: 'No cookies, sorry — but a website in 7 days.',
  },
  status: {
    loading: 'Loading',
    errorTitle: 'Could not load the site',
    retry: 'Try again',
    emptyTitle: 'No content yet',
    emptyText: 'The database has no site settings. Add them in the admin or load the demo content with',
    admin: 'Open the admin',
  },
  api: {
    throttled: 'Too many requests. Please try again a little later.',
    checkFields: 'Check the highlighted fields.',
    failed: (status: number) => `Request failed (${status}).`,
  },
}

export const STRINGS: Record<Lang, Strings> = { uk, en }

/** Interface copy in the current page's language. */
export function useT(): Strings {
  return STRINGS[useLang()]
}
