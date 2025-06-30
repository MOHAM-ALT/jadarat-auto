// جدارات أوتو - Content Script المحسن النهائي
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
            
            // فحص دقيق بناءً على المحتوى الفعلي
            
            // علامات صفحة تفاصيل الوظيفة (حسب المعلومات المقدمة)
            const jobDetailsIndicators = [
                'نوع العمل',
                'الراتب', 
                'الوظائف المتاحة',
                'الجنس',
                'المنطقة',
                'المدن',
                'تاريخ بداية النشر',
                'تاريخ نهاية النشر',
                'فترة العمل'
            ];
            
            // عد كم من هذه المؤشرات موجودة
            let detailsScore = 0;
            for (const indicator of jobDetailsIndicators) {
                if (document.body.textContent.includes(indicator)) {
                    detailsScore++;
                }
            }
            
            // فحص وجود عدة روابط وظائف (علامة القائمة)
            const jobLinks = document.querySelectorAll('a[data-link][href*="/JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 2;
            
            // فحص وجود pagination (علامة القائمة)
            const hasPagination = !!document.querySelector('.pagination, [class*="pagination"]');
            
            // تحديد نوع الصفحة
            if (detailsScore >= 5) {
                this.pageType = 'jobDetails';
                console.log('جدارات أوتو: 📄 صفحة تفاصيل الوظيفة - نقاط:', detailsScore);
            } else if (hasMultipleJobs || hasPagination) {
                this.pageType = 'jobList';
                console.log('جدارات أوتو: 📋 صفحة قائمة الوظائف - وظائف:', jobLinks.length, 'pagination:', hasPagination);
            } else {
                this.pageType = 'unknown';
                console.log('جدارات أوتو: ❓ صفحة غير معروفة - تفاصيل:', detailsScore, 'وظائف:', jobLinks.length);
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
                
                // انتظار تحميل صفحة الوظائف (4 ثواني)
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
            console.log('جدارات أوتو: البحث عن بطاقات الوظائف');
            
            const jobCards = [];
            const jobLinks = document.querySelectorAll('a[data-link][href*="/JobDetails"]');
            
            console.log(`جدارات أوتو: تم العثور على ${jobLinks.length} رابط وظيفة`);
            
            for (const link of jobLinks) {
                const titleElement = link.querySelector('span.heading4.OSFillParent');
                const jobTitle = titleElement ? titleElement.textContent.trim() : 'وظيفة غير محددة';
                
                const jobContainer = this.findJobContainer(link);
                
                if (jobContainer) {
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
            // البحث عن أيقونة "تم التقدم"
            const tickIcon = container.querySelector('img[src*="tickcircle.svg"]');
            if (tickIcon) {
                console.log('جدارات أوتو: تم العثور على أيقونة "تم التقدم"');
                return true;
            }
            
            // البحث عن النص "تم التقدم"
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

                // النقر على رابط الوظيفة في نفس التبويب
                console.log('جدارات أوتو: النقر على رابط الوظيفة');
                this.clickElementInSameTab(jobCard.link);
                
                // انتظار تحميل صفحة التفاصيل (3 ثواني)
                await this.waitForPageChange();
                await this.delay(3000);
                
                // التحقق من وصولنا لصفحة التفاصيل
                this.checkPageType();
                
                if (this.pageType === 'jobDetails') {
                    console.log('جدارات أوتو: ✅ وصلنا لصفحة تفاصيل الوظيفة');
                    
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

        async checkIfAlreadyAppliedInDetails() {
            console.log('جدارات أوتو: فحص حالة التقديم في صفحة التفاصيل');
            
            await this.delay(1000);
            
            // البحث عن زر "استعراض طلب التقديم" بدلاً من "تقديم"
            const reviewButtons = Array.from(document.querySelectorAll('button, a')).filter(btn => {
                const text = btn.textContent.trim();
                return text.includes('استعراض طلب التقديم') || 
                       text.includes('استعراض الطلب') ||
                       text.includes('مراجعة الطلب');
            });
            
            if (reviewButtons.length > 0) {
                console.log('جدارات أوتو: تم العثور على زر "استعراض طلب التقديم" - الوظيفة مُقدم عليها');
                return true;
            }
            
            // فحص إضافي للنصوص
            const pageText = document.body.textContent;
            const appliedIndicators = [
                'تم التقديم على هذه الوظيفة',
                'تم تقديم طلبكم',
                'طلب التقديم مُرسل',
                'استعراض طلب التقديم'
            ];

            for (const indicator of appliedIndicators) {
                if (pageText.includes(indicator)) {
                    console.log(`جدارات أوتو: تم العثور على مؤشر: ${indicator}`);
                    return true;
                }
            }
            
            return false;
        }

        async applyForJob() {
            console.log('جدارات أوتو: 🎯 بدء عملية التقديم');
            
            try {
                // البحث عن زر التقديم
                const submitButton = this.findSubmitButton();
                
                if (!submitButton) {
                    console.log('جدارات أوتو: ❌ لم يتم العثور على زر التقديم');
                    return { success: false, reason: 'لم يتم العثور على زر التقديم' };
                }

                console.log('جدارات أوتو: ✅ تم العثور على زر التقديم، جاري النقر...');
                
                // النقر على زر التقديم
                this.clickElementInSameTab(submitButton);
                
                // انتظار نافذة التأكيد
                await this.delay(2000);
                
                // التعامل مع نوافذ التأكيد والنتائج
                await this.handleApplicationDialogs();
                
                console.log('جدارات أوتو: ✅ تمت عملية التقديم بنجاح');
                return { success: true };

            } catch (error) {
                console.error('جدارات أوتو: ❌ خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        findSubmitButton() {
            console.log('جدارات أوتو: البحث عن زر التقديم...');
            
            // البحث عن زر "تقديم" (وليس "استعراض طلب التقديم")
            const allButtons = document.querySelectorAll('button, input[type="submit"], a');
            
            for (const button of allButtons) {
                const text = (button.textContent || button.value || '').trim();
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                const isEnabled = !button.disabled && !button.classList.contains('disabled');
                
                // شروط زر التقديم
                const isSubmitButton = (
                    text === 'تقديم' ||
                    text.includes('تقديم على الوظيفة')
                ) && (
                    !text.includes('استعراض') &&
                    !text.includes('مراجعة') &&
                    !text.includes('طلب التقديم')
                );
                
                if (isSubmitButton && isVisible && isEnabled) {
                    console.log(`جدارات أوتو: ✅ تم العثور على زر التقديم: "${text}"`);
                    
                    // تمييز الزر بصرياً
                    button.style.cssText += 'border: 3px solid #00ff00 !important; background: rgba(0, 255, 0, 0.2) !important;';
                    
                    return button;
                }
            }
            
            console.log('جدارات أوتو: ❌ لم يتم العثور على زر التقديم');
            return null;
        }

        async handleApplicationDialogs() {
            console.log('جدارات أوتو: 🔍 البحث عن نوافذ التطبيق');
            
            // المرحلة 1: نافذة التأكيد
            await this.delay(2000);
            
            let confirmDialog = this.findDialogByText('هل أنت متأكد من التقديم على وظيفة');
            
            if (confirmDialog) {
                console.log('جدارات أوتو: 📝 تم العثور على نافذة التأكيد');
                
                const confirmButton = Array.from(confirmDialog.querySelectorAll('button')).find(btn => 
                    btn.textContent.trim() === 'تقديم'
                );
                
                if (confirmButton) {
                    console.log('جدارات أوتو: ✅ النقر على زر "تقديم" في نافذة التأكيد');
                    this.clickElementInSameTab(confirmButton);
                    await this.delay(3000);
                }
            }
            
            // المرحلة 2: نافذة النجاح
            let successDialog = this.findDialogByText('تم التقديم بنجاح');
            
            if (successDialog) {
                console.log('جدارات أوتو: 🎉 تم العثور على نافذة النجاح');
                
                const closeButton = Array.from(successDialog.querySelectorAll('button')).find(btn => 
                    btn.textContent.trim() === 'اغلاق' || btn.textContent.trim() === 'إغلاق'
                );
                
                if (closeButton) {
                    console.log('جدارات أوتو: ✅ إغلاق نافذة النجاح');
                    this.clickElementInSameTab(closeButton);
                    await this.delay(1000);
                }
            }
        }

        findDialogByText(searchText) {
            const dialogs = document.querySelectorAll(`
                [role="dialog"], 
                .modal, 
                [class*="modal"], 
                .popup, 
                [class*="popup"],
                .dialog,
                [class*="dialog"]
            `);
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    if (text.includes(searchText)) {
                        return dialog;
                    }
                }
            }
            
            return null;
        }

        async goBackToJobList() {
            console.log('جدارات أوتو: العودة لقائمة الوظائف باستخدام history.back()');
            
            window.history.back();
            await this.waitForPageChange();
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
                
                this.clickElementInSameTab(nextButton);
                await this.waitForPageChange();
                await this.delay(4000); // انتظار تحميل صفحة الوظائف
                
                await this.processCurrentPage();
            } else {
                console.log('جدارات أوتو: انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
            }
        }

        checkLoginStatus() {
            // البحث عن زر تسجيل الدخول
            const loginButtons = Array.from(document.querySelectorAll('button, a')).filter(btn => 
                btn.textContent.includes('تسجيل الدخول') && btn.offsetWidth > 0
            );
            
            if (loginButtons.length > 0) {
                console.log('جدارات أوتو: ⚠️ المستخدم غير مسجل دخول');
                return false;
            }
            
            console.log('جدارات أوتو: ✅ المستخدم مسجل دخول');
            return true;
        }

        async waitForPageChange() {
            console.log('جدارات أوتو: انتظار تغيير الصفحة...');
            
            const initialUrl = window.location.href;
            const maxWaitTime = 10000; // 10 ثواني
            const startTime = Date.now();
            
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const currentTime = Date.now();
                    const currentUrl = window.location.href;
                    
                    if (currentUrl !== initialUrl || document.readyState === 'complete') {
                        clearInterval(checkInterval);
                        console.log('جدارات أوتو: ✅ تم تغيير الصفحة أو اكتمل التحميل');
                        resolve();
                        return;
                    }
                    
                    if (currentTime - startTime > maxWaitTime) {
                        clearInterval(checkInterval);
                        console.log('جدارات أوتو: ⚠️ انتهت مهلة انتظار تغيير الصفحة');
                        resolve();
                        return;
                    }
                }, 500);
            });
        }

        clickElementInSameTab(element) {
            if (element) {
                console.log('جدارات أوتو: النقر في نفس التبويب:', element);
                
                // التأكد من عدم فتح تبويب جديد
                element.removeAttribute('target');
                if (element.target) element.target = '_self';
                
                // تمرير إلى منتصف الشاشة
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // انتظار قصير ثم النقر
                setTimeout(() => {
                    try {
                        // النقر العادي
                        element.click();
                    } catch (e) {
                        // طريقة بديلة للنقر
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            button: 0 // النقر بالزر الأيسر
                        });
                        element.dispatchEvent(event);
                    }
                }, 500);
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

        async delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3; // تنويع 30%
            return base + (Math.random() * 2 - 1) * variation;
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

    let jadaratAutoContent = null;

    function initializeContent() {
        try {
            if (!jadaratAutoContent) {
                jadaratAutoContent = new JadaratAutoContent();
                console.log('جدارات أوتو: تم تهيئة المحتوى بنجاح - الإصدار النهائي المحسن');
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