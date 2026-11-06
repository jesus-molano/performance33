// Phones: the session is kept in the system keychain (SecureStore), in pieces because it can pass 2 KB.
// The web version is authStorage.web.ts.

import * as SecureStore from 'expo-secure-store'
import { SECURE_STORE_CHUNK_SIZE } from '@/config/app'
import { createChunkedStorage } from './chunkedStorage'

export const authStorage = createChunkedStorage(
  {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key) => SecureStore.deleteItemAsync(key),
  },
  SECURE_STORE_CHUNK_SIZE,
)
