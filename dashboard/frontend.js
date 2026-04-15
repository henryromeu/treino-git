document.addEventListener('DOMContentLoaded', () => {
    const devicesContainer = document.querySelector('section.space-y-4');
    
    async function fetchDevices() {
        try {
            const response = await fetch('http://localhost:3000/api/devices');
            const devices = await response.json();
            
            renderDevices(devices);
            updateSummary(devices);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        }
    }

    function updateSummary(devices) {
        const total = devices.length;
        const online = devices.filter(d => d.status === 'ok').length;
        const offline = total - online;
        
        // Calculate latency
        const onlineDevices = devices.filter(d => d.status === 'ok' && !isNaN(parseFloat(d.latency)));
        const avgLat = onlineDevices.length > 0 
            ? Math.round(onlineDevices.reduce((acc, d) => acc + parseFloat(d.latency), 0) / onlineDevices.length)
            : 0;

        // Update DOM if IDs exist, else fallback to picking by structure (graceful update)
        const totalEl = document.getElementById('total-devices-text');
        if (totalEl) totalEl.textContent = total;
        
        const onlineEl = document.getElementById('online-devices-text');
        if (onlineEl) onlineEl.textContent = online;
        
        const offlineEl = document.getElementById('offline-devices-text');
        if (offlineEl) offlineEl.textContent = offline < 10 ? '0' + offline : offline;
        
        const latEl = document.getElementById('avg-latency-text');
        if (latEl) latEl.textContent = avgLat + 'ms';
    }

    function renderDevices(devices) {
        // Remove old device rows
        const oldRows = devicesContainer.querySelectorAll('.grid.items-center');
        oldRows.forEach(row => {
            // Check if it's the header
            if (!row.classList.contains('hidden')) {
                row.remove();
            }
        });

        // Insert new ones
        devices.forEach(device => {
            const isOnline = device.status === 'ok';
            const rowHTML = `
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${isOnline ? 'bg-surface-container-low hover:bg-surface-container group' : 'bg-[#131b2e] group relative'} p-6 md:px-8 rounded-2xl transition-colors">
                    ${!isOnline ? '<div class="absolute inset-0 bg-error/5 rounded-2xl pointer-events-none"></div>' : ''}
                    <div class="col-span-4 flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl ${isOnline ? 'bg-surface-container-high text-primary group-hover:scale-110' : 'bg-error-container/20 text-error'} flex items-center justify-center transition-transform">
                            <span class="material-symbols-outlined">${device.icon || 'router'}</span>
                        </div>
                        <div>
                            <h4 class="font-headline font-bold ${isOnline ? 'text-on-surface' : 'text-error'}">${device.name}</h4>
                            <p class="text-xs text-slate-500">${device.description}</p>
                        </div>
                    </div>
                    
                    <div class="col-span-3">
                        <code class="text-xs bg-surface-container-lowest px-2 py-1 rounded ${isOnline ? 'text-primary-fixed' : 'text-error/60'}">${device.ip}</code>
                    </div>
                    
                    <div class="col-span-2">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 ${isOnline ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'} text-[10px] font-bold rounded-full uppercase tracking-wider ${isOnline?'shadow-[inset_0_0_8px_rgba(60,227,106,0.1)]':''}">
                            <span class="w-1.5 h-1.5 ${isOnline ? 'bg-tertiary heartbeat' : 'bg-error'} rounded-full"></span>
                            ${isOnline ? 'Online / Stable' : 'Connection Lost'}
                        </span>
                    </div>
                    
                    <div class="col-span-3 flex items-center justify-end gap-4">
                        <div class="text-right">
                            <p class="text-xl font-headline font-bold ${isOnline ? 'text-on-surface' : 'text-error'}">${device.latency}${isOnline ? 'ms' : ''}</p>
                            <p class="text-[10px] uppercase text-slate-500 tracking-tighter">Latency</p>
                        </div>
                        <div class="w-24 h-10 flex items-end gap-1 ${!isOnline ? 'opacity-20' : ''}">
                            <div class="flex-1 ${isOnline ? 'bg-tertiary/20' : 'bg-error'} ${isOnline ? 'h-4' : 'h-1'} rounded-t-sm"></div>
                            <div class="flex-1 ${isOnline ? 'bg-tertiary/20' : 'bg-error'} ${isOnline ? 'h-5' : 'h-1'} rounded-t-sm"></div>
                            <div class="flex-1 ${isOnline ? 'bg-tertiary/40' : 'bg-error'} ${isOnline ? 'h-6' : 'h-1'} rounded-t-sm"></div>
                            <div class="flex-1 ${isOnline ? 'bg-tertiary/20' : 'bg-error'} ${isOnline ? 'h-4' : 'h-1'} rounded-t-sm"></div>
                            <div class="flex-1 ${isOnline ? 'bg-tertiary/60' : 'bg-error'} ${isOnline ? 'h-8' : 'h-1'} rounded-t-sm"></div>
                        </div>
                    </div>
                </div>
            `;
            devicesContainer.insertAdjacentHTML('beforeend', rowHTML);
        });
    }

    // Ping loop via frontend - updating every 10 seconds
    fetchDevices();
    setInterval(fetchDevices, 10000);
});
