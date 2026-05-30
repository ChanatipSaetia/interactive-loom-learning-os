import { OverviewPage } from '../components/overview/OverviewPage'
import type { TopicRoute } from '../core/routes'

export interface HomePageProps {
  topics: TopicRoute[]
}

export function HomePage({ topics }: HomePageProps) {
  return <OverviewPage topics={topics} />
}
