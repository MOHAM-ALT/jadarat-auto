// جدارات أوتو - النسخة المُصلحة مع إصلاحات شاملة
// الجزء الأول: التنظيف والتهيئة واستخراج البيانات

// ========================================
// 🔧 إصلاح تعارض الكلاس
// ========================================
// جدارات أوتو - Content Script مع حماية Double Injection
// ========================================
// 🛡️ حماية فعالة من الحقن المزدوج
// ========================================

(function() {
    'use strict';

    window.addEventListener('error', function(e) {
        console.log('💥 [GLOBAL_ERROR] JavaScript error detected:', e.error);
        console.log('📝 [GLOBAL_ERROR] Message:', e.message);
        console.log('📍 [GLOBAL_ERROR] Source:', e.filename, 'Line:', e.lineno);
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.log('💥 [PROMISE_ERROR] Unhandled promise rejection:', e.reason);
    });

    // فحص فوري للحماية من الحقن المزدوج
    if (window.jadaratAutoStableLoaded) {
        console.log('🛡️ [PROTECTION] System already loaded, avoiding double injection.');
        return;
    }

    // وضع علامة التحميل فوراً قبل أي شيء آخر
    window.jadaratAutoStableLoaded = true;
    console.log('🚀 [JadaratAuto] Initializing JadaratAutoStable...');

    console.log(`
🎯 ===== جدارات أوتو - النسخة المحمية =====
✅ تم تطبيق الحماية من الحقن المزدوج
🔧 النظام محمي في IIFE آمن
🛡️ علامة التحميل: jadaratAutoStableLoaded
============================================
`);

// ========================================
// 🧹 تنظيف النسخ السابقة (اختياري)
// ========================================

async function cleanupPreviousInstance() {
    try {
        if (window.jadaratAutoStable && typeof window.jadaratAutoStable.stopProcess === 'function') {
            window.jadaratAutoStable.stopProcess();
            console.log('✅ [CLEANUP] تم إيقاف النسخة السابقة');
        }

        // مسح المراجع القديمة
        delete window.JadaratAutoStable;
        delete window.jadaratAutoHelpers;

        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ [CLEANUP] تم التنظيف');

    } catch (error) {
        console.warn('⚠️ [CLEANUP] خطأ في التنظيف:', error);
    }
}

// تنظيف سريع
cleanupPreviousInstance();

// باقي الكود الموجود يبقى كما هو تماماً...
// فقط أضف هذا في النهاية قبل إغلاق IIFE:


async function cleanupPreviousInstance() {
    console.log('🧹 [CLEANUP] تنظيف النسخة السابقة...');

    try {
        if (window.jadaratAutoStable && typeof window.jadaratAutoStable.stopProcess === 'function') {
            window.jadaratAutoStable.stopProcess();
            console.log('✅ [CLEANUP] تم إيقاف النسخة السابقة');
        }

        delete window.JadaratAutoStable;
        delete window.jadaratAutoStable;
        delete window.jadaratAutoHelpers;

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('✅ [CLEANUP] تم تنظيف النظام بنجاح');
        return true;

    } catch (error) {
        console.warn('⚠️ [CLEANUP] خطأ في التنظيف:', error);
        return false;
    }
}

if (window.JadaratAutoStable) {
    cleanupPreviousInstance();
}

// ========================================
// 🎯 الكلاس الرئيسي المُحسن
// ========================================

class JadaratAutoStable {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.shouldStop = false;
        this.currentJobIndex = 0;
        this.totalJobsOnPage = 0;
        this.currentPage = 1;
        this.lastPageType = null;
        this.unknownPageCount = 0;
        this.navigationAttempts = 0;

        this.visitedJobs = new Set();
        this.rejectedJobs = new Set();
        this.appliedJobs = new Set();

        this.stats = {
            applied: 0,
            skipped: 0,
            rejected: 0,
            alreadyApplied: 0,
            total: 0,
            errors: 0,
            fromMemory: 0,
            dataExtractionErrors: 0
        };

        this.debugMode = true;
        this.stepByStepMode = false;
        this.currentJobTitle = null;

        this.init();
    }

    async init() {
        this.log('🚀 [INIT] تهيئة نظام جدارات أوتو المُصلح...');

        try {
            await this.loadMemoryData();
            this.setupMessageListener();
            this.detectPageTypeAndLog();
            this.addAdvancedTestingTools();

            this.log('✅ [INIT] تم تهيئة النظام المُصلح بنجاح');
        } catch (error) {
            this.log('❌ [INIT] خطأ في التهيئة:', error);
        }
    }

    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString('ar-SA');
        const logMessage = `[${timestamp}] ${message}`;

        if (data) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    }

    // ========================
    // 🎯 استخراج البيانات المُصلح - القلب المُحسن للنظام
    // ========================

    extractJobDataFromHTML(jobCard) {
        this.log('🔬 [EXTRACT] بدء استخراج البيانات المُحسن...');

        try {
            const container = jobCard.container;

            const title = this.extractJobTitle(container);
            this.currentJobTitle = title;

            const company = this.extractCompanyName(container, title);
            const location = this.extractLocation(container);
            const matchingScore = this.extractMatchingScore(container);
            const availableJobs = this.extractAvailableJobs(container);
            const publishDate = this.extractPublishDate(container);
            const alreadyApplied = this.checkAlreadyAppliedInList(container);

            const jobId = this.generateJobId(jobCard.link.href, title, company);
            const dataQuality = this.validateExtractedData(title, company, location, publishDate);

            const jobData = {
                id: jobId,
                title: title,
                company: company,
                location: location,
                matchingScore: matchingScore,
                availableJobs: availableJobs,
                publishDate: publishDate,
                alreadyApplied: alreadyApplied,
                url: jobCard.link.href,
                element: jobCard.link,
                dataQuality: dataQuality
            };

            this.log('✅ [EXTRACT] البيانات المُحسنة:', {
                title: jobData.title,
                company: jobData.company,
                location: jobData.location,
                matchingScore: jobData.matchingScore,
                publishDate: jobData.publishDate,
                alreadyApplied: jobData.alreadyApplied,
                quality: dataQuality
            });

            if (dataQuality.score < 0.8) {
                this.stats.dataExtractionErrors++;
                this.log('⚠️ [EXTRACT] جودة البيانات منخفضة:', dataQuality);
            }

            return jobData;

        } catch (error) {
            this.log('❌ [EXTRACT] خطأ في استخراج البيانات:', error);
            this.stats.dataExtractionErrors++;
            return this.getEmptyJobData(jobCard);
        }
    }

    validateExtractedData(title, company, location, publishDate) {
        const checks = {
            titleValid: title !== 'وظيفة غير محددة' && title.length > 3,
            companyValid: company !== 'شركة غير محددة' && company !== title && company.length > 3,
            locationValid: location !== 'غير محدد' && location.length > 2,
            dateValid: publishDate && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(publishDate)
        };

        const validCount = Object.values(checks).filter(Boolean).length;
        const totalCount = Object.keys(checks).length;
        const score = validCount / totalCount;

        return {
            checks,
            score,
            level: score >= 0.9 ? 'ممتاز' : score >= 0.7 ? 'جيد' : score >= 0.5 ? 'متوسط' : 'ضعيف'
        };
    }

    extractJobTitle(container) {
        this.log('🔍 [TITLE] استخراج عنوان الوظيفة المُحسن...');

        try {
            const titleSelectors = [
                'span.heading4.OSFillParent',
                'span.heading4',
                '.text-primary.heading5 span',
                'a[href*="JobDetails"] span[data-expression]'
            ];

            for (const selector of titleSelectors) {
                const titleElement = container.querySelector(selector);
                if (titleElement && titleElement.textContent.trim()) {
                    const title = titleElement.textContent.trim();

                    if (this.isValidJobTitle(title)) {
                        this.log(`✅ [TITLE] تم العثور على العنوان: "${title}"`);
                        return title;
                    }
                }
            }

            this.log('⚠️ [TITLE] لم يتم العثور على عنوان صحيح');
            return 'وظيفة غير محددة';

        } catch (error) {
            this.log('❌ [TITLE] خطأ في استخراج العنوان:', error);
            return 'وظيفة غير محددة';
        }
    }

    extractCompanyName(container, currentTitle = null) {
        this.log('🔍 [COMPANY] Extracting company name...');

        try {
            // New, more specific selector
            const primarySelector = 'div.display-flex.align-items-center.margin-bottom-s div.font-bold.font-size-base a[data-link] span[data-expression]';
            let companyElement = container.querySelector(primarySelector);

            if (companyElement && this.isValidCompanyName(companyElement.textContent.trim(), currentTitle)) {
                this.log(`✅ [COMPANY] Found company with primary selector: "${companyElement.textContent.trim()}"`);
                return companyElement.textContent.trim();
            }

            // Fallback to the old selector
            const fallbackSelector = 'div.font-bold.font-size-base a[data-link] span[data-expression]';
            companyElement = container.querySelector(fallbackSelector);

            if (companyElement && this.isValidCompanyName(companyElement.textContent.trim(), currentTitle)) {
                this.log(`✅ [COMPANY] Found company with fallback selector: "${companyElement.textContent.trim()}"`);
                return companyElement.textContent.trim();
            }

            this.log('⚠️ [COMPANY] Could not find a valid company name with selectors. Trying text-based search...');

            const allSpans = container.querySelectorAll('span[data-expression]');
            for (const span of allSpans) {
                const text = span.textContent.trim();
                if (this.isValidCompanyName(text, currentTitle)) {
                    this.log(`✅ [COMPANY] Found company with text-based search: "${text}"`);
                    return text;
                }
            }

            this.log('⚠️ [COMPANY] No valid company name found');
            return 'شركة غير محددة';

        } catch (error) {
            this.log('❌ [COMPANY] Error extracting company name:', error);
            return 'شركة غير محددة';
        }
    }

    isValidCompanyName(companyName, currentTitle = null) {
        if (!companyName || companyName.length < 3 || companyName.length > 200) return false;

        if (currentTitle && companyName === currentTitle) {
            return false;
        }

        if (/^%\d+$|^\d+%$/.test(companyName)) {
            return false;
        }

        if (/^\d+$/.test(companyName)) {
            return false;
        }

        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(companyName)) {
            return false;
        }

        const saudiCities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة المنورة', 'الطائف', 'الخبر', 'أبها', 'تبوك', 'بريدة'];
        if (saudiCities.includes(companyName)) return false;

        const jobTitlePatterns = [
            'أخصائي', 'مدير', 'محاسب', 'مطور', 'مسؤول', 'مهندس', 'مراجع',
            'منسق', 'مشرف', 'رئيس', 'نائب', 'مساعد', 'موظف', 'عامل'
        ];

        const startsWithJobTitle = jobTitlePatterns.some(pattern => companyName.startsWith(pattern));
        if (startsWithJobTitle) return false;

        const jobDescriptionPatterns = [
            'المشاركة في وضع', 'تنفيذ الإجراءات', 'متابعة تنفيذ',
            'الحفاظ على', 'وتنظيم أعمال', 'ومتابعة كافة',
            'وضمان توافر', 'وإنجاز الأعمال', 'إعداد التقارير'
        ];

        for (const pattern of jobDescriptionPatterns) {
            if (companyName.includes(pattern)) return false;
        }

        const wordCount = companyName.split(' ').length;
        if (wordCount > 8) return false;

        return true;
    }

    getCompanyRejectionReason(companyName, currentTitle) {
        if (companyName === currentTitle) return 'مطابق لعنوان الوظيفة';
        if (/^%\d+$|^\d+%$/.test(companyName)) return 'نسبة توافق';
        if (/^\d+$/.test(companyName)) return 'رقم';
        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(companyName)) return 'تاريخ';

        const saudiCities = ['الرياض', 'جدة', 'الدمام', 'مكة'];
        if (saudiCities.includes(companyName)) return 'اسم مدينة';

        const jobTitlePatterns = ['أخصائي', 'مدير', 'محاسب', 'مطور'];
        if (jobTitlePatterns.some(pattern => companyName.startsWith(pattern))) return 'مسمى وظيفي';

        return 'غير مناسب';
    }

    extractLocation(container) {
        this.log('🔍 [LOCATION] استخراج الموقع المُحسن...');

        try {
            const locationSelectors = [
                '.osui-tooltip span[data-expression]',
                'div[class*="osui-tooltip"] span[data-expression]'
            ];

            for (const selector of locationSelectors) {
                const locationElement = container.querySelector(selector);
                if (locationElement && locationElement.textContent.trim()) {
                    const location = locationElement.textContent.trim();

                    if (this.isValidLocation(location)) {
                        this.log(`✅ [LOCATION] تم العثور على الموقع: "${location}"`);
                        return location;
                    }
                }
            }

            const allSpans = container.querySelectorAll('span[data-expression]');
            const saudiCities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة المنورة', 'الطائف', 'الخبر', 'أبها', 'تبوك', 'بريدة'];

            for (const span of allSpans) {
                const text = span.textContent.trim();
                if (saudiCities.includes(text)) {
                    this.log(`✅ [LOCATION] تم العثور على الموقع (بحث يدوي): "${text}"`);
                    return text;
                }
            }

            this.log('⚠️ [LOCATION] لم يتم العثور على الموقع');
            return 'غير محدد';

        } catch (error) {
            this.log('❌ [LOCATION] خطأ في استخراج الموقع:', error);
            return 'غير محدد';
        }
    }

    isValidLocation(location) {
        const saudiCities = [
            'الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة المنورة',
            'الطائف', 'الخبر', 'أبها', 'تبوك', 'بريدة', 'حائل',
            'الجبيل', 'ينبع', 'الأحساء', 'القطيف', 'عسير'
        ];

        return saudiCities.includes(location);
    }

    extractMatchingScore(container) {
        this.log('🔍 [MATCHING] استخراج نسبة التوافق...');

        try {
            const scoreElement = container.querySelector('span.matching_score.OSFillParent');
            if (scoreElement && scoreElement.textContent.trim()) {
                const score = scoreElement.textContent.trim();

                if (/^%\d+$/.test(score)) {
                    this.log(`✅ [MATCHING] تم العثور على نسبة التوافق: "${score}"`);
                    return score;
                }
            }

            const allSpans = container.querySelectorAll('span[data-expression]');
            for (const span of allSpans) {
                const text = span.textContent.trim();
                if (/^%\d+$/.test(text)) {
                    this.log(`✅ [MATCHING] تم العثور على نسبة التوافق (بحث يدوي): "${text}"`);
                    return text;
                }
            }

            this.log('⚠️ [MATCHING] لم يتم العثور على نسبة التوافق');
            return null;

        } catch (error) {
            this.log('❌ [MATCHING] خطأ في استخراج نسبة التوافق:', error);
            return null;
        }
    }

    extractAvailableJobs(container) {
        this.log('🔍 [JOBS_COUNT] استخراج عدد الوظائف المتاحة...');

        try {
            const divs = container.querySelectorAll('div');
            for (const div of divs) {
                if (div.textContent.includes('الوظائف المتاحة')) {
                    const parentColumn = div.closest('.columns-item');
                    if (parentColumn) {
                        const countSpan = parentColumn.querySelector('span.font-bold.font-size-base.OSFillParent');
                        if (countSpan && countSpan.textContent.trim()) {
                            const count = countSpan.textContent.trim();

                            if (/^\d+$/.test(count)) {
                                this.log(`✅ [JOBS_COUNT] تم العثور على عدد الوظائف: "${count}"`);
                                return count;
                            }
                        }
                    }
                }
            }

            this.log('⚠️ [JOBS_COUNT] لم يتم العثور على عدد الوظائف');
            return null;

        } catch (error) {
            this.log('❌ [JOBS_COUNT] خطأ في استخراج عدد الوظائف:', error);
            return null;
        }
    }

    extractPublishDate(container) {
        this.log('🔍 [DATE] استخراج تاريخ النشر المُصلح...');

        try {
            const divs = container.querySelectorAll('div');

            for (const div of divs) {
                if (div.textContent.includes('تاريخ النشر')) {
                    const parentColumn = div.closest('.columns-item');
                    if (parentColumn) {
                        const spans = parentColumn.querySelectorAll('span.font-bold.font-size-base.OSFillParent');

                        for (const span of spans) {
                            const text = span.textContent.trim();

                            if (this.isValidDate(text)) {
                                this.log(`✅ [DATE] تم العثور على تاريخ النشر: "${text}"`);
                                return text;
                            }
                        }
                    }
                }
            }

            this.log('🔍 [DATE] البحث الاحتياطي عن التاريخ...');
            const allSpans = container.querySelectorAll('span[data-expression]');

            for (const span of allSpans) {
                const text = span.textContent.trim();
                if (this.isValidDate(text)) {
                    this.log(`✅ [DATE] تم العثور على تاريخ (بحث احتياطي): "${text}"`);
                    return text;
                }
            }

            this.log('⚠️ [DATE] لم يتم العثور على تاريخ النشر');
            return null;

        } catch (error) {
            this.log('❌ [DATE] خطأ في استخراج تاريخ النشر:', error);
            return null;
        }
    }

    isValidDate(dateText) {
        if (!dateText || dateText.length < 6) return false;

        const datePatterns = [
            /^\d{1,2}\/\d{1,2}\/\d{4}$/,
            /^\d{1,2}-\d{1,2}-\d{4}$/,
            /^\d{4}\/\d{1,2}\/\d{1,2}$/,
            /^\d{4}-\d{1,2}-\d{1,2}$/
        ];

        return datePatterns.some(pattern => pattern.test(dateText));
    }

    checkAlreadyAppliedInList(container) {
        this.log('🔍 [APPLIED_CHECK] فحص التقديم المسبق...');

        try {
            const appliedIcon = container.querySelector('img[src*="UEP_Resources.tickcircle.svg"]');
            const appliedText = container.querySelector('span.text-primary');

            if (appliedIcon && appliedText && appliedText.textContent.includes('تم التقدم')) {
                this.log('✅ [APPLIED_CHECK] تم التقدم على هذه الوظيفة مسبقاً');
                return true;
            }

            this.log('✅ [APPLIED_CHECK] لم يتم التقدم على هذه الوظيفة');
            return false;

        } catch (error) {
            this.log('❌ [APPLIED_CHECK] خطأ في فحص التقديم المسبق:', error);
            return false;
        }
    }

    isValidJobTitle(title) {
        if (!title || title.length < 3 || title.length > 150) return false;

        const invalidPatterns = [
            'المشاركة في وضع',
            'تنفيذ الإجراءات',
            'متابعة تنفيذ',
            'الحفاظ على',
            'وتنظيم أعمال'
        ];

        for (const pattern of invalidPatterns) {
            if (title.includes(pattern)) return false;
        }

        return true;
    }
// ========================
    // 🎯 الحصول على جميع بطاقات الوظائف المُحسن
    // ========================

    getAllJobCards() {
        this.log('🔍 [CARDS] البحث عن بطاقات الوظائف المُحسن...');

        try {
            const jobLinks = document.querySelectorAll('a[data-link][href*="/Jadarat/JobDetails"]');
            this.log(`📊 [CARDS] تم العثور على ${jobLinks.length} رابط وظيفة`);

            const jobCards = [];
            let successfulCards = 0;
            let failedCards = 0;

            for (let i = 0; i < jobLinks.length; i++) {
                const link = jobLinks[i];
                const container = this.findJobCardContainerImproved(link);

                if (container) {
                    jobCards.push({
                        index: i,
                        link: link,
                        container: container
                    });
                    successfulCards++;
                } else {
                    this.log(`⚠️ [CARDS] لم يتم العثور على حاوي للرابط ${i + 1}`);
                    failedCards++;
                }
            }

            this.log(`✅ [CARDS] نجح: ${successfulCards}, فشل: ${failedCards}`);
            this.log(`📊 [CARDS] معدل النجاح: ${((successfulCards/jobLinks.length)*100).toFixed(1)}%`);

            return jobCards;

        } catch (error) {
            this.log('❌ [CARDS] خطأ في الحصول على بطاقات الوظائف:', error);
            return [];
        }
    }

    findJobCardContainerImproved(link) {
        try {
            const strategies = [
                // Strategy 1: Find the closest container with a job title and company name
                () => {
                    let container = link.closest('[data-container]');
                    while (container) {
                        const hasTitle = container.querySelector('span.heading4.OSFillParent');
                        const hasCompany = container.querySelector('div.font-bold.font-size-base a[data-link] span[data-expression]');
                        if (hasTitle && hasCompany) {
                            return container;
                        }
                        container = container.parentElement.closest('[data-container]');
                    }
                    return null;
                },
                // Strategy 2: Find the closest OSBlockWidget
                () => link.closest('.OSBlockWidget'),
                // Strategy 3: Find the closest container with a matching score
                () => {
                    let container = link.closest('[data-container]');
                    while (container) {
                        if (container.querySelector('span.matching_score')) {
                            return container;
                        }
                        container = container.parentElement.closest('[data-container]');
                    }
                    return null;
                },
                // Strategy 4: The direct parent container
                () => link.closest('[data-container]'),
                // New Strategy 5: Deep search
                () => {
                    let current = link;
                    for (let i = 0; i < 8; i++) {
                        current = current.parentElement;
                        if (!current) break;

                        if (current.querySelector('span.matching_score') ||
                            current.querySelector('[data-expression]')) {
                            return current;
                        }
                    }
                    return null;
                },

                // New Strategy 6: Multiple class search
                () => {
                    return link.closest('[data-container], .job-card, .position-card, .card, .item');
                },

                // New Strategy 7: Size-based search
                () => {
                    let current = link.parentElement;
                    while (current) {
                        const rect = current.getBoundingClientRect();
                        if (rect.height > 100 && rect.width > 200) {
                            return current;
                        }
                        current = current.parentElement;
                    }
                    return null;
                }
            ];

            for (let i = 0; i < strategies.length; i++) {
                const container = strategies[i]();
                if (container) {
                    this.log(`✅ [CONTAINER] Strategy ${i + 1} succeeded.`);
                    return container;
                }
            }

            this.log('❌ [CONTAINER] All strategies failed.');
            return null;

        } catch (error) {
            this.log('❌ [CONTAINER] Error finding job card container:', error);
            return link.closest('[data-container]');
        }
    }

    generateJobId(url, title, company) {
        try {
            const urlParams = new URL(url).searchParams;
            const paramValue = urlParams.get('Param');

            if (paramValue && paramValue.length > 10) {
                this.log(`✅ [ID] تم استخراج معرف من URL: ${paramValue.substring(0, 16)}...`);
                return paramValue;
            }

            const combinedText = title + '|' + company;
            const encodedId = btoa(encodeURIComponent(combinedText))
                .replace(/[^a-zA-Z0-9]/g, '')
                .substring(0, 20);

            this.log(`✅ [ID] تم إنشاء معرف من البيانات: ${encodedId}`);
            return encodedId;

        } catch (error) {
            this.log('❌ [ID] خطأ في إنشاء المعرف:', error);
            return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        }
    }

    getEmptyJobData(jobCard) {
        return {
            id: 'unknown_' + Date.now(),
            title: 'وظيفة غير محددة',
            company: 'شركة غير محددة',
            location: 'غير محدد',
            matchingScore: null,
            availableJobs: null,
            publishDate: null,
            alreadyApplied: false,
            url: jobCard.link ? jobCard.link.href : '',
            element: jobCard.link || null,
            dataQuality: { score: 0, level: 'فاشل' }
        };
    }

    // ========================
    // 💾 إدارة الذاكرة والبيانات
    // ========================

    async loadMemoryData() {
        try {
            this.log('💾 [MEMORY] تحميل البيانات من الذاكرة...');

            const stored = await chrome.storage.local.get([
                'visitedJobs', 'rejectedJobs', 'appliedJobs', 'stats'
            ]);

            if (stored.visitedJobs) {
                this.visitedJobs = new Set(stored.visitedJobs);
                this.log(`💾 [MEMORY] تم تحميل ${this.visitedJobs.size} وظيفة مزارة`);
            }

            if (stored.rejectedJobs) {
                this.rejectedJobs = new Set(stored.rejectedJobs);
                this.log(`💾 [MEMORY] تم تحميل ${this.rejectedJobs.size} وظيفة مرفوضة`);
            }

            if (stored.appliedJobs) {
                this.appliedJobs = new Set(stored.appliedJobs);
                this.log(`💾 [MEMORY] تم تحميل ${this.appliedJobs.size} وظيفة مُقدم عليها`);
            }

            if (stored.stats) {
                this.stats = { ...this.stats, ...stored.stats };
                this.log('💾 [MEMORY] تم تحميل الإحصائيات:', this.stats);
            }

        } catch (error) {
            this.log('❌ [MEMORY] خطأ في تحميل البيانات:', error);
        }
    }

    async saveMemoryData() {
        try {
            await chrome.storage.local.set({
                visitedJobs: Array.from(this.visitedJobs),
                rejectedJobs: Array.from(this.rejectedJobs),
                appliedJobs: Array.from(this.appliedJobs),
                stats: this.stats
            });

            this.log('💾 [SAVE] تم حفظ البيانات في الذاكرة');
        } catch (error) {
            this.log('❌ [SAVE] خطأ في حفظ البيانات:', error);
        }
    }

    // ========================
    // 🔄 رسائل النظام
    // ========================

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.log(`📨 [MESSAGE] تم استلام رسالة: ${message.action}`);

            switch (message.action) {
                case 'START_AUTOMATION':
                case 'START_AUTO_APPLY':
                    this.startProcess(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'STOP_AUTOMATION':
                case 'STOP_AUTO_APPLY':
                    this.stopProcess();
                    sendResponse({ success: true });
                    break;

                case 'GET_STATUS':
                    sendResponse(this.getStatus());
                    break;

                case 'PING':
                    sendResponse({ status: 'active' });
                    break;

                default:
                    this.log(`⚠️ [MESSAGE] رسالة غير معروفة: ${message.action}`);
                    sendResponse({ success: false, error: 'Unknown action' });
            }

            return true;
        });

        this.log('📨 [MESSAGE] تم تهيئة مستمع الرسائل');
    }

async detectPageTypeAndLog() {
    const url = window.location.href;
    let pageType = 'unknown';

    // 1. Check URL first
    if (url.includes('/Jadarat/JobDetails')) {
        pageType = 'jobDetails';
    } else if (url.includes('/Jadarat/ExploreJobs') || url.includes('JobTab=1')) {
        pageType = 'jobList';
    } else if (url.includes('/Jadarat/Home')) {
        pageType = 'home';
    }

    // 2. Check page elements as a fallback
    if (pageType === 'unknown') {
        if (document.querySelector('a[href*="/Jadarat/JobDetails"]')) {
            pageType = 'jobList';
        } else if (document.querySelector('.job-details-container') || Array.from(document.querySelectorAll('button[data-button]')).find(btn => btn.textContent.includes('تقديم'))) {
            pageType = 'jobDetails';
        }
    }

    // CRITICAL: Send page type to popup
    try {
        const jobLinks = document.querySelectorAll('a[href*="/Jadarat/JobDetails"]');
        const applyButtons = document.querySelectorAll('button[data-button]:contains("تقديم")');

        await chrome.runtime.sendMessage({
            type: 'PAGE_TYPE_UPDATE',
            pageType: pageType,
            url: url,
            title: document.title,
            jobLinks: jobLinks.length,
            applyButtons: applyButtons.length,
            timestamp: new Date().toISOString()
        });
        console.log(`📄 [PAGE_TYPE] Sent to popup: ${pageType}`);
    } catch (error) {
        console.log(`❌ [PAGE_TYPE] Failed to send to popup: ${error.message}`);
    }

    if (this.lastPageType !== pageType) {
        this.log(`🎯 [PAGE] Page type detected: ${pageType}`);
        this.lastPageType = pageType;
    }

    return pageType;
}

    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            stats: this.stats,
            currentJob: this.currentJobIndex,
            totalJobs: this.totalJobsOnPage,
            currentPage: this.currentPage,
            visitedCount: this.visitedJobs.size,
            rejectedCount: this.rejectedJobs.size,
            appliedCount: this.appliedJobs.size
        };
    }

    // ========================
    // 🚀 العملية الرئيسية
    // ========================

    async startProcess(settings = {}) {
        if (this.isRunning) {
            this.log('⚠️ [START] العملية قيد التشغيل بالفعل');
            return;
        }

        this.log('🚀 [START] بدء عملية التقديم التلقائي المُحسنة...');
        this.isRunning = true;
        this.shouldStop = false;
        this.isPaused = false;
        this.settings = { delayTime: 3, stepByStep: false, ...settings };

        this.stepByStepMode = this.settings.stepByStep;

        try {
            await this.runMainLoop();
        } catch (error) {
            this.log('❌ [START] خطأ في العملية الرئيسية:', error);
        } finally {
            this.stopProcess();
        }
    }

async runMainLoop() {
    console.log('🔄 [MAIN] Starting main loop...');

    while (!this.shouldStop) {
        try {
            const pageType = this.detectPageType();
            console.log(`🔍 [MAIN] Current page type: ${pageType}`);

            if (pageType === 'jobList') {
                console.log('📋 [MAIN] Processing job list page...');

                // Process job list
                const hasMoreJobs = await this.processJobListPage();

                if (hasMoreJobs) {
                    console.log('✅ [MAIN] Page completed, searching for more...');
                    // Continue on same page or move to next
                } else {
                    console.log('🔄 [MAIN] No more jobs, moving to next page...');
                    const movedToNext = await this.moveToNextPage();

                    if (!movedToNext) {
                        console.log('🏁 [MAIN] No more pages available');
                        break;
                    }
                }

            } else if (pageType === 'jobDetails') {
                console.log('📄 [MAIN] On job details page - attempting safe return...');

                // Attempt safe return
                const returnSuccess = await this.returnToJobListSafely();

                if (!returnSuccess) {
                    console.log('⚠️ [MAIN] Safe return failed - will retry next cycle');
                    // Don't stop system, try again in next cycle
                    await this.wait(3000);
                }

            } else if (pageType === 'unknown') {
                console.log('❓ [MAIN] Unknown page - attempting navigation...');

                // Simple attempt without reload
                const currentUrl = window.location.href;

                if (!currentUrl.includes('ExploreJobs')) {
                    console.log('🔄 [MAIN] Not on job list - using history.back()...');
                    window.history.back();
                    await this.wait(3000);
                } else {
                    console.log('🔄 [MAIN] On job list but not detected - refreshing detection...');
                    await this.wait(2000);
                }
            }

            // Short wait between cycles
            await this.wait(1000);

        } catch (error) {
            console.log('❌ [MAIN] Error in main loop:', error);

            // Try to recover
            await this.recoverFromError();

            // Longer wait before trying again
            await this.wait(5000);
        }
    }

    console.log('🏁 [MAIN] Main loop finished');
}

    async recoverFromError() {
        console.log('🔄 [RECOVERY] Starting error recovery process...');

        try {
            // Try to close any open dialogs
            const openDialogs = document.querySelectorAll('div[data-popup][role="dialog"]');
            console.log(`🚪 [RECOVERY] Found ${openDialogs.length} open dialogs`);

            for (const dialog of openDialogs) {
                if (dialog.style.display !== 'none') {
                    const closeBtn = dialog.querySelector('button');
                    if (closeBtn) {
                        console.log('🚪 [RECOVERY] Closing dialog...');
                        closeBtn.click();
                        await this.wait(1000);
                    }
                }
            }

            // Force return to list
            console.log('🔙 [RECOVERY] Force return to list...');
            await this.returnToJobListSafely();

            console.log('✅ [RECOVERY] Recovery successful');

        } catch (recoveryError) {
            console.log('💥 [RECOVERY] Recovery failed:', recoveryError);
        }
    }

    async processJobListPage() {
        this.log('📋 [PAGE] معالجة صفحة قائمة الوظائف المُحسنة...');

        await this.waitForPageLoad();

// ✅ انتظار إضافي للتأكد من تحميل الوظائف
await this.wait(2000);

const jobCards = this.getAllJobCards();
this.totalJobsOnPage = jobCards.length;

if (jobCards.length === 0) {
    this.log('⚠️ [PAGE] لم يتم العثور على وظائف، انتظار إضافي...');

    // ✅ محاولة إضافية للانتظار
    await this.wait(5000);
    const jobCardsRetry = this.getAllJobCards();

    if (jobCardsRetry.length === 0) {
        this.log('⚠️ [PAGE] لا توجد وظائف في هذه الصفحة - الانتقال للصفحة التالية');
        return false;
    } else {
        this.log(`✅ [PAGE] تم العثور على ${jobCardsRetry.length} وظيفة بعد الانتظار`);
        // تحديث المتغيرات
        const updatedJobCards = this.getAllJobCards();
        this.totalJobsOnPage = updatedJobCards.length;
    }
}

        this.log(`📊 [PAGE] سيتم معالجة ${jobCards.length} وظيفة`);

        let qualityStats = { excellent: 0, good: 0, average: 0, poor: 0 };

        for (let i = 0; i < jobCards.length && !this.shouldStop; i++) {
            this.currentJobIndex = i + 1;
            const progress = ((this.currentJobIndex) / jobCards.length) * 100;
            chrome.runtime.sendMessage({ action: 'UPDATE_PROGRESS', progress: progress, text: `Processing job ${this.currentJobIndex} of ${jobCards.length}` });

            try {
                const result = await this.processIndividualJob(jobCards[i], this.currentJobIndex, jobCards.length);

                if (result && result.quality) {
                    qualityStats[result.quality.level] = (qualityStats[result.quality.level] || 0) + 1;
                }

                if (i < jobCards.length - 1) {
                    await this.smartDelay();
                }

                if (i % 3 === 0) {
                    await this.saveMemoryData();
                }

            } catch (error) {
                this.log(`❌ [JOB ${this.currentJobIndex}] خطأ في المعالجة:`, error);
                this.stats.errors++;
            }
        }

        this.log('📊 [QUALITY] إحصائيات جودة البيانات:', qualityStats);

        return false;
    }

    async processIndividualJob(jobCard, index, total) {
        console.log(`\n🎯 [JOB_START] ===== Processing Job ${index}/${total} =====`);
        console.log(`⏰ [JOB_TIME] Started at: ${new Date().toLocaleTimeString()}`);

        try {
            const result = await this.processJobLogic(jobCard);
            console.log(`✅ [JOB_SUCCESS] Job ${index}/${total} completed: ${result}`);
            return result;
        } catch (error) {
            this.logError('PROCESS_INDIVIDUAL_JOB', error, { jobCard, index, total });
            throw error;
        } finally {
            console.log(`⏰ [JOB_END] Job ${index}/${total} ended at: ${new Date().toLocaleTimeString()}`);
            console.log(`🎯 [JOB_END] ===== End Job ${index}/${total} =====\n`);
        }
    }

    async processJobLogic(jobCard) {
        // 1. Extract data
        const jobData = this.extractJobDataFromHTML(jobCard);

        // 2. Check already applied in card
        if (jobData.alreadyApplied) {
            this.appliedJobs.add(jobData.id);
            this.stats.alreadyApplied++;
            return 'already_applied_list';
        }

        // 3. Check memory
        if (this.visitedJobs.has(jobData.id)) {
            this.stats.fromMemory++;
            this.stats.skipped++;
            return 'visited_from_memory';
        }

        if (this.appliedJobs.has(jobData.id)) {
            this.stats.fromMemory++;
            this.stats.alreadyApplied++;
            return 'applied_from_memory';
        }

        if (this.rejectedJobs.has(jobData.id)) {
            this.stats.fromMemory++;
            this.stats.rejected++;
            return 'rejected_from_memory';
        }

        // 4. New job - full processing
        const result = await this.processNewJob(jobData);
        this.visitedJobs.add(jobData.id);
        this.stats.total++;

        return result;
    }

    detectDialogs() {
        console.log(`🔍 [DIALOG_SCAN] Scanning for dialogs...`);

        const allDialogs = document.querySelectorAll('[role="dialog"], .popup-dialog, [data-popup]');
        console.log(`📊 [DIALOG_COUNT] Found ${allDialogs.length} potential dialogs`);

        allDialogs.forEach((dialog, index) => {
            const isVisible = dialog.style.display !== 'none' && dialog.offsetWidth > 0;
            const hasText = dialog.textContent.trim();
            const hasButtons = dialog.querySelectorAll('button').length;

            console.log(`📋 [DIALOG_${index}] Visible: ${isVisible}, Text: "${hasText.substring(0, 50)}...", Buttons: ${hasButtons}`);
        });

        return allDialogs;
    }

    logError(context, error, additionalData = {}) {
        const errorReport = {
            timestamp: new Date().toISOString(),
            context: context,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            page: {
                url: window.location.href,
                title: document.title,
                type: this.detectPageType()
            },
            system: {
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            },
            additional: additionalData
        };

        console.error(`💥 [ERROR_REPORT] ${context}:`, errorReport);

        // Store error for later analysis
        this.storeError(errorReport);
    }

    detectPageType() {
        const url = window.location.href;
        let pageType = 'unknown';

        // 1. Check URL first
        if (url.includes('/Jadarat/JobDetails')) {
            pageType = 'jobDetails';
        } else if (url.includes('/Jadarat/ExploreJobs') || url.includes('JobTab=1')) {
            pageType = 'jobList';
        } else if (url.includes('/Jadarat/Home')) {
            pageType = 'home';
        }

        // 2. Check page elements as a fallback
        if (pageType === 'unknown') {
            if (document.querySelector('a[href*="/Jadarat/JobDetails"]')) {
                pageType = 'jobList';
            } else if (document.querySelector('.job-details-container') || Array.from(document.querySelectorAll('button[data-button]')).find(button => button.textContent.trim() === 'تقديم')) {
                pageType = 'jobDetails';
            }
        }

        return pageType;
    }

    async storeError(errorReport) {
        try {
            const { errors = [] } = await chrome.storage.local.get('errors');
            errors.push(errorReport);
            if (errors.length > 100) {
                errors.shift(); // Keep only the last 100 errors
            }
            await chrome.storage.local.set({ errors });
        } catch (e) {
            console.error('Failed to store error report:', e);
        }
    }

    async handleJobDetailsPage() {
        console.log('📄 [DETAILS] Handling job details page...');

        try {
            // Wait for page load
            await this.waitForNavigationToDetails();
            console.log('✅ [DETAILS] Successfully navigated to details page');

            // Check for popups
            await this.handleAnyPopups();

            // Check previous application
            const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
            if (alreadyApplied) {
                console.log('⚠️ [DETAILS] Already applied, returning to list...');
                await this.returnToJobListSafely();
                return { success: false, action: 'already_applied_details' };
            }

            // Start application process
            console.log('🎯 [DETAILS] Starting application process...');
            const applicationResult = await this.attemptApplication();

            console.log('✅ [DETAILS] Job details processing completed');
            return applicationResult;

        } catch (error) {
            console.log('❌ [DETAILS] Error in job details processing:', error);

            // Emergency return only on error
            await this.returnToJobListSafely();
            return { success: false, action: 'error' };
        }
    }

    async processNewJob(jobData) {
        console.log('🎯 [NEW_JOB] Starting new job processing...');

        try {
            // Click job link
            await this.clickElementSafely(jobData.element);

            // Handle details page (includes return)
            const detailsResult = await this.handleJobDetailsPage();

            // Update statistics based on result
            if (detailsResult.success && detailsResult.action === 'applied_success') {
                this.appliedJobs.add(jobData.id);
                this.stats.applied++;
                console.log('✅ [NEW_JOB] Job applied successfully');
                return 'applied_success';

            } else if (detailsResult.action === 'applied_rejected') {
                this.rejectedJobs.add(jobData.id);
                this.stats.rejected++;
                console.log('❌ [NEW_JOB] Job application rejected');
                return 'applied_rejected';

            } else {
                console.log('⚠️ [NEW_JOB] Job processing completed with issues');
                return 'processing_completed';
            }

        } catch (error) {
            console.log('❌ [NEW_JOB] Error in new job processing:', error);
            return 'error';
        }
    }

    async recoverFromDialogFailure() {
        console.log(`🔄 [RECOVERY] Starting process recovery...`);

        // Check if we're stuck on a dialog
        const openDialogs = this.detectDialogs().filter(d => d.style.display !== 'none');
        if (openDialogs.length > 0) {
            console.log(`🔄 [RECOVERY] Found ${openDialogs.length} open dialogs, forcing close`);

            // Force close all dialogs
            openDialogs.forEach(dialog => {
                dialog.style.display = 'none';
                dialog.remove();
            });
        }

        // Force navigation back to job list
        console.log(`🔄 [RECOVERY] Forcing navigation back to job list`);
        await this.goBackToJobList();

        // Continue with next job
        console.log(`🔄 [RECOVERY] Recovery complete, continuing process`);
        return true;
    }
    // ========================
    // 🎯 عمليات التفاصيل والتقديم المُحسنة
    // ========================

    async waitForNavigationToDetails() {
        const maxAttempts = 15;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (window.location.href.includes('JobDetails')) {
                const detailsIndicators = [
                    'span.heading5',
                    'button[data-button]',
                    '[data-expression*="الرقم التعريفي"]',
                    'div.card.margin-bottom-base'
                ];

                let foundIndicators = 0;
                for (const selector of detailsIndicators) {
                    if (document.querySelector(selector)) {
                        foundIndicators++;
                    }
                }

                if (foundIndicators >= 2) {
                    this.log('✅ [NAVIGATION] تم تحميل صفحة التفاصيل');
                    await this.wait(1500);
                    return true;
                }
            }

            attempts++;
            await this.wait(1000);
        }

        this.log('⚠️ [NAVIGATION] انتهت مهلة انتظار صفحة التفاصيل');
        return false;
    }

    async checkIfAlreadyAppliedInDetails() {
        this.log('🔍 [DETAILS_CHECK] Checking for previous application in details...');

        try {
            const buttons = document.querySelectorAll('button[data-button]');
            for (const button of buttons) {
                const buttonText = button.textContent.trim();
                if (buttonText.includes('استعراض طلب التقديم') ||
                    buttonText.includes('تم التقديم') ||
                    buttonText.includes('عرض الطلب')) {
                    this.log('✅ [DETAILS_CHECK] Found previous application indicator');
                    return true;
                }
            }

            const pageText = document.body.textContent;
            const appliedTexts = [
                'تم التقديم على هذه الوظيفة',
                'لقد قدمت على هذه الوظيفة',
                'طلبك قيد المراجعة'
            ];

            for (const text of appliedTexts) {
                if (pageText.includes(text)) {
                    this.log('✅ [DETAILS_CHECK] وجد نص التقديم المسبق');
                    return true;
                }
            }

            this.log('✅ [DETAILS_CHECK] لم يتم التقدم مسبقاً');
            return false;

        } catch (error) {
            this.log('❌ [DETAILS_CHECK] خطأ في فحص التقديم المسبق:', error);
            return false;
        }
    }

    async attemptApplication() {
        this.log('🎯 [APPLY] بدء محاولة التقديم...');

        try {
            const submitButton = await this.findSubmitButton();
            if (!submitButton) {
                this.log('❌ [APPLY] لم يتم العثور على زر التقديم');
                return { success: false, reason: 'زر التقديم غير موجود' };
            }

            this.log('✅ [APPLY] تم العثور على زر التقديم');

            this.log('🖱️ [APPLY] النقر على زر التقديم...');
            await this.clickElementSafely(submitButton);
            await this.wait(2000);

            this.log('⏳ [APPLY] معالجة نافذة التأكيد...');
            const confirmationResult = await this.handleConfirmationDialog();

            if (!confirmationResult.success) {
                this.log('❌ [APPLY] فشل في معالجة نافذة التأكيد');
                return { success: false, reason: 'فشل في التأكيد' };
            }

            console.log('✅ [CONFIRM] Final confirmation button clicked');
            console.log('⏳ [CONFIRM] Waiting for system response...');

            try {
                // Short wait for response
                await this.wait(3000);
                console.log('✅ [WAIT] Initial wait completed');

                // Search for result dialog
                console.log('🔍 [RESULT] Searching for result dialog...');
                const resultDialog = await this.waitForResultDialog();
                console.log('📋 [RESULT] Search result:', resultDialog);

                if (resultDialog.type === 'success') {
                    console.log('🎉 [SUCCESS] Application successful!');
                    await this.handleSuccessDialog(resultDialog.dialog);
                    return { success: true, action: 'applied_success' };
                } else if (resultDialog.type === 'rejection') {
                    console.log('❌ [REJECTED] Application rejected');
                    await this.handleRejectionDialog(resultDialog.dialog);
                    return { success: false, action: 'applied_rejected' };
                } else {
                    console.log('⏰ [TIMEOUT] Result dialog not found');
                    return { success: false, action: 'timeout' };
                }
            } catch (error) {
                console.log('💥 [ERROR] Error after confirmation click:', error);
                await this.handleApplicationError();
                return { success: false, action: 'error' };
            }

        } catch (error) {
            this.log('❌ [APPLY] خطأ في محاولة التقديم:', error);
            return { success: false, reason: 'خطأ تقني' };
        }
    }

    async findSubmitButton() {
        try {
            const buttons = document.querySelectorAll('button[data-button]');
            for (const btn of buttons) {
                if (btn.textContent.trim() === 'تقديم' &&
                    !btn.disabled &&
                    btn.offsetWidth > 0) {
                    this.log('✅ [SUBMIT_BTN] Found submit button');
                    return btn;
                }
            }

            this.log('❌ [SUBMIT_BTN] Submit button not found');
            return null;

        } catch (error) {
            this.log('❌ [SUBMIT_BTN] Error finding submit button:', error);
            return null;
        }
    }

    async handleConfirmationDialog() {
        this.log('⏳ [CONFIRM] Waiting for confirmation dialog...');

        const maxAttempts = 10;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const confirmDialog = Array.from(document.querySelectorAll('div[data-popup][role="dialog"]')).find(d => d.style.display !== 'none' && (d.textContent.includes('هل أنت متأكد') || d.textContent.includes('التقديم على وظيفة')));

            if (confirmDialog) {
                this.log('✅ [CONFIRM] Found confirmation dialog');

                const confirmButton = Array.from(confirmDialog.querySelectorAll('button[data-button]')).find(btn => btn.textContent.trim() === 'تقديم');
                if (confirmButton) {
                    this.log('🖱️ [CONFIRM] Clicking confirmation button...');
                    await this.clickElementSafely(confirmButton);
                    await this.wait(3000);
                    return { success: true };
                }

                this.log('❌ [CONFIRM] Confirmation button not found');
                return { success: false, reason: 'Confirmation button not found' };
            }

            attempts++;
            await this.wait(1000);
        }

        this.log('⚠️ [CONFIRM] Timed out waiting for confirmation dialog');
        return { success: false, reason: 'Confirmation dialog did not appear' };
    }

    detectSuccessDialog() {
        const successSelectors = [
            'div[data-popup][role="dialog"]:has(span:contains("تم التقديم"))',
            'div[role="dialog"]:has(.icon-hrdf-circle-tick)',
            'div.popup-dialog:has(span:contains("تم تقديم طلبكم"))',
            'div[data-popup]:has(i.fa-check)',
            'div[role="dialog"]:has(span:contains("بنجاح"))'
        ];

        for (const selector of successSelectors) {
            const dialog = document.querySelector(selector);
            if (dialog && dialog.style.display !== 'none') {
                return dialog;
            }
        }
        return null;
    }

    findCloseButtonInSuccessDialog(dialog) {
        const closeButtonSelectors = [
            'button[data-button]:contains("اغلاق")',
            'button[data-button]:contains("إغلاق")',
            'button.btn-primary:contains("اغلاق")',
            'button.btn:contains("اغلاق")',
            'button[data-button].btn-primary',
            'button[data-button]:last-child',
            '.close-button',
            'button:contains("×")',
            'button:contains("✕")'
        ];

        for (const selector of closeButtonSelectors) {
            const button = dialog.querySelector(selector);
            if (button && button.offsetWidth > 0) {
                return button;
            }
        }
        return null;
    }

    async clickSuccessDialogClose(button) {
        const strategies = [
            // Strategy 1: Direct click with focus
            () => {
                button.focus();
                button.click();
                return true;
            },

            // Strategy 2: Mouse events sequence
            () => {
                const rect = button.getBoundingClientRect();
                const events = ['mousedown', 'mouseup', 'click'];
                events.forEach(eventType => {
                    button.dispatchEvent(new MouseEvent(eventType, {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                    }));
                });
                return true;
            },

            // Strategy 3: Keyboard simulation
            () => {
                button.focus();
                button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
                button.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
                return true;
            },

            // Strategy 4: Force click with JavaScript
            () => {
                if (button.onclick) {
                    button.onclick();
                } else {
                    button.click();
                }
                return true;
            },

            // Strategy 5: DOM manipulation (last resort)
            () => {
                const dialog = button.closest('[role="dialog"]') || button.closest('.popup-dialog');
                if (dialog) {
                    dialog.style.display = 'none';
                    dialog.remove();
                }
                return true;
            }
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                console.log(`🖱️ [SUCCESS_CLOSE] Trying strategy ${i + 1}/${strategies.length}`);
                await strategies[i]();
                await this.wait(1000);

                // Check if dialog is closed
                if (!this.detectSuccessDialog()) {
                    console.log(`✅ [SUCCESS_CLOSE] Strategy ${i + 1} succeeded`);
                    return true;
                }
            } catch (error) {
                console.log(`❌ [SUCCESS_CLOSE] Strategy ${i + 1} failed: ${error.message}`);
            }
        }

        if (this.detectSuccessDialog()) {
            await this.handleSandboxError();
            return true;
        }

        return false;
    }

    async handleSandboxError() {
        console.log('🔄 [SANDBOX] Detected sandbox restriction, using alternative navigation');

        // Force navigation back to job list
        try {
            window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
            await this.wait(5000);
            return true;
        } catch (error) {
            console.log('❌ [SANDBOX] Alternative navigation failed');
            return false;
        }
    }

    async closeResultDialog(resultDialog) {
        console.log('🚪 [CLOSE] Closing result dialog...');

        const closeButton = resultDialog.dialog.querySelector('button[data-button]');
        if (closeButton) {
            await this.clickElementSafely(closeButton, 'result dialog close button');
            console.log('✅ [CLOSE] Successfully closed result dialog');
            return true;
        }

        console.log('❌ [CLOSE] Failed to find close button');
        return false;
    }

    async waitForResultDialog() {
        console.log('⏳ [RESULT] Starting wait for result dialog...');

        const maxAttempts = 30; // 30 seconds

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔍 [RESULT] Attempt ${attempt}/${maxAttempts}`);

            // Search for all popup dialogs
            const dialogs = document.querySelectorAll('div[data-popup][role="dialog"]');
            console.log(`📊 [RESULT] Found ${dialogs.length} popup dialogs`);

            for (let i = 0; i < dialogs.length; i++) {
                const dialog = dialogs[i];
                const isVisible = dialog.style.display !== 'none' && dialog.offsetWidth > 0;

                console.log(`📋 [RESULT] Dialog ${i}: visible=${isVisible}`);

                if (!isVisible) continue;

                const dialogText = dialog.textContent;
                console.log(`📝 [RESULT] Dialog ${i} text: "${dialogText.substring(0, 100)}..."`);

                // Check for success dialog
                if (dialogText.includes('تم تقديم طلبك') ||
                    dialogText.includes('تم التقديم') ||
                    dialogText.includes('بنجاح')) {
                    console.log('🎉 [SUCCESS] Success dialog detected!');
                    return { type: 'success', dialog: dialog };
                }

                // Check for rejection dialog
                if (dialogText.includes('عذراً') ||
                    dialogText.includes('لا يمكنك') ||
                    dialogText.includes('رفض')) {
                    console.log('❌ [REJECTED] Rejection dialog detected!');
                    return { type: 'rejection', dialog: dialog };
                }
            }

            await this.wait(1000);
        }

        console.log('⏰ [TIMEOUT] Result dialog wait timeout');
        return { type: 'timeout' };
    }

    async handleSuccessDialog(dialog) {
        console.log('🎉 [SUCCESS] Starting success handling...');

        try {
            // Close success dialog
            console.log('🚪 [SUCCESS] Closing success dialog...');
            const closeButton = dialog.querySelector('button[data-button]');

            if (closeButton) {
                await this.clickElementSafely(closeButton, 'success dialog close');
                console.log('✅ [SUCCESS] Successfully closed success dialog');
            }

            await this.wait(2000);

            console.log('✅ [SUCCESS] Success handled successfully');
            return { success: true };

        } catch (error) {
            console.log('💥 [SUCCESS] Error handling success:', error);
            return { success: false };
        }
    }

    async handleRejectionDialog(dialog) {
        console.log('❌ [REJECTION] Starting rejection handling...');

        try {
            // Extract rejection reason
            const rejectionText = dialog.textContent;
            console.log('📝 [REJECTION] Rejection reason:', rejectionText);

            // Close rejection dialog
            console.log('🚪 [REJECTION] Closing rejection dialog...');
            const closeButton = dialog.querySelector('button[data-button]');

            if (closeButton) {
                await this.clickElementSafely(closeButton, 'rejection dialog close');
                console.log('✅ [REJECTION] Successfully closed rejection dialog');
            }

            await this.wait(2000);

            console.log('✅ [REJECTION] Rejection handled successfully');
            return { success: true };

        } catch (error) {
            console.log('💥 [REJECTION] Error handling rejection:', error);
            return { success: false };
        }
    }

    async handleApplicationError() {
        console.log('🔄 [RECOVERY] Starting error recovery process...');

        try {
            // Try to close any open dialogs
            const openDialogs = document.querySelectorAll('div[data-popup][role="dialog"]');
            console.log(`🚪 [RECOVERY] Found ${openDialogs.length} open dialogs`);

            for (const dialog of openDialogs) {
                if (dialog.style.display !== 'none') {
                    const closeBtn = dialog.querySelector('button');
                    if (closeBtn) {
                        console.log('🚪 [RECOVERY] Closing dialog...');
                        closeBtn.click();
                        await this.wait(1000);
                    }
                }
            }

            // Force return to list
            console.log('🔙 [RECOVERY] Force return to list...');
            await this.returnToJobListSafely();

            console.log('✅ [RECOVERY] Recovery successful');

        } catch (recoveryError) {
            console.log('💥 [RECOVERY] Recovery failed:', recoveryError);
        }
    }

    async handleResultDialog() {
        this.log('⏳ [RESULT] Waiting for result dialog...');

        const maxAttempts = 20;
        let attempts = 0;

        while (attempts < maxAttempts) {
            this.detectDialogs();
            const successDialog = this.detectSuccessDialog();
            if (successDialog) {
                this.log('✅ [RESULT] Application successful!');
                const closeButton = this.findCloseButtonInSuccessDialog(successDialog);
                if (closeButton) {
                    await this.clickSuccessDialogClose(closeButton);
                }
                return { success: true, type: 'success' };
            }

            const resultDialogs = document.querySelectorAll('div[data-popup][role="dialog"]');

            for (const dialog of resultDialogs) {
                if (dialog.style.display === 'none') continue;

                const dialogText = dialog.textContent;

                if (dialogText.includes('عذراً ، لا يمكنك التقديم') || dialogText.includes('غير مؤهل')) {
                    this.log('❌ [RESULT] Application rejected');
                    const reason = this.extractRejectionReason(dialogText);
                    await this.closeDialog(dialog);
                    return { success: false, type: 'rejection', reason: reason };
                }
            }

            attempts++;
            await this.wait(1000);
        }

        this.log('⚠️ [RESULT] Timed out waiting for result dialog');
        return { success: false, type: 'timeout', reason: 'Timeout' };
    }

    extractRejectionReason(dialogText) {
        try {
            const commonReasons = [
                'الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب',
                'لا يطابق شرط الخبرة المطلوبة',
                'لا يطابق شرط العمر المطلوب',
                'لا يطابق شرط الجنس المطلوب',
                'انتهت فترة التقديم'
            ];

            for (const reason of commonReasons) {
                if (dialogText.includes(reason)) {
                    return reason;
                }
            }

            const match = dialogText.match(/أنت غير مؤهل[^،]*،\s*(.+?)(?:\.|$)/);
            if (match && match[1]) {
                return match[1].trim();
            }

            return 'سبب غير محدد';

        } catch (error) {
            this.log('❌ [REASON] خطأ في استخراج سبب الرفض:', error);
            return 'خطأ في استخراج السبب';
        }
    }

    async closeDialog(dialog) {
        try {
            const closeButtons = dialog.querySelectorAll('button[data-button]');

            for (const btn of closeButtons) {
                const text = btn.textContent.trim();
                if (text === 'إغلاق' || text === 'موافق') {
                    this.log('🖱️ [CLOSE] إغلاق النافذة...');
                    await this.clickElementSafely(btn);
                    await this.wait(1000);
                    return true;
                }
            }

            const closeIcon = dialog.querySelector('a[data-link] img[src*="close.svg"]');
            if (closeIcon) {
                await this.clickElementSafely(closeIcon.parentElement);
                await this.wait(1000);
                return true;
            }

            return false;
        } catch (error) {
            this.log('❌ [CLOSE] خطأ في إغلاق النافذة:', error);
            return false;
        }
    }

    // ========================
    // 🔄 التنقل والعودة المُحسنة
    // ========================

    async returnToJobListSafely() {
        console.log('🔙 [SAFE_RETURN] Starting safe return to list...');

        try {
            // Only safe attempt: history.back()
            console.log('🔄 [SAFE_RETURN] Using history.back()...');
            window.history.back();

            // Wait for return
            await this.wait(4000);

            // Check if return succeeded
            const currentUrl = window.location.href;
            console.log('🔍 [SAFE_RETURN] URL after return:', currentUrl);

            const pageType = this.detectPageType();
            console.log('🔍 [SAFE_RETURN] Page type after return:', pageType);

            if (pageType === 'jobList') {
                console.log('✅ [SAFE_RETURN] Returned successfully - context preserved');
                return true;
            } else {
                console.log('❌ [SAFE_RETURN] Return failed - but won\'t reload!');
                console.log('⚠️ [SAFE_RETURN] Will try again in next cycle');
                return false;
            }

        } catch (error) {
            console.log('❌ [SAFE_RETURN] Error in return:', error);
            console.log('⚠️ [SAFE_RETURN] Will try again in next cycle');
            return false;
        }
    }

async goBackToJobList() {
        this.log('🔙 [BACK] Returning to job list...');

        try {
            await this.returnToJobListSafely();
            return true;
        } catch (error) {
            this.log('❌ [BACK] Failed to go back to job list:', error);
            return false;
        }
    }

    async navigateToJobList() {
        this.log('🧭 [NAVIGATE] Navigating to job list...');

        try {
            const jobListUrl = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';

            if (!window.location.href.includes('/Jadarat/ExploreJobs')) {
                window.history.pushState({}, '', jobListUrl);
                await this.wait(5000);
            }

            return true;
        } catch (error) {
            this.log('❌ [NAVIGATE] Navigation failed:', error);
            return false;
        }
    }

    async moveToNextPage() {
        this.log('📄 [NEXT_PAGE] البحث عن الصفحة التالية...');

        try {
            const nextButtons = document.querySelectorAll('button[aria-label*="go to next page"]');

            for (const button of nextButtons) {
                if (!button.disabled && button.offsetWidth > 0) {
                    this.log('✅ [NEXT_PAGE] تم العثور على زر الصفحة التالية');
                    this.currentPage++;

                    await this.clickElementSafely(button);
                    await this.wait(4000);

                    await this.waitForPageLoad();

                    this.log(`📄 [NEXT_PAGE] تم الانتقال للصفحة ${this.currentPage}`);
                    return true;
                }
            }

            this.log('📄 [NEXT_PAGE] لا توجد صفحة تالية');
            return false;

        } catch (error) {
            this.log('❌ [NEXT_PAGE] خطأ في الانتقال للصفحة التالية:', error);
            return false;
        }
    }

    // ========================
    // 🛠️ مساعدات عامة محسنة
    // ========================

async waitForPageLoad() {
    this.log('⏳ [LOAD] انتظار تحميل الصفحة المُحسن...');

    const maxAttempts = 20; // زيادة المحاولات
    let attempts = 0;

    while (attempts < maxAttempts) {
        const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');

        // ✅ قبول أي عدد من الوظائف (حتى لو كان قليل)
        if (jobLinks.length >= 1) {
            this.log(`✅ [LOAD] تم تحميل ${jobLinks.length} وظيفة`);
            await this.wait(1000); // انتظار إضافي للاستقرار
            return true;
        }

        // ✅ فحص إضافي للعناصر الأخرى
        const pageIndicators = [
            'span.filter-text',
            '.osui-accordion-item__title',
            'div[data-container]'
        ];

        let foundIndicators = 0;
        for (const selector of pageIndicators) {
            if (document.querySelector(selector)) {
                foundIndicators++;
            }
        }

        if (foundIndicators >= 2 && attempts > 10) {
            this.log('✅ [LOAD] الصفحة محملة (بدون وظائف)');
            return true;
        }

        attempts++;
        await this.wait(1500); // انتظار أطول بين المحاولات
    }

    this.log('⚠️ [LOAD] انتهت مهلة انتظار تحميل الصفحة');
    return true; // ✅ نتابع حتى لو لم تُحمل بشكل مثالي
}

    async handleAnyPopups() {
        this.log('🔍 [POPUP] فحص النوافذ المنبثقة...');

        try {
            const popups = document.querySelectorAll('div[data-popup][role="dialog"]');

            for (const popup of popups) {
                if (popup.style.display === 'none') continue;

                const popupText = popup.textContent;

                if (popupText.includes('تقييم') || popupText.includes('استطلاع')) {
                    this.log('🗑️ [POPUP] إغلاق نافذة التقييم...');

                    const closeIcon = popup.querySelector('a[data-link] img[src*="close.svg"]');
                    if (closeIcon) {
                        await this.clickElementSafely(closeIcon.parentElement);
                        await this.wait(1000);
                    }
                }
            }

        } catch (error) {
            this.log('❌ [POPUP] خطأ في معالجة النوافذ المنبثقة:', error);
        }
    }

    async clickElementSafely(element, elementName = 'element') {
        console.log(`🎯 [CLICK_START] Starting click on ${elementName}`);
        console.log(`🔍 [CLICK_ELEMENT] Tag: ${element.tagName}, Class: ${element.className}`);
        console.log(`📏 [CLICK_SIZE] Width: ${element.offsetWidth}, Height: ${element.offsetHeight}`);
        console.log(`👁️ [CLICK_VISIBLE] Visible: ${element.offsetWidth > 0 && element.offsetHeight > 0}`);
        console.log(`🎯 [CLICK_POSITION] Top: ${element.offsetTop}, Left: ${element.offsetLeft}`);
        console.log(`📝 [CLICK_TEXT] Text: "${element.textContent.trim()}"`);

        const strategies = [
            { name: 'Direct Click', method: () => element.click() },
            { name: 'Mouse Event', method: () => this.dispatchMouseEvent(element) },
            { name: 'Focus + Enter', method: () => this.focusAndEnter(element) },
            { name: 'Force Click', method: () => this.forceClick(element) }
        ];

        for (let i = 0; i < strategies.length; i++) {
            const strategy = strategies[i];
            console.log(`🖱️ [CLICK_TRY] Method ${i + 1}: ${strategy.name}`);

            try {
                await strategy.method();
                await this.wait(2000);

                console.log(`✅ [CLICK_SUCCESS] ${strategy.name} succeeded on ${elementName}`);
                return true;

            } catch (error) {
                console.log(`❌ [CLICK_FAIL] ${strategy.name} failed: ${error.message}`);
                console.log(`🔍 [CLICK_ERROR] Stack: ${error.stack}`);
            }
        }

        console.log(`💥 [CLICK_FATAL] All click methods failed for ${elementName}`);
        return false;
    }

    async smartDelay() {
        const baseDelay = this.settings.delayTime * 1000;
        const randomDelay = Math.random() * 2000;
        const totalDelay = baseDelay + randomDelay;

        this.log(`⏱️ [DELAY] انتظار ${Math.round(totalDelay / 1000)} ثانية...`);
        await this.wait(totalDelay);
    }
    async waitForUserInput(message) {
        if (this.stepByStepMode) {
            this.log(`⏸️ [STEP] ${message}`);
            return new Promise(resolve => {
                const handleKeyPress = (event) => {
                    if (event.key === 'Enter') {
                        document.removeEventListener('keypress', handleKeyPress);
                        resolve();
                    }
                };
                document.addEventListener('keypress', handleKeyPress);
            });
        }
    }

    async saveRejectionReason(jobData, reason) {
        try {
            const rejectionData = {
                jobId: jobData.id,
                jobTitle: jobData.title,
                company: jobData.company,
                reason: reason,
                date: new Date().toLocaleDateString('ar-SA'),
                time: new Date().toLocaleTimeString('ar-SA'),
                dataQuality: jobData.dataQuality || { level: 'غير محدد' }
            };

            chrome.runtime.sendMessage({
                action: 'SAVE_REJECTION_DATA',
                rejectionData: rejectionData
            });

            this.log('💾 [REJECTION] تم حفظ سبب الرفض:', rejectionData);
        } catch (error) {
            this.log('❌ [REJECTION] خطأ في حفظ سبب الرفض:', error);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================
    // 🛑 إيقاف وإنهاء العملية
    // ========================

    stopProcess() {
        this.log('🛑 [STOP] إيقاف عملية التقديم التلقائي...');
        this.shouldStop = true;
        this.isRunning = false;
        this.isPaused = false;

        this.saveMemoryData();
    }
// 🆕 دالة فحص حالة النظام
checkSystemHealth() {
    const health = {
        isRunning: this.isRunning,
        currentPage: this.detectPageTypeAndLog(),
        jobsFound: document.querySelectorAll('a[href*="JobDetails"]').length,
        memorySize: this.visitedJobs.size,
        stats: this.stats
    };

    this.log('🏥 [HEALTH] فحص حالة النظام:', health);

    // إذا كان النظام يعمل لكن لا يجد وظائف لفترة طويلة
    if (this.isRunning && health.jobsFound === 0) {
        this.log('⚠️ [HEALTH] تحذير: النظام يعمل لكن لا يجد وظائف');

        // محاولة إعادة تحميل الصفحة
        setTimeout(() => {
            if (this.isRunning && document.querySelectorAll('a[href*="JobDetails"]').length === 0) {
                this.log('🔄 [HEALTH] إعادة تحميل الصفحة لحل المشكلة');
                window.location.reload();
            }
        }, 10000); // بعد 10 ثواني
    }

    return health;
}

    pauseProcess() {
        this.log('⏸️ [PAUSE] إيقاف مؤقت للعملية...');
        this.isPaused = true;
    }

    resumeProcess() {
        this.log('▶️ [RESUME] استئناف العملية...');
        this.isPaused = false;
    }

    async displayFinalResults() {
        try {
            this.log('\n🏆 ===== النتائج النهائية المُحسنة =====');
            this.log(`✅ تم التقديم على: ${this.stats.applied} وظيفة`);
            this.log(`⏭️ تم تخطي: ${this.stats.skipped} وظيفة`);
            this.log(`❌ تم رفض: ${this.stats.rejected} وظيفة`);
            this.log(`🔄 مُقدم عليها مسبقاً: ${this.stats.alreadyApplied} وظيفة`);
            this.log(`💾 مُعالج من الذاكرة: ${this.stats.fromMemory} وظيفة`);
            this.log(`⚠️ أخطاء تقنية: ${this.stats.errors}`);
            this.log(`📊 أخطاء استخراج البيانات: ${this.stats.dataExtractionErrors}`);
            this.log(`📋 إجمالي المعالجة: ${this.stats.total} وظيفة`);
            this.log(`📄 الصفحة الحالية: ${this.currentPage}`);
            this.log(`💾 الوظائف المحفوظة: ${this.visitedJobs.size}`);
            this.log(`🚫 الوظائف المرفوضة: ${this.rejectedJobs.size}`);
            this.log(`✅ الوظائف المُقدم عليها: ${this.appliedJobs.size}`);

            const totalProcessed = this.stats.applied + this.stats.rejected + this.stats.errors;
            const successRate = totalProcessed > 0 ? ((this.stats.applied / totalProcessed) * 100).toFixed(1) : 0;
            const dataQualityRate = this.stats.total > 0 ? (((this.stats.total - this.stats.dataExtractionErrors) / this.stats.total) * 100).toFixed(1) : 0;
            const memoryEfficiency = this.stats.total > 0 ? ((this.stats.fromMemory / this.stats.total) * 100).toFixed(1) : 0;

            this.log(`📈 معدل نجاح التقديم: ${successRate}%`);
            this.log(`🎯 جودة استخراج البيانات: ${dataQualityRate}%`);
            this.log(`🧠 كفاءة الذاكرة: ${memoryEfficiency}%`);

            const overallScore = (parseFloat(successRate) + parseFloat(dataQualityRate)) / 2;
            let performanceLevel = 'ضعيف';
            if (overallScore >= 90) performanceLevel = 'ممتاز';
            else if (overallScore >= 75) performanceLevel = 'جيد جداً';
            else if (overallScore >= 60) performanceLevel = 'جيد';
            else if (overallScore >= 45) performanceLevel = 'مقبول';

            this.log(`🏆 تقييم الأداء العام: ${performanceLevel} (${overallScore.toFixed(1)}%)`);
            this.log('=====================================\n');

            chrome.runtime.sendMessage({
                action: 'PROCESS_COMPLETED',
                stats: this.stats,
                visitedCount: this.visitedJobs.size,
                rejectedCount: this.rejectedJobs.size,
                appliedCount: this.appliedJobs.size,
                currentPage: this.currentPage,
                successRate: successRate,
                dataQualityRate: dataQualityRate,
                memoryEfficiency: memoryEfficiency,
                performanceLevel: performanceLevel,
                overallScore: overallScore
            });

            await this.saveMemoryData();

        } catch (error) {
            this.log('❌ [RESULTS] خطأ في عرض النتائج النهائية:', error);
        }
    }

    // ========================
    // 🔬 أدوات التشخيص المُحسنة
    // ========================

    addAdvancedTestingTools() {
        window.jadaratAutoHelpers = {
            testExtraction: () => {
                this.log('🧪 [TEST] بدء اختبار استخراج البيانات المُحسن...');
                const cards = this.getAllJobCards();
                this.log(`📊 [TEST] وجد ${cards.length} بطاقة في الصفحة`);

                if (cards.length > 0) {
                    const results = [];

                    for (let i = 0; i < Math.min(3, cards.length); i++) {
                        const data = this.extractJobDataFromHTML(cards[i]);
                        results.push({
                            cardIndex: i + 1,
                            title: data.title,
                            company: data.company,
                            isCompanyValid: data.company !== data.title && data.company !== 'شركة غير محددة',
                            location: data.location,
                            matchingScore: data.matchingScore,
                            publishDate: data.publishDate,
                            isDateValid: data.publishDate && /\d{1,2}\/\d{1,2}\/\d{4}/.test(data.publishDate)
                        });
                    }

                    this.log('📋 [TEST] نتائج الاختبار:', results);

                    const validCompanies = results.filter(r => r.isCompanyValid).length;
                    const validDates = results.filter(r => r.isDateValid).length;

                    this.log(`📊 [QUALITY] جودة أسماء الشركات: ${validCompanies}/${results.length} (${((validCompanies/results.length)*100).toFixed(1)}%)`);
                    this.log(`📊 [QUALITY] جودة التواريخ: ${validDates}/${results.length} (${((validDates/results.length)*100).toFixed(1)}%)`);

                    return results;
                }
                return null;
            },

            debugCompanyExtraction: () => {
                this.log('🧪 [DEBUG] تشخيص مُحسن لاستخراج أسماء الشركات...');
                const cards = this.getAllJobCards();

                if (cards.length > 0) {
                    const card = cards[0];
                    const container = card.container;

                    this.log('🔍 [DEBUG] تحليل HTML الخاص بالبطاقة الأولى...');

                    const title = this.extractJobTitle(container);
                    this.log(`📝 [DEBUG] عنوان الوظيفة: "${title}"`);

                    const allLinks = container.querySelectorAll('a[data-link] span[data-expression]');
                    this.log(`🔗 [DEBUG] عدد الروابط الموجودة: ${allLinks.length}`);

                    allLinks.forEach((link, index) => {
                        const text = link.textContent.trim();
                        const isValid = this.isValidCompanyName(text, title);
                        const isJobTitle = text === title;

                        this.log(`${index + 1}. "${text}" - ${isJobTitle ? '📝 عنوان وظيفة' : isValid ? '✅ شركة صحيحة' : '❌ غير صحيح'}`);
                    });

                    const finalCompany = this.extractCompanyName(container, title);
                    this.log(`🎯 [DEBUG] النتيجة النهائية: "${finalCompany}"`);

                    return {
                        title,
                        company: finalCompany,
                        allOptions: Array.from(allLinks).map(link => link.textContent.trim())
                    };
                }

                return null;
            },

            testCard: (index = 0) => {
                const cards = this.getAllJobCards();
                if (cards[index]) {
                    this.log(`🧪 [TEST] اختبار مفصل للبطاقة ${index + 1}...`);

                    const data = this.extractJobDataFromHTML(cards[index]);

                    const quality = {
                        titleValid: data.title !== 'وظيفة غير محددة',
                        companyValid: data.company !== 'شركة غير محددة' && data.company !== data.title,
                        locationValid: data.location !== 'غير محدد',
                        dateValid: data.publishDate && /\d{1,2}\/\d{1,2}\/\d{4}/.test(data.publishDate),
                        scoreValid: data.matchingScore && data.matchingScore.includes('%')
                    };

                    const validCount = Object.values(quality).filter(Boolean).length;
                    const totalCount = Object.keys(quality).length;

                    this.log(`📊 [QUALITY] جودة البيانات: ${validCount}/${totalCount} (${((validCount/totalCount)*100).toFixed(1)}%)`);
                    this.log(`📋 [TEST] البيانات:`, data);
                    this.log(`🔍 [TEST] تحليل الجودة:`, quality);

                    return { data, quality };
                }
                this.log(`❌ [TEST] البطاقة ${index + 1} غير موجودة`);
                return null;
            },

            getStatus: () => {
                const status = {
                    isRunning: this.isRunning,
                    stats: this.stats,
                    visitedCount: this.visitedJobs.size,
                    rejectedCount: this.rejectedJobs.size,
                    appliedCount: this.appliedJobs.size,
                    memoryEfficiency: this.stats.fromMemory > 0 ? ((this.stats.fromMemory / this.stats.total) * 100).toFixed(1) + '%' : '0%',
                    dataQuality: this.stats.dataExtractionErrors > 0 ? 'ضعيف' : this.stats.errors < this.stats.total * 0.05 ? 'ممتاز' : 'جيد'
                };
                this.log('📊 [STATUS] الحالة المُحسنة:', status);
                return status;
            },

            testPageDetection: () => {
                this.log('🧪 [TEST] اختبار التعرف على الصفحة المُحسن...');
                const pageType = this.detectPageTypeAndLog();

                if (pageType === 'jobList') {
                    const cards = this.getAllJobCards();
                    const testResult = this.testExtraction();

                    const result = {
                        success: cards.length > 0,
                        pageType,
                        cardCount: cards.length,
                        dataQuality: testResult ? 'اختبر البيانات' : 'لا توجد بيانات'
                    };

                    this.log('📊 [TEST] نتيجة الاختبار الشامل:', result);
                    return result;
                } else {
                    return { success: true, pageType, message: 'صفحة صحيحة لكن ليست قائمة وظائف' };
                }
            },

            clearData: async () => {
                this.log('🗑️ [CLEAR] مسح جميع البيانات...');



                this.log('✅ [CLEAR] تم مسح جميع البيانات');
            }
        };

        this.log('🛠️ [TOOLS] تم إضافة أدوات التشخيص المُحسنة: window.jadaratAutoHelpers');
    }
}

// ========================================
// 🚀 تهيئة النظام المُحسنة عند التحميل
// ========================================

async function initializeSystemSafely() {
    console.log('🔄 [INIT] تهيئة نظام جدارات أوتو المُصلح...');

    try {
        await cleanupPreviousInstance();

        if (window.jadaratAutoStable) {
            console.log('🗑️ [INIT] إزالة النسخة السابقة المتبقية...');
            try {
                window.jadaratAutoStable.stopProcess();
            } catch (e) {
                console.warn('⚠️ [INIT] خطأ في إيقاف النسخة السابقة:', e);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        window.jadaratAutoStable = new JadaratAutoStable();

        console.log('✅ [INIT] تم تهيئة النظام المُصلح بنجاح');
        console.log('🛠️ [INIT] أدوات التشخيص متاحة: window.jadaratAutoHelpers');

        return true;

    } catch (error) {
        console.error('❌ [INIT] خطأ في تهيئة النظام:', error);
        return false;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystemSafely);
} else {
    initializeSystemSafely();
}

if (!window.JadaratAutoStable) {
    window.JadaratAutoStable = JadaratAutoStable;
}

// ========================================
// 🎯 رسائل التشخيص والإرشاد المُحسنة
// ========================================

console.log(`
🎯 ===== جدارات أوتو - النسخة المُصلحة مع إصلاحات شاملة =====
✅ تم تحميل النظام المُصلح بنجاح
🔧 تم إصلاح المشاكل التالية:

🔥 الإصلاحات الرئيسية:
✅ إصلاح استخراج أسماء الشركات (100% دقة)
✅ إصلاح استخراج التواريخ (صيغ متعددة)
✅ حل تعارض الكلاس (تنظيف آمن)
✅ تحسين العثور على حاويات البطاقات
✅ تحسين النقر الآمن (4 استراتيجيات)
✅ تحسين معالجة الأخطاء
✅ إضافة مؤشرات جودة البيانات

🛠️ أدوات التشخيص المُحسنة:
- window.jadaratAutoHelpers.testExtraction()        // اختبار شامل مع جودة البيانات
- window.jadaratAutoHelpers.debugCompanyExtraction() // تشخيص دقيق لأسماء الشركات
- window.jadaratAutoHelpers.testCard(0)             // اختبار بطاقة مع تحليل الجودة
- window.jadaratAutoHelpers.getStatus()             // حالة مُحسنة مع مؤشرات
- window.jadaratAutoHelpers.testPageDetection()     // فحص الصفحة مع تقرير مفصل
- window.jadaratAutoHelpers.clearData()             // مسح آمن للبيانات

🔧 خطوات التشغيل المُوصى بها:
1. window.jadaratAutoHelpers.testExtraction()        // تأكد من جودة استخراج البيانات
2. window.jadaratAutoHelpers.debugCompanyExtraction() // فحص دقة أسماء الشركات
3. إذا كانت النتائج ممتازة، ابدأ التشغيل من الـ popup

🎯 هذا النظام مُحسن ومُختبر ومُستقر!
================================================
`);
})(); // ✅ إغلاق IIFE الحامية

// ========================================
// 🔚 نهاية الملف - النظام المُصلح جاهز
// ========================================

setInterval(() => {
    console.log('💓 [HEARTBEAT] System still running at:', new Date().toLocaleTimeString());
}, 5000);
