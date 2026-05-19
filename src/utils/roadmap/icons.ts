const LINEAR_ICON_EMOJI: Record<string, string> = {
  AiDocument: '📄',
  AlarmClock: '⏰',
  Asterisk: '✳️',
  Basket: '🧺',
  Bookmark: '🔖',
  Bug: '🐛',
  Calendar: '📅',
  Chart: '📊',
  Chrome: '🌐',
  CodeBlock: '💻',
  CreditCard: '💳',
  Dashboard: '📊',
  Direction: '➡️',
  Dollar: '💲',
  DollarBill: '💵',
  Education: '🎓',
  Favorite: '⭐',
  GitHub: '🐙',
  Golf: '⛳',
  Hack: '💻',
  IssueStatusBacklog: '⏳',
  Leaf: '🍃',
  Lock: '🔒',
  Mic: '🎤',
  MobilePhone: '📱',
  Modem: '📡',
  MoneyStack: '💰',
  NotePad: '📝',
  Phone: '📞',
  Project: '📁',
  Robot: '🤖',
  Rocket: '🚀',
  Routing: '🔀',
  Shrug: '🤷',
  Stadium: '🏟️',
  Surfer: '🏄',
  Users: '👥',
  Write: '✍️'
}

const SLACK_EMOJI: Record<string, string> = {
  ':flag-ca:': '🇨🇦',
  ':flag-eu:': '🇪🇺',
  ':flag-za:': '🇿🇦',
  ':us:': '🇺🇸'
}

export function resolveIcon(icon: string | null | undefined): string | null {
  if (!icon) return null
  if (SLACK_EMOJI[icon]) return SLACK_EMOJI[icon]
  if (LINEAR_ICON_EMOJI[icon]) return LINEAR_ICON_EMOJI[icon]
  if (/\p{Emoji_Presentation}/u.test(icon)) return icon
  return null
}
