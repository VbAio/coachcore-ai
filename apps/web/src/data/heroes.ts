export interface Ability {
  slot: number;
  name: string;
  icon: string;
  description: string;
}

export interface Hero {
  id: string;
  name: string;
  role: string;
  difficulty: string;
  weapon: string;
  description: string;
  displayIcon: string;
  portrait: string;
  abilities: Ability[];
}

export const heroes: Hero[] = [
  {
    id: 'abrams',
    name: 'Abrams',
    role: 'Tank',
    difficulty: 'Easy',
    weapon: 'Case Closed',
    description:
      'A durable frontline tank that excels at crowd control and surviving extended fights.',
    displayIcon: '/heroes/icons/abrams.webp',
    portrait: '/heroes/portraits/abrams.webp',
    abilities: [
      {
        slot: 1,
        name: 'Siphon Life',
        icon: '/heroes/abilities/abrams/1.webp',
        description:
          'Drain life from enemies in front of Abrams, healing based on damage dealt.',
      },
      {
        slot: 2,
        name: 'Shoulder Charge',
        icon: '/heroes/abilities/abrams/2.webp',
        description:
          'Charge forward, carrying enemies. Targets slammed into walls become stunned.',
      },
      {
        slot: 3,
        name: 'Infernal Resilience',
        icon: '/heroes/abilities/abrams/3.webp',
        description:
          'Passively regenerates a portion of incoming damage over time.',
      },
      {
        slot: 4,
        name: 'Seismic Impact',
        icon: '/heroes/abilities/abrams/4.webp',
        description:
          'Leap into the air and crash down, damaging and stunning nearby enemies.',
      },
    ],
  },
  {
    id: 'bebop',
    name: 'Bebop',
    role: 'Disruptor',
    difficulty: 'Medium',
    weapon: 'Humble Pie',
    description:
      'A combo-heavy hero that excels at pulling enemies out of position.',
    displayIcon: '/heroes/icons/bebop.webp',
    portrait: '/heroes/portraits/bebop.webp',
    abilities: [
      {
        slot: 1,
        name: 'Exploding Uppercut',
        icon: '/heroes/abilities/bebop/1.webp',
        description:
          'Launch enemies away with a powerful uppercut that explodes on impact.',
      },
      {
        slot: 2,
        name: 'Sticky Bomb',
        icon: '/heroes/abilities/bebop/2.webp',
        description: 'Attach a bomb that explodes after a short delay.',
      },
      {
        slot: 3,
        name: 'Hook',
        icon: '/heroes/abilities/bebop/3.webp',
        description:
          'Fire a mechanical hook that pulls an enemy directly to Bebop.',
      },
      {
        slot: 4,
        name: 'Hyper Beam',
        icon: '/heroes/abilities/bebop/4.webp',
        description:
          'Fire a massive continuous laser beam that deals heavy damage.',
      },
    ],
  },
  {
    id: 'dynamo',
    name: 'Dynamo',
    role: 'Support',
    difficulty: 'Medium',
    weapon: 'Particle Accelerator',
    description:
      'A gravity-controlling support that excels at healing and teamfighting.',
    displayIcon: '/heroes/icons/dynamo.webp',
    portrait: '/heroes/portraits/dynamo.webp',
    abilities: [
      {
        slot: 1,
        name: 'Kinetic Pulse',
        icon: '/heroes/abilities/dynamo/1.webp',
        description: 'Release a pulse that damages and pushes enemies away.',
      },
      {
        slot: 2,
        name: 'Quantum Entanglement',
        icon: '/heroes/abilities/dynamo/2.webp',
        description:
          'Teleport a short distance while becoming untargetable.',
      },
      {
        slot: 3,
        name: 'Rejuvenating Aurora',
        icon: '/heroes/abilities/dynamo/3.webp',
        description: 'Heal nearby allies over time.',
      },
      {
        slot: 4,
        name: 'Singularity',
        icon: '/heroes/abilities/dynamo/4.webp',
        description:
          'Create a black hole that pulls enemies together before damaging them.',
      },
    ],
  },
  {
    id: 'grey-talon',
    name: 'Grey Talon',
    role: 'Sniper',
    difficulty: 'Hard',
    weapon: 'Longbow',
    description:
      'A long-range marksman capable of eliminating enemies from extreme distances.',
    displayIcon: '/heroes/icons/grey-talon.webp',
    portrait: '/heroes/portraits/grey-talon.webp',
    abilities: [
      {
        slot: 1,
        name: 'Charged Shot',
        icon: '/heroes/abilities/grey-talon/1.webp',
        description: 'Charge a devastating arrow that deals increased damage.',
      },
      {
        slot: 2,
        name: 'Rain of Arrows',
        icon: '/heroes/abilities/grey-talon/2.webp',
        description: 'Call down a volley of arrows over a target area.',
      },
      {
        slot: 3,
        name: 'Spirit Owl',
        icon: '/heroes/abilities/grey-talon/3.webp',
        description: 'Summon an owl to scout and attack enemies.',
      },
      {
        slot: 4,
        name: 'Guided Owl',
        icon: '/heroes/abilities/grey-talon/4.webp',
        description:
          'Take control of a powerful spirit owl and fly it across the battlefield.',
      },
    ],
  },
  {
    id: 'haze',
    name: 'Haze',
    role: 'Carry',
    difficulty: 'Medium',
    weapon: 'Twin SMGs',
    description:
      'A stealth assassin that excels at eliminating isolated targets.',
    displayIcon: '/heroes/icons/haze.webp',
    portrait: '/heroes/portraits/haze.webp',
    abilities: [
      {
        slot: 1,
        name: 'Sleep Dagger',
        icon: '/heroes/abilities/haze/1.webp',
        description: 'Throw a dagger that puts enemies to sleep.',
      },
      {
        slot: 2,
        name: 'Smoke Bomb',
        icon: '/heroes/abilities/haze/2.webp',
        description: 'Create a smoke cloud to reposition and escape.',
      },
      {
        slot: 3,
        name: 'Fixation',
        icon: '/heroes/abilities/haze/3.webp',
        description:
          'Deal increasing damage to the same target with consecutive attacks.',
      },
      {
        slot: 4,
        name: 'Bullet Dance',
        icon: '/heroes/abilities/haze/4.webp',
        description:
          'Spin while firing in every direction, damaging all nearby enemies.',
      },
    ],
  },
  {
    id: 'mcginnis',
    name: 'McGinnis',
    role: 'Support',
    difficulty: 'Easy',
    weapon: 'Services Rendered',
    description:
      'An engineer who controls space with turrets, healing, and defensive structures.',
    displayIcon: '/heroes/icons/mcginnis.webp',
    portrait: '/heroes/portraits/mcginnis.webp',
    abilities: [
      {
        slot: 1,
        name: 'Mini Turret',
        icon: '/heroes/abilities/mcginnis/1.webp',
        description:
          'Deploy an automated turret that attacks nearby enemies until it expires.',
      },
      {
        slot: 2,
        name: 'Medicinal Specter',
        icon: '/heroes/abilities/mcginnis/2.webp',
        description:
          'Summon a healing spirit that restores health to nearby allies.',
      },
      {
        slot: 3,
        name: 'Spectral Wall',
        icon: '/heroes/abilities/mcginnis/3.webp',
        description:
          'Create a wall that blocks movement and splits the battlefield.',
      },
      {
        slot: 4,
        name: 'Heavy Barrage',
        icon: '/heroes/abilities/mcginnis/4.webp',
        description:
          'Launch a devastating volley of rockets at a targeted area.',
      },
    ],
  },
  {
    id: 'mirage',
    name: 'Mirage',
    role: 'Carry',
    difficulty: 'Medium',
    weapon: 'Promises Kept',
    description:
      'A mobile marksman who chases enemies with storms and drains their strength.',
    displayIcon: '/heroes/icons/mirage.webp',
    portrait: '/heroes/portraits/mirage.webp',
    abilities: [
      {
        slot: 1,
        name: 'Fire Scarabs',
        icon: '/heroes/abilities/mirage/1.webp',
        description:
          'Launch scarabs that steal max health from enemies and reduce their bullet resistance.',
      },
      {
        slot: 2,
        name: 'Tornado',
        icon: '/heroes/abilities/mirage/2.webp',
        description:
          'Transform into a tornado that damages and launches enemies into the air.',
      },
      {
        slot: 3,
        name: "Djinn's Mark",
        icon: '/heroes/abilities/mirage/3.webp',
        description:
          'Mark an enemy, empowering your attacks and abilities against them.',
      },
      {
        slot: 4,
        name: 'Traveler',
        icon: '/heroes/abilities/mirage/4.webp',
        description:
          'Teleport to a targeted ally anywhere on the map to quickly join a fight.',
      },
    ],
  },
  {
    id: 'mo-and-krill',
    name: 'Mo & Krill',
    role: 'Tank',
    difficulty: 'Medium',
    weapon: 'Yellow Canary',
    description:
      'A durable duo that burrows underground, disrupts enemies, and locks down key targets.',
    displayIcon: '/heroes/icons/mo-and-krill.webp',
    portrait: '/heroes/portraits/mo-and-krill.webp',
    abilities: [
      {
        slot: 1,
        name: 'Scorn',
        icon: '/heroes/abilities/mo-and-krill/1.webp',
        description:
          'Damage nearby enemies while healing based on the damage dealt.',
      },
      {
        slot: 2,
        name: 'Burrow',
        icon: '/heroes/abilities/mo-and-krill/2.webp',
        description:
          'Travel underground before bursting out to damage and knock up nearby enemies.',
      },
      {
        slot: 3,
        name: 'Sand Blast',
        icon: '/heroes/abilities/mo-and-krill/3.webp',
        description:
          'Spray sand in front of you, damaging and disarming enemies.',
      },
      {
        slot: 4,
        name: 'Combo',
        icon: '/heroes/abilities/mo-and-krill/4.webp',
        description:
          'Grab and hold an enemy in place while dealing damage over the channel.',
      },
    ],
  },
  {
    id: 'paradox',
    name: 'Paradox',
    role: 'Controller',
    difficulty: 'Hard',
    weapon: 'Pulse Rifle',
    description:
      'A tactical hero who manipulates time and space to isolate enemies and create opportunities.',
    displayIcon: '/heroes/icons/paradox.webp',
    portrait: '/heroes/portraits/paradox.webp',
    abilities: [
      {
        slot: 1,
        name: 'Pulse Grenade',
        icon: '/heroes/abilities/paradox/1.webp',
        description:
          'Throw an energy grenade that damages enemies caught in its blast.',
      },
      {
        slot: 2,
        name: 'Time Wall',
        icon: '/heroes/abilities/paradox/2.webp',
        description:
          'Create a wall that alters projectiles and movement through it.',
      },
      {
        slot: 3,
        name: 'Kinetic Carbine',
        icon: '/heroes/abilities/paradox/3.webp',
        description: 'Charge a powerful precision shot that deals heavy damage.',
      },
      {
        slot: 4,
        name: 'Paradoxical Swap',
        icon: '/heroes/abilities/paradox/4.webp',
        description: 'Swap positions with a targeted enemy hero.',
      },
    ],
  },
  {
    id: 'pocket',
    name: 'Pocket',
    role: 'Assassin',
    difficulty: 'Hard',
    weapon: 'The Black Sheep',
    description:
      'A slippery assassin who uses magic and mobility to outplay opponents.',
    displayIcon: '/heroes/icons/pocket.webp',
    portrait: '/heroes/portraits/pocket.webp',
    abilities: [
      {
        slot: 1,
        name: 'Barrage',
        icon: '/heroes/abilities/pocket/1.webp',
        description:
          'Launch magical projectiles that slow enemies and increase your damage.',
      },
      {
        slot: 2,
        name: 'Flying Cloak',
        icon: '/heroes/abilities/pocket/2.webp',
        description: 'Throw your cloak and teleport to its location.',
      },
      {
        slot: 3,
        name: "Enchanter's Satchel",
        icon: '/heroes/abilities/pocket/3.webp',
        description:
          'Hide inside a magical suitcase before bursting out with an explosion.',
      },
      {
        slot: 4,
        name: 'Affliction',
        icon: '/heroes/abilities/pocket/4.webp',
        description:
          'Curse nearby enemies with a long-lasting damage-over-time effect.',
      },
    ],
  },
  {
    id: 'seven',
    name: 'Seven',
    role: 'Carry',
    difficulty: 'Medium',
    weapon: 'Stormcaller',
    description:
      'A ranged caster who overwhelms enemies with chain lightning and devastating area damage.',
    displayIcon: '/heroes/icons/seven.webp',
    portrait: '/heroes/portraits/seven.webp',
    abilities: [
      {
        slot: 1,
        name: 'Lightning Ball',
        icon: '/heroes/abilities/seven/1.webp',
        description:
          'Throw a slow-moving orb that damages enemies and releases bolts of electricity.',
      },
      {
        slot: 2,
        name: 'Static Charge',
        icon: '/heroes/abilities/seven/2.webp',
        description:
          'Charge a target with unstable electricity, damaging nearby enemies over time.',
      },
      {
        slot: 3,
        name: 'Power Surge',
        icon: '/heroes/abilities/seven/3.webp',
        description:
          'Gain increased movement speed and weapon performance while energized.',
      },
      {
        slot: 4,
        name: 'Storm Cloud',
        icon: '/heroes/abilities/seven/4.webp',
        description:
          'Rise into the air and unleash a massive electrical storm that repeatedly strikes nearby enemies.',
      },
    ],
  },
  {
    id: 'shiv',
    name: 'Shiv',
    role: 'Assassin',
    difficulty: 'Hard',
    weapon: 'Serrated Blades',
    description:
      'A relentless duelist who excels at bleeding enemies and finishing weakened targets.',
    displayIcon: '/heroes/icons/shiv.webp',
    portrait: '/heroes/portraits/shiv.webp',
    abilities: [
      {
        slot: 1,
        name: 'Serrated Knife',
        icon: '/heroes/abilities/shiv/1.webp',
        description:
          'Throw a knife that damages enemies and applies a bleeding effect.',
      },
      {
        slot: 2,
        name: 'Slice and Dice',
        icon: '/heroes/abilities/shiv/2.webp',
        description: 'Dash through enemies with a series of rapid slashes.',
      },
      {
        slot: 3,
        name: 'Bloodletting',
        icon: '/heroes/abilities/shiv/3.webp',
        description:
          'Convert a portion of incoming damage into delayed damage, improving survivability.',
      },
      {
        slot: 4,
        name: 'Final Cut',
        icon: '/heroes/abilities/shiv/4.webp',
        description:
          'Execute a devastating finishing strike that deals increased damage to low-health enemies.',
      },
    ],
  },
  {
    id: 'vindicta',
    name: 'Vindicta',
    role: 'Sniper',
    difficulty: 'Medium',
    weapon: 'Long Rifle',
    description:
      'A deadly marksman who dominates from long range and hunts weakened enemies.',
    displayIcon: '/heroes/icons/vindicta.webp',
    portrait: '/heroes/portraits/vindicta.webp',
    abilities: [
      {
        slot: 1,
        name: 'Stake',
        icon: '/heroes/abilities/vindicta/1.webp',
        description:
          'Fire a projectile that pins or restricts enemies caught in its path.',
      },
      {
        slot: 2,
        name: 'Flight',
        icon: '/heroes/abilities/vindicta/2.webp',
        description:
          'Take to the skies for superior positioning and long-range attacks.',
      },
      {
        slot: 3,
        name: 'Crow Familiar',
        icon: '/heroes/abilities/vindicta/3.webp',
        description:
          'Summon a crow to reveal enemies and improve your ability to track targets.',
      },
      {
        slot: 4,
        name: 'Assassinate',
        icon: '/heroes/abilities/vindicta/4.webp',
        description:
          'Fire a devastating sniper round that deals massive damage, especially to weakened enemies.',
      },
    ],
  },
  {
    id: 'viscous',
    name: 'Viscous',
    role: 'Tank',
    difficulty: 'Medium',
    weapon: 'Gel Cannon',
    description:
      'A resilient slime-based hero that protects allies while disrupting enemy movement.',
    displayIcon: '/heroes/icons/viscous.webp',
    portrait: '/heroes/portraits/viscous.webp',
    abilities: [
      {
        slot: 1,
        name: 'Splatter',
        icon: '/heroes/abilities/viscous/1.webp',
        description: 'Launch a glob of slime that damages and slows enemies.',
      },
      {
        slot: 2,
        name: 'The Cube',
        icon: '/heroes/abilities/viscous/2.webp',
        description:
          'Encase yourself or an ally inside a protective cube that blocks incoming damage.',
      },
      {
        slot: 3,
        name: 'Puddle Punch',
        icon: '/heroes/abilities/viscous/3.webp',
        description:
          'Stretch forward with a powerful slime punch that knocks enemies back.',
      },
      {
        slot: 4,
        name: 'Goo Ball',
        icon: '/heroes/abilities/viscous/4.webp',
        description:
          'Transform into a rolling ball of slime that damages and bounces through enemies.',
      },
    ],
  },
  {
    id: 'warden',
    name: 'Warden',
    role: 'Tank',
    difficulty: 'Easy',
    weapon: 'Repeater Rifle',
    description:
      'A durable frontline defender who locks down enemies and protects his team.',
    displayIcon: '/heroes/icons/warden.webp',
    portrait: '/heroes/portraits/warden.webp',
    abilities: [
      {
        slot: 1,
        name: 'Alchemical Flask',
        icon: '/heroes/abilities/warden/1.webp',
        description:
          'Throw a flask that damages enemies and applies a slowing effect.',
      },
      {
        slot: 2,
        name: 'Binding Word',
        icon: '/heroes/abilities/warden/2.webp',
        description:
          'Curse an enemy, rooting them if they fail to escape in time.',
      },
      {
        slot: 3,
        name: 'Fortitude',
        icon: '/heroes/abilities/warden/3.webp',
        description:
          'Gain increased durability and movement speed while pushing forward.',
      },
      {
        slot: 4,
        name: 'Last Stand',
        icon: '/heroes/abilities/warden/4.webp',
        description:
          'Channel a powerful aura that damages and suppresses nearby enemies.',
      },
    ],
  },
  {
    id: 'wraith',
    name: 'Wraith',
    role: 'Carry',
    difficulty: 'Medium',
    weapon: 'Full House',
    description:
      'A high-damage duelist who uses enchanted cards and mobility to eliminate isolated enemies.',
    displayIcon: '/heroes/icons/wraith.webp',
    portrait: '/heroes/portraits/wraith.webp',
    abilities: [
      {
        slot: 1,
        name: 'Card Trick',
        icon: '/heroes/abilities/wraith/1.webp',
        description:
          'Throw a volley of enchanted cards that damage enemies in their path.',
      },
      {
        slot: 2,
        name: 'Project Mind',
        icon: '/heroes/abilities/wraith/2.webp',
        description:
          'Launch a controllable spirit projection that damages enemies and can be detonated.',
      },
      {
        slot: 3,
        name: 'Teleport',
        icon: '/heroes/abilities/wraith/3.webp',
        description:
          'Instantly teleport a short distance, allowing aggressive engages or quick escapes.',
      },
      {
        slot: 4,
        name: 'Full House',
        icon: '/heroes/abilities/wraith/4.webp',
        description:
          'Curse an enemy hero, stunning them after a short delay while dealing heavy burst damage.',
      },
    ],
  },
  {
    id: 'yamato',
    name: 'Yamato',
    role: 'Assassin',
    difficulty: 'Hard',
    weapon: 'Muramasa',
    description:
      'A precision swordswoman who excels at weaving together ranged slashes and devastating melee attacks.',
    displayIcon: '/heroes/icons/yamato.webp',
    portrait: '/heroes/portraits/yamato.webp',
    abilities: [
      {
        slot: 1,
        name: 'Power Slash',
        icon: '/heroes/abilities/yamato/1.webp',
        description:
          'Charge a powerful sword strike that deals increased damage the longer it is charged.',
      },
      {
        slot: 2,
        name: 'Flying Strike',
        icon: '/heroes/abilities/yamato/2.webp',
        description:
          'Launch yourself toward an enemy, damaging everything along your path.',
      },
      {
        slot: 3,
        name: 'Crimson Slash',
        icon: '/heroes/abilities/yamato/3.webp',
        description:
          'Release a wave of spirit energy that damages enemies from range.',
      },
      {
        slot: 4,
        name: 'Shadow Transformation',
        icon: '/heroes/abilities/yamato/4.webp',
        description:
          'Enter a powerful combat state that greatly increases your survivability and damage output.',
      },
    ],
  },
  {
    id: 'calico',
    name: 'Calico',
    role: 'Assassin',
    difficulty: 'Hard',
    weapon: 'Twin Claws',
    description:
      'An agile assassin who bursts down enemies before slipping away to safety.',
    displayIcon: '/heroes/icons/calico.webp',
    portrait: '/heroes/portraits/calico.webp',
    abilities: [
      {
        slot: 1,
        name: 'Gloom Bomb',
        icon: '/heroes/abilities/calico/1.webp',
        description:
          'Throw a bomb that damages enemies and leaves behind a lingering dark field.',
      },
      {
        slot: 2,
        name: 'Leaping Slash',
        icon: '/heroes/abilities/calico/2.webp',
        description: 'Leap toward an enemy and deliver a powerful melee strike.',
      },
      {
        slot: 3,
        name: 'Shadow Prowl',
        icon: '/heroes/abilities/calico/3.webp',
        description: 'Become highly mobile while preparing your next ambush.',
      },
      {
        slot: 4,
        name: 'Night Hunt',
        icon: '/heroes/abilities/calico/4.webp',
        description:
          'Enter a deadly empowered state that greatly increases assassination potential.',
      },
    ],
  },
  {
    id: 'holliday',
    name: 'Holliday',
    role: 'Marksman',
    difficulty: 'Medium',
    weapon: 'Repeating Rifle',
    description:
      'A long-range sharpshooter who uses trick shots and a lasso to isolate targets.',
    displayIcon: '/heroes/icons/holliday.webp',
    portrait: '/heroes/portraits/holliday.webp',
    abilities: [
      {
        slot: 1,
        name: 'Lasso',
        icon: '/heroes/abilities/holliday/1.webp',
        description: 'Catch an enemy with a lasso and drag them toward your team.',
      },
      {
        slot: 2,
        name: 'Ricochet Shot',
        icon: '/heroes/abilities/holliday/2.webp',
        description: 'Fire a shot that can bounce between nearby enemies.',
      },
      {
        slot: 3,
        name: 'Quick Draw',
        icon: '/heroes/abilities/holliday/3.webp',
        description:
          'Instantly ready your weapon and fire a powerful precision shot.',
      },
      {
        slot: 4,
        name: 'Deadeye',
        icon: '/heroes/abilities/holliday/4.webp',
        description:
          'Focus on a distant target before unleashing a devastating finishing shot.',
      },
    ],
  },
  {
    id: 'sinclair',
    name: 'Sinclair',
    role: 'Mystic',
    difficulty: 'Hard',
    weapon: 'Arcane Focus',
    description:
      "A spellcaster who turns an opponent's greatest strength against them.",
    displayIcon: '/heroes/icons/sinclair.webp',
    portrait: '/heroes/portraits/sinclair.webp',
    abilities: [
      {
        slot: 1,
        name: 'Arcane Bolt',
        icon: '/heroes/abilities/sinclair/1.webp',
        description: 'Fire a bolt of magical energy that damages enemies.',
      },
      {
        slot: 2,
        name: 'Mystic Barrier',
        icon: '/heroes/abilities/sinclair/2.webp',
        description: 'Create a magical barrier that protects allies.',
      },
      {
        slot: 3,
        name: 'Spell Theft',
        icon: '/heroes/abilities/sinclair/3.webp',
        description: "Disrupt an enemy's magic while empowering your own.",
      },
      {
        slot: 4,
        name: 'Grand Mimicry',
        icon: '/heroes/abilities/sinclair/4.webp',
        description: "Copy an enemy hero's ultimate ability and cast it yourself.",
      },
    ],
  },
  {
    id: 'vyper',
    name: 'Vyper',
    role: 'Assassin',
    difficulty: 'Medium',
    weapon: 'Venom Fangs',
    description:
      'A poisonous skirmisher who weakens enemies before finishing them with deadly venom.',
    displayIcon: '/heroes/icons/vyper.webp',
    portrait: '/heroes/portraits/vyper.webp',
    abilities: [
      {
        slot: 1,
        name: 'Venom Spit',
        icon: '/heroes/abilities/vyper/1.webp',
        description: 'Launch venom that poisons enemies over time.',
      },
      {
        slot: 2,
        name: 'Serpent Strike',
        icon: '/heroes/abilities/vyper/2.webp',
        description: 'Dash through enemies, dealing damage and applying poison.',
      },
      {
        slot: 3,
        name: 'Toxic Scales',
        icon: '/heroes/abilities/vyper/3.webp',
        description: 'Gain temporary resistance while poisoning nearby enemies.',
      },
      {
        slot: 4,
        name: 'Deadly Venom',
        icon: '/heroes/abilities/vyper/4.webp',
        description:
          'Release a massive poisonous blast that rapidly damages all enemies caught inside.',
      },
    ],
  },
  {
    id: 'apollo',
    name: 'Apollo',
    role: 'Assassin',
    difficulty: 'Medium',
    weapon: 'Spreadshot',
    description:
      'A highly mobile melee assassin who excels at counterattacks and precise swordplay.',
    displayIcon: '/heroes/icons/apollo.webp',
    portrait: '/heroes/portraits/apollo.webp',
    abilities: [
      {
        slot: 1,
        name: 'Disengaging Sigil',
        icon: '/heroes/abilities/apollo/1.webp',
        description:
          'Create an explosive sigil before leaping backward, damaging and slowing enemies caught in the blast.',
      },
      {
        slot: 2,
        name: 'Riposte',
        icon: '/heroes/abilities/apollo/2.webp',
        description:
          'Prepare to parry an incoming attack. A successful parry grants brief invulnerability before stunning an enemy and reducing their melee resistance.',
      },
      {
        slot: 3,
        name: 'Flawless Advance',
        icon: '/heroes/abilities/apollo/3.webp',
        description:
          'Perform a series of lunging sword strikes. Timing the attack perfectly greatly increases its damage.',
      },
      {
        slot: 4,
        name: 'Itani Lo Sahn',
        icon: '/heroes/abilities/apollo/4.webp',
        description:
          'Charge a long-range spirit slash that traps enemies in slow motion before dealing devastating delayed damage.',
      },
    ],
  },
  {
    id: 'billy',
    name: 'Billy',
    role: 'Brawler',
    difficulty: 'Medium',
    weapon: 'Scrap Shotgun',
    description:
      'An aggressive frontline fighter who chains together powerful melee attacks and crowd control.',
    displayIcon: '/heroes/icons/billy.webp',
    portrait: '/heroes/portraits/billy.webp',
    abilities: [
      {
        slot: 1,
        name: 'Rising Ram',
        icon: '/heroes/abilities/billy/1.webp',
        description:
          'Launch upward with a powerful strike that knocks enemies into the air.',
      },
      {
        slot: 2,
        name: 'Pile Driver',
        icon: '/heroes/abilities/billy/2.webp',
        description:
          'Leap onto enemies, dealing heavy impact damage in a small area.',
      },
      {
        slot: 3,
        name: 'Scrap Armor',
        icon: '/heroes/abilities/billy/3.webp',
        description:
          'Gain temporary durability while increasing close-range combat effectiveness.',
      },
      {
        slot: 4,
        name: 'GOAT Mode',
        icon: '/heroes/abilities/billy/4.webp',
        description:
          'Enter an empowered state with increased damage, movement, and survivability.',
      },
    ],
  },
  {
    id: 'celeste',
    name: 'Celeste',
    role: 'Marksman',
    difficulty: 'Hard',
    weapon: 'Radiant Pistols',
    description:
      'A graceful ranged hero who overwhelms enemies with radiant projectiles and mobility.',
    displayIcon: '/heroes/icons/celeste.webp',
    portrait: '/heroes/portraits/celeste.webp',
    abilities: [
      {
        slot: 1,
        name: 'Radiant Daggers',
        icon: '/heroes/abilities/celeste/1.webp',
        description: 'Throw a volley of radiant daggers that pierce through enemies.',
      },
      {
        slot: 2,
        name: 'Shining Wonder',
        icon: '/heroes/abilities/celeste/2.webp',
        description: 'Dash while releasing bursts of radiant energy around you.',
      },
      {
        slot: 3,
        name: 'Celestial Grace',
        icon: '/heroes/abilities/celeste/3.webp',
        description: 'Empower your movement and weapon attacks with radiant energy.',
      },
      {
        slot: 4,
        name: 'Supernova',
        icon: '/heroes/abilities/celeste/4.webp',
        description:
          'Ascend into the air before unleashing a massive burst of radiant energy.',
      },
    ],
  },
  {
    id: 'drifter',
    name: 'Drifter',
    role: 'Assassin',
    difficulty: 'Hard',
    weapon: 'Blood Blades',
    description:
      'A ruthless duelist who stalks enemies and thrives on sustained combat.',
    displayIcon: '/heroes/icons/drifter.webp',
    portrait: '/heroes/portraits/drifter.webp',
    abilities: [
      {
        slot: 1,
        name: 'Rend',
        icon: '/heroes/abilities/drifter/1.webp',
        description:
          'Slash enemies with a heavy melee strike that deals increased damage at close range.',
      },
      {
        slot: 2,
        name: 'Blood Hunt',
        icon: '/heroes/abilities/drifter/2.webp',
        description:
          'Track weakened enemies and gain movement speed while pursuing them.',
      },
      {
        slot: 3,
        name: "Predator's Instinct",
        icon: '/heroes/abilities/drifter/3.webp',
        description: 'Increase melee damage and lifesteal during combat.',
      },
      {
        slot: 4,
        name: "Executioner's Frenzy",
        icon: '/heroes/abilities/drifter/4.webp',
        description: 'Enter a relentless frenzy that enhances every melee attack.',
      },
    ],
  },
  {
    id: 'graves',
    name: 'Graves',
    role: 'Marksman',
    difficulty: 'Medium',
    weapon: "Necromancer's Rifle",
    description:
      'A dark marksman who summons undead servants to pressure enemies from range.',
    displayIcon: '/heroes/icons/graves.webp',
    portrait: '/heroes/portraits/graves.webp',
    abilities: [
      {
        slot: 1,
        name: 'Grasping Hands',
        icon: '/heroes/abilities/graves/1.webp',
        description:
          'Summon skeletal hands that erupt from the ground, damaging and slowing enemies.',
      },
      {
        slot: 2,
        name: 'Deadheads',
        icon: '/heroes/abilities/graves/2.webp',
        description: 'Summon undead minions that seek out nearby enemies.',
      },
      {
        slot: 3,
        name: 'Grave Mist',
        icon: '/heroes/abilities/graves/3.webp',
        description:
          'Create a cursed mist that weakens enemies standing inside it.',
      },
      {
        slot: 4,
        name: 'Army of the Fallen',
        icon: '/heroes/abilities/graves/4.webp',
        description:
          'Raise a powerful undead army that overwhelms nearby enemies.',
      },
    ],
  },
  {
    id: 'mina',
    name: 'Mina',
    role: 'Harasser',
    difficulty: 'Hard',
    weapon: 'Umbrella',
    description:
      'A nimble spirit assassin who harasses enemies with bats, burst damage, and exceptional mobility.',
    displayIcon: '/heroes/icons/mina.webp',
    portrait: '/heroes/portraits/mina.webp',
    abilities: [
      {
        slot: 1,
        name: 'Rake',
        icon: '/heroes/abilities/mina/1.webp',
        description:
          "Slash with your umbrella in a cone, dealing Spirit damage that increases based on the target's missing health. Killing an enemy heals Mina.",
      },
      {
        slot: 2,
        name: 'Sanguine Retreat',
        icon: '/heroes/abilities/mina/2.webp',
        description:
          'Become briefly untargetable and dash to a target location. The ability can be recast shortly after activation.',
      },
      {
        slot: 3,
        name: 'Love Bites',
        icon: '/heroes/abilities/mina/3.webp',
        description:
          'Bullets and abilities apply bonus Spirit damage. Repeated hits build toward a powerful burst of bonus damage.',
      },
      {
        slot: 4,
        name: 'Nox Nostra',
        icon: '/heroes/abilities/mina/4.webp',
        description:
          'Release a cloud of bats that seek nearby enemies, dealing Spirit damage and applying Silence. Triggering Love Bites permanently increases the number of bats released.',
      },
    ],
  },
  {
    id: 'paige',
    name: 'Paige',
    role: 'Protector',
    difficulty: 'Medium',
    weapon: 'Spellbook',
    description:
      'A backline support who shields allies, controls areas, and leads powerful team engagements.',
    displayIcon: '/heroes/icons/paige.webp',
    portrait: '/heroes/portraits/paige.webp',
    abilities: [
      {
        slot: 1,
        name: 'Bookwyrm',
        icon: '/heroes/abilities/paige/1.webp',
        description:
          'Throw a magical dragon that damages enemies on impact before leaving behind a burning trail.',
      },
      {
        slot: 2,
        name: 'Plot Armor',
        icon: '/heroes/abilities/paige/2.webp',
        description:
          'Grant yourself or an ally a protective barrier that also increases weapon damage while active.',
      },
      {
        slot: 3,
        name: 'Captivating Read',
        icon: '/heroes/abilities/paige/3.webp',
        description:
          'Target an area with enchanted pages that slow enemies before rooting and damaging everyone caught inside.',
      },
      {
        slot: 4,
        name: 'Rallying Charge',
        icon: '/heroes/abilities/paige/4.webp',
        description:
          'Summon charging knights that race across the battlefield, healing allies while damaging and stunning enemies.',
      },
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    role: 'Fighter',
    difficulty: 'Hard',
    weapon: 'Moonfang',
    description:
      'A shapeshifting fighter who alternates between a nimble human form and a powerful werewolf form.',
    displayIcon: '/heroes/icons/silver.webp',
    portrait: '/heroes/portraits/silver.webp',
    abilities: [
      {
        slot: 1,
        name: 'Moon Slash',
        icon: '/heroes/abilities/silver/1.webp',
        description:
          'Slash enemies in front of you with a crescent-shaped spirit attack.',
      },
      {
        slot: 2,
        name: 'Lunar Pounce',
        icon: '/heroes/abilities/silver/2.webp',
        description:
          'Leap toward a target location, damaging enemies where you land.',
      },
      {
        slot: 3,
        name: 'Lycanthropy',
        icon: '/heroes/abilities/silver/3.webp',
        description:
          'Transform into a werewolf, gaining increased durability, movement speed, and melee damage.',
      },
      {
        slot: 4,
        name: 'Moonlit Rampage',
        icon: '/heroes/abilities/silver/4.webp',
        description:
          'Enter a frenzied state that empowers your attacks and lets you rapidly chase enemies.',
      },
    ],
  },
  {
    id: 'venator',
    name: 'Venator',
    role: 'Hunter',
    difficulty: 'Medium',
    weapon: 'Twin Pistols',
    description:
      'A relentless vampire hunter who uses traps, holy weapons, and explosives to control the battlefield.',
    displayIcon: '/heroes/icons/venator.webp',
    portrait: '/heroes/portraits/venator.webp',
    abilities: [
      {
        slot: 1,
        name: 'Consecrating Grenade',
        icon: '/heroes/abilities/venator/1.webp',
        description:
          'Throw a holy grenade that explodes and damages enemies in a large area.',
      },
      {
        slot: 2,
        name: 'Gutshot',
        icon: '/heroes/abilities/venator/2.webp',
        description:
          'Fire a powerful close-range shot that deals heavy burst damage.',
      },
      {
        slot: 3,
        name: 'Hex-Lined Snap Trap',
        icon: '/heroes/abilities/venator/3.webp',
        description:
          'Deploy a hidden trap that roots and damages enemies who trigger it.',
      },
      {
        slot: 4,
        name: 'Ira Domini',
        icon: '/heroes/abilities/venator/4.webp',
        description:
          'Fire a blessed crossbow bolt that deals massive Spirit damage to the first hero hit.',
      },
    ],
  },
  {
    id: 'victor',
    name: 'Victor',
    role: 'Tank',
    difficulty: 'Easy',
    weapon: 'Shock Gauntlets',
    description:
      'A durable bruiser who converts damage into power and becomes stronger the longer he stays in combat.',
    displayIcon: '/heroes/icons/victor.webp',
    portrait: '/heroes/portraits/victor.webp',
    abilities: [
      {
        slot: 1,
        name: 'Pain Battery',
        icon: '/heroes/abilities/victor/1.webp',
        description:
          'Store incoming damage before releasing it in a burst of Spirit energy.',
      },
      {
        slot: 2,
        name: 'Jumpstart',
        icon: '/heroes/abilities/victor/2.webp',
        description:
          'Sacrifice a portion of your health to gain regeneration and bonus movement speed.',
      },
      {
        slot: 3,
        name: 'Aura of Suffering',
        icon: '/heroes/abilities/victor/3.webp',
        description:
          'Emit a damaging aura that harms nearby enemies while also draining your own health.',
      },
      {
        slot: 4,
        name: 'Shocking Reanimation',
        icon: '/heroes/abilities/victor/4.webp',
        description:
          'Revive yourself with a burst of electrical energy, damaging nearby enemies.',
      },
    ],
  },
  {
    id: 'the-doorman',
    name: 'The Doorman',
    role: 'Mystic',
    difficulty: 'Hard',
    weapon: 'Hotel Bell',
    description:
      'A trickster support who manipulates portals, positioning, and battlefield control.',
    displayIcon: '/heroes/icons/the-doorman.webp',
    portrait: '/heroes/portraits/the-doorman.webp',
    abilities: [
      {
        slot: 1,
        name: 'Call Bell',
        icon: '/heroes/abilities/the-doorman/1.webp',
        description:
          'Ring a magical bell that damages and slows nearby enemies.',
      },
      {
        slot: 2,
        name: 'Doorway',
        icon: '/heroes/abilities/the-doorman/2.webp',
        description:
          'Create a magical doorway that allows instant travel between linked locations.',
      },
      {
        slot: 3,
        name: 'Luggage Cart',
        icon: '/heroes/abilities/the-doorman/3.webp',
        description:
          'Summon a haunted luggage cart that disrupts enemies and blocks movement.',
      },
      {
        slot: 4,
        name: 'Hotel Guest',
        icon: '/heroes/abilities/the-doorman/4.webp',
        description:
          'Summon a powerful spectral guest that attacks enemies and controls space.',
      },
    ],
  },
];

export function getHero(id: string): Hero | undefined {
  return heroes.find((h) => h.id === id);
}

export function getAllHeroes(): Hero[] {
  return heroes;
}

export function getHeroRoles(): string[] {
  return [...new Set(heroes.map((h) => h.role))].sort();
}

export function getHeroDifficulties(): string[] {
  return [...new Set(heroes.map((h) => h.difficulty))].sort((a, b) => {
    const order = { Easy: 0, Medium: 1, Hard: 2 };
    return (order[a as keyof typeof order] ?? 99) - (order[b as keyof typeof order] ?? 99);
  });
}

export function getAbilitySlotLabel(slot: number): string {
  return slot === 4 ? 'Ultimate' : String(slot);
}

export const ROLE_GRADIENTS: Record<string, string> = {
  Tank: 'from-slate-600 to-blue-700',
  Disruptor: 'from-orange-600 to-amber-600',
  Support: 'from-emerald-600 to-teal-700',
  Sniper: 'from-cyan-600 to-blue-800',
  Carry: 'from-purple-600 to-rose-700',
  Controller: 'from-indigo-600 to-violet-800',
  Assassin: 'from-rose-700 to-red-900',
  Marksman: 'from-amber-600 to-orange-800',
  Mystic: 'from-fuchsia-600 to-purple-900',
  Brawler: 'from-yellow-700 to-red-800',
  Harasser: 'from-violet-600 to-pink-700',
  Protector: 'from-sky-600 to-blue-800',
  Fighter: 'from-zinc-500 to-slate-700',
  Hunter: 'from-lime-600 to-green-800',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-400 bg-green-500/10 border-green-500/20',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};
