
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
            
            // التحقق من وجود قائمة الوظائف
            const hasJobList = document.querySelector('[data-list]') || 
                              document.querySelector('.list.list-group') ||
                              document.querySelector('a[href*="/Jadarat/JobDetails"]');
            
            if (hasJobList || url.includes('ExploreJobs') || url.includes('JobTab=1')) {
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
            
            // التحقق من تسجيل الدخول أولاً
            const isLoggedIn = this.checkLoginStatus();
            if (!isLoggedIn) {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'يجب تسجيل الدخول أولاً للمتابعة' 
                });
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
                
                // التحقق من تسجيل الدخول بشكل دوري
                const isLoggedIn = this.checkLoginStatus();
                if (!isLoggedIn) {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'تم تسجيل الخروج تلقائياً - يرجى تسجيل الدخول مرة أخرى' 
                    });
                    this.stopAutomation();
                    return;
                }
                
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

                    // فحص تسجيل الدخول قبل كل وظيفة
                    if (!this.checkLoginStatus()) {
                        this.sendMessage('AUTOMATION_ERROR', { 
                            error: 'تم تسجيل الخروج أثناء المعالجة - توقف العمل' 
                        });
                        this.stopAutomation();
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
            console.log('جدارات أوتو: البحث عن بطاقات الوظائف بناءً على HTML الحقيقي');
            
            const jobCards = [];
            
            // البحث عن جميع روابط الوظائف بناءً على HTML الفعلي
            const jobLinks = document.querySelectorAll('a[data-link][href*="/Jadarat/JobDetails"]');
            
            console.log(`جدارات أوتو: تم العثور على ${jobLinks.length} رابط وظيفة`);
            
            for (const link of jobLinks) {
                // الحصول على عنوان الوظيفة
                const titleElement = link.querySelector('span.heading4.OSFillParent');
                const jobTitle = titleElement ? titleElement.textContent.trim() : 'وظيفة غير محددة';
                
                // البحث عن الحاوي الأب للوظيفة
                const jobContainer = this.findJobContainer(link);
                
                if (jobContainer) {
                    // التحقق من عدم التقديم المسبق
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
                                 container.textContent.includes('تاريخ النشر') && 
                                 container.textContent.includes('الوظائف المتاحة');
                
                if (hasJobInfo) {
                    return container;
                }
            }
            
            // إذا لم نجد، نعيد العنصر الأب المباشر
            return link.closest('[data-container]') || link.parentElement;
        }

        checkIfAlreadyApplied(container) {
            // البحث عن مؤشرات التقديم المسبق بناءً على HTML الحقيقي
            
            // 1. البحث عن أيقونة "تم التقدم"
            const tickIcon = container.querySelector('img[src*="tickcircle.svg"]');
            if (tickIcon) {
                console.log('جدارات أوتو: تم العثور على أيقونة "تم التقدم"');
                return true;
            }
            
            // 2. البحث عن النص "تم التقدم"
            const appliedText = container.querySelector('span.text-primary');
            if (appliedText && appliedText.textContent.includes('تم التقدم')) {
                console.log('جدارات أوتو: تم العثور على نص "تم التقدم"');
                return true;
            }
            
            // 3. فحص النص العام للحاوي
            const containerText = container.textContent;
            const appliedIndicators = ['تم التقدم', 'تم التقديم', 'مُقدم عليها'];
            
            for (const indicator of appliedIndicators) {
                if (containerText.includes(indicator)) {
                    console.log(`جدارات أوتو: تم العثور على مؤشر: ${indicator}`);
                    return true;
                }
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
                
                // انتظار تحميل صفحة التفاصيل
                await this.delay(4000);
                
                // التحقق من وصولنا لصفحة التفاصيل
                const isJobDetailsPage = window.location.href.includes('JobDetails') || 
                                        window.location.href.includes('JobTab=2');
                
                if (isJobDetailsPage) {
                    console.log('جدارات أوتو: وصلنا لصفحة تفاصيل الوظيفة');
                    
                    // التعامل مع النوافذ المنبثقة
                    await this.handleDigitalExperiencePopup();
                    
                    // فحص حالة التقديم
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
            
            // البحث عن النوافذ المنبثقة
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

        async checkIfAlreadyAppliedInDetails() {
            console.log('جدارات أوتو: فحص حالة التقديم في صفحة التفاصيل');
            
            await this.delay(2000);
            
            const pageText = document.body.textContent;
            
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

            const submitButton = this.findSubmitButton();
            return !submitButton;
        }

        findSubmitButton() {
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
                
                await this.handleApplicationDialogs();
                
                return { success: true };

            } catch (error) {
                console.error('جدارات أوتو: خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        async handleApplicationDialogs() {
            console.log('جدارات أوتو: التعامل مع نوافذ التطبيق');
            
            await this.delay(2000);
            
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    
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
            
            window.history.back();
            await this.waitForNavigation();
            await this.delay(3000);
            window.scrollTo(0, 0);
            
            console.log('جدارات أوتو: تم العودة لقائمة الوظائف');
        }

        async goToNextPage() {
            console.log('جدارات أوتو: البحث عن الصفحة التالية');
            
            // البحث عن زر الصفحة التالية بناءً على HTML الحقيقي
            const nextButton = document.querySelector('button[aria-label="go to next page"]:not([disabled])');
            
            if (nextButton) {
                console.log('جدارات أوتو: الانتقال للصفحة التالية');
                this.currentPage++;
                this.currentJobIndex = 0;
                
                this.clickElement(nextButton);
                await this.waitForNavigation();
                await this.delay(3000);
                
                await this.processCurrentPage();
            } else {
                console.log('جدارات أوتو: انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
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
                
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                try {
                    element.click();
                } catch (e) {
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

        checkLoginStatus() {
            console.log('جدارات أوتو: فحص حالة تسجيل الدخول');
            
            // الطريقة الأكثر دقة: البحث عن زر تسجيل الدخول المحدد
            const specificLoginButton = document.querySelector('button[data-button].btn:contains("تسجيل الدخول")');
            
            // طرق إضافية للبحث عن زر تسجيل الدخول
            const loginSelectors = [
                'button[data-button]:contains("تسجيل الدخول")',
                'button.btn:contains("تسجيل الدخول")',
                'button[class*="margin-login-none"]:contains("تسجيل الدخول")',
                'a:contains("تسجيل الدخول")',
                '[href*="login"]',
                '[href*="signin"]'
            ];
            
            let loginButton = null;
            
            // البحث باستخدام دالة مساعدة للنصوص
            for (const selector of loginSelectors) {
                if (selector.includes(':contains(')) {
                    const baseSelector = selector.split(':contains(')[0];
                    const searchText = selector.match(/\("([^"]+)"\)/)?.[1];
                    if (searchText) {
                        loginButton = this.getElementByText(baseSelector, searchText);
                        if (loginButton) break;
                    }
                } else {
                    loginButton = document.querySelector(selector);
                    if (loginButton) break;
                }
            }
            
            // إذا وجدنا زر تسجيل دخول وهو مرئي = المستخدم خارج
            if (loginButton && loginButton.offsetWidth > 0 && loginButton.offsetHeight > 0) {
                console.log('جدارات أوتو: ⚠️  المستخدم غير مسجل دخول - تم العثور على زر تسجيل الدخول');
                console.log('زر تسجيل الدخول:', loginButton);
                return false;
            }
            
            // فحص إضافي: البحث عن نص "تسجيل الدخول" في الشريط العلوي
            const headerElements = document.querySelectorAll('header, nav, .header, .navbar, [class*="header"], [class*="nav"]');
            for (const header of headerElements) {
                if (header.textContent.includes('تسجيل الدخول') && 
                    !header.textContent.includes('تسجيل الخروج')) {
                    console.log('جدارات أوتو: ⚠️  المستخدم غير مسجل دخول - نص في الشريط العلوي');
                    return false;
                }
            }
            
            // فحص عكسي: البحث عن عناصر المستخدم المسجل
            const userIndicators = [
                '[class*="profile"]',
                '[class*="user"]', 
                '[class*="account"]',
                '[href*="profile"]',
                '[href*="account"]',
                'button:contains("تسجيل الخروج")',
                'a:contains("تسجيل الخروج")',
                '[class*="logout"]'
            ];
            
            let hasUserElements = false;
            for (const selector of userIndicators) {
                if (selector.includes(':contains(')) {
                    const baseSelector = selector.split(':contains(')[0];
                    const searchText = selector.match(/\("([^"]+)"\)/)?.[1];
                    if (searchText) {
                        const element = this.getElementByText(baseSelector, searchText);
                        if (element && element.offsetWidth > 0) {
                            hasUserElements = true;
                            break;
                        }
                    }
                } else {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0 && Array.from(elements).some(el => el.offsetWidth > 0)) {
                        hasUserElements = true;
                        break;
                    }
                }
            }
            
            // إذا لم نجد عناصر المستخدم ووجدنا نص تسجيل دخول
            if (!hasUserElements && document.body.textContent.includes('تسجيل الدخول')) {
                console.log('جدارات أوتو: ⚠️  المستخدم غير مسجل دخول - لا توجد عناصر المستخدم');
                return false;
            }
            
            console.log('جدارات أوتو: ✅ المستخدم مسجل دخول');
            return true;
        }

        // دالة مساعدة للبحث عن النصوص (contains selector)
        getElementByText(selector, text) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (element.textContent.includes(text)) {
                    return element;
                }
            }
            return null;
        }
    }

    let jadaratAutoContent = null;

    function initializeContent() {
        try {
            if (!jadaratAutoContent) {
                jadaratAutoContent = new JadaratAutoContent();
                console.log('جدارات أوتو: تم تهيئة المحتوى بنجاح - مبني على HTML الحقيقي');
            }
        } catch (error) {
            console.error('جدارات أوتو: خطأ في التهيئة:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContent);
    } else {
        initializeContent();
    }

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