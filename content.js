// جدارات أوتو - Content Script الذكي المتكيف 100%
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى الذكي');

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
            this.resumeData = null; // بيانات الاستكمال
            
            this.initializeListeners();
            this.checkPageType();
            this.addVisualIndicator();
            
            console.log('✅ جدارات أوتو: تم التهيئة بنجاح - النسخة الذكية');
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
            
            // فحص مؤشرات صفحة تفاصيل الوظيفة
            const detailsIndicators = [
                'نوع العمل',
                'الراتب', 
                'الجنس',
                'المنطقة',
                'المؤهل العلمي',
                'سنوات الخبرة',
                'تاريخ بداية النشر',
                'وصف الوظيفة'
            ];
            
            let detailsScore = 0;
            for (const indicator of detailsIndicators) {
                if (pageText.includes(indicator)) {
                    detailsScore++;
                }
            }
            
            // فحص وجود روابط متعددة للوظائف
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 2;
            
            // فحص وجود pagination
            const hasPagination = document.querySelector('button[aria-label*="next page"], .pagination');
            
            // تحديد نوع الصفحة بدقة
            if (detailsScore >= 4 || (url.includes('JobDetails') && !hasMultipleJobs)) {
                this.pageType = 'jobDetails';
                console.log('📄 صفحة تفاصيل وظيفة مكتشفة');
                this.analyzeJobDetailsPage();
            } else if (hasMultipleJobs || url.includes('ExploreJobs') || hasPagination) {
                this.pageType = 'jobList';
                console.log('📋 صفحة قائمة الوظائف مكتشفة');
                this.analyzeJobListPage();
            } else if (url.includes('jadarat.sa') && pageText.includes('البحث عن الوظائف')) {
                this.pageType = 'home';
                console.log('🏠 الصفحة الرئيسية مكتشفة');
            } else {
                this.pageType = 'unknown';
                console.log('❓ صفحة غير معروفة');
            }
        }

        analyzeJobDetailsPage() {
            // تحليل صفحة تفاصيل الوظيفة
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
            // تحليل صفحة قائمة الوظائف
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
                'h1',
                '.heading1',
                '.job-title',
                '[data-block*="JobTitle"]',
                '.page-title'
            ];
            
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            
            return 'وظيفة غير محددة';
        }

        checkIfCurrentJobApplied() {
            // فحص حالة التقديم في صفحة التفاصيل
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
            // استخراج رقم الصفحة الحالية
            const activePageBtn = document.querySelector('.pagination-button.is--active, .pagination .active');
            if (activePageBtn) {
                const pageNum = parseInt(activePageBtn.textContent.trim());
                if (!isNaN(pageNum)) {
                    return pageNum;
                }
            }
            
            // البحث في URL
            const urlMatch = window.location.href.match(/page[=:](\d+)/i);
            if (urlMatch) {
                return parseInt(urlMatch[1]);
            }
            
            return 1; // افتراضي
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
            
            // البدء الذكي حسب نوع الصفحة
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
                        error: 'يرجى الانتقال إلى موقع جدارات أولاً' 
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

            // معالجة الوظيفة الحالية
            const result = await this.processCurrentJob();
            
            if (result.completed) {
                this.showIndicator('⚡ سأعود للقائمة وأكمل باقي الوظائف', '#00ff88', 3000);
                
                // العودة لقائمة الوظائف
                await this.goBackToJobList();
                
                // المتابعة من قائمة الوظائف
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

        async navigateToJobList() {
            console.log('🔄 الانتقال لقائمة الوظائف');
            
            this.showIndicator('🔄 جاري الانتقال لقائمة الوظائف...', '#ffc107');
            
            // البحث عن رابط قائمة الوظائف
            const exploreJobsLink = document.querySelector('a[href*="ExploreJobs"], a[href*="JobTab=1"]');
            
            if (exploreJobsLink) {
                this.clickElementImproved(exploreJobsLink);
                await this.waitForNavigationImproved();
                await this.wait(3000);
                
                this.checkPageType();
                
                if (this.pageType === 'jobList') {
                    await this.startFromJobList();
                } else {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'فشل في الانتقال لقائمة الوظائف' 
                    });
                }
            } else {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'لم يتم العثور على رابط قائمة الوظائف' 
                });
            }
        }

        async processCurrentJob() {
            // معالجة الوظيفة الحالية في صفحة التفاصيل
            try {
                const jobTitle = this.resumeData?.jobTitle || 'الوظيفة الحالية';
                
                console.log(`📝 معالجة الوظيفة الحالية: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                // التعامل مع النوافذ المنبثقة أولاً
                await this.handlePopups();
                
                // فحص حالة التقديم
                const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                
                if (alreadyApplied) {
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'skipped' 
                    });
                    console.log('⏭️ تم التخطي - مُقدم عليها مسبقاً');
                } else {
                    // محاولة التقديم
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
                
                // انتظار تحميل الصفحة
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

                // معالجة كل وظيفة مع آلية إعادة المحاولة
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
                        // لا نتوقف، نتابع للوظيفة التالية
                    }
                    
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

        getJobCardsWithRetry(maxRetries = 3) {
            // كشف الوظائف مع إعادة المحاولة
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                console.log(`🔍 محاولة كشف الوظائف ${attempt}/${maxRetries}`);
                
                const jobCards = this.getJobCards();
                
                if (jobCards.length > 0) {
                    console.log(`✅ تم العثور على ${jobCards.length} وظيفة`);
                    return jobCards;
                }
                
                console.log(`⚠️ لم يتم العثور على وظائف في المحاولة ${attempt}`);
                
                if (attempt < maxRetries) {
                    // انتظار وإعادة تحميل
                    setTimeout(() => {
                        window.scrollTo(0, document.body.scrollHeight / 2);
                    }, 1000 * attempt);
                }
            }
            
            return [];
        }

        async processJobWithRetry(jobCard, jobIndex, maxRetries = 2) {
            // معالجة الوظيفة مع إعادة المحاولة
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🎯 محاولة ${attempt}/${maxRetries} لمعالجة: ${jobCard.title}`);
                    
                    await this.processJob(jobCard, jobIndex);
                    return true; // نجح
                    
                } catch (error) {
                    console.error(`❌ فشلت المحاولة ${attempt}:`, error.message);
                    
                    if (attempt < maxRetries) {
                        console.log('🔄 إعادة المحاولة...');
                        
                        // العودة للقائمة قبل إعادة المحاولة
                        try {
                            await this.goBackToJobList();
                        } catch (backError) {
                            console.error('❌ فشل في العودة:', backError.message);
                        }
                        
                        await this.wait(3000);
                    }
                }
            }
            
            // فشل في جميع المحاولات
            console.error(`❌ فشل نهائياً في معالجة: ${jobCard.title}`);
            this.stats.skipped++;
            this.stats.total++;
            this.sendMessage('UPDATE_STATS', { stats: this.stats });
            
            return false;
        }

        getJobCards() {
            console.log('🔍 البحث عن بطاقات الوظائف');
            
            const jobCards = [];
            
            // محددات متعددة للبحث
            const selectors = [
                'a[data-link][href*="/Jadarat/JobDetails"]',
                'a[href*="JobDetails"]',
                'a[href*="Param="]'
            ];
            
            let jobLinks = [];
            for (const selector of selectors) {
                jobLinks = document.querySelectorAll(selector);
                if (jobLinks.length > 0) {
                    console.log(`🔗 تم العثور على ${jobLinks.length} رابط باستخدام: ${selector}`);
                    break;
                }
            }
            
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
            // استخراج عنوان الوظيفة مع محددات متعددة
            const titleSelectors = [
                'span.heading4',
                '.heading4',
                'span[data-expression]',
                'span',
                '.job-title'
            ];
            
            for (const selector of titleSelectors) {
                const element = link.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            
            // البحث في النص المحيط
            const parentText = link.parentElement?.textContent || '';
            if (parentText.length > 10 && parentText.length < 100) {
                return parentText.trim();
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
                                 container.textContent.includes('تاريخ النشر') ||
                                 container.textContent.includes('الوظائف المتاحة');
                
                if (hasJobInfo) {
                    return container;
                }
            }
            
            return link.closest('[data-container]') || link.parentElement;
        }

        checkIfAlreadyApplied(container) {
            // فحص حالة التقديم مع طرق متعددة
            const text = container.textContent || '';
            const html = container.innerHTML || '';
            
            // فحص النص
            const appliedTexts = ['تم التقدم', 'تم التقديم', 'مقدم عليها'];
            for (const appliedText of appliedTexts) {
                if (text.includes(appliedText)) {
                    return true;
                }
            }
            
            // فحص الأيقونة
            if (html.includes('tickcircle.svg') || html.includes('check-circle')) {
                return true;
            }
            
            return false;
        }

        async processJob(jobCard, jobIndex) {
            const jobTitle = jobCard.title;
            console.log(`🎯 معالجة: ${jobTitle}`);
            
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobTitle, 
                status: 'processing' 
            });

            // تمييز الرابط
            this.highlightElement(jobCard.link);

            // النقر على الوظيفة مع آلية محسنة
            console.log('👆 النقر على رابط الوظيفة');
            await this.clickElementImproved(jobCard.link);
            
            // انتظار التنقل مع تحسينات
            await this.waitForNavigationImproved();
            await this.wait(4000);
            
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
                    const result = await this.applyForJobWithRetry();
                    
                    this.handleApplicationResult(result, jobTitle);
                }

                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });

                // العودة للقائمة
                await this.goBackToJobList();
                
            } else {
                throw new Error('فشل في فتح صفحة التفاصيل');
            }
        }

        handleApplicationResult(result, jobTitle) {
            // معالجة نتيجة التقديم
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
                console.log('❌ تم رفض التقديم:', result.reason);
                
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

        async handlePopups() {
            console.log('🔍 فحص النوافذ المنبثقة');
            
            await this.wait(2000);
            
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
                            this.clickElementImproved(btn);
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

        async applyForJobWithRetry(maxRetries = 2) {
            // تطبيق للوظيفة مع إعادة المحاولة
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📝 محاولة التقديم ${attempt}/${maxRetries}`);
                    
                    const result = await this.applyForJob();
                    
                    if (result.success || result.type === 'rejection') {
                        return result; // نجح أو رُفض (كلاهما نتيجة واضحة)
                    }
                    
                    if (attempt < maxRetries) {
                        console.log('🔄 إعادة محاولة التقديم...');
                        await this.wait(3000);
                    }
                    
                } catch (error) {
                    console.error(`❌ خطأ في محاولة التقديم ${attempt}:`, error);
                    if (attempt === maxRetries) {
                        return { success: false, reason: error.message };
                    }
                }
            }
            
            return { success: false, reason: 'فشل في جميع محاولات التقديم' };
        }

        async applyForJob() {
            console.log('📝 بدء عملية التقديم');
            
            try {
                await this.wait(3000);
                
                const submitButton = this.findSubmitButton();
                
                if (!submitButton) {
                    return { success: false, reason: 'لم يتم العثور على زر التقديم' };
                }

                console.log('👆 النقر على زر التقديم');
                await this.clickElementImproved(submitButton);
                
                // انتظار نافذة التأكيد
                await this.wait(4000);
                await this.handleConfirmationDialog();
                
                // انتظار نافذة النتيجة
                await this.wait(4000);
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
                            await this.clickElementImproved(confirmButton);
                            await this.wait(3000);
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
                            await this.clickElementImproved(closeButton);
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
                            await this.clickElementImproved(closeButton);
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
            
            // محاولة الضغط على زر الرجوع أولاً
            const backButton = document.querySelector('button[aria-label*="back"], .back-button, [class*="back"]');
            if (backButton && backButton.offsetWidth > 0) {
                await this.clickElementImproved(backButton);
            } else {
                // استخدام history.back()
                window.history.back();
            }
            
            await this.waitForNavigationImproved();
            await this.wait(4000);
            
            this.checkPageType();
            
            if (this.pageType === 'jobList') {
                console.log('✅ تم العودة بنجاح');
                window.scrollTo(0, 0);
            } else {
                console.log('⚠️ قد تكون العودة لم تنجح، محاولة التنقل المباشر');
                // محاولة الذهاب لقائمة الوظائف مباشرة
                const exploreJobsLink = document.querySelector('a[href*="ExploreJobs"], a[href*="JobTab=1"]');
                if (exploreJobsLink) {
                    await this.clickElementImproved(exploreJobsLink);
                    await this.waitForNavigationImproved();
                    await this.wait(3000);
                    this.checkPageType();
                }
            }
        }

        async goToNextPage() {
            console.log('🔍 البحث عن الصفحة التالية');
            
            const nextButton = document.querySelector('button[aria-label="go to next page"]:not([disabled])');
            
            if (nextButton) {
                console.log('➡️ الانتقال للصفحة التالية');
                this.currentPage++;
                
                await this.clickElementImproved(nextButton);
                await this.waitForNavigationImproved();
                await this.wait(5000);
                
                await this.processCurrentPage();
            } else {
                console.log('🏁 انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
                this.showIndicator('🎉 تم الانتهاء من جميع الوظائف!', '#00ff88', 10000);
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
                }, 3000);
            }
        }

        async clickElementImproved(element) {
            if (!element) return false;
            
            try {
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
                
                // انتظار التمرير
                await this.wait(1000);
                
                // محاولة النقر المباشر
                console.log('🎯 محاولة النقر المباشر');
                element.click();
                
                await this.wait(1000);
                
                return true;
                
            } catch (error1) {
                try {
                    console.log('🎯 محاولة النقر بالـ Event');
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    element.dispatchEvent(event);
                    
                    await this.wait(1000);
                    return true;
                    
                } catch (error2) {
                    try {
                        console.log('🎯 محاولة التنقل المباشر');
                        if (element.href) {
                            window.location.href = element.href;
                            return true;
                        }
                    } catch (error3) {
                        console.error('❌ فشل في جميع طرق النقر:', error3);
                        return false;
                    }
                }
            }
        }

        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3;
            return base + (Math.random() * 2 - 1) * variation;
        }

        async waitForNavigationImproved() {
            console.log('⏳ انتظار التنقل...');
            
            return new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 100; // زيادة المحاولات
                const currentUrl = window.location.href;
                
                const checkForChange = () => {
                    attempts++;
                    
                    // فحص تغيير URL
                    const urlChanged = window.location.href !== currentUrl;
                    
                    // فحص حالة التحميل
                    const pageLoaded = document.readyState === 'complete';
                    
                    if (urlChanged || pageLoaded || attempts >= maxAttempts) {
                        console.log(`✅ التنقل مكتمل بعد ${attempts} محاولة`);
                        setTimeout(resolve, 500);
                    } else {
                        setTimeout(checkForChange, 200);
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
            }, 2000);
        }
    });

    observer.observe(document, { subtree: true, childList: true });
}