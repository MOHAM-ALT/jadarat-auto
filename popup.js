// جدارات أوتو - Popup Script المُصحح نهائياً - حل شامل لمشاكل الاتصال
class JadaratAutoPopup {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTab = null;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.connectionTimeout = 10000; // 10 ثواني
        this.isConnected = false;
        
        this.stats = {
            applied: 0,
            skipped: 0,
            rejected: 0,
            total: 0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.showLoadingOverlay();
        this.initializeConnection();
    }

    initializeElements() {
        // أزرار التحكم
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.closeBtn = document.getElementById('closeBtn');

        // الإعدادات
        this.delayRange = document.getElementById('delayRange');
        this.delayValue = document.getElementById('delayValue');
        this.modeSelect = document.getElementById('modeSelect');
        this.soundToggle = document.getElementById('soundToggle');

        // الإحصائيات
        this.appliedCount = document.getElementById('appliedCount');
        this.skippedCount = document.getElementById('skippedCount');
        this.rejectedCount = document.getElementById('rejectedCount');
        this.totalCount = document.getElementById('totalCount');

        // التقدم
        this.progressFill = document.getElementById('progressFill');
        this.progressPercentage = document.getElementById('progressPercentage');
        this.progressText = document.getElementById('progressText');
        this.currentJob = document.getElementById('currentJob');

        // حالة الاتصال
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.connectionDetails = document.getElementById('connectionDetails');
        this.footerStatusIndicator = document.getElementById('footerStatusIndicator');
        this.footerStatusText = document.getElementById('footerStatusText');

        // بيانات الرفض
        this.exportBtn = document.getElementById('exportBtn');
        this.clearRejectionBtn = document.getElementById('clearRejectionBtn');
        this.clearRejectedJobsBtn = document.getElementById('clearRejectedJobsBtn');
        this.rejectionInfo = document.getElementById('rejectionInfo');

        // التشخيص
        this.debugSection = document.getElementById('debugSection');
        this.debugPageType = document.getElementById('debugPageType');
        this.debugCurrentUrl = document.getElementById('debugCurrentUrl');
        this.debugLastError = document.getElementById('debugLastError');
        this.debugReconnectBtn = document.getElementById('debugReconnectBtn');
        this.debugReloadBtn = document.getElementById('debugReloadBtn');

        // النوافذ المنبثقة
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorModal = document.getElementById('errorModal');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorRetryBtn = document.getElementById('errorRetryBtn');
        this.errorCloseBtn = document.getElementById('errorCloseBtn');

        // أزرار إضافية
        this.helpBtn = document.getElementById('helpBtn');
        this.aboutBtn = document.getElementById('aboutBtn');
    }

    bindEvents() {
        // أزرار التحكم
        this.startBtn?.addEventListener('click', () => this.startAutomation());
        this.pauseBtn?.addEventListener('click', () => this.pauseAutomation());
        this.stopBtn?.addEventListener('click', () => this.stopAutomation());
        this.resumeBtn?.addEventListener('click', () => this.resumeAutomation());
        this.restartBtn?.addEventListener('click', () => this.restartAutomation());
        this.closeBtn?.addEventListener('click', () => window.close());

        // الإعدادات
        this.delayRange?.addEventListener('input', (e) => {
            this.delayValue.textContent = e.target.value;
            this.saveSettings();
        });

        this.modeSelect?.addEventListener('change', () => this.saveSettings());
        this.soundToggle?.addEventListener('change', () => this.saveSettings());

        // بيانات الرفض
        this.exportBtn?.addEventListener('click', () => this.exportRejectionData());
        this.clearRejectionBtn?.addEventListener('click', () => this.clearRejectionData());
        this.clearRejectedJobsBtn?.addEventListener('click', () => this.clearRejectedJobs());

        // التشخيص
        this.debugReconnectBtn?.addEventListener('click', () => this.reconnectToContentScript());
        this.debugReloadBtn?.addEventListener('click', () => this.reloadCurrentTab());

        // النوافذ المنبثقة
        this.errorRetryBtn?.addEventListener('click', () => this.retryConnection());
        this.errorCloseBtn?.addEventListener('click', () => this.hideErrorModal());

        // أزرار إضافية
        this.helpBtn?.addEventListener('click', () => this.showHelp());
        this.aboutBtn?.addEventListener('click', () => this.showAbout());

        // مستمع الرسائل المحسن
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
            return false; // إنهاء القناة فوراً
        });

        // مراقبة تغيير التبويب
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (tabId === this.currentTab?.id && changeInfo.status === 'complete') {
                setTimeout(() => this.checkConnection(), 2000);
            }
        });
    }

    async initializeConnection() {
        console.log('🔍 بدء تهيئة الاتصال...');
        
        try {
            // الحصول على التبويب الحالي
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            // فحص URL
            if (!tab.url || !tab.url.includes('jadarat.sa')) {
                this.showError('يرجى الانتقال إلى موقع جدارات (jadarat.sa)');
                this.updateConnectionStatus('disconnected', 'ليس في موقع جدارات');
                this.hideLoadingOverlay();
                this.showDebugSection('URL غير صحيح', tab.url);
                return;
            }

            this.updateConnectionStatus('connecting', 'جاري الاتصال...');
            
            // محاولة الاتصال
            await this.establishConnection();
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة الاتصال:', error);
            this.showError(`خطأ في التهيئة: ${error.message}`);
            this.updateConnectionStatus('disconnected', 'فشل التهيئة');
            this.hideLoadingOverlay();
        }
    }

    async establishConnection() {
        console.log('📡 محاولة تأسيس الاتصال...');
        
        for (let attempt = 1; attempt <= this.maxConnectionAttempts; attempt++) {
            try {
                console.log(`🔄 محاولة الاتصال ${attempt}/${this.maxConnectionAttempts}`);
                
                this.updateConnectionDetails(`محاولة ${attempt}/${this.maxConnectionAttempts}...`);

                // محاولة ping
                const response = await this.sendMessageWithTimeout({ action: 'PING' }, 8000);

                if (response && response.status === 'active') {
                    console.log('✅ نجح الاتصال!');
                    this.handleSuccessfulConnection(response);
                    return;
                }

                console.log('⚠️ لا يوجد رد، محاولة حقن content script...');
                await this.injectContentScript();

                // محاولة ping بعد الحقن
                const retryResponse = await this.sendMessageWithTimeout({ action: 'PING' }, 5000);
                
                if (retryResponse && retryResponse.status === 'active') {
                    console.log('✅ نجح الاتصال بعد الحقن!');
                    this.handleSuccessfulConnection(retryResponse);
                    return;
                }

            } catch (error) {
                console.error(`❌ فشلت المحاولة ${attempt}:`, error.message);
                
                if (attempt < this.maxConnectionAttempts) {
                    await this.delay(2000 * attempt); // انتظار متزايد
                } else {
                    this.handleConnectionFailure(error);
                }
            }
        }
    }

    async sendMessageWithTimeout(message, timeoutMs = 8000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Message timeout'));
            }, timeoutMs);

            try {
                chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
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

            console.log('✅ تم حقن content script');
            await this.delay(3000); // انتظار التحميل

        } catch (error) {
            console.error('❌ فشل في حقن content script:', error);
            throw new Error(`فشل في حقن content script: ${error.message}`);
        }
    }

    handleSuccessfulConnection(response) {
        console.log('🎉 تم تأسيس الاتصال بنجاح');
        
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        this.updateConnectionStatus('connected', 'متصل وجاهز');
        this.updateConnectionDetails(`نوع الصفحة: ${response.pageType || 'غير محدد'}`);
        
        // تحديث معلومات التشخيص
        if (this.debugPageType) this.debugPageType.textContent = response.pageType || 'غير محدد';
        if (this.debugCurrentUrl) this.debugCurrentUrl.textContent = response.url || 'غير محدد';
        if (this.debugLastError) this.debugLastError.textContent = 'لا توجد أخطاء';

        this.enableControls();
        this.hideLoadingOverlay();
        this.hideErrorModal();
        this.hideDebugSection();
        
        // تحميل الإعدادات والبيانات
        this.loadSettings();
    }

    handleConnectionFailure(error) {
        console.error('💥 فشل في جميع محاولات الاتصال');
        
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'فشل في الاتصال');
        this.updateConnectionDetails('تعذر الاتصال مع الصفحة');
        
        this.disableAllControls();
        this.hideLoadingOverlay();
        
        this.showError(`فشل في الاتصال مع الصفحة.\n\nالمشكلة: ${error.message}\n\nتأكد من أنك في موقع جدارات وأعد المحاولة.`);
        
        // إظهار قسم التشخيص
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

    updateConnectionDetails(text) {
        if (this.connectionDetails) {
            const detailElement = this.connectionDetails.querySelector('.detail-text');
            if (detailElement) {
                detailElement.textContent = text;
            }
        }
    }

    enableControls() {
        if (this.startBtn) this.startBtn.disabled = false;
        if (this.restartBtn) this.restartBtn.disabled = false;
        if (this.exportBtn) this.exportBtn.disabled = false;
        if (this.clearRejectionBtn) this.clearRejectionBtn.disabled = false;
        if (this.clearRejectedJobsBtn) this.clearRejectedJobsBtn.disabled = false;

    }

    disableAllControls() {
        if (this.startBtn) this.startBtn.disabled = true;
        if (this.pauseBtn) this.pauseBtn.disabled = true;
        if (this.stopBtn) this.stopBtn.disabled = true;
        if (this.resumeBtn) this.resumeBtn.disabled = true;
        if (this.restartBtn) this.restartBtn.disabled = true;
        if (this.exportBtn) this.exportBtn.disabled = true;
        if (this.clearRejectionBtn) this.clearRejectionBtn.disabled = true;
        if (this.clearRejectedJobsBtn) this.clearRejectedJobsBtn.disabled = true;

    }

    showDebugSection(error, url) {
        if (this.debugSection) {
            this.debugSection.style.display = 'block';
            
            if (this.debugLastError) this.debugLastError.textContent = error || 'غير محدد';
            if (this.debugCurrentUrl) this.debugCurrentUrl.textContent = url || 'غير محدد';
            if (this.debugPageType) this.debugPageType.textContent = 'غير متاح';
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
        this.showLoadingOverlay();
        this.connectionAttempts = 0;
        await this.initializeConnection();
    }

    async reconnectToContentScript() {
        console.log('🔌 إعادة الاتصال مع content script...');
        this.showLoadingOverlay();
        this.updateConnectionStatus('connecting', 'إعادة الاتصال...');
        
        try {
            await this.establishConnection();
        } catch (error) {
            console.error('❌ فشل في إعادة الاتصال:', error);
            this.handleConnectionFailure(error);
        }
    }

    async reloadCurrentTab() {
        console.log('🔄 إعادة تحميل الصفحة...');
        
        try {
            await chrome.tabs.reload(this.currentTab.id);
            
            this.showLoadingOverlay();
            this.updateConnectionStatus('connecting', 'إعادة تحميل الصفحة...');
            
            // انتظار تحميل الصفحة ثم محاولة الاتصال
            setTimeout(async () => {
                await this.initializeConnection();
            }, 3000);
            
        } catch (error) {
            console.error('❌ فشل في إعادة التحميل:', error);
            this.showError(`فشل في إعادة تحميل الصفحة: ${error.message}`);
        }
    }

    async checkConnection() {
        if (!this.isConnected) return;
        
        try {
            const response = await this.sendMessageWithTimeout({ action: 'PING' }, 3000);
            
            if (!response || response.status !== 'active') {
                console.log('⚠️ فقدان الاتصال، محاولة إعادة الاتصال...');
                this.isConnected = false;
                await this.reconnectToContentScript();
            }
        } catch (error) {
            console.log('⚠️ خطأ في فحص الاتصال:', error.message);
            this.isConnected = false;
            await this.reconnectToContentScript();
        }
    }

    async startAutomation() {
        try {
            console.log('🚀 بدء التشغيل...');

            // التأكد من الاتصال قبل البدء
            if (!this.isConnected) {
                await this.ensureConnection();
            }
            
            this.isRunning = true;
            this.isPaused = false;
            
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
            
            this.updateConnectionStatus('connected', 'متصل - يعمل');
            this.setProgress(0, 'بدء التشغيل...');

            const settings = {
                delayTime: parseInt(this.delayRange.value),
                mode: this.modeSelect.value,
                soundEnabled: this.soundToggle.checked
            };

            console.log('📤 إرسال أمر البدء مع الإعدادات:', settings);

            // إرسال رسالة بدون انتظار رد طويل
            this.sendMessageFireAndForget({
                action: 'START_AUTOMATION',
                settings: settings
            });

            console.log('✅ تم إرسال أمر البدء بنجاح');

        } catch (error) {
            console.error('❌ خطأ في بدء التشغيل:', error);
            this.showError(`فشل في بدء التشغيل: ${error.message}`);
            this.stopAutomation();
        }
    }

    sendMessageFireAndForget(message) {
        try {
            chrome.tabs.sendMessage(this.currentTab.id, message, () => {
                if (chrome.runtime.lastError) {
                    console.log('رسالة مرسلة بدون رد:', chrome.runtime.lastError.message);
                }
            });
        } catch (error) {
            console.error('خطأ في إرسال الرسالة:', error);
        }
    }

    async ensureConnection() {
        if (this.isConnected) return;
        
        console.log('🔄 التأكد من الاتصال...');
        await this.reconnectToContentScript();
        
        if (!this.isConnected) {
            throw new Error('فشل في تأسيس الاتصال');
        }
    }

    async pauseAutomation() {
        console.log('⏸️ إيقاف مؤقت...');
        this.isPaused = true;
        
        this.pauseBtn.disabled = true;
        this.startBtn.disabled = false;
        
        this.updateConnectionStatus('connected', 'متصل - متوقف مؤقتاً');
        
        this.sendMessageFireAndForget({ action: 'PAUSE_AUTOMATION' });
    }

    async stopAutomation() {
        console.log('⏹️ إيقاف نهائي...');
        this.isRunning = false;
        this.isPaused = false;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.updateConnectionStatus('connected', 'متصل - جاهز');
        this.setProgress(0, 'تم الإيقاف');
        this.currentJob.innerHTML = '<span class="job-status">تم الإيقاف</span>';

        this.sendMessageFireAndForget({ action: 'STOP_AUTOMATION' });
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
        
        try {
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
        } catch (error) {
            console.error('خطأ في معالجة الرسالة:', error);
        }
    }

    updateStats() {
        if (this.appliedCount) this.appliedCount.textContent = this.stats.applied || 0;
        if (this.skippedCount) this.skippedCount.textContent = this.stats.skipped || 0;
        if (this.rejectedCount) this.rejectedCount.textContent = this.stats.rejected || 0;
        if (this.totalCount) this.totalCount.textContent = this.stats.total || 0;
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
    setProgress(percentage, text) {
        if (this.progressFill) {
            this.progressFill.style.width = percentage + '%';
        }
        if (this.progressPercentage) {
            this.progressPercentage.textContent = Math.round(percentage) + '%';
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

    onAutomationCompleted() {
        this.isRunning = false;
        this.isPaused = false;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.updateConnectionStatus('connected', 'مكتمل');
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
        this.updateConnectionStatus('connected', 'خطأ');
        this.currentJob.innerHTML = `<span class="job-status" style="color: #ff4545">خطأ: ${error}</span>`;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.stopBtn.disabled = true;
        
        this.showError(error);
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
async clearJobMemory() {
    if (confirm('هل أنت متأكد من مسح ذاكرة الوظائف المعالجة؟\n\nسيتم التقديم مجدداً على جميع الوظائف المرفوضة سابقاً.')) {
        try {
            // إرسال أمر مسح الذاكرة لـ content script
            this.sendMessageFireAndForget({ action: 'CLEAR_JOB_MEMORY' });
            
            // مسح الذاكرة من التخزين المحلي
            await chrome.storage.local.remove(['jobMemory']);
            
            this.showNotification('تم مسح ذاكرة الوظائف بنجاح');
        } catch (error) {
            console.error('Error clearing job memory:', error);
            this.showError('خطأ في مسح ذاكرة الوظائف');
        }
    }
}
    showHelp() {
        const helpText = `
مساعدة جدارات أوتو:

1. تأكد من تسجيل الدخول في موقع جدارات
2. انتقل لصفحة قائمة الوظائف أو تفاصيل وظيفة
3. اضغط "بدء التشغيل"
4. ستبدأ الإضافة بالتقديم تلقائياً

إذا واجهت مشاكل:
- أعد تحميل الصفحة
- تأكد من الاتصال بالإنترنت
- جرب إعادة تشغيل المتصفح
        `;
        
        alert(helpText);
    }

    showAbout() {
        const aboutText = `
جدارات أوتو v1.0.1

إضافة Chrome لأتمتة التقديم على الوظائف في موقع جدارات.

الميزات:
✅ تقديم تلقائي على جميع الوظائف
✅ تخطي الوظائف المُقدم عليها مسبقاً
✅ إحصائيات مفصلة
✅ تصدير بيانات الرفض
✅ واجهة حديثة وسهلة الاستخدام

تم التطوير بواسطة الذكاء الاصطناعي
        `;
        
        alert(aboutText);
    }

    showNotification(message) {
        console.log('📢', message);
        
        // إشعار داخلي
        if (this.currentJob) {
            const originalContent = this.currentJob.innerHTML;
            this.currentJob.innerHTML = `<span class="job-status" style="color: #00ff88">${message}</span>`;
            
            setTimeout(() => {
                this.currentJob.innerHTML = originalContent;
            }, 5000);
        }

        // إشعار المتصفح
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

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// تهيئة popup عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🎯 تهيئة popup...');
        window.jadaratAutoPopup = new JadaratAutoPopup();
    } catch (error) {
        console.error('Error initializing popup:', error);
        
        // إظهار خطأ للمستخدم
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <h3>خطأ في تحميل الإضافة</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">إعادة المحاولة</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// مراقبة تحديثات التبويب
if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (window.jadaratAutoPopup && changeInfo.status === 'complete') {
            setTimeout(() => {
                window.jadaratAutoPopup.checkConnection();
            }, 2000);
        }
    });
}

// معالجة الأخطاء غير المتوقعة
window.addEventListener('error', (event) => {
    console.error('Global error in popup:', event.error);
    
    if (window.jadaratAutoPopup) {
        window.jadaratAutoPopup.showError(`خطأ غير متوقع: ${event.error.message}`);
    }
});

// معالجة الوعود المرفوضة
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in popup:', event.reason);
    
    if (window.jadaratAutoPopup) {
        window.jadaratAutoPopup.showError(`خطأ في العملية: ${event.reason}`);
    }
});

// دالة مساعدة لفحص صحة الإضافة
function checkExtensionHealth() {
    const health = {
        popup: !!window.jadaratAutoPopup,
        connection: window.jadaratAutoPopup?.isConnected || false,
        chrome: typeof chrome !== 'undefined',
        tabs: typeof chrome?.tabs !== 'undefined',
        runtime: typeof chrome?.runtime !== 'undefined'
    };
    
    console.log('🏥 فحص صحة الإضافة:', health);
    return health;
    
}

// إتاحة دالة الفحص عالمياً للتشخيص
window.checkExtensionHealth = checkExtensionHealth;
