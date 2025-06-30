// جدارات أوتو - النسخة 6 المحسنة العاملة مع الإصلاحات
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
                return true; // Keep the message channel open for async response
            });
        }

        checkPageType() {
            const url = window.location.href;
            console.log('جدارات أوتو: فحص نوع الصفحة - URL:', url);
            
            // فحص دقيق بناءً على المحتوى
            const pageText = document.body.textContent;
            
            // مؤشرات صفحة تفاصيل الوظيفة
            const detailsIndicators = [
                'نوع العمل',
                'الراتب', 
                'الوظائف المتاحة',
                'الجنس',
                'المنطقة',
                'تاريخ بداية النشر',
                'تاريخ نهاية النشر',
                'فترة العمل'
            ];
            
            let detailsScore = 0;
            for (const indicator of detailsIndicators) {
                if (pageText.includes(indicator)) {
                    detailsScore++;
                }
            }
            
            // فحص وجود عدة روابط وظائف
            const jobLinks = document.querySelectorAll('a[data-link][href*="/JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 2;
            
            // فحص وجود pagination
            const hasPagination = !!document.querySelector('.pagination, [class*="pagination"]');
            
            // تحديد نوع الصفحة
            if (detailsScore >= 5) {
                this.pageType = 'jobDetails';
                console.log('جدارات أوتو: 📄 صفحة تفاصيل الوظيفة - نقاط:', detailsScore);
            } else if (hasMultipleJobs || hasPagination || url.includes('ExploreJobs') || url.includes('JobTab=1')) {
                this.pageType = 'jobList';
                console.log('جدارات أوتو: 📋 صفحة قائمة الوظائف - وظائف:', jobLinks.length);
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
                        setTimeout(async () => {
                            await this.startAutomation();
                        }, 100);
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
            
            // التحقق من تسجيل الدخول أولاً
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
                
                // التحقق من تسجيل الدخول بشكل دوري
                if (!this.checkLoginStatus()) {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: '⚠️ تم تسجيل الخروج تلقائياً - يرجى تسجيل الدخول مرة أخرى' 
                    });
                    this.stopAutomation();
                    return;
                }
                
                // انتظار تحميل صفحة الوظائف (4 ثواني كما طلبت)
                await this.delay(4000);
                
                const jobCards = this.getJobCards();
                this.totalJobs = jobCards.length;

                console.log(`جدارات أوتو: تم العثور على ${this.totalJobs} وظيفة`);

                if (this.totalJobs === 0) {
                    // تشخيص إضافي عند عدم العثور على وظائف
                    console.log('=== تشخيص مشكلة عدم العثور على الوظائف ===');
                    console.log('عدد روابط JobDetails:', document.querySelectorAll('a[href*="JobDetails"]').length);
                    console.log('عدد data-link:', document.querySelectorAll('a[data-link]').length);
                    console.log('عدد data-list:', document.querySelectorAll('[data-list]').length);
                    console.log('وجود pagination:', !!document.querySelector('.pagination'));
                    
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'لم يتم العثور على وظائف في هذه الصفحة - تحقق من أنك في صفحة قائمة الوظائف' 
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
                            error: '⚠️ تم تسجيل الخروج أثناء المعالجة - توقف العمل' 
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
            let container = link;
            
            for (let i = 0; i < 10; i++) {
                if (!container.parentElement) break;
                
                container = container.parentElement;
                
                const hasJobInfo = container.textContent.includes('المدينة') && 
                                 container.textContent.includes('تاريخ النشر') && 
                                 container.textContent.includes('الوظائف المتاحة');
                
                if (hasJobInfo) {
                    return container;
                }
            }
            
            return link.closest('[data-container]') || link.parentElement;
        }

        checkIfAlreadyApplied(container) {
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

                // النقر على رابط الوظيفة بدون فتح تبويب جديد
                console.log('جدارات أوتو: النقر على رابط الوظيفة');
                this.clickElement(jobCard.link);
                
                // انتظار تحميل صفحة التفاصيل (3 ثواني كما طلبت)
                await this.waitForNavigation();
                await this.delay(3000);
                
                // التحقق من وصولنا لصفحة التفاصيل
                this.checkPageType();
                
                if (this.pageType === 'jobDetails') {
                    console.log('جدارات أوتو: ✅ وصلنا لصفحة تفاصيل الوظيفة');
                    
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
                            console.log('جدارات أوتو: فشل التقديم -', applicationResult.reason);
                        }
                    }

                    this.stats.total++;
                    this.sendMessage('UPDATE_STATS', { stats: this.stats });

                    // العودة لقائمة الوظائف
                    await this.goBackToJobList();
                } else {
                    throw new Error('لم يتم فتح صفحة تفاصيل الوظيفة - نوع الصفحة: ' + this.pageType);
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
            
            // البحث عن زر "استعراض طلب التقديم" بدلاً من "تقديم"
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
            console.log('جدارات أوتو: البحث المكثف عن زر التقديم...');
            
            const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
            
            console.log(`جدارات أوتو: فحص ${allButtons.length} عنصر قابل للنقر`);
            
            for (const button of allButtons) {
                const text = (button.textContent || button.value || button.getAttribute('aria-label') || '').trim();
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                const isEnabled = !button.disabled && !button.classList.contains('disabled');
                
                // شروط العثور على زر التقديم
                const isSubmitButton = (
                    text.includes('تقديم') ||
                    text.includes('قدم') ||
                    text.includes('التقديم') ||
                    text.includes('تطبيق') ||
                    text.includes('Apply') ||
                    button.type === 'submit'
                ) && (
                    !text.includes('تم التقديم') &&
                    !text.includes('تم التقدم') &&
                    !text.includes('استعراض') &&
                    !text.includes('مراجعة')
                );
                
                if (isSubmitButton && isVisible && isEnabled) {
                    console.log(`جدارات أوتو: ✅ تم العثور على زر التقديم: "${text}"`);
                    
                    // تمييز الزر بصرياً للتأكيد
                    button.style.cssText += 'border: 3px solid #00ff00 !important; background: rgba(0, 255, 0, 0.2) !important;';
                    
                    return button;
                }
            }
            
            console.log('جدارات أوتو: ❌ لم يتم العثور على زر التقديم');
            return null;
        }

        async applyForJob() {
            console.log('جدارات أوتو: 🎯 بدء عملية التقديم المحسنة');
            
            try {
                // انتظار إضافي للتأكد من تحميل الصفحة
                await this.delay(3000);
                
                // محاولة البحث عن زر التقديم عدة مرات
                let submitButton = null;
                let attempts = 0;
                const maxAttempts = 5;
                
                while (!submitButton && attempts < maxAttempts) {
                    attempts++;
                    console.log(`جدارات أوتو: محاولة البحث عن زر التقديم - المحاولة ${attempts}`);
                    
                    submitButton = this.findSubmitButton();
                    
                    if (!submitButton) {
                        console.log('جدارات أوتو: لم يتم العثور على الزر، انتظار ثانيتين...');
                        await this.delay(2000);
                        
                        // إغلاق أي نوافذ منبثقة قد تحجب الزر
                        await this.handleDigitalExperiencePopup();
                    }
                }
                
                if (!submitButton) {
                    console.log('جدارات أوتو: ❌ فشل في العثور على زر التقديم نهائياً');
                    
                    // تشخيص إضافي
                    console.log('=== تشخيص الأزرار الموجودة ===');
                    const allButtons = document.querySelectorAll('button, input[type="submit"], a');
                    allButtons.forEach((btn, index) => {
                        if (btn.offsetWidth > 0) {
                            console.log(`زر ${index + 1}: "${btn.textContent?.trim() || btn.value || 'بدون نص'}" - مرئي: ${btn.offsetWidth > 0}`);
                        }
                    });
                    
                    return { success: false, reason: 'لم يتم العثور على زر التقديم بعد عدة محاولات' };
                }

                console.log('جدارات أوتو: ✅ تم العثور على زر التقديم، جاري النقر...');
                
                // تمرير الزر إلى منتصف الشاشة
                submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.delay(1000);
                
                // النقر على زر التقديم
                this.clickElement(submitButton);
                
                console.log('جدارات أوتو: تم النقر على زر التقديم، انتظار النوافذ...');
                
                // انتظار أطول للنوافذ المنبثقة
                await this.delay(4000);
                
                // التعامل مع نوافذ التأكيد والنتائج
                await this.handleApplicationDialogs();
                
                // انتظار إضافي للتأكد من اكتمال العملية
                await this.delay(2000);
                
                console.log('جدارات أوتو: ✅ تمت عملية التقديم بنجاح');
                return { success: true };

            } catch (error) {
                console.error('جدارات أوتو: ❌ خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        async handleApplicationDialogs() {
            console.log('جدارات أوتو: 🔍 البحث المكثف عن نوافذ التطبيق');
            
            // انتظار أطول لظهور النوافذ
            await this.delay(3000);
            
            // محاولات متعددة للعثور على النوافذ
            let dialogFound = false;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!dialogFound && attempts < maxAttempts) {
                attempts++;
                console.log(`جدارات أوتو: محاولة البحث عن النوافذ - المحاولة ${attempts}`);
                
                // البحث عن النوافذ المنبثقة
                const dialogs = document.querySelectorAll(`
                    [role="dialog"], 
                    .modal, 
                    [class*="modal"], 
                    .popup, 
                    [class*="popup"],
                    .dialog,
                    [class*="dialog"],
                    .overlay,
                    [class*="overlay"]
                `);
                
                console.log(`جدارات أوتو: تم العثور على ${dialogs.length} نافذة محتملة`);
                
                for (const dialog of dialogs) {
                    if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                        const text = dialog.textContent;
                        console.log(`جدارات أوتو: نافذة مرئية - المحتوى: "${text.substring(0, 100)}..."`);
                        
                        // نافذة تأكيد التقديم - البحث بالنص الدقيق الذي أرسلته
                        if (text.includes('هل أنت متأكد من التقديم على وظيفة')) {
                            console.log('جدارات أوتو: 📝 تم العثور على نافذة تأكيد التقديم');
                            
                            const confirmButton = Array.from(dialog.querySelectorAll('button, input[type="submit"], a')).find(btn => {
                                const btnText = btn.textContent || btn.value || '';
                                return btnText.trim() === 'تقديم';
                            });
                            
                            if (confirmButton) {
                                console.log('جدارات أوتو: ✅ النقر على زر "تقديم" في نافذة التأكيد');
                                this.clickElement(confirmButton);
                                await this.delay(3000);
                                dialogFound = true;
                                break;
                            }
                        }
                        
                        // نافذة النجاح - البحث بالنص الدقيق الذي أرسلته
                        if (text.includes('تم التقديم بنجاح')) {
                            console.log('جدارات أوتو: 🎉 تم العثور على نافذة النجاح');
                            
                            const closeButton = Array.from(dialog.querySelectorAll('button, input[type="button"], a')).find(btn => {
                                const btnText = btn.textContent || btn.value || '';
                                return btnText.trim() === 'اغلاق' || btnText.trim() === 'إغلاق';
                            });
                            
                            if (closeButton) {
                                console.log('جدارات أوتو: ✅ إغلاق نافذة النجاح');
                                this.clickElement(closeButton);
                                await this.delay(2000);
                                dialogFound = true;
                                break;
                            }
                        }
                    }
                }
                
                if (!dialogFound) {
                    console.log('جدارات أوتو: لم يتم العثور على نوافذ، انتظار ثانيتين...');
                    await this.delay(2000);
                }
            }
            
            console.log('جدارات أوتو: انتهى التعامل مع النوافذ');
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
                await this.delay(4000);
                
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

        checkLoginStatus() {
            console.log('جدارات أوتو: فحص حالة تسجيل الدخول');
            
            // البحث عن زر تسجيل الدخول بطرق متعددة
            const allButtons = document.querySelectorAll('button, a');
            for (const btn of allButtons) {
                if (btn.textContent.includes('تسجيل الدخول') && btn.offsetWidth > 0) {
                    console.log('جدارات أوتو: ⚠️  المستخدم غير مسجل دخول - تم العثور على زر تسجيل الدخول');
                    return false;
                }
            }
            
            console.log('جدارات أوتو: ✅ المستخدم مسجل دخول');
            return true;
        }

        sendMessage(action, data = {}) {
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

        // دالة مساعدة للبحث عن النصوص
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

    // إنشاء المتغير العام
    let jadaratAutoContent = null;

    function initializeContent() {
        try {
            if (!jadaratAutoContent) {
                jadaratAutoContent = new JadaratAutoContent();
                console.log('جدارات أوتو: تم تهيئة المحتوى بنجاح - النسخة 6 المحسنة');
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