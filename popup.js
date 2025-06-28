// جدارات أوتو - Popup Script
class JadaratAutoPopup {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.stats = {
            applied: 0,
            skipped: 0,
            total: 0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.updateStatus();
    }

    initializeElements() {
        // Buttons
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

        // Statistics
        this.appliedCount = document.getElementById('appliedCount');
        this.skippedCount = document.getElementById('skippedCount');
        this.totalCount = document.getElementById('totalCount');

        // Progress
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentJob = document.getElementById('currentJob');

        // Status
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
    }

    bindEvents() {
        // Control buttons
        this.startBtn.addEventListener('click', () => this.startAutomation());
        this.pauseBtn.addEventListener('click', () => this.pauseAutomation());
        this.stopBtn.addEventListener('click', () => this.stopAutomation());
        this.resumeBtn.addEventListener('click', () => this.resumeAutomation());
        this.restartBtn.addEventListener('click', () => this.restartAutomation());
        this.closeBtn.addEventListener('click', () => window.close());

        // Settings
        this.delayRange.addEventListener('input', (e) => {
            this.delayValue.textContent = e.target.value;
            this.saveSettings();
        });

        this.modeSelect.addEventListener('change', () => this.saveSettings());
        this.soundToggle.addEventListener('change', () => this.saveSettings());

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'delayTime',
                'mode',
                'soundEnabled',
                'lastPosition',
                'stats'
            ]);

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

            if (result.lastPosition) {
                this.resumeBtn.disabled = false;
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

    async startAutomation() {
        try {
            // Check if we're on the correct website
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('jadarat.sa')) {
                this.showError('يرجى التأكد من أنك على موقع جدارات الصحيح');
                return;
            }

            this.isRunning = true;
            this.isPaused = false;
            
            // Update UI
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
            
            this.updateStatus('connected', 'متصل - يعمل');
            this.setProgress(0, 'بدء التشغيل...');

            // Send message to content script to start
            const settings = {
                delayTime: parseInt(this.delayRange.value),
                mode: this.modeSelect.value,
                soundEnabled: this.soundToggle.checked
            };

            chrome.tabs.sendMessage(tab.id, {
                action: 'START_AUTOMATION',
                settings: settings
            });

            this.playSound('start');

        } catch (error) {
            console.error('Error starting automation:', error);
            this.showError('حدث خطأ أثناء بدء التشغيل');
        }
    }

    async pauseAutomation() {
        this.isPaused = true;
        
        this.pauseBtn.disabled = true;
        this.startBtn.disabled = false;
        
        this.updateStatus('connected', 'متصل - متوقف مؤقتاً');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.sendMessage(tab.id, { action: 'PAUSE_AUTOMATION' });
        } catch (error) {
            console.error('Error sending pause message:', error);
        }

        this.playSound('pause');
    }

    async stopAutomation() {
        this.isRunning = false;
        this.isPaused = false;
        
        // Reset UI
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.updateStatus('disconnected', 'غير متصل');
        this.setProgress(0, 'تم الإيقاف');
        this.currentJob.innerHTML = '<span class="job-status">تم الإيقاف</span>';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.sendMessage(tab.id, { action: 'STOP_AUTOMATION' });
        } catch (error) {
            console.error('Error sending stop message:', error);
        }

        this.playSound('stop');
    }

    async resumeAutomation() {
        try {
            const result = await chrome.storage.local.get(['lastPosition']);
            
            if (result.lastPosition) {
                this.startAutomation();
                this.resumeBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error resuming automation:', error);
        }
    }

    async restartAutomation() {
        try {
            // Clear saved position
            await chrome.storage.local.remove(['lastPosition']);
            
            // Reset stats
            this.stats = { applied: 0, skipped: 0, total: 0 };
            this.updateStats();
            await this.saveSettings();
            
            // Restart
            if (this.isRunning) {
                await this.stopAutomation();
                setTimeout(() => this.startAutomation(), 1000);
            }
            
            this.resumeBtn.disabled = true;
        } catch (error) {
            console.error('Error restarting automation:', error);
        }
    }

    handleMessage(message) {
        switch (message.action) {
            case 'UPDATE_PROGRESS':
                this.setProgress(message.progress, message.text);
                break;
                
            case 'UPDATE_CURRENT_JOB':
                this.updateCurrentJob(message.jobTitle, message.status);
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
                
            case 'SAVE_POSITION':
                this.savePosition(message.position);
                break;
        }
    }

    updateStats() {
        if (this.appliedCount) this.appliedCount.textContent = this.stats.applied;
        if (this.skippedCount) this.skippedCount.textContent = this.stats.skipped;
        if (this.totalCount) this.totalCount.textContent = this.stats.total;
    }

    setProgress(percentage, text) {
        if (this.progressFill) {
            this.progressFill.style.width = percentage + '%';
        }
        if (this.progressText) {
            this.progressText.textContent = text;
        }
    }

    updateCurrentJob(jobTitle, status) {
        if (!this.currentJob) return;
        
        const statusColors = {
            'processing': '#ffc107',
            'success': '#00ff88',
            'error': '#ff4545',
            'skipped': '#7d2ae8'
        };

        this.currentJob.innerHTML = `
            <span class="job-status" style="color: ${statusColors[status] || '#7d2ae8'}">
                ${jobTitle} - ${this.getStatusText(status)}
            </span>
        `;
    }

    getStatusText(status) {
        const statusTexts = {
            'processing': 'جاري المعالجة...',
            'success': 'تم التقديم بنجاح',
            'error': 'فشل التقديم',
            'skipped': 'تم التخطي'
        };
        return statusTexts[status] || 'غير معروف';
    }

    updateStatus(type, text) {
        const dot = this.statusIndicator?.querySelector('.status-dot');
        
        if (dot) {
            if (type === 'connected') {
                dot.classList.add('connected');
            } else {
                dot.classList.remove('connected');
            }
        }
        
        if (this.statusText) {
            this.statusText.textContent = text;
        }
    }

    onAutomationCompleted() {
        this.isRunning = false;
        this.isPaused = false;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.updateStatus('disconnected', 'مكتمل');
        this.setProgress(100, 'تم الانتهاء من جميع الوظائف');
        this.currentJob.innerHTML = '<span class="job-status" style="color: #00ff88">تم الانتهاء بنجاح!</span>';
        
        this.playSound('complete');
        this.showNotification('تم الانتهاء من التقديم على جميع الوظائف المتاحة!');
    }

    onAutomationError(error) {
        this.updateStatus('disconnected', 'خطأ');
        this.currentJob.innerHTML = `<span class="job-status" style="color: #ff4545">خطأ: ${error}</span>`;
        this.playSound('error');
    }

    async savePosition(position) {
        try {
            await chrome.storage.local.set({ lastPosition: position });
            this.resumeBtn.disabled = false;
        } catch (error) {
            console.error('Error saving position:', error);
        }
    }

    playSound(type) {
        if (!this.soundToggle.checked) return;
        
        try {
            // Create simple beep sounds using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different sounds
            const frequencies = {
                'start': 800,
                'pause': 600,
                'stop': 400,
                'complete': 1000,
                'error': 300
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Fallback: silent operation if audio fails
            console.log('Sound not available');
        }
    }

    showNotification(message) {
        if (this.soundToggle.checked) {
            try {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'جدارات أوتو',
                    message: message
                });
            } catch (error) {
                console.log('Notifications not available');
            }
        }
    }

    showError(message) {
        if (this.currentJob) {
            this.currentJob.innerHTML = `<span class="job-status" style="color: #ff4545">${message}</span>`;
        }
        this.playSound('error');
    }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JadaratAutoPopup();
});