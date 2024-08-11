import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onMount,
} from 'solid-js'

import { VALIDATION_MODE } from './constants'
import { createFormContext } from './createFormContext'
import { createSubscribe } from './createSubscribe'
import generateId from './logic/generateId'
import getFocusFieldName from './logic/getFocusFieldName'
import getValidationModes from './logic/getValidationModes'
import isWatched from './logic/isWatched'
import iterateFieldsByAction from './logic/iterateFieldsByAction'
import updateFieldArrayRootError from './logic/updateFieldArrayRootError'
import validateField from './logic/validateField'
import {
  Control,
  CreateFieldArrayProps,
  CreateFieldArrayReturn,
  Field,
  FieldArray,
  FieldArrayMethodProps,
  FieldArrayPath,
  FieldArrayWithId,
  FieldErrors,
  FieldPath,
  FieldValues,
  FormState,
  InternalFieldName,
  RegisterOptions,
} from './types'
import appendAt from './utils/append'
import convertToArrayPayload from './utils/convertToArrayPayload'
import fillEmptyArray from './utils/fillEmptyArray'
import get from './utils/get'
import insertAt from './utils/insert'
import isEmptyObject from './utils/isEmptyObject'
import moveArrayAt from './utils/move'
import prependAt from './utils/prepend'
import removeArrayAt from './utils/remove'
import set from './utils/set'
import swapArrayAt from './utils/swap'
import unset from './utils/unset'
import updateAt from './utils/update'

/**
 * A custom hook that exposes convenient methods to perform operations with a list of dynamic inputs that need to be appended, updated, removed etc. • [Demo](https://codesandbox.io/s/react-hook-form-usefieldarray-ssugn) • [Video](https://youtu.be/4MrbfGSFY2A)
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/react-hook-form-usefieldarray-ssugn)
 *
 * @param props - createFieldArray props
 *
 * @returns methods - functions to manipulate with the Field Arrays (dynamic inputs) {@link CreateFieldArrayReturn}
 *
 * @example
 * ```tsx
 * function App() {
 *   const { register, control, handleSubmit, reset, trigger, setError } = createForm({
 *     defaultValues: {
 *       test: []
 *     }
 *   });
 *   const { fields, append } = createFieldArray({
 *     control,
 *     name: "test"
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit(data => console.log(data))}>
 *       {fields.map((item, index) => (
 *          <input key={item.id} {...register(`test.${index}.firstName`)}  />
 *       ))}
 *       <button type="button" onClick={() => append({ firstName: "bill" })}>
 *         append
 *       </button>
 *       <input type="submit" />
 *     </form>
 *   );
 * }
 * ```
 */
export function createFieldArray<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id',
>(
  props: CreateFieldArrayProps<TFieldValues, TFieldArrayName, TKeyName>,
): CreateFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName> {
  const methods = createFormContext()
  const mergedProps = mergeProps(
    { control: methods.control, keyName: 'id' },
    props,
  )
  const [fieldIds, setFieldIds] = createSignal<
    Partial<FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>>[]
  >(mergedProps.control._getFieldArray(mergedProps.name))
  let ids: string[]
  let _name: CreateFieldArrayProps<
    TFieldValues,
    TFieldArrayName,
    TKeyName
  >['name']
  let _actioned: boolean
  onMount(() => {
    ids = mergedProps.control._getFieldArray(mergedProps.name).map(generateId)
    _name = mergedProps.name
    _actioned = false
  })

  mergedProps.control._names.array.add(mergedProps.name)

  props.rules &&
    (mergedProps.control as Control<TFieldValues>).register(
      mergedProps.name as FieldPath<TFieldValues>,
      props.rules as RegisterOptions<TFieldValues>,
    )

  createSubscribe({
    next: ({
      values,
      name: fieldArrayName,
    }: {
      values?: FieldValues
      name?: InternalFieldName
    }) => {
      if (fieldArrayName === _name || !fieldArrayName) {
        const fieldValues = get(values, _name)
        if (Array.isArray(fieldValues)) {
          setFieldIds(fieldValues)
          ids = fieldValues.map(generateId)
        }
      }
    },
    subject: mergedProps.control._subjects.array,
  })

  const updateValues = <
    T extends Partial<
      FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
    >[],
  >(
    updatedFieldArrayValues: T,
  ) => {
    _actioned = true
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
    )
  }

  const append = (
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const appendValue = convertToArrayPayload(mergeProps(value))
    const updatedFieldArrayValues = appendAt(
      mergedProps.control._getFieldArray(mergedProps.name),
      appendValue,
    )
    mergedProps.control._names.focus = getFocusFieldName(
      mergedProps.name,
      updatedFieldArrayValues.length - 1,
      options,
    )
    ids = appendAt(ids, appendValue.map(generateId))
    updateValues(updatedFieldArrayValues)
    setFieldIds(updatedFieldArrayValues)
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
      appendAt,
      {
        argA: fillEmptyArray(value),
      },
    )
  }

  const prepend = (
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const prependValue = convertToArrayPayload(mergeProps(value))
    const updatedFieldArrayValues = prependAt(
      mergedProps.control._getFieldArray(mergedProps.name),
      prependValue,
    )
    mergedProps.control._names.focus = getFocusFieldName(
      mergedProps.name,
      0,
      options,
    )
    ids = prependAt(ids, prependValue.map(generateId))
    updateValues(updatedFieldArrayValues)
    setFieldIds(updatedFieldArrayValues)
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
      prependAt,
      {
        argA: fillEmptyArray(value),
      },
    )
  }

  const remove = (index?: number | number[]) => {
    const updatedFieldArrayValues: Partial<
      FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
    >[] = removeArrayAt(
      mergedProps.control._getFieldArray(mergedProps.name),
      index,
    )
    ids = removeArrayAt(ids, index)
    updateValues(updatedFieldArrayValues)
    setFieldIds(updatedFieldArrayValues)
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
      removeArrayAt,
      {
        argA: index,
      },
    )
  }

  const insert = (
    index: number,
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const insertValue = convertToArrayPayload(mergeProps(value))
    const updatedFieldArrayValues = insertAt(
      mergedProps.control._getFieldArray(mergedProps.name),
      index,
      insertValue,
    )
    mergedProps.control._names.focus = getFocusFieldName(
      mergedProps.name,
      index,
      options,
    )
    ids = insertAt(ids, index, insertValue.map(generateId))
    updateValues(updatedFieldArrayValues)
    setFieldIds(updatedFieldArrayValues)
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
      insertAt,
      {
        argA: index,
        argB: fillEmptyArray(value),
      },
    )
  }

  const swap = (indexA: number, indexB: number) => {
    const updatedFieldArrayValues = mergedProps.control._getFieldArray(
      mergedProps.name,
    )
    swapArrayAt(updatedFieldArrayValues, indexA, indexB)
    swapArrayAt(ids, indexA, indexB)
    updateValues(updatedFieldArrayValues)
    setFieldIds(updatedFieldArrayValues)
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
      swapArrayAt,
      {
        argA: indexA,
        argB: indexB,
      },
      false,
    )
  }

  const move = (from: number, to: number) => {
    const updatedFieldArrayValues = mergedProps.control._getFieldArray(
      mergedProps.name,
    )
    moveArrayAt(updatedFieldArrayValues, from, to)
    moveArrayAt(ids, from, to)
    updateValues(updatedFieldArrayValues)
    setFieldIds(updatedFieldArrayValues)
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
      moveArrayAt,
      {
        argA: from,
        argB: to,
      },
      false,
    )
  }

  const update = (
    index: number,
    value: FieldArray<TFieldValues, TFieldArrayName>,
  ) => {
    const updateValue = mergeProps(value)
    const updatedFieldArrayValues = updateAt(
      mergedProps.control._getFieldArray<
        FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
      >(mergedProps.name),
      index,
      updateValue as FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>,
    )
    ids = [...updatedFieldArrayValues].map((item, i) =>
      !item || i === index ? generateId() : ids[i],
    )
    updateValues(updatedFieldArrayValues)
    setFieldIds([...updatedFieldArrayValues])
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      updatedFieldArrayValues,
      updateAt,
      {
        argA: index,
        argB: updateValue,
      },
      true,
      false,
    )
  }

  const replace = (
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
  ) => {
    const updatedFieldArrayValues = convertToArrayPayload(mergeProps(value))
    ids = updatedFieldArrayValues.map(generateId)
    updateValues([...updatedFieldArrayValues])
    setFieldIds([...updatedFieldArrayValues])
    mergedProps.control._updateFieldArray(
      mergedProps.name,
      [...updatedFieldArrayValues],
      <T>(data: T): T => data,
      {},
      true,
      false,
    )
  }

  createEffect(
    on(
      [() => fieldIds, () => mergedProps.name, () => mergedProps.control],
      () => {
        mergedProps.control._state.action = false

        isWatched(mergedProps.name, mergedProps.control._names) &&
          mergedProps.control._subjects.state.next({
            ...mergedProps.control._formState,
          } as FormState<TFieldValues>)

        if (
          _actioned &&
          (!getValidationModes(mergedProps.control._options.mode).isOnSubmit ||
            mergedProps.control._formState.isSubmitted)
        ) {
          if (mergedProps.control._options.resolver) {
            mergedProps.control
              ._executeSchema([mergedProps.name])
              .then((result) => {
                const error = get(result.errors, mergedProps.name)
                const existingError = get(
                  mergedProps.control._formState.errors,
                  mergedProps.name,
                )

                if (
                  existingError
                    ? (!error && existingError.type) ||
                      (error &&
                        (existingError.type !== error.type ||
                          existingError.message !== error.message))
                    : error && error.type
                ) {
                  error
                    ? set(
                        mergedProps.control._formState.errors,
                        mergedProps.name,
                        error,
                      )
                    : unset(
                        mergedProps.control._formState.errors,
                        mergedProps.name,
                      )
                  mergedProps.control._subjects.state.next({
                    errors: mergedProps.control._formState
                      .errors as FieldErrors<TFieldValues>,
                  })
                }
              })
          } else {
            const field: Field = get(
              mergedProps.control._fields,
              mergedProps.name,
            )
            if (
              field &&
              field._f &&
              !(
                getValidationModes(mergedProps.control._options.reValidateMode)
                  .isOnSubmit &&
                getValidationModes(mergedProps.control._options.mode).isOnSubmit
              )
            ) {
              validateField(
                field,
                mergedProps.control._formValues,
                mergedProps.control._options.criteriaMode ===
                  VALIDATION_MODE.all,
                mergedProps.control._options.shouldUseNativeValidation,
                true,
              ).then(
                (error) =>
                  !isEmptyObject(error) &&
                  mergedProps.control._subjects.state.next({
                    errors: updateFieldArrayRootError(
                      mergedProps.control._formState
                        .errors as FieldErrors<TFieldValues>,
                      error,
                      mergedProps.name,
                    ) as FieldErrors<TFieldValues>,
                  }),
              )
            }
          }
        }

        mergedProps.control._subjects.values.next({
          name: mergedProps.name,
          values: { ...mergedProps.control._formValues },
        })

        mergedProps.control._names.focus &&
          iterateFieldsByAction(
            mergedProps.control._fields,
            (ref, key: string) => {
              if (
                mergedProps.control._names.focus &&
                key.startsWith(mergedProps.control._names.focus) &&
                ref.focus
              ) {
                ref.focus()
                return 1
              }
              return
            },
          )

        mergedProps.control._names.focus = ''

        mergedProps.control._updateValid()
        _actioned = false
      },
    ),
  )

  createEffect(
    on(
      [
        () => mergedProps.name,
        () => mergedProps.control,
        () => mergedProps.keyName,
        () => mergedProps.shouldUnregister,
      ],
      () => {
        !get(mergedProps.control._formValues, mergedProps.name) &&
          mergedProps.control._updateFieldArray(mergedProps.name)

        return () => {
          ;(mergedProps.control._options.shouldUnregister ||
            mergedProps.shouldUnregister) &&
            mergedProps.control.unregister(
              mergedProps.name as FieldPath<TFieldValues>,
            )
        }
      },
    ),
  )

  const fields = createMemo(
    on(
      [() => fieldIds, () => mergedProps.keyName],
      () =>
        fieldIds().map((field, index) => ({
          ...field,
          [mergedProps.keyName]: ids[index] || generateId(),
        })) as FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[],
    ),
  )

  return {
    swap,
    move,
    prepend,
    append,
    remove,
    insert,
    update,
    replace,
    fields: fields(),
  }
}
