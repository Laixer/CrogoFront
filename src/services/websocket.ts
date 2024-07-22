
// const ws_host = 'ws://localhost:8000';
const ws_host = 'wss://edge.laixer.equipment/api';
const webSocket = new WebSocket(`${ws_host}/app/${instance_id}/ws`);

