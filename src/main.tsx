import { createElement, render } from "./react"

const element = (
  <div id="foo">
    <h1 className="heading">Hello, World!</h1>
    <div className="section">
      <p>proto react test</p>
      <a href="#">link</a>
    </div>
    <div>
      <button onClick={() => alert("hello")}>greet</button>
    </div>
  </div>
)

render(element, document.getElementById("app")!)
