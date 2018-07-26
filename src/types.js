// @flow
import type { Axios } from 'axios'

export type NeedsUpdate = (...any) => (...any) => boolean

export type ActionRecipe = (
  ...any
) => (getState: Function, api: Axios, dispatch: Function) => Promise<any> | any

export type ActionNames = {
  success: string,
  error?: string | boolean,
  after?: string | boolean,
  before?: string | boolean,
}

export type AdditionalConfigOptions = {
  before?: false | {},
  after?: false | {},
  error?: false | ((e: any) => any),
}

export type ActionConfigType = {
  action: Object | ActionRecipe,
  needsUpdate?: NeedsUpdate,
} & AdditionalConfigOptions

export type Config = { initialState: Object } & AdditionalConfigOptions

export type SRThunkAction = ActionRecipe & {
  simpleRedux: { actionNames: ActionNames } & ActionConfigType,
}
