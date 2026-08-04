export type ItemCategory = 'Weapon' | 'Vitality' | 'Spirit';
export type ItemTier = 1 | 2 | 3 | 4 | 5;

export interface DeadlockItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  tier: ItemTier;
  cost: number;
  description: string;
  stats: string[];
  passiveEffects: string[];
  activeEffects?: string[];
  cooldownSeconds?: number;
  prerequisites?: string[];
  upgradesInto?: string[];
  /** Optional public asset path; UI falls back to category badge */
  icon?: string;
}

const TIER_COST: Record<ItemTier, number> = {
  1: 800,
  2: 1600,
  3: 3200,
  4: 6400,
  5: 9999,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function item(
  name: string,
  category: ItemCategory,
  tier: ItemTier,
  extras: Partial<
    Pick<
      DeadlockItemDef,
      | 'description'
      | 'stats'
      | 'passiveEffects'
      | 'activeEffects'
      | 'cooldownSeconds'
      | 'prerequisites'
      | 'upgradesInto'
    >
  > = {}
): DeadlockItemDef {
  const id = slugify(name);
  return {
    id,
    name,
    category,
    tier,
    cost: TIER_COST[tier],
    description:
      extras.description ??
      `${category} tier ${tier} item (${TIER_COST[tier]} souls). Stats vary with patches — verify in-game.`,
    stats: extras.stats ?? [`${category} investment contribution`],
    passiveEffects: extras.passiveEffects ?? [],
    activeEffects: extras.activeEffects,
    cooldownSeconds: extras.cooldownSeconds,
    prerequisites: extras.prerequisites,
    upgradesInto: extras.upgradesInto,
    icon: `/items/${id}.webp`,
  };
}

/** Curated Deadlock Curiosity Shop catalog (names/tiers from public wiki). */
export const DEADLOCK_ITEMS: DeadlockItemDef[] = [
  // Weapon T1
  item('Close Quarters', 'Weapon', 1, {
    description: 'Bonus weapon damage at close range.',
    stats: ['+Weapon Damage (close)'],
    passiveEffects: ['Increased bullet damage when near enemies'],
  }),
  item('Extended Magazine', 'Weapon', 1, {
    stats: ['+Ammo'],
    passiveEffects: ['Larger magazine capacity'],
  }),
  item('Headshot Booster', 'Weapon', 1, {
    stats: ['+Headshot bonus'],
    passiveEffects: ['Extra damage on headshots'],
  }),
  item('High-Velocity Rounds', 'Weapon', 1, {
    stats: ['+Bullet velocity'],
    passiveEffects: ['Faster projectile / hitscan feel'],
  }),
  item('Monster Rounds', 'Weapon', 1, {
    stats: ['+NPC damage'],
    passiveEffects: ['Stronger vs troopers and neutrals'],
  }),
  item('Rapid Rounds', 'Weapon', 1, {
    stats: ['+Fire Rate'],
    passiveEffects: ['Faster weapon fire rate'],
  }),
  item('Restorative Shot', 'Weapon', 1, {
    stats: ['Heal on hit'],
    passiveEffects: ['Weapon hits restore a small amount of health'],
  }),
  // Weapon T2
  item('Active Reload', 'Weapon', 2, {
    activeEffects: ['Perfect reload window for a temporary damage buff'],
    cooldownSeconds: 0,
  }),
  item('Fleetfoot', 'Weapon', 2, {
    stats: ['+Move Speed while shooting'],
    passiveEffects: ['Maintain mobility while firing'],
  }),
  item('Intensifying Magazine', 'Weapon', 2),
  item('Kinetic Dash', 'Weapon', 2),
  item('Long Range', 'Weapon', 2, {
    stats: ['+Weapon Damage (far)'],
    passiveEffects: ['Bonus damage at long range'],
  }),
  item('Melee Charge', 'Weapon', 2),
  item('Mystic Shot', 'Weapon', 2, {
    stats: ['Spirit proc on weapon'],
    passiveEffects: ['Weapon hits can apply spirit damage'],
  }),
  item('Opening Rounds', 'Weapon', 2),
  item('Recharging Rush', 'Weapon', 2),
  item('Slowing Bullets', 'Weapon', 2, {
    passiveEffects: ['Weapon hits slow enemies'],
  }),
  item('Spirit Shredder Bullets', 'Weapon', 2, {
    passiveEffects: ['Weapon hits reduce enemy spirit resist'],
  }),
  item('Split Shot', 'Weapon', 2),
  item('Stalker', 'Weapon', 2),
  item('Swift Striker', 'Weapon', 2, {
    stats: ['+Fire Rate', '+Move Speed'],
  }),
  item('Titanic Magazine', 'Weapon', 2),
  item('Weakening Headshot', 'Weapon', 2),
  // Weapon T3
  item('Alchemical Fire', 'Weapon', 3, {
    activeEffects: [
      'Throw a flask that deals spirit damage over time and reduces Bullet Resist',
    ],
    cooldownSeconds: 30,
  }),
  item('Ballistic Enchantment', 'Weapon', 3),
  item('Berserker', 'Weapon', 3),
  item('Blood Tribute', 'Weapon', 3, {
    activeEffects: ['Sacrifice health for fire rate, debuff resist, and move speed'],
  }),
  item('Burst Fire', 'Weapon', 3),
  item('Cultist Sacrifice', 'Weapon', 3, {
    activeEffects: ['Consume an NPC for bonus souls and a long buff'],
    cooldownSeconds: 270,
  }),
  item('Escalating Resilience', 'Weapon', 3),
  item('Express Shot', 'Weapon', 3),
  item('Headhunter', 'Weapon', 3),
  item('Heroic Aura', 'Weapon', 3),
  item('Hollow Point', 'Weapon', 3),
  item("Hunter's Aura", 'Weapon', 3),
  item('Point Blank', 'Weapon', 3),
  item('Shadow Weave', 'Weapon', 3),
  item('Sharpshooter', 'Weapon', 3),
  item('Spirit Rend', 'Weapon', 3),
  item('Tesla Bullets', 'Weapon', 3),
  item('Toxic Bullets', 'Weapon', 3),
  item('Weighted Shots', 'Weapon', 3),
  // Weapon T4
  item('Armor Piercing Rounds', 'Weapon', 4, {
    passiveEffects: ['Ignore a portion of enemy bullet resist'],
  }),
  item('Capacitor', 'Weapon', 4, {
    activeEffects: ['Projectile that slows, blocks stamina, and silences movement tools'],
    cooldownSeconds: 40,
  }),
  item('Crippling Headshot', 'Weapon', 4),
  item('Crushing Fists', 'Weapon', 4),
  item('Frenzy', 'Weapon', 4),
  item('Glass Cannon', 'Weapon', 4, {
    stats: ['High weapon damage', 'Lower survivability'],
    passiveEffects: ['Glass-cannon weapon spike'],
  }),
  item('Lucky Shot', 'Weapon', 4),
  item('Ricochet', 'Weapon', 4),
  item('Silencer', 'Weapon', 4),
  item('Spellslinger', 'Weapon', 4),
  item('Spiritual Overflow', 'Weapon', 4),

  // Vitality T1
  item('Extra Health', 'Vitality', 1, {
    stats: ['+Max Health'],
    passiveEffects: ['Increases maximum health'],
  }),
  item('Extra Regen', 'Vitality', 1, {
    stats: ['+Health Regen'],
  }),
  item('Extra Stamina', 'Vitality', 1, {
    stats: ['+Stamina'],
    passiveEffects: ['More dashes / stamina pool'],
  }),
  item('Grit', 'Vitality', 1, {
    activeEffects: ['Gain a temporary Barrier'],
    cooldownSeconds: 60,
  }),
  item('Healing Rite', 'Vitality', 1, {
    activeEffects: ['Channel a heal on yourself or an ally'],
  }),
  item('Melee Lifesteal', 'Vitality', 1),
  item('Rebuttal', 'Vitality', 1),
  item('Sprint Boots', 'Vitality', 1, {
    stats: ['+Move Speed / sprint'],
    passiveEffects: ['Faster map traversal and rotates'],
  }),
  // Vitality T2
  item('Battle Vest', 'Vitality', 2),
  item('Bullet Lifesteal', 'Vitality', 2),
  item('Debuff Reducer', 'Vitality', 2),
  item("Enchanter's Emblem", 'Vitality', 2),
  item('Enduring Speed', 'Vitality', 2, {
    stats: ['+Move Speed', 'Slow resist'],
  }),
  item('Guardian Ward', 'Vitality', 2),
  item('Healbane', 'Vitality', 2),
  item('Healing Booster', 'Vitality', 2),
  item('Reactive Barrier', 'Vitality', 2),
  item('Restorative Locket', 'Vitality', 2),
  item('Return Fire', 'Vitality', 2),
  item('Spirit Lifesteal', 'Vitality', 2),
  item('Spirit Shielding', 'Vitality', 2),
  item('Trophy Collector', 'Vitality', 2),
  item('Weapon Shielding', 'Vitality', 2),
  // Vitality T3
  item('Bullet Resilience', 'Vitality', 3),
  item('Counterspell', 'Vitality', 3),
  item('Dispel Magic', 'Vitality', 3, {
    activeEffects: ['Purge non-ultimate debuffs; heal and gain move speed if purged'],
    cooldownSeconds: 45,
  }),
  item('Fortitude', 'Vitality', 3),
  item('Fury Trance', 'Vitality', 3),
  item('Healing Nova', 'Vitality', 3),
  item('Lifestrike', 'Vitality', 3),
  item('Majestic Leap', 'Vitality', 3),
  item('Metal Skin', 'Vitality', 3),
  item('Rescue Beam', 'Vitality', 3),
  item('Spirit Resilience', 'Vitality', 3),
  item('Stamina Mastery', 'Vitality', 3),
  item('Veil Walker', 'Vitality', 3),
  item('Warp Stone', 'Vitality', 3),
  // Vitality T4
  item('Cheat Death', 'Vitality', 4),
  item('Colossus', 'Vitality', 4, {
    activeEffects: ['Grow larger; gain resists and melee damage; slow nearby enemies'],
    cooldownSeconds: 37,
  }),
  item('Divine Barrier', 'Vitality', 4, {
    activeEffects: ['Cleanse and grant Barrier + Move Speed (can self-cast)'],
    cooldownSeconds: 45,
  }),
  item("Diviner's Kevlar", 'Vitality', 4),
  item('Healing Tempo', 'Vitality', 4),
  item('Indomitable', 'Vitality', 4),
  item('Infuser', 'Vitality', 4, {
    activeEffects: ['Gain Spirit Lifesteal and Spirit Power'],
    cooldownSeconds: 30,
  }),
  item('Inhibitor', 'Vitality', 4),
  item('Juggernaut', 'Vitality', 4),
  item('Leech', 'Vitality', 4),
  item('Phantom Strike', 'Vitality', 4),
  item('Plated Armor', 'Vitality', 4),
  item('Siphon Bullets', 'Vitality', 4),
  item('Spellbreaker', 'Vitality', 4),
  item('Unstoppable', 'Vitality', 4),
  item('Vampiric Burst', 'Vitality', 4),
  item('Witchmail', 'Vitality', 4),

  // Spirit T1
  item('Extra Charge', 'Spirit', 1),
  item('Extra Spirit', 'Spirit', 1, {
    stats: ['+Spirit Power'],
  }),
  item('Golden Goose Egg', 'Spirit', 1),
  item('Mystic Burst', 'Spirit', 1, {
    description: 'Spirit burst damage to threaten kills after ability hits.',
    stats: ['+Spirit burst'],
    passiveEffects: ['Extra spirit damage spike on ability / proc windows'],
  }),
  item('Mystic Expansion', 'Spirit', 1, {
    stats: ['+Ability range / radius'],
  }),
  item('Mystic Regeneration', 'Spirit', 1),
  item('Rusted Barrel', 'Spirit', 1),
  item('Spirit Strike', 'Spirit', 1),
  // Spirit T2
  item('Arcane Surge', 'Spirit', 2),
  item('Bullet Resist Shredder', 'Spirit', 2),
  item('Cold Front', 'Spirit', 2, {
    activeEffects: ['Expanding ice blast: spirit damage + Slow'],
    cooldownSeconds: 25,
  }),
  item('Compress Cooldown', 'Spirit', 2, {
    stats: ['Cooldown reduction'],
  }),
  item('Duration Extender', 'Spirit', 2),
  item('Improved Spirit', 'Spirit', 2, {
    stats: ['+Spirit Power'],
  }),
  item('Mystic Slow', 'Spirit', 2),
  item('Mystic Vulnerability', 'Spirit', 2),
  item('Quicksilver Reload', 'Spirit', 2),
  item('Slowing Hex', 'Spirit', 2),
  item('Spirit Sap', 'Spirit', 2),
  item('Suppressor', 'Spirit', 2),
  // Spirit T3
  item('Decay', 'Spirit', 3, {
    activeEffects: ['Damage over time based on current health (non-lethal)'],
    cooldownSeconds: 30,
  }),
  item('Disarming Hex', 'Spirit', 3, {
    activeEffects: ['Disarm and reduce Bullet Resist'],
    cooldownSeconds: 16,
  }),
  item('Greater Expansion', 'Spirit', 3),
  item('Knockdown', 'Spirit', 3),
  item('Radiant Regeneration', 'Spirit', 3),
  item('Rapid Recharge', 'Spirit', 3),
  item('Silence Wave', 'Spirit', 3),
  item('Spirit Snatch', 'Spirit', 3),
  item('Superior Cooldown', 'Spirit', 3),
  item('Superior Duration', 'Spirit', 3),
  item('Surge of Power', 'Spirit', 3),
  item('Tankbuster', 'Spirit', 3, {
    passiveEffects: ['Bonus spirit damage vs high-health targets'],
  }),
  item('Torment Pulse', 'Spirit', 3),
  // Spirit T4
  item('Arctic Blast', 'Spirit', 4, {
    activeEffects: ['Ice blast: spirit damage, Freeze then Slow'],
    cooldownSeconds: 24,
  }),
  item('Boundless Spirit', 'Spirit', 4),
  item('Cursed Relic', 'Spirit', 4, {
    activeEffects: ['Curse: interrupt, silence, disarm, block items'],
    cooldownSeconds: 55,
  }),
  item('Echo Shard', 'Spirit', 4),
  item('Escalating Exposure', 'Spirit', 4),
  item('Ethereal Shift', 'Spirit', 4),
  item('Focus Lens', 'Spirit', 4),
  item('Lightning Scroll', 'Spirit', 4),
  item('Magic Carpet', 'Spirit', 4),
  item('Mercurial Magnum', 'Spirit', 4),
  item('Mystic Reverb', 'Spirit', 4),
  item('Refresher', 'Spirit', 4, {
    activeEffects: ['Reset ability cooldowns'],
  }),
  item('Scourge', 'Spirit', 4),
  item('Spirit Burn', 'Spirit', 4),
  item('Transcendent Cooldown', 'Spirit', 4),
  item('Vortex Web', 'Spirit', 4),
];

const byId = new Map(DEADLOCK_ITEMS.map((i) => [i.id, i]));
const byName = new Map(DEADLOCK_ITEMS.map((i) => [normalizeItemKey(i.name), i]));

export function normalizeItemKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function lookupDeadlockItem(rawName: string | undefined | null): DeadlockItemDef | null {
  if (!rawName) return null;
  const key = normalizeItemKey(rawName);
  if (byName.has(key)) return byName.get(key)!;
  // fuzzy: strip upgrade / upgrade_ prefixes from demos
  const stripped = key
    .replace(/^upgrade\s+/, '')
    .replace(/^item\s+/, '')
    .replace(/^citadel_/, '');
  if (byName.has(stripped)) return byName.get(stripped)!;
  // partial contains
  for (const [n, def] of byName) {
    if (n.includes(stripped) || stripped.includes(n)) return def;
  }
  if (byId.has(slugify(rawName))) return byId.get(slugify(rawName))!;
  return null;
}

export function resolveItemDef(rawName: string): DeadlockItemDef {
  const found = lookupDeadlockItem(rawName);
  if (found) return found;
  const id = slugify(rawName || 'unknown-item');
  return {
    id,
    name: rawName?.trim() || 'Unknown Item',
    category: 'Weapon',
    tier: 1,
    cost: 0,
    description: 'Item metadata not found in catalog — name taken from replay notification.',
    stats: [],
    passiveEffects: [],
    icon: `/items/${id}.webp`,
  };
}

export function categoryColor(category: ItemCategory): string {
  if (category === 'Weapon') return '#f59e0b';
  if (category === 'Vitality') return '#22c55e';
  return '#a855f7';
}
