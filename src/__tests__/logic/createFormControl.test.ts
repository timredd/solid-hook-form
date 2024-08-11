import { describe, expect, it, vi } from 'vitest'
import { createFormControl } from '../../logic/createFormControl'
import isEmptyObject from '../../utils/isEmptyObject'

vi.mock('../../utils/isEmptyObject', async () => {
  const original = await vi.importActual('../../utils/isEmptyObject')
  return {
    __esModule: true,
    default: vi.fn(() => original),
  }
})

describe('createFormControl', async () => {
  it('should call `executeBuiltInValidation` once for a single field', async () => {
    const formControl = createFormControl({
      defaultValues: {
        foo: 'foo',
      },
    })
    formControl.register('foo', {})

    await formControl.control._updateValid(true)

    expect(isEmptyObject).toHaveBeenCalledTimes(1)
  })

  it('should call `executeBuiltInValidation` twice for a field as an object with a single sub-field', async () => {
    const formControl = createFormControl({
      defaultValues: {
        foo: {
          bar: 'bar',
        },
      },
    })

    formControl.register('foo.bar', {})

    await formControl.control._updateValid(true)

    expect(isEmptyObject).toHaveBeenCalledTimes(2)
  })

  it('should call executeBuiltInValidation the correct number of times in case the field is an array', async () => {
    const formControl = createFormControl({
      defaultValues: {
        foo: [
          {
            bar: 'bar',
            baz: 'baz',
          },
          {
            bar: 'bar',
            baz: 'baz',
          },
        ],
      },
    })

    formControl.register('foo.1.bar', {})

    await formControl.control._updateValid(true)

    expect(isEmptyObject).toHaveBeenCalledTimes(3)
  })
})
