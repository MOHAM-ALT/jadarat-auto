// جدارات أوتو - Content Script المُحدث والمُصحح
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
            
            if (url.includes('/ExploreJobs') || url.includes('JobTab=1')) {
                this.pageType = 'jobList';
                console.log('جدارات أوتو: صفحة قائمة الوظائف');
            } else if (url.includes('/JobDetails') || url.includes('JobTab=2')) {
                this.pageType = 'jobDetails';
                console.log('جدارات أوتو: صفحة تفاصيل الوظيفة');
            } else {
                this.pageType = 'unknown';
                console.log('جدارات أوتو: صفحة غير معروفة');
            }
        }

        addVisualIndicator() {
            // إزالة المؤشر السابق إن وجد
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

        showIndicator(text, color = '#00d4ff') {
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
                        await this.startAutomation();
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
                }
            } catch (error) {
                console.error('جدارات أوتو: خطأ في معالجة الرسالة:', error);
                sendResponse({ success: false, error: error.message });
            }
        }

        async startAutomation() {
            console.log('جدارات أوتو: بدء الأتمتة');
            
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
                
                await this.delay(2000);
                
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
            
            // المحددات الجديدة بناءً على HTML الفعلي
            const jobCards = [];
            
            // البحث عن العنصر الحاوي للقائمة
            const listElement = document.querySelector('[data-list]');
            if (!listElement) {
                console.log('جدارات أوتو: لم يتم العثور على قائمة الوظائف');
                return [];
            }

            // البحث عن بطاقات الوظائف داخل القائمة
            const cardContainers = listElement.querySelectorAll('[data-container]');
            
            for (const container of cardContainers) {
                // البحث عن رابط الوظيفة
                const jobLink = container.querySelector('a[href*="/Jadarat/JobDetails"]');
                if (jobLink) {
                    // التحقق من عدم وجود "تم التقدم"
                    const alreadyApplied = container.querySelector('span.text-primary');
                    const isApplied = alreadyApplied && alreadyApplied.textContent.includes('تم التقدم');
                    
                    if (!isApplied) {
                        jobCards.push({
                            container: container,
                            link: jobLink,
                            title: this.extractJobTitle(container)
                        });
                    } else {
                        console.log('جدارات أوتو: تخطي وظيفة مُقدم عليها مسبقاً:', this.extractJobTitle(container));
                    }
                }
            }

            console.log(`جدارات أوتو: تم العثور على ${jobCards.length} وظيفة متاحة للتقديم`);
            
            // عرض عينة من الوظائف المكتشفة
            jobCards.slice(0, 3).forEach((job, i) => {
                console.log(`جدارات أوتو: وظيفة ${i + 1}: ${job.title}`);
            });

            return jobCards;
        }

        extractJobTitle(container) {
            // البحث عن عنوان الوظيفة
            const titleElement = container.querySelector('span.heading4, .heading4, a[href*="JobDetails"] span');
            if (titleElement) {
                return titleElement.textContent.trim();
            }
            
            // بديل: البحث عن أي عنصر يحتوي على نص الوظيفة
            const textElements = container.querySelectorAll('span, a');
            for (const element of textElements) {
                const text = element.textContent.trim();
                if (text.length > 5 && text.length < 100 && 
                    (text.includes('أخصائي') || text.includes('مدير') || text.includes('محاسب') || text.includes('سكرتير'))) {
                    return text;
                }
            }
            
            return 'وظيفة غير محددة';
        }

        async processJob(jobCard, jobIndex) {
            try {
                const jobTitle = jobCard.title;
                console.log(`جدارات أوتو: معالجة الوظيفة: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                // النقر على رابط الوظيفة
                console.log('جدارات أوتو: النقر على رابط الوظيفة');
                this.clickElement(jobCard.link);
                
                // انتظار تحميل صفحة التفاصيل
                await this.delay(4000);
                
                // التحقق من وصولنا لصفحة التفاصيل
                const isJobDetailsPage = window.location.href.includes('JobDetails');
                
                if (isJobDetailsPage) {
                    // التعامل مع النوافذ المنبثقة
                    await this.handleDigitalExperiencePopup();
                    
                    // فحص حالة التقديم
                    const alreadyApplied = await this.checkIfAlreadyApplied();
                    
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
                        } else {
                            this.stats.skipped++;
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'error' 
                            });
                            console.log('جدارات أوتو: فشل التقديم');
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
            console.log('جدارات أوتو: فحص النوافذ المنبثقة');
            
            await this.delay(1500);
            
            // البحث عن أي نوافذ منبثقة أو مودالز
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
                        console.log('جدارات أوتو: تم العثور على نافذة منبثقة');
                        
                        // البحث عن زر الإغلاق
                        const closeButton = popup.querySelector('button, [role="button"], .close, [data-dismiss]');
                        if (closeButton) {
                            console.log('جدارات أوتو: إغلاق النافذة المنبثقة');
                            this.clickElement(closeButton);
                            await this.delay(1000);
                            return;
                        }
                    }
                }
            }
        }

        async checkIfAlreadyApplied() {
            console.log('جدارات أوتو: فحص حالة التقديم');
            
            await this.delay(2000);
            
            const pageText = document.body.textContent;
            
            // مؤشرات التقديم المسبق
            const alreadyAppliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم',
                'تم التقدم',
                'مُقدم عليها',
                'تم تقديم الطلب'
            ];

            for (const indicator of alreadyAppliedIndicators) {
                if (pageText.includes(indicator)) {
                    console.log(`جدارات أوتو: تم العثور على مؤشر: ${indicator}`);
                    return true;
                }
            }

            // فحص وجود زر التقديم
            const submitButton = this.findSubmitButton();
            return !submitButton;
        }

        findSubmitButton() {
            // البحث عن زر التقديم
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("تقديم")',
                'a:contains("تقديم")',
                '[data-button]:contains("تقديم")'
            ];

            // البحث في جميع الأزرار والروابط
            const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
            
            for (const button of allButtons) {
                const text = (button.textContent || button.value || '').trim();
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                
                if (isVisible && text.includes('تقديم')) {
                    return button;
                }
            }

            return null;
        }

        async applyForJob() {
            console.log('جدارات أوتو: بدء عملية التقديم');
            
            try {
                const submitButton = this.findSubmitButton();
                
                if (!submitButton) {
                    console.log('جدارات أوتو: لم يتم العثور على زر التقديم');
                    return { success: false, reason: 'لم يتم العثور على زر التقديم' };
                }

                console.log('جدارات أوتو: النقر على زر التقديم');
                this.clickElement(submitButton);
                
                await this.delay(3000);
                
                // التعامل مع نوافذ التأكيد والنتائج
                await this.handleApplicationDialogs();
                
                return { success: true };

            } catch (error) {
                console.error('جدارات أوتو: خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        async handleApplicationDialogs() {
            console.log('جدارات أوتو: التعامل مع نوافذ التطبيق');
            
            // انتظار ظهور النوافذ
            await this.delay(2000);
            
            // البحث عن نوافذ التأكيد
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    
                    // نافذة تأكيد التقديم
                    if (text.includes('متأكد') || text.includes('تأكيد')) {
                        const confirmButton = Array.from(dialog.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('تقديم') || btn.textContent.includes('موافق')
                        );
                        
                        if (confirmButton) {
                            console.log('جدارات أوتو: تأكيد التقديم');
                            this.clickElement(confirmButton);
                            await this.delay(2000);
                        }
                    }
                    
                    // نافذة النتيجة
                    if (text.includes('تم التقديم') || text.includes('نجح') || text.includes('فشل')) {
                        const closeButton = Array.from(dialog.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('إغلاق') || btn.textContent.includes('موافق') || btn.textContent.includes('×')
                        );
                        
                        if (closeButton) {
                            console.log('جدارات أوتو: إغلاق نافذة النتيجة');
                            this.clickElement(closeButton);
                            await this.delay(1000);
                        }
                    }
                }
            }
        }

        async goBackToJobList() {
            console.log('جدارات أوتو: العودة لقائمة الوظائف');
            
            // العودة باستخدام تاريخ المتصفح
            window.history.back();
            
            // انتظار تحميل الصفحة
            await this.waitForNavigation();
            
            // انتظار إضافي للتأكد
            await this.delay(3000);
            
            // العودة لأعلى الصفحة
            window.scrollTo(0, 0);
            
            console.log('جدارات أوتو: تم العودة لقائمة الوظائف');
        }

        async goToNextPage() {
            console.log('جدارات أوتو: البحث عن الصفحة التالية');
            
            // البحث عن زر الصفحة التالية بناءً على HTML الفعلي
            const nextButton = document.querySelector('button[aria-label*="go to next page"]:not([disabled])');
            
            if (nextButton) {
                console.log('جدارات أوتو: الانتقال للصفحة التالية');
                this.currentPage++;
                this.currentJobIndex = 0;
                
                this.clickElement(nextButton);
                await this.waitForNavigation();
                await this.delay(3000);
                
                // معالجة الصفحة الجديدة
                await this.processCurrentPage();
            } else {
                console.log('جدارات أوتو: انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
            }
        }

        clickElement(element) {
            if (element) {
                console.log('جدارات أوتو: النقر على العنصر:', element);
                
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

        sendMessage(action, data = {}) {
            try {
                chrome.runtime.sendMessage({
                    action: action,
                    ...data
                }).catch(error => {
                    console.error('جدارات أوتو: خطأ في إرسال الرسالة:', error);
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
                console.log('جدارات أوتو: تم تهيئة المحتوى بنجاح');
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

})();