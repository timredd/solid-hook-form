import Solid, { splitProps } from 'solid-js'

import { CreateFormReturn, FieldValues, FormProviderProps } from './types'

const HookFormContext = Solid.createContext<CreateFormReturn | null>(null)

/**
 * This custom hook allows you to access the form context. createFormContext is intended to be used in deeply nested structures, where it would become inconvenient to pass the context as a prop. To be used with {@link FormProvider}.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useformcontext) • [Demo](https://codesandbox.io/s/react-hook-form-v7-form-context-ytudi)
 *
 * @returns return all createForm methods
 *
 * @example
 * ```tsx
 * function App() {
 *   const methods = createForm();
 *   const onSubmit = data => console.log(data);
 *
 *   return (
 *     <FormProvider {...methods} >
 *       <form onSubmit={methods.handleSubmit(onSubmit)}>
 *         <NestedInput />
 *         <input type="submit" />
 *       </form>
 *     </FormProvider>
 *   );
 * }
 *
 *  function NestedInput() {
 *   const { register } = createFormContext(); // retrieve all hook methods
 *   return <input {...register("test")} />;
 * }
 * ```
 */
export const createFormContext = <
  TFieldValues extends FieldValues,
  TContext = any,
  TransformedValues extends FieldValues | undefined = undefined,
>(): CreateFormReturn<TFieldValues, TContext, TransformedValues> =>
  Solid.useContext(HookFormContext) as CreateFormReturn<
    TFieldValues,
    TContext,
    TransformedValues
  >

/**
 * A provider component that propagates the `createForm` methods to all children components via [React Context](https://reactjs.org/docs/context.html) API. To be used with {@link createFormContext}.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useformcontext) • [Demo](https://codesandbox.io/s/react-hook-form-v7-form-context-ytudi)
 *
 * @param props - all createForm methods
 *
 * @example
 * ```tsx
 * function App() {
 *   const methods = createForm();
 *   const onSubmit = data => console.log(data);
 *
 *   return (
 *     <FormProvider {...methods} >
 *       <form onSubmit={methods.handleSubmit(onSubmit)}>
 *         <NestedInput />
 *         <input type="submit" />
 *       </form>
 *     </FormProvider>
 *   );
 * }
 *
 *  function NestedInput() {
 *   const { register } = createFormContext(); // retrieve all hook methods
 *   return <input {...register("test")} />;
 * }
 * ```
 */
export const FormProvider = <
  TFieldValues extends FieldValues,
  TContext = any,
  TTransformedValues extends FieldValues | undefined = undefined,
>(
  props: FormProviderProps<TFieldValues, TContext, TTransformedValues>,
) => {
  const [, data] = splitProps(props, ['children'])

  return (
    <HookFormContext.Provider value={data as unknown as CreateFormReturn}>
      {props.children}
    </HookFormContext.Provider>
  )
}
