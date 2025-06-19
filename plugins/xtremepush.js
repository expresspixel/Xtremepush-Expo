import { NativeModules } from 'react-native';

const Xtremepush = NativeModules.Xtremepush;

export default Xtremepush;

export function hitEvent(event) {
    Xtremepush.hitEvent(event);
}

export function hitTag(tag) {
    Xtremepush.hitTag(tag);
}

export function hitTagWithValue(tag, value) {
    Xtremepush.hitTagWithValue(tag, value);
}

export function openInbox() {
    Xtremepush.openInbox();
}

export function setUser(user) {
    Xtremepush.setUser(user);
}

export function setExternalId(id) {
    Xtremepush.setExternalId(id);
}

export function requestNotificationPermissions() {
    Xtremepush.requestNotificationPermissions();
}


