export function getClientId() {
  let id = localStorage.getItem('uno_cid');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('uno_cid', id);
  }
  return id;
}

export function saveSession(roomCode, playerName) {
  localStorage.setItem('uno_room', roomCode);
  localStorage.setItem('uno_name', playerName);
}

export function clearSession() {
  localStorage.removeItem('uno_room');
  localStorage.removeItem('uno_name');
}

export function getSavedSession() {
  return {
    clientId: getClientId(),
    roomCode: localStorage.getItem('uno_room'),
    playerName: localStorage.getItem('uno_name'),
  };
}
