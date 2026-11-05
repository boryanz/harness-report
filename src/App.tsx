import {useState} from 'react'

const sessions = ["Fix login crash", "Add journey data module", "Review PR"]

function App() {
  console.log('App rendered')
  const [count, setCount] = useState(0)

  function handleClick() {
    setCount(count + 1)
    console.log('Clicked', count)
  }

  return (
    <main>
      <h1>Harness report</h1>
      <button onClick={handleClick}>Count is {count}</button>
      <ul>{sessions.map((name) => (
        <li key={name}>{name}</li>
      ))}</ul>
    </main>
  )
}

export default App
