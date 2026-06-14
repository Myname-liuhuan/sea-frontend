import type { App } from 'vue'
import vHasPermi from './hasPermi'

export function setupDirectives(app: App) {
  app.directive('has-permi', vHasPermi)
}