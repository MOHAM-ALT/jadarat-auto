// جدارات أوتو - Content Script المُصحح والمُحسن نهائياً
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى الذكي المحسن والمصحح');

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

            // 🆕 نظام متقدم لتتبع الوظائف
            this.visitedJobs = new Set();  // قائمة الوظائف المزارة
            this.rejectedJobs = new Set(); // قائمة الوظائف المرفوضة
            
            this.loadVisitedJobs();
            this.loadRejectedJobs();

            this.currentPage = 1;
            this.currentJobIndex = 0;
            this.totalJobs = 0;
            this.resumeData = null;
            
            // إحصائيات التشخيص
            this.debugStats = {
                totalWaitTime: 0,
                successfulWaits: 0,
                failedWaits: 0,
                clickAttempts: 0,
                successfulClicks: 0
            };
                
            this.initializeListeners();
            this.checkPageType();
            this.addVisualIndicator();
            
            // إضافة أدوات التشخيص للـ window
            window.jadaratAutoDebug = {
                stats: this.debugStats,
                getCurrentState: () => ({
                    isRunning: this.isRunning,
                    isPaused: this.isPaused,
                    pageType: this.pageType,
                    currentPage: this.currentPage,
                    currentJobIndex: this.currentJobIndex,
                    stats: this.stats
                }),
                logs: []
            };
            
            this.debugLog('✅ جدارات أوتو: تم التهيئة بنجاح - النسخة المحسنة والمصححة');
        }

        // ===============================
        // 🆕 نظام إدارة الوظائف المزارة
        // ===============================

        async loadVisitedJobs() {
            try {
                const result = await chrome.storage.local.get(['visitedJobs']);
                if (result.visitedJobs && Array.isArray(result.visitedJobs)) {
                    this.visitedJobs = new Set(result.visitedJobs);
                    this.debugLog(`🧠 تم تحميل ${this.visitedJobs.size} وظيفة مزارة من الذاكرة`);
                } else {
                    this.debugLog('🧠 لا توجد وظائف مزارة محفوظة');
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

        markJobAsVisited(jobCard) {
            try {
                const jobIds = this.generateJobIdentifiers(jobCard);
                const jobData = this.extractJobDataFromHTML(jobCard);
                
                this.debugLog(`📝 تسجيل وظيفة كمزارة:`);
                this.debugLog(`   📋 العنوان: ${jobData.title}`);
                this.debugLog(`   🏢 الشركة: ${jobData.company}`);
                this.debugLog(`   🏙️ المدينة: ${jobData.city || 'غير محدد'}`);
                
                // حفظ جميع المعرفات
                let savedCount = 0;
                for (const id of jobIds) {
                    if (!this.visitedJobs.has(id)) {
                        this.visitedJobs.add(id);
                        savedCount++;
                    }
                }
                
                this.debugLog(`🔑 تم حفظ ${savedCount} معرف جديد من أصل ${jobIds.length}`);
                this.debugLog(`📊 إجمالي الوظائف المزارة: ${this.visitedJobs.size}`);
                
                // حفظ فوري في التخزين
                this.saveVisitedJobs();
                
            } catch (error) {
                this.debugLog('❌ خطأ في تسجيل الوظيفة كمزارة:', error);
                
                // حفظ طوارئ بمعرف بسيط
                const emergencyId = `emergency_${jobCard.title}_${Date.now()}`;
                this.visitedJobs.add(emergencyId);
                this.saveVisitedJobs();
                this.debugLog(`🚨 تم حفظ معرف طوارئ: ${emergencyId}`);
            }
        }

        isJobVisited(jobCard) {
            try {
                const jobIds = this.generateJobIdentifiers(jobCard);
                const jobData = this.extractJobDataFromHTML(jobCard);
                
                this.debugLog(`🔍 فحص زيارة الوظيفة: ${jobData.title} | ${jobData.company} | ${jobData.city}`);
                
                for (let i = 0; i < jobIds.length; i++) {
                    const id = jobIds[i];
                    if (this.visitedJobs.has(id)) {
                        this.debugLog(`🚫 وظيفة مزارة سابقاً!`);
                        this.debugLog(`   📝 العنوان: ${jobData.title}`);
                        this.debugLog(`   🏢 الشركة: ${jobData.company}`);
                        this.debugLog(`   🔑 المعرف المطابق: ${id.substring(0, 40)}...`);
                        return true;
                    }
                }
                
                this.debugLog(`✅ وظيفة جديدة غير مزارة: ${jobData.title} | ${jobData.company}`);
                return false;
                
            } catch (error) {
                this.debugLog('❌ خطأ في فحص زيارة الوظيفة:', error);
                return false;
            }
        }

        generateJobIdentifiers(jobCard) {
            const identifiers = [];
            
            try {
                // استخراج البيانات بالطريقة الصحيحة
                const jobData = this.extractJobDataFromHTML(jobCard);
                
                if (!jobData) {
                    this.debugLog('❌ فشل في استخراج البيانات، إنشاء معرف طوارئ');
                    const emergencyId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    return [emergencyId];
                }
                
                this.debugLog(`🔑 توليد معرفات للوظيفة:`, {
                    title: jobData.title,
                    company: jobData.company,
                    city: jobData.city,
                    matchingScore: jobData.matchingScore
                });

                // تنظيف النصوص للاستخدام في المعرفات
                const cleanTitle = this.cleanTextForId(jobData.title);
                const cleanCompany = this.cleanTextForId(jobData.company);
                const cleanCity = this.cleanTextForId(jobData.city);

                // المعرف الأساسي: شركة + وظيفة + مدينة (الأقوى والأوثق)
                if (cleanCompany && cleanTitle && cleanCity && 
                    cleanCompany !== 'شركة_غير_محددة' && cleanCity !== 'unknown') {
                    const primaryId = `${cleanCompany}_${cleanTitle}_${cleanCity}`;
                    identifiers.push(primaryId);
                    this.debugLog(`🔑 معرف أساسي: ${primaryId}`);
                }

                // المعرف الثانوي: شركة + وظيفة (بدون مدينة)
                if (cleanCompany && cleanTitle && cleanCompany !== 'شركة_غير_محددة') {
                    const secondaryId = `${cleanCompany}_${cleanTitle}`;
                    identifiers.push(secondaryId);
                    this.debugLog(`🔑 معرف ثانوي: ${secondaryId}`);
                }

                // المعرف الاحتياطي: عنوان الوظيفة + نسبة التوافق
                if (cleanTitle && jobData.matchingScore) {
                    const cleanScore = jobData.matchingScore.replace(/[^\d]/g, '');
                    if (cleanScore) {
                        const backupId = `title_${cleanTitle}_score_${cleanScore}`;
                        identifiers.push(backupId);
                        this.debugLog(`🔑 معرف احتياطي: ${backupId}`);
                    }
                }

                // معرف بتاريخ النشر (فريد جداً)
                if (cleanCompany && cleanTitle && jobData.publishDate && 
                    cleanCompany !== 'شركة_غير_محددة') {
                    const cleanDate = jobData.publishDate.replace(/[^\d]/g, '');
                    const dateId = `${cleanCompany}_${cleanTitle}_date_${cleanDate}`;
                    identifiers.push(dateId);
                    this.debugLog(`🔑 معرف بالتاريخ: ${dateId}`);
                }

                // معرف عنوان الوظيفة فقط (طوارئ)
                if (cleanTitle) {
                    identifiers.push(`title_only_${cleanTitle}`);
                    identifiers.push(cleanTitle);
                }

                // معرف الشركة فقط (للشركات الصغيرة)
                if (cleanCompany && cleanCompany !== 'شركة_غير_محددة') {
                    identifiers.push(`company_only_${cleanCompany}`);
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

        // ===============================
        // نظام إدارة الوظائف المرفوضة
        // ===============================

        async loadRejectedJobs() {
            try {
                const result = await chrome.storage.local.get(['rejectedJobs']);
                if (result.rejectedJobs && Array.isArray(result.rejectedJobs)) {
                    this.rejectedJobs = new Set(result.rejectedJobs);
                    this.debugLog(`🧠 تم تحميل ${this.rejectedJobs.size} وظيفة مرفوضة من الذاكرة`);
                } else {
                    this.debugLog('🧠 لا توجد وظائف مرفوضة محفوظة');
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
        // دوال مساعدة مفقودة
        // ===============================

        cleanTextForId(text) {
            if (!text || typeof text !== 'string') return 'unknown';
            return text
                .replace(/[^\w\u0600-\u06FF]/g, '')
                .toLowerCase()
                .trim()
                .substring(0, 50);
        }

        extractCompanyName(jobCard) {
            try {
                const container = jobCard.container || jobCard.link?.closest('[data-container]');
                if (!container) {
                    this.debugLog('⚠️ لا يوجد container للوظيفة');
                    return 'شركة غير محددة';
                }

                // الطريقة الأساسية: البحث عن a[data-link] span[data-expression]
                const companyElement = container.querySelector('a[data-link] span[data-expression]');
                if (companyElement && companyElement.textContent?.trim()) {
                    const companyText = companyElement.textContent.trim();
                    
                    // تأكد أن النص ليس عنوان الوظيفة نفسه
                    if (companyText !== jobCard.title && companyText.length > 2 && companyText.length < 100) {
                        this.debugLog(`🏢 اسم الشركة (الطريقة الأساسية): ${companyText}`);
                        return companyText;
                    }
                }

                // الطريقة البديلة: البحث في العناصر المرتبة
                const allSpans = Array.from(container.querySelectorAll('span[data-expression]'));
                
                // اول span عادة يكون اسم الشركة
                if (allSpans.length > 0) {
                    const firstSpan = allSpans[0];
                    const text = firstSpan.textContent?.trim();
                    
                    if (text && text !== jobCard.title && 
                        !text.includes('%') && 
                        !text.includes('المدينة') && 
                        !text.includes('تاريخ') &&
                        text.length > 2 && text.length < 100) {
                        
                        this.debugLog(`🏢 اسم الشركة (أول span): ${text}`);
                        return text;
                    }
                }

                // البحث في الروابط القريبة
                const nearbyLinks = container.querySelectorAll('a[data-link]');
                for (const link of nearbyLinks) {
                    const linkText = link.textContent?.trim();
                    if (linkText && linkText !== jobCard.title && 
                        !linkText.includes('JobDetails') &&
                        linkText.length > 2 && linkText.length < 100) {
                        
                        this.debugLog(`🏢 اسم الشركة (من الرابط): ${linkText}`);
                        return linkText;
                    }
                }

                this.debugLog('⚠️ لم يتم العثور على اسم الشركة');
                return 'شركة غير محددة';
                
            } catch (error) {
                this.debugLog('❌ خطأ في استخراج اسم الشركة:', error);
                return 'شركة غير محددة';
            }
        }

        // 📊 استخراج البيانات الحقيقية الثابتة من HTML (حسب كود جدارات الفعلي)
        extractJobDataFromHTML(jobCard) {
            try {
                this.debugLog(`📊 استخراج البيانات الحقيقية للوظيفة: ${jobCard.title}`);
                
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

                try {
                    // 1. استخراج اسم الشركة الصحيح
                    const companyElement = container.querySelector('a[data-link] span[data-expression]');
                    if (companyElement) {
                        jobData.company = companyElement.textContent.trim();
                        this.debugLog(`🏢 اسم الشركة: ${jobData.company}`);
                    }
                    
                    // 2. استخراج المسمى الوظيفي (تحديث)
                    const jobTitleElement = container.querySelector('span.heading4, .heading4');
                    if (jobTitleElement) {
                        jobData.title = jobTitleElement.textContent.trim();
                        this.debugLog(`💼 المسمى الوظيفي: ${jobData.title}`);
                    }
                    
                    // 3. استخراج نسبة التوافق
                    const matchElement = container.querySelector('.matching_score');
                    if (matchElement) {
                        jobData.matchingScore = matchElement.textContent.trim();
                        this.debugLog(`📊 نسبة التوافق: ${jobData.matchingScore}`);
                    } else {
                        // البحث البديل عن النسبة المئوية
                        const allSpans = container.querySelectorAll('span[data-expression]');
                        for (const span of allSpans) {
                            const text = span.textContent?.trim();
                            if (text && text.includes('%')) {
                                jobData.matchingScore = text;
                                this.debugLog(`📊 نسبة التوافق (بديل): ${text}`);
                                break;
                            }
                        }
                    }
                    
                    // 4. استخراج المدينة (الطريقة المحسنة)
                    const cityElements = container.querySelectorAll('span[data-expression]');
                    for (const element of cityElements) {
                        const text = element.textContent.trim();
                        // البحث عن النص بالقرب من "المدينة"
                        const parentContainer = element.closest('[data-container]');
                        if (parentContainer && parentContainer.textContent.includes('المدينة')) {
                            // تأكد أن النص ليس نسبة مئوية أو تاريخ
                            if (!text.includes('%') && !text.match(/\d{2}\/\d{2}\/\d{4}/) && text.length < 30) {
                                jobData.city = text;
                                this.debugLog(`🏙️ المدينة: ${jobData.city}`);
                                break;
                            }
                        }
                    }
                    
                    // 5. استخراج تاريخ النشر
                    const dateElements = container.querySelectorAll('span[data-expression]');
                    for (const element of dateElements) {
                        const text = element.textContent.trim();
                        // البحث عن تاريخ (نمط: dd/mm/yyyy)
                        if (/\d{2}\/\d{2}\/\d{4}/.test(text)) {
                            const parentContainer = element.closest('[data-container]');
                            if (parentContainer && parentContainer.textContent.includes('تاريخ النشر')) {
                                jobData.publishDate = text;
                                this.debugLog(`📅 تاريخ النشر: ${jobData.publishDate}`);
                                break;
                            }
                        }
                    }
                    
                    // 6. استخراج عدد الوظائف المتاحة
                    const availableJobElements = container.querySelectorAll('span[data-expression]');
                    for (const element of availableJobElements) {
                        const text = element.textContent.trim();
                        const parentContainer = element.closest('[data-container]');
                        if (parentContainer && parentContainer.textContent.includes('الوظائف المتاحة') && /^\d+$/.test(text)) {
                            jobData.availableJobs = text;
                            this.debugLog(`📈 الوظائف المتاحة: ${jobData.availableJobs}`);
                            break;
                        }
                    }
                    
                } catch (error) {
                    this.debugLog('❌ خطأ في استخراج البيانات:', error);
                }

                // التأكد من وجود البيانات الأساسية
                if (!jobData.company) {
                    this.debugLog('⚠️ لم يتم استخراج اسم الشركة، استخدام الطريقة البديلة...');
                    jobData.company = this.extractCompanyName(jobCard);
                }

                this.debugLog(`✅ البيانات المستخرجة:`, jobData);
                return jobData;
                
            } catch (error) {
                this.debugLog('❌ خطأ عام في استخراج البيانات:', error);
                return this.getMinimalJobData(jobCard);
            }
        }

        getMinimalJobData(jobCard) {
            return {
                title: jobCard.title || 'وظيفة غير محددة',
                company: 'شركة غير محددة',
                city: null,
                matchingScore: null,
                publishDate: null
            };
        }

        getJobUniqueId(jobLink) {
            try {
                const url = jobLink.href || jobLink;
                
                const paramMatch = url.match(/Param=([^&]+)/);
                if (paramMatch) {
                    return paramMatch[1];
                }
                
                const jobDetailsMatch = url.match(/JobDetails.*?([A-Za-z0-9]{20,})/);
                if (jobDetailsMatch) {
                    return jobDetailsMatch[1];
                }
                
                const longIdMatch = url.match(/([A-Za-z0-9]{15,})/);
                if (longIdMatch) {
                    return longIdMatch[1];
                }
                
                return null;
                
            } catch (error) {
                this.debugLog(`❌ خطأ في استخراج المعرف:`, error);
                return null;
            }
        }

        isJobRejected(jobCard) {
            try {
                const jobIds = this.generateJobIdentifiers(jobCard);
                
                for (const id of jobIds) {
                    if (this.rejectedJobs.has(id)) {
                        this.debugLog(`🚫 وظيفة مرفوضة سابقاً: ${jobCard.title}`);
                        return true;
                    }
                }
                
                return false;
                
            } catch (error) {
                this.debugLog('❌ خطأ في فحص رفض الوظيفة:', error);
                return false;
            }
        }

        // ===============================
        // نظام العثور على الوظائف المحسن
        // ===============================

        async getJobCards() {
            this.debugLog('🔍 البحث عن بطاقات الوظائف مع فلترة محسنة ضد التكرار');
            
            const jobCards = [];
            
            const selectors = [
                'a[data-link][href*="/Jadarat/JobDetails"]',
                'a[href*="JobDetails"]',
                'a[href*="Param="]'
            ];
            
            let jobLinks = [];
            for (const selector of selectors) {
                jobLinks = document.querySelectorAll(selector);
                if (jobLinks.length > 0) {
                    this.debugLog(`🔗 تم العثور على ${jobLinks.length} رابط باستخدام: ${selector}`);
                    break;
                }
            }
            
            let skippedApplied = 0;
            let skippedVisited = 0;
            let skippedRejected = 0;
            let skippedReview = 0;
            
            for (const link of jobLinks) {
                const jobTitle = this.getJobTitle(link);
                const jobContainer = this.findJobContainer(link);
                
                if (jobContainer) {
                    const jobCard = {
                        link: link,
                        container: jobContainer,
                        title: jobTitle
                    };
                    
                    // فحص العلامة المرئية
                    const hasTickIcon = jobContainer.querySelector('img[src*="tickcircle.svg"]');
                    const hasAppliedText = jobContainer.textContent.includes('تم التقدم');
                    
                    if (hasTickIcon || hasAppliedText) {
                        skippedApplied++;
                        this.debugLog(`⏭️ تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                        continue;
                    }
                    
                    // فحص الوظائف المزارة سابقاً
                    if (this.isJobVisited(jobCard)) {
                        skippedVisited++;
                        this.debugLog(`⏭️ تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                        continue;
                    }
                    
                    // فحص قائمة المرفوضة
                    if (this.isJobRejected(jobCard)) {
                        skippedRejected++;
                        this.debugLog(`⏭️ تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                        continue;
                    }
                    
                    // فحص "استعراض طلب التقديم"
                    const hasReviewText = jobContainer.textContent.includes('استعراض طلب التقديم') ||
                                         jobContainer.textContent.includes('استعراض الطلب');
                    
                    if (hasReviewText) {
                        skippedReview++;
                        this.debugLog(`⏭️ تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                        continue;
                    }
                    
                    // وظيفة متاحة للمعالجة
                    jobCards.push(jobCard);
                    this.debugLog(`✅ وظيفة متاحة: ${jobTitle}`);
                }
            }

            this.debugLog(`📊 المجموع: ${jobCards.length} وظيفة متاحة للتقديم`);
            return jobCards;
        }

        getJobTitle(link) {
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
            
            return 'وظيفة غير محددة';
        }

        findJobContainer(link) {
            let container = link;
            
            for (let i = 0; i < 8; i++) {
                if (!container.parentElement) break;
                
                container = container.parentElement;
                
                const hasJobInfo = container.textContent.includes('المدينة') || 
                                 container.textContent.includes('تاريخ النشر') ||
                                 container.textContent.includes('الوظائف المتاحة');
                
                if (hasJobInfo) {
                    return container;
                }
            }
            
            return link.closest('[data-container]') || link.parentElement;
        }

        // ===============================
        // باقي الدوال الأساسية
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
                        
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                this.debugLog('❌ خطأ في معالجة الرسالة:', error);
                sendResponse({ success: false, error: error.message });
            }
        }

        checkPageType() {
            // تحديد نوع الصفحة بسيط
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

        async startSmartAutomation() {
            this.debugLog('🧠 بدء الأتمتة الذكية');
            this.isRunning = true;
            
            // تنفيذ منطق الأتمتة هنا
            // ... باقي الكود
        }

        stopAutomation() {
            this.debugLog('⏹️ إيقاف نهائي');
            this.isRunning = false;
            this.isPaused = false;
        }

        sendMessage(action, data = {}) {
            try {
                const message = { action, ...data };
                chrome.runtime.sendMessage(message);
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
}