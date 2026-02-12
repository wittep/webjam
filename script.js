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
        
        // Reset nav styles
        navClock.className = 'nav-btn py-2 px-4 text-sm font-medium tracking-wide text-neutral-500 hover:text-neutral-300 border-b-2 border-transparent transition-all';
        navAlarms.className = 'nav-btn py-2 px-4 text-sm font-medium tracking-wide text-neutral-500 hover:text-neutral-300 border-b-2 border-transparent transition-all';

        if (view === 'clock') {
            clockView.classList.remove('hidden');
            navClock.className = 'nav-btn py-2 px-4 text-sm font-medium tracking-wide text-white border-b-2 border-white transition-all';
        } else if (view === 'alarms') {
            alarmsView.classList.remove('hidden');
            navAlarms.className = 'nav-btn py-2 px-4 text-sm font-medium tracking-wide text-white border-b-2 border-white transition-all';
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
            alarmList.innerHTML = `<li class="text-center text-neutral-600 font-light mt-10">No alarms set yet.</li>`;
            return;
        }

        alarms.forEach(alarm => {
            const li = document.createElement('li');
            li.className = 'group flex items-center justify-between p-4 border-b border-neutral-900 hover:bg-neutral-900/50 transition-colors rounded-lg';
            li.dataset.id = alarm.id;

            li.innerHTML = `
                <div class="flex flex-col">
                    <div class="text-3xl font-light text-white font-outfit">${alarm.time}</div>
                    <div class="text-xs text-neutral-500 uppercase tracking-wider">${alarm.label}</div>
                </div>
                <div class="flex items-center gap-4">
                    <!-- Toggle Switch -->
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" class="sr-only peer" ${alarm.enabled ? 'checked' : ''}>
                        <div class="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                    </label>
                    <button class="delete-alarm-btn text-neutral-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-2">
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
        // Show current time in modal
        document.getElementById('modal-time-display').textContent = alarm.time;
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
