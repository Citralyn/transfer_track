import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, FileText, Loader2, Search, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { decodeSearchSlug, rankBySearchQuery } from '@/lib/search'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

const INITIAL_RESULT_LIMIT = 5
const RESULT_INCREMENT = 10

export default function SearchResults() {
  const { searchSlug } = useParams()
  const [searchParams] = useSearchParams()
  const query = decodeSearchSlug(searchSlug) || searchParams.get('q') || ''
  const [visibleCounts, setVisibleCounts] = useState({
    people: INITIAL_RESULT_LIMIT,
    opportunities: INITIAL_RESULT_LIMIT,
    posts: INITIAL_RESULT_LIMIT,
  })

  useEffect(() => {
    setVisibleCounts({
      people: INITIAL_RESULT_LIMIT,
      opportunities: INITIAL_RESULT_LIMIT,
      posts: INITIAL_RESULT_LIMIT,
    })
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', query],
    enabled: Boolean(query.trim()),
    queryFn: async () => {
      const [peopleResult, opportunitiesResult, postsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true }),
        supabase
          .from('opportunities')
          .select(`
            *,
            profiles:professor_id (
              full_name,
              username,
              avatar_url,
              department,
              bio
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('posts')
          .select(`
            *,
            profiles (
              full_name,
              username,
              avatar_url,
              role,
              school_name,
              department,
              bio
            ),
            post_comments (
              content,
              profiles (full_name, username, avatar_url)
            )
          `)
          .order('created_at', { ascending: false }),
      ])

      if (peopleResult.error) throw peopleResult.error
      if (opportunitiesResult.error) throw opportunitiesResult.error
      if (postsResult.error) throw postsResult.error

      return {
        people: peopleResult.data || [],
        opportunities: opportunitiesResult.data || [],
        posts: postsResult.data || [],
      }
    },
  })

  const results = useMemo(() => ({
    people: rankBySearchQuery(data?.people, query, [
      { path: 'full_name', weight: 8 },
      { path: 'username', weight: 5 },
    ], [
      'full_name',
      'username',
    ], 'word-start'),
    opportunities: rankBySearchQuery(data?.opportunities, query, [
      { path: 'title', weight: 8 },
      { path: 'profiles.full_name', weight: 4 },
      { path: 'department', weight: 3 },
      { path: 'university', weight: 3 },
      { path: 'tags', weight: 2 },
      { path: 'description', weight: 1 },
      { path: 'requirements', weight: 1 },
    ]),
    posts: rankBySearchQuery(data?.posts, query, [
      { path: 'content', weight: 3 },
    ], ['content']),
  }), [data, query])

  const totalResults = results.people.length + results.opportunities.length + results.posts.length
  const visibleResults = {
    people: results.people.slice(0, visibleCounts.people),
    opportunities: results.opportunities.slice(0, visibleCounts.opportunities),
    posts: results.posts.slice(0, visibleCounts.posts),
  }

  const showMore = (section: keyof typeof visibleCounts) => {
    setVisibleCounts((current) => ({
      ...current,
      [section]: current[section] + RESULT_INCREMENT,
    }))
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Search</h1>
        <p className="text-brand-500 mt-1 font-medium">
          {query ? `${totalResults} result${totalResults === 1 ? '' : 's'} for "${query}"` : 'Search posts, opportunities, and people.'}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-[2.5rem] border border-brand-100 bg-white p-10 text-center shadow-sm">
          <Loader2 className="w-7 h-7 animate-spin text-brand-500 mx-auto" />
        </div>
      ) : !query.trim() || totalResults === 0 ? (
        <div className="rounded-[2.5rem] border border-brand-100 bg-white p-10 text-center shadow-sm">
          <div className="w-16 h-16 gradient-soft rounded-3xl flex items-center justify-center text-brand-300 mx-auto mb-5">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-brand-900">{query ? 'No matches' : 'Start a search'}</h3>
          <p className="text-brand-500 mt-2">Try a name, school, topic, description, department, tag, or post keyword.</p>
        </div>
      ) : (
        <>
          <ResultSection
            title="People"
            icon={<User className="w-5 h-5" />}
            count={results.people.length}
            visibleCount={visibleResults.people.length}
            onViewMore={() => showMore('people')}
          >
            {visibleResults.people.map((person: any) => (
              <Link key={person.id} to={`/profile/${person.username}`} className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 hover:shadow-md transition-all group">
                <ProfileAvatar profile={person} className="w-12 h-12 rounded-xl gradient-brand text-white font-bold text-lg shrink-0" />
                <div>
                  <p className="font-bold text-brand-900 group-hover:text-accent-600 transition-colors">{person.full_name}</p>
                  <p className="text-sm text-brand-500">{person.role} - {person.school_name || person.department || 'Transfer Track'}</p>
                </div>
              </Link>
            ))}
          </ResultSection>

          <ResultSection
            title="Opportunities"
            icon={<Briefcase className="w-5 h-5" />}
            count={results.opportunities.length}
            visibleCount={visibleResults.opportunities.length}
            onViewMore={() => showMore('opportunities')}
          >
            {visibleResults.opportunities.map((opportunity: any) => (
              <Link key={opportunity.id} to={`/opportunities/${opportunity.id}`} className="block rounded-2xl border border-brand-100 bg-brand-50/60 p-5 hover:shadow-md transition-all group">
                <p className="font-bold text-brand-900 group-hover:text-accent-600 transition-colors">{opportunity.title}</p>
                <p className="text-sm text-brand-500 mt-1">{opportunity.university} - {opportunity.department}</p>
                <p className="text-sm text-brand-600 mt-3 line-clamp-2">{opportunity.description}</p>
              </Link>
            ))}
          </ResultSection>

          <ResultSection
            title="Posts"
            icon={<FileText className="w-5 h-5" />}
            count={results.posts.length}
            visibleCount={visibleResults.posts.length}
            onViewMore={() => showMore('posts')}
          >
            {visibleResults.posts.map((post: any) => (
              <Link key={post.id} to={`/feed/${post.id}`} className="block rounded-2xl border border-brand-100 bg-brand-50/60 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <ProfileAvatar profile={post.profiles} className="w-10 h-10 rounded-xl gradient-brand text-white font-bold text-sm shrink-0" />
                  <div>
                    <p className="font-bold text-brand-900 group-hover:text-accent-600 transition-colors">{post.profiles?.full_name || 'Post'}</p>
                    <p className="text-xs text-brand-400">{post.profiles?.school_name || 'Transfer Track'}</p>
                  </div>
                </div>
                <p className="text-sm text-brand-600 line-clamp-3">{post.content}</p>
              </Link>
            ))}
          </ResultSection>
        </>
      )}
    </div>
  )
}

function ResultSection({
  title,
  icon,
  count,
  visibleCount,
  onViewMore,
  children,
}: {
  title: string
  icon: ReactNode
  count: number
  visibleCount: number
  onViewMore: () => void
  children: ReactNode
}) {
  if (count === 0) return null
  const remainingCount = count - visibleCount

  return (
    <section className="rounded-[2.5rem] border border-brand-100 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold text-brand-900 mb-5 flex items-center gap-2">
        <span className="text-accent-500">{icon}</span>
        {title}
        <span className="text-xs font-bold bg-brand-50 text-brand-500 px-2 py-1 rounded-full">{count}</span>
      </h2>
      <div className="space-y-4">{children}</div>
      {remainingCount > 0 && (
        <button
          type="button"
          onClick={onViewMore}
          className="mt-5 w-full rounded-2xl border border-brand-100 bg-white px-5 py-3 text-sm font-bold text-brand-700 hover:border-accent-200 hover:text-accent-600 hover:shadow-sm transition-all"
        >
          View more {Math.min(RESULT_INCREMENT, remainingCount)}
        </button>
      )}
    </section>
  )
}
