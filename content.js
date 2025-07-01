// جدارات أوتو - Content Script النظيف 100%
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى');

// منع التكرار
if (window.jadaratAutoContentLoaded) {
    console.log('جدارات أوتو: المحتوى محمل مسبقاً');
} else {
    window.jadaratAutoContentLoaded = true;

    class JadaratAutoContent {
        constructor() {
            this.isRunning = false;
            this.isPaused = false;
            this.settings = {
                delayTime: 3,
                mode: 'normal',
                soundEnabled: true
            };
            
            this.stats = {
                applied: 0,
                skipped: 0,
                rejected: 0,
                total: 0
            };

            this.currentPage = 1;
            this.currentJobIndex = 0;
            this.totalJobs = 0;
            
            this.initializeListeners();
            this.checkPageType();
            this.addVisualIndicator();
            
            console.log('✅ جدارات أوتو: تم التهيئة بنجاح');
        }

        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sendResponse);
                return true;
            });
        }

        checkPageType() {
            const url = window.location.href;
            console.log('🔍 فحص نوع الصفحة:', url);
            
            const pageText = document.body.textContent;
            
            // مؤشرات صفحة تفاصيل الوظيفة
            const detailsIndicators = [
                'نوع العمل',
                'الراتب', 
                'المنطقة',
                'المؤهل العلمي',
                'سنوات الخبرة'
            ];
            
            let detailsScore = 0;
            for (const indicator of detailsIndicators) {
                if (pageText.includes(indicator)) {
                    detailsScore++;
                }
            }
            
            // فحص وجود عدة روابط وظائف
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 2;
            
            // تحديد نوع الصفحة
            if (detailsScore >= 3) {
                this.pageType = 'jobDetails';
                console.log('📄 صفحة تفاصيل الوظيفة');
            } else if (hasMultipleJobs || url.includes('ExploreJobs') || url.includes('JobTab=1')) {
                this.pageType = 'jobList';
                console.log('📋 صفحة قائمة الوظائف');
            } else {
                this.pageType = 'unknown';
                console.log('❓ صفحة غير معروفة');
            }
        }

        addVisualIndicator() {
            // إزالة المؤشر القديم
            const existingIndicator = document.getElementById('jadarat-auto-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // إنشاء مؤشر جديد
            const indicator = document.createElement('div');
            indicator.id = 'jadarat-auto-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #00d4ff, #7d2ae8);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
                display: none;
                font-family: Arial, sans-serif;
            `;
            indicator.textContent = '🎯 جدارات أوتو - جاهز';
            document.body.appendChild(indicator);
        }

        showIndicator(text, color = '#00d4ff') {
            const indicator = document.getElementById('jadarat-auto-indicator');
            if (indicator) {
                indicator.textContent = text;
                indicator.style.background = `linear-gradient(45deg, ${color}, #7d2ae8)`;
                indicator.style.display = 'block';
            }
        }

        hideIndicator() {
            const indicator = document.getElementById('jadarat-auto-indicator');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }

        async handleMessage(message, sendResponse) {
            console.log('📨 استلام رسالة:', message.action);
            
            try {
                switch (message.action) {
                    case 'PING':
                        sendResponse({ status: 'active' });
                        break;
                        
                    case 'START_AUTOMATION':
                        this.settings = message.settings || this.settings;
                        this.startAutomation();
                        sendResponse({ success: true });
                        break;
                        
                    case 'PAUSE_AUTOMATION':
                        this.pauseAutomation();
                        sendResponse({ success: true });
                        break;
                        
                    case 'STOP_AUTOMATION':
                        this.stopAutomation();
                        sendResponse({ success: true });
                        break;
                        
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('❌ خطأ في معالجة الرسالة:', error);
                sendResponse({ success: false, error: error.message });
            }
        }

        async startAutomation() {
            console.log('🚀 بدء الأتمتة');
            
            // فحص تسجيل الدخول
            if (!this.checkLoginStatus()) {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: '⚠️ يجب تسجيل الدخول أولاً' 
                });
                this.showIndicator('⚠️ غير مسجل دخول', '#ff4545');
                return;
            }
            
            if (this.pageType !== 'jobList') {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'يجب أن تكون في صفحة البحث عن الوظائف' 
                });
                return;
            }

            this.isRunning = true;
            this.isPaused = false;
            
            this.showIndicator('🚀 جاري العمل...', '#00ff88');
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 0, 
                text: 'بدء تحليل الصفحة...' 
            });

            await this.processCurrentPage();
        }

        pauseAutomation() {
            console.log('⏸️ إيقاف مؤقت');
            this.isPaused = true;
            this.showIndicator('⏸️ متوقف مؤقتاً', '#ffc107');
        }

        stopAutomation() {
            console.log('⏹️ إيقاف نهائي');
            this.isRunning = false;
            this.isPaused = false;
            this.hideIndicator();
        }

        async processCurrentPage() {
            if (!this.isRunning || this.isPaused) return;

            try {
                console.log('🔄 معالجة الصفحة الحالية');
                
                // انتظار تحميل الصفحة
                await this.wait(3000);
                
                const jobCards = this.getJobCards();
                this.totalJobs = jobCards.length;

                console.log(`💼 تم العثور على ${this.totalJobs} وظيفة`);

                if (this.totalJobs === 0) {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'لم يتم العثور على وظائف في هذه الصفحة' 
                    });
                    return;
                }

                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 0, 
                    text: `العثور على ${this.totalJobs} وظيفة` 
                });

                // معالجة كل وظيفة
                for (let i = 0; i < jobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        console.log('🛑 تم إيقاف العملية');
                        return;
                    }

                    const jobCard = jobCards[i];
                    console.log(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
                    
                    await this.processJob(jobCard, i + 1);
                    
                    const progress = ((i + 1) / jobCards.length) * 100;
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: progress, 
                        text: `الوظيفة ${i + 1}/${jobCards.length}` 
                    });

                    await this.wait(this.getRandomDelay());
                }

                // الانتقال للصفحة التالية
                await this.goToNextPage();

            } catch (error) {
                console.error('❌ خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        getJobCards() {
            console.log('🔍 البحث عن بطاقات الوظائف');
            
            const jobCards = [];
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            
            console.log(`🔗 تم العثور على ${jobLinks.length} رابط وظيفة`);
            
            for (const link of jobLinks) {
                const jobTitle = this.getJobTitle(link);
                const jobContainer = this.findJobContainer(link);
                
                if (jobContainer) {
                    const alreadyApplied = this.checkIfAlreadyApplied(jobContainer);
                    
                    if (!alreadyApplied) {
                        jobCards.push({
                            link: link,
                            container: jobContainer,
                            title: jobTitle
                        });
                        console.log(`✅ وظيفة متاحة: ${jobTitle}`);
                    } else {
                        console.log(`⏭️ تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                        this.stats.skipped++;
                    }
                }
            }

            console.log(`📊 المجموع: ${jobCards.length} وظيفة متاحة للتقديم`);
            return jobCards;
        }

        getJobTitle(link) {
            // البحث عن عنوان الوظيفة
            const titleSelectors = [
                'span.heading4',
                '.heading4',
                'span[data-expression]',
                'span'
            ];
            
            for (const selector of titleSelectors) {
                const element = link.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            
            return 'وظيفة غير محددة';
        }

        findJobContainer(link) {
            // البحث عن الحاوي الأب
            let container = link;
            
            for (let i = 0; i < 8; i++) {
                if (!container.parentElement) break;
                
                container = container.parentElement;
                
                // التحقق من وجود معلومات الوظيفة
                const hasJobInfo = container.textContent.includes('المدينة') || 
                                 container.textContent.includes('تاريخ النشر');
                
                if (hasJobInfo) {
                    return container;
                }
            }
            
            return link.closest('[data-container]') || link.parentElement;
        }

        checkIfAlreadyApplied(container) {
            // فحص أيقونة "تم التقدم"
            const tickIcon = container.querySelector('img[src*="tickcircle.svg"]');
            if (tickIcon) {
                return true;
            }
            
            // فحص النص
            const text = container.textContent || '';
            if (text.includes('تم التقدم') || text.includes('تم التقديم')) {
                return true;
            }
            
            return false;
        }

        async processJob(jobCard, jobIndex) {
            try {
                const jobTitle = jobCard.title;
                console.log(`🎯 معالجة: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                // تمييز الرابط
                this.highlightElement(jobCard.link);

                // النقر على الوظيفة
                console.log('👆 النقر على رابط الوظيفة');
                this.clickElement(jobCard.link);
                
                // انتظار التنقل
                await this.waitForNavigation();
                await this.wait(3000);
                
                // التحقق من نوع الصفحة
                this.checkPageType();
                
                if (this.pageType === 'jobDetails') {
                    console.log('✅ وصلنا لصفحة التفاصيل');
                    
                    // التعامل مع النوافذ المنبثقة
                    await this.handlePopups();
                    
                    // فحص التقديم المسبق
                    const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                    
                    if (alreadyApplied) {
                        this.stats.skipped++;
                        this.sendMessage('UPDATE_CURRENT_JOB', { 
                            jobTitle: jobTitle, 
                            status: 'skipped' 
                        });
                        console.log('⏭️ مقدم عليها مسبقاً');
                    } else {
                        // محاولة التقديم
                        const result = await this.applyForJob();
                        
                        if (result.success) {
                            this.stats.applied++;
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'success' 
                            });
                            console.log('✅ تم التقديم بنجاح');
                            
                        } else if (result.type === 'rejection') {
                            this.stats.rejected = (this.stats.rejected || 0) + 1;
                            this.saveRejectionData(jobTitle, result.reason);
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'rejected',
                                reason: result.reason
                            });
                            console.log('❌ تم الرفض:', result.reason);
                            
                        } else {
                            this.stats.skipped++;
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'error',
                                reason: result.reason
                            });
                            console.log('⚠️ فشل التقديم:', result.reason);
                        }
                    }

                    this.stats.total++;
                    this.sendMessage('UPDATE_STATS', { stats: this.stats });

                    // العودة للقائمة
                    await this.goBackToJobList();
                    
                } else {
                    throw new Error('فشل في فتح صفحة التفاصيل');
                }

            } catch (error) {
                console.error('❌ خطأ في معالجة الوظيفة:', error);
                this.stats.skipped++;
                this.stats.total++;
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: 'خطأ في المعالجة', 
                    status: 'error' 
                });
                
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                try {
                    await this.goBackToJobList();
                } catch (backError) {
                    console.error('❌ خطأ في العودة:', backError);
                }
            }
        }

        async handlePopups() {
            console.log('🔍 فحص النوافذ المنبثقة');
            
            await this.wait(1500);
            
            const popups = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const popup of popups) {
                if (popup.offsetWidth > 0 && popup.offsetHeight > 0) {
                    console.log('💬 تم العثور على نافذة منبثقة');
                    
                    const buttons = popup.querySelectorAll('button, a');
                    for (const btn of buttons) {
                        const btnText = btn.textContent.trim();
                        if (btnText.includes('موافق') || 
                            btnText.includes('إغلاق') ||
                            btnText.includes('×')) {
                            
                            console.log('🚫 إغلاق النافذة المنبثقة');
                            this.clickElement(btn);
                            await this.wait(2000);
                            return;
                        }
                    }
                }
            }
        }

        async checkIfAlreadyAppliedInDetails() {
            console.log('🔍 فحص حالة التقديم في التفاصيل');
            
            await this.wait(2000);
            
            const allButtons = document.querySelectorAll('button, a');
            
            for (const button of allButtons) {
                const text = button.textContent.trim();
                if (text.includes('استعراض طلب التقديم')) {
                    console.log('✅ وجد زر "استعراض طلب التقديم"');
                    return true;
                }
            }
            
            return false;
        }

        async applyForJob() {
            console.log('📝 بدء عملية التقديم');
            
            try {
                await this.wait(2000);
                
                const submitButton = this.findSubmitButton();
                
                if (!submitButton) {
                    return { success: false, reason: 'لم يتم العثور على زر التقديم' };
                }

                console.log('👆 النقر على زر التقديم');
                this.clickElement(submitButton);
                
                // انتظار نافذة التأكيد
                await this.wait(3000);
                await this.handleConfirmationDialog();
                
                // انتظار نافذة النتيجة
                await this.wait(3000);
                const result = await this.handleResultDialog();
                
                return result;

            } catch (error) {
                console.error('❌ خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        findSubmitButton() {
            console.log('🔍 البحث عن زر التقديم');
            
            const allButtons = document.querySelectorAll('button, input[type="submit"], a');
            
            for (const button of allButtons) {
                const text = (button.textContent || button.value || '').trim();
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                const isEnabled = !button.disabled && !button.classList.contains('disabled');
                
                if (text === 'تقديم' && isVisible && isEnabled) {
                    console.log('✅ تم العثور على زر التقديم');
                    return button;
                }
            }
            
            console.log('❌ لم يتم العثور على زر التقديم');
            return null;
        }

        async handleConfirmationDialog() {
            console.log('🔍 البحث عن نافذة التأكيد');
            
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    
                    if (text.includes('هل أنت متأكد من التقديم')) {
                        console.log('✅ تم العثور على نافذة التأكيد');
                        
                        const confirmButton = Array.from(dialog.querySelectorAll('button')).find(btn => {
                            return btn.textContent.trim() === 'تقديم';
                        });
                        
                        if (confirmButton) {
                            console.log('✅ النقر على زر التأكيد');
                            this.clickElement(confirmButton);
                            await this.wait(2000);
                            return;
                        }
                    }
                }
            }
        }

        async handleResultDialog() {
            console.log('🔍 البحث عن نافذة النتيجة');
            
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    
                    // نافذة النجاح
                    if (text.includes('تم التقديم بنجاح')) {
                        console.log('✅ تم التقديم بنجاح');
                        
                        const closeButton = this.findCloseButton(dialog);
                        if (closeButton) {
                            this.clickElement(closeButton);
                            await this.wait(2000);
                        }
                        
                        return { success: true, reason: 'تم التقديم بنجاح' };
                    }
                    
                    // نافذة الرفض
                    else if (text.includes('عذراً ، لا يمكنك التقديم') || text.includes('غير مؤهل')) {
                        console.log('❌ تم رفض التقديم');
                        
                        const rejectionReason = this.extractRejectionReason(text);
                        
                        const closeButton = this.findCloseButton(dialog);
                        if (closeButton) {
                            this.clickElement(closeButton);
                            await this.wait(2000);
                        }
                        
                        return { 
                            success: false, 
                            reason: rejectionReason,
                            type: 'rejection' 
                        };
                    }
                }
            }
            
            return { success: false, reason: 'لم يتم العثور على نتيجة', type: 'unknown' };
        }

        extractRejectionReason(dialogText) {
            const reasons = [
                'الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب',
                'لا يطابق شرط الخبرة المطلوبة',
                'لا يطابق شرط العمر المطلوب',
                'لا يطابق شرط الجنس المطلوب',
                'انتهت فترة التقديم'
            ];
            
            for (const reason of reasons) {
                if (dialogText.includes(reason)) {
                    return reason;
                }
            }
            
            return 'سبب غير محدد';
        }

        findCloseButton(dialog) {
            const buttons = dialog.querySelectorAll('button');
            
            for (const btn of buttons) {
                const text = btn.textContent.trim().toLowerCase();
                if (text === 'إغلاق' || text === 'اغلاق' || text === 'موافق') {
                    return btn;
                }
            }
            
            return buttons[buttons.length - 1];
        }

        async goBackToJobList() {
            console.log('🔙 العودة لقائمة الوظائف');
            
            window.history.back();
            await this.waitForNavigation();
            await this.wait(3000);
            
            this.checkPageType();
            
            if (this.pageType === 'jobList') {
                console.log('✅ تم العودة بنجاح');
                window.scrollTo(0, 0);
            } else {
                console.log('⚠️ قد تكون العودة لم تنجح');
            }
        }

        async goToNextPage() {
            console.log('🔍 البحث عن الصفحة التالية');
            
            const nextButton = document.querySelector('button[aria-label="go to next page"]:not([disabled])');
            
            if (nextButton) {
                console.log('➡️ الانتقال للصفحة التالية');
                this.currentPage++;
                
                this.clickElement(nextButton);
                await this.waitForNavigation();
                await this.wait(4000);
                
                await this.processCurrentPage();
            } else {
                console.log('🏁 انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
            }
        }

        checkLoginStatus() {
            const allButtons = document.querySelectorAll('button, a');
            
            for (const btn of allButtons) {
                if (btn.textContent.includes('تسجيل الدخول') && btn.offsetWidth > 0) {
                    return false;
                }
            }
            
            return true;
        }

        async saveRejectionData(jobTitle, rejectionReason) {
            try {
                const rejectionData = {
                    jobTitle: jobTitle,
                    reason: rejectionReason,
                    timestamp: new Date().toISOString(),
                    date: new Date().toLocaleDateString('ar-SA'),
                    time: new Date().toLocaleTimeString('ar-SA')
                };
                
                this.sendMessage('SAVE_REJECTION_DATA', { rejectionData });
                
            } catch (error) {
                console.error('❌ خطأ في حفظ بيانات الرفض:', error);
            }
        }

        highlightElement(element) {
            if (element) {
                const originalStyle = element.style.cssText;
                element.style.cssText += `
                    border: 3px solid #00d4ff !important; 
                    background: rgba(0, 212, 255, 0.1) !important;
                `;
                
                setTimeout(() => {
                    element.style.cssText = originalStyle;
                }, 2000);
            }
        }

        clickElement(element) {
            if (!element) return;
            
            // إزالة target لتجنب التبويب الجديد
            if (element.tagName === 'A') {
                element.removeAttribute('target');
                element.target = '_self';
            }
            
            // تمرير العنصر إلى منتصف الشاشة
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // انتظار التمرير ثم النقر
            setTimeout(() => {
                try {
                    element.click();
                } catch (error1) {
                    try {
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        element.dispatchEvent(event);
                    } catch (error2) {
                        if (element.href) {
                            window.location.href = element.href;
                        }
                    }
                }
            }, 500);
        }

        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3;
            return base + (Math.random() * 2 - 1) * variation;
        }

        async waitForNavigation() {
            return new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 50;
                
                const checkForChange = () => {
                    attempts++;
                    if (document.readyState === 'complete' || attempts >= maxAttempts) {
                        setTimeout(resolve, 500);
                    } else {
                        setTimeout(checkForChange, 100);
                    }
                };
                checkForChange();
            });
        }

        sendMessage(action, data = {}) {
            try {
                const message = { action, ...data };
                
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ خطأ في إرسال الرسالة:', chrome.runtime.lastError);
                    }
                });
            } catch (error) {
                console.error('❌ خطأ في إرسال الرسالة:', error);
            }
        }
    }

    // تهيئة المحتوى
    function initializeContent() {
        try {
            if (!window.jadaratAutoContent) {
                window.jadaratAutoContent = new JadaratAutoContent();
            }
        } catch (error) {
            console.error('❌ خطأ في التهيئة:', error);
        }
    }

    // بدء التهيئة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContent);
    } else {
        initializeContent();
    }

    // مراقبة تغيير URL
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(() => {
                if (window.jadaratAutoContent) {
                    window.jadaratAutoContent.checkPageType();
                }
            }, 1000);
        }
    });

    observer.observe(document, { subtree: true, childList: true });
}