
var timeoutId = 0;
var frequencyInMs = 15 * 60 * 1000; // 15 mins

async function setup(server) {
    if (!server) {
        return Promise.reject(new Error('Server is not populated.'));
    }

    // Grab Device ID
    const deviceId = document.getElementById('device-id').value || '';

    if (!deviceId) {
        return Promise.reject(new Error('MAC Address is not populated.'));
    }

    // Grab API Key
    const apiKey = document.getElementById('api-key').value || '';

    if (apiKey) {
        return Promise.resolve(apiKey);
    }

    try {
        const url = new URL('/api/setup', server);
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'ID': deviceId
            }
        });

        if (resp.status != 200) {
            return Promise.reject(new Error(`HTTP Status Code (${resp.status}) does indicate success.`))
        }

        const json = await resp.json();

        console.log('Setup:', json);
        if (json['status'] != 200) {
            return Promise.reject(new Error(`API Status Code (${json['status']}) does indicate success.`));
        }

        document.getElementById('screen').src = json['image_url'];
        document.getElementById('api-key').value = json['api_key'];
        return Promise.resolve(json['api_key']);
    } catch (err) {
        return Promise.reject(err);
    }
}

async function display(server, deviceId, key) {
    if (!server) {
        return Promise.reject(new Error('Server is not populated.'));
    }

    if (!deviceId) {
        return Promise.reject(new Error('MAC Address is not populated.'));
    }

    if (!key) {
        return Promise.reject(new Error('API Key is not populated.'));
    }

    try {
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
            return Promise.reject(new Error(`HTTP Status Code (${resp.status}) does indicate success.`))
        }

        const json = await resp.json();

        console.log('Display:', json);
        if (json['status'] != 0) {
            return Promise.reject(new Error(`API Status Code (${json['status']}) does indicate success.`));
        }

        document.getElementById('screen').src = json['image_url'];
        const frequency = parseInt(json['refresh_rate'], 10);
        if (!isNaN(frequency)) {
            console.log(`Setting refresh frequency to ${frequency} seconds.`);
            frequencyInMs = frequency * 1000;
        }

        return Promise.resolve();
    } catch (err) {
        Promise.reject(err);
    }
}

async function loop(server, deviceId) {
    try {
        const apiKey = await setup(server);
        
        await display(server, deviceId, apiKey);

        timeoutId = 0;
        start(false);
    } catch (err) {
        return Promise.reject(err);
    }
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

// Check for query params on page load
window.onload = function() {
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