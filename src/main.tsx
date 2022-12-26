import { createElement, ReactComponent, render } from "./react"

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

const App: ReactComponent<{ name: string }> = ({ name }) => {
  return (
    <div id="foo">
      <h1 className="heading">Hello, World!</h1>
      <div className="section">
        <p>proto react test</p>
        <a href="#">link</a>
      </div>
      <div>
        <button onClick={() => alert("hello")}>greet</button>
      </div>
      <div>
        <input
          onInput={(e: Event) => {
            const name = (e.target as HTMLInputElement).value
            render(<App name={name} />, container)
          }}
          value={name}
        />
        <p>Hello, {name}!</p>
      </div>
      <List items={["Alex", "Ben", "Curry"]} />
    </div>
  )
}

render(<App name="World" />, container)
