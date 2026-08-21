import Cookies from '../dist/js.cookie.mjs'

const form = document.querySelector('#cookie-form')
const nameInput = document.querySelector('#cookie-name')
const valueInput = document.querySelector('#cookie-value')
const pathInput = document.querySelector('#cookie-path')
const sameSiteSelect = document.querySelector('#same-site')
const secureInput = document.querySelector('#secure-cookie')
const partitionedInput = document.querySelector('#partitioned-cookie')
const partitionedControl = document.querySelector('#partitioned-control')
const listElement = document.querySelector('#cookie-list')
const codeOutput = document.querySelector('#code-output')
const operationState = document.querySelector('#operation-state')
const toast = document.querySelector('#toast')

let toastTimer

document.querySelector('#current-origin').textContent = window.location.origin

function getAttributes() {
  const expiry = new FormData(form).get('expiry')
  const attributes = {
    path: pathInput.value.trim() || '/',
    sameSite: sameSiteSelect.value
  }

  if (expiry !== 'session') attributes.expires = Number(expiry)
  if (secureInput.checked) attributes.secure = true
  if (partitionedInput.checked) attributes.partitioned = true

  return attributes
}

function formatAttributes(attributes) {
  const entries = Object.entries(attributes).map(([key, value]) => {
    const formatted = typeof value === 'string' ? `'${value}'` : String(value)
    return `${key}: ${formatted}`
  })

  return `{ ${entries.join(', ')} }`
}

function showCode(code, state) {
  codeOutput.textContent = code
  operationState.textContent = state
}

function showToast(message) {
  window.clearTimeout(toastTimer)
  toast.textContent = message
  toast.classList.add('is-visible')
  toastTimer = window.setTimeout(
    () => toast.classList.remove('is-visible'),
    2600
  )
}

function createActionButton(label, className, handler) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.textContent = label
  button.addEventListener('click', handler)
  return button
}

function renderCookies() {
  const cookies = Cookies.get()
  const entries = Object.entries(cookies).sort(([left], [right]) =>
    left.localeCompare(right)
  )

  listElement.replaceChildren()

  if (!entries.length) {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.innerHTML =
      '<strong>当前没有可见 Cookie</strong><p>在左侧写入一个 Cookie，这里会立即显示结果。</p>'
    listElement.append(empty)
    return
  }

  entries.forEach(([name, value]) => {
    const row = document.createElement('div')
    row.className = 'cookie-row'

    const nameElement = document.createElement('span')
    nameElement.className = 'cookie-name'
    nameElement.title = name
    nameElement.textContent = name

    const valueElement = document.createElement('span')
    valueElement.className = 'cookie-value'
    valueElement.title = value
    valueElement.textContent = value || '(空值)'

    const actions = document.createElement('div')
    actions.className = 'row-actions'

    const loadButton = createActionButton('载入', 'row-button', () => {
      nameInput.value = name
      valueInput.value = value
      nameInput.focus()
      showCode(`Cookies.get('${name}') // '${value}'`, '已读取')
      showToast(`已将 ${name} 载入表单`)
    })

    const deleteButton = createActionButton('删除', 'row-button danger', () => {
      const attributes = getAttributes()
      Cookies.remove(name, attributes)
      showCode(
        `Cookies.remove('${name}', ${formatAttributes(attributes)})`,
        '已执行删除'
      )
      renderCookies()
      showToast(
        Cookies.get(name) === undefined
          ? `已删除 ${name}`
          : '未删除：请检查 Path、Domain 等属性是否与创建时一致'
      )
    })

    actions.append(loadButton, deleteButton)
    row.append(nameElement, valueElement, actions)
    listElement.append(row)
  })
}

form.addEventListener('submit', (event) => {
  event.preventDefault()

  const name = nameInput.value.trim()
  const value = valueInput.value
  const attributes = getAttributes()

  if (!name) {
    nameInput.focus()
    showToast('请输入 Cookie 名称')
    return
  }

  Cookies.set(name, value, attributes)
  showCode(
    `Cookies.set('${name}', '${value}', ${formatAttributes(attributes)})`,
    '已执行写入'
  )
  renderCookies()

  showToast(
    Cookies.get(name) === value
      ? `已写入 ${name}`
      : '写入后不可见：浏览器可能拒绝了当前属性组合'
  )
})

secureInput.addEventListener('change', () => {
  partitionedInput.disabled = !secureInput.checked
  partitionedControl.classList.toggle('is-disabled', !secureInput.checked)

  if (!secureInput.checked) partitionedInput.checked = false
})

document.querySelector('#refresh-list').addEventListener('click', () => {
  renderCookies()
  showCode('Cookies.get()', '列表已刷新')
  showToast('列表已刷新')
})

document.querySelector('#reset-form').addEventListener('click', () => {
  form.reset()
  secureInput.dispatchEvent(new Event('change'))
  showCode('Cookies.get()', '表单已重置')
  nameInput.focus()
})

renderCookies()
