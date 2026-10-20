import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, jest } from '@jest/globals'
import Clock from './Clock'
import { DEFAULT_SETTINGS } from './types'

describe('Pomodorino Clock Component', () => {
  test('renders header and timer digits', async () => {
    render(
      <Clock
        phase="focus"
        formattedTime="25:00"
        isRunning={false}
        progress={1}
        completedCount={2}
        settings={DEFAULT_SETTINGS}
        onToggle={jest.fn()}
        onReset={jest.fn()}
        onSkip={jest.fn()}
        onSwitchPhase={jest.fn()}
        onUpdateSettings={jest.fn()}
      />
    )

    // Verify main heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pomodorino Timer')
    // Verify time display
    expect(screen.getByText('25:00')).toBeInTheDocument()
    // Verify Start button
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
  })

  test('calls onToggle when Start button is clicked', () => {
    const handleToggle = jest.fn()
    render(
      <Clock
        phase="focus"
        formattedTime="25:00"
        isRunning={false}
        progress={1}
        completedCount={0}
        settings={DEFAULT_SETTINGS}
        onToggle={handleToggle}
        onReset={jest.fn()}
        onSkip={jest.fn()}
        onSwitchPhase={jest.fn()}
        onUpdateSettings={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /start timer/i }))
    expect(handleToggle).toHaveBeenCalledTimes(1)
  })

  test('calls onSwitchPhase when mode buttons are clicked', () => {
    const handleSwitchPhase = jest.fn()
    render(
      <Clock
        phase="focus"
        formattedTime="25:00"
        isRunning={false}
        progress={1}
        completedCount={0}
        settings={DEFAULT_SETTINGS}
        onToggle={jest.fn()}
        onReset={jest.fn()}
        onSkip={jest.fn()}
        onSwitchPhase={handleSwitchPhase}
        onUpdateSettings={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /short break/i }))
    expect(handleSwitchPhase).toHaveBeenCalledWith('shortBreak')
  })
})
