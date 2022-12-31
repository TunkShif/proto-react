import { render } from "@proto-react/core"
import type { ReactComponent } from "@proto-react/core"

const container = document.getElementById("app")!

let count = 0
let show = true

const App: ReactComponent<{ show: boolean }> = ({ show }) => {
  return (
    <div id="section">
      <button
        onClick={() => {
          show = !show
          renderer()
        }}
      >
        Toggle
      </button>
      <hr />
      {show && <p>Hello, World!</p>}
      <ul>
        {[1, 2, 3].map((n) => (
          <li>{n}</li>
        ))}
      </ul>
      <div>
        <button
          onClick={() => {
            count = count + 1
            renderer()
          }}
        >
          {count}
        </button>
      </div>
    </div>
  )
}

const renderer = () => {
  render(<App show={show} />, container)
}

renderer()
