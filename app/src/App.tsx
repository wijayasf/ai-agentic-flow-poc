import { StaticShell } from './components/static-shell/StaticShell'
import { useRuntimeController } from './runtime'

function App() {
  const controller = useRuntimeController()

  return <StaticShell {...controller} />
}

export default App
