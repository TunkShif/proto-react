import { render } from "@proto-react/core"
import { useEffect, useState } from "@proto-react/hooks"
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
      <div id={`count-${count}`}>
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

const Effect: ReactComponent = () => {
  useEffect(() => {
    console.log("effect running")
    return () => {
      console.log("effect disposed")
    }
  }, [])
  return <h2>check console log</h2>
}

const Echo: ReactComponent = () => {
  const [text, setTitle] = useState("Proto React")

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    setTitle(() => target.value)
  }

  return (
    <section>
      <input onInput={handleInput} value="Proto React" />
      <p>echo: {text}</p>
    </section>
  )
}

const App: ReactComponent = () => {
  const [show, setShow] = useState(true)
  return (
    <div>
      <Counter />
      <Toggle />
      <List items={["A", "B", "C"]} />
      <Echo />
      <section>
        <button onClick={() => setShow((prev) => !prev)}>toggle</button>
        {show && <Effect />}
      </section>
    </div>
  )
}

render(<App />, container)
