import type { Opportunity, Professor, StudentProfile } from '../types'
import { normalizeText } from './utils'

function getOverlap(source: string[], target: string[]) {
  const normalizedTarget = target.map(normalizeText)
  return source.filter((item) => normalizedTarget.includes(normalizeText(item)))
}

function matchesPrerequisite(profile: StudentProfile, prerequisite: string) {
  const required = normalizeText(prerequisite)
  const combined = [...profile.completedCourses, ...profile.skills].map(normalizeText)
  return combined.some((value) => value === required || required.includes(value) || value.includes(required))
}

function buildReasons(base: string[], bonus: string[], missing: string[]) {
  const reasons = [...base]
  if (bonus.length) {
    reasons.push(...bonus)
  }
  if (missing.length) {
    reasons.push(`Plan to strengthen: ${missing.join(', ')}`)
  }
  return reasons
}

export function matchProfessors(profile: StudentProfile, professors: Professor[]) {
  return professors
    .map((professor) => {
      const interestOverlap = getOverlap(profile.interests, professor.researchAreas)
      const prerequisiteMatches = professor.prerequisites.filter((prereq) => matchesPrerequisite(profile, prereq))
      const missingPrerequisites = professor.prerequisites.filter((prereq) => !matchesPrerequisite(profile, prereq))

      const reasons = buildReasons(
        [
          ...interestOverlap.map((area) => `Shared interest in ${area}`),
          ...prerequisiteMatches.map((course) => `Prepared for ${course}`),
        ],
        [
          professor.acceptsTransferStudents ? 'Accepts transfer students' : '',
          professor.beginnerFriendly ? 'Beginner-friendly research path' : '',
        ].filter(Boolean),
        missingPrerequisites,
      )

      const score =
        interestOverlap.length * 3 +
        prerequisiteMatches.length * 2 +
        (professor.acceptsTransferStudents ? 2 : 0) +
        (professor.beginnerFriendly ? 1 : 0)

      return {
        item: professor,
        score,
        reasons,
        missingPrerequisites,
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function matchOpportunities(profile: StudentProfile, opportunities: Opportunity[]) {
  return opportunities
    .map((opportunity) => {
      const tagMatch = getOverlap(profile.interests, opportunity.tags)
      const skillMatch = opportunity.prerequisites.filter((prereq) => matchesPrerequisite(profile, prereq))
      const missingPrerequisites = opportunity.prerequisites.filter((prereq) => !matchesPrerequisite(profile, prereq))

      const reasons = buildReasons(
        [
          ...tagMatch.map((tag) => `Relevant to ${tag}`),
          ...skillMatch.map((course) => `Already prepared for ${course}`),
        ],
        [opportunity.beginnerFriendly ? 'Beginner-friendly opportunity' : 'High priority research entry'],
        missingPrerequisites,
      )

      const score = tagMatch.length * 3 + skillMatch.length * 2 + (opportunity.beginnerFriendly ? 2 : 0)
      return {
        item: opportunity,
        score,
        reasons,
        missingPrerequisites,
      }
    })
    .sort((a, b) => b.score - a.score)
}
