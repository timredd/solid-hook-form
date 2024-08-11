import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'

import { Show, createEffect, on } from 'solid-js'
import { createForm } from '../../createForm'

describe('clearErrors', () => {
  it('should remove error', () => {
    const { result } = renderHook(() => createForm<{ input: string }>())
    result.register('input')
    result.setError('input', {
      type: 'test',
      message: 'message',
    })

    result.clearErrors('input')

    expect(result.formState.errors).toEqual({})
  })

  it('should remove nested error', () => {
    const { result } = renderHook(() =>
      createForm<{ input: { nested: string } }>(),
    )

    result.formState.errors
    result.setError('input.nested', {
      type: 'test',
    })

    expect(result.formState.errors.input?.nested).toBeDefined()

    result.clearErrors('input.nested')

    expect(result.formState.errors.input?.nested).toBeUndefined()
  })

  it('should remove deep nested error and set it to undefined', async () => {
    let currentErrors = {}

    const Component = () => {
      const {
        register,
        formState: { errors },
        trigger,
        clearErrors,
      } = createForm<{
        test: { data: string }
      }>()

      currentErrors = errors
      return (
        <div>
          <input type="text" {...register('test.data', { required: true })} />
          <button type={'button'} onClick={() => trigger()}>
            submit
          </button>
          <button type={'button'} onClick={() => clearErrors(['test.data'])}>
            clear
          </button>
        </div>
      )
    }

    render(() => <Component />)

    fireEvent.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() =>
      expect(currentErrors).toEqual({
        test: {
          data: {
            message: '',
            ref: screen.getByRole('textbox'),
            type: 'required',
          },
        },
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'clear' }))

    expect(currentErrors).toEqual({})
  })

  it('should remove specified errors', () => {
    const { result } = renderHook(() =>
      createForm<{
        input: string
        input1: string
        input2: string
        nest: { data: string; data1: string }
      }>(),
    )

    result.formState.errors

    const error = {
      type: 'test',
      message: 'message',
    }

    result.register('input')
    result.register('input1')
    result.register('input2')
    result.setError('input', error)
    result.setError('input1', error)
    result.setError('input2', error)

    result.register('nest.data')
    result.register('nest.data1')
    result.setError('nest.data', error)
    result.setError('nest.data1', error)

    const errors = {
      input: {
        ...error,
        ref: {
          name: 'input',
        },
      },
      input1: {
        ...error,
        ref: {
          name: 'input1',
        },
      },
      input2: {
        ...error,
        ref: {
          name: 'input2',
        },
      },
      nest: {
        data: {
          ...error,
          ref: {
            name: 'nest.data',
          },
        },
        data1: {
          ...error,
          ref: {
            name: 'nest.data1',
          },
        },
      },
    }
    expect(result.formState.errors).toEqual(errors)

    result.clearErrors(['input', 'input1', 'nest.data'])
    expect(result.formState.errors).toEqual({
      input2: errors.input2,
      nest: {
        data1: errors.nest.data1,
      },
    })
  })

  it('should remove all error', () => {
    const { result } = renderHook(() =>
      createForm<{ input: string; input1: string; input2: string }>(),
    )

    result.formState.errors

    const error = {
      type: 'test',
      message: 'message',
    }
    result.setError('input', error)
    result.setError('input1', error)
    result.setError('input2', error)

    expect(result.formState.errors).toEqual({
      input: {
        ...error,
        ref: undefined,
        types: undefined,
      },
      input1: {
        ...error,
        ref: undefined,
        types: undefined,
      },
      input2: {
        ...error,
        ref: undefined,
        types: undefined,
      },
    })

    result.clearErrors()
    expect(result.formState.errors).toEqual({})
  })

  it('should prevent the submission if there is a custom error', async () => {
    const submit = vi.fn()
    const { result } = renderHook(() =>
      createForm<{ data: string; whatever: string }>(),
    )

    result.register('data')

    result.setError('whatever', { type: 'server' })

    await result.handleSubmit(submit)()
    expect(submit).not.toBeCalled()

    result.clearErrors('whatever')

    await result.handleSubmit(submit)()
    expect(submit).toBeCalled()
  })

  it('should update isValid to true with setError', async () => {
    const App = () => {
      const form = createForm({ mode: 'onChange' })

      return (
        <div>
          <button
            onClick={() => {
              form.setError('test', { type: 'test' })
            }}
          >
            setError
          </button>

          <button
            onClick={() => {
              form.clearErrors()
            }}
          >
            clearError
          </button>
          <Show when={form.formState.isValid} fallback={'no'}>
            {'yes'}
          </Show>
        </div>
      )
    }

    const { findByText, getByRole } = render(() => <App />)

    expect(await findByText('yes')).toBeVisible()

    fireEvent.click(getByRole('button', { name: 'setError' }))

    expect(await findByText('no')).toBeVisible()

    fireEvent.click(getByRole('button', { name: 'clearError' }))

    expect(await findByText('no')).toBeVisible()
  })

  it('should be able to clear root error', () => {
    const App = () => {
      const form = createForm()

      createEffect(
        on(form.clearErrors, () => {
          form.clearErrors('root')
          form.clearErrors('root.other')
        }),
      )

      return null
    }

    render(() => <App />)
  })
})
