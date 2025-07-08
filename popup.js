// جدارات أوتو - Popup Script المُصحح بالكامل - إصدار محسن
class JadaratAutoPopup {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTab = null;
        this.connectionRetries = 0;
        this.maxConnectionRetries = 3;
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

        // إضافة مستمع الرسائل مع معالجة أفضل للأخطاء
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                this.handleMessage(message);
                sendResponse({ received: true });
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({ error: error.message });
            }
        });
    }

    async checkConnection() {
        try {
            console.log('🔍 فحص الاتصال...');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            if (!tab.url || !tab.url.includes('jadarat.sa')) {
                this.updateStatus('disconnected', 'يرجى الانتقال لموقع جدارات');
                this.showError('يرجى الانتقال إلى موقع جدارات (jadarat.sa)');
                this.disableAllButtons();
                return;
            }

            console.log('✅ على موقع جدارات، جاري فحص content script...');
            
            // محاولة الاتصال مع content script
            await this.establishConnection();

        } catch (error) {
            console.error('❌ خطأ في فحص الاتصال:', error);
            this.updateStatus('disconnected', 'خطأ في الاتصال');
            this.showError('خطأ في الاتصال مع الصفحة');
            this.disableAllButtons();
        }
    }

    async establishConnection() {
        const maxAttempts = 3;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`📡 محاولة الاتصال ${attempts}/${maxAttempts}...`);

                const response = await this.sendMessageSafely(this.currentTab.id, { 
                    action: 'PING' 
                }, 5000); // timeout 5 seconds

                if (response && response.status === 'active') {
                    console.log('✅ الاتصال ناجح! نوع الصفحة:', response.pageType);
                    this.updateStatus('connected', 'متصل - جاهز');
                    this.enableButtons();
                    return;
                }

                console.log('⚠️ لا يوجد رد، محاولة حقن content script...');
                await this.injectContentScript();

            } catch (error) {
                console.error(`❌ فشلت المحاولة ${attempts}:`, error.message);
                
                if (attempts < maxAttempts) {
                    console.log('🔄 انتظار قبل المحاولة التالية...');
                    await this.delay(2000);
                } else {
                    console.error('❌ فشل في جميع محاولات الاتصال');
                    this.updateStatus('disconnected', 'فشل في الاتصال');
                    this.showError('فشل في الاتصال مع content script');
                    this.disableAllButtons();
                }
            }
        }
    }

    async sendMessageSafely(tabId, message, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Message timeout'));
            }, timeout);

            try {
                chrome.tabs.sendMessage(tabId, message, (response) => {
                    clearTimeout(timeoutId);
                    
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    
                    resolve(response);
                });
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    async injectContentScript() {
        try {
            console.log('💉 حقن content script...');
            
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                files: ['content.js']
            });

            console.log('✅ تم حقن content script، انتظار التحميل...');
            await this.delay(3000);

            // فحص الاتصال مرة أخرى
            const response = await this.sendMessageSafely(this.currentTab.id, { 
                action: 'PING' 
            }, 5000);

            if (response && response.status === 'active') {
                console.log('✅ نجح الحقن والاتصال!');
                this.updateStatus('connected', 'متصل - جاهز');
                this.enableButtons();
            } else {
                throw new Error('Content script لا يرد بعد الحقن');
            }

        } catch (error) {
            console.error('❌ فشل في حقن content script:', error);
            throw error;
        }
    }

    enableButtons() {
        if (this.startBtn) this.startBtn.disabled = false;
        if (this.restartBtn) this.restartBtn.disabled = false;
    }

    disableAllButtons() {
        if (this.startBtn) this.startBtn.disabled = true;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
        if (this.stopBtn) this.stopBtn.disabled = true;
        if (this.resumeBtn) this.resumeBtn.disabled = true;
        if (this.restartBtn) this.restartBtn.disabled = true;
    }

    async startAutomation() {
        try {
            console.log('🚀 بدء التشغيل...');

            // فحص محسن للصفحات المدعومة
            const supportedPages = [
                'ExploreJobs',
                'JobTab=1', 
                'JobDetails'
            ];
            
            const isOnSupportedPage = supportedPages.some(page => 
                this.currentTab.url.includes(page)
            );
            
            if (!isOnSupportedPage) {
                // محاولة التنقل لصفحة الوظائف
                const shouldNavigate = confirm('يجب أن تكون على صفحة الوظائف. هل تريد الانتقال إليها؟');
                if (shouldNavigate) {
                    await this.navigateToJobsPage();
                    return;
                } else {
                    this.showError('يرجى الانتقال إلى صفحة الوظائف يدوياً');
                    return;
                }
            }
            
            // التأكد من الاتصال قبل البدء
            await this.ensureConnection();
            
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

            console.log('📤 إرسال أمر البدء مع الإعدادات:', settings);

            const response = await this.sendMessageSafely(this.currentTab.id, {
                action: 'START_AUTOMATION',
                settings: settings
            }, 10000);

            if (!response || !response.success) {
                throw new Error('فشل في بدء التشغيل من content script');
            }

            console.log('✅ تم بدء التشغيل بنجاح');

        } catch (error) {
            console.error('❌ خطأ في بدء التشغيل:', error);
            this.showError(`فشل في بدء التشغيل: ${error.message}`);
            this.stopAutomation();
        }
    }

    async ensureConnection() {
        try {
            const response = await this.sendMessageSafely(this.currentTab.id, { 
                action: 'PING' 
            }, 3000);
            
            if (!response || response.status !== 'active') {
                console.log('🔄 إعادة تأسيس الاتصال...');
                await this.establishConnection();
            }
        } catch (error) {
            console.log('🔄 إعادة تأسيس الاتصال بسبب خطأ...');
            await this.establishConnection();
        }
    }

    async navigateToJobsPage() {
        try {
            const jobsUrl = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
            await chrome.tabs.update(this.currentTab.id, { url: jobsUrl });
            
            // انتظار التحميل
            await this.delay(5000);
            
            // إعادة فحص الاتصال
            await this.checkConnection();
            
        } catch (error) {
            console.error('❌ فشل في التنقل:', error);
            this.showError('فشل في التنقل لصفحة الوظائف');
        }
    }

    async pauseAutomation() {
        console.log('⏸️ إيقاف مؤقت...');
        this.isPaused = true;
        
        this.pauseBtn.disabled = true;
        this.startBtn.disabled = false;
        
        this.updateStatus('connected', 'متصل - متوقف مؤقتاً');
        
        try {
            await this.sendMessageSafely(this.currentTab.id, { 
                action: 'PAUSE_AUTOMATION' 
            }, 3000);
        } catch (error) {
            console.error('Error sending pause message:', error);
        }
    }

    async stopAutomation() {
        console.log('⏹️ إيقاف نهائي...');
        this.isRunning = false;
        this.isPaused = false;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.updateStatus('connected', 'متصل - جاهز');
        this.setProgress(0, 'تم الإيقاف');
        this.currentJob.innerHTML = '<span class="job-status">تم الإيقاف</span>';

        try {
            await this.sendMessageSafely(this.currentTab.id, { 
                action: 'STOP_AUTOMATION' 
            }, 3000);
        } catch (error) {
            console.error('Error sending stop message:', error);
        }
    }

    async resumeAutomation() {
        await this.startAutomation();
    }

    async restartAutomation() {
        console.log('🔄 إعادة البدء...');
        this.stats = { applied: 0, skipped: 0, rejected: 0, total: 0 };
        this.updateStats();
        await this.saveSettings();
        
        if (this.isRunning) {
            await this.stopAutomation();
            await this.delay(1000);
        }
        await this.startAutomation();
    }

    // باقي الدوال تبقى كما هي...
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

    handleMessage(message) {
        console.log('📨 استلام رسالة من content script:', message.action);
        
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
        this.isRunning = false;
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
        console.log('📢', message);
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
        console.error('❌', message);
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
        console.log('🎯 تهيئة popup...');
        new JadaratAutoPopup();
    } catch (error) {
        console.error('Error initializing popup:', error);
    }
});