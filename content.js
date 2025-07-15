// جدارات أوتو - Content Script المُحسن مع إصلاح جميع المشاكل
// إصدار محسن: يستمر التقديم على جميع الوظائف + إصلاح استخراج البيانات

class JadaratAutoContentFixed {
    constructor() {
        this.isRunning = false;
        this.shouldStop = false;
        this.visitedJobs = new Set();
        this.rejectedJobs = new Set();
        this.currentJobIndex = 0;
        this.totalJobsOnPage = 0;
        this.currentPage = 1;
        this.totalPages = 1;
        
        // إحصائيات محسنة
        this.stats = {
            applied: 0,
            skipped: 0,
            rejected: 0,
            alreadyApplied: 0,
            total: 0,
            errors: 0
        };
        
        this.initializeContentScript();
    }

    async initializeContentScript() {
        console.log('🚀 جدارات أوتو - تم تحميل السكريبت المُحسن');
        await this.loadMemoryData();
        this.setupMessageListener();
        this.detectPageTypeAndPrepare();
    }

    async loadMemoryData() {
        try {
            const stored = await chrome.storage.local.get(['visitedJobs', 'rejectedJobs', 'stats']);
            
            if (stored.visitedJobs) {
                this.visitedJobs = new Set(stored.visitedJobs);
                console.log(`💾 تم تحميل ${this.visitedJobs.size} وظيفة مزارة من الذاكرة`);
            }
            
            if (stored.rejectedJobs) {
                this.rejectedJobs = new Set(stored.rejectedJobs);
                console.log(`💾 تم تحميل ${this.rejectedJobs.size} وظيفة مرفوضة من الذاكرة`);
            }
            
            if (stored.stats) {
                this.stats = { ...this.stats, ...stored.stats };
                console.log('💾 تم تحميل الإحصائيات من الذاكرة:', this.stats);
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات من الذاكرة:', error);
        }
    }

    async saveMemoryData() {
        try {
            await chrome.storage.local.set({
                visitedJobs: Array.from(this.visitedJobs),
                rejectedJobs: Array.from(this.rejectedJobs),
                stats: this.stats
            });
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات:', error);
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'START_AUTO_APPLY':
                    this.startAutoApply(message.settings);
                    sendResponse({ success: true });
                    break;
                case 'STOP_AUTO_APPLY':
                    this.stopAutoApply();
                    sendResponse({ success: true });
                    break;
                case 'GET_STATUS':
                    sendResponse({ 
                        isRunning: this.isRunning,
                        stats: this.stats,
                        currentJob: this.currentJobIndex,
                        totalJobs: this.totalJobsOnPage,
                        currentPage: this.currentPage
                    });
                    break;
                case 'PING':
                    sendResponse({ status: 'active' });
                    break;
            }
        });
    }

    detectPageTypeAndPrepare() {
        const url = window.location.href;
        let pageType = 'unknown';
        
        if (url.includes('JobDetails')) {
            pageType = 'jobDetails';
        } else if (url.includes('ExploreJobs') || url.includes('JobTab=1')) {
            pageType = 'jobList';
        } else if (url === 'https://jadarat.sa/' || url === 'https://jadarat.sa') {
            pageType = 'home';
        }
        
        console.log(`🎯 نوع الصفحة المكتشف: ${pageType}`);
        
        // تحضير البيانات الأولية للصفحات
        if (pageType === 'jobList') {
            setTimeout(() => this.prepareJobListData(), 2000);
        }
    }

    async prepareJobListData() {
        try {
            const jobs = await this.getJobsFromCurrentPage();
            this.totalJobsOnPage = jobs.length;
            console.log(`📊 تم اكتشاف ${this.totalJobsOnPage} وظيفة في الصفحة الحالية`);
            
            // اكتشاف إجمالي الصفحات
            this.detectTotalPages();
        } catch (error) {
            console.error('❌ خطأ في تحضير بيانات الصفحة:', error);
        }
    }

    detectTotalPages() {
        try {
            // البحث عن أرقام الصفحات
            const pageButtons = document.querySelectorAll('.pagination-button, [aria-label*="page"]');
            let maxPage = 1;
            
            pageButtons.forEach(button => {
                const pageNum = parseInt(button.textContent);
                if (!isNaN(pageNum) && pageNum > maxPage) {
                    maxPage = pageNum;
                }
            });
            
            this.totalPages = maxPage;
            console.log(`📄 إجمالي الصفحات المكتشفة: ${this.totalPages}`);
        } catch (error) {
            console.error('❌ خطأ في اكتشاف الصفحات:', error);
        }
    }

    async startAutoApply(settings = {}) {
        if (this.isRunning) {
            console.log('⚠️ العملية قيد التشغيل بالفعل');
            return;
        }

        console.log('🎯 بدء عملية التقديم التلقائي المُحسنة...');
        this.isRunning = true;
        this.shouldStop = false;
        this.settings = { delayTime: 3, ...settings };
        
        try {
            await this.runMainLoop();
        } catch (error) {
            console.error('❌ خطأ في العملية الرئيسية:', error);
        } finally {
            this.stopAutoApply();
        }
    }

    async runMainLoop() {
        console.log('🔄 بدء الحلقة الرئيسية للتقديم...');
        
        while (!this.shouldStop && this.isRunning) {
            const pageType = this.detectCurrentPageType();
            console.log(`📍 نوع الصفحة الحالية: ${pageType}`);
            
            if (pageType === 'jobList') {
                const hasMoreJobs = await this.processCurrentJobListPage();
                
                if (!hasMoreJobs && !this.shouldStop) {
                    // انتقل للصفحة التالية
                    const movedToNext = await this.moveToNextPage();
                    if (!movedToNext) {
                        console.log('✅ تم الانتهاء من جميع الصفحات');
                        break;
                    }
                }
            } else if (pageType === 'jobDetails') {
                // في حالة كنا في صفحة تفاصيل، ارجع للقائمة أولاً
                await this.goBackToJobList();
            } else if (pageType === 'home') {
                // انتقل لصفحة الوظائف
                await this.navigateToJobList();
            } else {
                console.log('❌ نوع صفحة غير مدعوم، محاولة التنقل...');
                await this.navigateToJobList();
            }
            
            await this.wait(1000); // توقف قصير بين العمليات
        }
        
        console.log('🏁 انتهت العملية الرئيسية');
        await this.displayFinalResults();
    }

    async processCurrentJobListPage() {
        console.log('📋 معالجة صفحة قائمة الوظائف...');
        
        // انتظار تحميل الصفحة
        await this.wait(3000);
        
        const jobs = await this.getJobsFromCurrentPage();
        console.log(`📊 تم العثور على ${jobs.length} وظيفة في الصفحة`);
        
        if (jobs.length === 0) {
            console.log('⚠️ لم يتم العثور على وظائف في هذه الصفحة');
            return false;
        }
        
        // معالجة كل وظيفة في الصفحة
        for (let i = 0; i < jobs.length && !this.shouldStop; i++) {
            this.currentJobIndex = i + 1;
            console.log(`\n📝 === معالجة الوظيفة ${this.currentJobIndex}/${jobs.length} ===`);
            
            try {
                await this.processJobFromList(jobs[i], i);
                await this.wait(this.settings.delayTime * 1000);
            } catch (error) {
                console.error(`❌ خطأ في معالجة الوظيفة ${this.currentJobIndex}:`, error);
                this.stats.errors++;
            }
            
            // حفظ التقدم كل 3 وظائف
            if (i % 3 === 0) {
                await this.saveMemoryData();
            }
        }
        
        return false; // انتهينا من جميع الوظائف في هذه الصفحة
    }

    async getJobsFromCurrentPage() {
        try {
            // انتظار إضافي للتأكد من تحميل المحتوى
            await this.wait(2000);
            
            // محاولات متعددة للعثور على الوظائف
            const selectors = [
                'a[href*="/Jadarat/JobDetails"]',
                'a[data-link][href*="JobDetails"]',
                '[data-container] a[href*="JobDetails"]',
                '.card a[href*="JobDetails"]'
            ];
            
            let jobs = [];
            
            for (const selector of selectors) {
                jobs = document.querySelectorAll(selector);
                if (jobs.length > 0) {
                    console.log(`✅ تم العثور على ${jobs.length} وظيفة باستخدام: ${selector}`);
                    break;
                }
            }
            
            // تحويل NodeList إلى Array وإضافة معلومات إضافية
            const jobsArray = Array.from(jobs).map((link, index) => {
                const jobData = this.extractJobDataFromListItem(link);
                return {
                    index,
                    element: link,
                    ...jobData
                };
            });
            
            console.log(`📊 إجمالي الوظائف المستخرجة: ${jobsArray.length}`);
            return jobsArray;
            
        } catch (error) {
            console.error('❌ خطأ في استخراج الوظائف:', error);
            return [];
        }
    }

    extractJobDataFromListItem(linkElement) {
        try {
            // البحث عن العنوان بطرق متعددة - إصلاح المشكلة الأولى
            let title = 'وظيفة غير محددة';
            const titleSelectors = [
                '.heading4.OSFillParent',
                '.heading4',
                '.heading5',
                '[data-expression]',
                'span[class*="heading"]'
            ];
            
            // البحث في العنصر نفسه وفي الحاوي الرئيسي
            const container = linkElement.closest('[data-container]') || linkElement.parentElement;
            
            for (const selector of titleSelectors) {
                let titleEl = linkElement.querySelector(selector) || container?.querySelector(selector);
                if (titleEl && titleEl.textContent.trim()) {
                    title = titleEl.textContent.trim();
                    if (title !== 'وظيفة غير محددة') break;
                }
            }
            
            // البحث عن اسم الشركة - إصلاح المشكلة الثانية
            let company = 'غير محدد';
            const companySelectors = [
                'a[data-link] span[data-expression]',
                '.company-name',
                'a[href="#"] span',
                '[data-expression]'
            ];
            
            for (const selector of companySelectors) {
                let companyEl = container?.querySelector(selector);
                if (companyEl) {
                    const companyText = companyEl.textContent.trim();
                    // تصفية النصوص التي تبدو كوصف وظيفي
                    if (companyText && 
                        companyText.length < 100 && 
                        !companyText.includes('دعم المدير') &&
                        !companyText.includes('الحفاظ على سجلات') &&
                        !companyText.includes('تنفيذ') &&
                        !companyText.includes('إجراءات')) {
                        company = companyText;
                        break;
                    }
                }
            }
            
            // فحص التقديم المسبق
            const alreadyApplied = this.checkAlreadyAppliedInList(container || linkElement);
            
            // استخراج معلومات إضافية
            const location = this.extractLocationFromList(container);
            const publishDate = this.extractPublishDateFromList(container);
            
            // إنشاء معرف فريد للوظيفة
            const jobId = this.generateJobId(linkElement.href, title, company);
            
            return {
                id: jobId,
                title,
                company,
                location,
                publishDate,
                alreadyApplied,
                url: linkElement.href,
                element: linkElement
            };
            
        } catch (error) {
            console.error('❌ خطأ في استخراج بيانات الوظيفة:', error);
            return {
                id: Date.now() + Math.random(),
                title: 'وظيفة غير محددة',
                company: 'غير محدد',
                location: 'غير محدد',
                publishDate: 'غير محدد',
                alreadyApplied: false,
                url: linkElement.href,
                element: linkElement
            };
        }
    }

    checkAlreadyAppliedInList(container) {
        try {
            // البحث عن مؤشرات التقديم المسبق
            const appliedIndicators = [
                'span:contains("تم التقدم")',
                'img[src*="tickcircle.svg"]',
                '.applied-indicator',
                '.text-primary:contains("تم")'
            ];
            
            for (const selector of appliedIndicators) {
                if (selector.includes(':contains')) {
                    // بحث يدوي للنصوص
                    const elements = container.querySelectorAll('span, div');
                    for (const el of elements) {
                        if (el.textContent.includes('تم التقدم') || el.textContent.includes('تم التقديم')) {
                            console.log('✅ وجد مؤشر "تم التقدم" في القائمة');
                            return true;
                        }
                    }
                } else {
                    if (container.querySelector(selector)) {
                        console.log('✅ وجد أيقونة "تم التقدم" في القائمة');
                        return true;
                    }
                }
            }
            
            console.log('✅ لم يتم التقدم على هذه الوظيفة في القائمة');
            return false;
        } catch (error) {
            console.error('❌ خطأ في فحص التقديم المسبق:', error);
            return false;
        }
    }

    extractLocationFromList(container) {
        try {
            const locationPatterns = [
                /المدينة:\s*(.+)/,
                /المنطقة:\s*(.+)/,
                /الموقع:\s*(.+)/
            ];
            
            const textContent = container?.textContent || '';
            
            for (const pattern of locationPatterns) {
                const match = textContent.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
            
            return 'غير محدد';
        } catch (error) {
            return 'غير محدد';
        }
    }

    extractPublishDateFromList(container) {
        try {
            const datePatterns = [
                /تاريخ النشر:\s*(\d{2}\/\d{2}\/\d{4})/,
                /نُشر في:\s*(\d{2}\/\d{2}\/\d{4})/,
                /(\d{2}\/\d{2}\/\d{4})/
            ];
            
            const textContent = container?.textContent || '';
            
            for (const pattern of datePatterns) {
                const match = textContent.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
            
            return 'غير محدد';
        } catch (error) {
            return 'غير محدد';
        }
    }

    generateJobId(url, title, company) {
        try {
            // استخراج معرف من URL إن وجد
            const urlParams = new URL(url).searchParams;
            const paramValue = urlParams.get('Param');
            if (paramValue) {
                return paramValue;
            }
            
            // إنشاء معرف من العنوان والشركة
            return btoa(encodeURIComponent(title + company)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
        } catch (error) {
            return Date.now() + Math.random();
        }
    }

    async processJobFromList(jobData, index) {
        try {
            console.log(`📝 معالجة: ${jobData.title}`);
            console.log(`🏢 الشركة: ${jobData.company}`);
            console.log(`📍 الموقع: ${jobData.location}`);
            console.log(`📅 تاريخ النشر: ${jobData.publishDate}`);
            
            // فحص إذا كانت مرفوضة مسبقاً
            if (this.rejectedJobs.has(jobData.id)) {
                console.log('❌ هذه الوظيفة مرفوضة مسبقاً، تخطي...');
                this.stats.skipped++;
                return;
            }
            
            // فحص إذا كانت مُقدم عليها مسبقاً في القائمة
            if (jobData.alreadyApplied) {
                console.log('✅ تم التقدم على هذه الوظيفة مسبقاً (من القائمة)');
                this.stats.alreadyApplied++;
                this.visitedJobs.add(jobData.id);
                return;
            }
            
            // فحص إذا كانت مزارة مسبقاً
            if (this.visitedJobs.has(jobData.id)) {
                console.log('🔄 تم زيارة هذه الوظيفة مسبقاً، تخطي...');
                this.stats.skipped++;
                return;
            }
            
            // النقر على رابط الوظيفة
            console.log('🖱️ النقر على رابط الوظيفة...');
            await this.clickElementImproved(jobData.element);
            
            // انتظار الانتقال لصفحة التفاصيل
            await this.waitForNavigationImproved();
            
            // معالجة الوظيفة في صفحة التفاصيل
            const result = await this.processJobInDetailsPage(jobData);
            
            // العودة لقائمة الوظائف
            await this.goBackToJobList();
            
            // انتظار تحميل القائمة مرة أخرى
            await this.wait(2000);
            
            return result;
            
        } catch (error) {
            console.error(`❌ خطأ في معالجة الوظيفة ${index + 1}:`, error);
            this.stats.errors++;
            
            // محاولة العودة للقائمة في حالة الخطأ
            try {
                await this.goBackToJobList();
            } catch (backError) {
                console.error('❌ خطأ في العودة للقائمة:', backError);
            }
        }
    }

    async processJobInDetailsPage(jobData) {
        try {
            console.log('📄 معالجة الوظيفة في صفحة التفاصيل...');
            
            // انتظار تحميل صفحة التفاصيل
            await this.waitForDetailsPageLoad();
            
            // معالجة النوافذ المنبثقة (نافذة التقييم الرقمي)
            await this.handlePopups();
            
            // فحص التقديم المسبق في صفحة التفاصيل
            const alreadyAppliedInDetails = await this.checkIfAlreadyAppliedInDetails();
            if (alreadyAppliedInDetails) {
                console.log('✅ تم التقدم على هذه الوظيفة مسبقاً (من التفاصيل)');
                this.stats.alreadyApplied++;
                this.visitedJobs.add(jobData.id);
                return 'already_applied';
            }
            
            // محاولة التقديم
            const applicationResult = await this.applyForJob();
            
            // تحديث الإحصائيات
            if (applicationResult === 'success') {
                this.stats.applied++;
                this.visitedJobs.add(jobData.id);
                console.log('✅ تم التقديم بنجاح!');
            } else if (applicationResult === 'rejected') {
                this.stats.rejected++;
                this.rejectedJobs.add(jobData.id);
                console.log('❌ تم رفض التقديم');
            } else {
                this.stats.errors++;
                console.log('⚠️ خطأ في عملية التقديم');
            }
            
            this.stats.total++;
            
            // حفظ التقدم
            await this.saveMemoryData();
            
            return applicationResult;
            
        } catch (error) {
            console.error('❌ خطأ في معالجة صفحة التفاصيل:', error);
            this.stats.errors++;
            return 'error';
        }
    }

    async waitForDetailsPageLoad() {
        try {
            console.log('⏳ انتظار تحميل صفحة التفاصيل...');
            
            const maxAttempts = 10;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                // البحث عن مؤشرات صفحة التفاصيل
                const detailsIndicators = [
                    '[data-block="Job.PostDetailsBlock"]',
                    'span.heading5',
                    'button:contains("تقديم")',
                    '.post-details'
                ];
                
                let found = false;
                for (const selector of detailsIndicators) {
                    if (selector.includes(':contains')) {
                        const buttons = document.querySelectorAll('button');
                        for (const btn of buttons) {
                            if (btn.textContent.includes('تقديم')) {
                                found = true;
                                break;
                            }
                        }
                    } else {
                        if (document.querySelector(selector)) {
                            found = true;
                            break;
                        }
                    }
                }
                
                if (found) {
                    console.log('✅ تم تحميل صفحة التفاصيل بنجاح');
                    await this.wait(1000); // انتظار إضافي للاستقرار
                    return true;
                }
                
                attempts++;
                await this.wait(1000);
            }
            
            console.log('⚠️ انتهت مهلة انتظار تحميل صفحة التفاصيل');
            return false;
            
        } catch (error) {
            console.error('❌ خطأ في انتظار تحميل التفاصيل:', error);
            return false;
        }
    }

    async checkIfAlreadyAppliedInDetails() {
        try {
            // البحث عن مؤشرات التقديم المسبق في صفحة التفاصيل
            const appliedIndicators = [
                'button:contains("استعراض طلب التقديم")',
                'button:contains("تم التقديم")',
                ':contains("تم التقديم على هذه الوظيفة")',
                '.applied-status'
            ];
            
            for (const selector of appliedIndicators) {
                if (selector.includes(':contains')) {
                    // بحث يدوي للنصوص
                    const elements = document.querySelectorAll('button, div, span');
                    for (const el of elements) {
                        const text = el.textContent.trim();
                        if (text.includes('استعراض طلب التقديم') || 
                            text.includes('تم التقديم على هذه الوظيفة') ||
                            text === 'تم التقديم') {
                            return true;
                        }
                    }
                } else {
                    if (document.querySelector(selector)) {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ خطأ في فحص التقديم المسبق في التفاصيل:', error);
            return false;
        }
    }

    async applyForJob() {
        try {
            console.log('🎯 بدء عملية التقديم...');
            
            // البحث عن زر التقديم
            const submitButton = await this.findSubmitButton();
            if (!submitButton) {
                console.log('❌ لم يتم العثور على زر التقديم');
                return 'error';
            }
            
            console.log('✅ تم العثور على زر التقديم');
            
            // النقر على زر التقديم
            await this.clickElementImproved(submitButton);
            await this.wait(2000);
            
            // معالجة نافذة التأكيد
            const confirmationResult = await this.handleConfirmationDialog();
            if (!confirmationResult) {
                console.log('❌ فشل في معالجة نافذة التأكيد');
                return 'error';
            }
            
            // معالجة نافذة النتيجة
            const resultDialog = await this.handleResultDialog();
            return resultDialog;
            
        } catch (error) {
            console.error('❌ خطأ في عملية التقديم:', error);
            return 'error';
        }
    }

    async findSubmitButton() {
        try {
            const selectors = [
                'button.btn.btn-primary[data-button]:contains("تقديم")',
                'button.btn.btn-primary:contains("تقديم")',
                'button[data-button]:contains("تقديم")',
                'button:contains("تقديم")'
            ];
            
            for (const selector of selectors) {
                if (selector.includes(':contains')) {
                    const buttons = document.querySelectorAll('button');
                    for (const btn of buttons) {
                        if (btn.textContent.trim() === 'تقديم' && 
                            btn.offsetWidth > 0 && 
                            !btn.disabled) {
                            return btn;
                        }
                    }
                } else {
                    const button = document.querySelector(selector);
                    if (button && !button.disabled) {
                        return button;
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ خطأ في البحث عن زر التقديم:', error);
            return null;
        }
    }

    async handleConfirmationDialog() {
        try {
            console.log('⏳ انتظار نافذة التأكيد...');
            
            const maxAttempts = 10;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                // البحث عن نافذة التأكيد
                const confirmDialog = this.findConfirmationDialog();
                
                if (confirmDialog) {
                    console.log('✅ تم العثور على نافذة التأكيد');
                    
                    // البحث عن زر التأكيد
                    const confirmButton = this.findConfirmButton(confirmDialog);
                    if (confirmButton) {
                        console.log('🖱️ النقر على زر التأكيد...');
                        await this.clickElementImproved(confirmButton);
                        await this.wait(2000);
                        return true;
                    } else {
                        console.log('❌ لم يتم العثور على زر التأكيد');
                        return false;
                    }
                }
                
                attempts++;
                await this.wait(1000);
            }
            
            console.log('⚠️ انتهت مهلة انتظار نافذة التأكيد');
            return false;
            
        } catch (error) {
            console.error('❌ خطأ في معالجة نافذة التأكيد:', error);
            return false;
        }
    }

    findConfirmationDialog() {
        try {
            // البحث عن نافذة التأكيد
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                const text = dialog.textContent;
                if (text.includes('هل أنت متأكد') || 
                    text.includes('تأكيد التقديم') ||
                    text.includes('التقديم على وظيفة')) {
                    return dialog;
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ خطأ في البحث عن نافذة التأكيد:', error);
            return null;
        }
    }

    findConfirmButton(dialog) {
        try {
            const buttons = dialog.querySelectorAll('button');
            
            for (const btn of buttons) {
                const text = btn.textContent.trim();
                if (text === 'تقديم' || text === 'نعم' || text === 'موافق') {
                    return btn;
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ خطأ في البحث عن زر التأكيد:', error);
            return null;
        }
    }

    async handleResultDialog() {
        try {
            console.log('⏳ انتظار نافذة النتيجة...');
            
            const maxAttempts = 15;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                const resultDialog = this.findResultDialog();
                
                if (resultDialog) {
                    const dialogText = resultDialog.textContent;
                    console.log('✅ تم العثور على نافذة النتيجة');
                    
                    let result = 'unknown';
                    
                    if (dialogText.includes('تم التقديم بنجاح')) {
                        console.log('✅ نجح التقديم!');
                        result = 'success';
                    } else if (dialogText.includes('لا يمكنك التقديم') || 
                               dialogText.includes('عذراً') ||
                               dialogText.includes('غير مؤهل')) {
                        console.log('❌ تم رفض التقديم');
                        result = 'rejected';
                        
                        // استخراج سبب الرفض
                        const rejectionReason = this.extractRejectionReason(dialogText);
                        await this.saveRejectionData(rejectionReason);
                    }
                    
                    // إغلاق النافذة
                    await this.closeResultDialog(resultDialog);
                    
                    return result;
                }
                
                attempts++;
                await this.wait(1000);
            }
            
            console.log('⚠️ انتهت مهلة انتظار نافذة النتيجة');
            return 'timeout';
            
        } catch (error) {
            console.error('❌ خطأ في معالجة نافذة النتيجة:', error);
            return 'error';
        }
    }

    findResultDialog() {
        try {
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                const text = dialog.textContent;
                if (text.includes('تم التقديم بنجاح') || 
                    text.includes('لا يمكنك التقديم') ||
                    text.includes('عذراً') ||
                    text.includes('تم الرفض')) {
                    return dialog;
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ خطأ في البحث عن نافذة النتيجة:', error);
            return null;
        }
    }

    extractRejectionReason(dialogText) {
        try {
            // أسباب الرفض الشائعة
            const reasons = [
                'الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب',
                'لا يطابق شرط الخبرة المطلوبة',
                'لا يطابق شرط العمر المطلوب',
                'لا يطابق شرط الجنس المطلوب',
                'انتهت فترة التقديم',
                'غير مؤهل'
            ];
            
            for (const reason of reasons) {
                if (dialogText.includes(reason)) {
                    return reason;
                }
            }
            
            // إذا لم نجد سبب محدد، نأخذ أول جملة بعد "السبب:"
            const reasonMatch = dialogText.match(/السبب:\s*(.+?)(?:\n|$)/);
            if (reasonMatch && reasonMatch[1]) {
                return reasonMatch[1].trim();
            }
            
            return 'سبب غير محدد';
        } catch (error) {
            console.error('❌ خطأ في استخراج سبب الرفض:', error);
            return 'خطأ في استخراج السبب';
        }
    }

    async saveRejectionData(reason) {
        try {
            const rejectionData = {
                date: new Date().toLocaleDateString('ar-SA'),
                time: new Date().toLocaleTimeString('ar-SA'),
                jobTitle: this.getCurrentJobTitle(),
                reason: reason
            };
            
            // إرسال البيانات للـ background script
            chrome.runtime.sendMessage({
                action: 'SAVE_REJECTION_DATA',
                rejectionData: rejectionData
            });
            
            console.log('💾 تم حفظ بيانات الرفض:', rejectionData);
        } catch (error) {
            console.error('❌ خطأ في حفظ بيانات الرفض:', error);
        }
    }

    getCurrentJobTitle() {
        try {
            const titleSelectors = [
                'span.heading5',
                '.heading4',
                'h1',
                '[data-expression]'
            ];
            
            for (const selector of titleSelectors) {
                const titleEl = document.querySelector(selector);
                if (titleEl && titleEl.textContent.trim()) {
                    return titleEl.textContent.trim();
                }
            }
            
            return 'وظيفة غير محددة';
        } catch (error) {
            return 'وظيفة غير محددة';
        }
    }

    async closeResultDialog(dialog) {
        try {
            // البحث عن أزرار الإغلاق
            const closeButtons = dialog.querySelectorAll('button');
            
            for (const btn of closeButtons) {
                const text = btn.textContent.trim();
                if (text === 'إغلاق' || text === 'موافق' || text === 'OK' || text === '×') {
                    console.log('🖱️ إغلاق نافذة النتيجة...');
                    await this.clickElementImproved(btn);
                    await this.wait(1000);
                    return true;
                }
            }
            
            // محاولة النقر خارج النافذة
            const backdrop = document.querySelector('.modal-backdrop, .overlay');
            if (backdrop) {
                await this.clickElementImproved(backdrop);
                await this.wait(1000);
                return true;
            }
            
            console.log('⚠️ لم يتم العثور على زر إغلاق');
            return false;
        } catch (error) {
            console.error('❌ خطأ في إغلاق نافذة النتيجة:', error);
            return false;
        }
    }

    async handlePopups() {
        try {
            console.log('🔍 فحص النوافذ المنبثقة...');
            
            // نافذة التقييم الرقمي
            const digitalDialog = this.findDigitalExperienceDialog();
            if (digitalDialog) {
                console.log('✅ تم العثور على نافذة التقييم الرقمي، جار الإغلاق...');
                await this.closeDigitalExperienceDialog(digitalDialog);
            }
            
            // أي نوافذ أخرى غير مرغوب فيها
            const unwantedModals = document.querySelectorAll('[role="dialog"]:not([data-processed])');
            for (const modal of unwantedModals) {
                const text = modal.textContent;
                if (text.includes('تقييم') || text.includes('استطلاع') || text.includes('تجربة')) {
                    console.log('🗑️ إغلاق نافذة غير مرغوب فيها...');
                    await this.closeGenericModal(modal);
                    modal.setAttribute('data-processed', 'true');
                }
            }
            
        } catch (error) {
            console.error('❌ خطأ في معالجة النوافذ المنبثقة:', error);
        }
    }

    findDigitalExperienceDialog() {
        try {
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                const text = dialog.textContent;
                if (text.includes('تقييم تجربتك الرقمية') || 
                    text.includes('تقييم') ||
                    text.includes('استطلاع')) {
                    return dialog;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    async closeDigitalExperienceDialog(dialog) {
        try {
            // البحث عن زر الإغلاق
            const closeButtons = dialog.querySelectorAll('button, [role="button"]');
            
            for (const btn of closeButtons) {
                const text = btn.textContent.trim();
                if (text === '×' || text === 'إغلاق' || text === 'تخطي' || text.includes('close')) {
                    await this.clickElementImproved(btn);
                    await this.wait(1000);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('❌ خطأ في إغلاق نافذة التقييم الرقمي:', error);
            return false;
        }
    }

    async closeGenericModal(modal) {
        try {
            // زر الإغلاق
            const closeBtn = modal.querySelector('button:contains("×"), button:contains("إغلاق"), .close');
            if (closeBtn) {
                await this.clickElementImproved(closeBtn);
                return true;
            }
            
            // النقر خارج النافذة
            document.body.click();
            return true;
        } catch (error) {
            return false;
        }
    }

    async goBackToJobList() {
        try {
            console.log('🔙 العودة لقائمة الوظائف...');
            
            // محاولة استخدام زر الرجوع في المتصفح
            window.history.back();
            
            // انتظار الانتقال
            await this.wait(3000);
            
            // التحقق من الوصول لقائمة الوظائف
            const maxAttempts = 5;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                if (this.detectCurrentPageType() === 'jobList') {
                    console.log('✅ تم الرجوع بنجاح لقائمة الوظائف');
                    return true;
                }
                
                if (attempts === 2) {
                    // محاولة التنقل المباشر
                    console.log('🔄 محاولة التنقل المباشر لقائمة الوظائف...');
                    await this.navigateToJobList();
                }
                
                attempts++;
                await this.wait(2000);
            }
            
            console.log('⚠️ فشل في العودة لقائمة الوظائف');
            return false;
            
        } catch (error) {
            console.error('❌ خطأ في العودة لقائمة الوظائف:', error);
            return false;
        }
    }

    async navigateToJobList() {
        try {
            console.log('🧭 التنقل لقائمة الوظائف...');
            
            const jobListUrls = [
                'https://jadarat.sa/ExploreJobs',
                'https://jadarat.sa/Jadarat/?JobTab=1'
            ];
            
            // محاولة العثور على رابط في الصفحة أولاً
            const jobListLink = document.querySelector('a[href*="ExploreJobs"], a[href*="JobTab=1"]');
            if (jobListLink) {
                console.log('🖱️ النقر على رابط قائمة الوظائف...');
                await this.clickElementImproved(jobListLink);
                await this.wait(3000);
                return true;
            }
            
            // التنقل المباشر
            console.log('🌐 التنقل المباشر لقائمة الوظائف...');
            window.location.href = jobListUrls[0];
            await this.wait(4000);
            
            return true;
        } catch (error) {
            console.error('❌ خطأ في التنقل لقائمة الوظائف:', error);
            return false;
        }
    }

    async moveToNextPage() {
        try {
            console.log('📄 محاولة الانتقال للصفحة التالية...');
            
            // البحث عن زر الصفحة التالية
            const nextButtons = [
                'button[aria-label*="go to next page"]:not([disabled])',
                'button[aria-label*="next"]:not([disabled])',
                '.pagination-next:not(.disabled)',
                'a[href*="page="]:contains("التالي")'
            ];
            
            for (const selector of nextButtons) {
                let nextButton;
                
                if (selector.includes(':contains')) {
                    const links = document.querySelectorAll('a[href*="page="]');
                    for (const link of links) {
                        if (link.textContent.includes('التالي') || link.textContent.includes('>')) {
                            nextButton = link;
                            break;
                        }
                    }
                } else {
                    nextButton = document.querySelector(selector);
                }
                
                if (nextButton && !nextButton.disabled) {
                    console.log('✅ تم العثور على زر الصفحة التالية');
                    this.currentPage++;
                    
                    await this.clickElementImproved(nextButton);
                    await this.wait(4000);
                    
                    // التحقق من نجاح الانتقال
                    if (this.detectCurrentPageType() === 'jobList') {
                        console.log(`📄 تم الانتقال للصفحة ${this.currentPage}`);
                        return true;
                    }
                }
            }
            
            console.log('📄 لا توجد صفحة تالية أو تم الوصول للنهاية');
            return false;
            
        } catch (error) {
            console.error('❌ خطأ في الانتقال للصفحة التالية:', error);
            return false;
        }
    }

    detectCurrentPageType() {
        try {
            const url = window.location.href;
            
            // فحص صفحة التفاصيل
            if (url.includes('JobDetails')) {
                const detailsIndicators = [
                    '[data-block="Job.PostDetailsBlock"]',
                    'span.heading5',
                    '.post-details'
                ];
                
                for (const selector of detailsIndicators) {
                    if (document.querySelector(selector)) {
                        return 'jobDetails';
                    }
                }
            }
            
            // فحص قائمة الوظائف
            if (url.includes('ExploreJobs') || url.includes('JobTab=1')) {
                const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
                if (jobLinks.length >= 2) {
                    return 'jobList';
                }
            }
            
            // الصفحة الرئيسية
            if (url === 'https://jadarat.sa/' || url === 'https://jadarat.sa') {
                return 'home';
            }
            
            return 'unknown';
        } catch (error) {
            console.error('❌ خطأ في تحديد نوع الصفحة:', error);
            return 'unknown';
        }
    }

    async waitForNavigationImproved() {
        try {
            console.log('⏳ انتظار الانتقال...');
            
            const startUrl = window.location.href;
            const maxAttempts = 15;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                const currentUrl = window.location.href;
                
                // تحقق من تغيير URL
                if (currentUrl !== startUrl) {
                    console.log('✅ تم الانتقال بنجاح');
                    await this.wait(2000); // انتظار إضافي للاستقرار
                    return true;
                }
                
                attempts++;
                await this.wait(1000);
            }
            
            console.log('⚠️ انتهت مهلة انتظار الانتقال');
            return false;
            
        } catch (error) {
            console.error('❌ خطأ في انتظار الانتقال:', error);
            return false;
        }
    }

    async clickElementImproved(element) {
        try {
            if (!element) {
                throw new Error('العنصر غير موجود');
            }
            
            // التمرير للعنصر
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.wait(500);
            
            // التحقق من الرؤية
            if (element.offsetWidth === 0 || element.offsetHeight === 0) {
                throw new Error('العنصر غير مرئي');
            }
            
            // النقر بطرق متعددة
            const clickMethods = [
                () => element.click(),
                () => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
                () => {
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        buttons: 1
                    });
                    element.dispatchEvent(event);
                }
            ];
            
            for (const method of clickMethods) {
                try {
                    method();
                    await this.wait(500);
                    return true;
                } catch (clickError) {
                    console.log('⚠️ فشل في طريقة النقر، محاولة الطريقة التالية...');
                }
            }
            
            throw new Error('فشل في جميع طرق النقر');
            
        } catch (error) {
            console.error('❌ خطأ في النقر على العنصر:', error);
            return false;
        }
    }

    stopAutoApply() {
        console.log('🛑 إيقاف عملية التقديم التلقائي...');
        this.shouldStop = true;
        this.isRunning = false;
        
        // حفظ البيانات النهائية
        this.saveMemoryData();
    }

    async displayFinalResults() {
        try {
            console.log('\n🏆 ===== النتائج النهائية =====');
            console.log(`✅ تم التقديم على: ${this.stats.applied} وظيفة`);
            console.log(`⏭️ تم تخطي: ${this.stats.skipped} وظيفة`);
            console.log(`❌ تم رفض: ${this.stats.rejected} وظيفة`);
            console.log(`🔄 مُقدم عليها مسبقاً: ${this.stats.alreadyApplied} وظيفة`);
            console.log(`⚠️ أخطاء: ${this.stats.errors}`);
            console.log(`📊 إجمالي المعالجة: ${this.stats.total} وظيفة`);
            console.log(`💾 الوظائف المزارة: ${this.visitedJobs.size}`);
            console.log(`🚫 الوظائف المرفوضة: ${this.rejectedJobs.size}`);
            console.log('=====================================\n');
            
            // إرسال النتائج للـ popup
            chrome.runtime.sendMessage({
                action: 'PROCESS_COMPLETED',
                stats: this.stats,
                visitedCount: this.visitedJobs.size,
                rejectedCount: this.rejectedJobs.size
            });
            
            // حفظ النتائج النهائية
            await this.saveMemoryData();
            
        } catch (error) {
            console.error('❌ خطأ في عرض النتائج النهائية:', error);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// تهيئة السكريبت عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jadaratAuto = new JadaratAutoContentFixed();
    });
} else {
    window.jadaratAuto = new JadaratAutoContentFixed();
}

// تصدير للاستخدام العام
window.JadaratAutoContentFixed = JadaratAutoContentFixed;