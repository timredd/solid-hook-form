import { createEffect, createSignal, mergeProps, on, onMount } from 'solid-js'

import { createFormContext } from './createFormContext'
import { createSubscribe } from './createSubscribe'
import getProxyFormState from './logic/getProxyFormState'
import shouldRenderFormState from './logic/shouldRenderFormState'
import shouldSubscribeByName from './logic/shouldSubscribeByName'
import {
  CreateFormStateProps,
  CreateFormStateReturn,
  FieldValues,
  FormState,
  InternalFieldName,
} from './types'

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
  const mergedProps = mergeProps({ control: methods.control }, props)
  const [formState, updateFormState] = createSignal(
    mergedProps.control._formState,
  )

  let _mounted: boolean
  onMount(() => {
    _mounted = true
  })

  let _localProxyFormState = {} as {
    [k in keyof Pick<
      FormState<TFieldValues>,
      | 'isDirty'
      | 'isLoading'
      | 'dirtyFields'
      | 'touchedFields'
      | 'validatingFields'
      | 'isValidating'
      | 'isValid'
      | 'errors'
    >]: boolean | 'all'
  }
  onMount(() => {
    _localProxyFormState = {
      isDirty: false,
      isLoading: false,
      dirtyFields: false,
      touchedFields: false,
      validatingFields: false,
      isValidating: false,
      isValid: false,
      errors: false,
    }
  })

  let _name: CreateFormStateProps<TFieldValues>['name']
  onMount(() => {
    _name = mergedProps.name
  })

  createSubscribe({
    disabled: mergedProps.disabled,
    next: (
      value: Partial<FormState<TFieldValues>> & { name?: InternalFieldName },
    ) =>
      _mounted &&
      shouldSubscribeByName(
        _name as InternalFieldName,
        value.name,
        mergedProps.exact,
      ) &&
      shouldRenderFormState(
        value,
        _localProxyFormState,
        mergedProps.control._updateFormState,
      ) &&
      updateFormState({
        ...mergedProps.control._formState,
        ...value,
      }),
    subject: mergedProps.control._subjects.state,
  })

  createEffect(
    on(
      () => mergedProps.control,
      () => {
        _mounted = true
        _localProxyFormState.isValid && mergedProps.control._updateValid(true)

        return () => {
          _mounted = false
        }
      },
    ),
  )

  return getProxyFormState(
    formState(),
    mergedProps.control,
    _localProxyFormState,
    false,
  )
}

export { createFormState }
