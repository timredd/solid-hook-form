import { createEffect, on } from 'solid-js'

import { Subject } from './utils/createSubject'

type Props<T> = {
  disabled?: boolean
  subject: Subject<T>
  next: (value: T) => void
}

export function createSubscribe<T>(props: Props<T>) {
  createEffect(
    on(
      () => props.disabled,
      () => {
        const subscription =
          !props.disabled &&
          props.subject &&
          props.subject.subscribe({
            next: props.next,
          })

        return () => {
          subscription && subscription.unsubscribe()
        }
      },
    ),
  )
}
