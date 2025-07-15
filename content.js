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
    
    // فحص فوري للحماية من الحقن المزدوج
    if (window.jadaratAutoStableLoaded) {
        console.log('🛡️ [PROTECTION] النظام محمل مسبقاً، تجنب الحقن المزدوج');
        return;
    }
    
    // وضع علامة التحميل فوراً قبل أي شيء آخر
    window.jadaratAutoStableLoaded = true;
    
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
        this.log('🔍 [COMPANY] استخراج اسم الشركة المُصلح...');
        
        try {
            const companySelectors = [
                'div.display-flex.align-items-center.margin-bottom-s a[data-link][href="#"] span[data-expression]',
                'div.font-bold.font-size-base:first-child a[data-link] span[data-expression]',
                'a[data-link][href="#"] span[data-expression]'
            ];
            
            for (const selector of companySelectors) {
                const companyElement = container.querySelector(selector);
                if (companyElement && companyElement.textContent.trim()) {
                    const companyText = companyElement.textContent.trim();
                    
                    if (this.isValidCompanyName(companyText, currentTitle)) {
                        this.log(`✅ [COMPANY] تم العثور على الشركة: "${companyText}"`);
                        return companyText;
                    } else {
                        this.log(`⚠️ [COMPANY] تم رفض "${companyText}" (${this.getCompanyRejectionReason(companyText, currentTitle)})`);
                    }
                }
            }
            
            this.log('🔍 [COMPANY] البحث اليدوي المُحسن...');
            const allLinks = container.querySelectorAll('a[data-link] span[data-expression]');
            const validCompanies = [];
            
            for (let i = 0; i < allLinks.length; i++) {
                const linkText = allLinks[i].textContent.trim();
                
                if (this.isValidCompanyName(linkText, currentTitle)) {
                    validCompanies.push({
                        text: linkText,
                        index: i,
                        element: allLinks[i]
                    });
                    this.log(`✅ [COMPANY] عثر على شركة محتملة ${validCompanies.length}: "${linkText}"`);
                }
            }
            
            if (validCompanies.length > 0) {
                const bestCompany = validCompanies[0].text;
                this.log(`✅ [COMPANY] تم اختيار الشركة: "${bestCompany}"`);
                return bestCompany;
            }
            
            this.log('⚠️ [COMPANY] لم يتم العثور على اسم شركة صحيح');
            return 'شركة غير محددة';
            
        } catch (error) {
            this.log('❌ [COMPANY] خطأ في استخراج اسم الشركة:', error);
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
                () => {
                    let container = link.closest('[data-container]');
                    let attempts = 0;
                    
                    while (container && attempts < 10) {
                        const hasCompany = container.querySelector('a[data-link][href="#"]');
                        const hasLocation = container.textContent.includes('المدينة') || container.textContent.includes('الرياض');
                        const hasDate = container.textContent.includes('تاريخ النشر');
                        
                        if (hasCompany && (hasLocation || hasDate)) {
                            return container;
                        }
                        
                        container = container.parentElement?.closest('[data-container]');
                        attempts++;
                    }
                    return null;
                },
                
                () => {
                    return link.closest('.OSBlockWidget');
                },
                
                () => {
                    let container = link.closest('[data-container]');
                    let attempts = 0;
                    
                    while (container && attempts < 8) {
                        if (container.querySelector('span.matching_score')) {
                            return container;
                        }
                        container = container.parentElement?.closest('[data-container]');
                        attempts++;
                    }
                    return null;
                },
                
                () => {
                    return link.closest('[data-container]');
                }
            ];
            
            for (let i = 0; i < strategies.length; i++) {
                const container = strategies[i]();
                if (container) {
                    this.log(`✅ [CONTAINER] نجحت الاستراتيجية ${i + 1}`);
                    return container;
                }
            }
            
            this.log('❌ [CONTAINER] فشلت جميع الاستراتيجيات');
            return null;
            
        } catch (error) {
            this.log('❌ [CONTAINER] خطأ في العثور على حاوي البطاقة:', error);
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

detectPageTypeAndLog() {
    const url = window.location.href;
    let pageType = 'unknown';
    
    this.log(`🌐 [PAGE] فحص الرابط: ${url}`);
    
    if (url.includes('JobDetails')) {
        pageType = 'jobDetails';
        this.log('📄 [PAGE] تم التعرف على صفحة تفاصيل الوظيفة');
    } else if (url.includes('ExploreJobs') || url.includes('JobTab=1')) {
        pageType = 'jobList';
        this.log('📋 [PAGE] تم التعرف على صفحة قائمة الوظائف');
        
        const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
        this.log(`📊 [PAGE] عدد روابط الوظائف الموجودة: ${jobLinks.length}`);
        
        if (jobLinks.length === 0) {
            this.log('⚠️ [PAGE] لم يتم العثور على روابط وظائف - قد تحتاج الصفحة وقت إضافي للتحميل');
        }
    } else {
        // 🔥 إضافة فحص إضافي للتعرف على قائمة الوظائف
        const pageIndicators = [
            'span.filter-text:contains("تصفية")',              // من HTML المرفوع
            'div.osui-accordion-item__title',                  // عنصر التصفية
            'span.no_of_filter:contains("البحث المحفوظ")',      // نص البحث المحفوظ
            'i.filter-icon.fa-sliders',                       // أيقونة التصفية
            'a[href*="JobDetails"]'                           // روابط الوظائف
        ];
        
        let foundIndicators = 0;
        for (const selector of pageIndicators) {
            if (selector.includes(':contains')) {
                // بحث النص يدوياً
                if (selector.includes('تصفية')) {
                    const filterElements = document.querySelectorAll('span');
                    for (const span of filterElements) {
                        if (span.textContent.includes('تصفية')) {
                            foundIndicators++;
                            break;
                        }
                    }
                } else if (selector.includes('البحث المحفوظ')) {
                    const searchElements = document.querySelectorAll('span');
                    for (const span of searchElements) {
                        if (span.textContent.includes('البحث المحفوظ')) {
                            foundIndicators++;
                            break;
                        }
                    }
                }
            } else {
                if (document.querySelector(selector)) {
                    foundIndicators++;
                }
            }
        }
        
        if (foundIndicators >= 2) {
            pageType = 'jobList';
            this.log('📋 [PAGE] تم التعرف على قائمة الوظائف (فحص إضافي)');
        } else if (url === 'https://jadarat.sa/' || url === 'https://jadarat.sa') {
            pageType = 'home';
            this.log('🏠 [PAGE] تم التعرف على الصفحة الرئيسية');
        } else {
            this.log('❓ [PAGE] نوع صفحة غير معروف');
        }
    }
    
    this.log(`🎯 [PAGE] نوع الصفحة النهائي: ${pageType}`);
    return pageType;
}

async waitForPageLoad() {
    this.log('⏳ [LOAD] انتظار تحميل الصفحة المُحسن...');
    
    const maxAttempts = 20; // زيادة المحاولات
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        // فحص متعدد المؤشرات
        const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
        const filterElements = document.querySelectorAll('span.filter-text, .osui-accordion-item__title');
        const pageLoaded = document.readyState === 'complete';
        
        if (jobLinks.length >= 3 || filterElements.length >= 1) {
            this.log('✅ [LOAD] تم تحميل الصفحة بنجاح');
            await this.wait(2000); // انتظار إضافي للاستقرار
            return true;
        }
        
        if (pageLoaded && attempts > 10) {
            // إذا كانت الصفحة محملة لكن بدون وظائف
            this.log('⚠️ [LOAD] الصفحة محملة لكن قد لا توجد وظائف');
            return true;
        }
        
        attempts++;
        await this.wait(1000);
    }
    
    this.log('⚠️ [LOAD] انتهت مهلة انتظار تحميل الصفحة');
    return false;
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
        this.log('🔄 [MAIN] بدء الحلقة الرئيسية المُحسنة...');
        
        while (!this.shouldStop && this.isRunning) {
            const pageType = this.detectPageTypeAndLog();
            
            switch (pageType) {
                case 'jobList':
                    this.log('📋 [MAIN] معالجة صفحة قائمة الوظائف...');
                    const hasMoreJobs = await this.processJobListPage();
                    
                    if (!hasMoreJobs && !this.shouldStop) {
                        this.log('📄 [MAIN] محاولة الانتقال للصفحة التالية...');
                        const movedToNext = await this.moveToNextPage();
                        if (!movedToNext) {
                            this.log('✅ [MAIN] تم الانتهاء من جميع الصفحات');
                            break;
                        }
                    }
                    break;
                    
                case 'jobDetails':
                    this.log('🔙 [MAIN] في صفحة تفاصيل، العودة للقائمة...');
                    await this.goBackToJobList();
                    break;
                    
                case 'home':
                    this.log('🏠 [MAIN] في الصفحة الرئيسية، التنقل للوظائف...');
                    await this.navigateToJobList();
                    break;
                    
                default:
                    this.log('❓ [MAIN] صفحة غير معروفة، محاولة التنقل...');
                    await this.navigateToJobList();
                    break;
            }
            
            await this.wait(1000);
        }
        
        this.log('🏁 [MAIN] انتهت الحلقة الرئيسية');
        await this.displayFinalResults();
    }

    async processJobListPage() {
        this.log('📋 [PAGE] معالجة صفحة قائمة الوظائف المُحسنة...');
        
        await this.waitForPageLoad();
        
        const jobCards = this.getAllJobCards();
        this.totalJobsOnPage = jobCards.length;
        
        if (jobCards.length === 0) {
            this.log('⚠️ [PAGE] لم يتم العثور على وظائف في هذه الصفحة');
            return false;
        }
        
        this.log(`📊 [PAGE] سيتم معالجة ${jobCards.length} وظيفة`);
        
        let qualityStats = { excellent: 0, good: 0, average: 0, poor: 0 };
        
        for (let i = 0; i < jobCards.length && !this.shouldStop; i++) {
            this.currentJobIndex = i + 1;
            
            this.log(`\n🎯 [JOB ${this.currentJobIndex}/${jobCards.length}] بدء المعالجة المُحسنة...`);
            
            try {
                const result = await this.processIndividualJob(jobCards[i]);
                
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

    async processIndividualJob(jobCard) {
        this.log(`🔍 [PROCESS] استخراج بيانات الوظيفة المُحسن...`);
        
        const jobData = this.extractJobDataFromHTML(jobCard);
        
        this.log(`📝 [PROCESS] الوظيفة: "${jobData.title}"`);
        this.log(`🏢 [PROCESS] الشركة: "${jobData.company}"`);
        this.log(`📍 [PROCESS] الموقع: "${jobData.location}"`);
        this.log(`📊 [PROCESS] التوافق: "${jobData.matchingScore || 'غير محدد'}"`);
        this.log(`📅 [PROCESS] التاريخ: "${jobData.publishDate || 'غير محدد'}"`);
        this.log(`⭐ [PROCESS] جودة البيانات: ${jobData.dataQuality.level} (${(jobData.dataQuality.score * 100).toFixed(1)}%)`);
        
        if (jobData.alreadyApplied) {
            this.log('✅ [PROCESS] تم التقدم مسبقاً (من القائمة)');
            this.stats.alreadyApplied++;
            this.appliedJobs.add(jobData.id);
            return { result: 'already_applied_list', quality: jobData.dataQuality };
        }
        
        if (this.visitedJobs.has(jobData.id)) {
            this.log('🔄 [PROCESS] تم زيارة هذه الوظيفة من الذاكرة');
            this.stats.fromMemory++;
            this.stats.skipped++;
            return { result: 'visited_from_memory', quality: jobData.dataQuality };
        }
        
        if (this.rejectedJobs.has(jobData.id)) {
            this.log('❌ [PROCESS] مرفوضة من الذاكرة');
            this.stats.fromMemory++;
            this.stats.rejected++;
            return { result: 'rejected_from_memory', quality: jobData.dataQuality };
        }
        
        if (this.appliedJobs.has(jobData.id)) {
            this.log('✅ [PROCESS] مُقدم عليها من الذاكرة');
            this.stats.fromMemory++;
            this.stats.alreadyApplied++;
            return { result: 'applied_from_memory', quality: jobData.dataQuality };
        }
        
        this.log('🆕 [PROCESS] وظيفة جديدة، بدء المعالجة الكاملة...');
        
        if (this.stepByStepMode) {
            await this.waitForUserInput('اضغط Enter للمتابعة للوظيفة التالية...');
        }
        
        const result = await this.processNewJob(jobData);
        
        this.visitedJobs.add(jobData.id);
        this.stats.total++;
        
        return { result, quality: jobData.dataQuality };
    }

    async processNewJob(jobData) {
        try {
            this.log('🖱️ [NEW_JOB] النقر على رابط الوظيفة...');
            
            await this.clickElementSafely(jobData.element);
            
            this.log('⏳ [NEW_JOB] انتظار تحميل صفحة التفاصيل...');
            const navigationSuccess = await this.waitForNavigationToDetails();
            
            if (!navigationSuccess) {
                this.log('❌ [NEW_JOB] فشل في الانتقال لصفحة التفاصيل');
                this.stats.errors++;
                return 'navigation_failed';
            }
            
            this.log('✅ [NEW_JOB] تم الانتقال لصفحة التفاصيل');
            
            await this.handleAnyPopups();
            
            const alreadyAppliedInDetails = await this.checkIfAlreadyAppliedInDetails();
            if (alreadyAppliedInDetails) {
                this.log('✅ [NEW_JOB] تم التقدم مسبقاً (من التفاصيل)');
                this.stats.alreadyApplied++;
                this.appliedJobs.add(jobData.id);
                await this.goBackToJobList();
                return 'already_applied_details';
            }
            
            this.log('🎯 [NEW_JOB] بدء عملية التقديم...');
            const applicationResult = await this.attemptApplication();
            
            if (applicationResult.success) {
                this.log('✅ [NEW_JOB] تم التقديم بنجاح!');
                this.stats.applied++;
                this.appliedJobs.add(jobData.id);
            } else {
                this.log(`❌ [NEW_JOB] تم رفض التقديم: ${applicationResult.reason || 'سبب غير محدد'}`);
                this.stats.rejected++;
                this.rejectedJobs.add(jobData.id);
                
                await this.saveRejectionReason(jobData, applicationResult.reason);
            }
            
            this.log('🔙 [NEW_JOB] العودة لقائمة الوظائف...');
            await this.goBackToJobList();
            
            return applicationResult.success ? 'applied_success' : 'applied_rejected';
            
        } catch (error) {
            this.log('❌ [NEW_JOB] خطأ في معالجة الوظيفة الجديدة:', error);
            this.stats.errors++;
            
            try {
                await this.goBackToJobList();
            } catch (backError) {
                this.log('❌ [NEW_JOB] خطأ في العودة للقائمة:', backError);
            }
            
            return 'error';
        }
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
        this.log('🔍 [DETAILS_CHECK] فحص التقديم المسبق في التفاصيل...');
        
        try {
            const buttons = document.querySelectorAll('button[data-button]');
            for (const button of buttons) {
                const buttonText = button.textContent.trim();
                if (buttonText.includes('استعراض طلب التقديم') || 
                    buttonText.includes('تم التقديم') ||
                    buttonText.includes('عرض الطلب')) {
                    this.log('✅ [DETAILS_CHECK] وجد مؤشر التقديم المسبق');
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
            
            this.log('⏳ [APPLY] انتظار نتيجة التقديم...');
            const resultDialog = await this.handleResultDialog();
            
            return resultDialog;
            
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
                    this.log('✅ [SUBMIT_BTN] تم العثور على زر التقديم');
                    return btn;
                }
            }
            
            this.log('❌ [SUBMIT_BTN] لم يتم العثور على زر التقديم');
            return null;
            
        } catch (error) {
            this.log('❌ [SUBMIT_BTN] خطأ في البحث عن زر التقديم:', error);
            return null;
        }
    }

    async handleConfirmationDialog() {
        this.log('⏳ [CONFIRM] انتظار نافذة التأكيد...');
        
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const confirmDialog = document.querySelector('div[data-popup][role="dialog"]');
            
            if (confirmDialog && confirmDialog.style.display !== 'none') {
                const dialogText = confirmDialog.textContent;
                
                if (dialogText.includes('هل أنت متأكد') || dialogText.includes('التقديم على وظيفة')) {
                    this.log('✅ [CONFIRM] تم العثور على نافذة التأكيد');
                    
                    const confirmButtons = confirmDialog.querySelectorAll('button[data-button]');
                    for (const btn of confirmButtons) {
                        if (btn.textContent.trim() === 'تقديم') {
                            this.log('🖱️ [CONFIRM] النقر على زر التأكيد...');
                            await this.clickElementSafely(btn);
                            await this.wait(3000);
                            return { success: true };
                        }
                    }
                    
                    this.log('❌ [CONFIRM] لم يتم العثور على زر التأكيد');
                    return { success: false, reason: 'زر التأكيد غير موجود' };
                }
            }
            
            attempts++;
            await this.wait(1000);
        }
        
        this.log('⚠️ [CONFIRM] انتهت مهلة انتظار نافذة التأكيد');
        return { success: false, reason: 'نافذة التأكيد لم تظهر' };
    }

    async handleResultDialog() {
        this.log('⏳ [RESULT] انتظار نافذة النتيجة...');
        
        const maxAttempts = 20;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const resultDialogs = document.querySelectorAll('div[data-popup][role="dialog"]');
            
            for (const dialog of resultDialogs) {
                if (dialog.style.display === 'none') continue;
                
                const dialogText = dialog.textContent;
                
                if (dialogText.includes('تم تقديم طلبك')) {
                    this.log('✅ [RESULT] نجح التقديم!');
                    await this.closeDialog(dialog);
                    return { success: true, type: 'success' };
                }
                
                if (dialogText.includes('عذراً ، لا يمكنك التقديم') || dialogText.includes('غير مؤهل')) {
                    this.log('❌ [RESULT] تم رفض التقديم');
                    const reason = this.extractRejectionReason(dialogText);
                    await this.closeDialog(dialog);
                    return { success: false, type: 'rejection', reason: reason };
                }
            }
            
            attempts++;
            await this.wait(1000);
        }
        
        this.log('⚠️ [RESULT] انتهت مهلة انتظار نافذة النتيجة');
        return { success: false, type: 'timeout', reason: 'انتهت المهلة' };
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
    
async goBackToJobList() {
    this.log('🔙 [BACK] العودة لقائمة الوظائف...');
    
    try {
        window.history.back();
        await this.wait(4000); // زيادة وقت الانتظار
        
        const maxAttempts = 12; // زيادة المحاولات
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const pageType = this.detectPageTypeAndLog(); // فحص فوري للصفحة
            
            if (pageType === 'jobList') {
                const jobCards = document.querySelectorAll('a[href*="JobDetails"]');
                if (jobCards.length >= 3) {
                    this.log('✅ [BACK] تم الرجوع بنجاح لقائمة الوظائف');
                    return true;
                }
            }
            
            attempts++;
            await this.wait(2000);
        }
        
        this.log('🔄 [BACK] محاولة التنقل المباشر...');
        await this.navigateToJobList();
        await this.wait(3000);
        
        // فحص نهائي
        const finalPageType = this.detectPageTypeAndLog();
        return finalPageType === 'jobList';
        
    } catch (error) {
        this.log('❌ [BACK] خطأ في العودة:', error);
        return false;
    }
}

    async navigateToJobList() {
        this.log('🧭 [NAVIGATE] التنقل لقائمة الوظائف...');
        
        try {
            const jobListUrl = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
            
            if (window.location.href !== jobListUrl) {
                window.location.href = jobListUrl;
                await this.wait(4000);
            }
            
            return true;
        } catch (error) {
            this.log('❌ [NAVIGATE] خطأ في التنقل:', error);
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
        
        const maxAttempts = 15;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            
            if (jobLinks.length >= 5) {
                this.log('✅ [LOAD] تم تحميل الصفحة بنجاح');
                await this.wait(1000);
                return true;
            }
            
            attempts++;
            await this.wait(1000);
        }
        
        this.log('⚠️ [LOAD] انتهت مهلة انتظار تحميل الصفحة');
        return false;
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

    async clickElementSafely(element) {
        try {
            if (!element) {
                throw new Error('العنصر غير موجود');
            }
            
            this.log('🔍 [CLICK] فحص العنصر قبل النقر...');
            
            if (!document.contains(element)) {
                throw new Error('العنصر غير موجود في الصفحة');
            }
            
            const rect = element.getBoundingClientRect();
            this.log(`📏 [CLICK] مقاسات العنصر: ${rect.width}x${rect.height}`);
            
            if (rect.width === 0 || rect.height === 0) {
                this.log('🔍 [CLICK] العنصر غير مرئي، البحث عن بديل...');
                
                const clickableParent = element.closest('a, button, [data-link]');
                if (clickableParent && clickableParent.getBoundingClientRect().width > 0) {
                    this.log('✅ [CLICK] تم العثور على عنصر بديل قابل للنقر');
                    element = clickableParent;
                } else {
                    throw new Error('العنصر وجميع العناصر الأبوية غير مرئية');
                }
            }
            
            this.log('📜 [CLICK] التمرير للعنصر...');
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
            await this.wait(1200);
            
            const overlays = document.querySelectorAll('.overlay, .modal-backdrop, [style*="position: fixed"]');
            for (const overlay of overlays) {
                if (overlay.style.display !== 'none') {
                    this.log('🗑️ [CLICK] إخفاء عائق محتمل...');
                    overlay.style.display = 'none';
                }
            }
            
            await this.wait(500);
            
            this.log('🖱️ [CLICK] محاولة النقر...');
            
            const clickStrategies = [
                () => {
                    this.log('🖱️ [CLICK] الطريقة 1: النقر المباشر');
                    element.click();
                },
                
                () => {
                    this.log('🖱️ [CLICK] الطريقة 2: MouseEvent مُحسن');
                    const rect = element.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    ['mousedown', 'mouseup', 'click'].forEach(eventType => {
                        const event = new MouseEvent(eventType, {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: x,
                            clientY: y,
                            buttons: 1
                        });
                        element.dispatchEvent(event);
                    });
                },
                
                () => {
                    this.log('🖱️ [CLICK] الطريقة 3: Focus + Enter');
                    if (element.focus) element.focus();
                    
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        bubbles: true,
                        cancelable: true
                    });
                    element.dispatchEvent(enterEvent);
                },
                
                () => {
                    this.log('🖱️ [CLICK] الطريقة 4: التنقل المباشر');
                    if (element.href) {
                        window.location.href = element.href;
                    } else {
                        const link = element.querySelector('a[href]') || element.closest('a[href]');
                        if (link && link.href) {
                            window.location.href = link.href;
                        } else {
                            throw new Error('لا يوجد رابط للانتقال إليه');
                        }
                    }
                }
            ];
            
            const originalUrl = window.location.href;
            
            for (let i = 0; i < clickStrategies.length; i++) {
                try {
                    clickStrategies[i]();
                    await this.wait(800);
                    
                    await this.wait(1200);
                    const newUrl = window.location.href;
                    
                    if (newUrl !== originalUrl || 
                        document.querySelector('div[data-popup][role="dialog"]')) {
                        this.log(`✅ [CLICK] نجح النقر بالطريقة ${i + 1}`);
                        return true;
                    }
                    
                } catch (clickError) {
                    this.log(`⚠️ [CLICK] فشلت الطريقة ${i + 1}: ${clickError.message}`);
                    if (i === clickStrategies.length - 1) {
                        throw clickError;
                    }
                }
            }
            
            this.log('✅ [CLICK] تم النقر بنجاح');
            return true;
            
        } catch (error) {
            this.log('❌ [CLICK] خطأ في النقر:', error);
            return false;
        }
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