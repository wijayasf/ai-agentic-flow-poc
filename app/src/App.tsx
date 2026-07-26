import { ResponsiveDemoShell } from './components/responsive-shell/ResponsiveDemoShell'
import { useRuntimeController } from './runtime'

function App() {
  const controller = useRuntimeController()

  return <ResponsiveDemoShell {...controller} />
}

export default App
