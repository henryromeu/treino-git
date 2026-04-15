const express = require('express');
const cors = require('cors');
const ping = require('ping');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
// Serve the static files (like dashboard.html) from the current directory
app.use(express.static(path.join(__dirname)));

// Helper to assign cool names and icons to devices
function getDeviceDetails(ip) {
    if (ip === '8.8.8.8') return { name: "API Gateway Pro", icon: "cloud_sync", description: "Global Load Balancer" };
    if (ip.endsWith('.1')) return { name: "Core Router Alpha", icon: "dns", description: "Primary Gateway" };
    if (ip.endsWith('.100') || ip.endsWith('.122')) return { name: "Database Server", icon: "database", description: "Production Node" };
    return { name: `Network Node [${ip.split('.').pop()}]`, icon: "router", description: "Local Area Device" };
}

// Helper function to scan ARP table
function scanNetwork() {
    return new Promise((resolve, reject) => {
        exec('arp -a', (error, stdout, stderr) => {
            if (error) {
                console.warn("Failed to run arp -a", error);
                return resolve([]);
            }
            const ips = new Set();
            ips.add('8.8.8.8'); // Force adding the requested IP

            const lines = stdout.split('\n');
            for (const line of lines) {
                // Look for lines that contain dynamic or static entries, which are usually network devices
                if (line.includes('dynamic') || line.includes('static')) {
                    const match = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
                    if (match) {
                        const ip = match[0];
                        // Ignore broadcast/multicast
                        if (!ip.endsWith('.255') && !ip.startsWith('224.') && !ip.startsWith('239.') && !ip.startsWith('255.')) {
                            ips.add(ip);
                        }
                    }
                }
            }
            resolve(Array.from(ips));
        });
    });
}

// The core API route
app.get('/api/devices', async (req, res) => {
    try {
        console.log("-> Iniciando varredura da rede...");
        const ipsToPing = await scanNetwork();
        
        console.log(`-> Disparando pings para ${ipsToPing.length} dispositivos...`);
        // Ping all IP addresses asynchronously
        const pingPromises = ipsToPing.map(ip => {
            return ping.promise.probe(ip, { timeout: 2 }).then(result => {
                const details = getDeviceDetails(ip);
                return {
                    name: details.name,
                    description: details.description,
                    icon: details.icon,
                    ip: ip,
                    status: result.alive ? 'ok' : 'offline',
                    latency: result.alive ? result.time : 'Timeout'
                };
            });
        });

        const devicesStatus = await Promise.all(pingPromises);
        
        // Sort devices so online ones appear first, and 8.8.8.8 is always high priority to see
        const sortedDevices = devicesStatus.sort((a, b) => {
            if (a.status === 'ok' && b.status !== 'ok') return -1;
            if (a.status !== 'ok' && b.status === 'ok') return 1;
            return 0;
        });

        res.json(sortedDevices);
    } catch (error) {
        console.error("Erro na API:", error);
        res.status(500).json({ error: "Erro ao varrer a rede" });
    }
});

app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Sentinel Backend is Running!`);
    console.log(`📡 Escutando na porta: ${PORT}`);
    console.log(`🌐 Acesse seu dashboard em: http://localhost:${PORT}/dashboard.html`);
    console.log(`=============================================`);
});
