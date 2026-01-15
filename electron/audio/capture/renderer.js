/**
 * @typedef {Object} MicAPI
 * @property {(callback: () => void) => void} onStart
 * @property {(callback: () => void) => void} onStop
 * @property {(chunk: ArrayBuffer) => void} sendChunk
 * @property {(error: string) => void} sendError
 */

/** @type {MicAPI} */
// @ts-ignore
const micAPI = window.micAPI;

/** @type {MediaRecorder | null} */
let mediaRecorder = null;

micAPI.onStart(async () => {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialize MediaRecorder
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                // Convert Blob to ArrayBuffer to send over IPC
                e.data.arrayBuffer().then(buffer => {
                    micAPI.sendChunk(buffer);
                });
            }
        };

        // Capture chunks every 500ms (adjustable)
        mediaRecorder.start(500);
        console.log('Microphone recording started');

    } catch (err) {
        console.error('Microphone error:', err);
        // @ts-ignore
        micAPI.sendError(err.message || String(err));
    }
});

micAPI.onStop(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        // Stop all tracks to release the microphone
        mediaRecorder.stream.getTracks().forEach((/** @type {MediaStreamTrack} */ track) => track.stop());
        console.log('Microphone recording stopped');
    }
});
