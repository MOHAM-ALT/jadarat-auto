// جدارات أوتو - Popup Script المُصحح بالكامل
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
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.closeBtn = document.getElementById('closeBtn');

        this.delayRange = document.getElementById('delayRange');
        this.delayValue = document.getElementById('delayValue');
        this.modeSelect = document.getElementById('modeSelect');
        this.soundToggle = document.getElementById('soundToggle');

        this.appliedCount = document.getElementById('appliedCount');
        this.skippedCount = document.getElementById('skippedCount');
        this.rejectedCount = document.getElementById('rejectedCount');
        this.totalCount = document.getElementById('totalCount');

        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentJob = document.getElementById('currentJob');

        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');

        // عناصر الرفض
        this.exportBtn = document.getElementById('exportBtn');
        this.clearRejectionBtn = document.getElementById('clearRejectionBtn');
        this.rejectionInfo = document.getElementById('rejectionInfo');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startAutomation());
        this.pauseBtn.addEventListener('click', () => this.pauseAutomation());
        this.stopBtn.addEventListener('click', () => this.stopAutomation());
        this.resumeBtn.addEventListener('click', () => this.resumeAutomation());
        this.restartBtn.addEventListener('click', () => this.restartAutomation());
        this.closeBtn.addEventListener('click', () => window.close());

        this.delayRange.addEventListener('input', (e) => {
            this.delayValue.textContent = e.target.value;
            this.saveSettings();
        });

        this.modeSelect.addEventListener('change', () => this.saveSettings());
        this.soundToggle.addEventListener('change', () => this.saveSettings());

        // أزرار الرفض
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportRejectionData());
        }
        
        if (this.clearRejectionBtn) {
            this.clearRejectionBtn.addEventListener('click', () => this.clearRejectionData());
        }

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
        });
    }

    async checkConnection() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            if (!tab.url || !tab.url.includes('jadarat.sa')) {
                this.updateStatus('disconnected', 'يرجى الانتقال لموقع جدارات');
                this.showError('يرجى الانتقال إلى موقع جدارات (jadarat.sa)');
                this.startBtn.disabled = true;
                return;
            }

            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
                if (response && response.status === 'active') {
                    this.updateStatus('connected', 'متصل - جاهز');
                    this.startBtn.disabled = false;
                } else {
                    await this.injectContentScript();
                }
            } catch (error) {
                await this.injectContentScript();
            }

        } catch (error) {
            this.updateStatus('disconnected', 'خطأ في الاتصال');
            this.showError('خطأ في الاتصال مع الصفحة');
        }
    }

    async injectContentScript() {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                files: ['content.js']
            });

            await this.delay(1000);

            const response = await chrome.tabs.sendMessage(this.currentTab.id, { action: 'PING' });
            if (response && response.status === 'active') {
                this.updateStatus('connected', 'متصل - جاهز');
                this.startBtn.disabled = false;
            }

        } catch (error) {
            this.updateStatus('disconnected', 'فشل في تحميل المحتوى');
            this.showError('فشل في تحميل المحتوى');
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'delayTime',
                'mode',
                'soundEnabled',
                'stats',
                'rejectionData'
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

            // تحديث معلومات الرفض
            if (result.rejectionData && this.rejectionInfo) {
                const count = result.rejectionData.length;
                this.rejectionInfo.innerHTML = `
                    <span class="info-text">
                        ${count > 0 ? `${count} حالة رفض محفوظة` : 'لا توجد بيانات رفض بعد'}
                    </span>
                `;
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
            if (!this.currentTab || !this.currentTab.url.includes('jadarat.sa')) {
                this.showError('يرجى التأكد من أنك على موقع جدارات الصحيح');
                return;
            }

            if (!this.currentTab.url.includes('ExploreJobs') && !this.currentTab.url.includes('JobTab=1')) {
                this.showError('يرجى الانتقال إلى صفحة البحث عن الوظائف');
                return;
            }

            this.isRunning = true;
            this.isPaused = false;
            
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
            
            this.updateStatus('connected', 'متصل - يعمل');
            this.setProgress(0, 'بدء التشغيل...');

            const settings = {
                delayTime: parseInt(this.delayRange.value),
                mode: this.modeSelect.value,
                soundEnabled: this.soundToggle.checked
            };

            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'START_AUTOMATION',
                settings: settings
            });

            if (!response || !response.success) {
                throw new Error('Failed to start automation');
            }

        } catch (error) {
            this.showError('فشل في بدء التشغيل');
            this.stopAutomation();
        }
    }

    async pauseAutomation() {
        this.isPaused = true;
        
        this.pauseBtn.disabled = true;
        this.startBtn.disabled = false;
        
        this.updateStatus('connected', 'متصل - متوقف مؤقتاً');
        
        try {
            await chrome.tabs.sendMessage(this.currentTab.id, { action: 'PAUSE_AUTOMATION' });
        } catch (error) {
            console.error('Error sending pause message:', error);
        }
    }

    async stopAutomation() {
        this.isRunning = false;
        this.isPaused = false;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.updateStatus('connected', 'متصل - جاهز');
        this.setProgress(0, 'تم الإيقاف');
        this.currentJob.innerHTML = '<span class="job-status">تم الإيقاف</span>';

        try {
            await chrome.tabs.sendMessage(this.currentTab.id, { action: 'STOP_AUTOMATION' });
        } catch (error) {
            console.error('Error sending stop message:', error);
        }
    }

    async resumeAutomation() {
        await this.startAutomation();
    }

    async restartAutomation() {
        this.stats = { applied: 0, skipped: 0, rejected: 0, total: 0 };
        this.updateStats();
        await this.saveSettings();
        
        if (this.isRunning) {
            await this.stopAutomation();
            await this.delay(1000);
            await this.startAutomation();
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
                this.loadSettings(); // إعادة تحميل لتحديث عدد الرفض
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

    updateCurrentJob(jobTitle, status, reason) {
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
        const dot = this.statusIndicator && this.statusIndicator.querySelector('.status-dot');
        
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
        
        const summary = `تم الانتهاء! النتائج:
• تم التقديم: ${this.stats.applied || 0}
• تم الرفض: ${this.stats.rejected || 0}  
• تم التخطي: ${this.stats.skipped || 0}
• الإجمالي: ${this.stats.total || 0}`;
        
        this.currentJob.innerHTML = '<span class="job-status" style="color: #00ff88">تم الانتهاء بنجاح!</span>';
        
        this.showNotification(summary);
    }

    onAutomationError(error) {
        this.updateStatus('connected', 'خطأ');
        this.currentJob.innerHTML = `<span class="job-status" style="color: #ff4545">خطأ: ${error}</span>`;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
    }

    async exportRejectionData() {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'EXPORT_REJECTION_DATA'
            });

            if (response && response.exportData && response.exportData.success) {
                // إنشاء رابط التحميل
                const link = document.createElement('a');
                link.href = response.exportData.url;
                link.download = response.exportData.filename;
                link.click();

                this.showNotification(`تم تصدير ${response.exportData.count} حالة رفض`);
            } else {
                this.showError(response?.exportData?.message || 'فشل في التصدير');
            }
        } catch (error) {
            console.error('Error exporting rejection data:', error);
            this.showError('خطأ في تصدير البيانات');
        }
    }

    async clearRejectionData() {
        if (confirm('هل أنت متأكد من مسح جميع بيانات الرفض؟')) {
            try {
                await chrome.runtime.sendMessage({
                    action: 'CLEAR_REJECTION_DATA'
                });

                if (this.rejectionInfo) {
                    this.rejectionInfo.innerHTML = `
                        <span class="info-text">لا توجد بيانات رفض بعد</span>
                    `;
                }

                this.showNotification('تم مسح بيانات الرفض');
            } catch (error) {
                console.error('Error clearing rejection data:', error);
                this.showError('خطأ في مسح البيانات');
            }
        }
    }

    showNotification(message) {
        if (this.soundToggle && this.soundToggle.checked) {
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