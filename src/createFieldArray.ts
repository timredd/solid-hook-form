import Solid from 'solid-js'

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
import cloneObject from './utils/cloneObject'
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
  const {
    control = methods.control,
    name,
    keyName = 'id',
    shouldUnregister,
  } = props
  const [fields, setFields] = Solid.createSignal(control._getFieldArray(name))
  const ids = Solid.useRef<string[]>(
    control._getFieldArray(name).map(generateId),
  )
  const _fieldIds = Solid.useRef(fields)
  const _name = Solid.useRef(name)
  const _actioned = Solid.useRef(false)

  _name.current = name
  _fieldIds.current = fields
  control._names.array.add(name)

  props.rules &&
    (control as Control<TFieldValues>).register(
      name as FieldPath<TFieldValues>,
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
      if (fieldArrayName === _name.current || !fieldArrayName) {
        const fieldValues = get(values, _name.current)
        if (Array.isArray(fieldValues)) {
          setFields(fieldValues)
          ids.current = fieldValues.map(generateId)
        }
      }
    },
    subject: control._subjects.array,
  })

  const updateValues = Solid.useCallback(
    <
      T extends Partial<
        FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
      >[],
    >(
      updatedFieldArrayValues: T,
    ) => {
      _actioned.current = true
      control._updateFieldArray(name, updatedFieldArrayValues)
    },
    [control, name],
  )

  const append = (
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const appendValue = convertToArrayPayload(cloneObject(value))
    const updatedFieldArrayValues = appendAt(
      control._getFieldArray(name),
      appendValue,
    )
    control._names.focus = getFocusFieldName(
      name,
      updatedFieldArrayValues.length - 1,
      options,
    )
    ids.current = appendAt(ids.current, appendValue.map(generateId))
    updateValues(updatedFieldArrayValues)
    setFields(updatedFieldArrayValues)
    control._updateFieldArray(name, updatedFieldArrayValues, appendAt, {
      argA: fillEmptyArray(value),
    })
  }

  const prepend = (
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const prependValue = convertToArrayPayload(cloneObject(value))
    const updatedFieldArrayValues = prependAt(
      control._getFieldArray(name),
      prependValue,
    )
    control._names.focus = getFocusFieldName(name, 0, options)
    ids.current = prependAt(ids.current, prependValue.map(generateId))
    updateValues(updatedFieldArrayValues)
    setFields(updatedFieldArrayValues)
    control._updateFieldArray(name, updatedFieldArrayValues, prependAt, {
      argA: fillEmptyArray(value),
    })
  }

  const remove = (index?: number | number[]) => {
    const updatedFieldArrayValues: Partial<
      FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
    >[] = removeArrayAt(control._getFieldArray(name), index)
    ids.current = removeArrayAt(ids.current, index)
    updateValues(updatedFieldArrayValues)
    setFields(updatedFieldArrayValues)
    control._updateFieldArray(name, updatedFieldArrayValues, removeArrayAt, {
      argA: index,
    })
  }

  const insert = (
    index: number,
    value:
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>
      | Partial<FieldArray<TFieldValues, TFieldArrayName>>[],
    options?: FieldArrayMethodProps,
  ) => {
    const insertValue = convertToArrayPayload(cloneObject(value))
    const updatedFieldArrayValues = insertAt(
      control._getFieldArray(name),
      index,
      insertValue,
    )
    control._names.focus = getFocusFieldName(name, index, options)
    ids.current = insertAt(ids.current, index, insertValue.map(generateId))
    updateValues(updatedFieldArrayValues)
    setFields(updatedFieldArrayValues)
    control._updateFieldArray(name, updatedFieldArrayValues, insertAt, {
      argA: index,
      argB: fillEmptyArray(value),
    })
  }

  const swap = (indexA: number, indexB: number) => {
    const updatedFieldArrayValues = control._getFieldArray(name)
    swapArrayAt(updatedFieldArrayValues, indexA, indexB)
    swapArrayAt(ids.current, indexA, indexB)
    updateValues(updatedFieldArrayValues)
    setFields(updatedFieldArrayValues)
    control._updateFieldArray(
      name,
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
    const updatedFieldArrayValues = control._getFieldArray(name)
    moveArrayAt(updatedFieldArrayValues, from, to)
    moveArrayAt(ids.current, from, to)
    updateValues(updatedFieldArrayValues)
    setFields(updatedFieldArrayValues)
    control._updateFieldArray(
      name,
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
    const updateValue = cloneObject(value)
    const updatedFieldArrayValues = updateAt(
      control._getFieldArray<
        FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>
      >(name),
      index,
      updateValue as FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>,
    )
    ids.current = [...updatedFieldArrayValues].map((item, i) =>
      !item || i === index ? generateId() : ids.current[i],
    )
    updateValues(updatedFieldArrayValues)
    setFields([...updatedFieldArrayValues])
    control._updateFieldArray(
      name,
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
    const updatedFieldArrayValues = convertToArrayPayload(cloneObject(value))
    ids.current = updatedFieldArrayValues.map(generateId)
    updateValues([...updatedFieldArrayValues])
    setFields([...updatedFieldArrayValues])
    control._updateFieldArray(
      name,
      [...updatedFieldArrayValues],
      <T>(data: T): T => data,
      {},
      true,
      false,
    )
  }

  Solid.createEffect(() => {
    control._state.action = false

    isWatched(name, control._names) &&
      control._subjects.state.next({
        ...control._formState,
      } as FormState<TFieldValues>)

    if (
      _actioned.current &&
      (!getValidationModes(control._options.mode).isOnSubmit ||
        control._formState.isSubmitted)
    ) {
      if (control._options.resolver) {
        control._executeSchema([name]).then((result) => {
          const error = get(result.errors, name)
          const existingError = get(control._formState.errors, name)

          if (
            existingError
              ? (!error && existingError.type) ||
                (error &&
                  (existingError.type !== error.type ||
                    existingError.message !== error.message))
              : error && error.type
          ) {
            error
              ? set(control._formState.errors, name, error)
              : unset(control._formState.errors, name)
            control._subjects.state.next({
              errors: control._formState.errors as FieldErrors<TFieldValues>,
            })
          }
        })
      } else {
        const field: Field = get(control._fields, name)
        if (
          field &&
          field._f &&
          !(
            getValidationModes(control._options.reValidateMode).isOnSubmit &&
            getValidationModes(control._options.mode).isOnSubmit
          )
        ) {
          validateField(
            field,
            control._formValues,
            control._options.criteriaMode === VALIDATION_MODE.all,
            control._options.shouldCreateNativeValidation,
            true,
          ).then(
            (error) =>
              !isEmptyObject(error) &&
              control._subjects.state.next({
                errors: updateFieldArrayRootError(
                  control._formState.errors as FieldErrors<TFieldValues>,
                  error,
                  name,
                ) as FieldErrors<TFieldValues>,
              }),
          )
        }
      }
    }

    control._subjects.values.next({
      name,
      values: { ...control._formValues },
    })

    control._names.focus &&
      iterateFieldsByAction(control._fields, (ref, key: string) => {
        if (
          control._names.focus &&
          key.startsWith(control._names.focus) &&
          ref.focus
        ) {
          ref.focus()
          return 1
        }
        return
      })

    control._names.focus = ''

    control._updateValid()
    _actioned.current = false
  }, [fields, name, control])

  Solid.createEffect(() => {
    !get(control._formValues, name) && control._updateFieldArray(name)

    return () => {
      ;(control._options.shouldUnregister || shouldUnregister) &&
        control.unregister(name as FieldPath<TFieldValues>)
    }
  }, [name, control, keyName, shouldUnregister])

  return {
    swap: Solid.useCallback(swap, [updateValues, name, control]),
    move: Solid.useCallback(move, [updateValues, name, control]),
    prepend: Solid.useCallback(prepend, [updateValues, name, control]),
    append: Solid.useCallback(append, [updateValues, name, control]),
    remove: Solid.useCallback(remove, [updateValues, name, control]),
    insert: Solid.useCallback(insert, [updateValues, name, control]),
    update: Solid.useCallback(update, [updateValues, name, control]),
    replace: Solid.useCallback(replace, [updateValues, name, control]),
    fields: Solid.useMemo(
      () =>
        fields.map((field, index) => ({
          ...field,
          [keyName]: ids.current[index] || generateId(),
        })) as FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[],
      [fields, keyName],
    ),
  }
}
