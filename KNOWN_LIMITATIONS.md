# CipherChat 3.0 — Known Limitations & Threat Boundaries

In accordance with strict cybersecurity engineering principles, this document transparently records residual limitations, protocol boundaries, and areas requiring ongoing attention.

## 1. Residual Metadata Visibility

While message bodies and media attachments are end-to-end encrypted, the Matrix protocol architecture retains certain metadata visible to homeserver administrators:
1. **Event Timestamps & Volume:** The homeserver can observe when a user sends or receives messages and the frequency of events.
2. **Room Membership Graph:** Synapse stores which user IDs are joined to which room IDs.
3. **Ciphertext Payload Lengths:** Encrypted event ciphertext length correlates approximately with message or attachment length.

## 2. Multi-Tab Crypto Lock Contention

When running multiple browser tabs under the same user session, `IndexedDB` access to the Rust/WASM crypto store requires sequential transaction coordination. Opening dozens of concurrent tabs may trigger brief key store lock contention.

## 3. Large File Streaming

Current client-side AES-CTR encryption processes files in memory chunks via the Web Crypto API. Transferring files larger than 500 MB on memory-constrained mobile devices may lead to browser tab memory warnings.
