// جدارات أوتو - Content Script مع انتظار التحميل الذكي
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى الذكي المحدث');

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
            this.resumeData = null;
            
            this.initializeListeners();
            this.addVisualIndicator();
            
            // انتظار التحميل الكامل قبل فحص نوع الصفحة
            this.waitForPageLoadAndCheck();
            
            console.log('✅ جدارات أوتو: تم التهيئة بنجاح - النسخة المصححة مع انتظار التحميل');
        }

        async waitForPageLoadAndCheck() {
            console.log('⏳ انتظار تحميل الصفحة الكامل...');
            
            // انتظار تحميل DOM
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve, { once: true });
                    }
                });
            }
            
            // انتظار إضافي للمحتوى الديناميكي
            await this.wait(3000);
            
            // انتظار ظهور المحتوى الأساسي
            await this.waitForContentToLoad();
            
            // الآن فحص نوع الصفحة
            this.checkPageType();
        }

        async waitForContentToLoad() {
            console.log('⏳ انتظار ظهور المحتوى...');
            
            const maxAttempts = 20; // 20 ثانية كحد أقصى
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                // فحص وجود محتوى أساسي
                const hasBasicContent = this.checkForBasicContent();
                
                if (hasBasicContent) {
                    console.log('✅ تم تحميل المحتوى الأساسي');
                    return;
                }
                
                attempts++;
                console.log(`⏳ محاولة ${attempts}/${maxAttempts} - في انتظار المحتوى...`);
                
                await this.wait(1000);
            }
            
            console.log('⚠️ انتهت مهلة انتظار المحتوى، المتابعة بأي حال...');
        }

        checkForBasicContent() {
            const url = window.location.href;
            
            if (url.includes('JobDetails')) {
                // فحص محتوى صفحة التفاصيل
                return document.querySelector('[data-block="Job.PostDetailsBlock"]') ||
                       document.querySelector('span.heading5') ||
                       document.body.textContent.includes('الوصف الوظيفي') ||
                       document.body.textContent.includes('الراتب') ||
                       document.querySelectorAll('button').length > 5;
                       
            } else if (url.includes('ExploreJobs') || url.includes('JobTab=1')) {
                // فحص محتوى قائمة الوظائف
                return document.querySelectorAll('a[href*="JobDetails"]').length > 0 ||
                       document.querySelector('[data-list]') ||
                       document.body.textContent.includes('المدينة') ||
                       document.body.textContent.includes('تاريخ النشر');
                       
            } else {
                // صفحة رئيسية أو أخرى
                return document.body.textContent.length > 1000;
            }
        }

        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sendResponse);
                return true;
            });
        }

        checkPageType() {
            const url = window.location.href;
            console.log('🔍 تحليل الصفحة الحالية:', url);
            
            const pageText = document.body.textContent || '';
            const pageHTML = document.body.innerHTML || '';
            
            // فحص مؤشرات صفحة تفاصيل الوظيفة المحدثة
            const detailsIndicators = [
                'الوصف الوظيفي',
                'نوع العمل',
                'الراتب',
                'الجنس',
                'المنطقة',
                'المؤهلات',
                'المهارات',
                'اللغات',
                'تاريخ بداية النشر',
                'تاريخ نهاية النشر',
                'الوظائف المتاحة',
                'فترة العمل'
            ];
            
            let detailsScore = 0;
            for (const indicator of detailsIndicators) {
                if (pageText.includes(indicator)) {
                    detailsScore++;
                }
            }
            
            // فحص وجود block مخصص لتفاصيل الوظيفة
            const hasJobDetailsBlock = pageHTML.includes('Job.PostDetailsBlock') || 
                                      pageHTML.includes('data-block="Job.PostDetailsBlock"');
            
            // فحص وجود زر التقديم
            const submitButtonExists = this.hasSubmitButton();
            
            // فحص وجود عناصر تفاصيل الوظيفة المميزة
            const hasJobTitleElement = document.querySelector('span.heading5') !== null;
            const hasCompanyName = pageHTML.includes('شركة') || pageHTML.includes('مؤسسة');
            const hasJobId = pageHTML.includes('الرقم التعريفي');
            
            // فحص وجود روابط متعددة للوظائف (مؤشر على القائمة)
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 3;
            
            // فحص وجود pagination
            const hasPagination = document.querySelector('button[aria-label*="next page"], .pagination') ||
                                 pageHTML.includes('pagination');
            
            console.log(`📊 تحليل الصفحة المحدث (بعد التحميل):
                - نقاط التفاصيل: ${detailsScore}/12
                - كتلة تفاصيل الوظيفة: ${hasJobDetailsBlock}
                - زر التقديم: ${submitButtonExists}
                - عنوان الوظيفة: ${hasJobTitleElement}
                - اسم الشركة: ${hasCompanyName}
                - رقم الوظيفة: ${hasJobId}
                - روابط متعددة: ${hasMultipleJobs} (${jobLinks.length})
                - صفحات: ${hasPagination}
                - URL يحتوي JobDetails: ${url.includes('JobDetails')}`);
            
            // تحديد نوع الصفحة بدقة محسنة
            if (url.includes('JobDetails')) {
                // إذا كان URL يحتوي على JobDetails، نفترض أنها صفحة تفاصيل
                if (detailsScore >= 3 || hasJobDetailsBlock || hasJobTitleElement || submitButtonExists) {
                    this.pageType = 'jobDetails';
                    console.log('✅ صفحة تفاصيل وظيفة مؤكدة');
                    this.analyzeJobDetailsPage();
                } else {
                    // إذا لم نجد محتوى، قد تكون الصفحة لا تزال في التحميل
                    console.log('⚠️ صفحة JobDetails لكن لم يتم العثور على محتوى كافٍ، محاولة إعادة الفحص...');
                    setTimeout(() => this.checkPageType(), 3000);
                    return;
                }
                
            } else if (hasMultipleJobs || hasPagination || 
                      url.includes('ExploreJobs') || 
                      (!url.includes('JobDetails') && jobLinks.length > 0)) {
                this.pageType = 'jobList';
                console.log('📋 صفحة قائمة الوظائف مؤكدة');
                this.analyzeJobListPage();
                
            } else if (url.includes('jadarat.sa') && 
                      (pageText.includes('البحث عن الوظائف') || pageText.includes('الوظائف المتاحة'))) {
                this.pageType = 'home';
                console.log('🏠 الصفحة الرئيسية مكتشفة');
                
            } else {
                this.pageType = 'unknown';
                console.log(`❓ نوع صفحة غير محدد:
                    - URL: ${url}
                    - تفاصيل: ${detailsScore}
                    - روابط: ${jobLinks.length}
                    - كتلة: ${hasJobDetailsBlock}`);
                    
                // إذا كانت صفحة غير معروفة، نعيد المحاولة بعد وقت
                if (url.includes('jadarat.sa')) {
                    console.log('🔄 إعادة المحاولة بعد 5 ثوان...');
                    setTimeout(() => this.checkPageType(), 5000);
                }
            }
        }

        // دالة مساعدة للبحث عن زر التقديم
        hasSubmitButton() {
            const allButtons = document.querySelectorAll('button, input[type="submit"], a');
            for (const button of allButtons) {
                const text = (button.textContent || button.value || '').trim();
                if (text === 'تقديم' && button.offsetWidth > 0) {
                    return true;
                }
            }
            return false;
        }

        analyzeJobDetailsPage() {
            const jobTitle = this.extractCurrentJobTitle();
            const isAlreadyApplied = this.checkIfCurrentJobApplied();
            
            console.log(`📝 وظيفة حالية: ${jobTitle}`);
            console.log(`📊 حالة التقديم: ${isAlreadyApplied ? 'مقدم عليها' : 'لم يتم التقديم'}`);
            
            this.resumeData = {
                type: 'jobDetails',
                jobTitle: jobTitle,
                isApplied: isAlreadyApplied,
                url: window.location.href
            };
        }

        analyzeJobListPage() {
            this.currentPage = this.extractCurrentPageNumber();
            const totalJobs = document.querySelectorAll('a[href*="JobDetails"]').length;
            
            console.log(`📊 الصفحة الحالية: ${this.currentPage}`);
            console.log(`📋 عدد الوظائف في الصفحة: ${totalJobs}`);
            
            this.resumeData = {
                type: 'jobList',
                currentPage: this.currentPage,
                totalJobs: totalJobs,
                url: window.location.href
            };
        }

        extractCurrentJobTitle() {
            const titleSelectors = [
                'span.heading5',
                '.heading5',
                'h1', 'h2', 'h3',
                '.job-title',
                '[data-block*="JobTitle"]',
                '.page-title'
            ];
            
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    const title = element.textContent.trim();
                    if (title.length > 5 && !/^\d+$/.test(title)) {
                        return title;
                    }
                }
            }
            
            return 'وظيفة غير محددة';
        }

        checkIfCurrentJobApplied() {
            const appliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم على هذه الوظيفة',
                'طلب مقدم',
                'تم التقدم'
            ];
            
            const pageText = document.body.textContent || '';
            return appliedIndicators.some(indicator => pageText.includes(indicator));
        }

        extractCurrentPageNumber() {
            const activePageBtn = document.querySelector('.pagination-button.is--active, .pagination .active');
            if (activePageBtn) {
                const pageNum = parseInt(activePageBtn.textContent.trim());
                if (!isNaN(pageNum)) {
                    return pageNum;
                }
            }
            
            const urlMatch = window.location.href.match(/page[=:](\d+)/i);
            if (urlMatch) {
                return parseInt(urlMatch[1]);
            }
            
            return 1;
        }

        addVisualIndicator() {
            const existingIndicator = document.getElementById('jadarat-auto-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

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
                max-width: 300px;
                text-align: center;
            `;
            indicator.textContent = '🎯 جدارات أوتو - جاهز';
            document.body.appendChild(indicator);
        }

        showIndicator(text, color = '#00d4ff', duration = 0) {
            const indicator = document.getElementById('jadarat-auto-indicator');
            if (indicator) {
                indicator.textContent = text;
                indicator.style.background = `linear-gradient(45deg, ${color}, #7d2ae8)`;
                indicator.style.display = 'block';
                
                if (duration > 0) {
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, duration);
                }
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
                        sendResponse({ status: 'active', pageType: this.pageType });
                        break;
                        
                    case 'START_AUTOMATION':
                        this.settings = message.settings || this.settings;
                        await this.startSmartAutomation();
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

        async startSmartAutomation() {
            console.log('🧠 بدء الأتمتة الذكية');
            
            // فحص نوع الصفحة أولاً
            if (!this.pageType || this.pageType === 'unknown') {
                console.log('🔄 إعادة فحص نوع الصفحة قبل البدء...');
                await this.waitForContentToLoad();
                this.checkPageType();
            }
            
            // فحص تسجيل الدخول
            if (!this.checkLoginStatus()) {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: '⚠️ يجب تسجيل الدخول أولاً' 
                });
                this.showIndicator('⚠️ غير مسجل دخول', '#ff4545', 5000);
                return;
            }
            
            this.isRunning = true;
            this.isPaused = false;
            
            await this.smartStart();
        }

        async smartStart() {
            console.log(`🎯 البدء الذكي - نوع الصفحة: ${this.pageType}`);
            
            switch (this.pageType) {
                case 'jobDetails':
                    await this.startFromJobDetails();
                    break;
                    
                case 'jobList':
                    await this.startFromJobList();
                    break;
                    
                case 'home':
                    await this.navigateToJobList();
                    break;
                    
                default:
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'يرجى الانتقال إلى صفحة قائمة الوظائف أولاً' 
                    });
                    this.showIndicator('❌ صفحة غير مدعومة', '#ff4545', 5000);
            }
        }

        async startFromJobDetails() {
            console.log('📄 البدء من صفحة تفاصيل الوظيفة');
            
            const jobTitle = this.resumeData?.jobTitle || 'الوظيفة الحالية';
            
            this.showIndicator(`🔍 تم اكتشافك في: ${jobTitle}`, '#ffc107');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 0, 
                text: `معالجة الوظيفة الحالية: ${jobTitle}` 
            });

            const result = await this.processCurrentJob();
            
            if (result.completed) {
                this.showIndicator('⚡ سأعود للقائمة وأكمل باقي الوظائف', '#00ff88', 3000);
                
                await this.goBackToJobList();
                await this.startFromJobList();
            } else {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'فشل في معالجة الوظيفة الحالية' 
                });
            }
        }

        async startFromJobList() {
            console.log('📋 البدء من قائمة الوظائف');
            
            const pageInfo = this.resumeData || {};
            const currentPage = pageInfo.currentPage || 1;
            
            this.showIndicator(`🚀 العمل في الصفحة ${currentPage}`, '#00ff88');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 0, 
                text: `بدء المعالجة من الصفحة ${currentPage}` 
            });

            await this.processCurrentPage();
        }

        async processCurrentJob() {
            try {
                const jobTitle = this.resumeData?.jobTitle || 'الوظيفة الحالية';
                
                console.log(`📝 معالجة الوظيفة الحالية: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                await this.handlePopups();
                
                const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                
                if (alreadyApplied) {
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'skipped' 
                    });
                    console.log('⏭️ تم التخطي - مُقدم عليها مسبقاً');
                } else {
                    const applicationResult = await this.applyForJobWithRetry();
                    this.handleApplicationResult(applicationResult, jobTitle);
                }

                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                return { completed: true };

            } catch (error) {
                console.error('❌ خطأ في معالجة الوظيفة الحالية:', error);
                return { completed: false, error: error.message };
            }
        }

        async processCurrentPage() {
            if (!this.isRunning || this.isPaused) return;

            try {
                console.log('🔄 معالجة الصفحة الحالية');
                
                await this.wait(4000);
                
                const jobCards = this.getJobCardsWithRetry();
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
                    text: `العثور على ${this.totalJobs} وظيفة في الصفحة ${this.currentPage}` 
                });

                for (let i = 0; i < jobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        console.log('🛑 تم إيقاف العملية');
                        return;
                    }

                    const jobCard = jobCards[i];
                    console.log(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
                    
                    const success = await this.processJobWithRetry(jobCard, i + 1);
                    
                    if (!success) {
                        console.log(`⚠️ فشل في الوظيفة ${i + 1}، الانتقال للتالية`);
                    }
                    
                    const progress = ((i + 1) / jobCards.length) * 100;
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: progress, 
                        text: `الوظيفة ${i + 1}/${jobCards.length}` 
                    });

                    await this.wait(this.getRandomDelay());
                }

                await this.goToNextPage();

            } catch (error) {
                console.error('❌ خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        // باقي الدوال...
        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3;
            return base + (Math.random() * 2 - 1) * variation;
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

        // دوال مؤقتة مبسطة لباقي الوظائف
        async handlePopups() { return; }
        async checkIfAlreadyAppliedInDetails() { return false; }
        async applyForJobWithRetry() { return { success: false, reason: 'تحت التطوير' }; }
        handleApplicationResult() { return; }
        async goBackToJobList() { return; }
        async goToNextPage() { return; }
        getJobCardsWithRetry() { return []; }
        async processJobWithRetry() { return false; }
        async navigateToJobList() { return; }
    }

    // تهيئة المحتوى مع انتظار DOM
    function initializeContent() {
        try {
            if (!window.jadaratAutoContent) {
                window.jadaratAutoContent = new JadaratAutoContent();
            }
        } catch (error) {
            console.error('❌ خطأ في التهيئة:', error);
        }
    }

    // بدء التهيئة مع انتظار DOM
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
                    window.jadaratAutoContent.waitForPageLoadAndCheck();
                }
            }, 2000);
        }
    });

    observer.observe(document, { subtree: true, childList: true });
}