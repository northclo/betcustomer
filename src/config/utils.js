export const setStore = (name, content) => {
  if (!name) return
  if (typeof content !== 'string') {
    content = JSON.stringify(content)
  }
  return window.localStorage.setItem(name, content)
}

export const getStore = (name) => {
  if (!name) return
  const value = window.localStorage.getItem(name)
  if (value === null) return null
  try {
    return JSON.parse(value)
  } catch (e) {
    return value
  }
}

export const removeItem = (name) => {
  if (!name) return
  return window.localStorage.removeItem(name)
}

export const isValidEmail = (value) => {
  return value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,64}$/i.test(value) ? false : true
}
