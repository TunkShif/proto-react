declare namespace JSX {
  interface IntrinsicElements extends IntrinsicElementMap { }

  type IntrinsicElementMap = {
    [K in keyof HTMLElementTagNameMap]: Record<string, any>
  }
}
