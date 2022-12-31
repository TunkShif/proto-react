import { render } from "@proto-react/core"
import type { ReactComponent } from "@proto-react/core"

const container = document.getElementById("app")!

let show = true

const handleClick = () => {
  show = !show
  renderer()
}

const App: ReactComponent<{ show: boolean }> = ({ show }) => {
  return (
    <div id="section">
      <button onClick={handleClick}>Toggle</button>
      <hr />
      {show && <p>Hello, World!</p>}
      {[1, 2, 3].map((n) => (
        <p>{n}</p>
      ))}
    </div>
  )
}

const renderer = () => {
  render(<App show={show} />, container)
}

renderer()
