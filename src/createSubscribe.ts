import Solid from 'solid-js'

import { Subject } from './utils/createSubject'

type Props<T> = {
  disabled?: boolean
  subject: Subject<T>
  next: (value: T) => void
}

export function createSubscribe<T>(props: Props<T>) {
  const _props = Solid.useRef(props)
  _props = props

  Solid.createEffect(() => {
    const subscription =
      !props.disabled &&
      _props.subject &&
      _props.subject.subscribe({
        next: _props.next,
      })

    return () => {
      subscription && subscription.unsubscribe()
    }
  }, [props.disabled])
}
