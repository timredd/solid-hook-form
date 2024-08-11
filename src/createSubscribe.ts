import Solid from 'solid-js'

import { Subject } from './utils/createSubject'

type Props<T> = {
  disabled?: boolean
  subject: Subject<T>
  next: (value: T) => void
}

export function createSubscribe<T>(props: Props<T>) {
  const _props = Solid.useRef(props)
  _props.current = props

  Solid.createEffect(() => {
    const subscription =
      !props.disabled &&
      _props.current.subject &&
      _props.current.subject.subscribe({
        next: _props.current.next,
      })

    return () => {
      subscription && subscription.unsubscribe()
    }
  }, [props.disabled])
}
