import { mockRequest, delay } from './mockApi';
import api, { isBackendConfigured } from './api';

/**
 * Device service boundary.
 *
 * The browser never speaks to an ESP32 directly. In the planned architecture the
 * frontend calls an authenticated backend endpoint; the backend publishes an MQTT
 * command; the ESP32 firmware drives the motorised feeder and publishes back a
 * device-status and feeding-event message.
 *
 * Until VITE_API_BASE_URL points at that service, everything below is SIMULATED.
 */
export const isDeviceServiceLive = () => isBackendConfigured();

export const DEVICE_STATUS = { ONLINE: 'Online', OFFLINE: 'Device Offline', IDLE: 'Idle', DISPENSING: 'Dispensing' };
export const DISPENSE_STATE = { SCHEDULED: 'Scheduled', COMMAND_SENT: 'Command Sent', CONFIRMED: 'Dispensing Confirmed', FAILED: 'Failed' };

export async function fetchDevices(mockDevices) {
  if (isDeviceServiceLive()) return (await api.get('/iot/devices')).data;
  const res = await mockRequest(mockDevices, { ms: 300 });
  return res.data;
}

/** Demonstration command. In mock mode this NEVER touches hardware. */
export async function sendTestCommand(deviceId, { amountKg = 1 } = {}) {
  if (isDeviceServiceLive()) {
    return (await api.post(`/iot/devices/${deviceId}/test`, { amountKg })).data;
  }
  await delay(700);
  const accepted = Math.random() > 0.15;
  return {
    simulated: true,
    deviceId,
    amountKg,
    state: accepted ? DISPENSE_STATE.CONFIRMED : DISPENSE_STATE.FAILED,
    message: accepted
      ? `Simulated feeder acknowledged a ${amountKg} kg dispense. No physical hardware was actuated.`
      : 'Simulated device did not acknowledge the command within the timeout window.',
    at: new Date().toISOString(),
  };
}

export async function fetchLatestReadings(mockReadings) {
  if (isDeviceServiceLive()) return (await api.get('/iot/readings/latest')).data;
  return (await mockRequest(mockReadings, { ms: 250 })).data;
}
