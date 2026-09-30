/**
 * Grammar taxonomy is useful to authors, but a learner needs the function.
 * This UI-only mapping leaves the frozen pattern IDs, titles and scoring
 * untouched while presenting a short Russian heading above the formula.
 */
export function grammarDisplayTitle(authorTitle: string): string {
  const title = authorTitle.toLowerCase();
  if (title.includes("there is") || title.includes("there are")) {
    return "Говорим, что где находится";
  }
  if (title.includes("frequency")) return "Говорим, как часто это бывает";
  if (title.includes("present perfect")) {
    if (title.includes("duration")) return "Говорим, как долго это длится";
    if (title.includes("experience")) return "Говорим о своём опыте";
    return "Связываем прошлое с настоящим";
  }
  if (title.includes("past simple") || title.includes("past ")) {
    return "Рассказываем о том, что произошло";
  }
  if (title.includes("present continuous")) {
    return "Говорим о договорённостях";
  }
  if (
    title.includes("going to") ||
    title.includes("future") ||
    title.includes("will ")
  ) {
    return "Говорим о планах и последствиях";
  }
  if (title.includes("question")) return "Задаём вопрос естественно";
  if (title.includes("comparative") || title.includes("superlative")) {
    return "Сравниваем варианты";
  }
  if (title.includes("passive")) return "Ставим результат на первое место";
  if (title.includes("should")) return "Даём и уточняем совет";
  if (title.includes("would like") || title.includes("would mind")) {
    return "Формулируем просьбу вежливо";
  }
  if (title.includes("could") || title.includes("polite")) {
    return "Просим и уточняем вежливо";
  }
  if (title.includes("can")) return "Говорим о возможности";
  if (title.includes("like +") || title.includes("worth")) {
    return "Говорим об интересах и рекомендациях";
  }
  if (title.includes("present simple") || title.startsWith("be ")) {
    return "Говорим о людях, фактах и привычках";
  }
  if (title.includes("reported") || title.includes("confirmation")) {
    return "Уточняем услышанное";
  }
  if (
    title.includes("conditional") ||
    title.includes("depends") ||
    title.includes("whether") ||
    title.includes("given that")
  ) {
    return "Объясняем условия и последствия";
  }
  if (title.includes("contrast") || title.includes("concession")) {
    return "Показываем две стороны мысли";
  }
  return "Связываем мысль естественно";
}
