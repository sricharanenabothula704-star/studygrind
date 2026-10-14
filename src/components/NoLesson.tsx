import { Link } from 'react-router-dom'

export default function NoLesson() {
  return (
    <div className="card text-center">
      <p className="mb-3 text-zinc-500">Learn a topic first and this page will build on it.</p>
      <Link to="/" className="btn btn-solid">
        Go to Learn
      </Link>
    </div>
  )
}
