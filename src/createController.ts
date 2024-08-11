import { createEffect, on } from 'solid-js'
import { EVENTS } from './constants'
import getEventValue from './logic/getEventValue'
import isNameInFieldArray from './logic/isNameInFieldArray'
import {
  ControllerFieldState,
  Field,
  FieldPath,
  FieldPathValue,
  FieldValues,
  InternalFieldName,
  CreateControllerProps,
  CreateControllerReturn,
} from './types'
import { createFormContext } from './createFormContext'
import { createFormState } from './createFormState'
import { useWatch } from './useWatch'
import cloneObject from './utils/cloneObject'
import get from './utils/get'
import isBoolean from './utils/isBoolean'
import isUndefined from './utils/isUndefined'
import set from './utils/set'

/**
 * Custom hook to work with controlled component, this function provide you with both form and field level state. Re-render is isolated at the hook level.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usecontroller) • [Demo](https://codesandbox.io/s/usecontroller-0o8px)
 *
 * @param props - the path name to the form field value, and validation rules.
 *
 * @returns field properties, field and form state. {@link CreateControllerReturn}
 *
 * @example
 * ```tsx
 * function Input(props) {
 *   const { field, fieldState, formState } = createController(props);
 *   return (
 *     <div>
 *       <input {...field} placeholder={props.name} />
 *       <p>{fieldState.isTouched && "Touched"}</p>
 *       <p>{formState.isSubmitted ? "submitted" : ""}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function createController<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: CreateControllerProps<TFieldValues, TName>,
): CreateControllerReturn<TFieldValues, TName> {
  const methods = createFormContext<TFieldValues>()
  const { name, disabled, control = methods.control, shouldUnregister } = props
  const isArrayField = isNameInFieldArray(control._names.array, name)
  const value = useWatch({
    control,
    name,
    defaultValue: get(
      control._formValues,
      name,
      get(control._defaultValues, name, props.defaultValue),
    ),
    exact: true,
  }) as FieldPathValue<TFieldValues, TName>
  const formState = createFormState({
    control,
    name,
    exact: true,
  })

  const _registerProps = React.useRef(
    control.register(name, {
      ...props.rules,
      value,
      ...(isBoolean(props.disabled) ? { disabled: props.disabled } : {}),
    }),
  )

  createEffect(() => {
    const _shouldUnregisterField =
      control._options.shouldUnregister || shouldUnregister

    const updateMounted = (name: InternalFieldName, value: boolean) => {
      const field: Field = get(control._fields, name)

      if (field && field._f) {
        field._f.mount = value
      }
    }

    updateMounted(name, true)

    if (_shouldUnregisterField) {
      const value = cloneObject(get(control._options.defaultValues, name))
      set(control._defaultValues, name, value)
      if (isUndefined(get(control._formValues, name))) {
        set(control._formValues, name, value)
      }
    }

    return () => {
      ;(
        isArrayField
          ? _shouldUnregisterField && !control._state.action
          : _shouldUnregisterField
      )
        ? control.unregister(name)
        : updateMounted(name, false)
    }
  }, [name, control, isArrayField, shouldUnregister])

  createEffect(
    on(
      () => [disabled, name, control],
      () => {
        if (get(control._fields, name)) {
          control._updateDisabledField({
            disabled,
            fields: control._fields,
            name,
            value: get(control._fields, name)._f.value,
          })
        }
      },
    ),
  )

  return {
    field: {
      name,
      value,
      ...(isBoolean(disabled) || formState.disabled
        ? { disabled: formState.disabled || disabled }
        : {}),
      onChange: (event) =>
        _registerProps.current.onChange({
          target: {
            value: getEventValue(event),
            name: name as InternalFieldName,
          },
          type: EVENTS.CHANGE,
        }),
      onBlur: () =>
        _registerProps.current.onBlur({
          target: {
            value: get(control._formValues, name),
            name: name as InternalFieldName,
          },
          type: EVENTS.BLUR,
        }),
      ref: (elm) => {
        const field = get(control._fields, name)

        if (field && elm) {
          field._f.ref = {
            focus: () => elm.focus(),
            select: () => elm.select(),
            setCustomValidity: (message: string) =>
              elm.setCustomValidity(message),
            reportValidity: () => elm.reportValidity(),
          }
        }
      },
    },
    formState,
    fieldState: Object.defineProperties(
      {},
      {
        invalid: {
          enumerable: true,
          get: () => !!get(formState.errors, name),
        },
        isDirty: {
          enumerable: true,
          get: () => !!get(formState.dirtyFields, name),
        },
        isTouched: {
          enumerable: true,
          get: () => !!get(formState.touchedFields, name),
        },
        isValidating: {
          enumerable: true,
          get: () => !!get(formState.validatingFields, name),
        },
        error: {
          enumerable: true,
          get: () => get(formState.errors, name),
        },
      },
    ) as ControllerFieldState,
  }
}
