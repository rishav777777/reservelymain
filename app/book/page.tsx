import { redirect } from 'next/navigation'

// Guests always arrive via /book/[slug] from their restaurant's booking link.
// /book without a slug has no context — send them home.
export default function BookIndexPage() {
  redirect('/')
}
