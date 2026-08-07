import type {
  RlCoachInsight,
  RlGrade,
  RlParsedReplay,
  RlSkillAxisMeta,
  RlSkillScores,
} from '@coachcore/shared';

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function gradeFromScore(score: number): RlGrade {
  if (score >= 95) return 'A+';
  if (score >= 88) return 'A';
  if (score >= 78) return 'B';
  if (score >= 68) return 'C';
  if (score >= 55) return 'D';
  return 'F';
}

export function computeRlSkillScores(
  replay: RlParsedReplay,
  insights: RlCoachInsight[]
): { scores: RlSkillScores; axes: RlSkillAxisMeta[]; overallGrade: RlGrade } {
  const mistakes = insights.filter((i) => i.polarity === 'mistake');
  const excellents = insights.filter((i) => i.polarity === 'excellent');
  const subject = replay.metadata.players.find((p) => p.isSubject);

  const countCat = (cat: string) => mistakes.filter((m) => m.category === cat).length;

  const mechanical = clamp(78 - countCat('mechanics') * 8 - countCat('shot') * 6 + excellents.length * 2);
  const gameSense = clamp(76 - countCat('decision_making') * 7 - countCat('challenge') * 6);
  const boost = clamp(74 - countCat('boost') * 10 + (subject?.boostUsage ? subject.boostUsage * 10 : 0));
  const rotation = clamp(72 - countCat('rotation') * 12);
  const recovery = clamp(70 - countCat('recovery') * 10);
  const aerial = clamp(68 + (excellents.filter((e) => e.eventType === 'aerial').length) * 5 - countCat('aerial') * 8);
  const kickoff = clamp(70 - mistakes.filter((m) => m.eventType === 'kickoff').length * 12);
  const defense = clamp(75 - countCat('defense') * 5 + excellents.filter((e) => e.category === 'defense').length * 6);
  const offense = clamp(70 + (subject?.goals ?? 0) * 4 + (subject?.assists ?? 0) * 3 - countCat('shot') * 5);
  const consistency = clamp(80 - mistakes.length * 3 + excellents.length * 2);
  const decisionMaking = clamp((gameSense + rotation + boost) / 3);
  const overall = clamp(
    (mechanical +
      gameSense +
      boost +
      rotation +
      recovery +
      aerial +
      kickoff +
      defense +
      offense +
      consistency +
      decisionMaking) /
      11
  );

  const scores: RlSkillScores = {
    mechanical,
    gameSense,
    boost,
    rotation,
    recovery,
    aerial,
    kickoff,
    defense,
    offense,
    consistency,
    decisionMaking,
    overall,
  };

  const entries: Array<{ key: keyof RlSkillScores; label: string; tip: string }> = [
    { key: 'mechanical', label: 'Mechanical', tip: 'First-touch and shot packs daily' },
    { key: 'gameSense', label: 'Game Sense', tip: 'Review challenge decisions in replay' },
    { key: 'boost', label: 'Boost', tip: 'Small-pad path loops' },
    { key: 'rotation', label: 'Rotation', tip: 'Second-man only drills in casual' },
    { key: 'recovery', label: 'Recovery', tip: 'Half-flip / wave-dash free play' },
    { key: 'aerial', label: 'Aerial', tip: 'Fast aerial accuracy pack' },
    { key: 'kickoff', label: 'Kickoff', tip: 'Speed-flip kickoff consistency' },
    { key: 'defense', label: 'Defense', tip: 'Shadow → challenge timing' },
    { key: 'offense', label: 'Offense', tip: 'Pass-first when teammate last back' },
    { key: 'consistency', label: 'Consistency', tip: 'Track mistake count per match' },
    { key: 'decisionMaking', label: 'Decisions', tip: 'Pause before every backline challenge' },
  ];

  const values = entries.map((e) => scores[e.key]);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const axes: RlSkillAxisMeta[] = entries.map((e) => {
    const score = scores[e.key];
    return {
      key: e.key,
      label: e.label,
      score,
      grade: gradeFromScore(score),
      trend: 'flat',
      isStrength: score === max && score >= 75,
      isWeakness: score === min,
      practiceRecommendation: e.tip,
    };
  });

  return { scores, axes, overallGrade: gradeFromScore(overall) };
}

export { gradeFromScore };
