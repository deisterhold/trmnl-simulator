
var timeoutId = 0;
var frequencyInMs = 15 * 60 * 1000; // 15 mins

async function setup(server, deviceId) {
    const apiKey = document.getElementById('api-key').value || '';

    if (apiKey) {
        return Promise.resolve(apiKey);
    }

    if (!deviceId) {
        return Promise.reject(new Error('Device ID is required if API key is not specified.'));
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
        return Promise.reject(new Error('API Server is not set.'));
    }

    if (!key) {
        return Promise.reject(new Error('API Key is not set.'));
    }

    try {
        const url = new URL('/api/display', server);
        const resp = await fetch(url, {
            method: 'GET',
            headers: {
                'ID': deviceId,
                'Access-Token': key,
                'Refresh-Rate': (frequencyInMs / 1000).toFixed(),
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
        const apiKey = await setup(server, deviceId);
        
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
    clearTimeout(timeoutId);
    timeoutId = 0;
}

function start(firstRun = true) {
    if (timeoutId) {
        console.log('Already running...');
        return;
    }

    if (firstRun) console.log('Starting...');

    timeoutId = setTimeout(() => {
        if (!timeoutId) {
            return;
        }

        const server = document.getElementById('server').value || 'https://trmnl.app';
        const deviceId = document.getElementById('device-id').value;

        loop(server, deviceId).catch((err) => {
            alert(err);
            stop();
        });
    }, firstRun ? 0 : frequencyInMs);
}