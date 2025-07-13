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

                // 1. استخراج اسم الشركة من الموقع الصحيح
                const companySelectors = [
                    'div.display-flex.align-items-center.margin-bottom-s span[data-expression]',
                    'a[data-link] span[data-expression]'
                ];
                
                for (const selector of companySelectors) {
                    const companyElement = container.querySelector(selector);
                    if (companyElement && companyElement.textContent?.trim()) {
                        const companyText = companyElement.textContent.trim();
                        // تأكد أنه ليس عنوان الوظيفة
                        if (companyText !== jobCard.title && companyText.length > 5) {
                            jobData.company = companyText;
                            this.debugLog(`🏢 الشركة: ${jobData.company}`);
                            break;
                        }
                    }
                }

                // 2. استخراج نسبة التوافق من العنصر المخصص
                const matchingElement = container.querySelector('span.matching_score[data-expression]');
                if (matchingElement && matchingElement.textContent?.trim()) {
                    jobData.matchingScore = matchingElement.textContent.trim();
                    this.debugLog(`📊 نسبة التوافق: ${jobData.matchingScore}`);
                }

                // 3. استخراج المدينة من القسم المخصص
                const cityContainer = this.findTextContainer(container, 'المدينة');
                if (cityContainer) {
                    const citySpan = cityContainer.parentElement?.querySelector('span[data-expression]');
                    if (citySpan && citySpan.textContent?.trim()) {
                        jobData.city = citySpan.textContent.trim();
                        this.debugLog(`🏙️ المدينة: ${jobData.city}`);
                    }
                }

                // طريقة بديلة للمدينة باستخدام النص
                if (!jobData.city) {
                    const allContainers = container.querySelectorAll('[data-container]');
                    for (const cont of allContainers) {
                        const text = cont.textContent || '';
                        if (text.includes('المدينة')) {
                            const spans = cont.querySelectorAll('span[data-expression]');
                            for (const span of spans) {
                                const spanText = span.textContent?.trim();
                                if (spanText && !spanText.includes('%') && !spanText.match(/\d{2}\/\d{2}\/\d{4}/) && spanText.length < 20) {
                                    jobData.city = spanText;
                                    this.debugLog(`🏙️ المدينة (بديل): ${jobData.city}`);
                                    break;
                                }
                            }
                            if (jobData.city) break;
                        }
                    }
                }

                // 4. استخراج عدد الوظائف المتاحة
                const jobCountContainer = this.findTextContainer(container, 'الوظائف المتاحة');
                if (jobCountContainer) {
                    const countSpan = jobCountContainer.parentElement?.querySelector('span[data-expression]');
                    if (countSpan && countSpan.textContent?.trim()) {
                        const countText = countSpan.textContent.trim();
                        if (/^\d+$/.test(countText)) {
                            jobData.availableJobs = countText;
                            this.debugLog(`📈 الوظائف المتاحة: ${jobData.availableJobs}`);
                        }
                    }
                }

                // طريقة بديلة لعدد الوظائف
                if (!jobData.availableJobs) {
                    const allContainers = container.querySelectorAll('[data-container]');
                    for (const cont of allContainers) {
                        const text = cont.textContent || '';
                        if (text.includes('الوظائف المتاحة')) {
                            const spans = cont.querySelectorAll('span[data-expression]');
                            for (const span of spans) {
                                const spanText = span.textContent?.trim();
                                if (spanText && /^\d+$/.test(spanText)) {
                                    jobData.availableJobs = spanText;
                                    this.debugLog(`📈 الوظائف المتاحة (بديل): ${jobData.availableJobs}`);
                                    break;
                                }
                            }
                            if (jobData.availableJobs) break;
                        }
                    }
                }

                // 5. استخراج تاريخ النشر
                const dateContainer = this.findTextContainer(container, 'تاريخ النشر');
                if (dateContainer) {
                    const dateSpan = dateContainer.parentElement?.querySelector('span[data-expression]');
                    if (dateSpan && dateSpan.textContent?.trim()) {
                        const dateText = dateSpan.textContent.trim();
                        if (/\d{2}\/\d{2}\/\d{4}/.test(dateText)) {
                            jobData.publishDate = dateText;
                            this.debugLog(`📅 تاريخ النشر: ${jobData.publishDate}`);
                        }
                    }
                }

                // طريقة بديلة للتاريخ
                if (!jobData.publishDate) {
                    const allSpans = container.querySelectorAll('span[data-expression]');
                    for (const span of allSpans) {
                        const text = span.textContent?.trim();
                        if (text && /\d{2}\/\d{2}\/\d{4}/.test(text)) {
                            jobData.publishDate = text;
                            this.debugLog(`📅 تاريخ النشر (بديل): ${jobData.publishDate}`);
                            break;
                        }
                    }
                }

                // إذا لم نجد الشركة، استخدم الطريقة القديمة
                if (!jobData.company) {
                    jobData.company = this.extractCompanyNameAdvanced(container, jobCard.title);
                }

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

        // دالة مساعدة للعثور على عنصر يحتوي على نص معين
        findTextContainer(container, searchText) {
            try {
                const allDivs = container.querySelectorAll('div');
                for (const div of allDivs) {
                    if (div.textContent?.includes(searchText)) {
                        return div;
                    }
                }
                return null;
            } catch (error) {
                return null;
            }
        }

        // ===============================
        // دالة محسنة لاستخراج اسم الشركة
        // ===============================

        extractCompanyNameAdvanced(container, jobTitle) {
            try {
                // البحث في الجزء العلوي من البطاقة
                const topSection = container.querySelector('div.display-flex.align-items-center.margin-bottom-s');
                if (topSection) {
                    const companySpan = topSection.querySelector('span[data-expression]');
                    if (companySpan && companySpan.textContent?.trim()) {
                        const companyText = companySpan.textContent.trim();
                        if (companyText !== jobTitle && companyText.length > 3) {
                            this.debugLog(`🏢 الشركة (متقدم): ${companyText}`);
                            return companyText;
                        }
                    }
                }

                // البحث في جميع الروابط
                const companyLinks = container.querySelectorAll('a[data-link] span[data-expression]');
                for (const span of companyLinks) {
                    const text = span.textContent?.trim();
                    if (text && text !== jobTitle && text.length > 3 && !text.includes('%')) {
                        this.debugLog(`🏢 الشركة (رابط): ${text}`);
                        return text;
                    }
                }

                // البحث العام في أول span
                const firstSpans = container.querySelectorAll('span[data-expression]');
                if (firstSpans.length > 0) {
                    const firstSpan = firstSpans[0];
                    const text = firstSpan.textContent?.trim();
                    if (text && text !== jobTitle && text.length > 3 && !text.includes('%') && !text.match(/\d{2}\/\d{2}\/\d{4}/)) {
                        this.debugLog(`🏢 الشركة (أول span): ${text}`);
                        return text;
                    }
                }

                return 'شركة غير محددة';
                
            } catch (error) {
                this.debugLog('❌ خطأ في استخراج اسم الشركة المتقدم:', error);
                return 'شركة غير محددة';
            }
        }

        getMinimalJobData(jobCard) {
            return {
                title: jobCard.title || 'وظيفة غير محددة',
                company: 'شركة غير محددة',
                city: null,
                matchingScore: null,
                publishDate: null,
                availableJobs: null
            };
        }

        cleanTextForId(text) {
            if (!text || typeof text !== 'string') return 'unknown';
            return text
                .replace(/[^\w\u0600-\u06FF]/g, '') // إزالة الرموز مع الحفاظ على العربية
                .toLowerCase()
                .trim()
                .substring(0, 50); // تحديد الطول
        }

        // ===============================
        // 🆕 نظام التعرف على الوظيفة بالبصمة الكاملة المُصحح
        // ===============================

        generateJobIdentifiers(jobCard) {
            const identifiers = [];
            
            try {
                const jobData = this.extractJobDataFromHTML(jobCard);
                
                if (!jobData) {
                    this.debugLog('❌ فشل في استخراج البيانات، إنشاء معرف طوارئ');
                    const emergencyId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    return [emergencyId];
                }
                
                this.debugLog(`🔑 إنشاء بصمة فريدة للوظيفة:`);
                this.debugLog(`   🏢 الشركة: ${jobData.company}`);
                this.debugLog(`   💼 المسمى: ${jobData.title}`);
                this.debugLog(`   🏙️ المدينة: ${jobData.city || 'غير محدد'}`);
                this.debugLog(`   📊 نسبة التوافق: ${jobData.matchingScore || 'غير محدد'}`);
                this.debugLog(`   📅 تاريخ النشر: ${jobData.publishDate || 'غير محدد'}`);
                this.debugLog(`   📈 الوظائف المتاحة: ${jobData.availableJobs || 'غير محدد'}`);

                // تنظيف البيانات للمعرفات
                const cleanCompany = this.cleanTextForId(jobData.company);
                const cleanTitle = this.cleanTextForId(jobData.title);
                const cleanCity = this.cleanTextForId(jobData.city);
                const cleanDate = this.cleanTextForId(jobData.publishDate);
                const cleanJobs = this.cleanTextForId(jobData.availableJobs);
                const cleanScore = this.cleanTextForId(jobData.matchingScore);

                // المعرف الأساسي: البصمة الكاملة (الأقوى والأوثق)
                if (cleanCompany && cleanTitle && cleanCity && cleanDate) {
                    const fullFingerprint = `${cleanCompany}_${cleanTitle}_${cleanCity}_${cleanDate}`;
                    identifiers.push(fullFingerprint);
                    this.debugLog(`🔑 البصمة الكاملة: ${fullFingerprint}`);
                }

                // المعرف الثانوي: شركة + وظيفة + مدينة + عدد الوظائف
                if (cleanCompany && cleanTitle && cleanCity && cleanJobs) {
                    const jobCountId = `${cleanCompany}_${cleanTitle}_${cleanCity}_jobs_${cleanJobs}`;
                    identifiers.push(jobCountId);
                    this.debugLog(`🔑 معرف بعدد الوظائف: ${jobCountId}`);
                }

                // المعرف الثالث: شركة + وظيفة + نسبة التوافق
                if (cleanCompany && cleanTitle && cleanScore) {
                    const scoreId = `${cleanCompany}_${cleanTitle}_score_${cleanScore}`;
                    identifiers.push(scoreId);
                    this.debugLog(`🔑 معرف بنسبة التوافق: ${scoreId}`);
                }

                // المعرف الرابع: شركة + وظيفة + مدينة (بدون تاريخ)
                if (cleanCompany && cleanTitle && cleanCity) {
                    const locationId = `${cleanCompany}_${cleanTitle}_${cleanCity}`;
                    identifiers.push(locationId);
                    this.debugLog(`🔑 معرف بالموقع: ${locationId}`);
                }

                // المعرف الاحتياطي: شركة + وظيفة فقط
                if (cleanCompany && cleanTitle) {
                    const basicId = `${cleanCompany}_${cleanTitle}`;
                    identifiers.push(basicId);
                    this.debugLog(`🔑 معرف أساسي: ${basicId}`);
                }

                // في حالة عدم وجود معرفات، إنشاء معرف طوارئ
                if (identifiers.length === 0) {
                    const emergencyId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    identifiers.push(emergencyId);
                    this.debugLog(`🚨 معرف طوارئ: ${emergencyId}`);
                }

                this.debugLog(`📊 تم إنشاء ${identifiers.length} معرف مختلف للوظيفة`);
                return identifiers;
                
            } catch (error) {
                this.debugLog('❌ خطأ في توليد المعرفات:', error);
                return [`error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`];
            }
        }

        isJobVisited(jobCard) {
            try {
                const jobIds = this.generateJobIdentifiers(jobCard);
                const jobData = this.extractJobDataFromHTML(jobCard);
                
                this.debugLog(`🔍 فحص زيارة الوظيفة:`);
                this.debugLog(`   🏢 ${jobData.company} - 💼 ${jobData.title}`);
                this.debugLog(`   🏙️ ${jobData.city} - 📅 ${jobData.publishDate}`);
                
                for (let i = 0; i < jobIds.length; i++) {
                    const id = jobIds[i];
                    if (this.visitedJobs.has(id)) {
                        this.debugLog(`🚫 وظيفة مزارة سابقاً!`);
                        this.debugLog(`   🔑 المعرف المطابق: ${id.substring(0, 50)}...`);
                        return true;
                    }
                }
                
                this.debugLog(`✅ وظيفة جديدة غير مزارة`);
                return false;
                
            } catch (error) {
                this.debugLog('❌ خطأ في فحص زيارة الوظيفة:', error);
                return false;
            }
        }

        isJobRejected(jobCard) {
            try {
                const jobIds = this.generateJobIdentifiers(jobCard);
                
                for (const id of jobIds) {
                    if (this.rejectedJobs.has(id)) {
                        this.debugLog(`🚫 وظيفة مرفوضة سابقاً بالبصمة: ${id.substring(0, 40)}...`);
                        return true;
                    }
                }
                
                return false;
            } catch (error) {
                this.debugLog('❌ خطأ في فحص رفض الوظيفة:', error);
                return false;
            }
        }

        markJobAsVisited(jobCard) {
            try {
                const jobIds = this.generateJobIdentifiers(jobCard);
                const jobData = this.extractJobDataFromHTML(jobCard);
                
                this.debugLog(`📝 تسجيل وظيفة كمزارة:`);
                this.debugLog(`   🏢 ${jobData.company} - 💼 ${jobData.title}`);
                this.debugLog(`   🏙️ ${jobData.city} - 📅 ${jobData.publishDate}`);
                
                for (const id of jobIds) {
                    this.visitedJobs.add(id);
                }
                
                this.debugLog(`🔑 تم حفظ ${jobIds.length} معرف بصمة فريدة`);
                this.saveVisitedJobs();
                
            } catch (error) {
                this.debugLog('❌ خطأ في تسجيل الوظيفة كمزارة:', error);
                const emergencyId = `emergency_${jobCard.title}_${Date.now()}`;
                this.visitedJobs.add(emergencyId);
                this.saveVisitedJobs();
            }
        }

        // ===============================
        // 🆕 دوال الحصول على الوظائف المُحسنة
        // ===============================

        getJobCards() {
            this.debugLog('🔍 البحث عن بطاقات الوظائف المحسن');
            
            const jobCards = [];
            const processedTitles = new Set(); // لتجنب التكرار
            
            // البحث عن الروابط الرئيسية للوظائف
            const selectors = [
                'a[data-link][href*="/Jadarat/JobDetails"]',
                'a[href*="JobDetails"]',
                'a[href*="Param="]'
            ];
            
            let jobLinks = [];
            for (const selector of selectors) {
                jobLinks = document.querySelectorAll(selector);
                if (jobLinks.length > 0) {
                    this.debugLog(`🔗 وجد ${jobLinks.length} رابط بـ: ${selector}`);
                    break;
                }
            }
            
            let skippedCount = 0;
            let duplicateCount = 0;
            
            for (const link of jobLinks) {
                try {
                    const jobTitle = this.getJobTitleAdvanced(link);
                    const jobContainer = this.findJobContainerAdvanced(link);
                    
                    // تجنب التكرار في نفس الصفحة
                    if (processedTitles.has(jobTitle)) {
                        duplicateCount++;
                        this.debugLog(`🔄 تخطي مكرر في الصفحة: ${jobTitle}`);
                        continue;
                    }
                    
                    processedTitles.add(jobTitle);
                    
                    if (jobContainer) {
                        const jobCard = {
                            link: link,
                            container: jobContainer,
                            title: jobTitle
                        };
                        
                        // فحص "تم التقدم" المحسن
                        const hasAppliedStatus = this.checkAppliedStatusAdvanced(jobContainer);
                        
                        if (hasAppliedStatus) {
                            skippedCount++;
                            this.debugLog(`⏭️ تخطي مُقدم عليها: ${jobTitle}`);
                            continue;
                        }
                        
                        // فحص الوظائف المزارة
                        if (this.isJobVisited(jobCard)) {
                            skippedCount++;
                            this.debugLog(`⏭️ تخطي مزارة سابقاً: ${jobTitle}`);
                            continue;
                        }
                        
                        // فحص الوظائف المرفوضة
                        if (this.isJobRejected(jobCard)) {
                            skippedCount++;
                            this.debugLog(`⏭️ تخطي مرفوضة سابقاً: ${jobTitle}`);
                            continue;
                        }
                        
                        jobCards.push(jobCard);
                        this.debugLog(`✅ وظيفة متاحة: ${jobTitle}`);
                    }
                } catch (error) {
                    this.debugLog(`❌ خطأ في معالجة رابط:`, error);
                    continue;
                }
            }

            this.debugLog(`📊 النتيجة: ${jobCards.length} متاحة، ${skippedCount} متخطاة، ${duplicateCount} مكررة`);
            return jobCards;
        }

        // ===============================
        // دالة محسنة لاستخراج عنوان الوظيفة
        // ===============================

        getJobTitleAdvanced(link) {
            try {
                // البحث في العنصر المخصص لعنوان الوظيفة
                const titleSelectors = [
                    'span.heading4.OSFillParent',
                    'span.heading4',
                    '.heading4',
                    'span[data-expression]'
                ];
                
                for (const selector of titleSelectors) {
                    const element = link.querySelector(selector);
                    if (element && element.textContent?.trim()) {
                        const title = element.textContent.trim();
                        if (title.length > 2) {
                            return title;
                        }
                    }
                }
                
                // البحث في النص المباشر للرابط
                const linkText = link.textContent?.trim();
                if (linkText && linkText.length > 2) {
                    return linkText;
                }
                
                return 'وظيفة غير محددة';
            } catch (error) {
                this.debugLog('❌ خطأ في استخراج عنوان الوظيفة:', error);
                return 'وظيفة غير محددة';
            }
        }

        // ===============================
        // دالة محسنة للعثور على حاوية الوظيفة
        // ===============================

        findJobContainerAdvanced(link) {
            try {
                // البحث عن أقرب data-container يحتوي على معلومات الوظيفة
                let container = link;
                
                for (let i = 0; i < 10; i++) {
                    if (!container.parentElement) break;
                    container = container.parentElement;
                    
                    // التحقق من وجود معلومات الوظيفة
                    const hasJobInfo = container.textContent?.includes('المدينة') || 
                                     container.textContent?.includes('تاريخ النشر') ||
                                     container.textContent?.includes('الوظائف المتاحة') ||
                                     container.querySelector('span.matching_score');
                    
                    if (hasJobInfo && container.hasAttribute('data-container')) {
                        return container;
                    }
                }
                
                // إذا لم نجد، استخدم أقرب data-container
                return link.closest('[data-container]') || link.parentElement;
            } catch (error) {
                this.debugLog('❌ خطأ في العثور على حاوية الوظيفة:', error);
                return link.parentElement;
            }
        }

        // ===============================
        // دالة محسنة لفحص حالة "تم التقدم"
        // ===============================

        checkAppliedStatusAdvanced(container) {
            try {
                // البحث عن أيقونة "تم التقدم"
                const tickIcon = container.querySelector('img[src*="tickcircle.svg"]');
                if (tickIcon) {
                    this.debugLog('✅ وجد أيقونة "تم التقدم"');
                    return true;
                }
                
                // البحث عن نص "تم التقدم"
                const appliedText = container.textContent || '';
                const appliedIndicators = ['تم التقدم', 'تم التقديم', 'مُقدم عليها'];
                
                for (const indicator of appliedIndicators) {
                    if (appliedText.includes(indicator)) {
                        this.debugLog(`✅ وجد نص التقديم: ${indicator}`);
                        return true;
                    }
                }
                
                return false;
            } catch (error) {
                this.debugLog('❌ خطأ في فحص حالة التقديم:', error);
                return false;
            }
        }

        // ===============================
        // دوال الأتمتة الرئيسية
        // ===============================

        async startSmartAutomation() {
            this.debugLog('🧠 بدء الأتمتة الذكية');
            
            if (!this.checkLoginStatus()) {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: '⚠️ يجب تسجيل الدخول أولاً' 
                });
                return;
            }
            
            this.isRunning = true;
            this.isPaused = false;
            
            try {
                await this.smartStart();
            } catch (error) {
                this.debugLog('❌ خطأ في الأتمتة:', error);
                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
            }
        }

        async smartStart() {
            this.debugLog(`🎯 البدء الذكي - نوع الصفحة: ${this.pageType}`);
            
            try {
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
                }
            } catch (error) {
                this.debugLog('❌ خطأ في البدء الذكي:', error);
                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
            }
        }

        checkLoginStatus() {
            const loginIndicators = ['تسجيل الدخول', 'دخول', 'Login'];
            const allButtons = document.querySelectorAll('button, a');
            
            for (const btn of allButtons) {
                const text = btn.textContent.trim();
                const isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0;
                
                if (isVisible && loginIndicators.some(indicator => text.includes(indicator))) {
                    this.debugLog('❌ المستخدم غير مسجل دخول');
                    return false;
                }
            }
            
            this.debugLog('✅ المستخدم مسجل دخول');
            return true;
        }

        async startFromJobList() {
            this.debugLog('📋 البدء من قائمة الوظائف');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 0, 
                text: `بدء المعالجة من الصفحة ${this.currentPage}` 
            });

            await this.processCurrentPage();
        }

        async startFromJobDetails() {
            this.debugLog('📄 البدء من صفحة تفاصيل الوظيفة');
            
            const jobTitle = this.extractCurrentJobTitle();
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 10, 
                text: `معالجة الوظيفة الحالية: ${jobTitle}` 
            });

            try {
                const result = await this.processCurrentJobDetails();
                
                if (result.completed) {
                    await this.goBackToJobList();
                    await this.waitForJobsToLoad();
                    await this.processCurrentPage();
                } else {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: result.error || 'فشل في معالجة الوظيفة الحالية' 
                    });
                }
            } catch (error) {
                this.debugLog('❌ خطأ في startFromJobDetails:', error);
                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
            }
        }

        async navigateToJobList() {
            this.debugLog('🔄 الانتقال لقائمة الوظائف');
            
            const exploreJobsLink = document.querySelector('a[href*="ExploreJobs"], a[href*="JobTab=1"]');
            
            if (exploreJobsLink) {
                await this.clickElementBasic(exploreJobsLink);
                await this.wait(5000);
                this.checkPageType();
                
                if (this.pageType === 'jobList') {
                    await this.startFromJobList();
                } else {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'فشل في الانتقال لقائمة الوظائف' 
                    });
                }
            } else {
                window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                await this.wait(8000);
                await this.startFromJobList();
            }
        }

        async processCurrentPage() {
            if (!this.isRunning || this.isPaused) return;

            try {
                this.debugLog('🔄 معالجة الصفحة الحالية');
                
                await this.waitForJobsToLoad();
                const jobCards = this.getJobCards();
                this.totalJobs = jobCards.length;

                this.debugLog(`💼 وجد ${this.totalJobs} وظيفة متاحة`);

                if (this.totalJobs === 0) {
                    this.debugLog('⚠️ لا توجد وظائف، الانتقال للصفحة التالية');
                    await this.goToNextPage();
                    return;
                }

                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 0, 
                    text: `وجد ${this.totalJobs} وظيفة متاحة` 
                });

                for (let i = this.currentJobIndex; i < jobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        this.debugLog('🛑 تم إيقاف العملية');
                        return;
                    }

                    const jobCard = jobCards[i];
                    this.debugLog(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
                    this.currentJobIndex = i + 1;

                    await this.processJobWithRetry(jobCard, i + 1);
                    
                    const progress = ((i + 1) / jobCards.length) * 100;
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: progress, 
                        text: `الوظيفة ${i + 1}/${jobCards.length}` 
                    });

                    await this.wait(this.getRandomDelay());
                }

                await this.goToNextPage();

            } catch (error) {
                this.debugLog('❌ خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
            }
        }

        async processJobWithRetry(jobCard, jobIndex, maxRetries = 2) {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    this.debugLog(`🎯 محاولة ${attempt}/${maxRetries}: ${jobCard.title}`);
                    await this.processJob(jobCard, jobIndex);
                    return true;
                } catch (error) {
                    this.debugLog(`❌ فشلت المحاولة ${attempt}:`, error.message);
                    if (attempt < maxRetries) {
                        await this.wait(3000);
                    }
                }
            }
            
            this.debugLog(`❌ فشل نهائياً: ${jobCard.title}`);
            this.stats.skipped++;
            this.stats.total++;
            this.sendMessage('UPDATE_STATS', { stats: this.stats });
            return false;
        }

        async processJob(jobCard, jobIndex) {
            const jobTitle = jobCard.title;
            this.debugLog(`🎯 معالجة الوظيفة ${jobIndex}: ${jobTitle}`);
            
            // فحص الإيقاف قبل البدء
            if (!this.isRunning || this.isPaused) {
                this.debugLog('🛑 تم إيقاف العملية قبل معالجة الوظيفة');
                return;
            }
            
            this.markJobAsVisited(jobCard);
            
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobTitle, 
                status: 'processing' 
            });

            this.debugLog('👆 النقر على رابط الوظيفة');
            const currentUrl = window.location.href;
            
            await this.clickElementBasic(jobCard.link);
            
            // فحص الإيقاف بعد النقر
            if (!this.isRunning || this.isPaused) {
                this.debugLog('🛑 تم إيقاف العملية بعد النقر');
                return;
            }
            
            await this.waitForNavigation(currentUrl);
            
            // فحص الإيقاف بعد التنقل
            if (!this.isRunning || this.isPaused) {
                this.debugLog('🛑 تم إيقاف العملية بعد التنقل');
                return;
            }
            
            await this.waitForJobDetailsToLoad();
            await this.handlePopups();
            
            // فحص الإيقاف قبل التقديم
            if (!this.isRunning || this.isPaused) {
                this.debugLog('🛑 تم إيقاف العملية قبل التقديم');
                await this.goBackToJobListSafe();
                return;
            }
            
            const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
            
            if (alreadyApplied) {
                this.stats.skipped++;
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'skipped' 
                });
            } else {
                // فحص الإيقاف قبل التقديم
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية قبل بدء التقديم');
                    await this.goBackToJobListSafe();
                    return;
                }
                
                const applicationResult = await this.applyForJobBasic();
                
                if (applicationResult && applicationResult.success) {
                    this.stats.applied++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'success' 
                    });
                } else if (applicationResult && applicationResult.type === 'rejection') {
                    this.stats.rejected = (this.stats.rejected || 0) + 1;
                    
                    // حفظ البيانات المفصلة للرفض
                    const rejectionData = {
                        date: new Date().toLocaleDateString('ar-SA'),
                        time: new Date().toLocaleTimeString('ar-SA'),
                        jobTitle: jobTitle,
                        reason: applicationResult.reason || 'سبب غير محدد'
                    };
                    
                    // إرسال بيانات الرفض للخلفية
                    chrome.runtime.sendMessage({
                        action: 'SAVE_REJECTION_DATA',
                        rejectionData: rejectionData
                    });
                    
                    const jobIds = this.generateJobIdentifiers(jobCard);
                    for (const id of jobIds) {
                        this.rejectedJobs.add(id);
                    }
                    this.saveRejectedJobs();
                    
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'rejected',
                        reason: applicationResult.reason
                    });
                } else {
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'skipped'
                    });
                }
            }

            this.stats.total++;
            this.sendMessage('UPDATE_STATS', { stats: this.stats });
            
            // العودة الآمنة للقائمة
            await this.goBackToJobListSafe();
        }

        async processCurrentJobDetails() {
            try {
                // فحص الإيقاف في البداية
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية قبل معالجة تفاصيل الوظيفة');
                    return { completed: false, error: 'تم إيقاف العملية' };
                }
                
                const jobTitle = this.extractCurrentJobTitle();
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                await this.handlePopups();
                
                // فحص الإيقاف بعد التعامل مع النوافذ المنبثقة
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية بعد التعامل مع النوافذ المنبثقة');
                    return { completed: false, error: 'تم إيقاف العملية' };
                }
                
                const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                
                if (alreadyApplied) {
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'skipped' 
                    });
                } else {
                    // فحص الإيقاف قبل التقديم
                    if (!this.isRunning || this.isPaused) {
                        this.debugLog('🛑 تم إيقاف العملية قبل التقديم');
                        return { completed: false, error: 'تم إيقاف العملية' };
                    }
                    
                    const applicationResult = await this.applyForJobBasic();
                    
                    if (applicationResult && applicationResult.success) {
                        this.stats.applied++;
                        this.sendMessage('UPDATE_CURRENT_JOB', { 
                            jobTitle: jobTitle, 
                            status: 'success' 
                        });
                    } else {
                        this.stats.skipped++;
                        this.sendMessage('UPDATE_CURRENT_JOB', { 
                            jobTitle: jobTitle, 
                            status: 'skipped'
                        });
                    }
                }

                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                return { completed: true };

            } catch (error) {
                this.debugLog('❌ خطأ في معالجة الوظيفة الحالية:', error);
                return { completed: false, error: error.message };
            }
        }

        // ===============================
        // دوال التقديم والتفاعل
        // ===============================

        async applyForJobBasic() {
            this.debugLog('📝 بدء عملية التقديم');
            
            try {
                // فحص الإيقاف قبل البحث عن الزر
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية قبل البحث عن زر التقديم');
                    return { success: false, reason: 'تم إيقاف العملية' };
                }
                
                const submitButton = this.findSubmitButton();
                if (!submitButton) {
                    this.debugLog('❌ لم يتم العثور على زر التقديم');
                    return { success: false, reason: 'لم يوجد زر التقديم' };
                }
                
                // فحص الإيقاف قبل النقر على زر التقديم
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية قبل النقر على زر التقديم');
                    return { success: false, reason: 'تم إيقاف العملية' };
                }
                
                this.debugLog('🎯 النقر على زر التقديم');
                await this.clickElementBasic(submitButton);
                await this.wait(5000);
                
                // فحص الإيقاف بعد النقر
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية بعد النقر على زر التقديم');
                    return { success: false, reason: 'تم إيقاف العملية' };
                }
                
                const confirmModal = this.findConfirmationModal();
                if (confirmModal) {
                    this.debugLog('📋 معالجة نافذة التأكيد');
                    
                    // فحص الإيقاف قبل التأكيد
                    if (!this.isRunning || this.isPaused) {
                        this.debugLog('🛑 تم إيقاف العملية قبل التأكيد');
                        return { success: false, reason: 'تم إيقاف العملية' };
                    }
                    
                    const confirmButton = this.findButtonInModal(confirmModal, ['تقديم', 'تأكيد']);
                    if (confirmButton) {
                        await this.clickElementBasic(confirmButton);
                        await this.wait(5000);
                    }
                }
                
                // فحص الإيقاف قبل فحص النتيجة
                if (!this.isRunning || this.isPaused) {
                    this.debugLog('🛑 تم إيقاف العملية قبل فحص النتيجة');
                    return { success: false, reason: 'تم إيقاف العملية' };
                }
                
                const result = this.checkApplicationResult();
                return result;
                
            } catch (error) {
                this.debugLog('❌ خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        findSubmitButton() {
            this.debugLog('🔍 البحث عن زر التقديم');
            
            const allButtons = document.querySelectorAll('button, input[type="submit"]');
            
            for (const button of allButtons) {
                const text = button.textContent?.trim() || button.value?.trim() || '';
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0;
                
                if (isVisible && (text === 'تقديم' || text === 'قدم الآن' || text === 'Apply')) {
                    this.debugLog(`✅ وجد زر التقديم: "${text}"`);
                    return button;
                }
            }
            
            this.debugLog('❌ لم يتم العثور على زر التقديم');
            return null;
        }

        findConfirmationModal() {
            this.debugLog('🔍 البحث عن نافذة التأكيد');
            
            const selectors = ['[role="dialog"]', '.modal', '[class*="modal"]'];
            
            for (const selector of selectors) {
                const dialogs = document.querySelectorAll(selector);
                
                for (const dialog of dialogs) {
                    if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                        const text = dialog.textContent || '';
                        if (text.includes('هل أنت متأكد') || 
                            text.includes('تأكيد') || 
                            text.includes('متأكد من التقديم')) {
                            this.debugLog('✅ وجد نافذة التأكيد');
                            return dialog;
                        }
                    }
                }
            }
            
            return null;
        }

        findButtonInModal(modal, buttonTexts) {
            const buttons = modal.querySelectorAll('button');
            
            for (const button of buttons) {
                const text = button.textContent?.trim() || '';
                if (buttonTexts.some(btnText => text.includes(btnText))) {
                    return button;
                }
            }
            
            return null;
        }

        checkApplicationResult() {
            this.debugLog('🔍 فحص نتيجة التقديم');
            
            const pageText = document.body.textContent;
            
            const successIndicators = [
                'تم التقديم بنجاح',
                'نجح التقديم',
                'تم بنجاح'
            ];
            
            for (const indicator of successIndicators) {
                if (pageText.includes(indicator)) {
                    this.debugLog(`✅ تم التقديم بنجاح: ${indicator}`);
                    return { success: true, type: 'success' };
                }
            }
            
            const rejectionIndicators = [
                'عذراً',
                'لا يمكنك التقديم',
                'غير مؤهل',
                'لا يطابق'
            ];
            
            for (const indicator of rejectionIndicators) {
                if (pageText.includes(indicator)) {
                    const reason = this.extractRejectionReason(pageText);
                    this.debugLog(`❌ تم رفض التقديم: ${reason}`);
                    return { success: false, type: 'rejection', reason: reason };
                }
            }
            
            this.debugLog('⚠️ نتيجة غير واضحة، اعتبار كنجاح');
            return { success: true, type: 'unknown' };
        }

        extractRejectionReason(text) {
            const detailedReasons = [
                'الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب',
                'لا يطابق شرط الخبرة المطلوبة',
                'لا يطابق شرط العمر المطلوب',
                'لا يطابق شرط الجنس المطلوب',
                'انتهت فترة التقديم'
            ];
            
            for (const reason of detailedReasons) {
                if (text.includes(reason)) {
                    return reason;
                }
            }
            
            return 'سبب غير محدد';
        }

        extractCurrentJobTitle() {
            const titleSelectors = ['span.heading5', '.heading5', 'h1', 'h2'];
            
            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element.textContent.trim();
                }
            }
            
            return 'وظيفة غير محددة';
        }

        // ===============================
        // دوال الانتظار والتنقل
        // ===============================

        async waitForJobsToLoad() {
            this.debugLog('🔍 انتظار تحميل قائمة الوظائف');
            
            let attempts = 0;
            const maxAttempts = 30;
            
            while (attempts < maxAttempts) {
                const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
                const hasContent = document.body.textContent.length > 5000;
                const pageReady = document.readyState === 'complete';
                
                if (jobLinks.length > 0 && hasContent && pageReady) {
                    this.debugLog(`✅ تحميل قائمة الوظائف: وجد ${jobLinks.length} وظيفة`);
                    return;
                }
                
                attempts++;
                await this.wait(1000);
            }
            
            throw new Error('فشل في تحميل قائمة الوظائف');
        }

        async waitForJobDetailsToLoad() {
            this.debugLog('📄 انتظار تحميل تفاصيل الوظيفة');
            
            let attempts = 0;
            const maxAttempts = 20;
            
            while (attempts < maxAttempts) {
                const hasJobContent = document.body.textContent.includes('الوصف الوظيفي') ||
                                   document.body.textContent.includes('نوع العمل');
                const contentLength = document.body.textContent.length;
                const pageReady = document.readyState === 'complete';
                
                if (hasJobContent && contentLength > 2000 && pageReady) {
                    this.debugLog('✅ تحميل تفاصيل الوظيفة: تم بنجاح');
                    return;
                }
                
                attempts++;
                await this.wait(1000);
            }
            
            throw new Error('فشل في تحميل تفاصيل الوظيفة');
        }

        async waitForNavigation(initialUrl) {
            this.debugLog('🔄 انتظار التنقل');
            
            let attempts = 0;
            const maxAttempts = 15;
            
            while (attempts < maxAttempts) {
                if (window.location.href !== initialUrl) {
                    this.debugLog('✅ تم التنقل بنجاح');
                    await this.wait(2000);
                    return;
                }
                
                attempts++;
                await this.wait(1000);
            }
            
            throw new Error('فشل في التنقل');
        }

        async clickElementBasic(element) {
            if (!element) {
                throw new Error('العنصر غير موجود');
            }

            this.debugLog(`🎯 النقر على: ${element.tagName}`);
            
            // التحقق المحسن من الرؤية
            const rect = element.getBoundingClientRect();
            const isActuallyVisible = rect.width > 0 && rect.height > 0 && 
                                    element.offsetWidth > 0 && element.offsetHeight > 0 &&
                                    window.getComputedStyle(element).visibility !== 'hidden' &&
                                    window.getComputedStyle(element).display !== 'none';

            if (!isActuallyVisible) {
                this.debugLog('⚠️ العنصر غير مرئي، محاولة إعادة العثور عليه...');
                
                // إذا كان رابط وظيفة، حاول إعادة العثور عليه
                if (element.tagName === 'A' && element.href && element.href.includes('JobDetails')) {
                    const jobTitle = element.textContent?.trim() || 'غير محدد';
                    this.debugLog(`🔍 البحث عن رابط للوظيفة: ${jobTitle}`);
                    
                    // البحث عن نفس الرابط في الصفحة
                    const allJobLinks = document.querySelectorAll('a[href*="JobDetails"]');
                    for (const link of allJobLinks) {
                        if (link.textContent?.trim() === jobTitle || link.href === element.href) {
                            const linkRect = link.getBoundingClientRect();
                            if (linkRect.width > 0 && linkRect.height > 0) {
                                this.debugLog('✅ وجد رابط بديل مرئي');
                                element = link;
                                break;
                            }
                        }
                    }
                }
                
                // إذا ما زال غير مرئي، رمي خطأ
                const finalRect = element.getBoundingClientRect();
                if (finalRect.width === 0 || finalRect.height === 0) {
                    throw new Error('العنصر غير مرئي');
                }
            }

            // التمرير للعنصر مع انتظار إضافي
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
            await this.wait(1500); // انتظار أطول للتمرير

            // النقر مع معالجة محسنة
            try {
                element.click();
                this.debugLog('✅ تم النقر بنجاح');
                await this.wait(2000);
            } catch (error) {
                this.debugLog('❌ فشل النقر العادي، محاولة بديلة...');
                
                // محاولة بديلة
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    button: 0
                });
                element.dispatchEvent(event);
                this.debugLog('✅ نجح النقر البديل');
                await this.wait(2000);
            }
        }

        async handlePopups() {
            this.debugLog('🔍 فحص النوافذ المنبثقة');
            
            const popups = document.querySelectorAll('[role="dialog"], .modal');
            
            for (const popup of popups) {
                if (popup.offsetWidth > 0 && popup.offsetHeight > 0) {
                    this.debugLog('💬 تم العثور على نافذة منبثقة');
                    
                    const buttons = popup.querySelectorAll('button, a');
                    for (const btn of buttons) {
                        const btnText = btn.textContent.trim();
                        if (btnText.includes('موافق') || btnText.includes('إغلاق') || btnText.includes('×')) {
                            this.debugLog('🚫 إغلاق النافذة المنبثقة');
                            await this.clickElementBasic(btn);
                            return;
                        }
                    }
                }
            }
        }

        async checkIfAlreadyAppliedInDetails() {
            this.debugLog('🔍 فحص حالة التقديم في التفاصيل');
            
            const pageText = document.body.textContent || '';
            const appliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم على هذه الوظيفة',
                'طلب مقدم',
                'تم التقدم'
            ];
            
            for (const indicator of appliedIndicators) {
                if (pageText.includes(indicator)) {
                    this.debugLog(`✅ وجد مؤشر التقديم المسبق: ${indicator}`);
                    return true;
                }
            }
            
            return false;
        }

        async goBackToJobListSafe() {
            this.debugLog('🔙 العودة الآمنة لقائمة الوظائف');
            
            // التحقق من نوع الصفحة الحالية
            const currentUrl = window.location.href;
            
            // إذا كنا بالفعل في قائمة الوظائف، لا نفعل شيئاً
            if (currentUrl.includes('ExploreJobs') || currentUrl.includes('JobTab=1')) {
                this.debugLog('✅ نحن بالفعل في قائمة الوظائف - لا حاجة للرجوع');
                return;
            }
            
            // إذا كنا في صفحة تفاصيل الوظيفة، نرجع
            if (currentUrl.includes('JobDetails')) {
                this.debugLog('📄 في صفحة تفاصيل - العودة للقائمة');
                window.history.back();
                await this.wait(3000);
                await this.waitForJobsToLoad();
            } else {
                // في صفحة غير متوقعة، انتقال مباشر
                this.debugLog('⚠️ صفحة غير متوقعة - انتقال مباشر لقائمة الوظائف');
                window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                await this.wait(5000);
                await this.waitForJobsToLoad();
            }
        }

        async goBackToJobList() {
            this.debugLog('🔙 العودة لقائمة الوظائف');
            
            window.history.back();
            await this.wait(3000);
            await this.waitForJobsToLoad();
        }

        async goToNextPage() {
            this.debugLog('🔍 البحث عن الصفحة التالية');
            
            const nextButton = document.querySelector('button[aria-label*="go to next page"]:not([disabled])');
            
            if (nextButton) {
                this.debugLog('➡️ الانتقال للصفحة التالية');
                this.currentPage++;
                this.currentJobIndex = 0;
                
                await this.clickElementBasic(nextButton);
                await this.wait(5000);
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