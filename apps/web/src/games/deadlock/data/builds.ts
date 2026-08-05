export type AbilitySlot = 1 | 2 | 3 | 4;

export type BuildAuthorRole = 'coach' | 'community' | 'pro';

export type BuildPlaystyle =
  | 'gun'
  | 'spirit'
  | 'bruiser'
  | 'tank'
  | 'assassin'
  | 'support'
  | 'flex';

export interface BuildPhase {
  id: string;
  label: string;
  itemIds: string[];
}

export interface AbilityPoint {
  level: number;
  abilitySlot: AbilitySlot;
}

export interface DeadlockBuild {
  id: string;
  heroId: string;
  title: string;
  author: string;
  authorRole: BuildAuthorRole;
  rating: number;
  votes: number;
  updatedAt: string;
  playstyles: BuildPlaystyle[];
  maxedFirst: AbilitySlot;
  phases: BuildPhase[];
  abilityOrder: AbilityPoint[];
  coachNotes: string;
  whyItWorks: string;
  /** Curated sample stats — always estimates unless from live match ingest */
  sampleMatches: number;
  sampleWinRate: number;
  isEstimate: boolean;
}

function phase(label: string, itemIds: string[]): BuildPhase {
  return {
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    itemIds,
  };
}

/** Simple ladder: put points into max target early, then fill others. */
function ladder(maxFirst: AbilitySlot, levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]): AbilityPoint[] {
  const others = ([1, 2, 3, 4] as AbilitySlot[]).filter((s) => s !== maxFirst);
  const order: AbilitySlot[] = [maxFirst, others[0], maxFirst, others[1], maxFirst, others[2], maxFirst, others[0], maxFirst, others[1], maxFirst, 4];
  return levels.map((level, i) => ({ level, abilitySlot: order[i] ?? 4 }));
}

export const DEADLOCK_BUILDS: DeadlockBuild[] = [
  {
    id: 'abrams-frontline-brawler',
    heroId: 'abrams',
    title: 'Frontline Brawler',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.8,
    votes: 42,
    updatedAt: '2026-07-28',
    playstyles: ['bruiser', 'tank', 'gun'],
    maxedFirst: 1,
    phases: [
      phase('Early', ['extra-regen', 'close-quarters', 'restorative-shot', 'extra-health', 'sprint-boots']),
      phase('Core', ['point-blank', 'bullet-lifesteal', 'trophy-collector', 'superior-duration', 'reactive-barrier']),
      phase('Luxury', ['phantom-strike', 'dispel-magic', 'colossus', 'siphon-bullets', 'juggernaut']),
    ],
    abilityOrder: ladder(1),
    coachNotes:
      'Stay glued to the front line. Siphon Life uptime wins trades — buy sustain early so you can keep pressing.',
    whyItWorks:
      'Abrams wants close-range gun + regen to force messy fights. Point Blank and lifesteal turn every charge into a heal window.',
    sampleMatches: 180,
    sampleWinRate: 54.2,
    isEstimate: true,
  },
  {
    id: 'abrams-spirit-slam',
    heroId: 'abrams',
    title: 'Spirit Slam Path',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.4,
    votes: 19,
    updatedAt: '2026-07-20',
    playstyles: ['spirit', 'bruiser'],
    maxedFirst: 4,
    phases: [
      phase('Early', ['extra-spirit', 'mystic-burst', 'extra-regen', 'healing-rite', 'extra-stamina']),
      phase('Core', ['improved-spirit', 'duration-extender', 'cold-front', 'spirit-lifesteal', 'compress-cooldown']),
      phase('Luxury', ['superior-duration', 'boundless-spirit', 'echo-shard', 'refresher', 'escalating-exposure']),
    ],
    abilityOrder: ladder(4),
    coachNotes:
      'Ult-centric Abrams. Hold Seismic Impact for stacked fights, then dump spirit bursts while enemies are stunned.',
    whyItWorks:
      'Duration + spirit power make Seismic Impact a real teamfight pivot instead of a single-target dunk.',
    sampleMatches: 96,
    sampleWinRate: 51.1,
    isEstimate: true,
  },
  {
    id: 'haze-gun-carry',
    heroId: 'haze',
    title: 'Silent Gun Carry',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.9,
    votes: 67,
    updatedAt: '2026-07-30',
    playstyles: ['gun', 'assassin'],
    maxedFirst: 1,
    phases: [
      phase('Early', ['headshot-booster', 'rapid-rounds', 'restorative-shot', 'extra-stamina', 'sprint-boots']),
      phase('Core', ['fleetfoot', 'swift-striker', 'hollow-point', 'active-reload', 'bullet-lifesteal']),
      phase('Luxury', ['glass-cannon', 'crippling-headshot', 'shadow-weave', 'frenzy', 'lucky-shot']),
    ],
    abilityOrder: ladder(1),
    coachNotes:
      'Farm safely until mid, then play fog angles. Never open a fight without an exit path.',
    whyItWorks:
      'Haze scales hardest on fire rate and headshot items. Early mobility keeps her alive long enough to reach the spike.',
    sampleMatches: 240,
    sampleWinRate: 55.8,
    isEstimate: true,
  },
  {
    id: 'haze-sleep-assassin',
    heroId: 'haze',
    title: 'Sleep Assassin',
    author: 'Nightlane',
    authorRole: 'community',
    rating: 4.3,
    votes: 28,
    updatedAt: '2026-07-12',
    playstyles: ['assassin', 'spirit', 'gun'],
    maxedFirst: 2,
    phases: [
      phase('Early', ['extra-spirit', 'mystic-shot', 'extra-stamina', 'headshot-booster', 'extra-regen']),
      phase('Core', ['spirit-shredder-bullets', 'compress-cooldown', 'tesla-bullets', 'warp-stone', 'improved-spirit']),
      phase('Luxury', ['silencer', 'ethereal-shift', 'spellslinger', 'focus-lens', 'refresher']),
    ],
    abilityOrder: ladder(2),
    coachNotes:
      'Sleep → walk → delete. Build enough spirit shred that the wake-up burst actually finishes.',
    whyItWorks:
      'Hybrid gun/spirit lets Haze punish stacked targets after Sleep Dagger without relying on pure glass DPS.',
    sampleMatches: 112,
    sampleWinRate: 52.4,
    isEstimate: true,
  },
  {
    id: 'wraith-card-tempo',
    heroId: 'wraith',
    title: 'Card Tempo',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.7,
    votes: 51,
    updatedAt: '2026-07-26',
    playstyles: ['gun', 'flex'],
    maxedFirst: 1,
    phases: [
      phase('Early', ['rapid-rounds', 'headshot-booster', 'extra-stamina', 'restorative-shot', 'extra-health']),
      phase('Core', ['active-reload', 'fleetfoot', 'tesla-bullets', 'heroic-aura', 'trophy-collector']),
      phase('Luxury', ['ricochet', 'glass-cannon', 'shadow-weave', 'frenzy', 'silencer']),
    ],
    abilityOrder: ladder(1),
    coachNotes:
      'Cards are your tempo clock. Buy fire rate first, then tools that let you take space after a successful peek.',
    whyItWorks:
      'Wraith wins by converting early pressure into map control — gun items accelerate that snowball.',
    sampleMatches: 165,
    sampleWinRate: 53.6,
    isEstimate: true,
  },
  {
    id: 'seven-storm-control',
    heroId: 'seven',
    title: 'Storm Control',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.6,
    votes: 38,
    updatedAt: '2026-07-22',
    playstyles: ['spirit', 'flex'],
    maxedFirst: 3,
    phases: [
      phase('Early', ['extra-spirit', 'mystic-burst', 'mystic-expansion', 'extra-regen', 'extra-stamina']),
      phase('Core', ['improved-spirit', 'duration-extender', 'compress-cooldown', 'cold-front', 'mystic-vulnerability']),
      phase('Luxury', ['superior-duration', 'boundless-spirit', 'refresher', 'escalating-exposure', 'echo-shard']),
    ],
    abilityOrder: ladder(3),
    coachNotes:
      'Play for zone denial. Your job is to make lanes unwalkable before the fight starts.',
    whyItWorks:
      'Duration and spirit amp turn Seven’s zones into permanent space denial instead of short pokes.',
    sampleMatches: 148,
    sampleWinRate: 56.1,
    isEstimate: true,
  },
  {
    id: 'yamato-slash-carry',
    heroId: 'yamato',
    title: 'Slash Carry',
    author: 'Edgework',
    authorRole: 'pro',
    rating: 4.5,
    votes: 33,
    updatedAt: '2026-07-18',
    playstyles: ['assassin', 'gun', 'bruiser'],
    maxedFirst: 1,
    phases: [
      phase('Early', ['close-quarters', 'melee-lifesteal', 'extra-stamina', 'restorative-shot', 'extra-regen']),
      phase('Core', ['melee-charge', 'fleetfoot', 'berserker', 'bullet-lifesteal', 'kinetic-dash']),
      phase('Luxury', ['crushing-fists', 'frenzy', 'phantom-strike', 'vampiric-burst', 'unstoppable']),
    ],
    abilityOrder: ladder(1),
    coachNotes:
      'Commit only when you have two of: slash available, melee charge ready, and an ally peel nearby.',
    whyItWorks:
      'Yamato’s all-ins need sustain and gap-close more than raw damage — this path buys the tools to finish.',
    sampleMatches: 121,
    sampleWinRate: 52.9,
    isEstimate: true,
  },
  {
    id: 'bebop-hook-setup',
    heroId: 'bebop',
    title: 'Hook Setup',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.4,
    votes: 24,
    updatedAt: '2026-07-15',
    playstyles: ['spirit', 'support', 'flex'],
    maxedFirst: 2,
    phases: [
      phase('Early', ['extra-spirit', 'extra-stamina', 'mystic-expansion', 'extra-regen', 'healing-rite']),
      phase('Core', ['compress-cooldown', 'cold-front', 'greater-expansion', 'slowing-hex', 'warp-stone']),
      phase('Luxury', ['knockdown', 'echo-shard', 'refresher', 'cursed-relic', 'superior-cooldown']),
    ],
    abilityOrder: ladder(2),
    coachNotes:
      'Your win condition is one clean hook per fight. Build cooldown and range before selfish damage.',
    whyItWorks:
      'Setup Bebop creates free kills for carries — cooldown and expansion make hooks reliable under pressure.',
    sampleMatches: 88,
    sampleWinRate: 50.8,
    isEstimate: true,
  },
  {
    id: 'dynamo-teamfight-anchor',
    heroId: 'dynamo',
    title: 'Teamfight Anchor',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.7,
    votes: 29,
    updatedAt: '2026-07-24',
    playstyles: ['support', 'spirit', 'tank'],
    maxedFirst: 4,
    phases: [
      phase('Early', ['extra-health', 'extra-spirit', 'healing-rite', 'extra-regen', 'extra-stamina']),
      phase('Core', ['improved-spirit', 'reactive-barrier', 'duration-extender', 'rescue-beam', 'compress-cooldown']),
      phase('Luxury', ['refresher', 'divine-barrier', 'echo-shard', 'unstoppable', 'superior-duration']),
    ],
    abilityOrder: ladder(4),
    coachNotes:
      'Save ult for stacked engages. Buy peel and duration so one Singularity actually decides the fight.',
    whyItWorks:
      'Dynamo’s value is fight start quality. Sustain + refresher lets you take two decisive moments per objective.',
    sampleMatches: 134,
    sampleWinRate: 54.9,
    isEstimate: true,
  },
  {
    id: 'grey-talon-poke-carry',
    heroId: 'grey-talon',
    title: 'Poke Carry',
    author: 'RangeOnly',
    authorRole: 'community',
    rating: 4.2,
    votes: 17,
    updatedAt: '2026-07-10',
    playstyles: ['gun', 'spirit'],
    maxedFirst: 1,
    phases: [
      phase('Early', ['long-range', 'headshot-booster', 'high-velocity-rounds', 'extra-stamina', 'extra-spirit']),
      phase('Core', ['sharpshooter', 'mystic-shot', 'active-reload', 'compress-cooldown', 'fleetfoot']),
      phase('Luxury', ['glass-cannon', 'ricochet', 'focus-lens', 'silencer', 'lucky-shot']),
    ],
    abilityOrder: ladder(1),
    coachNotes:
      'Never walk into mid-range. Your entire build exists to punish people who respect your space too late.',
    whyItWorks:
      'Long-range amp and mobility keep Grey Talon on the edge of fights where his kit is strongest.',
    sampleMatches: 77,
    sampleWinRate: 51.4,
    isEstimate: true,
  },
  {
    id: 'shiv-blood-rush',
    heroId: 'shiv',
    title: 'Blood Rush',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.5,
    votes: 31,
    updatedAt: '2026-07-21',
    playstyles: ['bruiser', 'assassin', 'gun'],
    maxedFirst: 2,
    phases: [
      phase('Early', ['close-quarters', 'melee-lifesteal', 'extra-regen', 'extra-stamina', 'restorative-shot']),
      phase('Core', ['berserker', 'bullet-lifesteal', 'fleetfoot', 'toxic-bullets', 'melee-charge']),
      phase('Luxury', ['frenzy', 'siphon-bullets', 'vampiric-burst', 'phantom-strike', 'unstoppable']),
    ],
    abilityOrder: ladder(2),
    coachNotes:
      'Stack rage with safe skirmishes, then only all-in when your kill threshold is real.',
    whyItWorks:
      'Shiv needs sustain to reach rage spikes. Lifesteal and close-range gun items convert rage into finishes.',
    sampleMatches: 143,
    sampleWinRate: 52.0,
    isEstimate: true,
  },
  {
    id: 'vindicta-spirit-snipe',
    heroId: 'vindicta',
    title: 'Spirit Snipe',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.6,
    votes: 36,
    updatedAt: '2026-07-25',
    playstyles: ['spirit', 'assassin'],
    maxedFirst: 3,
    phases: [
      phase('Early', ['extra-spirit', 'mystic-burst', 'high-velocity-rounds', 'extra-stamina', 'extra-regen']),
      phase('Core', ['improved-spirit', 'compress-cooldown', 'mystic-vulnerability', 'long-range', 'fleetfoot']),
      phase('Luxury', ['boundless-spirit', 'focus-lens', 'refresher', 'escalating-exposure', 'spirit-burn']),
    ],
    abilityOrder: ladder(3),
    coachNotes:
      'Your Assassinate windows are the whole plan. Buy CDR and spirit so one mark ends the fight.',
    whyItWorks:
      'Spirit amp + cooldown turns Vindicta into a pick machine instead of a passive laner.',
    sampleMatches: 129,
    sampleWinRate: 53.3,
    isEstimate: true,
  },
  {
    id: 'warden-lockdown',
    heroId: 'warden',
    title: 'Lockdown Mid',
    author: 'CoachCore',
    authorRole: 'coach',
    rating: 4.3,
    votes: 22,
    updatedAt: '2026-07-14',
    playstyles: ['spirit', 'bruiser', 'flex'],
    maxedFirst: 2,
    phases: [
      phase('Early', ['extra-spirit', 'extra-health', 'mystic-burst', 'extra-stamina', 'healing-rite']),
      phase('Core', ['improved-spirit', 'compress-cooldown', 'duration-extender', 'reactive-barrier', 'trophy-collector']),
      phase('Luxury', ['superior-duration', 'unstoppable', 'refresher', 'boundless-spirit', 'colossus']),
    ],
    abilityOrder: ladder(2),
    coachNotes:
      'Flask first, then walk up. Don’t waste Flask on a target your team can’t finish.',
    whyItWorks:
      'Warden’s kit rewards binding one target — duration and spirit make that bind decide fights.',
    sampleMatches: 101,
    sampleWinRate: 51.7,
    isEstimate: true,
  },
  {
    id: 'pocket-suitcase-tempo',
    heroId: 'pocket',
    title: 'Suitcase Tempo',
    author: 'Bagmage',
    authorRole: 'community',
    rating: 4.1,
    votes: 14,
    updatedAt: '2026-07-08',
    playstyles: ['spirit', 'assassin'],
    maxedFirst: 1,
    phases: [
      phase('Early', ['extra-spirit', 'mystic-burst', 'extra-stamina', 'extra-regen', 'mystic-expansion']),
      phase('Core', ['improved-spirit', 'compress-cooldown', 'cold-front', 'warp-stone', 'spirit-lifesteal']),
      phase('Luxury', ['refresher', 'echo-shard', 'boundless-spirit', 'ethereal-shift', 'cursed-relic']),
    ],
    abilityOrder: ladder(1),
    coachNotes:
      'Hit-and-run only. If you stay for a second spell cycle without escape items, you throw the fight.',
    whyItWorks:
      'Pocket lives on burst windows. Cooldown + escape items let him take two bites without dying.',
    sampleMatches: 64,
    sampleWinRate: 49.8,
    isEstimate: true,
  },
];

export const PLAYSTYLE_LABELS: Record<BuildPlaystyle, string> = {
  gun: 'Gun',
  spirit: 'Spirit',
  bruiser: 'Bruiser',
  tank: 'Tank',
  assassin: 'Assassin',
  support: 'Support',
  flex: 'Flex',
};

export function getBuildsForHero(heroId: string | 'all'): DeadlockBuild[] {
  if (heroId === 'all') return DEADLOCK_BUILDS;
  return DEADLOCK_BUILDS.filter((b) => b.heroId === heroId);
}

export function getBuildById(id: string): DeadlockBuild | undefined {
  return DEADLOCK_BUILDS.find((b) => b.id === id);
}

export function listBuildHeroIds(): string[] {
  return [...new Set(DEADLOCK_BUILDS.map((b) => b.heroId))];
}
