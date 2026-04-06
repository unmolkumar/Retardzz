const API_BASE = 'http://127.0.0.1:8000/api/room';
const REQUEST_TIMEOUT_MS = 15000;
const NOTIFICATION_POLL_MS = 20000;
const STUDY_STATS_POLL_MS = 10000;
const PRESENCE_PING_MS = 12000;
const MAX_ACTIVITY_NOTIFICATIONS = 20;
const STUDY_TIMER_STORAGE_KEY = 'saivo_room_timer_state';
const ROOM_NAV_STORAGE_KEY = 'saivo_room_nav_state';
const WHITEBOARD_BASE_URL_STORAGE_KEY = 'saivo_whiteboard_base_url';
const WHITEBOARD_DEFAULT_BASE_URL = 'http://127.0.0.1:3001';

let currentUser = localStorage.getItem('username');
let activeRoom = null;
let currentInviteCode = '';
let activeRoomAdmin = '';
let refreshInterval = null;
let notificationInterval = null;
let studyStatsInterval = null;
let presenceInterval = null;
let clockInterval = null;
let roomCache = [];
let unreadActivityCount = 0;
let lastHubQuote = '';

const STUDY_MODE_CONFIG = {
    focus60: { label: 'Deep Focus - 60m', minutes: 60, tracksStudy: true, color: '#ef4444' },
    focus30: { label: 'Sprint Focus - 30m', minutes: 30, tracksStudy: true, color: '#f97316' },
    focus15: { label: 'Quick Focus - 15m', minutes: 15, tracksStudy: true, color: '#eab308' },
    focus5: { label: 'Warmup Focus - 5m', minutes: 5, tracksStudy: true, color: '#22c55e' }
};

const studyState = {
    modeKey: 'focus60',
    durationSeconds: STUDY_MODE_CONFIG.focus60.minutes * 60,
    remainingSeconds: STUDY_MODE_CONFIG.focus60.minutes * 60,
    timerId: null,
    running: false,
    isLiveStudying: false,
    liveOwner: '',
    latestMembers: [],
    serverStartedAt: null,
    dateKey: ''
};

const notificationStore = {
    invitations: [],
    sentInvitations: [],
    requestStatuses: [],
    activity: []
};

if (!currentUser) {
    window.location.href = '../login.html';
}

const views = {
    hub: document.getElementById('view-hub'),
    create: document.getElementById('view-create'),
    join: document.getElementById('view-join'),
    invite: document.getElementById('view-invite'),
    chat: document.getElementById('view-chat')
};

const ui = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileCloseBtn: document.getElementById('mobile-close-btn'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    hubBtn: document.getElementById('hub-btn'),
    mainAiBtn: document.getElementById('main-ai-btn'),
    navCreateBtn: document.getElementById('nav-create-btn'),
    navJoinBtn: document.getElementById('nav-join-btn'),
    refreshQuoteBtn: document.getElementById('refresh-quote-btn'),
    cancelCreateBtn: document.getElementById('cancel-create-btn'),
    cancelJoinBtn: document.getElementById('cancel-join-btn'),
    roomInfoBtn: document.getElementById('room-info-btn'),
    openManageBtn: document.getElementById('open-manage-btn'),
    micBtn: document.getElementById('mic-btn'),
    whiteboardBtn: document.getElementById('whiteboard-btn'),
    pollBtn: document.getElementById('poll-btn'),
    cancelInviteBtn: document.getElementById('cancel-invite-btn'),
    roomList: document.getElementById('room-list'),
    roomHeaderTitle: document.getElementById('room-header-title'),
    sendMsgBtn: document.getElementById('send-msg-btn'),
    chatInput: document.getElementById('chat-input'),
    chatMessages: document.getElementById('chat-view-messages'),
    sidebarUsername: document.getElementById('sidebar-username'),
    avatarInitials: document.getElementById('avatar-initials'),
    createName: document.getElementById('create-room-name'),
    createDesc: document.getElementById('create-room-desc'),
    joinCode: document.getElementById('join-room-code'),
    inviteUsername: document.getElementById('invite-username'),
    displayInviteCode: document.getElementById('display-invite-code'),
    copyInviteBtn: document.getElementById('copy-invite-btn'),
    refreshMembersBtn: document.getElementById('refresh-members-btn'),
    memberListPanel: document.getElementById('member-list-panel'),
    leaveRoomBtn: document.getElementById('leave-room-btn'),
    deleteRoomBtn: document.getElementById('delete-room-btn'),
    refreshRequestsBtn: document.getElementById('refresh-requests-btn'),
    joinRequestList: document.getElementById('join-request-list'),
    notificationBtn: document.getElementById('notification-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    notificationPanel: document.getElementById('notification-panel'),
    notificationList: document.getElementById('notification-list'),
    notificationRefreshBtn: document.getElementById('notification-refresh-btn'),
    hubQuoteText: document.getElementById('hub-quote-text'),
    hubQuoteMeta: document.getElementById('hub-quote-meta'),
    hubDayLabel: document.getElementById('hub-day-label'),
    hubTimeLabel: document.getElementById('hub-time-label'),
    roomDayLabel: document.getElementById('room-day-label'),
    roomTimeLabel: document.getElementById('room-time-label'),
    studyTabs: Array.from(document.querySelectorAll('.study-tab')),
    studyModeButtons: Array.from(document.querySelectorAll('.study-mode-btn')),
    studyRing: document.getElementById('study-ring'),
    studyTimeDisplay: document.getElementById('study-time-display'),
    studyModeLabel: document.getElementById('study-mode-label'),
    studyToggleBtn: document.getElementById('study-toggle-btn'),
    studyResetBtn: document.getElementById('study-reset-btn'),
    refreshStudyBtn: document.getElementById('refresh-study-btn'),
    studyMemberList: document.getElementById('study-member-list'),
    studyDateLabel: document.getElementById('studyboard-date-label'),
    studyboardLiveClock: document.getElementById('studyboard-live-clock')
};

function showView(viewName, options = {}) {
    if (!views[viewName]) {
        return;
    }

    Object.values(views).forEach((view) => {
        view.classList.add('room-hidden');
    });

    views[viewName].classList.remove('room-hidden');

    if (!options.skipPersist) {
        writeRoomNavigationState(viewName);
    }
}

function writeRoomNavigationState(viewName) {
    try {
        if (!views[viewName]) {
            return;
        }

        const payload = {
            username: currentUser || '',
            roomId: activeRoom || null,
            view: viewName,
            savedAtMs: Date.now()
        };

        localStorage.setItem(ROOM_NAV_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Ignore storage failures in restricted browser modes.
    }
}

function readRoomNavigationState() {
    try {
        const raw = localStorage.getItem(ROOM_NAV_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || parsed.username !== currentUser) {
            return null;
        }

        if (!parsed.view || !views[parsed.view]) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

function clearRoomNavigationState() {
    try {
        localStorage.removeItem(ROOM_NAV_STORAGE_KEY);
    } catch {
        // Ignore storage failures in restricted browser modes.
    }
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Username': currentUser
    };
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach((el) => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

function clearStatus() {
    [
        'hub-status',
        'invite-copy-status',
        'action-status',
        'chat-error',
        'room-action-note',
        'study-status'
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) {
            return;
        }

        el.textContent = '';
        if (el.classList.contains('form-error')) {
            el.style.display = 'none';
        }
    });
}

function showError(id, message) {
    const errorDiv = document.getElementById(id);
    if (!errorDiv) {
        return;
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function setStatus(id, message) {
    const statusDiv = document.getElementById(id);
    if (!statusDiv) {
        return;
    }

    if (!message) {
        statusDiv.textContent = '';
        if (statusDiv.classList.contains('form-error')) {
            statusDiv.style.display = 'none';
        }
        return;
    }

    statusDiv.textContent = message;
    if (statusDiv.classList.contains('form-error')) {
        statusDiv.style.display = 'block';
    }
}

function resetRoomContext() {
    stopPresenceHeartbeat(true);

    activeRoom = null;
    currentInviteCode = '';
    activeRoomAdmin = '';

    ui.roomHeaderTitle.textContent = '';
    ui.roomInfoBtn.style.display = 'none';
    ui.sendMsgBtn.disabled = true;

    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    if (studyStatsInterval) {
        clearInterval(studyStatsInterval);
        studyStatsInterval = null;
    }

    stopLocalStudyCountdown();

    studyState.modeKey = 'focus60';
    studyState.durationSeconds = STUDY_MODE_CONFIG.focus60.minutes * 60;
    studyState.remainingSeconds = STUDY_MODE_CONFIG.focus60.minutes * 60;
    studyState.isLiveStudying = false;
    studyState.liveOwner = '';
    studyState.latestMembers = [];
    studyState.serverStartedAt = null;
    studyState.dateKey = '';
    renderStudyTimerUI();
    renderStudyMembers([]);
}

function isCurrentUserAdmin() {
    return activeRoomAdmin === currentUser;
}

function getInitials(name) {
    return (name || '--').substring(0, 2).toUpperCase();
}

function formatMessageTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(timestamp) {
    if (!timestamp) {
        return 'just now';
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return 'just now';
    }

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) {
        return 'just now';
    }
    if (diffMins < 60) {
        return `${diffMins}m ago`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function getNetworkErrorMessage(error) {
    if (error && error.name === 'AbortError') {
        return 'Request timed out. Please retry.';
    }
    return 'Cannot reach room server. Ensure backend is running on 127.0.0.1:8000.';
}

function formatDayLabel(date = new Date()) {
    return date.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeLabel(date = new Date()) {
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function parseServerTimestamp(value) {
    if (!value || typeof value !== 'string') {
        return Number.NaN;
    }

    const normalized = value.replace(' ', 'T').trim();
    const hasTimezone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(normalized);

    // Backend may return naive timestamps; treat them as UTC to avoid false elapsed spikes.
    const candidate = hasTimezone ? normalized : `${normalized}Z`;
    return Date.parse(candidate);
}

function getWhiteboardBaseUrl() {
    const override = localStorage.getItem(WHITEBOARD_BASE_URL_STORAGE_KEY);
    if (override && override.trim()) {
        return override.trim().replace(/\/$/, '');
    }
    return WHITEBOARD_DEFAULT_BASE_URL;
}

function getWhiteboardRoomUrl(roomId) {
    return `${getWhiteboardBaseUrl()}/room/${encodeURIComponent(roomId)}`;
}

function openWhiteboardForActiveRoom() {
    if (!activeRoom) {
        setStatus('study-status', 'Open a room first, then launch whiteboard.');
        return;
    }

    const whiteboardUrl = getWhiteboardRoomUrl(activeRoom);
    const newWindow = window.open(whiteboardUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
        window.location.href = whiteboardUrl;
        return;
    }

    setStatus('study-status', `Opened whiteboard for room ${activeRoom}.`);
}

function updateClockWidgets() {
    const now = new Date();
    const dayText = formatDayLabel(now);
    const timeText = formatTimeLabel(now);

    if (ui.hubDayLabel) {
        ui.hubDayLabel.textContent = dayText;
    }
    if (ui.hubTimeLabel) {
        ui.hubTimeLabel.textContent = timeText;
    }
    if (ui.roomDayLabel) {
        ui.roomDayLabel.textContent = dayText;
    }
    if (ui.roomTimeLabel) {
        ui.roomTimeLabel.textContent = timeText;
    }
    if (ui.studyboardLiveClock) {
        ui.studyboardLiveClock.textContent = timeText;
    }
}

function startClockTicker() {
    updateClockWidgets();
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    clockInterval = setInterval(updateClockWidgets, 1000);
}

async function refreshHubQuote(showStatus = false) {
    const fallbackText = 'Small wins stack up faster than motivation spikes.';
    const fallbackMeta = `Updated ${formatTimeLabel(new Date())}`;

    try {
        const res = await fetchWithTimeout(`${API_BASE}/hub/quote`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to generate quote'));
        }

        const payload = await res.json();
        let quote = (payload.quote || '').trim();
        if (!quote) {
            quote = fallbackText;
        }

        lastHubQuote = quote;

        if (ui.hubQuoteText) {
            ui.hubQuoteText.textContent = quote;
        }
        if (ui.hubQuoteMeta) {
            ui.hubQuoteMeta.textContent = `Updated ${formatTimeLabel(new Date())}`;
        }

        if (showStatus) {
            setStatus('hub-status', 'Fresh quote loaded.');
        }
    } catch (error) {
        if (ui.hubQuoteText) {
            ui.hubQuoteText.textContent = fallbackText;
        }
        if (ui.hubQuoteMeta) {
            ui.hubQuoteMeta.textContent = fallbackMeta;
        }

        if (showStatus) {
            setStatus('hub-status', error.message || 'Could not refresh quote right now.');
        }
    }
}

async function pingRoomPresence(markOffline = false, keepalive = false) {
    if (!activeRoom) {
        return;
    }

    const endpoint = markOffline ? 'offline' : 'ping';

    try {
        await fetchWithTimeout(`${API_BASE}/${activeRoom}/presence/${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            keepalive
        });
    } catch {
        // Presence heartbeat is best-effort and should never block UI.
    }
}

function startPresenceHeartbeat() {
    if (!activeRoom) {
        return;
    }

    void pingRoomPresence(false);
    if (presenceInterval) {
        clearInterval(presenceInterval);
    }

    presenceInterval = setInterval(() => {
        void pingRoomPresence(false);
    }, PRESENCE_PING_MS);
}

function stopPresenceHeartbeat(sendOffline = true) {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }

    if (sendOffline && activeRoom) {
        void pingRoomPresence(true, true);
    }
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function readResponseBody(res) {
    const raw = await res.text();
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

async function getErrorMessage(res, fallback) {
    const payload = await readResponseBody(res);

    if (payload && typeof payload === 'object') {
        if (typeof payload.detail === 'string' && payload.detail.trim()) {
            return payload.detail;
        }
        if (typeof payload.message === 'string' && payload.message.trim()) {
            return payload.message;
        }
    }

    if (typeof payload === 'string' && payload.trim()) {
        return payload.trim();
    }

    return `${fallback} (HTTP ${res.status})`;
}

function createRoomIcon() {
    const wrapper = document.createElement('span');
    wrapper.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    return wrapper.firstChild;
}

function openMobileSidebar() {
    ui.sidebar.classList.add('active');
    ui.sidebarOverlay.classList.add('active');
    document.body.classList.add('sidebar-open');
}

function closeMobileSidebar() {
    ui.sidebar.classList.remove('active');
    ui.sidebarOverlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

function stopLocalStudyCountdown() {
    if (studyState.timerId) {
        clearInterval(studyState.timerId);
        studyState.timerId = null;
    }
    studyState.running = false;
}

function startLocalStudyCountdown() {
    if (studyState.timerId) {
        clearInterval(studyState.timerId);
    }
    studyState.running = true;
    studyState.timerId = setInterval(() => {
        runStudyCountdownTick();
    }, 1000);
}

function writeStudyTimerSnapshot() {
    if (!activeRoom) {
        return;
    }

    const snapshot = {
        roomId: activeRoom,
        modeKey: studyState.modeKey,
        durationSeconds: studyState.durationSeconds,
        remainingSeconds: studyState.remainingSeconds,
        running: studyState.running,
        isLiveStudying: studyState.isLiveStudying,
        updatedAtMs: Date.now()
    };

    localStorage.setItem(STUDY_TIMER_STORAGE_KEY, JSON.stringify(snapshot));
}

function clearStudyTimerSnapshot() {
    localStorage.removeItem(STUDY_TIMER_STORAGE_KEY);
}

function readStudyTimerSnapshot() {
    const raw = localStorage.getItem(STUDY_TIMER_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function restoreStudyTimerFromSnapshotForRoom(roomId, allowLiveSnapshot = true) {
    const snapshot = readStudyTimerSnapshot();
    if (!snapshot || snapshot.roomId !== roomId) {
        return false;
    }

    if (!allowLiveSnapshot && snapshot.isLiveStudying) {
        return false;
    }

    const modeKey = STUDY_MODE_CONFIG[snapshot.modeKey] ? snapshot.modeKey : 'focus60';
    const durationSeconds = Number(snapshot.durationSeconds) > 0
        ? Number(snapshot.durationSeconds)
        : STUDY_MODE_CONFIG[modeKey].minutes * 60;
    let remainingSeconds = Number(snapshot.remainingSeconds);
    if (!Number.isFinite(remainingSeconds) || remainingSeconds < 0) {
        remainingSeconds = durationSeconds;
    }

    if (snapshot.running) {
        const elapsedSinceSave = Math.max(
            0,
            Math.floor((Date.now() - Number(snapshot.updatedAtMs || Date.now())) / 1000)
        );
        remainingSeconds = Math.max(0, remainingSeconds - elapsedSinceSave);
    }

    studyState.modeKey = modeKey;
    studyState.durationSeconds = durationSeconds;
    studyState.remainingSeconds = remainingSeconds;
    studyState.isLiveStudying = Boolean(snapshot.isLiveStudying);

    if (snapshot.running && remainingSeconds > 0) {
        startLocalStudyCountdown();
    } else {
        stopLocalStudyCountdown();
    }

    renderStudyTimerUI();
    writeStudyTimerSnapshot();
    return true;
}

function formatClock(totalSeconds) {
    const safe = Math.max(0, Number(totalSeconds) || 0);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatStudyDuration(totalSeconds) {
    const safe = Math.max(0, Number(totalSeconds) || 0);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${seconds}s`;
}

function getActiveStudyModeConfig() {
    return STUDY_MODE_CONFIG[studyState.modeKey] || STUDY_MODE_CONFIG.focus60;
}

function updateStudyModeButtons() {
    ui.studyModeButtons.forEach((button) => {
        const isActive = button.dataset.modeKey === studyState.modeKey;
        button.classList.toggle('active', isActive);
    });
}

function renderStudyTimerUI() {
    const mode = getActiveStudyModeConfig();
    const progressRatio = studyState.durationSeconds > 0
        ? (studyState.durationSeconds - studyState.remainingSeconds) / studyState.durationSeconds
        : 0;
    const angle = Math.round(Math.min(1, Math.max(0, progressRatio)) * 360);

    if (ui.studyRing) {
        ui.studyRing.style.background = `conic-gradient(${mode.color} ${angle}deg, rgba(255, 255, 255, 0.08) ${angle}deg 360deg)`;
    }

    if (ui.studyTimeDisplay) {
        ui.studyTimeDisplay.textContent = formatClock(studyState.remainingSeconds);
    }

    if (ui.studyModeLabel) {
        ui.studyModeLabel.textContent = mode.label;
    }

    if (ui.studyToggleBtn) {
        ui.studyToggleBtn.textContent = studyState.running ? 'Pause' : 'Start';
    }

    updateStudyModeButtons();

    if (activeRoom) {
        writeStudyTimerSnapshot();
    }
}

function renderStudyMembers(members) {
    if (!ui.studyMemberList) {
        return;
    }

    if (ui.studyDateLabel) {
        const dateText = studyState.dateKey ? `Daily totals (${studyState.dateKey})` : 'Daily totals';
        const onlineCount = members.filter((member) => member.is_online).length;
        ui.studyDateLabel.textContent = `${dateText} • ${onlineCount} online • LIVE shown in real time.`;
    }

    ui.studyMemberList.innerHTML = '';

    if (!members.length) {
        ui.studyMemberList.innerHTML = '<div class="room-list-notice">No study activity yet.</div>';
        return;
    }

    members.forEach((member) => {
        const row = document.createElement('div');
        row.className = 'study-member-row';

        const meta = document.createElement('div');
        meta.className = 'study-member-meta';

        const avatar = document.createElement('div');
        avatar.className = 'member-avatar';
        avatar.textContent = getInitials(member.username);

        const name = document.createElement('div');
        name.className = 'study-member-name';
        name.textContent = member.username;

        if (member.username === currentUser) {
            name.textContent = `${member.username} (You)`;
        }

        meta.appendChild(avatar);
        meta.appendChild(name);

        const right = document.createElement('div');
        right.className = 'row-actions';

        const total = document.createElement('span');
        total.className = 'study-time-total';
        total.textContent = formatStudyDuration(member.total_seconds);

        const livePill = document.createElement('span');
        livePill.className = `study-live-pill ${member.is_live ? 'live' : 'offline'}`;
        livePill.textContent = member.is_live ? 'LIVE' : 'Idle';

        const onlinePill = document.createElement('span');
        onlinePill.className = `study-online-pill ${member.is_online ? 'online' : 'offline'}`;
        onlinePill.textContent = member.is_online ? 'Online' : 'Offline';

        right.appendChild(total);
        right.appendChild(onlinePill);
        right.appendChild(livePill);

        row.appendChild(meta);
        row.appendChild(right);
        ui.studyMemberList.appendChild(row);
    });
}

async function syncStudySessionFromMembers() {
    const selfStats = studyState.latestMembers.find((entry) => entry.username === currentUser);
    if (!selfStats || !selfStats.is_live) {
        const hadLiveSession = studyState.isLiveStudying;
        studyState.isLiveStudying = false;
        studyState.liveOwner = '';
        studyState.serverStartedAt = null;

        if (studyState.running) {
            stopLocalStudyCountdown();
            renderStudyTimerUI();
        }

        const restored = restoreStudyTimerFromSnapshotForRoom(activeRoom, false);
        if (!restored) {
            renderStudyTimerUI();
        }

        if (hadLiveSession) {
            setStatus('study-status', 'Your focus session is currently idle.');
        }
        return;
    }

    const modeKey = STUDY_MODE_CONFIG[selfStats.active_mode_key] ? selfStats.active_mode_key : 'focus60';
    const targetSeconds = Number(selfStats.active_target_seconds) > 0
        ? Number(selfStats.active_target_seconds)
        : STUDY_MODE_CONFIG[modeKey].minutes * 60;

    const startedAtMs = parseServerTimestamp(selfStats.started_at || '');
    const elapsed = Number.isNaN(startedAtMs)
        ? 0
        : Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
    const remaining = Math.max(0, targetSeconds - elapsed);

    const previousSignature = `${studyState.serverStartedAt || ''}|${studyState.modeKey}`;

    studyState.modeKey = modeKey;
    studyState.durationSeconds = targetSeconds;
    studyState.remainingSeconds = remaining;
    studyState.isLiveStudying = true;
    studyState.liveOwner = currentUser;
    studyState.serverStartedAt = selfStats.started_at || null;

    const currentSignature = `${studyState.serverStartedAt || ''}|${studyState.modeKey}`;

    if (remaining <= 0) {
        stopLocalStudyCountdown();
        await stopLiveStudySession('Your focus session completed.');
        await loadStudyStats(false);
        return;
    }

    if (!studyState.running || !studyState.timerId) {
        startLocalStudyCountdown();
    }

    if (previousSignature !== currentSignature) {
        setStatus('study-status', 'Your focus session is active.');
    }

    renderStudyTimerUI();
}

async function loadStudyStats(showErrors = true) {
    if (!activeRoom) {
        studyState.latestMembers = [];
        renderStudyMembers([]);
        return;
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/study/stats`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to load study stats'));
        }

        const data = await res.json();
        studyState.latestMembers = data.members || [];
        studyState.dateKey = data.date_key || '';
        await syncStudySessionFromMembers();
        renderStudyMembers(studyState.latestMembers);
    } catch (error) {
        if (showErrors) {
            setStatus('study-status', error.message || 'Failed to load study stats.');
        }
        renderStudyMembers([]);
    }
}

async function startLiveStudySession() {
    if (!activeRoom) {
        return false;
    }

    const mode = getActiveStudyModeConfig();

    const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/study/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            mode_key: studyState.modeKey,
            duration_seconds: studyState.durationSeconds
        })
    });

    if (!res.ok) {
        setStatus('study-status', await getErrorMessage(res, 'Failed to start study session'));
        return false;
    }

    const payload = await res.json();
    studyState.dateKey = payload.date_key || studyState.dateKey;
    studyState.isLiveStudying = true;
    studyState.liveOwner = currentUser;
    studyState.serverStartedAt = new Date().toISOString();
    studyState.remainingSeconds = studyState.durationSeconds;
    setStatus('study-status', `${mode.label} started.`);
    return true;
}

async function stopLiveStudySession(messageOverride = '') {
    if (!activeRoom) {
        return true;
    }

    const selfStats = studyState.latestMembers.find((entry) => entry.username === currentUser);
    const hasLiveSession = studyState.isLiveStudying || Boolean(selfStats && selfStats.is_live);
    if (!hasLiveSession) {
        return true;
    }

    const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/study/stop`, {
        method: 'POST',
        headers: getHeaders()
    });

    if (!res.ok) {
        setStatus('study-status', await getErrorMessage(res, 'Failed to stop study session'));
        return false;
    }

    studyState.isLiveStudying = false;
    studyState.liveOwner = '';
    studyState.serverStartedAt = null;

    const payload = await res.json();
    studyState.dateKey = payload.date_key || studyState.dateKey;
    if (messageOverride) {
        setStatus('study-status', messageOverride);
    } else {
        setStatus('study-status', payload.message || 'Study session stopped.');
    }

    return true;
}

async function setStudyMode(modeKey) {
    if (!STUDY_MODE_CONFIG[modeKey]) {
        return;
    }

    if (modeKey === studyState.modeKey) {
        return;
    }

    const selfStats = studyState.latestMembers.find((entry) => entry.username === currentUser);
    const hasLiveTimer = studyState.running || studyState.isLiveStudying || Boolean(selfStats && selfStats.is_live);

    if (hasLiveTimer) {
        const currentMode = getActiveStudyModeConfig();
        const nextMode = STUDY_MODE_CONFIG[modeKey];
        const confirmStop = window.confirm(
            `You are currently running ${currentMode.label}. Stop this timer and switch to ${nextMode.label}?`
        );

        if (!confirmStop) {
            return;
        }

        stopLocalStudyCountdown();
        await stopLiveStudySession('Timer stopped. Select your next session and press Start.');
        await loadStudyStats(false);

        studyState.modeKey = modeKey;
        studyState.durationSeconds = STUDY_MODE_CONFIG[modeKey].minutes * 60;
        studyState.remainingSeconds = 0;
        studyState.isLiveStudying = false;
        studyState.liveOwner = '';
        studyState.serverStartedAt = null;
        renderStudyTimerUI();
        return;
    }

    studyState.modeKey = modeKey;
    studyState.durationSeconds = STUDY_MODE_CONFIG[modeKey].minutes * 60;
    studyState.remainingSeconds = studyState.durationSeconds;
    studyState.liveOwner = '';
    studyState.serverStartedAt = null;
    renderStudyTimerUI();
}

function runStudyCountdownTick() {
    if (!studyState.running) {
        return;
    }

    studyState.remainingSeconds = Math.max(0, studyState.remainingSeconds - 1);
    renderStudyTimerUI();

    if (studyState.remainingSeconds > 0) {
        return;
    }

    stopLocalStudyCountdown();

    const mode = getActiveStudyModeConfig();
    stopLiveStudySession('Focus session completed. Great work.').then(() => {
        pushActivityNotification('Session complete', `${mode.label} ended successfully.`, 'success');
        loadStudyStats(false);
        renderStudyTimerUI();
    });
}

async function handleStudyToggle() {
    if (!activeRoom) {
        setStatus('study-status', 'Open a room first.');
        return;
    }

    if (studyState.running) {
        stopLocalStudyCountdown();
        await stopLiveStudySession('Your focus session paused.');
        await loadStudyStats(false);
        renderStudyTimerUI();
        return;
    }

    const started = await startLiveStudySession();
    if (!started) {
        return;
    }

    if (!Number.isFinite(studyState.remainingSeconds) || studyState.remainingSeconds <= 0) {
        studyState.remainingSeconds = studyState.durationSeconds;
    }

    startLocalStudyCountdown();
    renderStudyTimerUI();
}

async function handleStudyReset() {
    if (studyState.running) {
        stopLocalStudyCountdown();
    }

    await stopLiveStudySession('Your focus session reset.');
    await loadStudyStats(false);

    studyState.remainingSeconds = studyState.durationSeconds;
    studyState.liveOwner = '';
    studyState.serverStartedAt = null;
    renderStudyTimerUI();
}

function pushActivityNotification(title, body, tone = 'info') {
    notificationStore.activity.unshift({
        id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        body,
        tone,
        created_at: new Date().toISOString()
    });

    if (notificationStore.activity.length > MAX_ACTIVITY_NOTIFICATIONS) {
        notificationStore.activity = notificationStore.activity.slice(0, MAX_ACTIVITY_NOTIFICATIONS);
    }

    unreadActivityCount += 1;
    renderNotifications();
}

function setNotificationBadge(count) {
    if (!ui.notificationBadge) {
        return;
    }

    if (!count) {
        ui.notificationBadge.classList.add('room-hidden');
        ui.notificationBadge.textContent = '0';
        return;
    }

    ui.notificationBadge.textContent = String(count > 99 ? '99+' : count);
    ui.notificationBadge.classList.remove('room-hidden');
}

function getRoomNameFromCache(roomId, fallback = 'Room') {
    const room = roomCache.find((candidate) => candidate.id === roomId);
    if (!room) {
        return fallback;
    }
    return room.name;
}

function getJoinStatusLabel(status) {
    if (status === 'approved' || status === 'accepted') {
        return status === 'accepted' ? 'Accepted' : 'Approved';
    }
    if (status === 'rejected') {
        return 'Rejected';
    }
    return 'Pending';
}

function getJoinStatusText(status) {
    if (status === 'approved') {
        return 'Request accepted. You can open the room now.';
    }
    if (status === 'rejected') {
        return 'Request was rejected by room admin.';
    }
    return 'Waiting for admin approval.';
}

function getJoinStatusClass(status) {
    if (status === 'approved' || status === 'accepted') {
        return 'status-approved';
    }
    if (status === 'rejected') {
        return 'status-rejected';
    }
    return 'status-pending';
}

function getActivityToneClass(tone) {
    if (tone === 'success') {
        return 'status-approved';
    }
    if (tone === 'danger') {
        return 'status-rejected';
    }
    return 'status-pending';
}

function buildNotificationEntries() {
    const invitationEntries = notificationStore.invitations.map((invitation) => ({
        type: 'invitation',
        createdAt: invitation.created_at,
        payload: invitation
    }));

    const sentInvitationEntries = notificationStore.sentInvitations.map((invitation) => ({
        type: 'sent-invite',
        createdAt: invitation.responded_at || invitation.created_at,
        payload: invitation
    }));

    const requestEntries = notificationStore.requestStatuses.map((request) => ({
        type: 'join-request',
        createdAt: request.reviewed_at || request.created_at,
        payload: request
    }));

    const activityEntries = notificationStore.activity.map((activity) => ({
        type: 'activity',
        createdAt: activity.created_at,
        payload: activity
    }));

    return invitationEntries
        .concat(sentInvitationEntries)
        .concat(requestEntries)
        .concat(activityEntries)
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        .slice(0, 40);
}

function renderNotifications() {
    if (!ui.notificationList) {
        return;
    }

    ui.notificationList.innerHTML = '';

    const entries = buildNotificationEntries();
    if (!entries.length) {
        ui.notificationList.innerHTML = '<div class="notification-empty">No updates right now.</div>';
        setNotificationBadge(0);
        return;
    }

    entries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'notification-item';

        const top = document.createElement('div');
        top.className = 'notification-top';

        const title = document.createElement('h4');
        title.className = 'notification-title';

        const meta = document.createElement('span');
        meta.className = 'notification-time';
        meta.textContent = formatRelativeTime(entry.createdAt);

        const body = document.createElement('p');
        body.className = 'notification-body';

        const actions = document.createElement('div');
        actions.className = 'notification-actions';

        if (entry.type === 'invitation') {
            const invitation = entry.payload;
            title.textContent = `Invitation: ${invitation.room_name}`;
            body.textContent = `Invited by ${invitation.inviter_username}. Accept to join now.`;

            const acceptBtn = document.createElement('button');
            acceptBtn.type = 'button';
            acceptBtn.className = 'mini-action-btn accept';
            acceptBtn.textContent = 'Accept';
            acceptBtn.addEventListener('click', () => {
                acceptInvitation(invitation.id);
            });

            const rejectBtn = document.createElement('button');
            rejectBtn.type = 'button';
            rejectBtn.className = 'mini-action-btn reject';
            rejectBtn.textContent = 'Reject';
            rejectBtn.addEventListener('click', () => {
                rejectInvitation(invitation.id);
            });

            actions.appendChild(acceptBtn);
            actions.appendChild(rejectBtn);
        } else if (entry.type === 'join-request') {
            const request = entry.payload;
            const roomName = request.room_name || getRoomNameFromCache(request.room_id, 'Room');
            title.textContent = `Request: ${roomName}`;
            body.textContent = getJoinStatusText(request.status);

            const statusPill = document.createElement('span');
            statusPill.className = `notification-status-pill ${getJoinStatusClass(request.status)}`;
            statusPill.textContent = getJoinStatusLabel(request.status);
            actions.appendChild(statusPill);

            if (request.status === 'approved') {
                const room = roomCache.find((candidate) => candidate.id === request.room_id);
                if (room) {
                    const openBtn = document.createElement('button');
                    openBtn.type = 'button';
                    openBtn.className = 'mini-action-btn';
                    openBtn.textContent = 'Open Room';
                    openBtn.addEventListener('click', () => {
                        closeNotifications();
                        selectRoom(room);
                    });
                    actions.appendChild(openBtn);
                }
            }
        } else if (entry.type === 'sent-invite') {
            const sentInvite = entry.payload;
            title.textContent = `Invite sent: ${sentInvite.room_name || 'Room'}`;

            if (sentInvite.status === 'accepted') {
                body.textContent = `${sentInvite.target_username} accepted your invitation.`;
            } else if (sentInvite.status === 'rejected') {
                body.textContent = `${sentInvite.target_username} rejected your invitation.`;
            } else {
                body.textContent = `Waiting for ${sentInvite.target_username} to respond.`;
            }

            const statusPill = document.createElement('span');
            statusPill.className = `notification-status-pill ${getJoinStatusClass(sentInvite.status)}`;
            statusPill.textContent = getJoinStatusLabel(sentInvite.status);
            actions.appendChild(statusPill);
        } else {
            const activity = entry.payload;
            title.textContent = activity.title;
            body.textContent = activity.body;

            const statusPill = document.createElement('span');
            statusPill.className = `notification-status-pill ${getActivityToneClass(activity.tone)}`;
            statusPill.textContent = 'Update';
            actions.appendChild(statusPill);
        }

        top.appendChild(title);
        top.appendChild(meta);

        item.appendChild(top);
        item.appendChild(body);
        item.appendChild(actions);
        ui.notificationList.appendChild(item);
    });

    const invitationCount = notificationStore.invitations.length;
    const pendingRequestCount = notificationStore.requestStatuses.filter((request) => request.status === 'pending').length;
    const pendingSentInviteCount = notificationStore.sentInvitations.filter((invite) => invite.status === 'pending').length;
    setNotificationBadge(invitationCount + pendingRequestCount + pendingSentInviteCount + unreadActivityCount);
}

function closeNotifications() {
    if (!ui.notificationPanel) {
        return;
    }
    ui.notificationPanel.classList.add('room-hidden');
    ui.notificationBtn.classList.remove('active');
}

async function toggleNotifications() {
    if (!ui.notificationPanel) {
        return;
    }

    const hidden = ui.notificationPanel.classList.contains('room-hidden');
    if (!hidden) {
        closeNotifications();
        return;
    }

    ui.notificationPanel.classList.remove('room-hidden');
    ui.notificationBtn.classList.add('active');
    unreadActivityCount = 0;
    renderNotifications();
    await refreshNotifications(true);
}

function renderRoomList(rooms) {
    ui.roomList.innerHTML = '';

    if (!rooms.length) {
        ui.roomList.innerHTML = '<div class="room-list-notice">No rooms yet</div>';
        return;
    }

    rooms.forEach((room) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `history-item room-list-item ${activeRoom === room.id ? 'active' : ''}`;
        item.appendChild(createRoomIcon());

        const title = document.createElement('span');
        title.className = 'history-title';
        title.textContent = room.name;
        item.appendChild(title);

        if (room.admin_username === currentUser) {
            const ownerTag = document.createElement('span');
            ownerTag.className = 'member-tag';
            ownerTag.textContent = 'Owner';
            item.appendChild(ownerTag);
        }

        item.addEventListener('click', () => {
            selectRoom(room);
        });

        ui.roomList.appendChild(item);
    });
}

function renderJoinRequests(requests) {
    ui.joinRequestList.innerHTML = '';

    if (!isCurrentUserAdmin()) {
        ui.joinRequestList.innerHTML = '<div class="room-list-notice">Only admin can review join requests</div>';
        return;
    }

    if (!requests.length) {
        ui.joinRequestList.innerHTML = '<div class="room-list-notice">No pending requests</div>';
        return;
    }

    requests.forEach((request) => {
        const row = document.createElement('div');
        row.className = 'request-row';

        const main = document.createElement('div');
        main.className = 'request-main';

        const username = document.createElement('div');
        username.className = 'request-user';
        username.textContent = request.requester_username;

        const meta = document.createElement('div');
        meta.className = 'request-meta';
        meta.textContent = `Wants to join ${request.room_name}`;

        main.appendChild(username);
        main.appendChild(meta);

        const actions = document.createElement('div');
        actions.className = 'row-actions';

        const approveBtn = document.createElement('button');
        approveBtn.type = 'button';
        approveBtn.className = 'mini-action-btn accept';
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', () => {
            approveJoinRequest(request.id, request.requester_username);
        });

        const rejectBtn = document.createElement('button');
        rejectBtn.type = 'button';
        rejectBtn.className = 'mini-action-btn reject';
        rejectBtn.textContent = 'Reject';
        rejectBtn.addEventListener('click', () => {
            rejectJoinRequest(request.id, request.requester_username);
        });

        actions.appendChild(approveBtn);
        actions.appendChild(rejectBtn);

        row.appendChild(main);
        row.appendChild(actions);
        ui.joinRequestList.appendChild(row);
    });
}

function renderMembers(members) {
    ui.memberListPanel.innerHTML = '';

    if (!members.length) {
        ui.memberListPanel.innerHTML = '<div class="room-list-notice">No members found</div>';
        return;
    }

    const isAdmin = isCurrentUserAdmin();

    members.forEach((member) => {
        const row = document.createElement('div');
        row.className = 'member-row';

        const meta = document.createElement('div');
        meta.className = 'member-meta';

        const avatar = document.createElement('div');
        avatar.className = 'member-avatar';
        avatar.textContent = getInitials(member.username);

        const details = document.createElement('div');
        const nameRow = document.createElement('div');
        nameRow.className = 'member-name-row';

        const name = document.createElement('span');
        name.className = 'member-name';
        name.textContent = member.username;
        nameRow.appendChild(name);

        if (member.username === currentUser) {
            const youTag = document.createElement('span');
            youTag.className = 'member-tag';
            youTag.textContent = 'You';
            nameRow.appendChild(youTag);
        }

        const role = document.createElement('span');
        role.className = `role-pill ${member.role}`;
        role.textContent = member.role;
        nameRow.appendChild(role);

        details.appendChild(nameRow);
        meta.appendChild(avatar);
        meta.appendChild(details);
        row.appendChild(meta);

        if (isAdmin && member.username !== currentUser) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-member-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => {
                removeMember(member.username);
            });
            row.appendChild(removeBtn);
        }

        ui.memberListPanel.appendChild(row);
    });

    ui.deleteRoomBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    ui.leaveRoomBtn.style.display = isAdmin ? 'none' : 'inline-flex';
    setStatus('room-action-note', isAdmin ? 'Admin cannot leave room. Use Delete Room.' : 'You can leave this room anytime.');
}

function renderMessages(messages) {
    ui.chatMessages.innerHTML = '';

    if (!messages.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-room-message';
        empty.textContent = 'Room is quiet. Start the first message.';
        ui.chatMessages.appendChild(empty);
        return;
    }

    messages.forEach((message) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'msg-wrapper';

        const header = document.createElement('div');
        header.className = 'msg-header';

        const sender = document.createElement('span');
        sender.className = 'sender';
        sender.textContent = message.sender_username;

        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = formatMessageTime(message.sent_at);

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.textContent = message.content;

        header.appendChild(sender);
        header.appendChild(time);
        wrapper.appendChild(header);
        wrapper.appendChild(bubble);

        ui.chatMessages.appendChild(wrapper);
    });

    ui.chatMessages.scrollTop = ui.chatMessages.scrollHeight;
}

async function fetchMyRooms() {
    try {
        const res = await fetchWithTimeout(`${API_BASE}/my-rooms`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to load rooms'));
        }

        const data = await res.json();
        roomCache = data.rooms || [];
        renderRoomList(roomCache);

        if (activeRoom && !roomCache.some((room) => room.id === activeRoom)) {
            resetRoomContext();
            showView('hub');
            setStatus('hub-status', 'Current room is no longer available.');
        }
    } catch (error) {
        ui.roomList.innerHTML = '<div class="room-list-notice">Room service unavailable</div>';
        console.error(error);
    }
}

async function fetchPendingInvitations(showErrors = true) {
    try {
        const res = await fetchWithTimeout(`${API_BASE}/invitations/me`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to load invitations'));
        }

        const data = await res.json();
        return data.invitations || [];
    } catch (error) {
        if (showErrors) {
            showError('notification-error', error.message || 'Failed to load invitations');
        }
        return [];
    }
}

async function fetchSentInvitations(showErrors = true) {
    try {
        const res = await fetchWithTimeout(`${API_BASE}/invitations/sent/me`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to load sent invitations'));
        }

        const data = await res.json();
        return data.invitations || [];
    } catch (error) {
        if (showErrors) {
            showError('notification-error', error.message || 'Failed to load sent invitations');
        }
        return [];
    }
}

async function fetchMyJoinRequestStatuses(showErrors = true) {
    try {
        const res = await fetchWithTimeout(`${API_BASE}/join-requests/me`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to load request statuses'));
        }

        const data = await res.json();
        return data.requests || [];
    } catch (error) {
        if (showErrors) {
            showError('notification-error', error.message || 'Failed to load request statuses');
        }
        return [];
    }
}

async function refreshNotifications(showErrors = true) {
    if (showErrors) {
        clearErrors();
    }

    const [invitations, sentInvitations, requestStatuses] = await Promise.all([
        fetchPendingInvitations(showErrors),
        fetchSentInvitations(showErrors),
        fetchMyJoinRequestStatuses(showErrors)
    ]);

    notificationStore.invitations = invitations;
    notificationStore.sentInvitations = sentInvitations;
    notificationStore.requestStatuses = requestStatuses;
    renderNotifications();
}

async function loadMembers(showErrors = true) {
    if (!activeRoom) {
        renderMembers([]);
        return;
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/members`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to load members'));
        }

        const data = await res.json();
        const members = data.members || [];

        const admin = members.find((member) => member.role === 'admin');
        activeRoomAdmin = admin ? admin.username : activeRoomAdmin;
        renderMembers(members);
    } catch (error) {
        renderMembers([]);
        if (showErrors) {
            showError('manage-error', error.message || 'Failed to load members');
        }
    }
}

async function loadJoinRequests(showErrors = true) {
    if (!activeRoom) {
        renderJoinRequests([]);
        return;
    }

    if (!isCurrentUserAdmin()) {
        renderJoinRequests([]);
        return;
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/join-requests`, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(await getErrorMessage(res, 'Failed to load join requests'));
        }

        const data = await res.json();
        renderJoinRequests(data.requests || []);
    } catch (error) {
        renderJoinRequests([]);
        if (showErrors) {
            showError('request-error', error.message || 'Failed to load join requests');
        }
    }
}

async function loadMessages() {
    if (!activeRoom) {
        return;
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/messages`, { headers: getHeaders() });
        if (!res.ok) {
            const message = await getErrorMessage(res, 'Failed to load messages');
            if (res.status === 403 || res.status === 404) {
                resetRoomContext();
                await Promise.all([fetchMyRooms(), refreshNotifications(false), refreshHubQuote(false)]);
                showView('hub');
                setStatus('hub-status', message);
                return;
            }
            setStatus('chat-error', message);
            return;
        }

        const data = await res.json();
        renderMessages(data.messages || []);
    } catch (error) {
        setStatus('chat-error', getNetworkErrorMessage(error));
    }
}

async function selectRoom(room) {
    if (activeRoom && activeRoom !== room.id) {
        stopPresenceHeartbeat(true);
    }

    stopLocalStudyCountdown();
    studyState.isLiveStudying = false;
    studyState.liveOwner = '';
    studyState.serverStartedAt = null;

    activeRoom = room.id;
    currentInviteCode = room.invite_code;
    activeRoomAdmin = room.admin_username || '';

    ui.roomHeaderTitle.textContent = room.name;
    ui.roomInfoBtn.style.display = 'inline-flex';
    ui.sendMsgBtn.disabled = false;
    ui.displayInviteCode.textContent = currentInviteCode || '---';

    clearErrors();
    clearStatus();
    closeNotifications();
    if (!restoreStudyTimerFromSnapshotForRoom(activeRoom)) {
        renderStudyTimerUI();
    }

    startPresenceHeartbeat();

    showView('chat');
    closeMobileSidebar();

    await Promise.all([
        fetchMyRooms(),
        refreshNotifications(false),
        loadMessages(),
        loadMembers(false),
        loadJoinRequests(false),
        loadStudyStats(false)
    ]);

    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(loadMessages, 3000);

    if (studyStatsInterval) {
        clearInterval(studyStatsInterval);
    }
    studyStatsInterval = setInterval(() => {
        loadStudyStats(false);
    }, STUDY_STATS_POLL_MS);
}

async function restoreNavigationAfterBootstrap() {
    const state = readRoomNavigationState();
    if (!state) {
        return false;
    }

    const targetView = state.view;
    if (!state.roomId) {
        if (targetView === 'chat' || targetView === 'invite') {
            showView('hub', { skipPersist: true });
            return true;
        }

        showView(targetView, { skipPersist: true });
        return true;
    }

    const room = roomCache.find((candidate) => candidate.id === state.roomId);
    if (!room) {
        clearRoomNavigationState();
        return false;
    }

    await selectRoom(room);
    if (targetView === 'invite') {
        await openManageView();
    }

    return true;
}

async function openManageView() {
    if (!activeRoom) {
        return;
    }

    clearErrors();
    clearStatus();
    ui.displayInviteCode.textContent = currentInviteCode || '---';
    closeNotifications();
    showView('invite');
    await Promise.all([loadMembers(), loadJoinRequests()]);
}

async function copyInviteCode() {
    if (!currentInviteCode) {
        setStatus('invite-copy-status', 'No invite code available.');
        return;
    }

    try {
        await navigator.clipboard.writeText(currentInviteCode);
        setStatus('invite-copy-status', 'Invite code copied.');
    } catch {
        setStatus('invite-copy-status', 'Copy failed. Please copy manually.');
    }
}

async function acceptInvitation(invitationId) {
    clearErrors();
    try {
        const res = await fetchWithTimeout(`${API_BASE}/invitations/${invitationId}/accept`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!res.ok) {
            showError('notification-error', await getErrorMessage(res, 'Failed to accept invitation'));
            return;
        }

        const data = await res.json();
        setStatus('hub-status', data.message || 'Invitation accepted.');
        await Promise.all([fetchMyRooms(), refreshNotifications(false)]);
    } catch (error) {
        showError('notification-error', getNetworkErrorMessage(error));
    }
}

async function rejectInvitation(invitationId) {
    clearErrors();
    try {
        const res = await fetchWithTimeout(`${API_BASE}/invitations/${invitationId}/reject`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!res.ok) {
            showError('notification-error', await getErrorMessage(res, 'Failed to reject invitation'));
            return;
        }

        await refreshNotifications(false);
    } catch (error) {
        showError('notification-error', getNetworkErrorMessage(error));
    }
}

async function approveJoinRequest(requestId, username) {
    if (!activeRoom) {
        return;
    }

    clearErrors();
    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/join-requests/${requestId}/approve`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!res.ok) {
            showError('request-error', await getErrorMessage(res, 'Failed to approve request'));
            return;
        }

        setStatus('action-status', `${username} approved.`);
        await Promise.all([loadJoinRequests(false), loadMembers(false), loadStudyStats(false), fetchMyRooms(), refreshNotifications(false)]);
    } catch (error) {
        showError('request-error', getNetworkErrorMessage(error));
    }
}

async function rejectJoinRequest(requestId, username) {
    if (!activeRoom) {
        return;
    }

    clearErrors();
    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/join-requests/${requestId}/reject`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!res.ok) {
            showError('request-error', await getErrorMessage(res, 'Failed to reject request'));
            return;
        }

        setStatus('action-status', `${username} request rejected.`);
        await Promise.all([loadJoinRequests(false), refreshNotifications(false)]);
    } catch (error) {
        showError('request-error', getNetworkErrorMessage(error));
    }
}

async function removeMember(targetUsername) {
    if (!activeRoom || !targetUsername) {
        return;
    }

    if (!window.confirm(`Remove ${targetUsername} from this room?`)) {
        return;
    }

    clearErrors();
    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/remove-member`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ target_username: targetUsername })
        });

        if (!res.ok) {
            showError('manage-error', await getErrorMessage(res, 'Failed to remove member'));
            return;
        }

        setStatus('action-status', `${targetUsername} removed from room.`);
        pushActivityNotification(
            'Member removed',
            `${targetUsername} was removed from the room.`,
            'danger'
        );
        await Promise.all([loadMembers(false), loadStudyStats(false), fetchMyRooms(), refreshNotifications(false)]);
    } catch (error) {
        showError('manage-error', getNetworkErrorMessage(error));
    }
}

async function leaveRoom() {
    if (!activeRoom) {
        return;
    }

    if (isCurrentUserAdmin()) {
        showError('manage-error', 'Admin cannot leave room. Delete room instead.');
        return;
    }

    if (!window.confirm('Leave this room now?')) {
        return;
    }

    if (studyState.running) {
        stopLocalStudyCountdown();
    }

    clearErrors();
    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/leave`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!res.ok) {
            showError('manage-error', await getErrorMessage(res, 'Failed to leave room'));
            return;
        }

        const data = await res.json();
        clearStudyTimerSnapshot();
        resetRoomContext();
        await Promise.all([fetchMyRooms(), refreshNotifications(false), refreshHubQuote(false)]);
        showView('hub');
        setStatus('hub-status', data.message || 'You left the room.');
    } catch (error) {
        showError('manage-error', getNetworkErrorMessage(error));
    }
}

async function deleteRoom() {
    if (!activeRoom) {
        return;
    }

    if (!isCurrentUserAdmin()) {
        showError('manage-error', 'Only admin can delete this room.');
        return;
    }

    if (!window.confirm('Delete this room for everyone? This action cannot be undone.')) {
        return;
    }

    if (studyState.running) {
        stopLocalStudyCountdown();
    }

    clearErrors();
    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!res.ok) {
            showError('manage-error', await getErrorMessage(res, 'Failed to delete room'));
            return;
        }

        clearStudyTimerSnapshot();
        resetRoomContext();
        await Promise.all([fetchMyRooms(), refreshNotifications(false), refreshHubQuote(false)]);
        showView('hub');
        setStatus('hub-status', 'Room deleted successfully.');
    } catch (error) {
        showError('manage-error', getNetworkErrorMessage(error));
    }
}

ui.sidebarUsername.textContent = currentUser;
ui.avatarInitials.textContent = getInitials(currentUser);

ui.mainAiBtn.addEventListener('click', () => {
    stopPresenceHeartbeat(true);
    window.location.href = '../index.html';
});

ui.hubBtn.addEventListener('click', async () => {
    resetRoomContext();
    clearErrors();
    clearStatus();
    closeNotifications();
    showView('hub');
    await Promise.all([fetchMyRooms(), refreshNotifications(false), refreshHubQuote(false)]);
});

ui.navCreateBtn.addEventListener('click', () => {
    clearErrors();
    clearStatus();
    showView('create');
});

ui.navJoinBtn.addEventListener('click', () => {
    clearErrors();
    clearStatus();
    showView('join');
});

if (ui.refreshQuoteBtn) {
    ui.refreshQuoteBtn.addEventListener('click', async () => {
        await refreshHubQuote(true);
    });
}

ui.cancelCreateBtn.addEventListener('click', async () => {
    showView('hub');
    await refreshHubQuote(false);
});
ui.cancelJoinBtn.addEventListener('click', async () => {
    showView('hub');
    await refreshHubQuote(false);
});
ui.cancelInviteBtn.addEventListener('click', () => showView('chat'));

ui.roomInfoBtn.addEventListener('click', openManageView);
ui.openManageBtn.addEventListener('click', openManageView);
ui.copyInviteBtn.addEventListener('click', copyInviteCode);
ui.refreshMembersBtn.addEventListener('click', () => loadMembers());
ui.refreshRequestsBtn.addEventListener('click', () => loadJoinRequests());
ui.leaveRoomBtn.addEventListener('click', leaveRoom);
ui.deleteRoomBtn.addEventListener('click', deleteRoom);

if (ui.micBtn) {
    ui.micBtn.addEventListener('click', () => {
        setStatus('study-status', 'Mic controls UI added. Voice function will be integrated next.');
    });
}

if (ui.whiteboardBtn) {
    ui.whiteboardBtn.addEventListener('click', () => {
        openWhiteboardForActiveRoom();
    });
}

if (ui.pollBtn) {
    ui.pollBtn.addEventListener('click', () => {
        setStatus('study-status', 'Polls button is ready. Poll logic can be connected next.');
    });
}

ui.studyModeButtons.forEach((button) => {
    button.addEventListener('click', async () => {
        const modeKey = button.dataset.modeKey;
        await setStudyMode(modeKey);
    });
});

if (ui.studyToggleBtn) {
    ui.studyToggleBtn.addEventListener('click', async () => {
        await handleStudyToggle();
    });
}

if (ui.studyResetBtn) {
    ui.studyResetBtn.addEventListener('click', async () => {
        await handleStudyReset();
    });
}

if (ui.refreshStudyBtn) {
    ui.refreshStudyBtn.addEventListener('click', async () => {
        await loadStudyStats(true);
    });
}

if (ui.notificationBtn) {
    ui.notificationBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await toggleNotifications();
    });
}

if (ui.notificationRefreshBtn) {
    ui.notificationRefreshBtn.addEventListener('click', async () => {
        await refreshNotifications(true);
    });
}

document.addEventListener('click', (event) => {
    const target = event.target;
    if (!ui.notificationPanel || !ui.notificationBtn) {
        return;
    }

    if (ui.notificationPanel.contains(target) || ui.notificationBtn.contains(target)) {
        return;
    }

    closeNotifications();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeNotifications();
    }
});

document.getElementById('submit-create-btn').addEventListener('click', async () => {
    clearErrors();
    clearStatus();

    const name = ui.createName.value.trim();
    const description = ui.createDesc.value.trim();
    if (!name) {
        showError('create-error', 'Room name is required.');
        return;
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE}/create`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, description })
        });

        if (!res.ok) {
            showError('create-error', await getErrorMessage(res, 'Failed to create room'));
            return;
        }

        const room = await res.json();
        ui.createName.value = '';
        ui.createDesc.value = '';
        await selectRoom(room);
    } catch (error) {
        showError('create-error', getNetworkErrorMessage(error));
    }
});

document.getElementById('submit-join-btn').addEventListener('click', async () => {
    clearErrors();
    clearStatus();

    const inviteCode = ui.joinCode.value.trim();
    if (!inviteCode) {
        showError('join-error', 'Invite code is required.');
        return;
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE}/join`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ invite_code: inviteCode })
        });

        if (!res.ok) {
            showError('join-error', await getErrorMessage(res, 'Failed to request join'));
            return;
        }

        const data = await res.json();
        ui.joinCode.value = '';
        showView('hub');
        setStatus('hub-status', data.message || 'Join request sent.');
        await Promise.all([fetchMyRooms(), refreshNotifications(false), refreshHubQuote(false)]);
    } catch (error) {
        showError('join-error', getNetworkErrorMessage(error));
    }
});

document.getElementById('submit-invite-btn').addEventListener('click', async () => {
    clearErrors();
    clearStatus();

    if (!activeRoom) {
        showError('invite-error', 'Open a room first.');
        return;
    }

    const target = ui.inviteUsername.value.trim();
    if (!target) {
        showError('invite-error', 'Username is required.');
        return;
    }

    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/invite`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ target_username: target })
        });

        if (!res.ok) {
            showError('invite-error', await getErrorMessage(res, 'Could not send invitation'));
            return;
        }

        const data = await res.json();
        ui.inviteUsername.value = '';
        setStatus('action-status', data.message || 'Invitation sent.');
        pushActivityNotification(
            'Invitation sent',
            `Invitation sent to ${target}. Waiting for acceptance.`,
            'success'
        );
        await refreshNotifications(false);
    } catch (error) {
        showError('invite-error', getNetworkErrorMessage(error));
    }
});

ui.sendMsgBtn.addEventListener('click', async () => {
    const text = ui.chatInput.value.trim();
    if (!text || !activeRoom) {
        return;
    }

    setStatus('chat-error', '');
    ui.chatInput.value = '';

    try {
        const res = await fetchWithTimeout(`${API_BASE}/${activeRoom}/messages`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content: text })
        });

        if (!res.ok) {
            setStatus('chat-error', await getErrorMessage(res, 'Failed to send message'));
            return;
        }

        await loadMessages();
    } catch (error) {
        setStatus('chat-error', getNetworkErrorMessage(error));
    }
});

ui.chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        ui.sendMsgBtn.click();
    }
});

ui.sidebarToggle.addEventListener('click', () => {
    ui.sidebar.classList.toggle('collapsed');
});

if (ui.mobileMenuBtn) {
    ui.mobileMenuBtn.addEventListener('click', openMobileSidebar);
}

if (ui.mobileCloseBtn) {
    ui.mobileCloseBtn.addEventListener('click', closeMobileSidebar);
}

if (ui.sidebarOverlay) {
    ui.sidebarOverlay.addEventListener('click', closeMobileSidebar);
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeMobileSidebar();
    }
});

window.onload = async () => {
    startClockTicker();
    closeNotifications();
    renderStudyTimerUI();
    renderStudyMembers([]);

    await Promise.all([fetchMyRooms(), refreshNotifications(false), refreshHubQuote(false)]);

    const restored = await restoreNavigationAfterBootstrap();
    if (!restored) {
        showView('hub', { skipPersist: true });
    }

    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    notificationInterval = setInterval(() => {
        refreshNotifications(false);
    }, NOTIFICATION_POLL_MS);
};

window.addEventListener('beforeunload', () => {
    if (!activeRoom) {
        return;
    }

    fetch(`${API_BASE}/${activeRoom}/presence/offline`, {
        method: 'POST',
        headers: getHeaders(),
        keepalive: true
    }).catch(() => {
        // no-op: page is unloading
    });
});