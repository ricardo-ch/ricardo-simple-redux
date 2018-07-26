import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import axios from 'axios'
import SimpleRedux from './'

const createTestStore = () => {
  const axiosInstance = axios.create({})
  return createStore(() => {}, applyMiddleware(thunk.withExtraArgument(axiosInstance)))
}

describe('SimpleRedux', () => {
  const initialState = {
    test: true,
  }
  const before = { before: true }
  const after = { after: false }
  const error = () => ({ error: true })
  const defaultConfig = {
    initialState,
    before,
    after,
    error,
  }

  test('should initialize with params', () => {
    const simpleRedux = new SimpleRedux(defaultConfig)

    expect(simpleRedux.initialState).toEqual(initialState)
    expect(simpleRedux.generic.before).toEqual(before)
    expect(simpleRedux.generic.after).toEqual(after)
    expect(simpleRedux.generic.error).toEqual(error)
  })

  test('should trigger action and dispatch before and after from config', async () => {
    const store = createTestStore()
    const simpleRedux = new SimpleRedux({
      ...defaultConfig,
      getState: store.getState,
      dispatch: store.dispatch,
    })
    store.replaceReducer(simpleRedux.reducer)

    const action = simpleRedux.actionFactory('action', {
      action: number => () => ({ action: number }),
    })

    await store.dispatch(action(24))

    expect(store.getState()).toEqual({ action: 24, after: false, before: true, test: true })
  })

  test('should dispatch error', async () => {
    const store = createTestStore()
    const simpleRedux = new SimpleRedux({
      ...defaultConfig,
      getState: store.getState,
      dispatch: store.dispatch,
    })
    store.replaceReducer(simpleRedux.reducer)

    const action = simpleRedux.actionFactory('action', {
      action: () => () => {
        throw new Error()
      },
    })

    await store.dispatch(action())

    expect(store.getState()).toEqual({ error: true, after: false, before: true, test: true })
  })

  test('should dispatch update', async () => {
    const store = createTestStore()
    const simpleRedux = new SimpleRedux({
      ...{ initialState: { initial: true } },
      getState: store.getState,
      dispatch: store.dispatch,
    })
    store.replaceReducer(simpleRedux.reducer)

    const action = simpleRedux.actionFactory('action', {
      action: value => () => ({ update: value }),
    })

    await store.dispatch(action('update'))

    expect(store.getState()).toEqual({ initial: true, update: 'update' })
  })

  test(`should overwrite default config and don't trigger before`, async () => {
    const store = createTestStore()
    const simpleRedux = new SimpleRedux({
      ...defaultConfig,
      getState: store.getState,
      dispatch: store.dispatch,
    })
    store.replaceReducer(simpleRedux.reducer)

    const action = simpleRedux.actionFactory('action', {
      before: false,
      action: value => () => ({ update: value }),
      after: { after: 2000 },
    })

    await store.dispatch(action('update'))

    expect(store.getState()).toEqual({ after: 2000, test: true, update: 'update' })
  })

  test(`should prevent from adding more than one action with the same name`, async () => {
    const store = createTestStore()
    const simpleRedux = new SimpleRedux({
      ...defaultConfig,
      getState: store.getState,
      dispatch: store.dispatch,
    })
    store.replaceReducer(simpleRedux.reducer)

    simpleRedux.actionFactory('action', {
      action: () => () => {},
    })
    let e
    try {
      simpleRedux.actionFactory('action', {
        action: () => () => {},
      })
    } catch (err) {
      e = `${err}`
    }

    expect(e).toEqual(
      'Error: Action action already exists. Action name has to be unique across the app'
    )
  })

  test(`should dispatch simple action`, async () => {
    const store = createTestStore()
    const simpleRedux = new SimpleRedux({
      ...defaultConfig,
      getState: store.getState,
      dispatch: store.dispatch,
    })
    store.replaceReducer(simpleRedux.reducer)

    const action = simpleRedux.actionFactory('action', {
      action: { update: 2000 },
    })

    await store.dispatch(action())

    expect(store.getState()).toEqual({ before: true, after: false, test: true, update: 2000 })
  })

  test(`should expose additional properties in action.simpleRedux`, async () => {
    const store = createTestStore()
    const simpleRedux = new SimpleRedux({
      ...defaultConfig,
      getState: store.getState,
      dispatch: store.dispatch,
    })
    store.replaceReducer(simpleRedux.reducer)

    const action = simpleRedux.actionFactory('action', {
      action: { update: 2000 },
    })

    expect(action.simpleRedux).toEqual({
      action: {
        update: 2000,
      },
      actionNames: {
        after: 'action/after',
        before: 'action/before',
        error: 'action/error',
        success: 'action',
      },
      after: {
        after: false,
      },
      before: {
        before: true,
      },
      error: defaultConfig.error,
      needsUpdate: undefined,
    })
  })
})
