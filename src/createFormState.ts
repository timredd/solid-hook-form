import Solid from 'solid-js'

import getProxyFormState from './logic/getProxyFormState'
import shouldRenderFormState from './logic/shouldRenderFormState'
import shouldSubscribeByName from './logic/shouldSubscribeByName'
import {
  FieldValues,
  FormState,
  InternalFieldName,
  CreateFormStateProps,
  CreateFormStateReturn,
} from './types'
import { createFormContext } from './createFormContext'
import { createSubscribe } from './createSubscribe'

/**
 * This custom hook allows you to subscribe to each form state, and isolate the re-render at the custom hook level. It has its scope in terms of form state subscription, so it would not affect other createFormState and createForm. Using this hook can reduce the re-render impact on large and complex form application.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useformstate) • [Demo](https://codesandbox.io/s/useformstate-75xly)
 *
 * @param props - include options on specify fields to subscribe. {@link CreateFormStateReturn}
 *
 * @example
 * ```tsx
 * function App() {
 *   const { register, handleSubmit, control } = createForm({
 *     defaultValues: {
 *     firstName: "firstName"
 *   }});
 *   const { dirtyFields } = createFormState({
 *     control
 *   });
 *   const onSubmit = (data) => console.log(data);
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register("firstName")} placeholder="First Name" />
 *       {dirtyFields.firstName && <p>Field is dirty.</p>}
 *       <input type="submit" />
 *     </form>
 *   );
 * }
 * ```
 */
function createFormState<TFieldValues extends FieldValues = FieldValues>(
  props?: CreateFormStateProps<TFieldValues>,
): CreateFormStateReturn<TFieldValues> {
  const methods = createFormContext<TFieldValues>()
  const { control = methods.control, disabled, name, exact } = props || {}
  const [formState, updateFormState] = Solid.createSignal(control._formState)
  const _mounted = Solid.useRef(true)
  const _localProxyFormState = Solid.useRef({
    isDirty: false,
    isLoading: false,
    dirtyFields: false,
    touchedFields: false,
    validatingFields: false,
    isValidating: false,
    isValid: false,
    errors: false,
  })
  const _name = Solid.useRef(name)

  _name.current = name

  createSubscribe({
    disabled,
    next: (
      value: Partial<FormState<TFieldValues>> & { name?: InternalFieldName },
    ) =>
      _mounted.current &&
      shouldSubscribeByName(
        _name.current as InternalFieldName,
        value.name,
        exact,
      ) &&
      shouldRenderFormState(
        value,
        _localProxyFormState.current,
        control._updateFormState,
      ) &&
      updateFormState({
        ...control._formState,
        ...value,
      }),
    subject: control._subjects.state,
  })

  Solid.createEffect(() => {
    _mounted.current = true
    _localProxyFormState.current.isValid && control._updateValid(true)

    return () => {
      _mounted.current = false
    }
  }, [control])

  return getProxyFormState(
    formState,
    control,
    _localProxyFormState.current,
    false,
  )
}

export { createFormState }
