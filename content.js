// جدارات أوتو - Content Script مُصحح ومراجع بعناية - النسخة المُحسنة
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى الذكي المُصحح');

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
        // 🆕 دوال استخراج البيانات المُصححة
        // ===============================

// 🎯 إصلاح شامل لسلسلة الخطوات ودوال الاستخراج

// ===============================
// 🆕 دالة استخراج البيانات المُصححة نهائياً
// ===============================

extractJobDataFromHTML(jobCard) {
    try {
        this.debugLog(`📊 استخراج البصمة الكاملة للوظيفة: ${jobCard.title}`);
        
        const container = jobCard.container || jobCard.link.closest('[data-container]');
        if (!container) {
            this.debugLog('❌ لم يوجد عنصر data-container');
            return this.getMinimalJobData(jobCard);
        }

        const jobData = {
            company: null,
            title: jobCard.title,
            matchingScore: null,
            city: null,
            publishDate: null,
            availableJobs: null
        };

        // 1. استخراج اسم الشركة - طريقة محسنة
        jobData.company = this.extractCompanyAdvanced(container, jobCard);
        
        // 2. استخراج نسبة التوافق
        const matchElement = container.querySelector('span.matching_score');
        if (matchElement && matchElement.textContent?.trim()) {
            jobData.matchingScore = matchElement.textContent.trim();
            this.debugLog(`📊 نسبة التوافق: ${jobData.matchingScore}`);
        }

        // 3. استخراج المدينة
        jobData.city = this.extractCityAdvanced(container);
        
        // 4. استخراج عدد الوظائف المتاحة
        jobData.availableJobs = this.extractJobCountAdvanced(container);
        
        // 5. استخراج تاريخ النشر
        jobData.publishDate = this.extractDateAdvanced(container);

        // تسجيل البيانات المستخرجة
        this.debugLog(`✅ البصمة المستخرجة:`);
        this.debugLog(`   🏢 ${jobData.company || 'غير محدد'}`);
        this.debugLog(`   💼 ${jobData.title}`);
        this.debugLog(`   📊 ${jobData.matchingScore || 'غير محدد'}`);
        this.debugLog(`   🏙️ ${jobData.city || 'غير محدد'}`);
        this.debugLog(`   📅 ${jobData.publishDate || 'غير محدد'}`);
        this.debugLog(`   📈 ${jobData.availableJobs || 'غير محدد'}`);

        return jobData;
        
    } catch (error) {
        this.debugLog('❌ خطأ في استخراج البيانات:', error);
        return this.getMinimalJobData(jobCard);
    }
}

// دالة محسنة لاستخراج اسم الشركة
extractCompanyAdvanced(container, jobCard) {
    try {
        // الطريقة 1: البحث في HTML المرسل
        const topContainer = container.querySelector('div.display-flex.align-items-center.margin-bottom-s');
        if (topContainer) {
            const companyLink = topContainer.querySelector('a[data-link] span[data-expression]');
            if (companyLink && companyLink.textContent?.trim()) {
                const companyText = companyLink.textContent.trim();
                if (companyText !== jobCard.title && companyText.length > 3) {
                    this.debugLog(`🏢 الشركة (طريقة 1): ${companyText}`);
                    return companyText;
                }
            }
        }

        // الطريقة 2: البحث في font-bold font-size-base
        const boldContainer = container.querySelector('div.font-bold.font-size-base span[data-expression]');
        if (boldContainer && boldContainer.textContent?.trim()) {
            const companyText = boldContainer.textContent.trim();
            if (companyText !== jobCard.title && companyText.length > 3) {
                this.debugLog(`🏢 الشركة (طريقة 2): ${companyText}`);
                return companyText;
            }
        }

        // الطريقة 3: البحث في أول span[data-expression] في البطاقة
        const firstSpan = container.querySelector('span[data-expression]');
        if (firstSpan && firstSpan.textContent?.trim()) {
            const text = firstSpan.textContent.trim();
            if (text !== jobCard.title && !text.includes('%') && !text.match(/\d{2}\/\d{2}\/\d{4}/) && text.length > 3) {
                this.debugLog(`🏢 الشركة (طريقة 3): ${text}`);
                return text;
            }
        }

        this.debugLog(`🏢 لم يتم العثور على اسم الشركة`);
        return 'شركة غير محددة';
        
    } catch (error) {
        this.debugLog('❌ خطأ في استخراج اسم الشركة:', error);
        return 'شركة غير محددة';
    }
}

// دالة محسنة لاستخراج المدينة
extractCityAdvanced(container) {
    try {
        // البحث في العنصر المخصص للمدينة
        const cityLabels = container.querySelectorAll('div');
        for (const label of cityLabels) {
            if (label.textContent?.includes('المدينة')) {
                // البحث في العنصر التالي
                const parentContainer = label.closest('[data-container]');
                if (parentContainer) {
                    const citySpan = parentContainer.querySelector('span[data-expression]');
                    if (citySpan && citySpan.textContent?.trim()) {
                        const cityText = citySpan.textContent.trim();
                        if (cityText.length < 20 && !cityText.includes('%') && !cityText.match(/\d{2}\/\d{2}\/\d{4}/)) {
                            this.debugLog(`🏙️ المدينة: ${cityText}`);
                            return cityText;
                        }
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        this.debugLog('❌ خطأ في استخراج المدينة:', error);
        return null;
    }
}

// دالة محسنة لاستخراج عدد الوظائف
extractJobCountAdvanced(container) {
    try {
        const jobLabels = container.querySelectorAll('div');
        for (const label of jobLabels) {
            if (label.textContent?.includes('الوظائف المتاحة')) {
                const parentContainer = label.closest('[data-container]');
                if (parentContainer) {
                    const countSpan = parentContainer.querySelector('span[data-expression]');
                    if (countSpan && countSpan.textContent?.trim()) {
                        const countText = countSpan.textContent.trim();
                        if (/^\d+$/.test(countText)) {
                            this.debugLog(`📈 الوظائف المتاحة: ${countText}`);
                            return countText;
                        }
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        this.debugLog('❌ خطأ في استخراج عدد الوظائف:', error);
        return null;
    }
}

// دالة محسنة لاستخراج التاريخ
extractDateAdvanced(container) {
    try {
        const dateLabels = container.querySelectorAll('div');
        for (const label of dateLabels) {
            if (label.textContent?.includes('تاريخ النشر')) {
                const parentContainer = label.closest('[data-container]');
                if (parentContainer) {
                    const dateSpan = parentContainer.querySelector('span[data-expression]');
                    if (dateSpan && dateSpan.textContent?.trim()) {
                        const dateText = dateSpan.textContent.trim();
                        if (/\d{2}\/\d{2}\/\d{4}/.test(dateText)) {
                            this.debugLog(`📅 تاريخ النشر: ${dateText}`);
                            return dateText;
                        }
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        this.debugLog('❌ خطأ في استخراج التاريخ:', error);
        return null;
    }
}

// ===============================
// 🆕 سلسلة الخطوات المُصححة
// ===============================

async processCurrentPage() {
    if (!this.isRunning || this.isPaused) return;

    try {
        this.debugLog('🔄 بدء معالجة الصفحة بالترتيب الصحيح');
        
        // خطوة 1: تأكد من تحميل الصفحة
        await this.waitForJobsToLoad();
        
        // خطوة 2: احصل على قائمة الوظائف الخام (بدون فلترة)
        const allJobCards = this.getAllJobCardsRaw();
        this.debugLog(`💼 وجد ${allJobCards.length} وظيفة في الصفحة`);

        if (allJobCards.length === 0) {
            this.debugLog('⚠️ لا توجد وظائف، الانتقال للصفحة التالية');
            await this.goToNextPage();
            return;
        }

        // خطوة 3: معالجة كل وظيفة بالترتيب
        let processedCount = 0;
        let availableCount = 0;

        for (let i = 0; i < allJobCards.length; i++) {
            if (!this.isRunning || this.isPaused) {
                this.debugLog('🛑 تم إيقاف العملية');
                return;
            }

            const jobCard = allJobCards[i];
            this.debugLog(`\n📝 === معالجة الوظيفة ${i + 1}/${allJobCards.length}: ${jobCard.title} ===`);

            // خطوة 4: فحص "تم التقدم" في القائمة أولاً
            if (this.checkAppliedInList(jobCard.container)) {
                this.debugLog(`⏭️ تخطي (تم التقدم في القائمة): ${jobCard.title}`);
                continue;
            }

            // خطوة 5: فحص الوظائف المزارة
            if (this.isJobVisited(jobCard)) {
                this.debugLog(`⏭️ تخطي (مزارة سابقاً): ${jobCard.title}`);
                continue;
            }

            // خطوة 6: فحص الوظائف المرفوضة
            if (this.isJobRejected(jobCard)) {
                this.debugLog(`⏭️ تخطي (مرفوضة سابقاً): ${jobCard.title}`);
                continue;
            }

            // خطوة 7: وظيفة متاحة - معالجة
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

        // خطوة 8: الانتقال للصفحة التالية
        await this.goToNextPage();

    } catch (error) {
        this.debugLog('❌ خطأ في معالجة الصفحة:', error);
        this.sendMessage('AUTOMATION_ERROR', { error: error.message });
    }
}

// ===============================
// دالة الحصول على الوظائف الخام (بدون فلترة)
// ===============================

getAllJobCardsRaw() {
    this.debugLog('🔍 الحصول على جميع الوظائف الخام');
    
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
            const jobTitle = this.getJobTitleAdvanced(link);
            const jobContainer = this.findJobContainerAdvanced(link);
            
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

    this.debugLog(`📊 النتيجة: ${jobCards.length} وظيفة خام`);
    return jobCards;
}

// ===============================
// فحص "تم التقدم" في القائمة
// ===============================

checkAppliedInList(container) {
    try {
        // فحص أيقونة "تم التقدم"
        const tickIcon = container.querySelector('img[src*="tickcircle.svg"]');
        if (tickIcon) {
            this.debugLog('✅ وجد أيقونة "تم التقدم" في القائمة');
            return true;
        }
        
        // فحص نص "تم التقدم"
        const textContent = container.textContent || '';
        const appliedTexts = ['تم التقدم', 'تم التقديم'];
        
        for (const text of appliedTexts) {
            if (textContent.includes(text)) {
                this.debugLog(`✅ وجد نص "${text}" في القائمة`);
                return true;
            }
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

        // خطوة 1: النقر على الوظيفة والانتقال
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
            await this.goBackToJobListSafe();
            return false;
        }

        // خطوة 2: انتظار تحميل التفاصيل
        this.debugLog('📍 خطوة 2: انتظار تحميل تفاصيل الوظيفة');
        await this.waitForJobDetailsToLoad();
        
        // خطوة 3: إغلاق النوافذ المنبثقة
        this.debugLog('📍 خطوة 3: إغلاق النوافذ المنبثقة');
        await this.handlePopups();

        // خطوة 4: فحص حالة التقديم في التفاصيل
        this.debugLog('📍 خطوة 4: فحص حالة التقديم في التفاصيل');
        const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
        
        if (alreadyApplied) {
            this.debugLog('✅ تم التقديم مسبقاً (في التفاصيل)');
            this.stats.skipped++;
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobCard.title, 
                status: 'skipped' 
            });
        } else {
            // خطوة 5: التقديم على الوظيفة
            this.debugLog('📍 خطوة 5: بدء عملية التقديم');
            
            if (!this.isRunning || this.isPaused) {
                this.debugLog('🛑 تم إيقاف العملية قبل التقديم');
                await this.goBackToJobListSafe();
                return false;
            }
            
            const applicationResult = await this.applyForJobStepByStep();
            
            // خطوة 6: معالجة نتيجة التقديم
            this.debugLog('📍 خطوة 6: معالجة نتيجة التقديم');
            this.handleApplicationResult(applicationResult, jobCard);
        }

        this.stats.total++;
        this.sendMessage('UPDATE_STATS', { stats: this.stats });
        
        // خطوة 7: العودة للقائمة
        this.debugLog('📍 خطوة 7: العودة لقائمة الوظائف');
        await this.goBackToJobListSafe();
        
        return true;

    } catch (error) {
        this.debugLog('❌ خطأ في معالجة الوظيفة:', error);
        this.stats.skipped++;
        this.stats.total++;
        this.sendMessage('UPDATE_STATS', { stats: this.stats });
        
        // محاولة العودة للقائمة
        try {
            await this.goBackToJobListSafe();
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
        await this.waitForNavigation(currentUrl);
        
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
            const linkTitle = this.getJobTitleAdvanced(link);
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
// التقديم خطوة بخطوة
// ===============================

async applyForJobStepByStep() {
    this.debugLog('📝 === بدء عملية التقديم خطوة بخطوة ===');
    
    try {
        // خطوة 1: البحث عن زر التقديم
        this.debugLog('🔍 خطوة 1: البحث عن زر التقديم');
        const submitButton = this.findSubmitButton();
        if (!submitButton) {
            this.debugLog('❌ لم يتم العثور على زر التقديم');
            return { success: false, reason: 'لم يوجد زر التقديم' };
        }
        
        this.debugLog(`✅ وجد زر التقديم: "${submitButton.textContent.trim()}"`);

        // خطوة 2: النقر على زر التقديم
        this.debugLog('🎯 خطوة 2: النقر على زر التقديم');
        if (!this.isRunning || this.isPaused) {
            return { success: false, reason: 'تم إيقاف العملية' };
        }
        
        await this.clickElementSafe(submitButton);
        await this.wait(3000);

        // خطوة 3: البحث عن نافذة التأكيد
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

        // خطوة 5: فحص نتيجة التقديم
        this.debugLog('🔍 خطوة 5: فحص نتيجة التقديم');
        if (!this.isRunning || this.isPaused) {
            return { success: false, reason: 'تم إيقاف العملية' };
        }
        
        await this.wait(2000); // انتظار إضافي للتأكد من ظهور النتيجة
        const result = this.checkApplicationResult();
        
        // خطوة 6: إغلاق أي نوافذ نتيجة
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
// إغلاق نوافذ النتيجة
// ===============================

async closeResultModals() {
    try {
        const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
        
        for (const modal of modals) {
            if (modal.offsetWidth > 0 && modal.offsetHeight > 0) {
                const text = modal.textContent || '';
                
                // إذا كانت نافذة نتيجة
                if (text.includes('تم التقديم') || text.includes('لا يمكنك') || text.includes('عذراً')) {
                    this.debugLog('🚫 إغلاق نافذة النتيجة');
                    
                    const buttons = modal.querySelectorAll('button');
                    for (const btn of buttons) {
                        const btnText = btn.textContent?.trim();
                        if (btnText && (btnText.includes('إغلاق') || btnText.includes('موافق') || btnText.includes('×'))) {
                            await this.clickElementSafe(btn);
                            await this.wait(1000);
                            return;
                        }
                    }
                }
            }
        }
    } catch (error) {
        this.debugLog('❌ خطأ في إغلاق النوافذ:', error);
    }
}

// ===============================
// فحص نتيجة التقديم المحسن
// ===============================

checkApplicationResult() {
    this.debugLog('🔍 فحص نتيجة التقديم المفصل');
    
    const pageText = document.body.textContent;
    
    // فحص مؤشرات النجاح
    const successIndicators = [
        'تم التقديم بنجاح',
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
    
    // فحص مؤشرات الرفض
    const rejectionIndicators = [
        'عذراً',
        'لا يمكنك التقديم',
        'غير مؤهل',
        'لا يطابق',
        'لا تستوفي',
        'غير مناسب'
    ];
    
    for (const indicator of rejectionIndicators) {
        if (pageText.includes(indicator)) {
            const reason = this.extractRejectionReasonDetailed(pageText);
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

// استخراج سبب الرفض بتفصيل أكثر
extractRejectionReasonDetailed(text) {
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
// فحص التقديم المسبق في التفاصيل
// ===============================

async checkIfAlreadyAppliedInDetails() {
    this.debugLog('🔍 فحص حالة التقديم المسبق في التفاصيل');
    
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
    
    // فحص أزرار بدلاً من "تقديم"
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
        const btnText = button.textContent?.trim();
        if (btnText && btnText.includes('استعراض')) {
            this.debugLog(`✅ وجد زر استعراض: ${btnText}`);
            return true;
        }
    }
    
    this.debugLog('✅ لم يتم التقديم مسبقاً');
    return false;
}

// ===============================
// البحث عن زر التقديم المحسن
// ===============================

findSubmitButton() {
    this.debugLog('🔍 البحث المفصل عن زر التقديم');
    
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
// البحث عن نافذة التأكيد
// ===============================

findConfirmationModal() {
    this.debugLog('🔍 البحث عن نافذة التأكيد');
    
    const selectors = ['[role="dialog"]', '.modal', '[class*="modal"]', '[class*="popup"]'];
    
    for (const selector of selectors) {
        const dialogs = document.querySelectorAll(selector);
        
        for (const dialog of dialogs) {
            if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                const text = dialog.textContent || '';
                this.debugLog(`🔍 فحص نافذة: "${text.substring(0, 100)}..."`);
                
                if (text.includes('هل أنت متأكد') || 
                    text.includes('تأكيد') || 
                    text.includes('متأكد من التقديم') ||
                    text.includes('تأكيد التقديم')) {
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
// العودة الآمنة لقائمة الوظائف
// ===============================

async goBackToJobListSafe() {
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
            
            await this.waitForJobsToLoad();
        } else {
            // في صفحة غير متوقعة
            this.debugLog('⚠️ صفحة غير متوقعة - انتقال مباشر');
            window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
            await this.wait(5000);
            await this.waitForJobsToLoad();
        }
        
        this.debugLog('✅ تمت العودة بنجاح لقائمة الوظائف');
        
    } catch (error) {
        this.debugLog('❌ خطأ في العودة:', error);
        
        // محاولة أخيرة
        try {
            window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
            await this.wait(5000);
            await this.waitForJobsToLoad();
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
        await this.waitForJobsToLoad();
        await this.processCurrentPage();
    } else {
        this.debugLog('🏁 انتهت جميع الصفحات');
        this.sendMessage('AUTOMATION_COMPLETED');
    }
}

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3;
            return base + (Math.random() * 2 - 1) * variation;
        }

        // ===============================
        // دوال النظام الأساسية
        // ===============================

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
                const jobCards = window.jadaratAutoContent.getJobCards();
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
                const allLinks = document.querySelectorAll('a[href*="JobDetails"]');
                if (allLinks[cardIndex]) {
                    const link = allLinks[cardIndex];
                    const container = window.jadaratAutoContent.findJobContainerAdvanced(link);
                    const title = window.jadaratAutoContent.getJobTitleAdvanced(link);
                    
                    const jobCard = {
                        link: link,
                        container: container,
                        title: title
                    };
                    
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