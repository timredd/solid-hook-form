import Solid from 'solid-js'
import { mergeProps } from 'solid-js'

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
  const methods = createFormContext()
  const {
    control = methods.control,
    name,
    defaultValue,
    disabled,
    exact,
  } = props || {}
  const _name = Solid.useRef(name)

  _name = name

  createSubscribe({
    disabled,
    subject: control._subjects.values,
    next: (formState: { name?: InternalFieldName; values?: FieldValues }) => {
      if (
        shouldSubscribeByName(_name as InternalFieldName, formState.name, exact)
      ) {
        updateValue(
          mergeProps(
            generateWatchOutput(
              _name as InternalFieldName | InternalFieldName[],
              control._names,
              formState.values || control._formValues,
              false,
              defaultValue,
            ),
          ),
        )
      }
    },
  })

  const [value, updateValue] = Solid.createSignal(
    control._getWatch(
      name as InternalFieldName,
      defaultValue as DeepPartialSkipArrayKey<TFieldValues>,
    ),
  )

  Solid.createEffect(() => control._removeUnmounted())

  return value
}
