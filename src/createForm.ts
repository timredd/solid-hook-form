import { createEffect, createSignal, on } from 'solid-js'

import { createSubscribe } from './createSubscribe'
import { createFormControl } from './logic/createFormControl'
import getProxyFormState from './logic/getProxyFormState'
import shouldRenderFormState from './logic/shouldRenderFormState'
import {
  CreateFormProps,
  CreateFormReturn,
  FieldValues,
  FormState,
  InternalFieldName,
} from './types'
import deepEqual from './utils/deepEqual'
import isFunction from './utils/isFunction'

/**
 * Custom hook to manage the entire form.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useform) • [Demo](https://codesandbox.io/s/react-hook-form-get-started-ts-5ksmm) • [Video](https://www.youtube.com/watch?v=RkXv4AXXC_4)
 *
 * @param props - form configuration and validation parameters.
 *
 * @returns methods - individual functions to manage the form state. {@link CreateFormReturn}
 *
 * @example
 * ```tsx
 * function App() {
 *   const { register, handleSubmit, watch, formState: { errors } } = createForm();
 *   const onSubmit = data => console.log(data);
 *
 *   console.log(watch("example"));
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input defaultValue="test" {...register("example")} />
 *       <input {...register("exampleRequired", { required: true })} />
 *       {errors.exampleRequired && <span>This field is required</span>}
 *       <button>Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function createForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
>(
  props: CreateFormProps<TFieldValues, TContext> = {},
): CreateFormReturn<TFieldValues, TContext, TTransformedValues> {
  let _formControl:
    | CreateFormReturn<TFieldValues, TContext, TTransformedValues>
    | undefined
  let _values: typeof props.values

  const [formState, updateFormState] = createSignal<FormState<TFieldValues>>({
    isDirty: false,
    isValidating: false,
    isLoading: isFunction(props.defaultValues),
    isSubmitted: false,
    isSubmitting: false,
    isSubmitSuccessful: false,
    isValid: false,
    submitCount: 0,
    dirtyFields: {},
    touchedFields: {},
    validatingFields: {},
    errors: props.errors || {},
    disabled: props.disabled || false,
    defaultValues: isFunction(props.defaultValues)
      ? undefined
      : props.defaultValues,
  })

  if (!_formControl) {
    _formControl = {
      ...createFormControl(props),
      formState: formState(),
    }
  }

  const control = _formControl?.control
  control._options = props

  createSubscribe({
    subject: control._subjects.state,
    next: (
      value: Partial<FormState<TFieldValues>> & { name?: InternalFieldName },
    ) => {
      if (
        shouldRenderFormState(
          value,
          control._proxyFormState,
          control._updateFormState,
          true,
        )
      ) {
        updateFormState({ ...control._formState })
      }
    },
  })

  createEffect(
    on([() => control, () => props.disabled], () =>
      control._disableForm(props.disabled),
    ),
  )

  createEffect(
    on([() => control, () => formState().isDirty], () => {
      if (control._proxyFormState.isDirty) {
        const isDirty = control._getDirty()
        if (isDirty !== formState().isDirty) {
          control._subjects.state.next({
            isDirty,
          })
        }
      }
    }),
  )

  createEffect(() => {
    if (props.values && !deepEqual(props.values, _values)) {
      control._reset(props.values, control._options.resetOptions)
      _values = props.values
      updateFormState((state) => ({ ...state }))
    } else {
      control._resetDefaultValues()
    }
  }, [props.values, control])

  createEffect(
    on([() => props.errors, () => control], () => {
      if (props.errors) {
        control._setErrors(props.errors)
      }
    }),
  )

  createEffect(
    on([], () => {
      if (!control._state.mount) {
        control._updateValid()
        control._state.mount = true
      }

      if (control._state.watch) {
        control._state.watch = false
        control._subjects.state.next({ ...control._formState })
      }

      control._removeUnmounted()
    }),
  )

  createEffect(
    on([() => props.shouldUnregister, () => control], () => {
      props.shouldUnregister &&
        control._subjects.values.next({
          values: control._getWatch(),
        })
    }),
  )

  _formControl.formState = getProxyFormState(formState(), control)

  return _formControl
}
