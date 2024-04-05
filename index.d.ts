import { PluginWithOptions } from 'markdown-it'

declare const taskLists: PluginWithOptions<
  | {
      enabled?: boolean | (() => boolean)
      label?: boolean
      labelAfter?: boolean
    }
  | undefined
>

export default taskLists
