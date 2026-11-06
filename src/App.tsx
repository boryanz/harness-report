import {useEffect, useState} from 'react'

function App() {
  console.log('App rendered')
  const [sessions, setSessions] = useState<string[]>([])

  useEffect(() => {
    console.log('Fetching sessions')

    async function loadSessions() {
      const response = await fetch('/api/sessions')
      const data: string[] = await response.json()
      setSessions(data)
    }

    loadSessions()
  }, [])

  return (
    <main>
      <h1>Harness report</h1>
      <ul>{sessions.map((name) => (
        <li key={name}>{name}</li>
      ))}</ul>
    </main>
  )
}

export default App
