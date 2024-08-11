import Solid from 'solid-js'

import { createFormControl } from './logic/createFormControl'
import getProxyFormState from './logic/getProxyFormState'
import shouldRenderFormState from './logic/shouldRenderFormState'
import {
  FieldValues,
  FormState,
  InternalFieldName,
  CreateFormProps,
  CreateFormReturn,
} from './types'
import { createSubscribe } from './createSubscribe'
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
  const _formControl = Solid.useRef<
    CreateFormReturn<TFieldValues, TContext, TTransformedValues> | undefined
  >()
  const _values = Solid.useRef<typeof props.values>()
  const [formState, updateFormState] = Solid.createSignal<FormState<TFieldValues>>({
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

  if (!_formControl.current) {
    _formControl.current = {
      ...createFormControl(props),
      formState,
    }
  }

  const control = _formControl.current.control
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

  Solid.createEffect(
    () => control._disableForm(props.disabled),
    [control, props.disabled],
  )

  Solid.createEffect(() => {
    if (control._proxyFormState.isDirty) {
      const isDirty = control._getDirty()
      if (isDirty !== formState.isDirty) {
        control._subjects.state.next({
          isDirty,
        })
      }
    }
  }, [control, formState.isDirty])

  Solid.createEffect(() => {
    if (props.values && !deepEqual(props.values, _values.current)) {
      control._reset(props.values, control._options.resetOptions)
      _values.current = props.values
      updateFormState((state) => ({ ...state }))
    } else {
      control._resetDefaultValues()
    }
  }, [props.values, control])

  Solid.createEffect(() => {
    if (props.errors) {
      control._setErrors(props.errors)
    }
  }, [props.errors, control])

  Solid.createEffect(() => {
    if (!control._state.mount) {
      control._updateValid()
      control._state.mount = true
    }

    if (control._state.watch) {
      control._state.watch = false
      control._subjects.state.next({ ...control._formState })
    }

    control._removeUnmounted()
  })

  Solid.createEffect(() => {
    props.shouldUnregister &&
      control._subjects.values.next({
        values: control._getWatch(),
      })
  }, [props.shouldUnregister, control])

  _formControl.current.formState = getProxyFormState(formState, control)

  return _formControl.current
}
