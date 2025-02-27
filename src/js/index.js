
var timeoutId = 0;
var frequencyInMs = 15 * 60 * 1000; // 15 mins

async function setup(server) {
    if (!server) {
        throw new Error('Server is not populated.');
    }

    // Grab Device ID
    const deviceId = document.getElementById('device-id').value || '';

    if (!deviceId) {
        throw new Error('MAC Address is not populated.');
    }

    // Grab API Key
    const apiKey = document.getElementById('api-key').value || '';

    if (apiKey) {
        return [deviceId, apiKey];
    }

    const url = new URL('/api/setup', server);
    const resp = await fetch(url, {
        method: 'GET',
        headers: {
            'ID': deviceId
        }
    });

    if (resp.status != 200) {
        throw new Error(`HTTP Status Code (${resp.status}) does indicate success.`);
    }

    const json = await resp.json();

    console.log('Setup:', json);
    if (json['status'] != 200) {
        let message;

        if (json && json['message']) {
            message = json['message'].toString();
        } else {
            message = `API Status Code (${json['status']}) does indicate success.`
        }

        throw new Error(message);
    }

    // Set screen to initial value and populate API field
    document.getElementById('screen').src = json['image_url'];
    document.getElementById('api-key').value = json['api_key'];

    return [deviceId, json['api_key']];
}

async function display(server, deviceId, key) {
    if (!server) {
        throw new Error('Server is not populated.');
    }

    if (!deviceId) {
        throw new Error('MAC Address is not populated.');
    }

    if (!key) {
        throw new Error('API Key is not populated.');
    }

    const url = new URL('/api/display', server);
    const resp = await fetch(url, {
        method: 'GET',
        headers: {
            'ID': deviceId,
            'Access-Token': key,
            'Refresh-Rate': (frequencyInMs / 1000).toFixed()
        }
    });

    if (resp.status != 200) {
        throw new Error(`HTTP Status Code (${resp.status}) does indicate success.`);
    }

    const json = await resp.json();

    console.log('Display:', json);
    if (json['status'] != 0) {
        let message;

        if (json && json['error']) {
            message = json['error'].toString();
        } else {
            message = `API Status Code (${json['status']}) does indicate success.`
        }

        throw new Error(message);
    }

    document.getElementById('screen').src = json['image_url'];
    const frequency = parseInt(json['refresh_rate'], 10);
    if (!isNaN(frequency)) {
        console.log(`Setting refresh frequency to ${frequency} seconds.`);
        frequencyInMs = frequency * 1000;
    }

    return;
}

async function loop(server) {
    const [deviceId, apiKey] = await setup(server);

    await display(server, deviceId, apiKey);

    timeoutId = 0;
    start(false);
}

function stop() {
    if (!timeoutId) return;

    console.log('Stopping...');
    // Cancel any running timeout
    clearTimeout(timeoutId);
    // Set tracker to zero to indicate nothing should be running
    timeoutId = 0;
    // Disable stop button
    document.querySelectorAll('button[type="button"]')[0].disabled = true;
    // Enable start button
    document.querySelectorAll('button[type="button"]')[1].disabled = false;
}

function start(firstRun = true) {
    if (timeoutId) {
        console.log('Already running...');
        return;
    }

    // firstRun should be true only when called by the user clicking the button
    if (firstRun) {
        console.log('Starting...');
        // Enable stop button
        document.querySelectorAll('button[type="button"]')[0].disabled = false;
        // Disable start button
        document.querySelectorAll('button[type="button"]')[1].disabled = true;
    }

    timeoutId = setTimeout(() => {
        if (!timeoutId) {
            return;
        }

        // Grab Server Base URL
        const server = document.getElementById('server').value;

        loop(server).catch((err) => {
            alert(err);
            stop();
        });
    }, firstRun ? 0 : frequencyInMs);
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        const screen = document.getElementById('screen');
        console.log('Entering fullscreen...', screen);
        screen.classList.remove('mix-blend-multiply');
        screen.requestFullscreen();
    } else if (document.exitFullscreen) {
        console.log('Exiting fullscreen...');
        screen.classList.add('mix-blend-multiply');
        document.exitFullscreen();
    }
}

// Check for query params on page load
window.onload = function () {
    var parameters = new URLSearchParams(location.search);

    const serverInput = document.getElementById('server');
    const deviceIdInput = document.getElementById('device-id');
    const apiKeyInput = document.getElementById('api-key');

    // Populate Device ID and API Key fields
    deviceIdInput.value = parameters.get('deviceId') || '';
    apiKeyInput.value = parameters.get('apiKey') || '';

    // Only set the server if passed so the default value isn't overwritten
    if (parameters.has('server')) {
        serverInput.value = parameters.get('server');
    }

    // If Server and Device ID are specified, start polling the API
    if (serverInput.value && deviceIdInput.value) {
        start();
    }
}