import { describe, expect, it, vi } from 'vitest'
import getFieldValue from '../../logic/getFieldValue'
import { Field } from '../../types'

vi.mock('../../logic/getRadioValue', () => ({
  __esModule: true,
  default: () => ({
    value: 2,
  }),
}))

vi.mock('../../logic/getCheckboxValue', () => ({
  __esModule: true,
  default: () => ({
    value: 'testValue',
  }),
}))

describe('getFieldValue', () => {
  it('should return correct value when type is radio', () => {
    expect(
      getFieldValue({
        name: 'test',
        ref: {
          type: 'radio',
          name: 'test',
        },
      }),
    ).toBe(2)
  })

  it('should return the correct value when type is checkbox', () => {
    expect(
      getFieldValue({
        name: 'test',
        ref: {
          name: 'test',
          type: 'checkbox',
        },
      }),
    ).toBe('testValue')
  })

  it('should return it value for other types', () => {
    expect(
      getFieldValue({
        name: 'test',
        ref: {
          type: 'text',
          name: 'bill',
          value: 'value',
        },
      }),
    ).toBe('value')
  })

  it('should return empty string when radio input value is not found', () => {
    expect(getFieldValue({ ref: {} } as Field['_f'])).toEqual(undefined)
  })

  it('should return files for input type file', () => {
    expect(
      getFieldValue({
        name: 'test',
        ref: {
          type: 'file',
          name: 'test',
          files: null,
        },
      }),
    ).toEqual(null)
  })

  it('should return undefined when input is not found', () => {
    expect(
      getFieldValue({
        name: 'test',
        ref: {
          name: 'file',
          files: null,
        },
      }),
    ).toEqual(undefined)
  })

  it('should not return value when the input is disabled', () => {
    expect(
      getFieldValue({
        name: 'test',
        ref: {
          name: 'radio',
          disabled: true,
          type: 'radio',
        },
      }),
    ).toEqual(undefined)
  })
})
