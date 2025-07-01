// جدارات أوتو - Popup Script المُصحح والمبسط
class JadaratAutoPopup {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTab = null;
        this.stats = {
            applied: 0,
            skipped: 0,
            rejected: 0,
            total: 0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.checkConnection();
    }

    initializeElements() {
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.closeBtn = document.getElementById('closeBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearRejectionBtn = document.getElementById('clearRejectionBtn');

        // Settings
        this.delayRange = document.getElementById('delayRange');
        this.delayValue = document.getElementById('delayValue');
        this.modeSelect = document.getElementById('modeSelect');
        this.soundToggle = document.getElementById('soundToggle');

        // Statistics
        this.appliedCount = document.getElementById('appliedCount');
        this.skippedCount = document.getElementById('skippedCount');
        this.rejectedCount = document.getElementById('rejectedCount');
        this.totalCount = document.getElementById('totalCount');

        // Progress
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentJob = document.getElementById('currentJob');

        // Rejection info
        this.rejectionInfo = document.getElementById('rejectionInfo');
        
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
        this.exportBtn.addEventListener('click', () => this.exportRejectionData());
        this.clearRejectionBtn.addEventListener('click', () => this.clearRejectionData());

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

    async checkConnection() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            if (!tab.url || !tab.url.includes('jadarat.sa')) {
                this.updateStatus('disconnected', 'يرجى الانتقال لموقع جدارات');
                this.showError('يرجى الانتقال إلى موقع جدارات (jadarat.sa)');
                this.startBtn.disabled = true;
                return;
            }

            // Try to ping content script
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
                if (response && response.status === 'active') {
                    this.updateStatus('connected', 'متصل - جاهز');
                    this.startBtn.disabled = false;
                } else {
                    throw new Error('No response from content script');
                }
            } catch (error) {
                console.log('Content script not ready, will inject...');
                await this.injectContentScript();
            }

        } catch (error) {
            console.error('Error checking connection:', error);
            this.updateStatus('disconnected', 'خطأ في الاتصال');
            this.showError('خطأ في الاتصال مع الصفحة');
        }
    }

    async injectContentScript() {
        try {
            if (!this.currentTab) return;

            // Inject content script
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                files: ['content.js']
            });

            // Wait a bit for initialization
            await this.delay(1000);

            // Try to ping again
            const response = await chrome.tabs.sendMessage(this.currentTab.id, { action: 'PING' });
            if (response && response.status === 'active') {
                this.updateStatus('connected', 'متصل - جاهز');
                this.startBtn.disabled = false;
            } else {
                throw new Error('Content script injection failed');
            }

        } catch (error) {
            console.error('Error injecting content script:', error);
            this.updateStatus('disconnected', 'فشل في تحميل المحتوى');
            this.showError('فشل في تحميل المحتوى. تحقق من الأذونات.');
        }
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

            // Load rejection data info
            this.loadRejectionInfo();

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
            if (!this.currentTab || !this.currentTab.url.includes('jadarat.sa')) {
                this.showError('يرجى التأكد من أنك على موقع جدارات الصحيح');
                return;
            }

            // Check if on correct page
            if (!this.currentTab.url.includes('ExploreJobs') && !this.currentTab.url.includes('JobTab=1')) {
                this.showError('يرجى الانتقال إلى صفحة البحث عن الوظائف');
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

            // Get settings
            const settings = {
                delayTime: parseInt(this.delayRange.value),
                mode: this.modeSelect.value,
                soundEnabled: this.soundToggle.checked
            };

            // Send message to content script with error handling
            try {
                const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                    action: 'START_AUTOMATION',
                    settings: settings
                });

                if (!response || !response.success) {
                    throw new Error('Failed to start automation');
                }

                this.playSound('start');

            } catch (error) {
                console.error('Error starting automation:', error);
                this.showError('فشل في بدء التشغيل. جرب إعادة تحميل الصفحة.');
                await this.stopAutomation();
            }

        } catch (error) {
            console.error('Error in startAutomation:', error);
            this.showError('حدث خطأ أثناء بدء التشغيل');
            await this.stopAutomation();
        }
    }

    async pauseAutomation() {
        this.isPaused = true;
        
        this.pauseBtn.disabled = true;
        this.startBtn.disabled = false;
        
        this.updateStatus('connected', 'متصل - متوقف مؤقتاً');
        
        try {
            if (this.currentTab) {
                await chrome.tabs.sendMessage(this.currentTab.id, { action: 'PAUSE_AUTOMATION' });
            }
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
        
        this.updateStatus('connected', 'متصل - جاهز');
        this.setProgress(0, 'تم الإيقاف');
        this.currentJob.innerHTML = '<span class="job-status">تم الإيقاف</span>';

        try {
            if (this.currentTab) {
                await chrome.tabs.sendMessage(this.currentTab.id, { action: 'STOP_AUTOMATION' });
            }
        } catch (error) {
            console.error('Error sending stop message:', error);
        }

        this.playSound('stop');
    }

    async resumeAutomation() {
        try {
            const result = await chrome.storage.local.get(['lastPosition']);
            
            if (result.lastPosition) {
                await this.startAutomation();
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
            this.stats = { applied: 0, skipped: 0, rejected: 0, total: 0 };
            this.updateStats();
            await this.saveSettings();
            
            // Restart if running
            if (this.isRunning) {
                await this.stopAutomation();
                await this.delay(1000);
                await this.startAutomation();
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
                this.updateCurrentJob(message.jobTitle, message.status, message.reason);
                break;
                
            case 'UPDATE_STATS':
                this.stats = message.stats;
                this.updateStats();
                this.saveSettings();
                // Update rejection info when stats change
                this.loadRejectionInfo();
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
        if (this.appliedCount) this.appliedCount.textContent = this.stats.applied || 0;
        if (this.skippedCount) this.skippedCount.textContent = this.stats.skipped || 0;
        if (this.rejectedCount) this.rejectedCount.textContent = this.stats.rejected || 0;
        if (this.totalCount) this.totalCount.textContent = this.stats.total || 0;
    }

    setProgress(percentage, text) {
        if (this.progressFill) {
            this.progressFill.style.width = percentage + '%';
        }
        if (this.progressText) {
            this.progressText.textContent = text;
        }
    }

    updateCurrentJob(jobTitle, status, reason = '') {
        if (!this.currentJob) return;
        
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
            'processing': 'جاري المعالجة...',
            'success': 'تم التقديم بنجاح',
            'error': 'فشل التقديم',
            'skipped': 'تم التخطي',
            'rejected': 'تم الرفض'
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
        
        this.updateStatus('connected', 'مكتمل');
        this.setProgress(100, 'تم الانتهاء من جميع الوظائف');
        
        // Create summary message
        const summary = `تم الانتهاء! النتائج:
• تم التقديم: ${this.stats.applied || 0}
• تم الرفض: ${this.stats.rejected || 0}  
• تم التخطي: ${this.stats.skipped || 0}
• الإجمالي: ${this.stats.total || 0}`;
        
        this.currentJob.innerHTML = '<span class="job-status" style="color: #00ff88">تم الانتهاء بنجاح!</span>';
        
        this.playSound('complete');
        this.showNotification(summary);
    }

    onAutomationError(error) {
        this.updateStatus('connected', 'خطأ');
        this.currentJob.innerHTML = `<span class="job-status" style="color: #ff4545">خطأ: ${error}</span>`;
        this.playSound('error');
        
        // Reset buttons
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
    }

    async savePosition(position) {
        try {
            await chrome.storage.local.set({ lastPosition: position });
            this.resumeBtn.disabled = false;
        } catch (error) {
            console.error('Error saving position:', error);
        }
    }

    async loadRejectionInfo() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'GET_REJECTION_DATA' });
            const rejectionData = response?.rejectionData || [];
            
            if (rejectionData.length > 0) {
                this.rejectionInfo.innerHTML = `
                    <span class="info-text">
                        📊 تم حفظ ${rejectionData.length} حالة رفض
                    </span>
                `;
                this.exportBtn.disabled = false;
                this.clearRejectionBtn.disabled = false;
            } else {
                this.rejectionInfo.innerHTML = `
                    <span class="info-text">لا توجد بيانات رفض بعد</span>
                `;
                this.exportBtn.disabled = true;
                this.clearRejectionBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error loading rejection info:', error);
        }
    }

    async exportRejectionData() {
        try {
            this.exportBtn.disabled = true;
            this.exportBtn.innerHTML = '<span class="btn-icon">⏳</span> جاري التصدير...';
            
            const response = await chrome.runtime.sendMessage({ action: 'EXPORT_REJECTION_DATA' });
            
            if (response?.exportData && response.exportData.success) {
                // Create download link
                const link = document.createElement('a');
                link.href = response.exportData.url;
                link.download = response.exportData.filename;
                link.click();
                
                // Clean up
                setTimeout(() => {
                    URL.revokeObjectURL(response.exportData.url);
                }, 100);
                
                this.showNotification(`تم تصدير ${response.exportData.count} حالة رفض بنجاح`);
                
            } else {
                this.showError(response?.exportData?.message || 'فشل في تصدير البيانات');
            }
            
        } catch (error) {
            console.error('Error exporting rejection data:', error);
            this.showError('خطأ في تصدير البيانات');
        } finally {
            this.exportBtn.disabled = false;
            this.exportBtn.innerHTML = '<span class="btn-icon">📥</span> تصدير للاكسل';
        }
    }

    async clearRejectionData() {
        try {
            const confirmClear = confirm('هل أنت متأكد من مسح جميع بيانات الرفض؟\nلن يمكن استرجاعها بعد الحذف.');
            
            if (confirmClear) {
                this.clearRejectionBtn.disabled = true;
                this.clearRejectionBtn.innerHTML = '<span class="btn-icon">⏳</span> جاري المسح...';
                
                await chrome.runtime.sendMessage({ action: 'CLEAR_REJECTION_DATA' });
                
                // Update UI
                await this.loadRejectionInfo();
                this.showNotification('تم مسح بيانات الرفض بنجاح');
            }
            
        } catch (error) {
            console.error('Error clearing rejection data:', error);
            this.showError('خطأ في مسح البيانات');
        } finally {
            this.clearRejectionBtn.disabled = false;
            this.clearRejectionBtn.innerHTML = '<span class="btn-icon">🗑</span> مسح البيانات';
        }
    }

    playSound(type) {
        if (!this.soundToggle?.checked) return;
        
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
        if (this.soundToggle?.checked) {
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

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new JadaratAutoPopup();
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
});