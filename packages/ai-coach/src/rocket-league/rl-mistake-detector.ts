import type {
  RlCoachInsight,
  RlMistakeCategory,
  RlParsedReplay,
  RlPracticeDrill,
  RlSeverity,
} from '@coachcore/shared';

const BANNED = [
  'rotate better',
  'hit the ball harder',
  'position better',
  'use boost wisely',
  'challenge sooner',
];

function drill(
  title: string,
  description: string,
  difficulty: RlPracticeDrill['difficulty'],
  successMetric: string,
  minutes = 15
): RlPracticeDrill {
  return { title, description, durationMinutes: minutes, difficulty, successMetric };
}

function insight(partial: Omit<RlCoachInsight, 'id'> & { id?: string }): RlCoachInsight {
  const text = [
    partial.whatHappened,
    partial.whyItHappened,
    partial.whyBadOrGood,
    partial.alternativePlay,
    partial.howToImprove,
  ]
    .join(' ')
    .toLowerCase();
  for (const phrase of BANNED) {
    if (text.includes(phrase)) {
      throw new Error(`Banned vague coaching phrase: ${phrase}`);
    }
  }
  return {
    ...partial,
    id: partial.id ?? `rl-${partial.timestamp}-${partial.eventType}`,
    relatedEventIds: partial.relatedEventIds ?? [],
    involvedPlayerIds: partial.involvedPlayerIds ?? [],
  };
}

const SEV: Record<string, { severity: RlSeverity; severityScore: number; wp: number }> = {
  missed_open_net: { severity: 'game_losing', severityScore: 96, wp: -0.22 },
  double_commit: { severity: 'critical', severityScore: 90, wp: -0.18 },
  overcommit: { severity: 'high', severityScore: 78, wp: -0.12 },
  whiff: { severity: 'high', severityScore: 72, wp: -0.08 },
  missed_boost: { severity: 'medium', severityScore: 55, wp: -0.05 },
  poor_challenge: { severity: 'high', severityScore: 70, wp: -0.09 },
  bad_rotation: { severity: 'high', severityScore: 74, wp: -0.1 },
  bad_recovery: { severity: 'medium', severityScore: 58, wp: -0.06 },
  goal: { severity: 'low', severityScore: 20, wp: 0.15 },
  save: { severity: 'low', severityScore: 15, wp: 0.08 },
  assist: { severity: 'low', severityScore: 12, wp: 0.06 },
  demo: { severity: 'low', severityScore: 25, wp: 0.05 },
  excellent_play: { severity: 'low', severityScore: 10, wp: 0.07 },
  aerial: { severity: 'low', severityScore: 18, wp: 0.02 },
  kickoff: { severity: 'medium', severityScore: 40, wp: -0.02 },
};

export function detectRlMistakes(replay: RlParsedReplay): RlCoachInsight[] {
  const subject = replay.subjectPlayerId;
  const out: RlCoachInsight[] = [];

  for (const ev of replay.events) {
    const isSubject = !ev.actorId || ev.actorId === subject;
    const sev = SEV[ev.type] ?? { severity: 'medium' as const, severityScore: 50, wp: -0.04 };

    if (ev.type === 'whiff' && isSubject) {
      out.push(
        insight({
          timestamp: ev.t,
          title: 'Whiffed controllable ground touch',
          eventType: 'whiff',
          category: 'mechanics',
          severity: sev.severity,
          severityScore: sev.severityScore,
          polarity: 'mistake',
          isEstimate: replay.source !== 'ballchasing',
          confidence: replay.source === 'fixture' ? 62 : 78,
          winProbabilityDelta: sev.wp,
          difficulty: 4,
          whatHappened: `At ${formatClock(ev.t)} you approached a midfield bounce at ~${ev.speed ?? 1400} UU/s with ${ev.boost ?? 0} boost and completely missed the ball.`,
          whyItHappened:
            'Your nose was pointed through the ball instead of to a first-touch target, and you jumped a half-second early — the ball skipped under your hitbox.',
          whyBadOrGood:
            'A free midfield touch became a 50/50 you were not prepared for. Your teammate was already committing, so the whiff flipped a safe possession into an odd-man rush against you.',
          alternativePlay:
            'Coast one car-length later, soft front-flip into the bottom of the ball toward your corner boost, then collect 100 before re-challenging.',
          alternativePositioning:
            'Arrive slightly shadow-side (back post relative to your net) so a missed touch still leaves you between ball and goal.',
          alternativeChallenge:
            'If late, fake the challenge at ~1.5 car lengths to force their touch wide instead of swinging.',
          expectedOutcome:
            'You keep possession or force a weak wide touch while your teammate stays last back.',
          howToImprove:
            'In free play, set 50 random midfield bounces and only take touches you can redirect to a corner pad. Miss = reset.',
          mechanicsOrDecision: 'First touch timing + decision to swing vs soft redirect',
          practiceDrill: drill(
            'Bounce first-touch to corner',
            'Spawn midfield bounces; touch only if you can place ball toward a big pad without jumping early.',
            'easy',
            '40/50 controlled redirects'
          ),
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject],
          position: ev.position,
          ballPosition: ev.ballPosition,
          boostAmount: ev.boost,
          speed: ev.speed,
          pressureLevel: 'medium',
          recommendedPosition: { x: (ev.position?.x ?? 0) - 200, y: (ev.position?.y ?? 0) - 400, z: 20 },
        })
      );
    }

    if (ev.type === 'double_commit' && isSubject) {
      out.push(
        insight({
          timestamp: ev.t,
          title: 'Double committed with last back',
          eventType: 'double_commit',
          category: 'rotation',
          severity: sev.severity,
          severityScore: sev.severityScore,
          polarity: 'mistake',
          isEstimate: true,
          confidence: 74,
          winProbabilityDelta: sev.wp,
          difficulty: 6,
          whatHappened: `At ${formatClock(ev.t)} both you and your teammate challenged the same 50 near mid while nobody held back post.`,
          whyItHappened:
            'You mirrored your teammate’s challenge line instead of reading them as first man and peeling to shadow.',
          whyBadOrGood:
            'Two cars in the ball’s radius and zero net coverage is a classic 2s concede pattern — the opponent’s free touch became an open-net lane.',
          alternativePlay:
            'Once teammate’s wheels face the ball inside 1s, turn off and take back-post shadow at boost ≤40, ready to challenge the second bounce.',
          alternativeRotation:
            'Cut behind the play toward your far post, not toward the ball, collecting small pads on the back wall line.',
          expectedOutcome: 'Opponent’s touch is contested by one man while you erase the follow-up.',
          howToImprove:
            'Custom training: 2v2 shadow pack — verbalize “I am second” before every mid challenge.',
          mechanicsOrDecision: 'Second-man discipline / challenge selection',
          practiceDrill: drill(
            'Second-man only challenges',
            'In casual 2s, for 10 games you may only challenge as second man after teammate commits.',
            'medium',
            '0 double commits across 3 matches'
          ),
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject, 'blue-1'],
          position: ev.position,
          ballPosition: ev.ballPosition,
          boostAmount: ev.boost,
          pressureLevel: 'high',
          gameScore: 'trailing pressure',
          recommendedPosition: { x: 0, y: -3500, z: 20 },
        })
      );
    }

    if (ev.type === 'missed_open_net' && isSubject) {
      out.push(
        insight({
          timestamp: ev.t,
          title: 'Missed open net from midfield',
          eventType: 'missed_open_net',
          category: 'shot',
          severity: sev.severity,
          severityScore: sev.severityScore,
          polarity: 'mistake',
          isEstimate: true,
          confidence: 80,
          winProbabilityDelta: sev.wp,
          difficulty: 3,
          whatHappened: `Open net at ${formatClock(ev.t)} — ball rolling toward orange goal with keeper out, and your shot went wide/over.`,
          whyItHappened:
            'You opened the shot angle with a powerslide when a soft front-flip push along the ground would have kept the ball on target.',
          whyBadOrGood:
            'Open nets are near-100% expected goals for Champ+. Missing flips momentum and often gifts a demo-boosted counter.',
          alternativePlay:
            'Drive into the bottom third of the ball with no jump; aim far-post corner; save flip for a 50 if a defender recovers.',
          expectedOutcome: 'Goal scored or forced last-man panic save with you ready for rebound.',
          howToImprove: 'Workshop open-net pack: 100 reps, no jumping allowed on first 50.',
          mechanicsOrDecision: 'Shot selection under low pressure',
          practiceDrill: drill(
            'No-jump open nets',
            'Open net training pack — first 50 shots cannot jump.',
            'easy',
            '90% conversion'
          ),
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject],
          position: ev.position,
          ballPosition: ev.ballPosition,
          boostAmount: ev.boost,
          pressureLevel: 'low',
        })
      );
    }

    if (ev.type === 'overcommit' && isSubject) {
      out.push(
        insight({
          timestamp: ev.t,
          title: 'Overcommitted backline challenge',
          eventType: 'overcommit',
          category: 'challenge',
          severity: sev.severity,
          severityScore: sev.severityScore,
          polarity: 'mistake',
          isEstimate: true,
          confidence: 71,
          winProbabilityDelta: sev.wp,
          difficulty: 5,
          whatHappened: `You dove a challenge near your backline at ${formatClock(ev.t)} with low boost and no teammate covering the back post.`,
          whyItHappened:
            'Pressure instinct kicked in after a lost 50 — you challenged the first touch instead of delaying for a controlled shadow.',
          whyBadOrGood:
            'Challenging from low boost on the backline turns a readable dribble into a skipped ball behind you with no recover path.',
          alternativePlay:
            'Shadow at ~1.5–2 car lengths, fake once to force a touch, then challenge when the ball is popped up or away from net.',
          alternativeChallenge: 'Challenge only after collecting mid-pads to ≥30 boost.',
          expectedOutcome: 'Force a weak touch you can clear to the corner instead of a slot shot.',
          howToImprove: '1v1 shadow defense free play: never challenge below 30 boost inside your half.',
          mechanicsOrDecision: 'Challenge timing + boost threshold',
          practiceDrill: drill(
            '30-boost challenge rule',
            'In 1s free play, challenges inside your half require ≥30 boost.',
            'medium',
            '10-minute session with ≤2 overcommits'
          ),
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject],
          position: ev.position,
          ballPosition: ev.ballPosition,
          boostAmount: ev.boost,
          pressureLevel: 'high',
          recommendedPosition: { x: 200, y: -2800, z: 20 },
        })
      );
    }

    if (ev.type === 'missed_boost' && isSubject) {
      out.push(
        insight({
          timestamp: ev.t,
          title: 'Rotated into empty big pad — boost starved',
          eventType: 'missed_boost',
          category: 'boost',
          severity: sev.severity,
          severityScore: sev.severityScore,
          polarity: 'mistake',
          isEstimate: true,
          confidence: 68,
          winProbabilityDelta: sev.wp,
          difficulty: 4,
          whatHappened: `At ${formatClock(ev.t)} you pathrotated to a corner 100 that was already taken and arrived at 0 boost.`,
          whyItHappened:
            'You pre-committed to the big pad path without checking pad lights / teammate boost collection on the way back.',
          whyBadOrGood:
            'Zero-boost in the defensive corner means you cannot contest aerials or demo clears — the next challenge becomes a guess.',
          alternativePlay:
            'If the corner pad is dark, swing the back-wall small-pad line (3–4 pads) to rebuild 48–60 before re-entering mid.',
          expectedOutcome: 'You rejoin the play with enough boost to challenge or demo.',
          howToImprove: 'Pad path drills: full back-wall small pad loops until consistent 12s for 60+ boost.',
          mechanicsOrDecision: 'Boost pathing awareness',
          practiceDrill: drill(
            'Small-pad back-wall loop',
            'From goal line, collect only small pads along back/side wall to 60 boost.',
            'easy',
            'Under 12 seconds consistently'
          ),
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject],
          position: ev.position,
          boostAmount: ev.boost,
          pressureLevel: 'medium',
        })
      );
    }

    if (ev.type === 'save' && isSubject) {
      out.push(
        insight({
          timestamp: ev.t,
          title: 'High-quality backboard save',
          eventType: 'save',
          category: 'defense',
          severity: 'low',
          severityScore: 12,
          polarity: 'excellent',
          isEstimate: true,
          confidence: 76,
          winProbabilityDelta: 0.08,
          difficulty: 6,
          whatHappened: `Backboard save at ${formatClock(ev.t)} with low boost — you read the bounce and cleared high.`,
          whyItHappened: 'You pre-positioned on the backboard line instead of sitting on the goal line flat.',
          whyBadOrGood:
            'Backboard saves preserve momentum and often create a clear to the corner instead of a second chance on the doorstep.',
          alternativePlay: 'Continue this read; after the save, immediately path to the nearest small pads before chasing.',
          expectedOutcome: 'Defensive stop converts into a controlled clear.',
          howToImprove: 'Backboard reads pack — land facing the corner pad every save.',
          mechanicsOrDecision: 'Backboard defense read',
          practiceDrill: drill(
            'Backboard save → pad',
            'After each backboard save in training, touch a corner pad within 2s.',
            'medium',
            '20 chained reps'
          ),
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject],
          position: ev.position,
          ballPosition: ev.ballPosition,
          boostAmount: ev.boost,
          pressureLevel: 'high',
        })
      );
    }

    if (ev.type === 'excellent_play' && isSubject) {
      out.push(
        insight({
          timestamp: ev.t,
          title: 'Patient shadow forced weak touch',
          eventType: 'excellent_play',
          category: 'defense',
          severity: 'low',
          severityScore: 10,
          polarity: 'excellent',
          isEstimate: true,
          confidence: 72,
          winProbabilityDelta: 0.07,
          difficulty: 5,
          whatHappened: `At ${formatClock(ev.t)} you shadowed instead of diving and forced the attacker into a weak side touch.`,
          whyItHappened: 'You matched their speed and delayed the challenge until the ball left their dribble cone.',
          whyBadOrGood: 'This is SSL-level defense — you stole time for your teammate to rotate in without giving a free flick angle.',
          alternativePlay: 'Default this pattern whenever boost <40 on defense.',
          expectedOutcome: 'Low-risk possession change.',
          howToImprove: 'Review this clip weekly; replicate the delay timing in 1s.',
          mechanicsOrDecision: 'Shadow defense patience',
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject],
          position: ev.position,
          ballPosition: ev.ballPosition,
          boostAmount: ev.boost,
          pressureLevel: 'medium',
        })
      );
    }

    if ((ev.type === 'goal' || ev.type === 'assist' || ev.type === 'demo') && isSubject) {
      const category: RlMistakeCategory =
        ev.type === 'demo' ? 'demo' : ev.type === 'assist' ? 'decision_making' : 'shot';
      out.push(
        insight({
          timestamp: ev.t,
          title: ev.label,
          eventType: ev.type,
          category,
          severity: 'low',
          severityScore: 18,
          polarity: 'excellent',
          isEstimate: true,
          confidence: 70,
          winProbabilityDelta: sev.wp,
          difficulty: 5,
          whatHappened: ev.label,
          whyItHappened:
            ev.type === 'demo'
              ? 'You path-demoe’d the last man before the cross, removing the only defender capable of a save.'
              : 'You converted a numbers advantage created by prior pressure into a high-percentage finish or setup.',
          whyBadOrGood: 'Positive expected-goals swing — keep chaining demo/pass patterns when last man is isolated.',
          alternativePlay: 'Same pattern — check boost before demo so you can follow the ball after.',
          expectedOutcome: 'Goal threat or actual goal.',
          howToImprove: 'Demo-to-pass free play: only demo last man when teammate is mid-boost ready.',
          mechanicsOrDecision: ev.type === 'demo' ? 'Demo pathing' : 'Offense conversion',
          relatedEventIds: [ev.id],
          involvedPlayerIds: [subject],
          position: ev.position,
          ballPosition: ev.ballPosition,
          boostAmount: ev.boost,
          pressureLevel: 'medium',
        })
      );
    }
  }

  return out.sort((a, b) => a.timestamp - b.timestamp);
}

function formatClock(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
