import { t, translateError } from '../i18n/language'
// Adapter local dùng API HTTP thật + cookie HttpOnly; không giữ mật khẩu/token trong localStorage.
export function createApiClient() {
  const listeners = new Set()
  let current = null
  async function request(path, body, method = 'POST') {
    try {
      const response = await fetch('/api/' + path, {
        method,
        credentials: 'same-origin',
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        ...(method === 'POST' ? { body: JSON.stringify(body || {}) } : {}),
      })
      const result = await response.json()
      if (result.error) result.error = { ...result.error, message: translateError(result.error) }
      return result
    } catch {
      return {
        error: {
          code: 'network_error',
          message: t(
            'Chưa kết nối được dịch vụ. Vui lòng thử lại.',
            'Unable to connect to the service. Please try again.',
          ),
        },
      }
    }
  }
  const emit = (event, next) => {
    current = next
    listeners.forEach((fn) => fn(event, next))
  }
  async function initialize() {
    const params = new URLSearchParams(location.hash.split('?')[1])
    const recovery = params.get('recovery')
    if (recovery) history.replaceState(null, '', location.pathname + location.search + '#/account')
    const result = recovery
      ? await request('auth/recover', { token: recovery })
      : await request('auth/session', null, 'GET')
    emit(
      result.data?.session?.recovery ? 'PASSWORD_RECOVERY' : 'INITIAL_SESSION',
      result.data?.session || null,
    )
  }
  let ready
  const auth = {
    onAuthStateChange(fn) {
      listeners.add(fn)
      if (!ready) ready = initialize()
      else
        ready.then(() => {
          if (listeners.has(fn))
            fn(current?.recovery ? 'PASSWORD_RECOVERY' : 'INITIAL_SESSION', current)
        })
      return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } }
    },
    async signInWithPassword(values) {
      const r = await request('auth/signin', values)
      if (!r.error) emit('SIGNED_IN', r.data.session)
      return r
    },
    async signUp(values) {
      const r = await request('auth/signup', {
        email: values.email,
        password: values.password,
        displayName: values.options.data.display_name,
      })
      if (!r.error) emit('SIGNED_IN', r.data.session)
      return r
    },
    async signOut(options) {
      const r = await request('auth/signout', options)
      if (!r.error) emit('SIGNED_OUT', null)
      return r
    },
    resetPasswordForEmail(email) {
      return request('auth/reset', { email })
    },
    async updateUser(values) {
      return request('auth/password', values)
    },
  }
  function from(table) {
    const input = { table, operation: 'select', filters: [], order: [] }
    const builder = {
      select(columns) {
        input.columns = columns
        return this
      },
      eq(column, value) {
        input.filters.push({ column, value })
        return this
      },
      order(column, options = {}) {
        input.order.push({ column, ascending: options.ascending })
        return this
      },
      limit(limit) {
        input.limit = limit
        return this
      },
      range(start, end) {
        input.offset = start
        input.limit = end - start + 1
        return this
      },
      single() {
        input.cardinality = 'single'
        return this
      },
      maybeSingle() {
        input.cardinality = 'maybeSingle'
        return this
      },
      insert(values) {
        input.operation = 'insert'
        input.values = values
        return this
      },
      update(values) {
        input.operation = 'update'
        input.values = values
        return this
      },
      upsert(values) {
        input.operation = 'upsert'
        input.values = values
        return this
      },
      delete() {
        input.operation = 'delete'
        return this
      },
      then(resolve, reject) {
        return request('data', input).then(resolve, reject)
      },
    }
    return builder
  }
  return { auth, from, rpc: (name, args) => request('rpc', { name, args }), isLocal: true }
}

// Một backend duy nhất: Kotlin Spring Boot, truy cập qua proxy cùng origin.
export const apiClient = createApiClient()
