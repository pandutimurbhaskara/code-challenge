import { SwapCard } from './components/SwapCard'
import { ThemeToggle } from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import './App.css'

function App() {
  const { theme, toggle } = useTheme()

  return (
    <main className="stage">
      <div className="stage__glow" aria-hidden="true" />
      <div className="stage__inner">
        <div className="topbar">
          <p className="eyebrow">Exchange desk</p>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
        <SwapCard />
        <footer className="stage__note">
          Rates from the live price feed - balances are simulated see mockBalance function in src/problem2/src/lib/tokens.ts
        </footer>
      </div>
    </main>
  )
}

export default App
