export type StudentProfile = {
  name: string
  communityCollege: string
  intendedMajor: string
  transferGoal: string
  completedCourses: string[]
  interests: string[]
  skills: string[]
  careerGoal: string
}

export type Professor = {
  id: string
  name: string
  title: string
  university: string
  department: string
  researchAreas: string[]
  prerequisites: string[]
  resources: string[]
  beginnerFriendly: boolean
  acceptsTransferStudents: boolean
  bio: string
}

export type Opportunity = {
  id: string
  title: string
  description: string
  professorId: string
  tags: string[]
  prerequisites: string[]
  beginnerFriendly: boolean
}

export type Resource = {
  id: string
  title: string
  description: string
  link: string
  tags: string[]
}

export type MatchResult<T> = {
  item: T
  score: number
  reasons: string[]
  missingPrerequisites: string[]
}

export type InterestRequest = {
  id: string
  professorId: string
  studentName: string
  communityCollege: string
  intendedMajor: string
  careerGoal: string
  message: string
  date: string
}
