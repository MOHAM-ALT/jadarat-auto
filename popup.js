class JadaratAutoPopup {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTab = null;
        this.isConnected = false;

        this.stats = {
            applied: 0,
            skipped: 0,
            rejected: 0,
            total: 0
        };

        this.initializeElements();
        this.bindEvents();
        this.initializeConnection();
    }

    initializeElements() {
        // Control buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.closeBtn = document.getElementById('closeBtn');

        // Settings
        this.delayRange = document.getElementById('delayRange');
        this.delayValue = document.getElementById('delayValue');
        this.modeSelect = document.getElementById('modeSelect');
        this.soundToggle = document.getElementById('soundToggle');

        // Stats
        this.appliedCount = document.getElementById('appliedCount');
        this.skippedCount = document.getElementById('skippedCount');
        this.rejectedCount = document.getElementById('rejectedCount');
        this.totalCount = document.getElementById('totalCount');

        // Progress
        this.progressFill = document.getElementById('progressFill');
        this.progressPercentage = document.getElementById('progressPercentage');
        this.progressText = document.getElementById('progressText');
        this.currentJob = document.getElementById('currentJob');

        // Connection Status
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.connectionDetails = document.getElementById('connectionDetails');
        this.footerStatusIndicator = document.getElementById('footerStatusIndicator');
        this.footerStatusText = document.getElementById('footerStatusText');

        // Rejection Data
        this.exportBtn = document.getElementById('exportBtn');
        this.clearRejectionBtn = document.getElementById('clearRejectionBtn');
        this.clearRejectedJobsBtn = document.getElementById('clearRejectedJobsBtn');
        this.rejectionInfo = document.getElementById('rejectionInfo');


        // Visited Jobs
        this.clearVisitedJobsBtn = document.getElementById('clearVisitedJobsBtn');
        this.clearAllJobDataBtn = document.getElementById('clearAllJobDataBtn');
        this.visitedJobsInfo = document.getElementById('visitedJobsInfo');

        // Diagnostics
        this.debugSection = document.getElementById('debugSection');
        this.debugPageType = document.getElementById('debugPageType');
        this.debugCurrentUrl = document.getElementById('debugCurrentUrl');
        this.debugLastError = document.getElementById('debugLastError');
        this.debugReconnectBtn = document.getElementById('debugReconnectBtn');
        this.debugReloadBtn = document.getElementById('debugReloadBtn');

        // Modals
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorRetryBtn = document.getElementById('errorRetryBtn');
        this.errorCloseBtn = document.getElementById('errorCloseBtn');

        // Additional buttons
        this.helpBtn = document.getElementById('helpBtn');
        this.aboutBtn = document.getElementById('aboutBtn');
    }

    bindEvents() {
        this.startBtn?.addEventListener('click', () => this.startAutomation());
        this.pauseBtn?.addEventListener('click', () => this.pauseAutomation());
        this.stopBtn?.addEventListener('click', () => this.stopAutomation());
        this.resumeBtn?.addEventListener('click', () => this.resumeAutomation());
        this.restartBtn?.addEventListener('click', () => this.restartAutomation());
        this.closeBtn?.addEventListener('click', () => window.close());

        this.delayRange?.addEventListener('input', (e) => {
            this.delayValue.textContent = e.target.value;
            this.saveSettings();
        });

        this.modeSelect?.addEventListener('change', () => this.saveSettings());
        this.soundToggle?.addEventListener('change', () => this.saveSettings());

        this.exportBtn?.addEventListener('click', () => this.exportRejectionData());
        this.clearRejectionBtn?.addEventListener('click', () => this.clearRejectionData());
        this.clearRejectedJobsBtn?.addEventListener('click', () => this.clearJobMemory());

        this.clearVisitedJobsBtn?.addEventListener('click', () => this.clearVisitedJobs());
        this.clearAllJobDataBtn?.addEventListener('click', () => this.clearAllJobData());

        this.debugReconnectBtn?.addEventListener('click', () => this.reconnectToContentScript());
        this.debugReloadBtn?.addEventListener('click', () => this.reloadCurrentTab());

        this.errorRetryBtn?.addEventListener('click', () => this.retryConnection());
        this.errorCloseBtn?.addEventListener('click', () => this.hideErrorModal());

        this.helpBtn?.addEventListener('click', () => this.showHelp());
        this.aboutBtn?.addEventListener('click', () => this.showAbout());

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
            return true;
        });

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (tabId === this.currentTab?.id && changeInfo.status === 'complete') {
                setTimeout(() => this.checkConnection(), 2000);
            }
        });
    }

    async initializeConnection() {
        console.log('🔍 Initializing connection...');
        this.showLoadingOverlay();
        this.disableAllControls();
        try {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true
            });
            this.currentTab = tab;

            if (!tab.url || !tab.url.includes('jadarat.sa')) {
                this.showError('Please navigate to jadarat.sa');
                this.updateConnectionStatus('disconnected', 'Not on Jadarat website');
                this.hideLoadingOverlay();
                this.showDebugSection('Incorrect URL', tab.url);
                return;
            }

            this.updateConnectionStatus('connecting', 'Connecting...');
            await this.establishConnection();

        } catch (error) {
            console.error('❌ Connection initialization failed:', error);
            this.showError(`Initialization failed: ${error.message}`);
            this.updateConnectionStatus('disconnected', 'Initialization failed');
            this.hideLoadingOverlay();
        }
    }

    async establishConnection() {
        console.log('📡 Attempting to establish connection...');
        this.isConnected = false;

        try {
            console.log('Pinging content script...');
            await this.sendMessageWithTimeout({
                action: 'PING'
            }, 1000);
            console.log('✅ Content script already active.');
            this.handleSuccessfulConnection();
        } catch (error) {
            console.log('💉 Content script not found, injecting...');
            try {
                await chrome.scripting.executeScript({
                    target: {
                        tabId: this.currentTab.id
                    },
                    files: ['content.js']
                });
                console.log('✅ Content script injected.');
                await this.delay(1000); // Wait for script to load
                console.log('Pinging content script again...');
                await this.sendMessageWithTimeout({
                    action: 'PING'
                }, 2000);
                this.handleSuccessfulConnection();
            } catch (injectionError) {
                console.error('❌ Injection failed:', injectionError);
                this.handleConnectionFailure(injectionError);
            }
        }
    }


    async sendMessageWithTimeout(message, timeoutMs = 5000) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
            setTimeout(() => reject(new Error("Message timeout")), timeoutMs);
        });
    }

    handleSuccessfulConnection() {
        console.log('🎉 Connection established successfully.');
        this.isConnected = true;
        this.updateConnectionStatus('connected', 'Connected and ready');
        this.enableControls();
        this.hideLoadingOverlay();
        this.hideErrorModal();
        this.hideDebugSection();
        this.loadSettings();
    }

    handleConnectionFailure(error) {
        console.error('💥 All connection attempts failed.');
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'Connection failed');
        this.disableAllControls();
        this.hideLoadingOverlay();
        this.showError(`Failed to connect to the page.\n\nError: ${error.message}\n\nPlease ensure you are on jadarat.sa and try again.`);
        this.showDebugSection(error.message, this.currentTab?.url);
    }


    updateConnectionStatus(type, text) {
        const updateStatus = (indicator, textElement) => {
            if (!indicator || !textElement) return;

            const dot = indicator.querySelector('.status-dot');
            if (dot) {
                dot.className = 'status-dot';
                if (type === 'connected') {
                    dot.classList.add('connected');
                } else if (type === 'connecting') {
                    dot.classList.add('connecting');
                } else {
                    dot.classList.add('disconnected');
                }
            }

            textElement.textContent = text;
        };

        updateStatus(this.statusIndicator, this.statusText);
        updateStatus(this.footerStatusIndicator, this.footerStatusText);
    }

    enableControls() {
        this.startBtn.disabled = false;
    }

    disableAllControls() {
        this.startBtn.disabled = true;
    }

    showDebugSection(error, url) {
        if (this.debugSection) {
            this.debugSection.style.display = 'block';
            if (this.debugLastError) this.debugLastError.textContent = error || 'N/A';
            if (this.debugCurrentUrl) this.debugCurrentUrl.textContent = url || 'N/A';
        }
    }

    hideDebugSection() {
        if (this.debugSection) {
            this.debugSection.style.display = 'none';
        }
    }

    showLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
        }
    }

    hideLoadingOverlay() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    showError(message) {
        if (this.errorModal && this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorModal.style.display = 'flex';
        }
    }

    hideErrorModal() {
        if (this.errorModal) {
            this.errorModal.style.display = 'none';
        }
    }

    async retryConnection() {
        this.hideErrorModal();
        await this.initializeConnection();
    }

    async reconnectToContentScript() {
        console.log('🔌 Reconnecting to content script...');
        this.showLoadingOverlay();
        this.updateConnectionStatus('connecting', 'Reconnecting...');
        await this.initializeConnection();
    }

    async reloadCurrentTab() {
        console.log('🔄 Reloading page...');
        try {
            await chrome.tabs.reload(this.currentTab.id);
            this.showLoadingOverlay();
            this.updateConnectionStatus('connecting', 'Reloading page...');
            setTimeout(() => this.initializeConnection(), 3000);
        } catch (error) {
            this.showError(`Failed to reload page: ${error.message}`);
        }
    }

    async checkConnection() {
        if (!this.currentTab) return;
        try {
            await this.sendMessageWithTimeout({
                action: 'PING'
            }, 1000);
        } catch (error) {
            if (this.isConnected) {
                console.log('⚠️ Connection lost, attempting to reconnect...');
                this.isConnected = false;
                await this.reconnectToContentScript();
            }
        }
    }


    async startAutomation() {
        if (!this.isConnected) {
            this.showError("Not connected to the page. Please try again.");
            return;
        }
        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.stopBtn.disabled = false;
        this.updateConnectionStatus('connected', 'Running...');
        this.setProgress(0, 'Starting...');

        const settings = {
            delayTime: parseInt(this.delayRange.value),
            mode: this.modeSelect.value,
            soundEnabled: this.soundToggle.checked
        };

        this.sendMessageFireAndForget({
            action: 'START_AUTOMATION',
            settings: settings
        });
    }

    sendMessageFireAndForget(message) {
        chrome.tabs.sendMessage(this.currentTab.id, message, () => {
            if (chrome.runtime.lastError) {
                console.log('Message sent without a response handler:', chrome.runtime.lastError.message);
            }
        });
    }

    async ensureConnection() {
        if (this.isConnected) return;
        console.log('🔄 Ensuring connection...');
        await this.reconnectToContentScript();
        if (!this.isConnected) {
            throw new Error('Failed to establish connection');
        }
    }


    async pauseAutomation() {
        this.isPaused = true;
        this.pauseBtn.disabled = true;
        this.resumeBtn.disabled = false;
        this.updateConnectionStatus('connected', 'Paused');
        this.sendMessageFireAndForget({
            action: 'PAUSE_AUTOMATION'
        });
    }

    async stopAutomation() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        this.resumeBtn.disabled = true;
        this.updateConnectionStatus('connected', 'Ready');
        this.setProgress(0, 'Stopped');
        this.currentJob.innerHTML = '<span class="job-status">Stopped</span>';
        this.sendMessageFireAndForget({
            action: 'STOP_AUTOMATION'
        });
    }

    async resumeAutomation() {
        this.isPaused = false;
        this.pauseBtn.disabled = false;
        this.resumeBtn.disabled = true;
        this.updateConnectionStatus('connected', 'Running...');
        this.sendMessageFireAndForget({
            action: 'RESUME_AUTOMATION'
        });
    }

    async restartAutomation() {
        this.stats = {
            applied: 0,
            skipped: 0,
            rejected: 0,
            total: 0
        };
        this.updateStats();
        await this.saveSettings();
        if (this.isRunning) {
            await this.stopAutomation();
            await this.delay(1000);
        }
        await this.startAutomation();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['delayTime', 'mode', 'soundEnabled', 'stats', 'rejectionData']);
            if (result.delayTime) {
                this.delayRange.value = result.delayTime;
                this.delayValue.textContent = result.delayTime;
            }
            if (result.mode) {
                this.modeSelect.value = result.mode;
            }
            if (result.soundEnabled !== undefined) {
                this.soundToggle.checked = result.soundEnabled;
            }
            if (result.stats) {
                this.stats = result.stats;
                this.updateStats();
            }
            if (result.rejectionData && this.rejectionInfo) {
                this.rejectionInfo.innerHTML = `<span class="info-text">${result.rejectionData.length} rejection(s) saved</span>`;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                delayTime: parseInt(this.delayRange.value),
                mode: this.modeSelect.value,
                soundEnabled: this.soundToggle.checked,
                stats: this.stats
            };
            await chrome.storage.local.set(settings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    handleMessage(message) {
        switch (message.action) {
            case 'UPDATE_PROGRESS':
                this.setProgress(message.progress, message.text);
                break;
            case 'UPDATE_CURRENT_JOB':
                this.updateCurrentJob(message.jobTitle, message.status, message.reason);
                break;
            case 'UPDATE_STATS':
                this.stats = message.stats;
                this.updateStats();
                this.saveSettings();
                break;
            case 'AUTOMATION_COMPLETED':
                this.onAutomationCompleted();
                break;
            case 'AUTOMATION_ERROR':
                this.onAutomationError(message.error);
                break;
            case 'SAVE_REJECTION_DATA':
                this.loadSettings();
                break;
        }
    }

    updateStats() {
        this.appliedCount.textContent = this.stats.applied || 0;
        this.skippedCount.textContent = this.stats.skipped || 0;
        this.rejectedCount.textContent = this.stats.rejected || 0;
        this.totalCount.textContent = this.stats.total || 0;
    }

    setProgress(percentage, text) {
        this.progressFill.style.width = percentage + '%';
        this.progressPercentage.textContent = Math.round(percentage) + '%';
        this.progressText.textContent = text;
    }

    async clearVisitedJobs() {
        if (confirm('Are you sure you want to clear visited jobs? All jobs will be visited again.')) {
            this.sendMessageFireAndForget({
                action: 'CLEAR_VISITED_JOBS'
            });
            this.showNotification('Visited jobs cleared.');
        }
    }

    async clearAllJobData() {
        if (confirm('Are you sure you want to clear all job data? This will clear visited jobs, rejected jobs, and rejection data.')) {
            this.sendMessageFireAndForget({
                action: 'CLEAR_ALL_JOB_DATA'
            });
            await chrome.runtime.sendMessage({
                action: 'CLEAR_REJECTION_DATA'
            });
            this.showNotification('All job data cleared.');
        }
    }

    async clearRejectionData() {
        if (confirm('Are you sure you want to clear all rejection data?')) {
            await chrome.runtime.sendMessage({
                action: 'CLEAR_REJECTION_DATA'
            });
            this.rejectionInfo.innerHTML = `<span class="info-text">No rejection data yet</span>`;
            this.showNotification('Rejection data cleared.');
        }
    }

    async clearJobMemory() {
        if (confirm('Are you sure you want to clear the processed jobs memory? Previously rejected jobs will be reapplied to.')) {
            this.sendMessageFireAndForget({
                action: 'CLEAR_JOB_MEMORY'
            });
            await chrome.storage.local.remove(['jobMemory']);
            this.showNotification('Job memory cleared.');
        }
    }


    updateCurrentJob(jobTitle, status, reason) {
        const statusColors = {
            'processing': '#ffc107',
            'success': '#00ff88',
            'error': '#ff4545',
            'skipped': '#7d2ae8',
            'rejected': '#ff9800'
        };

        let statusText = this.getStatusText(status);
        if (reason && (status === 'rejected' || status === 'error')) {
            statusText += ` (${reason})`;
        }

        this.currentJob.innerHTML = `
            <span class="job-status" style="color: ${statusColors[status] || '#7d2ae8'}">
                ${jobTitle} - ${statusText}
            </span>
        `;
    }

    getStatusText(status) {
        const statusTexts = {
            'processing': 'Processing...',
            'success': 'Successfully Applied',
            'error': 'Application Failed',
            'skipped': 'Skipped',
            'rejected': 'Rejected'
        };
        return statusTexts[status] || 'Unknown';
    }


    onAutomationCompleted() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        this.resumeBtn.disabled = true;
        this.updateConnectionStatus('connected', 'Completed');
        this.setProgress(100, 'All jobs processed');
        const summary = `Completed! Results: Applied: ${this.stats.applied}, Rejected: ${this.stats.rejected}, Skipped: ${this.stats.skipped}, Total: ${this.stats.total}`;
        this.currentJob.innerHTML = '<span class="job-status" style="color: #00ff88">Successfully completed!</span>';
        this.showNotification(summary);
    }

    onAutomationError(error) {
        this.isRunning = false;
        this.updateConnectionStatus('connected', 'Error');
        this.currentJob.innerHTML = `<span class="job-status" style="color: #ff4545">Error: ${error}</span>`;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        this.resumeBtn.disabled = true;
        this.showError(error);
    }

    async exportRejectionData() {
        const response = await chrome.runtime.sendMessage({
            action: 'EXPORT_REJECTION_DATA'
        });
        if (response && response.exportData && response.exportData.success) {
            const link = document.createElement('a');
            link.href = response.exportData.url;
            link.download = response.exportData.filename;
            link.click();
            this.showNotification(`Exported ${response.exportData.count} rejections.`);
        } else {
            this.showError(response?.exportData?.message || 'Export failed.');
        }
    }

    showHelp() {
        alert(`Help:\n\n1. Log in to Jadarat.\n2. Navigate to the job list or a job details page.\n3. Click "Start".\n\nIf you encounter issues, try reloading the page or restarting the browser.`);
    }

    showAbout() {
        alert(`Jadarat Auto v1.0.1\n\nA Chrome extension to automate job applications on Jadarat.\n\nFeatures:\n- Automatic application\n- Skips previously applied jobs\n- Detailed stats\n- Rejection data export\n- Modern UI\n\nDeveloped by AI.`);
    }

    showNotification(message) {
        if (this.soundToggle.checked) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Jadarat Auto',
                message: message
            });
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.jadaratAutoPopup = new JadaratAutoPopup();
});
