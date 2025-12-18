import '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {
    toBeInTheDocument(): T
    toBeDisabled(): T
    toHaveClass(className: string): T
  }
}
