import { createEffect, createSignal, mergeProps, onMount } from 'solid-js'

import { createFormContext } from './createFormContext'
import { createSubscribe } from './createSubscribe'
import generateWatchOutput from './logic/generateWatchOutput'
import shouldSubscribeByName from './logic/shouldSubscribeByName'
import {
  Control,
  CreateWatchProps,
  DeepPartialSkipArrayKey,
  FieldPath,
  FieldPathValue,
  FieldPathValues,
  FieldValues,
  InternalFieldName,
} from './types'

/**
 * Subscribe to the entire form values change and re-render at the hook level.
 *
 * @remarks
 *
 * [API](https://react-hook-form.com/docs/usewatch) • [Demo](https://codesandbox.io/s/react-hook-form-v7-ts-usewatch-h9i5e)
 *
 * @param props - defaultValue, disable subscription and match exact name.
 *
 * @example
 * ```tsx
 * const { control } = createForm();
 * const values = createWatch({
 *   control,
 *   defaultValue: {
 *     name: "data"
 *   },
 *   exact: false,
 * })
 * ```
 */
export function createWatch<
  TFieldValues extends FieldValues = FieldValues,
>(props: {
  defaultValue?: DeepPartialSkipArrayKey<TFieldValues>
  control?: Control<TFieldValues>
  disabled?: boolean
  exact?: boolean
}): DeepPartialSkipArrayKey<TFieldValues>
/**
 * Custom hook to subscribe to field change and isolate re-rendering at the component level.
 *
 * @remarks
 *
 * [API](https://react-hook-form.com/docs/usewatch) • [Demo](https://codesandbox.io/s/react-hook-form-v7-ts-usewatch-h9i5e)
 *
 * @param props - defaultValue, disable subscription and match exact name.
 *
 * @example
 * ```tsx
 * const { control } = createForm();
 * const values = createWatch({
 *   control,
 *   name: "fieldA",
 *   defaultValue: "default value",
 *   exact: false,
 * })
 * ```
 */
export function createWatch<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: {
  name: TFieldName
  defaultValue?: FieldPathValue<TFieldValues, TFieldName>
  control?: Control<TFieldValues>
  disabled?: boolean
  exact?: boolean
}): FieldPathValue<TFieldValues, TFieldName>
/**
 * Custom hook to subscribe to field change and isolate re-rendering at the component level.
 *
 * @remarks
 *
 * [API](https://react-hook-form.com/docs/usewatch) • [Demo](https://codesandbox.io/s/react-hook-form-v7-ts-usewatch-h9i5e)
 *
 * @param props - defaultValue, disable subscription and match exact name.
 *
 * @example
 * ```tsx
 * const { control } = createForm();
 * const values = createWatch({
 *   control,
 *   name: ["fieldA", "fieldB"],
 *   defaultValue: {
 *     fieldA: "data",
 *     fieldB: "data"
 *   },
 *   exact: false,
 * })
 * ```
 */
export function createWatch<
  TFieldValues extends FieldValues = FieldValues,
  TFieldNames extends
    readonly FieldPath<TFieldValues>[] = readonly FieldPath<TFieldValues>[],
>(props: {
  name: readonly [...TFieldNames]
  defaultValue?: DeepPartialSkipArrayKey<TFieldValues>
  control?: Control<TFieldValues>
  disabled?: boolean
  exact?: boolean
}): FieldPathValues<TFieldValues, TFieldNames>
/**
 * Custom hook to subscribe to field change and isolate re-rendering at the component level.
 *
 * @remarks
 *
 * [API](https://react-hook-form.com/docs/usewatch) • [Demo](https://codesandbox.io/s/react-hook-form-v7-ts-usewatch-h9i5e)
 *
 * @example
 * ```tsx
 * // can skip passing down the control into createWatch if the form is wrapped with the FormProvider
 * const values = createWatch()
 * ```
 */
export function createWatch<
  TFieldValues extends FieldValues = FieldValues,
>(): DeepPartialSkipArrayKey<TFieldValues>
/**
 * Custom hook to subscribe to field change and isolate re-rendering at the component level.
 *
 * @remarks
 *
 * [API](https://react-hook-form.com/docs/usewatch) • [Demo](https://codesandbox.io/s/react-hook-form-v7-ts-usewatch-h9i5e)
 *
 * @example
 * ```tsx
 * const { control } = createForm();
 * const values = createWatch({
 *   name: "fieldName"
 *   control,
 * })
 * ```
 */
export function createWatch<TFieldValues extends FieldValues>(
  props?: CreateWatchProps<TFieldValues>,
) {
  const methods = createFormContext<TFieldValues>()
  const mergedProps = mergeProps({ control: methods.control }, props)

  let _name: CreateWatchProps<TFieldValues>['name']
  onMount(() => {
    _name = mergedProps.name
  })

  createSubscribe({
    disabled: mergedProps?.disabled,
    subject: mergedProps?.control._subjects.values,
    next: (formState: { name?: InternalFieldName; values?: FieldValues }) => {
      if (
        shouldSubscribeByName(
          mergedProps.name as InternalFieldName,
          formState.name,
          mergedProps.exact,
        )
      ) {
        updateValue(
          mergeProps(
            generateWatchOutput(
              mergedProps.name as InternalFieldName | InternalFieldName[],
              mergedProps.control._names,
              formState.values || mergedProps.control._formValues,
              false,
              mergedProps.defaultValue,
            ),
          ),
        )
      }
    },
  })

  const [value, updateValue] = createSignal(
    mergedProps.control._getWatch(
      mergedProps.name as InternalFieldName,
      mergedProps.defaultValue as DeepPartialSkipArrayKey<TFieldValues>,
    ),
  )

  createEffect(() => mergedProps.control._removeUnmounted())

  return value
}
