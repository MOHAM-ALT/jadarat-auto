// جدارات أوتو - Content Script مُصحح نهائياً
(function() {
    'use strict';
    
    // تجنب التكرار
    if (window.jadaratAutoContentLoaded) {
        console.log('جدارات أوتو: المحتوى محمل مسبقاً');
        return;
    }
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
        }

        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sendResponse);
                return true;
            });
        }

        checkPageType() {
            const url = window.location.href;
            console.log('جدارات أوتو: فحص نوع الصفحة - URL:', url);
            
            const pageText = document.body.textContent;
            
            // مؤشرات صفحة تفاصيل الوظيفة
            const detailsIndicators = [
                'نوع العمل',
                'الراتب',
                'الجنس',
                'المنطقة', 
                'تاريخ بداية النشر',
                'تاريخ نهاية النشر',
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
            const jobLinks = document.querySelectorAll('a[data-link][href*="/Jadarat/JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 2;
            
            // تحديد نوع الصفحة
            if (detailsScore >= 4) {
                this.pageType = 'jobDetails';
                console.log('جدارات أوتو: 📄 صفحة تفاصيل الوظيفة');
            } else if (hasMultipleJobs || url.includes('ExploreJobs') || url.includes('JobTab=1')) {
                this.pageType = 'jobList';
                console.log('جدارات أوتو: 📋 صفحة قائمة الوظائف');
            } else {
                this.pageType = 'unknown';
                console.log('جدارات أوتو: ❓ صفحة غير معروفة');
            }
        }

        addVisualIndicator() {
            const existingIndicator = document.getElementById('jadarat-auto-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            const indicator = document.createElement('div');
            indicator.id = 'jadarat-auto-indicator';
            indicator.innerHTML = `
                <div style="
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
                ">
                    🎯 جدارات أوتو - جاهز
                </div>
            `;
            document.body.appendChild(indicator);
        }

        showIndicator(text, color) {
            color = color || '#00d4ff';
            const indicator = document.querySelector('#jadarat-auto-indicator div');
            if (indicator) {
                indicator.textContent = text;
                indicator.style.background = `linear-gradient(45deg, ${color}, #7d2ae8)`;
                indicator.style.display = 'block';
            }
        }

        hideIndicator() {
            const indicator = document.querySelector('#jadarat-auto-indicator div');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }

        async handleMessage(message, sendResponse) {
            console.log('جدارات أوتو: استلام رسالة:', message);
            
            try {
                switch (message.action) {
                    case 'PING':
                        sendResponse({ status: 'active' });
                        break;
                        
                    case 'START_AUTOMATION':
                        this.settings = message.settings;
                        setTimeout(async () => {
                            await this.startAutomation();
                        }
                }
            }
            
            console.log('جدارات أوتو: لم يتم العثور على نافذة النتيجة');
            return { success: false, reason: 'لم يتم العثور على نافذة النتيجة', type: 'unknown' };
        }

        extractRejectionReason(dialogText) {
            // استخراج سبب الرفض من النص
            const rejectionReasons = [
                'الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب',
                'لا يطابق شرط الخبرة المطلوبة',
                'لا يطابق شرط العمر المطلوب',
                'لا يطابق شرط الجنس المطلوب',
                'لا يطابق شرط الجنسية المطلوبة',
                'لا يطابق شرط المنطقة المطلوبة',
                'انتهت فترة التقديم',
                'تم الوصول للعدد المطلوب'
            ];
            
            for (const reason of rejectionReasons) {
                if (dialogText.includes(reason)) {
                    return reason;
                }
            }
            
            // إذا لم نجد سبب محدد، نعيد النص كاملاً
            const lines = dialogText.split('\n').filter(line => line.trim().length > 10);
            return lines.find(line => 
                line.includes('لا يطابق') || 
                line.includes('غير مؤهل') || 
                line.includes('انتهت') ||
                line.includes('تم الوصول')
            ) || 'سبب غير محدد';
        }

        extractErrorReason(dialogText) {
            // استخراج سبب الخطأ التقني
            const lines = dialogText.split('\n').filter(line => line.trim().length > 5);
            return lines.find(line => 
                line.includes('خطأ') || 
                line.includes('فشل') ||
                line.includes('مشكلة')
            ) || 'خطأ تقني غير محدد';
        }

        findCloseButton(dialog) {
            // البحث عن أزرار الإغلاق المختلفة
            const closeButtons = dialog.querySelectorAll('button');
            
            for (const btn of closeButtons) {
                const text = btn.textContent.trim().toLowerCase();
                if (text === 'إغلاق' || text === 'اغلاق' || 
                    text === 'موافق' || text === 'ok' || text === 'تم') {
                    return btn;
                }
            }
            
            // إذا لم نجد، نأخذ آخر زر
            return closeButtons[closeButtons.length - 1];
        }

        async goBackToJobList() {
            console.log('جدارات أوتو: العودة لقائمة الوظائف باستخدام history.back()');
            
            window.history.back();
            await this.waitForNavigation();
            await this.delay(2000);
            
            // التحقق من العودة
            this.checkPageType();
            
            if (this.pageType === 'jobList') {
                console.log('جدارات أوتو: ✅ تم العودة لقائمة الوظائف بنجاح');
                window.scrollTo(0, 0);
            } else {
                console.log('جدارات أوتو: ⚠️ قد تكون العودة لم تنجح، نوع الصفحة:', this.pageType);
            }
        }

        async goToNextPage() {
            console.log('جدارات أوتو: البحث عن الصفحة التالية');
            
            const nextButton = document.querySelector('button[aria-label="go to next page"]:not([disabled])');
            
            if (nextButton) {
                console.log('جدارات أوتو: الانتقال للصفحة التالية');
                this.currentPage++;
                this.currentJobIndex = 0;
                
                this.clickElement(nextButton);
                await this.waitForNavigation();
                await this.delay(4000); // 4 ثواني لصفحة الوظائف
                
                await this.processCurrentPage();
            } else {
                console.log('جدارات أوتو: انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
            }
        }

        checkLoginStatus() {
            console.log('جدارات أوتو: فحص حالة تسجيل الدخول');
            
            // البحث عن زر تسجيل الدخول
            const allButtons = document.querySelectorAll('button, a');
            
            for (const btn of allButtons) {
                if (btn.textContent.includes('تسجيل الدخول') && btn.offsetWidth > 0) {
                    console.log('جدارات أوتو: ⚠️  المستخدم غير مسجل دخول');
                    return false;
                }
            }
            
            console.log('جدارات أوتو: ✅ المستخدم مسجل دخول');
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
                
                console.log('جدارات أوتو: حفظ بيانات الرفض:', rejectionData);
                
                // إرسال للخلفية لحفظها
                this.sendMessage('SAVE_REJECTION_DATA', { rejectionData });
                
            } catch (error) {
                console.error('جدارات أوتو: خطأ في حفظ بيانات الرفض:', error);
            }
        }

        highlightElement(element) {
            if (element) {
                const originalStyle = element.style.cssText;
                element.style.cssText += `
                    border: 3px solid #00d4ff !important; 
                    background: rgba(0, 212, 255, 0.1) !important;
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5) !important;
                `;
                
                setTimeout(() => {
                    element.style.cssText = originalStyle;
                }, 2000);
            }
        }

        clickElement(element) {
            if (element) {
                console.log('جدارات أوتو: النقر على العنصر:', element);
                
                // التأكد من عدم فتح تبويب جديد
                if (element.tagName === 'A') {
                    element.removeAttribute('target');
                    element.target = '_self';
                }
                
                // تمرير العنصر إلى منتصف الشاشة
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // تأثير بصري للنقر
                const originalStyle = element.style.cssText;
                element.style.cssText += 'border: 3px solid #00d4ff !important; background: rgba(0, 212, 255, 0.1) !important;';
                
                setTimeout(() => {
                    element.style.cssText = originalStyle;
                }, 1000);
                
                // النقر الفعلي
                try {
                    element.click();
                } catch (e) {
                    // طريقة بديلة للنقر
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    element.dispatchEvent(event);
                }
            }
        }

        async delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3; // تنويع 30%
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

        saveCurrentPosition() {
            const position = {
                page: this.currentPage,
                jobIndex: this.currentJobIndex,
                stats: this.stats,
                url: window.location.href,
                timestamp: Date.now()
            };
            
            console.log('جدارات أوتو: حفظ الموقع الحالي:', position);
            this.sendMessage('SAVE_POSITION', { position });
        }

        sendMessage(action, data) {
            data = data || {};
            try {
                const message = {
                    action: action,
                    ...data
                };
                
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('جدارات أوتو: خطأ في إرسال الرسالة:', chrome.runtime.lastError);
                    }
                });
            } catch (error) {
                console.error('جدارات أوتو: خطأ في إرسال الرسالة:', error);
            }
        }
    }

    // إنشاء المتغير العام
    let jadaratAutoContent = null;

    function initializeContent() {
        try {
            if (!jadaratAutoContent) {
                jadaratAutoContent = new JadaratAutoContent();
                console.log('جدارات أوتو: تم تهيئة المحتوى بنجاح - الإصدار النهائي المُصحح');
            }
        } catch (error) {
            console.error('جدارات أوتو: خطأ في التهيئة:', error);
        }
    }

    // تهيئة المحتوى
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContent);
    } else {
        initializeContent();
    }

    // مراقبة تغيير URL للصفحات الديناميكية
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('جدارات أوتو: تغيير الصفحة المكتشف');
            setTimeout(() => {
                if (!jadaratAutoContent) {
                    initializeContent();
                } else {
                    jadaratAutoContent.checkPageType();
                }
            }, 1000);
        }
    });

    observer.observe(document, { subtree: true, childList: true });

})();, 100);
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
                console.error('جدارات أوتو: خطأ في معالجة الرسالة:', error);
                sendResponse({ success: false, error: error.message });
            }
        }

        async startAutomation() {
            console.log('جدارات أوتو: بدء الأتمتة');
            
            // فحص تسجيل الدخول
            const isLoggedIn = this.checkLoginStatus();
            if (!isLoggedIn) {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: '⚠️ يجب تسجيل الدخول أولاً للمتابعة' 
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
            console.log('جدارات أوتو: إيقاف مؤقت');
            this.isPaused = true;
            this.showIndicator('⏸️ متوقف مؤقتاً', '#ffc107');
            this.saveCurrentPosition();
        }

        stopAutomation() {
            console.log('جدارات أوتو: إيقاف نهائي');
            this.isRunning = false;
            this.isPaused = false;
            this.hideIndicator();
        }

        async processCurrentPage() {
            if (!this.isRunning || this.isPaused) return;

            try {
                console.log('جدارات أوتو: معالجة الصفحة الحالية');
                
                // انتظار 4 ثواني لصفحة الوظائف
                await this.delay(4000);
                
                const jobCards = this.getJobCards();
                this.totalJobs = jobCards.length;

                console.log(`جدارات أوتو: تم العثور على ${this.totalJobs} وظيفة`);

                if (this.totalJobs === 0) {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'لم يتم العثور على وظائف في هذه الصفحة' 
                    });
                    return;
                }

                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 0, 
                    text: `تم العثور على ${this.totalJobs} وظيفة في الصفحة ${this.currentPage}` 
                });

                for (let i = this.currentJobIndex; i < jobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        this.saveCurrentPosition();
                        return;
                    }

                    this.currentJobIndex = i;
                    const jobCard = jobCards[i];
                    
                    console.log(`جدارات أوتو: معالجة الوظيفة ${i + 1} من ${jobCards.length}`);
                    
                    await this.processJob(jobCard, i + 1);
                    
                    const progress = ((i + 1) / jobCards.length) * 100;
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: progress, 
                        text: `معالجة الوظيفة ${i + 1} من ${jobCards.length}` 
                    });

                    await this.delay(this.getRandomDelay());
                }

                await this.goToNextPage();

            } catch (error) {
                console.error('جدارات أوتو: خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        getJobCards() {
            console.log('جدارات أوتو: البحث عن بطاقات الوظائف');
            
            const jobCards = [];
            
            // البحث عن جميع روابط الوظائف
            const jobLinks = document.querySelectorAll('a[data-link][href*="/Jadarat/JobDetails"]');
            
            console.log(`جدارات أوتو: تم العثور على ${jobLinks.length} رابط وظيفة`);
            
            for (const link of jobLinks) {
                // الحصول على عنوان الوظيفة
                const titleElement = link.querySelector('span.heading4.OSFillParent');
                const jobTitle = titleElement ? titleElement.textContent.trim() : 'وظيفة غير محددة';
                
                // البحث عن الحاوي الأب للوظيفة
                const jobContainer = this.findJobContainer(link);
                
                if (jobContainer) {
                    // فحص حالة التقديم
                    const alreadyApplied = this.checkIfAlreadyApplied(jobContainer);
                    
                    if (!alreadyApplied) {
                        jobCards.push({
                            link: link,
                            container: jobContainer,
                            title: jobTitle
                        });
                        
                        console.log(`جدارات أوتو: وظيفة متاحة: ${jobTitle}`);
                    } else {
                        console.log(`جدارات أوتو: تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                        this.stats.skipped++;
                    }
                }
            }

            console.log(`جدارات أوتو: المجموع: ${jobCards.length} وظيفة متاحة للتقديم`);
            return jobCards;
        }

        findJobContainer(link) {
            // البحث عن الحاوي الأب الذي يحتوي على معلومات الوظيفة الكاملة
            let container = link;
            
            for (let i = 0; i < 10; i++) {
                if (!container.parentElement) break;
                
                container = container.parentElement;
                
                // التحقق من أن الحاوي يحتوي على معلومات الوظيفة
                const hasJobInfo = container.textContent.includes('المدينة') && 
                                 container.textContent.includes('تاريخ النشر');
                
                if (hasJobInfo) {
                    return container;
                }
            }
            
            return link.closest('[data-container]') || link.parentElement;
        }

        checkIfAlreadyApplied(container) {
            // فحص الأيقونة والنص
            const tickIcon = container.querySelector('img[src*="tickcircle.svg"]');
            if (tickIcon) {
                console.log('جدارات أوتو: تم العثور على أيقونة "تم التقدم"');
                return true;
            }
            
            const appliedText = container.querySelector('span.text-primary');
            if (appliedText && appliedText.textContent.includes('تم التقدم')) {
                console.log('جدارات أوتو: تم العثور على نص "تم التقدم"');
                return true;
            }
            
            return false;
        }

        async processJob(jobCard, jobIndex) {
            try {
                const jobTitle = jobCard.title;
                console.log(`جدارات أوتو: معالجة الوظيفة: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                // تمييز الرابط بصرياً
                this.highlightElement(jobCard.link);

                // النقر على رابط الوظيفة
                console.log('جدارات أوتو: النقر على رابط الوظيفة');
                this.clickElement(jobCard.link);
                
                // انتظار 3 ثواني لصفحة التفاصيل
                await this.waitForNavigation();
                await this.delay(3000);
                
                // التحقق من وصولنا لصفحة التفاصيل
                this.checkPageType();
                
                if (this.pageType === 'jobDetails') {
                    console.log('جدارات أوتو: ✅ وصلنا لصفحة تفاصيل الوظيفة');
                    
                    // التعامل مع النوافذ المنبثقة (بما في ذلك سياسة الخصوصية)
                    await this.handleDigitalExperiencePopup();
                    
                    // فحص حالة التقديم في صفحة التفاصيل
                    const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                    
                    if (alreadyApplied) {
                        this.stats.skipped++;
                        this.sendMessage('UPDATE_CURRENT_JOB', { 
                            jobTitle: jobTitle, 
                            status: 'skipped' 
                        });
                        console.log('جدارات أوتو: تم التخطي - مُقدم عليها مسبقاً');
                    } else {
                        // محاولة التقديم
                        const applicationResult = await this.applyForJob();
                        
                        if (applicationResult.success) {
                            this.stats.applied++;
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'success' 
                            });
                            console.log('جدارات أوتو: تم التقديم بنجاح');
                            
                        } else if (applicationResult.type === 'rejection') {
                            // حالة الرفض
                            this.stats.rejected = (this.stats.rejected || 0) + 1;
                            
                            // حفظ سبب الرفض
                            this.saveRejectionData(jobTitle, applicationResult.reason);
                            
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'rejected',
                                reason: applicationResult.reason
                            });
                            console.log('جدارات أوتو: تم رفض التقديم -', applicationResult.reason);
                            
                        } else {
                            // حالة خطأ تقني
                            this.stats.skipped++;
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'error',
                                reason: applicationResult.reason
                            });
                            console.log('جدارات أوتو: فشل التقديم -', applicationResult.reason);
                        }
                    }

                    this.stats.total++;
                    this.sendMessage('UPDATE_STATS', { stats: this.stats });

                    // العودة لقائمة الوظائف
                    await this.goBackToJobList();
                } else {
                    throw new Error('لم يتم فتح صفحة تفاصيل الوظيفة');
                }

            } catch (error) {
                console.error('جدارات أوتو: خطأ في معالجة الوظيفة:', error);
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
                    console.error('جدارات أوتو: خطأ في العودة:', backError);
                }
            }
        }

        async handleDigitalExperiencePopup() {
            console.log('جدارات أوتو: البحث عن النوافذ المنبثقة وسياسة الخصوصية');
            
            await this.delay(1500);
            
            // البحث عن النوافذ المنبثقة المختلفة
            const popupSelectors = [
                '[role="dialog"]',
                '.modal-dialog',
                '.modal',
                '.popup',
                '.overlay',
                '[class*="modal"]',
                '[class*="popup"]',
                '[class*="dialog"]'
            ];

            for (const selector of popupSelectors) {
                const popups = document.querySelectorAll(selector);
                for (const popup of popups) {
                    if (popup.offsetWidth > 0 && popup.offsetHeight > 0) {
                        const text = popup.textContent;
                        
                        console.log('جدارات أوتو: تم العثور على نافذة منبثقة:', text.substring(0, 100));
                        
                        // التحقق من أنواع النوافذ المختلفة
                        if (text.includes('سياسة الخصوصية') || 
                            text.includes('تحديثات سياسة الخصوصية') ||
                            text.includes('البيانات الشخصية') ||
                            text.includes('صندوق تنمية الموارد البشرية')) {
                            
                            console.log('جدارات أوتو: تم العثور على نافذة سياسة الخصوصية');
                            
                            // البحث عن أزرار القبول أو الإغلاق
                            const acceptButtons = popup.querySelectorAll('button, a, [role="button"]');
                            for (const btn of acceptButtons) {
                                const btnText = btn.textContent.trim();
                                if (btnText.includes('موافق') || 
                                    btnText.includes('قبول') ||
                                    btnText.includes('متابعة') ||
                                    btnText.includes('إغلاق') ||
                                    btnText.includes('×') ||
                                    btnText === 'OK') {
                                    
                                    console.log('جدارات أوتو: إغلاق نافذة سياسة الخصوصية');
                                    this.clickElement(btn);
                                    await this.delay(2000);
                                    return;
                                }
                            }
                        }
                        
                        // نوافذ أخرى (التقييم الرقمي، إلخ)
                        else {
                            const closeButton = popup.querySelector('button, [role="button"], .close, [data-dismiss]');
                            if (closeButton) {
                                console.log('جدارات أوتو: إغلاق النافذة المنبثقة العامة');
                                this.clickElement(closeButton);
                                await this.delay(1000);
                                return;
                            }
                        }
                    }
                }
            }
        }

        async checkIfAlreadyAppliedInDetails() {
            console.log('جدارات أوتو: فحص حالة التقديم في صفحة التفاصيل');
            
            await this.delay(2000);
            
            // البحث عن زر "استعراض طلب التقديم"
            const allButtons = document.querySelectorAll('button, a');
            
            for (const button of allButtons) {
                const text = button.textContent.trim();
                if (text.includes('استعراض طلب التقديم') || 
                    text.includes('استعراض الطلب') ||
                    text.includes('مراجعة الطلب')) {
                    console.log('جدارات أوتو: تم العثور على زر "استعراض طلب التقديم" - الوظيفة مُقدم عليها');
                    return true;
                }
            }
            
            return false;
        }

        findSubmitButton() {
            console.log('جدارات أوتو: البحث عن زر "تقديم"');
            
            const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
            
            for (const button of allButtons) {
                const text = (button.textContent || button.value || '').trim();
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                const isEnabled = !button.disabled && !button.classList.contains('disabled');
                
                // البحث عن زر "تقديم"
                if (text === 'تقديم' && isVisible && isEnabled) {
                    console.log('جدارات أوتو: ✅ تم العثور على زر التقديم');
                    return button;
                }
            }
            
            console.log('جدارات أوتو: ❌ لم يتم العثور على زر التقديم');
            return null;
        }

        async applyForJob() {
            console.log('جدارات أوتو: 🎯 بدء عملية التقديم');
            
            try {
                await this.delay(2000);
                
                const submitButton = this.findSubmitButton();
                
                if (!submitButton) {
                    return { success: false, reason: 'لم يتم العثور على زر التقديم' };
                }

                console.log('جدارات أوتو: ✅ النقر على زر التقديم');
                
                // تمرير الزر إلى منتصف الشاشة
                submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(1000);
                
                // النقر على زر التقديم
                this.clickElement(submitButton);
                
                console.log('جدارات أوتو: انتظار نوافذ التأكيد...');
                
                // انتظار نافذة التأكيد
                await this.delay(3000);
                
                // التعامل مع نافذة التأكيد
                await this.handleConfirmationDialog();
                
                // انتظار نافذة النتيجة
                await this.delay(3000);
                
                // التعامل مع نافذة النتيجة
                const applicationResult = await this.handleApplicationResultDialog();
                
                console.log('جدارات أوتو: نتيجة التقديم:', applicationResult);
                return applicationResult;

            } catch (error) {
                console.error('جدارات أوتو: ❌ خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        async handleConfirmationDialog() {
            console.log('جدارات أوتو: البحث عن نافذة التأكيد');
            
            // البحث عن النافذة التي تحتوي على النص المحدد
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    
                    // نافذة التأكيد: "هل أنت متأكد من التقديم على وظيفة..."
                    if (text.includes('هل أنت متأكد من التقديم على وظيفة')) {
                        console.log('جدارات أوتو: 📝 تم العثور على نافذة التأكيد');
                        
                        const confirmButton = Array.from(dialog.querySelectorAll('button')).find(btn => {
                            return btn.textContent.trim() === 'تقديم';
                        });
                        
                        if (confirmButton) {
                            console.log('جدارات أوتو: ✅ النقر على زر "تقديم" في التأكيد');
                            this.clickElement(confirmButton);
                            await this.delay(2000);
                            return;
                        }
                    }
                }
            }
            
            console.log('جدارات أوتو: لم يتم العثور على نافذة التأكيد');
        }

        async handleApplicationResultDialog() {
            console.log('جدارات أوتو: البحث عن نافذة نتيجة التقديم');
            
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    
                    // نافذة النجاح: "تم التقديم بنجاح"
                    if (text.includes('تم التقديم بنجاح')) {
                        console.log('جدارات أوتو: 🎉 تم التقديم بنجاح');
                        
                        const closeButton = this.findCloseButton(dialog);
                        if (closeButton) {
                            this.clickElement(closeButton);
                            await this.delay(2000);
                        }
                        
                        return { success: true, reason: 'تم التقديم بنجاح' };
                    }
                    
                    // نافذة الرفض: "عذراً ، لا يمكنك التقديم"
                    else if (text.includes('عذراً ، لا يمكنك التقديم') || 
                             text.includes('لا يمكنك التقديم') ||
                             text.includes('غير مؤهل')) {
                        
                        console.log('جدارات أوتو: ❌ تم رفض التقديم');
                        
                        // استخراج سبب الرفض
                        const rejectionReason = this.extractRejectionReason(text);
                        console.log('جدارات أوتو: سبب الرفض:', rejectionReason);
                        
                        const closeButton = this.findCloseButton(dialog);
                        if (closeButton) {
                            this.clickElement(closeButton);
                            await this.delay(2000);
                        }
                        
                        return { 
                            success: false, 
                            reason: rejectionReason,
                            type: 'rejection' 
                        };
                    }
                    
                    // نافذة خطأ عام
                    else if (text.includes('خطأ') || text.includes('فشل') || text.includes('مشكلة')) {
                        console.log('جدارات أوتو: ⚠️ حدث خطأ في التقديم');
                        
                        const errorReason = this.extractErrorReason(text);
                        
                        const closeButton = this.findCloseButton(dialog);
                        if (closeButton) {
                            this.clickElement(closeButton);
                            await this.delay(2000);
                        }
                        
                        return { 
                            success: false, 
                            reason: errorReason,
                            type: 'error' 
                        };
                    }