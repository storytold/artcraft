import {
  IconHorse,
  IconFlask,
  IconBug,
  IconShieldLock,
  IconVideo,
  IconMusic,
  IconMicrophone,
  IconPhoto,
  IconMovie,
  IconBrain,
  IconWand,
  IconSparkles,
  IconRocket,
  IconBolt,
  IconStar,
  IconDownload,
  IconUpload,
  IconMessage,
  IconShare,
  IconCreditCard,
  IconShoppingCart,
  IconWorld,
  IconLock,
  IconEye,
  IconPalette,
  IconCode,
  IconCloud,
  IconDatabase,
  IconCpu,
  IconGauge,
  IconUsers,
  IconFile,
  IconCube,
  IconBrush,
  IconPrinter,
  IconClock,
  IconBell,
  IconGift,
  IconCompass,
  IconEdit,
  IconSettings,
  IconSearch,
  IconBookmark,
  IconTools,
  IconPuzzle,
  IconBulb,
  IconDiamond,
  IconHexagon,
  IconToggleRight,
  IconBadge,
  IconComponents,
} from "@tabler/icons-react";

type FlagIcon = typeof IconHorse;

// Rules are evaluated in order; first match wins. Keys & names are normalized
// so that `happy_horse` and `happy-horse` match `\bhorse\b`.
const rules: Array<[RegExp, FlagIcon]> = [
  [/\bhorse\b/, IconHorse],
  [/\b(beta|experiment|experimental|canary|preview)\b/, IconFlask],
  [/\b(debug|dev|developer)\b/, IconBug],
  [/\b(admin|staff|moderator|mod)\b/, IconShieldLock],
  [/\b(explore|discover|browse)\b/, IconCompass],
  [/\b(studio|workspace|workshop|canvas|editor)\b/, IconBrush],
  [/\b(media|gallery|library|album)\b/, IconPhoto],
  [/\b(movie|film|cinema|reel)\b/, IconMovie],
  [/\bvideo\b/, IconVideo],
  [/\b(audio|music|sound|track)\b/, IconMusic],
  [/\b(voice|speech|tts|microphone|mic)\b/, IconMicrophone],
  [/\b(image|photo|picture|img)\b/, IconPhoto],
  [/\b(ai|ml|neural)\b/, IconBrain],
  [/\b(magic|wand|smart|generate|gen)\b/, IconWand],
  [/\b(sparkle|shiny|glow|new)\b/, IconSparkles],
  [/\b(fast|speed|performance|turbo|boost)\b/, IconRocket],
  [/\b(power|bolt|thunder|energy)\b/, IconBolt],
  [/\b(premium|pro|vip|favorite|featured)\b/, IconStar],
  [/\b(download|export)\b/, IconDownload],
  [/\b(upload|import)\b/, IconUpload],
  [/\b(chat|message|dm|comment|prompt)\b/, IconMessage],
  [/\b(referral|referrals|invite|invites|share|social|post)\b/, IconShare],
  [/\b(credit|billing|payment|pay|checkout|subscription|sub)\b/, IconCreditCard],
  [/\b(store|shop|market|cart)\b/, IconShoppingCart],
  [/\b(world|public|global|web)\b/, IconWorld],
  [/\b(private|secret|hidden|lock)\b/, IconLock],
  [/\b(view|preview|show|visible|reveal)\b/, IconEye],
  [/\b(theme|color|palette|design|style)\b/, IconPalette],
  [/\b(brush|paint|draw|art)\b/, IconBrush],
  [/\b(print|printer)\b/, IconPrinter],
  [/\b(code|api|endpoint|script)\b/, IconCode],
  [/\bcloud\b/, IconCloud],
  [/\b(data|database|storage|table)\b/, IconDatabase],
  [/\b(cpu|compute|gpu|processor|render)\b/, IconCpu],
  [/\b(gauge|metric|monitor|analytics|stat)\b/, IconGauge],
  [/\b(user|team|collab|collaboration|member|profile)\b/, IconUsers],
  [/\b(file|document|doc)\b/, IconFile],
  [/\b(3d|dimensional|mesh|model)\b/, IconCube],
  [/\b(time|clock|schedule|timer|history)\b/, IconClock],
  [/\b(notification|bell|alert)\b/, IconBell],
  [/\b(gift|reward|promo|promotion|bonus)\b/, IconGift],
  [/\b(edit|update|modify)\b/, IconEdit],
  [/\b(settings|config|configuration|preference)\b/, IconSettings],
  [/\b(search|find|query|lookup)\b/, IconSearch],
  [/\b(bookmark|save|favorite)\b/, IconBookmark],
  [/\b(tool|toolkit|utility)\b/, IconTools],
  [/\b(component|module|plugin)\b/, IconComponents],
  [/\b(feature|toggle|switch|enable)\b/, IconToggleRight],
];

// Visually-varied fallback set so no flag ends up on a plain flag icon.
const fallbackIcons: FlagIcon[] = [
  IconPuzzle,
  IconBulb,
  IconDiamond,
  IconHexagon,
  IconToggleRight,
  IconBadge,
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getFeatureFlagIcon(flag: {
  key: string;
  full_name?: string;
}): FlagIcon {
  const normalized = `${flag.key} ${flag.full_name ?? ""}`
    .toLowerCase()
    .replace(/[_-]/g, " ");
  for (const [pattern, icon] of rules) {
    if (pattern.test(normalized)) return icon;
  }
  return fallbackIcons[hashString(flag.key) % fallbackIcons.length];
}
