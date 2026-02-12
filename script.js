document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const clockElement = document.getElementById('clock');
    const dateElement = document.getElementById('date');
    const clockView = document.getElementById('clock-view');
    const alarmsView = document.getElementById('alarms-view');
    const navClock = document.getElementById('nav-clock');
    const navAlarms = document.getElementById('nav-alarms');
    const addAlarmForm = document.getElementById('add-alarm-form');
    const alarmTimeInput = document.getElementById('alarm-time');
    const alarmLabelInput = document.getElementById('alarm-label');
    const alarmList = document.getElementById('alarm-list');
    const alarmModal = document.getElementById('alarm-modal');
    const modalAlarmLabel = document.getElementById('modal-alarm-label');
    const dismissAlarmBtn = document.getElementById('dismiss-alarm');
    const alarmSound = document.getElementById('alarm-sound');

    // --- State ---
    let alarms = JSON.parse(localStorage.getItem('alarms')) || [];
    let lastTriggeredTime = null;

    // --- Clock & Date Functionality ---
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // Update Clock Display
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;

        // Update Date Display
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString(undefined, dateOptions);

        // Check for alarms
        checkAlarms(now);
    }

    // --- Navigation ---
    function showView(view) {
        clockView.classList.add('hidden');
        alarmsView.classList.add('hidden');
        navClock.classList.replace('text-cyan-400', 'text-gray-400');
        navAlarms.classList.replace('text-cyan-400', 'text-gray-400');

        if (view === 'clock') {
            clockView.classList.remove('hidden');
            navClock.classList.replace('text-gray-400', 'text-cyan-400');
        } else if (view === 'alarms') {
            alarmsView.classList.remove('hidden');
            navAlarms.classList.replace('text-gray-400', 'text-cyan-400');
        }
    }

    navClock.addEventListener('click', () => showView('clock'));
    navAlarms.addEventListener('click', () => showView('alarms'));

    // --- Alarm Management ---
    function saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(alarms));
    }

    function renderAlarms() {
        alarmList.innerHTML = ''; // Clear existing list
        if (alarms.length === 0) {
            alarmList.innerHTML = `<li class="text-center text-gray-500">No alarms set.</li>`;
            return;
        }

        alarms.forEach(alarm => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20';
            li.dataset.id = alarm.id;

            li.innerHTML = `
                <div>
                    <div class="text-2xl font-bold">${alarm.time}</div>
                    <div class="text-sm text-gray-300">${alarm.label}</div>
                </div>
                <div class="flex items-center gap-4">
                    <!-- Toggle Switch -->
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" class="sr-only peer" ${alarm.enabled ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                    <button class="delete-alarm-btn text-red-500 hover:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            `;
            
            // Add event listeners for toggle and delete
            li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
                toggleAlarm(alarm.id, e.target.checked);
            });
            li.querySelector('.delete-alarm-btn').addEventListener('click', () => {
                deleteAlarm(alarm.id);
            });

            alarmList.appendChild(li);
        });
    }

    addAlarmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newAlarm = {
            id: Date.now(),
            time: alarmTimeInput.value,
            label: alarmLabelInput.value || 'Alarm',
            enabled: true
        };
        alarms.push(newAlarm);
        alarms.sort((a, b) => a.time.localeCompare(b.time)); // Sort alarms by time
        saveAlarms();
        renderAlarms();
        addAlarmForm.reset();
    });

    function toggleAlarm(id, isEnabled) {
        const alarm = alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = isEnabled;
            saveAlarms();
        }
    }

    function deleteAlarm(id) {
        alarms = alarms.filter(a => a.id !== id);
        saveAlarms();
        renderAlarms();
    }

    // --- Alarm Triggering ---
    function checkAlarms(now) {
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Prevent re-triggering for the same minute
        if (currentTime === lastTriggeredTime) {
            return;
        }

        const triggeredAlarm = alarms.find(alarm => alarm.time === currentTime && alarm.enabled);

        if (triggeredAlarm) {
            lastTriggeredTime = currentTime;
            triggerAlarm(triggeredAlarm);
        }
    }

    function triggerAlarm(alarm) {
        modalAlarmLabel.textContent = alarm.label;
        alarmModal.classList.remove('hidden');
        alarmSound.play();
    }

    dismissAlarmBtn.addEventListener('click', () => {
        alarmModal.classList.add('hidden');
        alarmSound.pause();
        alarmSound.currentTime = 0; // Rewind the sound
    });

    // --- Initialization ---
    updateClock(); // Initial call to display clock immediately
    setInterval(updateClock, 1000); // Update every second
    renderAlarms(); // Render initial alarms on load
});
