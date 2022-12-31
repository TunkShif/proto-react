import { render } from "@proto-react/core"
import { useState } from "@proto-react/hooks"
import type { ReactComponent } from "@proto-react/core"

const container = document.getElementById("app")!

const Counter: ReactComponent = () => {
  const [count, setCount] = useState(0)

  const increase = () => {
    setCount((prev) => prev + 1)
  }

  const decrease = () => {
    setCount((prev) => prev - 1)
  }

  const reset = () => {
    setCount(0)
  }

  return (
    <section>
      <h1>Counter</h1>
      <div>
        <button onClick={increase}>+</button>
        <span>{count}</span>
        <button onClick={decrease}>-</button>
        <button onClick={reset}>reset</button>
      </div>
    </section>
  )
}

const Toggle: ReactComponent = () => {
  const [show, setShow] = useState(true)

  return (
    <section>
      <h1>Toggle</h1>
      <div>
        <button onClick={() => setShow((prev) => !prev)}>Click</button>
        {show && <p>Hello, World!</p>}
      </div>
    </section>
  )
}

const List: ReactComponent<{ items: string[] }> = ({ items }) => {
  return (
    <section>
      <ul>
        {items.map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    </section>
  )
}

const App: ReactComponent = () => {
  return (
    <div>
      <Counter />
      <Toggle />
      <List items={["A", "B", "C"]} />
    </div>
  )
}

render(<App />, container)
