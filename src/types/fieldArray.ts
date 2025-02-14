import { FieldValues } from './fields'
import { Control } from './form'
import { FieldArrayPath, FieldArrayPathValue } from './path'
import { RegisterOptions, Validate } from './validator'

export type CreateFieldArrayProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id',
> = {
  name: TFieldArrayName
  keyName?: TKeyName
  control?: Control<TFieldValues>
  rules?: {
    validate?:
      | Validate<FieldArray<TFieldValues, TFieldArrayName>[], TFieldValues>
      | Record<
          string,
          Validate<FieldArray<TFieldValues, TFieldArrayName>[], TFieldValues>
        >
  } & Pick<
    RegisterOptions<TFieldValues>,
    'maxLength' | 'minLength' | 'required'
  >
  shouldUnregister?: boolean
}

/**
 * `createFieldArray` returned `fields` with unique id
 */
export type FieldArrayWithId<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id',
> = FieldArray<TFieldValues, TFieldArrayName> & Record<TKeyName, string>

export type FieldArray<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = FieldArrayPathValue<TFieldValues, TFieldArrayName> extends
  | ReadonlyArray<infer U>
  | null
  | undefined
  ? U
  : never

/**
 * `createFieldArray` focus option, ability to toggle focus on and off with `shouldFocus` and setting focus by either field index or name.
 */
export type FieldArrayMethodProps = {
  shouldFocus?: boolean
  focusIndex?: number
  focusName?: string
}

/**
 * Swap field array by supplying from and to index
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param indexA - from index
 * @param indexB - to index
 *
 * @example
 * ```tsx
 * <button type="button" onClick={() => swap(0, 1)}>swap</button>
 * ```
 */
export type CreateFieldArraySwap = (indexA: number, indexB: number) => void

/**
 * Move field array by supplying from and to index
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param indexA - from index
 * @param indexB - to index
 *
 * @example
 * ```tsx
 * <button type="button" onClick={() => move(0, 1)}>swap</button>
 * ```
 */
export type CreateFieldArrayMove = (indexA: number, indexB: number) => void

/**
 * Prepend field/fields to the start of the fields and optionally focus. The input value will be registered during this action.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param value - prepend items or items
 * @param options - focus options
 *
 * @example
 * ```tsx
 * <button type="button" onClick={() => prepend({ name: "data" })}>Prepend</button>
 * <button type="button" onClick={() => prepend({ name: "data" }, { shouldFocus: false })}>Prepend</button>
 * <button
 *   type="button"
 *   onClick={() => prepend([{ name: "data" }, { name: "data" }])}
 * >
 *   Prepend
 * </button>
 * ```
 */
export type CreateFieldArrayPrepend<
  TFieldValues extends FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = (
  value:
    | FieldArray<TFieldValues, TFieldArrayName>
    | FieldArray<TFieldValues, TFieldArrayName>[],
  options?: FieldArrayMethodProps,
) => void

/**
 * Append field/fields to the end of your fields and focus. The input value will be registered during this action.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param value - append items or items.
 * @param options - focus options
 *
 * @example
 * ```tsx
 * <button type="button" onClick={() => append({ name: "data" })}>Append</button>
 * <button type="button" onClick={() => append({ name: "data" }, { shouldFocus: false })}>Append</button>
 * <button
 *   type="button"
 *   onClick={() => append([{ name: "data" }, { name: "data" }])}
 * >
 *   Append
 * </button>
 * ```
 */
export type CreateFieldArrayAppend<
  TFieldValues extends FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = (
  value:
    | FieldArray<TFieldValues, TFieldArrayName>
    | FieldArray<TFieldValues, TFieldArrayName>[],
  options?: FieldArrayMethodProps,
) => void

/**
 * Remove field/fields at particular position.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param index - index to remove at, or remove all when no index provided.
 *
 * @example
 * ```tsx
 * <button type="button" onClick={() => remove(0)}>Remove</button>
 * <button
 *   type="button"
 *   onClick={() => remove()}
 * >
 *   Remove all
 * </button>
 * ```
 */
export type CreateFieldArrayRemove = (index?: number | number[]) => void

/**
 * Insert field/fields at particular position and focus.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param index - insert position
 * @param value - insert field or fields
 * @param options - focus options
 *
 * @example
 * ```tsx
 * <button type="button" onClick={() => insert(1, { name: "data" })}>Insert</button>
 * <button type="button" onClick={() => insert(1, { name: "data" }, { shouldFocus: false })}>Insert</button>
 * <button
 *   type="button"
 *   onClick={() => insert(1, [{ name: "data" }, { name: "data" }])}
 * >
 *   Insert
 * </button>
 * ```
 */
export type CreateFieldArrayInsert<
  TFieldValues extends FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = (
  index: number,
  value:
    | FieldArray<TFieldValues, TFieldArrayName>
    | FieldArray<TFieldValues, TFieldArrayName>[],
  options?: FieldArrayMethodProps,
) => void

/**
 * Update field/fields at particular position.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param index - insert position
 * @param value - insert field or fields
 *
 * @example
 * ```tsx
 * <button type="button" onClick={() => update(1, { name: "data" })}>Update</button>
 * <button
 *   type="button"
 *   onClick={() => update(1, [{ name: "data" }, { name: "data" }])}
 * >
 *   Update
 * </button>
 * ```
 */
export type CreateFieldArrayUpdate<
  TFieldValues extends FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = (index: number, value: FieldArray<TFieldValues, TFieldArrayName>) => void

/**
 * Replace the entire field array values.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/calc-i231d)
 *
 * @param value - the entire field values.
 *
 * @example
 * ```tsx
 * <button
 *   type="button"
 *   onClick={() => replace([{ name: "data" }, { name: "data" }])}
 * >
 *   Replace
 * </button>
 * ```
 */
export type CreateFieldArrayReplace<
  TFieldValues extends FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = (
  value:
    | FieldArray<TFieldValues, TFieldArrayName>
    | FieldArray<TFieldValues, TFieldArrayName>[],
) => void

export type CreateFieldArrayReturn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends
    FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id',
> = {
  swap: CreateFieldArraySwap
  move: CreateFieldArrayMove
  prepend: CreateFieldArrayPrepend<TFieldValues, TFieldArrayName>
  append: CreateFieldArrayAppend<TFieldValues, TFieldArrayName>
  remove: CreateFieldArrayRemove
  insert: CreateFieldArrayInsert<TFieldValues, TFieldArrayName>
  update: CreateFieldArrayUpdate<TFieldValues, TFieldArrayName>
  replace: CreateFieldArrayReplace<TFieldValues, TFieldArrayName>
  fields: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[]
}
