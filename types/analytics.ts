export interface AnalyticsData {
  reservationsPerDay: Array<{
    date:   string
    label:  string
    online: number
    walkIn: number
  }>
  peakHours: Array<{
    hour:  string
    count: number
  }>
  statusBreakdown: Array<{
    status: string
    count:  number
  }>
  summary: {
    total:            number
    approvalRate:     number | null
    noShowRate:       number | null
    cancellationRate: number | null
  }
}
