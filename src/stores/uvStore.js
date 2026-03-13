import { reactive } from 'vue'

/**
 * Shared UV state — persists across route navigation for the lifetime of the app session.
 */
export const uvStore = reactive({
  uvIndex:      null,
  uvRaw:        null,
  temperature:  null,
  locationName: '',
  lastUpdated:  '',
  historyData:  null,
})
