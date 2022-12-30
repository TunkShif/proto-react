import { createElement, ReactComponent, render, useEffect, useState } from "./react"

const container = document.getElementById("app")!

const List: ReactComponent<{ items: string[] }> = ({ items }) => {
  return (
    <section>
      <ul>
        {items.map(item => (
          <li>{item}</li>
        ))}
      </ul>
    </section>
  )
}

const Greeting: ReactComponent = () => {
  const [name, setName] = useState("World")
  return (
    <section>
      <input
        onInput={(e: Event) => setName(() => (e.target as HTMLInputElement).value)}
        value={name}
      />
      <p>Hello, {name}!</p>
      <button onClick={() => alert(`Hello, ${name}!`)}>greet</button>
    </section>
  )
}

const Counter: ReactComponent = () => {
  const [count, setCount] = useState(0)
  return (
    <section>
      <button onClick={() => setCount(prev => prev + 1)}>+</button>
      <span>{count}</span>
      <button onClick={() => setCount(prev => prev - 1)}>-</button>
      <button onClick={() => setCount(() => 0)}>reset</button>
    </section>
  )
}

const Effect: ReactComponent = () => {
  return <div>Effect test</div>
}

const EffectTest: ReactComponent = () => {
  const [show, setShow] = useState(true)
  return (
    <section>
      <button onClick={() => setShow(prev => !prev)}>toggle</button>
      {show && <Effect />}
    </section>
  )
}

const App: ReactComponent = () => {
  return (
    <div id="foo">
      <h1 className="heading">Hello, World!</h1>
      <div className="section">
        <p>proto react test</p>
        <a href="#">link</a>
      </div>
      <Greeting />
      <Counter />
      <List items={["Alex", "Ben", "Curry"]} />
      <EffectTest />
    </div>
  )
}

render(<App name="World" />, container)
