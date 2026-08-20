import { useState, type FormEvent } from 'react'
import './App.css'

function App() {
  const [amountToSend, setAmountToSend] = useState('')
  const [amountToReceive, setAmountToReceive] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Swap logic goes here.
  }

  return (
    <form onSubmit={handleSubmit}>
      <h5>Swap</h5>

      <label htmlFor="input-amount">Amount to send</label>
      <input
        id="input-amount"
        value={amountToSend}
        onChange={(e) => setAmountToSend(e.target.value)}
      />

      <label htmlFor="output-amount">Amount to receive</label>
      <input
        id="output-amount"
        value={amountToReceive}
        onChange={(e) => setAmountToReceive(e.target.value)}
      />

      <button type="submit">CONFIRM SWAP</button>
    </form>
  )
}

export default App
