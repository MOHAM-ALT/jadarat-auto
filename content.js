// جدارات أوتو - Content Script مُنظف ومُكتمل
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

            // نظام تتبع الوظائف
            this.visitedJobs = new Set();
            this.rejectedJobs = new Set();
            
            this.currentPage = 1;
            this.currentJobIndex = 0;
            this.totalJobs = 0;
            this.pageType = 'unknown';
            
            this.loadVisitedJobs();
            this.loadRejectedJobs();
            this.initializeListeners();
            this.checkPageType();
            this.addVisualIndicator();
            
            this.debugLog('✅ جدارات أوتو: تم التهيئة بنجاح');
        }

        // ===============================
        // نظام إدارة الوظائف المزارة
        // ===============================

        async loadVisitedJobs() {
            try {
                const result = await chrome.storage.local.get(['visitedJobs']);
                if (result.visitedJobs && Array.isArray(result.visitedJobs)) {
                    this.visitedJobs = new Set(result.visitedJobs);
                    this.debugLog(`🧠 تم تحميل ${this.visitedJobs.size} وظيفة مزارة من الذاكرة`);
                }
            } catch (error) {
                this.debugLog('❌ خطأ في تحميل الوظائف المزارة:', error);
            }
        }

        async saveVisitedJobs() {
            try {
                const visitedArray = Array.from(this.visitedJobs);
                await chrome.storage.local.set({ visitedJobs: visitedArray });
                this.debugLog(`💾 تم حفظ ${visitedArray.length} وظيفة مزارة`);
            } catch (error) {
                this.debugLog('❌ خطأ في حفظ الوظائف المزارة:', error);
            }
        }

        async loadRejectedJobs() {
            try {
                const result = await chrome.storage.local.get(['rejectedJobs']);
                if (result.rejectedJobs && Array.isArray(result.rejectedJobs)) {
                    this.rejectedJobs = new Set(result.rejectedJobs);
                    this.debugLog(`🧠 تم تحميل ${this.rejectedJobs.size} وظيفة مرفوضة من الذاكرة`);
                }
            } catch (error) {
                this.debugLog('❌ خطأ في تحميل الوظائف المرفوضة:', error);
            }
        }

        async saveRejectedJobs() {
            try {
                const rejectedArray = Array.from(this.rejectedJobs);
                await chrome.storage.local.set({ rejectedJobs: rejectedArray });
                this.debugLog(`💾 تم حفظ ${rejectedArray.length} وظيفة مرفوضة`);
            } catch (error) {
                this.debugLog('❌ خطأ في حفظ الوظائف المرفوضة:', error);
            }
        }

        // ===============================
        // بدء الأتمتة الذكية
        // ===============================

        async startSmartAutomation() {
            if (this.isRunning) {
                this.debugLog('⚠️ الأتمتة تعمل بالفعل');
                return;
            }

            this.debugLog('🚀 بدء الأتمتة الذكية');
            this.isRunning = true;
            this.isPaused = false;
            
            this.sendMessage('AUTOMATION_STARTED');
            
            try {
                // التأكد من أننا في صفحة قائمة الوظائف
                if (this.pageType !== 'jobList') {
                    this.debugLog('🔄 الانتقال لقائمة الوظائف');
                    window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                    await this.wait(5000);
                }
                
                await this.processCurrentPage();
                
            } catch (error) {
                this.debugLog('❌ خطأ في الأتمتة:', error);
                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
            }
        }

        // ===============================
        // دالة استخراج البيانات الأساسية
        // ===============================

        extractJobDataFromHTML(jobCard) {
            try {
                this.debugLog(`📊 استخراج البصمة الكاملة للوظيفة: ${jobCard.title}`);
                
                const container = jobCard.container;
                if (!container) {
                    this.debugLog('❌ لم يوجد عنصر الحاوي');
                    return this.getMinimalJobData(jobCard);
                }

                const jobData = {
                    company: 'شركة غير محددة',
                    title: jobCard.title,
                    matchingScore: null,
                    city: null,
                    publishDate: null,
                    availableJobs: null
                };

                // استخراج اسم الشركة
                const companySpans = container.querySelectorAll('span[data-expression]');
                for (const span of companySpans) {
                    const text = span.textContent?.trim();
                    if (text && text !== jobCard.title && text.length > 3 && 
                        !text.includes('%') && !text.match(/\d{2}\/\d{2}\/\d{4}/) && 
                        !text.match(/^\d+$/)) {
                        jobData.company = text;
                        break;
                    }
                }

                // استخراج نسبة التوافق
                const matchElement = container.querySelector('span.matching_score');
                if (matchElement && matchElement.textContent?.trim()) {
                    jobData.matchingScore = matchElement.textContent.trim();
                }

                // استخراج البيانات الأخرى من النصوص
                const allText = container.textContent || '';
                
                // استخراج التاريخ
                const dateMatch = allText.match(/(\d{2}\/\d{2}\/\d{4})/);
                if (dateMatch) {
                    jobData.publishDate = dateMatch[1];
                }

                this.debugLog(`✅ البصمة المستخرجة:`);
                this.debugLog(`   🏢 ${jobData.company}`);
                this.debugLog(`   💼 ${jobData.title}`);
                this.debugLog(`   📊 ${jobData.matchingScore || 'غير محدد'}`);
                this.debugLog(`   📅 ${jobData.publishDate || 'غير محدد'}`);

                return jobData;
                
            } catch (error) {
                this.debugLog('❌ خطأ في استخراج البيانات:', error);
                return this.getMinimalJobData(jobCard);
            }
        }

        getMinimalJobData(jobCard) {
            return {
                company: 'شركة غير محددة',
                title: jobCard.title || 'وظيفة غير محددة',
                matchingScore: null,
                city: null,
                publishDate: null,
                availableJobs: null
            };
        }

        // ===============================
        // معالجة الصفحة الحالية
        // ===============================

        async processCurrentPage() {
            if (!this.isRunning || this.isPaused) return;

            try {
                this.debugLog('🔄 بدء معالجة الصفحة');
                
                // انتظار تحميل الصفحة
                await this.waitForPageLoad();
                
                // احصل على قائمة الوظائف
                const allJobCards = this.getAllJobCards();
                this.debugLog(`💼 وجد ${allJobCards.length} وظيفة في الصفحة`);

                if (allJobCards.length === 0) {
                    this.debugLog('⚠️ لا توجد وظائف، الانتقال للصفحة التالية');
                    await this.goToNextPage();
                    return;
                }

                // معالجة كل وظيفة بالترتيب
                let processedCount = 0;
                let availableCount = 0;

                for (let i = 0; i < allJobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        this.debugLog('🛑 تم إيقاف العملية');
                        return;
                    }

                    const jobCard = allJobCards[i];
                    this.debugLog(`\n📝 === معالجة الوظيفة ${i + 1}/${allJobCards.length}: ${jobCard.title} ===`);

                    // فحص "تم التقدم" في القائمة أولاً
                    if (this.checkAppliedInList(jobCard.container)) {
                        this.debugLog(`⏭️ تخطي (تم التقدم في القائمة): ${jobCard.title}`);
                        continue;
                    }

                    // فحص الوظائف المزارة
                    if (this.isJobVisited(jobCard)) {
                        this.debugLog(`⏭️ تخطي (مزارة سابقاً): ${jobCard.title}`);
                        continue;
                    }

                    // فحص الوظائف المرفوضة
                    if (this.isJobRejected(jobCard)) {
                        this.debugLog(`⏭️ تخطي (مرفوضة سابقاً): ${jobCard.title}`);
                        continue;
                    }

                    // وظيفة متاحة - معالجة
                    availableCount++;
                    this.debugLog(`✅ وظيفة متاحة للمعالجة: ${jobCard.title}`);
                    
                    const success = await this.processJobStepByStep(jobCard, i + 1, allJobCards.length);
                    if (success) {
                        processedCount++;
                    }

                    // تحديث التقدم
                    const progress = ((i + 1) / allJobCards.length) * 100;
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: progress, 
                        text: `الوظيفة ${i + 1}/${allJobCards.length}` 
                    });

                    // انتظار بين الوظائف
                    await this.wait(this.getRandomDelay());
                }

                this.debugLog(`📊 انتهاء الصفحة: ${processedCount} معالجة من ${availableCount} متاحة`);

                // الانتقال للصفحة التالية
                await this.goToNextPage();

            } catch (error) {
                this.debugLog('❌ خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
            }
        }

        // ===============================
        // الحصول على جميع الوظائف
        // ===============================

        getAllJobCards() {
            this.debugLog('🔍 الحصول على جميع الوظائف');
            
            const jobCards = [];
            const selectors = [
                'a[data-link][href*="/Jadarat/JobDetails"]',
                'a[href*="JobDetails"]'
            ];
            
            let jobLinks = [];
            for (const selector of selectors) {
                jobLinks = document.querySelectorAll(selector);
                if (jobLinks.length > 0) {
                    this.debugLog(`🔗 وجد ${jobLinks.length} رابط بـ: ${selector}`);
                    break;
                }
            }
            
            for (const link of jobLinks) {
                try {
                    const jobTitle = this.getJobTitle(link);
                    const jobContainer = this.findJobContainer(link);
                    
                    if (jobContainer && jobTitle) {
                        jobCards.push({
                            link: link,
                            container: jobContainer,
                            title: jobTitle
                        });
                    }
                } catch (error) {
                    this.debugLog(`❌ خطأ في معالجة رابط:`, error);
                    continue;
                }
            }

            this.debugLog(`📊 النتيجة: ${jobCards.length} وظيفة`);
            return jobCards;
        }

        // ===============================
        // استخراج عنوان الوظيفة
        // ===============================

        getJobTitle(link) {
            try {
                // البحث في النص المباشر للرابط
                if (link.textContent && link.textContent.trim()) {
                    const title = link.textContent.trim();
                    if (title.length > 5) {
                        return title;
                    }
                }

                // البحث في العناصر الفرعية
                const titleElement = link.querySelector('span, div, h3, h4');
                if (titleElement && titleElement.textContent) {
                    const title = titleElement.textContent.trim();
                    if (title.length > 5) {
                        return title;
                    }
                }

                // استخراج من URL كاحتياطي
                const urlMatch = link.href.match(/JobTitle=([^&]+)/);
                if (urlMatch) {
                    return decodeURIComponent(urlMatch[1]);
                }

                return 'وظيفة غير محددة';
            } catch (error) {
                this.debugLog('❌ خطأ في استخراج العنوان:', error);
                return 'وظيفة غير محددة';
            }
        }

        // ===============================
        // إيجاد حاوي الوظيفة
        // ===============================

        findJobContainer(link) {
            try {
                // البحث عن أقرب حاوي بـ data-container
                let container = link.closest('[data-container]');
                
                if (!container) {
                    // البحث في الحاويات الشائعة
                    container = link.closest('div[class*="job"], div[class*="card"], .job-item');
                }

                if (!container) {
                    // استخدام الحاوي الأب المباشر
                    container = link.parentElement;
                    while (container && container.children.length < 3) {
                        container = container.parentElement;
                    }
                }

                return container;
            } catch (error) {
                this.debugLog('❌ خطأ في إيجاد الحاوي:', error);
                return link.parentElement;
            }
        }

        // ===============================
        // إدارة الوظائف المزارة والمرفوضة
        // ===============================

        generateJobIdentifiers(jobCard) {
            const identifiers = [];
            
            if (jobCard.title) {
                identifiers.push(`title:${jobCard.title}`);
            }
            
            if (jobCard.link && jobCard.link.href) {
                const urlMatch = jobCard.link.href.match(/JobId=(\d+)/);
                if (urlMatch) {
                    identifiers.push(`id:${urlMatch[1]}`);
                }
            }

            const jobData = this.extractJobDataFromHTML(jobCard);
            if (jobData.company && jobData.company !== 'شركة غير محددة') {
                identifiers.push(`company_title:${jobData.company}_${jobCard.title}`);
            }

            return identifiers;
        }

        isJobVisited(jobCard) {
            const identifiers = this.generateJobIdentifiers(jobCard);
            return identifiers.some(id => this.visitedJobs.has(id));
        }

        isJobRejected(jobCard) {
            const identifiers = this.generateJobIdentifiers(jobCard);
            return identifiers.some(id => this.rejectedJobs.has(id));
        }

        markJobAsVisited(jobCard) {
            const identifiers = this.generateJobIdentifiers(jobCard);
            for (const id of identifiers) {
                this.visitedJobs.add(id);
            }
            this.saveVisitedJobs();
        }

        // ===============================
        // فحص "تم التقدم" في القائمة (محسن)
        // ===============================

        checkAppliedInList(container) {
            try {
                // فحص أيقونة "تم التقدم" المحددة
                const tickIcon = container.querySelector('img[src*="UEP_Resources.tickcircle.svg"]');
                if (tickIcon) {
                    this.debugLog('✅ وجد أيقونة "تم التقدم" في القائمة');
                    return true;
                }
                
                // فحص النص المحدد "تم التقدم" مع الكلاس
                const appliedSpan = container.querySelector('span.text-primary');
                if (appliedSpan && appliedSpan.textContent?.trim() === 'تم التقدم') {
                    this.debugLog('✅ وجد نص "تم التقدم" في القائمة');
                    return true;
                }
                
                // فحص إضافي للتأكد
                const textContent = container.textContent || '';
                if (textContent.includes('تم التقدم') && container.querySelector('img[src*="tickcircle"]')) {
                    this.debugLog('✅ وجد مؤشرات "تم التقدم" في القائمة');
                    return true;
                }
                
                return false;
            } catch (error) {
                this.debugLog('❌ خطأ في فحص التقديم في القائمة:', error);
                return false;
            }
        }

        // ===============================
        // معالجة الوظيفة خطوة بخطوة
        // ===============================

        async processJobStepByStep(jobCard, jobIndex, totalJobs) {
            try {
                this.debugLog(`🎯 === بدء معالجة خطوة بخطوة: ${jobCard.title} ===`);
                
                // تسجيل الوظيفة كمزارة
                this.markJobAsVisited(jobCard);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobCard.title, 
                    status: 'processing' 
                });

                // النقر على الوظيفة والانتقال
                this.debugLog('📍 خطوة 1: النقر على رابط الوظيفة');
                const navigationSuccess = await this.navigateToJobDetails(jobCard);
                
                if (!navigationSuccess) {
                    this.debugLog('❌ فشل في الانتقال لتفاصيل الوظيفة');
                    this.stats.skipped++;
                    return false;
                }

                // فحص الإيقاف بعد التنقل
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية بعد التنقل');
                    await this.goBackToJobList();
                    return false;
                }

                // انتظار تحميل التفاصيل
                this.debugLog('📍 خطوة 2: انتظار تحميل تفاصيل الوظيفة');
                await this.waitForPageLoad();
                
                // فحص حالة التقديم في التفاصيل
                this.debugLog('📍 خطوة 3: فحص حالة التقديم في التفاصيل');
                const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                
                if (alreadyApplied) {
                    this.debugLog('✅ تم التقديم مسبقاً (في التفاصيل)');
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobCard.title, 
                        status: 'skipped' 
                    });
                } else {
                    // التقديم على الوظيفة
                    this.debugLog('📍 خطوة 4: بدء عملية التقديم');
                    
                    if (!this.isRunning || this.isPaused) {
                        this.debugLog('🛑 تم إيقاف العملية قبل التقديم');
                        await this.goBackToJobList();
                        return false;
                    }
                    
                    const applicationResult = await this.applyForJobStepByStep();
                    
                    // معالجة نتيجة التقديم
                    this.debugLog('📍 خطوة 5: معالجة نتيجة التقديم');
                    this.handleApplicationResult(applicationResult, jobCard);
                }

                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                // العودة للقائمة
                this.debugLog('📍 خطوة 6: العودة لقائمة الوظائف');
                await this.goBackToJobList();
                
                return true;

            } catch (error) {
                this.debugLog('❌ خطأ في معالجة الوظيفة:', error);
                this.stats.skipped++;
                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                // محاولة العودة للقائمة
                try {
                    await this.goBackToJobList();
                } catch (backError) {
                    this.debugLog('❌ خطأ في العودة للقائمة:', backError);
                }
                
                return false;
            }
        }

        // ===============================
        // الانتقال لتفاصيل الوظيفة
        // ===============================

        async navigateToJobDetails(jobCard) {
            try {
                const currentUrl = window.location.href;
                this.debugLog(`🔗 النقر على رابط: ${jobCard.title}`);
                
                // البحث عن الرابط في الصفحة الحالية
                const freshLink = this.findFreshJobLink(jobCard);
                if (!freshLink) {
                    this.debugLog('❌ لم يتم العثور على رابط محدث');
                    return false;
                }

                // النقر على الرابط
                await this.clickElementSafe(freshLink);
                
                // انتظار التنقل
                let attempts = 0;
                while (window.location.href === currentUrl && attempts < 10) {
                    await this.wait(1000);
                    attempts++;
                }
                
                if (window.location.href === currentUrl) {
                    this.debugLog('❌ لم يحدث تنقل');
                    return false;
                }
                
                this.debugLog('✅ تم التنقل بنجاح لتفاصيل الوظيفة');
                return true;
                
            } catch (error) {
                this.debugLog('❌ فشل في الانتقال:', error);
                return false;
            }
        }

        // البحث عن رابط محدث للوظيفة
        findFreshJobLink(jobCard) {
            try {
                // البحث بالعنوان أولاً
                const allLinks = document.querySelectorAll('a[href*="JobDetails"]');
                
                for (const link of allLinks) {
                    const linkTitle = this.getJobTitle(link);
                    if (linkTitle === jobCard.title) {
                        const isVisible = link.offsetWidth > 0 && link.offsetHeight > 0;
                        if (isVisible) {
                            this.debugLog(`✅ وجد رابط محدث مرئي: ${linkTitle}`);
                            return link;
                        }
                    }
                }
                
                // إذا لم نجد، استخدم الرابط الأصلي
                if (jobCard.link && jobCard.link.offsetWidth > 0) {
                    this.debugLog('⚠️ استخدام الرابط الأصلي');
                    return jobCard.link;
                }
                
                return null;
                
            } catch (error) {
                this.debugLog('❌ خطأ في البحث عن رابط محدث:', error);
                return jobCard.link;
            }
        }

        // النقر الآمن على العنصر
        async clickElementSafe(element) {
            if (!element) {
                throw new Error('العنصر غير موجود');
            }

            // التمرير للعنصر
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            await this.wait(1000);

            // التحقق من الرؤية
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                throw new Error('العنصر غير مرئي');
            }

            // النقر
            try {
                element.click();
                this.debugLog('✅ تم النقر بنجاح');
                await this.wait(1500);
            } catch (error) {
                this.debugLog('❌ فشل النقر العادي، محاولة بديلة...');
                
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(event);
                this.debugLog('✅ نجح النقر البديل');
                await this.wait(1500);
            }
        }

        // ===============================
        // فحص التقديم المسبق في التفاصيل (محسن)
        // ===============================

        async checkIfAlreadyAppliedInDetails() {
            this.debugLog('🔍 فحص حالة التقديم المسبق في التفاصيل');
            
            // انتظار تحميل الصفحة قليلاً
            await this.wait(2000);
            
            // فحص وجود زر "تقديم" - إذا موجود = لم يتم التقدم
            const submitButton = document.querySelector('button[data-button][class*="btn-primary"]');
            if (submitButton && submitButton.textContent?.trim() === 'تقديم') {
                this.debugLog('✅ وجد زر "تقديم" - لم يتم التقدم مسبقاً');
                return false;
            }
            
            // البحث عن مؤشرات التقديم المسبق
            const pageText = document.body.textContent || '';
            
            // مؤشرات التقديم المسبق
            const appliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم على هذه الوظيفة',
                'طلب مقدم',
                'تم التقدم',
                'مقدم عليها',
                'تم إرسال طلبك مسبقاً'
            ];
            
            for (const indicator of appliedIndicators) {
                if (pageText.includes(indicator)) {
                    this.debugLog(`✅ وجد مؤشر التقديم المسبق: ${indicator}`);
                    return true;
                }
            }
            
            // فحص أزرار أخرى غير "تقديم"
            const buttons = document.querySelectorAll('button[data-button]');
            for (const button of buttons) {
                const btnText = button.textContent?.trim();
                if (btnText && (btnText.includes('استعراض') || btnText.includes('عرض الطلب') || btnText.includes('طلب مقدم'))) {
                    this.debugLog(`✅ وجد زر بديل: ${btnText}`);
                    return true;
                }
            }
            
            // إذا لم نجد زر "تقديم" ولا مؤشرات أخرى
            if (!submitButton) {
                this.debugLog('⚠️ لم يوجد زر "تقديم" - افتراض التقديم المسبق');
                return true;
            }
            
            this.debugLog('✅ لم يتم التقديم مسبقاً');
            return false;
        }

        // ===============================
        // التقديم خطوة بخطوة
        // ===============================

        async applyForJobStepByStep() {
            this.debugLog('📝 === بدء عملية التقديم خطوة بخطوة ===');
            
            try {
                // البحث عن زر التقديم
                this.debugLog('🔍 خطوة 1: البحث عن زر التقديم');
                const submitButton = this.findSubmitButton();
                if (!submitButton) {
                    this.debugLog('❌ لم يتم العثور على زر التقديم');
                    return { success: false, reason: 'لم يوجد زر التقديم' };
                }
                
                this.debugLog(`✅ وجد زر التقديم: "${submitButton.textContent.trim()}"`);

                // النقر على زر التقديم
                this.debugLog('🎯 خطوة 2: النقر على زر التقديم');
                if (!this.isRunning || this.isPaused) {
                    return { success: false, reason: 'تم إيقاف العملية' };
                }
                
                await this.clickElementSafe(submitButton);
                await this.wait(3000);

                // البحث عن نافذة التأكيد
                this.debugLog('🔍 خطوة 3: البحث عن نافذة التأكيد');
                if (!this.isRunning || this.isPaused) {
                    return { success: false, reason: 'تم إيقاف العملية' };
                }
                
                const confirmModal = this.findConfirmationModal();
                if (confirmModal) {
                    this.debugLog('📋 خطوة 4: معالجة نافذة التأكيد');
                    
                    const confirmButton = this.findButtonInModal(confirmModal, ['تقديم', 'تأكيد']);
                    if (confirmButton) {
                        this.debugLog(`🎯 النقر على زر التأكيد: "${confirmButton.textContent.trim()}"`);
                        await this.clickElementSafe(confirmButton);
                        await this.wait(5000);
                    }
                } else {
                    this.debugLog('⚠️ لم توجد نافذة تأكيد - المتابعة مباشرة');
                }

                // فحص نتيجة التقديم
                this.debugLog('🔍 خطوة 5: فحص نتيجة التقديم');
                if (!this.isRunning || this.isPaused) {
                    return { success: false, reason: 'تم إيقاف العملية' };
                }
                
                await this.wait(2000);
                const result = this.checkApplicationResult();
                
                // إغلاق أي نوافذ نتيجة
                this.debugLog('🔍 خطوة 6: إغلاق نوافذ النتيجة');
                await this.closeResultModals();
                
                this.debugLog(`📊 نتيجة التقديم: ${result.success ? 'نجح' : 'فشل'}`);
                return result;
                
            } catch (error) {
                this.debugLog('❌ خطأ في عملية التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        // ===============================
        // البحث عن زر التقديم (محسن)
        // ===============================

        findSubmitButton() {
            this.debugLog('🔍 البحث المفصل عن زر التقديم');
            
            // البحث عن الزر المحدد من HTML
            const primaryButton = document.querySelector('button[data-button][class*="btn-primary"]');
            if (primaryButton && primaryButton.textContent?.trim() === 'تقديم') {
                this.debugLog(`✅ وجد زر التقديم الأساسي: "${primaryButton.textContent.trim()}"`);
                return primaryButton;
            }
            
            // بحث عام في جميع الأزرار
            const buttons = document.querySelectorAll('button, input[type="submit"], a[role="button"]');
            
            for (const button of buttons) {
                const text = button.textContent?.trim() || button.value?.trim() || '';
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                
                if (isVisible) {
                    this.debugLog(`🔍 فحص زر: "${text}"`);
                    
                    if (text === 'تقديم' || text === 'قدم الآن' || text === 'Apply') {
                        this.debugLog(`✅ وجد زر التقديم: "${text}"`);
                        return button;
                    }
                }
            }
            
            this.debugLog('❌ لم يتم العثور على زر التقديم');
            return null;
        }

        // ===============================
        // البحث عن نافذة التأكيد (محسن)
        // ===============================

        findConfirmationModal() {
            this.debugLog('🔍 البحث عن نافذة التأكيد');
            
            // البحث عن النافذة المحددة
            const specificModal = document.querySelector('div[data-popup][role="dialog"]');
            if (specificModal && specificModal.offsetWidth > 0 && specificModal.offsetHeight > 0) {
                const text = specificModal.textContent || '';
                if (text.includes('هل أنت متأكد من التقديم')) {
                    this.debugLog('✅ وجد نافذة التأكيد المحددة');
                    return specificModal;
                }
            }
            
            // بحث عام في النوافذ
            const selectors = ['[role="dialog"]', '.popup-dialog', '[data-popup]', '.modal', '[class*="modal"]', '[class*="popup"]'];
            
            for (const selector of selectors) {
                const dialogs = document.querySelectorAll(selector);
                
                for (const dialog of dialogs) {
                    if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                        const text = dialog.textContent || '';
                        this.debugLog(`🔍 فحص نافذة: "${text.substring(0, 50)}..."`);
                        
                        if (text.includes('هل أنت متأكد من التقديم') || 
                            text.includes('هل أنت متأكد') || 
                            text.includes('تأكيد التقديم') ||
                            (text.includes('تقديم') && text.includes('متأكد'))) {
                            this.debugLog('✅ وجد نافذة التأكيد');
                            return dialog;
                        }
                    }
                }
            }
            
            this.debugLog('⚠️ لم توجد نافذة تأكيد');
            return null;
        }

        // ===============================
        // البحث عن زر في النافذة
        // ===============================

        findButtonInModal(modal, buttonTexts) {
            try {
                const buttons = modal.querySelectorAll('button, input[type="submit"], a[role="button"]');
                
                for (const button of buttons) {
                    const text = button.textContent?.trim() || button.value?.trim() || '';
                    const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                    
                    if (isVisible && buttonTexts.some(btnText => text.includes(btnText))) {
                        this.debugLog(`✅ وجد زر في النافذة: "${text}"`);
                        return button;
                    }
                }
                
                this.debugLog('❌ لم يوجد زر مناسب في النافذة');
                return null;
            } catch (error) {
                this.debugLog('❌ خطأ في البحث عن زر في النافذة:', error);
                return null;
            }
        }

        // ===============================
        // فحص نتيجة التقديم (محسن)
        // ===============================

        checkApplicationResult() {
            this.debugLog('🔍 فحص نتيجة التقديم المفصل');
            
            const pageText = document.body.textContent;
            
            // فحص نوافذ النجاح
            const successModal = document.querySelector('div[data-popup][role="dialog"]');
            if (successModal && successModal.offsetWidth > 0) {
                const modalText = successModal.textContent || '';
                if (modalText.includes('تم تقديم طلبك') || modalText.includes('تم التقديم بنجاح')) {
                    this.debugLog('✅ نافذة نجاح: تم التقديم بنجاح');
                    return { success: true, type: 'success' };
                }
            }
            
            // فحص نوافذ الرفض المحددة
            const rejectionModal = document.querySelector('div[data-popup][role="dialog"]');
            if (rejectionModal && rejectionModal.offsetWidth > 0) {
                const modalText = rejectionModal.textContent || '';
                if (modalText.includes('عذراً ، لا يمكنك التقديم')) {
                    const reason = this.extractRejectionReason(modalText);
                    this.debugLog(`❌ نافذة رفض: ${reason}`);
                    return { success: false, type: 'rejection', reason: reason };
                }
            }
            
            // فحص مؤشرات النجاح في الصفحة
            const successIndicators = [
                'تم التقديم بنجاح',
                'تم تقديم طلبك',
                'نجح التقديم',
                'تم بنجاح',
                'تم إرسال طلبك',
                'تم استلام طلبك'
            ];
            
            for (const indicator of successIndicators) {
                if (pageText.includes(indicator)) {
                    this.debugLog(`✅ مؤشر نجاح: ${indicator}`);
                    return { success: true, type: 'success' };
                }
            }
            
            // فحص مؤشرات الرفض في الصفحة
            const rejectionIndicators = [
                'عذراً ، لا يمكنك التقديم',
                'عذراً',
                'لا يمكنك التقديم',
                'غير مؤهل',
                'لا يطابق',
                'لا تستوفي',
                'غير مناسب'
            ];
            
            for (const indicator of rejectionIndicators) {
                if (pageText.includes(indicator)) {
                    const reason = this.extractRejectionReason(pageText);
                    this.debugLog(`❌ مؤشر رفض: ${indicator} - السبب: ${reason}`);
                    return { success: false, type: 'rejection', reason: reason };
                }
            }
            
            // إذا لم نجد مؤشرات واضحة، فحص URL
            if (window.location.href.includes('JobDetails')) {
                this.debugLog('⚠️ ما زلنا في صفحة التفاصيل - نتيجة غير واضحة');
                return { success: false, type: 'unknown', reason: 'نتيجة غير واضحة' };
            }
            
            this.debugLog('✅ افتراض النجاح (لا توجد مؤشرات رفض)');
            return { success: true, type: 'assumed' };
        }

        // استخراج سبب الرفض
        extractRejectionReason(text) {
            const detailedReasons = [
                'الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب',
                'لا يطابق شرط الخبرة المطلوبة',
                'لا يطابق شرط العمر المطلوب',
                'لا يطابق شرط الجنس المطلوب',
                'انتهت فترة التقديم',
                'تم إغلاق باب التقديم',
                'لا تستوفي المتطلبات',
                'غير مناسب للوظيفة',
                'لا يمكن التقديم على هذه الوظيفة'
            ];
            
            for (const reason of detailedReasons) {
                if (text.includes(reason)) {
                    return reason;
                }
            }
            
            // البحث عن نص بين "السبب:" و النقطة
            const reasonMatch = text.match(/السبب[:\s]+(.*?)[\.\n]/);
            if (reasonMatch) {
                return reasonMatch[1].trim();
            }
            
            return 'سبب غير محدد';
        }

        // ===============================
        // إغلاق نوافذ النتيجة (محسن)
        // ===============================

        async closeResultModals() {
            try {
                this.debugLog('🔍 البحث عن نوافذ النتيجة لإغلاقها');
                
                // البحث عن النوافذ المنبثقة المحددة
                const modals = document.querySelectorAll('div[data-popup][role="dialog"], [role="dialog"], .popup-dialog, .modal, [class*="modal"]');
                
                for (const modal of modals) {
                    if (modal.offsetWidth > 0 && modal.offsetHeight > 0) {
                        const text = modal.textContent || '';
                        
                        // إذا كانت نافذة نتيجة (نجاح أو رفض)
                        if (text.includes('تم التقديم') || 
                            text.includes('تم تقديم طلبك') || 
                            text.includes('عذراً ، لا يمكنك التقديم') || 
                            text.includes('لا يمكنك') || 
                            text.includes('عذراً')) {
                            
                            this.debugLog('🚫 إغلاق نافذة النتيجة');
                            
                            // البحث عن أزرار الإغلاق المحددة
                            const closeButtons = modal.querySelectorAll('button[data-button]');
                            for (const btn of closeButtons) {
                                const btnText = btn.textContent?.trim();
                                if (btnText && btnText === 'إغلاق') {
                                    this.debugLog(`✅ النقر على زر إغلاق: ${btnText}`);
                                    await this.clickElementSafe(btn);
                                    await this.wait(1000);
                                    return;
                                }
                            }
                            
                            // البحث عن أيقونة الإغلاق (X)
                            const closeIcon = modal.querySelector('a[data-link] img[src*="close.svg"]');
                            if (closeIcon) {
                                this.debugLog('✅ النقر على أيقونة الإغلاق (X)');
                                const closeLink = closeIcon.closest('a[data-link]');
                                if (closeLink) {
                                    await this.clickElementSafe(closeLink);
                                    await this.wait(1000);
                                    return;
                                }
                            }
                            
                            // بحث عام عن أزرار الإغلاق
                            const allButtons = modal.querySelectorAll('button, a');
                            for (const btn of allButtons) {
                                const btnText = btn.textContent?.trim();
                                if (btnText && (btnText.includes('إغلاق') || btnText.includes('موافق') || btnText === '×')) {
                                    this.debugLog(`✅ النقر على زر: ${btnText}`);
                                    await this.clickElementSafe(btn);
                                    await this.wait(1000);
                                    return;
                                }
                            }
                        }
                    }
                }
                
                this.debugLog('⚠️ لم توجد نوافذ نتيجة مفتوحة');
            } catch (error) {
                this.debugLog('❌ خطأ في إغلاق النوافذ:', error);
            }
        }

        // ===============================
        // معالجة نتيجة التقديم
        // ===============================

        handleApplicationResult(applicationResult, jobCard) {
            if (applicationResult && applicationResult.success) {
                this.stats.applied++;
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobCard.title, 
                    status: 'success' 
                });
                this.debugLog('✅ تم التقديم بنجاح');
                
            } else if (applicationResult && applicationResult.type === 'rejection') {
                this.stats.rejected = (this.stats.rejected || 0) + 1;
                
                // حفظ البيانات المفصلة للرفض
                const rejectionData = {
                    date: new Date().toLocaleDateString('ar-SA'),
                    time: new Date().toLocaleTimeString('ar-SA'),
                    jobTitle: jobCard.title,
                    reason: applicationResult.reason || 'سبب غير محدد'
                };
                
                // إرسال بيانات الرفض للخلفية
                chrome.runtime.sendMessage({
                    action: 'SAVE_REJECTION_DATA',
                    rejectionData: rejectionData
                });
                
                // حفظ في قائمة المرفوضة
                const jobIds = this.generateJobIdentifiers(jobCard);
                for (const id of jobIds) {
                    this.rejectedJobs.add(id);
                }
                this.saveRejectedJobs();
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobCard.title, 
                    status: 'rejected',
                    reason: applicationResult.reason
                });
                this.debugLog(`❌ تم رفض التقديم: ${applicationResult.reason}`);
                
            } else {
                this.stats.skipped++;
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobCard.title, 
                    status: 'skipped'
                });
                this.debugLog('⚠️ نتيجة غير واضحة - تم التخطي');
            }
        }

        // ===============================
        // العودة لقائمة الوظائف
        // ===============================

        async goBackToJobList() {
            this.debugLog('🔙 العودة الآمنة لقائمة الوظائف');
            
            try {
                const currentUrl = window.location.href;
                
                // إذا كنا بالفعل في قائمة الوظائف
                if (currentUrl.includes('ExploreJobs') || currentUrl.includes('JobTab=1')) {
                    this.debugLog('✅ نحن بالفعل في قائمة الوظائف');
                    return;
                }
                
                // إذا كنا في صفحة تفاصيل الوظيفة
                if (currentUrl.includes('JobDetails')) {
                    this.debugLog('📄 في صفحة تفاصيل - العودة بـ history.back()');
                    window.history.back();
                    await this.wait(3000);
                    
                    // التأكد من العودة
                    const newUrl = window.location.href;
                    if (!newUrl.includes('ExploreJobs') && !newUrl.includes('JobTab=1')) {
                        this.debugLog('⚠️ فشل في العودة - انتقال مباشر');
                        window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                        await this.wait(5000);
                    }
                    
                    await this.waitForPageLoad();
                } else {
                    // في صفحة غير متوقعة
                    this.debugLog('⚠️ صفحة غير متوقعة - انتقال مباشر');
                    window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                    await this.wait(5000);
                    await this.waitForPageLoad();
                }
                
                this.debugLog('✅ تمت العودة بنجاح لقائمة الوظائف');
                
            } catch (error) {
                this.debugLog('❌ خطأ في العودة:', error);
                
                // محاولة أخيرة
                try {
                    window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                    await this.wait(5000);
                    await this.waitForPageLoad();
                } catch (finalError) {
                    this.debugLog('❌ فشل نهائي في العودة:', finalError);
                    throw new Error('فشل في العودة لقائمة الوظائف');
                }
            }
        }

        // ===============================
        // الانتقال للصفحة التالية
        // ===============================

        async goToNextPage() {
            this.debugLog('🔍 البحث عن الصفحة التالية');
            
            // البحث عن زر الصفحة التالية
            const nextSelectors = [
                'button[aria-label*="go to next page"]:not([disabled])',
                'button[aria-label*="التالي"]:not([disabled])',
                'a[aria-label*="next"]:not([disabled])',
                '.pagination button:not([disabled]):last-child'
            ];
            
            let nextButton = null;
            for (const selector of nextSelectors) {
                nextButton = document.querySelector(selector);
                if (nextButton) {
                    this.debugLog(`✅ وجد زر الصفحة التالية بـ: ${selector}`);
                    break;
                }
            }
            
            if (nextButton) {
                this.debugLog('➡️ الانتقال للصفحة التالية');
                this.currentPage++;
                this.currentJobIndex = 0;
                
                await this.clickElementSafe(nextButton);
                await this.wait(5000);
                
                // التأكد من التنقل
                await this.waitForPageLoad();
                await this.processCurrentPage();
            } else {
                this.debugLog('🏁 انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
            }
        }

        // ===============================
        // دوال الانتظار
        // ===============================

        async waitForPageLoad() {
            this.debugLog('⏳ انتظار تحميل الصفحة');
            
            // انتظار حتى تحميل الصفحة
            let attempts = 0;
            while (document.readyState !== 'complete' && attempts < 20) {
                await this.wait(500);
                attempts++;
            }
            
            // انتظار إضافي للعناصر الديناميكية
            await this.wait(2000);
            
            this.debugLog('✅ انتهى انتظار تحميل الصفحة');
        }

        // ===============================
        // دوال النظام الأساسية
        // ===============================

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3;
            return base + (Math.random() * 2 - 1) * variation;
        }

        debugLog(message, ...args) {
            const timestamp = new Date().toLocaleTimeString('ar-SA');
            const fullMessage = `[${timestamp}] 🎯 ${message}`;
            console.log(fullMessage, ...args);
        }

        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sendResponse);
                return true;
            });
        }

        async handleMessage(message, sendResponse) {
            this.debugLog('📨 استلام رسالة:', message.action);
            
            try {
                switch (message.action) {
                    case 'PING':
                        sendResponse({ 
                            status: 'active', 
                            pageType: this.pageType,
                            url: window.location.href,
                            timestamp: Date.now()
                        });
                        break;
                        
                    case 'START_AUTOMATION':
                        sendResponse({ success: true, message: 'بدء الأتمتة...' });
                        setTimeout(async () => {
                            try {
                                this.settings = message.settings || this.settings;
                                await this.startSmartAutomation();
                            } catch (error) {
                                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
                            }
                        }, 100);
                        break;
                        
                    case 'STOP_AUTOMATION':
                        sendResponse({ success: true });
                        this.stopAutomation();
                        break;

                    case 'CLEAR_VISITED_JOBS':
                        this.visitedJobs.clear();
                        await this.saveVisitedJobs();
                        sendResponse({ success: true });
                        break;

                    case 'CLEAR_JOB_MEMORY':
                        this.rejectedJobs.clear();
                        await this.saveRejectedJobs();
                        sendResponse({ success: true });
                        break;

                    case 'CLEAR_ALL_JOB_DATA':
                        this.visitedJobs.clear();
                        this.rejectedJobs.clear();
                        await this.saveVisitedJobs();
                        await this.saveRejectedJobs();
                        sendResponse({ success: true });
                        break;
                        
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                this.debugLog('❌ خطأ في معالجة الرسالة:', error);
                sendResponse({ success: false, error: error.message });
            }
        }

        stopAutomation() {
            this.debugLog('⏹️ إيقاف نهائي');
            this.isRunning = false;
            this.isPaused = false;
        }

        checkPageType() {
            const url = window.location.href;
            
            if (url.includes('JobDetails')) {
                this.pageType = 'jobDetails';
            } else if (url.includes('ExploreJobs') || url.includes('JobTab=1')) {
                this.pageType = 'jobList';
            } else if (url.includes('jadarat.sa')) {
                this.pageType = 'home';
            } else {
                this.pageType = 'unknown';
            }
            
            this.debugLog(`📄 نوع الصفحة: ${this.pageType}`);
        }

        addVisualIndicator() {
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

        sendMessage(action, data = {}) {
            try {
                const message = { action, ...data };
                chrome.runtime.sendMessage(message, () => {
                    if (chrome.runtime.lastError) {
                        // تجاهل أخطاء الاتصال
                    }
                });
            } catch (error) {
                this.debugLog('❌ خطأ في إرسال الرسالة:', error);
            }
        }

        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // تهيئة المحتوى
    function initializeContent() {
        try {
            if (!window.jadaratAutoContent) {
                window.jadaratAutoContent = new JadaratAutoContent();
                console.log('✅ تم تهيئة جدارات أوتو بنجاح');
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

    // إضافة دوال مساعدة للتشخيص
    window.jadaratAutoHelpers = {
        getCurrentState: () => {
            if (window.jadaratAutoContent) {
                return {
                    isRunning: window.jadaratAutoContent.isRunning,
                    isPaused: window.jadaratAutoContent.isPaused,
                    pageType: window.jadaratAutoContent.pageType,
                    stats: window.jadaratAutoContent.stats,
                    visitedJobsCount: window.jadaratAutoContent.visitedJobs.size,
                    rejectedJobsCount: window.jadaratAutoContent.rejectedJobs.size
                };
            }
            return { error: 'Content script not initialized' };
        },
        
        testJobExtraction: () => {
            if (window.jadaratAutoContent) {
                const jobCards = window.jadaratAutoContent.getAllJobCards();
                console.log('🧪 اختبار استخراج الوظائف:', jobCards);
                
                // اختبار تفصيلي للبطاقة الأولى
                if (jobCards.length > 0) {
                    const firstCard = jobCards[0];
                    const jobData = window.jadaratAutoContent.extractJobDataFromHTML(firstCard);
                    console.log('📊 بيانات البطاقة الأولى:', jobData);
                    
                    const identifiers = window.jadaratAutoContent.generateJobIdentifiers(firstCard);
                    console.log('🔑 المعرفات المولدة:', identifiers);
                }
                
                return jobCards;
            }
            return { error: 'Content script not initialized' };
        },
        
        clearAllData: async () => {
            if (window.jadaratAutoContent) {
                window.jadaratAutoContent.visitedJobs.clear();
                window.jadaratAutoContent.rejectedJobs.clear();
                await window.jadaratAutoContent.saveVisitedJobs();
                await window.jadaratAutoContent.saveRejectedJobs();
                console.log('✅ تم مسح جميع البيانات');
                return { success: true };
            }
            return { error: 'Content script not initialized' };
        },

        testSingleCard: (cardIndex = 0) => {
            if (window.jadaratAutoContent) {
                const allCards = window.jadaratAutoContent.getAllJobCards();
                if (allCards[cardIndex]) {
                    const jobCard = allCards[cardIndex];
                    
                    console.log('🔍 اختبار بطاقة واحدة:');
                    console.log('📋 معلومات البطاقة:', jobCard);
                    
                    const jobData = window.jadaratAutoContent.extractJobDataFromHTML(jobCard);
                    console.log('📊 البيانات المستخرجة:', jobData);
                    
                    const identifiers = window.jadaratAutoContent.generateJobIdentifiers(jobCard);
                    console.log('🔑 المعرفات:', identifiers);
                    
                    return { jobCard, jobData, identifiers };
                }
            }
            return { error: 'No card found or content script not initialized' };
        }
    };

    console.log('🎯 جدارات أوتو: تم تحميل جميع الوظائف بنجاح');
    console.log('💡 استخدم window.jadaratAutoHelpers.testJobExtraction() لاختبار الاستخراج');
    console.log('🔍 استخدم window.jadaratAutoHelpers.testSingleCard(0) لاختبار بطاقة واحدة');
}