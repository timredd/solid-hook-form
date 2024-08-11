import { createEffect, mergeProps, on } from 'solid-js'

import { EVENTS } from './constants'
import { createFormContext } from './createFormContext'
import { createFormState } from './createFormState'
import { createWatch } from './createWatch'
import getEventValue from './logic/getEventValue'
import isNameInFieldArray from './logic/isNameInFieldArray'
import {
  ControllerFieldState,
  CreateControllerProps,
  CreateControllerReturn,
  Field,
  FieldPath,
  FieldPathValue,
  FieldValues,
  InternalFieldName,
} from './types'
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
  // const { name, disabled, control = methods.control, shouldUnregister } = props
  const mergedProps = mergeProps({ control: methods.control }, props)
  const isArrayField = isNameInFieldArray(
    mergedProps.control._names.array,
    mergedProps.name,
  )
  const value = createWatch({
    control: mergedProps.control,
    name: mergedProps.name,
    defaultValue: get(
      mergedProps.control._formValues,
      mergedProps.name,
      get(
        mergedProps.control._defaultValues,
        mergedProps.name,
        props.defaultValue,
      ),
    ),
    exact: true,
  }) as FieldPathValue<TFieldValues, TName>
  const formState = createFormState({
    control: mergedProps.control,
    name: mergedProps.name,
    exact: true,
  })

  const _registerProps = mergedProps.control.register(mergedProps.name, {
    ...props.rules,
    value,
    ...(isBoolean(props.disabled) ? { disabled: props.disabled } : {}),
  })

  createEffect(
    on(
      [
        () => mergedProps.name,
        () => mergedProps.control,
        () => isArrayField,
        () => mergedProps.shouldUnregister,
      ],
      () => {
        const _shouldUnregisterField =
          mergedProps.control._options.shouldUnregister ||
          mergedProps.shouldUnregister

        const updateMounted = (name: InternalFieldName, value: boolean) => {
          const field: Field = get(mergedProps.control._fields, name)

          if (field && field._f) {
            field._f.mount = value
          }
        }

        updateMounted(mergedProps.name, true)

        if (_shouldUnregisterField) {
          const value = cloneObject(
            get(mergedProps.control._options.defaultValues, mergedProps.name),
          )
          set(mergedProps.control._defaultValues, mergedProps.name, value)
          if (
            isUndefined(get(mergedProps.control._formValues, mergedProps.name))
          ) {
            set(mergedProps.control._formValues, mergedProps.name, value)
          }
        }

        return () => {
          ;(
            isArrayField
              ? _shouldUnregisterField && !mergedProps.control._state.action
              : _shouldUnregisterField
          )
            ? mergedProps.control.unregister(mergedProps.name)
            : updateMounted(mergedProps.name, false)
        }
      },
    ),
  )

  createEffect(
    on(
      [
        () => mergedProps.disabled,
        () => mergedProps.name,
        () => mergedProps.control,
      ],
      () => {
        if (get(mergedProps.control._fields, mergedProps.name)) {
          mergedProps.control._updateDisabledField({
            disabled: mergedProps.disabled,
            fields: mergedProps.control._fields,
            name: mergedProps.name,
            value: get(mergedProps.control._fields, mergedProps.name)._f.value,
          })
        }
      },
    ),
  )

  return {
    field: {
      name: mergedProps.name,
      value,
      ...(isBoolean(mergedProps.disabled) || formState.disabled
        ? { disabled: formState.disabled || mergedProps.disabled }
        : {}),
      onChange: (event) =>
        _registerProps.onChange({
          target: {
            value: getEventValue(event),
            name: mergedProps.name as InternalFieldName,
          },
          type: EVENTS.CHANGE,
        }),
      onBlur: () =>
        _registerProps.onBlur({
          target: {
            value: get(mergedProps.control._formValues, mergedProps.name),
            name: mergedProps.name as InternalFieldName,
          },
          type: EVENTS.BLUR,
        }),
      ref: (elm) => {
        const field = get(mergedProps.control._fields, mergedProps.name)

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
          get: () => !!get(formState.errors, mergedProps.name),
        },
        isDirty: {
          enumerable: true,
          get: () => !!get(formState.dirtyFields, mergedProps.name),
        },
        isTouched: {
          enumerable: true,
          get: () => !!get(formState.touchedFields, mergedProps.name),
        },
        isValidating: {
          enumerable: true,
          get: () => !!get(formState.validatingFields, mergedProps.name),
        },
        error: {
          enumerable: true,
          get: () => get(formState.errors, mergedProps.name),
        },
      },
    ) as ControllerFieldState,
  }
}
