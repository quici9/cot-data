/* ═══════════════════════════════════════════════
   NEXUS — Client-Side Encryption (AES-256-GCM)
   Uses Web Crypto API — zero external dependencies
   Works on all modern browsers including Safari iOS
   ═══════════════════════════════════════════════ */

const NexusCrypto = (() => {
    const ALGO = 'AES-GCM';
    const KEY_LENGTH = 256;
    const IV_LENGTH = 12;   // 96-bit IV for GCM
    const SALT_LENGTH = 16; // 128-bit salt
    const ITERATIONS = 100000; // PBKDF2 iterations

    /**
     * Derive an AES key from a password + salt using PBKDF2
     * @param {string} password
     * @param {Uint8Array} salt
     * @returns {Promise<CryptoKey>}
     */
    async function _deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
            keyMaterial,
            { name: ALGO, length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Convert ArrayBuffer to Base64 string
     */
    function _bufToBase64(buf) {
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 string to Uint8Array
     */
    function _base64ToBuf(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Encrypt plaintext with a password
     * Output format: base64(salt + iv + ciphertext)
     * @param {string} plaintext
     * @param {string} password
     * @returns {Promise<string>} Base64-encoded encrypted string
     */
    async function encrypt(plaintext, password) {
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const key = await _deriveKey(password, salt);
        const encoder = new TextEncoder();

        const ciphertext = await crypto.subtle.encrypt(
            { name: ALGO, iv },
            key,
            encoder.encode(plaintext)
        );

        // Combine salt + iv + ciphertext into single buffer
        const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
        combined.set(salt, 0);
        combined.set(iv, SALT_LENGTH);
        combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

        return _bufToBase64(combined.buffer);
    }

    /**
     * Decrypt an encrypted Base64 string with a password
     * @param {string} encryptedBase64
     * @param {string} password
     * @returns {Promise<string>} Decrypted plaintext
     * @throws {Error} If password is wrong or data is corrupted
     */
    async function decrypt(encryptedBase64, password) {
        const combined = _base64ToBuf(encryptedBase64);

        if (combined.byteLength < SALT_LENGTH + IV_LENGTH + 1) {
            throw new Error('Invalid encrypted data: too short');
        }

        const salt = combined.slice(0, SALT_LENGTH);
        const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);
        const key = await _deriveKey(password, salt);

        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: ALGO, iv },
                key,
                ciphertext
            );
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            throw new Error('Giải mã thất bại — sai mật khẩu hoặc dữ liệu bị hỏng');
        }
    }

    return { encrypt, decrypt };
})();
