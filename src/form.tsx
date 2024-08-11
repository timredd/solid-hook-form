import { createEffect, createSignal, mergeProps } from 'solid-js'
import { createFormContext } from './createFormContext'
import { FieldValues, FormProps } from './types'
import get from './utils/get'

const POST_REQUEST = 'post'

/**
 * Form component to manage submission.
 *
 * @param props - to setup submission detail. {@link FormProps}
 *
 * @returns form component or headless render prop.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { control, formState: { errors } } = useForm();
 *
 *   return (
 *     <Form action="/api" control={control}>
 *       <input {...register("name")} />
 *       <p>{errors?.root?.server && 'Server error'}</p>
 *       <button>Submit</button>
 *     </Form>
 *   );
 * }
 * ```
 */
function Form<
  T extends FieldValues,
  U extends FieldValues | undefined = undefined,
>(props: FormProps<T, U>) {
  const methods = createFormContext<T>()
  const [mounted, setMounted] = createSignal(false)
  const mergedProps = mergeProps(
    { control: methods.control, method: POST_REQUEST } as FormProps<T, U>,
    props,
  )

  const submit = async (event?: Event) => {
    let hasError = false
    let type = ''

    await mergedProps.control.handleSubmit(async (data) => {
      const formData = new FormData()
      let formDataJson = ''

      try {
        formDataJson = JSON.stringify(data)
      } catch {}

      for (const name of mergedProps.control._names.mount) {
        formData.append(name, get(data, name))
      }

      if (mergedProps.onSubmit) {
        await mergedProps.onSubmit({
          data,
          event,
          method: mergedProps.method,
          formData,
          formDataJson,
        })
      }

      if (mergedProps.action) {
        try {
          const shouldStringifySubmissionData = [
            mergedProps.headers && mergedProps.headers['Content-Type'],
            mergedProps.encType,
          ].some((value) => value && value.includes('json'))

          const response = await fetch(mergedProps.action, {
            method: mergedProps.method,
            headers: {
              ...mergedProps.headers,
              ...(mergedProps.encType
                ? { 'Content-Type': mergedProps.encType }
                : {}),
            },
            body: shouldStringifySubmissionData ? formDataJson : formData,
          })

          if (
            response &&
            (mergedProps.validateStatus
              ? !mergedProps.validateStatus(response.status)
              : response.status < 200 || response.status >= 300)
          ) {
            hasError = true
            mergedProps.onError && mergedProps.onError({ response })
            type = String(response.status)
          } else {
            mergedProps.onSuccess && mergedProps.onSuccess({ response })
          }
        } catch (error: unknown) {
          hasError = true
          mergedProps.onError && mergedProps.onError({ error })
        }
      }
    })(event)

    if (hasError && props.control) {
      props.control._subjects.state.next({
        isSubmitSuccessful: false,
      })
      props.control.setError('root.server', {
        type,
      })
    }
  }

  createEffect(() => {
    setMounted(true)
  }, [])

  return mergedProps.render ? (
    <>
      {mergedProps.render({
        submit,
      })}
    </>
  ) : (
    <form
      noValidate={mounted()}
      action={mergedProps.action}
      method={mergedProps.method}
      encType={mergedProps.encType}
      onSubmit={submit}
      {...mergedProps}
    >
      {mergedProps.children}
    </form>
  )
}

export { Form }
