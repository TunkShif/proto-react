import { render, h } from "@proto-react/core"

const container = document.getElementById("app")!

let show = true

const handleClick = () => {
  show = !show
  renderer()
}

const App = (show: boolean) =>
  h(
    "div",
    null,
    h("button", { onClick: handleClick }, "Toggle"),
    h("hr"),
    show && h("p", null, "Hello, World!")
  )

const renderer = () => {
  render(App(show), container)
}

renderer()
