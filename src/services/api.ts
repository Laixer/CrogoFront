// TODO: Env
const host = 'https://edge.laixer.equipment/api'

export const getTelemetry = async function (instanceId: string) {
  try {
    // TODO: Auth...
    const response = await fetch(`${host}/app/${instanceId}/telemetry`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ABC@123`
      }
    })

    if (!response.ok) {
      throw new Error('response not ok')
    }

    const data = await response.json()
    const first = data[0]

    return {
      memoryUsed: first.memory_used,
      diskUsed: first.disk_used
    }
  } catch (err) {
    console.error('Error:', err)
    return null
  }
}
