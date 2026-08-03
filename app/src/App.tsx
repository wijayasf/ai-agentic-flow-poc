import { useMemo } from 'react'
import { useAudioSession } from './audio'
import { ResponsiveDemoShell } from './components/responsive-shell/ResponsiveDemoShell'
import { useRuntimeController } from './runtime'

function App() {
  const controller = useRuntimeController()
  const audio = useAudioSession(controller.state)
  const actions = useMemo(
    () => audio.wrapActions(controller.actions),
    [audio, controller.actions],
  )

  return (
    <ResponsiveDemoShell
      state={controller.state}
      viewModel={controller.viewModel}
      actions={actions}
      audioMuted={audio.muted}
      onToggleAudioMute={audio.toggleMute}
    />
  )
}

export default App
