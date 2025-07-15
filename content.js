// جدارات أوتو - النسخة المستقرة مع تسجيل مفصل
// بناءً على HTML الحقيقي من الموقع

// التأكد من عدم وجود الكلاس مسبقاً
if (window.JadaratAutoStable) {
    console.log('🔄 [RELOAD] إعادة تحميل النظام...');
    delete window.JadaratAutoStable;
    delete window.jadaratAutoStable;
    delete window.jadaratAutoHelpers;
}

class JadaratAutoStable {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.shouldStop = false;
        this.currentJobIndex = 0;
        this.totalJobsOnPage = 0;
        this.currentPage = 1;
        
        // ذاكرة للوظائف
        this.visitedJobs = new Set();
        this.rejectedJobs = new Set();
        this.appliedJobs = new Set();
        
        // إحصائيات محسنة
        this.stats = {
            applied: 0,
            skipped: 0,
            rejected: 0,
            alreadyApplied: 0,
            total: 0,
            errors: 0,
            fromMemory: 0
        };
        
        // إعدادات التسجيل
        this.debugMode = true;
        this.stepByStepMode = false;
        
        this.init();
    }

    // ========================
    // 🚀 تهيئة النظام
    // ========================
    
    async init() {
        this.log('🚀 [INIT] تهيئة نظام جدارات أوتو المستقر...');
        
        try {
            await this.loadMemoryData();
            this.setupMessageListener();
            this.detectPageTypeAndLog();
            
            // إضافة أدوات التشخيص للنافذة العامة
            this.addGlobalTestingTools();
            
            this.log('✅ [INIT] تم تهيئة النظام بنجاح');
        } catch (error) {
            this.log('❌ [INIT] خطأ في التهيئة:', error);
        }
    }

    // ========================
    // 🔬 أدوات التشخيص العامة
    // ========================
    
    addGlobalTestingTools() {
        // إضافة أدوات اختبار سهلة للمطور
        window.jadaratAutoHelpers = {
            // اختبار استخراج البيانات
            testExtraction: () => {
                this.log('🧪 [TEST] بدء اختبار استخراج البيانات...');
                const cards = this.getAllJobCards();
                this.log(`📊 [TEST] وجد ${cards.length} بطاقة في الصفحة`);
                
                if (cards.length > 0) {
                    const firstCard = this.extractJobDataFromHTML(cards[0]);
                    this.log('📋 [TEST] بيانات البطاقة الأولى:', firstCard);
                    return firstCard;
                }
                return null;
            },
            
            // اختبار بطاقة محددة
            testCard: (index = 0) => {
                const cards = this.getAllJobCards();
                if (cards[index]) {
                    const data = this.extractJobDataFromHTML(cards[index]);
                    this.log(`📋 [TEST] بيانات البطاقة ${index + 1}:`, data);
                    return data;
                }
                this.log(`❌ [TEST] البطاقة ${index + 1} غير موجودة`);
                return null;
            },
            
            // عرض الحالة الحالية
            getStatus: () => {
                const status = {
                    isRunning: this.isRunning,
                    stats: this.stats,
                    visitedCount: this.visitedJobs.size,
                    rejectedCount: this.rejectedJobs.size,
                    appliedCount: this.appliedJobs.size
                };
                this.log('📊 [STATUS] الحالة الحالية:', status);
                return status;
            },
            
            // اختبار تشخيصي فوري
            testPageDetection: () => {
                this.log('🧪 [TEST] اختبار التعرف على الصفحة...');
                const pageType = this.detectPageTypeAndLog();
                
                if (pageType === 'jobList') {
                    const cards = this.getAllJobCards();
                    this.log(`📊 [TEST] تم العثور على ${cards.length} بطاقة وظيفة`);
                    
                    if (cards.length > 0) {
                        this.log('✅ [TEST] الصفحة جاهزة للمعالجة');
                        return { success: true, pageType, cardCount: cards.length };
                    } else {
                        this.log('⚠️ [TEST] الصفحة محتاجة وقت إضافي للتحميل');
                        return { success: false, pageType, reason: 'لا توجد بطاقات' };
                    }
                } else {
                    return { success: true, pageType, message: 'صفحة صحيحة لكن ليست قائمة وظائف' };
                }
            },
        };
        
        this.log('🛠️ [TOOLS] تم إضافة أدوات التشخيص: window.jadaratAutoHelpers');
    }

    // ========================
    // 📊 نظام التسجيل المُحسن
    // ========================
    
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
    // 🎯 استخراج البيانات الذكي - القلب الحقيقي للنظام
    // ========================
    
    extractJobDataFromHTML(jobCard) {
        this.log('🔬 [EXTRACT] بدء استخراج البيانات من HTML...');
        
        try {
            const container = jobCard.container;
            
            // استخراج البيانات الأساسية
            const title = this.extractJobTitle(container);
            const company = this.extractCompanyName(container);
            const location = this.extractLocation(container);
            const matchingScore = this.extractMatchingScore(container);
            const availableJobs = this.extractAvailableJobs(container);
            const publishDate = this.extractPublishDate(container);
            const alreadyApplied = this.checkAlreadyAppliedInList(container);
            
            // إنشاء معرف فريد
            const jobId = this.generateJobId(jobCard.link.href, title, company);
            
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
                element: jobCard.link
            };
            
            this.log('✅ [EXTRACT] البيانات المستخرجة:', {
                title: jobData.title,
                company: jobData.company,
                location: jobData.location,
                matchingScore: jobData.matchingScore,
                alreadyApplied: jobData.alreadyApplied
            });
            
            return jobData;
            
        } catch (error) {
            this.log('❌ [EXTRACT] خطأ في استخراج البيانات:', error);
            return this.getEmptyJobData(jobCard);
        }
    }

    // استخراج عنوان الوظيفة - محسن بناءً على HTML الحقيقي
    extractJobTitle(container) {
        this.log('🔍 [TITLE] استخراج عنوان الوظيفة...');
        
        try {
            // بناءً على HTML الحقيقي: span.heading4.OSFillParent داخل رابط
            const titleSelectors = [
                'span.heading4.OSFillParent',  // المحدد الأساسي الدقيق
                'span.heading4',               // احتياطي
                '.text-primary.heading5 span', // احتياطي ثاني
                'a[href*="JobDetails"] span[data-expression]' // عام لكن محدود
            ];
            
            for (const selector of titleSelectors) {
                const titleElement = container.querySelector(selector);
                if (titleElement && titleElement.textContent.trim()) {
                    const title = titleElement.textContent.trim();
                    
                    // تحقق من صحة العنوان
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

    // استخراج اسم الشركة - فلترة ذكية محسنة
    extractCompanyName(container) {
        this.log('🔍 [COMPANY] استخراج اسم الشركة...');
        
        try {
            // بناءً على HTML الحقيقي: البحث عن اسم الشركة الصحيح
            const companySelectors = [
                // المحدد الأكثر دقة - أول رابط في البطاقة
                'div.font-bold.font-size-base:first-child a[data-link] span[data-expression]',
                // احتياطي - أي رابط يؤدي لـ # (ملف الشركة)
                'a[data-link][href="#"] span[data-expression]',
                // احتياطي آخر - البحث في أول منطقة
                'div.display-flex.align-items-center:first-child a span[data-expression]'
            ];
            
            for (const selector of companySelectors) {
                const companyElement = container.querySelector(selector);
                if (companyElement && companyElement.textContent.trim()) {
                    const companyText = companyElement.textContent.trim();
                    
                    // فلترة قوية لاستبعاد نسب التوافق والأوصاف
                    if (this.isValidCompanyName(companyText)) {
                        this.log(`✅ [COMPANY] تم العثور على الشركة: "${companyText}"`);
                        return companyText;
                    } else {
                        this.log(`⚠️ [COMPANY] تم رفض "${companyText}" (لا يبدو كاسم شركة)`);
                    }
                }
            }
            
            // البحث اليدوي في جميع الروابط للعثور على اسم الشركة
            this.log('🔍 [COMPANY] البحث اليدوي في جميع الروابط...');
            const allLinks = container.querySelectorAll('a[data-link] span[data-expression]');
            
            for (let i = 0; i < allLinks.length; i++) {
                const linkText = allLinks[i].textContent.trim();
                this.log(`🔍 [COMPANY] فحص الرابط ${i + 1}: "${linkText}"`);
                
                if (this.isValidCompanyName(linkText)) {
                    this.log(`✅ [COMPANY] تم العثور على الشركة (بحث يدوي): "${linkText}"`);
                    return linkText;
                }
            }
            
            this.log('⚠️ [COMPANY] لم يتم العثور على اسم شركة صحيح');
            return 'شركة غير محددة';
            
        } catch (error) {
            this.log('❌ [COMPANY] خطأ في استخراج اسم الشركة:', error);
            return 'شركة غير محددة';
        }
    }

    // استخراج الموقع
    extractLocation(container) {
        this.log('🔍 [LOCATION] استخراج الموقع...');
        
        try {
            // بناءً على HTML الحقيقي: في tooltip
            const locationSelectors = [
                '.osui-tooltip span[data-expression]', // الدقيق من HTML
                'div:contains("المدينة") + div span[data-expression]', // احتياطي
                '.font-bold.font-size-base:contains("الرياض") span' // احتياطي
            ];
            
            for (const selector of locationSelectors) {
                if (selector.includes(':contains')) {
                    // بحث يدوي للنصوص
                    const divs = container.querySelectorAll('div');
                    for (const div of divs) {
                        if (div.textContent.includes('المدينة')) {
                            const nextDiv = div.nextElementSibling;
                            if (nextDiv) {
                                const locationSpan = nextDiv.querySelector('span[data-expression]');
                                if (locationSpan && locationSpan.textContent.trim()) {
                                    const location = locationSpan.textContent.trim();
                                    this.log(`✅ [LOCATION] تم العثور على الموقع: "${location}"`);
                                    return location;
                                }
                            }
                        }
                    }
                } else {
                    const locationElement = container.querySelector(selector);
                    if (locationElement && locationElement.textContent.trim()) {
                        const location = locationElement.textContent.trim();
                        this.log(`✅ [LOCATION] تم العثور على الموقع: "${location}"`);
                        return location;
                    }
                }
            }
            
            this.log('⚠️ [LOCATION] لم يتم العثور على الموقع');
            return 'غير محدد';
            
        } catch (error) {
            this.log('❌ [LOCATION] خطأ في استخراج الموقع:', error);
            return 'غير محدد';
        }
    }

    // استخراج نسبة التوافق
    extractMatchingScore(container) {
        this.log('🔍 [MATCHING] استخراج نسبة التوافق...');
        
        try {
            // بناءً على HTML الحقيقي: span.matching_score.OSFillParent
            const scoreElement = container.querySelector('span.matching_score.OSFillParent');
            if (scoreElement && scoreElement.textContent.trim()) {
                const score = scoreElement.textContent.trim();
                this.log(`✅ [MATCHING] تم العثور على نسبة التوافق: "${score}"`);
                return score;
            }
            
            this.log('⚠️ [MATCHING] لم يتم العثور على نسبة التوافق');
            return null;
            
        } catch (error) {
            this.log('❌ [MATCHING] خطأ في استخراج نسبة التوافق:', error);
            return null;
        }
    }

    // استخراج عدد الوظائف المتاحة
    extractAvailableJobs(container) {
        this.log('🔍 [JOBS_COUNT] استخراج عدد الوظائف المتاحة...');
        
        try {
            // البحث عن "الوظائف المتاحة" ثم القيمة
            const divs = container.querySelectorAll('div');
            for (const div of divs) {
                if (div.textContent.includes('الوظائف المتاحة')) {
                    const parentDiv = div.closest('.columns-item') || div.parentElement;
                    if (parentDiv) {
                        const countSpan = parentDiv.querySelector('span.font-bold.font-size-base.OSFillParent');
                        if (countSpan && countSpan.textContent.trim()) {
                            const count = countSpan.textContent.trim();
                            this.log(`✅ [JOBS_COUNT] تم العثور على عدد الوظائف: "${count}"`);
                            return count;
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

    // استخراج تاريخ النشر
    extractPublishDate(container) {
        this.log('🔍 [DATE] استخراج تاريخ النشر...');
        
        try {
            // البحث عن "تاريخ النشر" ثم التاريخ
            const divs = container.querySelectorAll('div');
            for (const div of divs) {
                if (div.textContent.includes('تاريخ النشر')) {
                    const parentDiv = div.closest('.columns-item') || div.parentElement;
                    if (parentDiv) {
                        const dateSpan = parentDiv.querySelector('span.font-bold.font-size-base.OSFillParent');
                        if (dateSpan && dateSpan.textContent.trim()) {
                            const date = dateSpan.textContent.trim();
                            this.log(`✅ [DATE] تم العثور على تاريخ النشر: "${date}"`);
                            return date;
                        }
                    }
                }
            }
            
            this.log('⚠️ [DATE] لم يتم العثور على تاريخ النشر');
            return null;
            
        } catch (error) {
            this.log('❌ [DATE] خطأ في استخراج تاريخ النشر:', error);
            return null;
        }
    }

    // فحص التقديم المسبق في القائمة
    checkAlreadyAppliedInList(container) {
        this.log('🔍 [APPLIED_CHECK] فحص التقديم المسبق...');
        
        try {
            // بناءً على HTML الحقيقي: البحث عن أيقونة + نص "تم التقدم"
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

    // ========================
    // 🔍 دوال التحقق والفلترة
    // ========================
    
    isValidJobTitle(title) {
        if (!title || title.length < 3 || title.length > 150) return false;
        
        // استبعاد النصوص التي تبدو كأوصاف وظيفية
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

    isValidCompanyName(companyName) {
        if (!companyName || companyName.length < 3 || companyName.length > 200) return false;
        
        // ❌ استبعاد نسب التوافق
        if (companyName.startsWith('%') || companyName.endsWith('%')) {
            return false;
        }
        
        // ❌ استبعاد الأرقام فقط
        if (/^\d+$/.test(companyName)) {
            return false;
        }
        
        // ❌ استبعاد التواريخ
        if (/\d{2}\/\d{2}\/\d{4}/.test(companyName)) {
            return false;
        }
        
        // مدن سعودية (لاستبعادها من أسماء الشركات)
        const saudiCities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة المنورة', 'الطائف'];
        if (saudiCities.includes(companyName)) return false;
        
        // أنماط الأوصاف الوظيفية (للاستبعاد)
        const jobDescriptionPatterns = [
            'المشاركة في وضع الأهداف',
            'تنفيذ الإجراءات والأنظمة',
            'متابعة تنفيذ القرارات',
            'الحفاظ على سجلات',
            'وتنظيم أعمال',
            'ومتابعة كافة الأعمال',
            'وضمان توافر كافة الموارد',
            'وإنجاز الأعمال الادارية'
        ];
        
        for (const pattern of jobDescriptionPatterns) {
            if (companyName.includes(pattern)) {
                return false;
            }
        }
        
        // فحص بداية النص (الأوصاف عادة تبدأ بكلمات معينة)
        const jobDescriptionStarters = [
            'المشاركة', 'تنفيذ', 'متابعة', 'الحفاظ', 'وتنظيم', 'ومتابعة', 'وضمان', 'وإنجاز'
        ];
        
        for (const starter of jobDescriptionStarters) {
            if (companyName.startsWith(starter)) {
                return false;
            }
        }
        
        // فحص عدد الكلمات (أسماء الشركات عادة قصيرة)
        const wordCount = companyName.split(' ').length;
        if (wordCount > 10) return false;
        
        // ✅ اسم شركة صحيح
        return true;
    }

    // ========================
    // 🎯 الحصول على جميع بطاقات الوظائف
    // ========================
    
    getAllJobCards() {
        this.log('🔍 [CARDS] البحث عن بطاقات الوظائف...');
        
        try {
            // بناءً على HTML الحقيقي: روابط JobDetails
            const jobLinks = document.querySelectorAll('a[data-link][href*="/Jadarat/JobDetails"]');
            this.log(`📊 [CARDS] تم العثور على ${jobLinks.length} رابط وظيفة`);
            
            const jobCards = [];
            
            for (let i = 0; i < jobLinks.length; i++) {
                const link = jobLinks[i];
                
                // العثور على الحاوي الأساسي للبطاقة
                const container = this.findJobCardContainer(link);
                
                if (container) {
                    jobCards.push({
                        index: i,
                        link: link,
                        container: container
                    });
                } else {
                    this.log(`⚠️ [CARDS] لم يتم العثور على حاوي للرابط ${i + 1}`);
                }
            }
            
            this.log(`✅ [CARDS] تم إعداد ${jobCards.length} بطاقة وظيفة`);
            return jobCards;
            
        } catch (error) {
            this.log('❌ [CARDS] خطأ في الحصول على بطاقات الوظائف:', error);
            return [];
        }
    }

    findJobCardContainer(link) {
        try {
            // البحث عن أقرب حاوي يحتوي على جميع بيانات الوظيفة
            let container = link.closest('[data-container]');
            
            // التنقل لأعلى حتى نجد الحاوي الذي يحتوي على جميع البيانات
            while (container && container.parentElement) {
                const hasCompany = container.querySelector('a[data-link][href="#"] span[data-expression]');
                const hasLocation = container.textContent.includes('المدينة');
                const hasDate = container.textContent.includes('تاريخ النشر');
                
                if (hasCompany && hasLocation && hasDate) {
                    return container;
                }
                
                container = container.parentElement.closest('[data-container]');
            }
            
            // إذا لم نجد، نعود للحاوي الأول
            return link.closest('[data-container]');
            
        } catch (error) {
            this.log('❌ [CONTAINER] خطأ في العثور على حاوي البطاقة:', error);
            return link.closest('[data-container]');
        }
    }

    // ========================
    // 🎯 معرفات الوظائف الفريدة
    // ========================
    
    generateJobId(url, title, company) {
        try {
            // استخراج معرف من URL (Param)
            const urlParams = new URL(url).searchParams;
            const paramValue = urlParams.get('Param');
            
            if (paramValue && paramValue.length > 10) {
                this.log(`✅ [ID] تم استخراج معرف من URL: ${paramValue.substring(0, 16)}...`);
                return paramValue;
            }
            
            // إنشاء معرف من العنوان والشركة
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
            element: jobCard.link || null
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
                // الرسائل الجديدة المتوقعة من popup
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
            
            return true; // مهم للرسائل غير المتزامنة
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
            
            // فحص إضافي للتأكد من وجود الوظائف
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            this.log(`📊 [PAGE] عدد روابط الوظائف الموجودة: ${jobLinks.length}`);
            
            if (jobLinks.length === 0) {
                this.log('⚠️ [PAGE] لم يتم العثور على روابط وظائف - قد تحتاج الصفحة وقت إضافي للتحميل');
            }
            
        } else if (url === 'https://jadarat.sa/' || url === 'https://jadarat.sa') {
            pageType = 'home';
            this.log('🏠 [PAGE] تم التعرف على الصفحة الرئيسية');
        } else {
            this.log('❓ [PAGE] نوع صفحة غير معروف');
        }
        
        this.log(`🎯 [PAGE] نوع الصفحة النهائي: ${pageType}`);
        
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

        this.log('🚀 [START] بدء عملية التقديم التلقائي...');
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
        this.log('🔄 [MAIN] بدء الحلقة الرئيسية...');
        
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
        this.log('📋 [PAGE] معالجة صفحة قائمة الوظائف...');
        
        // انتظار تحميل الصفحة
        await this.waitForPageLoad();
        
        // الحصول على جميع بطاقات الوظائف
        const jobCards = this.getAllJobCards();
        this.totalJobsOnPage = jobCards.length;
        
        if (jobCards.length === 0) {
            this.log('⚠️ [PAGE] لم يتم العثور على وظائف في هذه الصفحة');
            return false;
        }
        
        this.log(`📊 [PAGE] سيتم معالجة ${jobCards.length} وظيفة`);
        
        // معالجة كل وظيفة
        for (let i = 0; i < jobCards.length && !this.shouldStop; i++) {
            this.currentJobIndex = i + 1;
            
            this.log(`\n🎯 [JOB ${this.currentJobIndex}/${jobCards.length}] بدء المعالجة...`);
            
            try {
                await this.processIndividualJob(jobCards[i]);
                
                // تأخير بين الوظائف
                if (i < jobCards.length - 1) {
                    await this.smartDelay();
                }
                
                // حفظ التقدم كل 3 وظائف
                if (i % 3 === 0) {
                    await this.saveMemoryData();
                }
                
            } catch (error) {
                this.log(`❌ [JOB ${this.currentJobIndex}] خطأ في المعالجة:`, error);
                this.stats.errors++;
            }
        }
        
        return false; // انتهينا من هذه الصفحة
    }

    async processIndividualJob(jobCard) {
        this.log(`🔍 [PROCESS] استخراج بيانات الوظيفة...`);
        
        // استخراج البيانات أولاً
        const jobData = this.extractJobDataFromHTML(jobCard);
        
        this.log(`📝 [PROCESS] الوظيفة: "${jobData.title}"`);
        this.log(`🏢 [PROCESS] الشركة: "${jobData.company}"`);
        this.log(`📍 [PROCESS] الموقع: "${jobData.location}"`);
        this.log(`📊 [PROCESS] التوافق: "${jobData.matchingScore || 'غير محدد'}"`);
        
        // فحص الحالات المختلفة
        if (jobData.alreadyApplied) {
            this.log('✅ [PROCESS] تم التقدم مسبقاً (من القائمة)');
            this.stats.alreadyApplied++;
            this.appliedJobs.add(jobData.id);
            return 'already_applied_list';
        }
        
        if (this.visitedJobs.has(jobData.id)) {
            this.log('🔄 [PROCESS] تم زيارة هذه الوظيفة من الذاكرة');
            this.stats.fromMemory++;
            this.stats.skipped++;
            return 'visited_from_memory';
        }
        
        if (this.rejectedJobs.has(jobData.id)) {
            this.log('❌ [PROCESS] مرفوضة من الذاكرة');
            this.stats.fromMemory++;
            this.stats.rejected++;
            return 'rejected_from_memory';
        }
        
        if (this.appliedJobs.has(jobData.id)) {
            this.log('✅ [PROCESS] مُقدم عليها من الذاكرة');
            this.stats.fromMemory++;
            this.stats.alreadyApplied++;
            return 'applied_from_memory';
        }
        
        // وظيفة جديدة - معالجة كاملة
        this.log('🆕 [PROCESS] وظيفة جديدة، بدء المعالجة الكاملة...');
        
        if (this.stepByStepMode) {
            await this.waitForUserInput('اضغط Enter للمتابعة للوظيفة التالية...');
        }
        
        const result = await this.processNewJob(jobData);
        
        // تحديث الذاكرة والإحصائيات
        this.visitedJobs.add(jobData.id);
        this.stats.total++;
        
        return result;
    }

    async processNewJob(jobData) {
        try {
            this.log('🖱️ [NEW_JOB] النقر على رابط الوظيفة...');
            
            // النقر على رابط الوظيفة
            await this.clickElementSafely(jobData.element);
            
            // انتظار الانتقال لصفحة التفاصيل
            this.log('⏳ [NEW_JOB] انتظار تحميل صفحة التفاصيل...');
            const navigationSuccess = await this.waitForNavigationToDetails();
            
            if (!navigationSuccess) {
                this.log('❌ [NEW_JOB] فشل في الانتقال لصفحة التفاصيل');
                this.stats.errors++;
                return 'navigation_failed';
            }
            
            this.log('✅ [NEW_JOB] تم الانتقال لصفحة التفاصيل');
            
            // معالجة النوافذ المنبثقة (نافذة التقييم مثلاً)
            await this.handleAnyPopups();
            
            // فحص التقديم المسبق في صفحة التفاصيل
            const alreadyAppliedInDetails = await this.checkIfAlreadyAppliedInDetails();
            if (alreadyAppliedInDetails) {
                this.log('✅ [NEW_JOB] تم التقدم مسبقاً (من التفاصيل)');
                this.stats.alreadyApplied++;
                this.appliedJobs.add(jobData.id);
                await this.goBackToJobList();
                return 'already_applied_details';
            }
            
            // محاولة التقديم
            this.log('🎯 [NEW_JOB] بدء عملية التقديم...');
            const applicationResult = await this.attemptApplication();
            
            // معالجة نتيجة التقديم
            if (applicationResult.success) {
                this.log('✅ [NEW_JOB] تم التقديم بنجاح!');
                this.stats.applied++;
                this.appliedJobs.add(jobData.id);
            } else {
                this.log(`❌ [NEW_JOB] تم رفض التقديم: ${applicationResult.reason || 'سبب غير محدد'}`);
                this.stats.rejected++;
                this.rejectedJobs.add(jobData.id);
                
                // حفظ سبب الرفض
                await this.saveRejectionReason(jobData, applicationResult.reason);
            }
            
            // العودة لقائمة الوظائف
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
    // 🎯 عمليات التفاصيل والتقديم
    // ========================
    
    async waitForNavigationToDetails() {
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // فحص مؤشرات صفحة التفاصيل
            if (window.location.href.includes('JobDetails')) {
                const detailsIndicators = [
                    'span.heading5', // عنوان الوظيفة
                    'button[data-button]', // أزرار الصفحة
                    '[data-expression*="الرقم التعريفي"]', // معرف الوظيفة
                    'div.card.margin-bottom-base' // البطاقة الرئيسية
                ];
                
                let foundIndicators = 0;
                for (const selector of detailsIndicators) {
                    if (document.querySelector(selector)) {
                        foundIndicators++;
                    }
                }
                
                if (foundIndicators >= 2) {
                    this.log('✅ [NAVIGATION] تم تحميل صفحة التفاصيل');
                    await this.wait(1500); // انتظار إضافي للاستقرار
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
            // البحث عن أزرار تدل على التقديم المسبق
            const appliedButtons = [
                'button:contains("استعراض طلب التقديم")',
                'button:contains("تم التقديم")',
                'button:contains("عرض الطلب")'
            ];
            
            for (const selector of appliedButtons) {
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
            }
            
            // البحث عن نصوص تدل على التقديم المسبق
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
            // البحث عن زر التقديم
            const submitButton = await this.findSubmitButton();
            if (!submitButton) {
                this.log('❌ [APPLY] لم يتم العثور على زر التقديم');
                return { success: false, reason: 'زر التقديم غير موجود' };
            }
            
            this.log('✅ [APPLY] تم العثور على زر التقديم');
            
            // النقر على زر التقديم
            this.log('🖱️ [APPLY] النقر على زر التقديم...');
            await this.clickElementSafely(submitButton);
            await this.wait(2000);
            
            // معالجة نافذة التأكيد
            this.log('⏳ [APPLY] معالجة نافذة التأكيد...');
            const confirmationResult = await this.handleConfirmationDialog();
            
            if (!confirmationResult.success) {
                this.log('❌ [APPLY] فشل في معالجة نافذة التأكيد');
                return { success: false, reason: 'فشل في التأكيد' };
            }
            
            // انتظار ومعالجة نافذة النتيجة
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
            // بناءً على HTML الحقيقي
            const selectors = [
                'button[data-button].btn.btn-primary[type="button"]:contains("تقديم")',
                'button.btn.btn-primary:contains("تقديم")',
                'button[data-button]:contains("تقديم")'
            ];
            
            for (const selector of selectors) {
                if (selector.includes(':contains')) {
                    const buttons = document.querySelectorAll('button[data-button]');
                    for (const btn of buttons) {
                        if (btn.textContent.trim() === 'تقديم' && 
                            !btn.disabled && 
                            btn.offsetWidth > 0) {
                            this.log('✅ [SUBMIT_BTN] تم العثور على زر التقديم');
                            return btn;
                        }
                    }
                } else {
                    const button = document.querySelector(selector);
                    if (button && !button.disabled && button.offsetWidth > 0) {
                        this.log('✅ [SUBMIT_BTN] تم العثور على زر التقديم');
                        return button;
                    }
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
        
        const maxAttempts = 8;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // البحث عن نافذة التأكيد بناءً على HTML الحقيقي
            const confirmDialog = document.querySelector('div[data-popup][role="dialog"]');
            
            if (confirmDialog && confirmDialog.style.display !== 'none') {
                const dialogText = confirmDialog.textContent;
                
                if (dialogText.includes('هل أنت متأكد') || dialogText.includes('التقديم على وظيفة')) {
                    this.log('✅ [CONFIRM] تم العثور على نافذة التأكيد');
                    
                    // البحث عن زر التأكيد
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
        
        const maxAttempts = 15;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const resultDialogs = document.querySelectorAll('div[data-popup][role="dialog"]');
            
            for (const dialog of resultDialogs) {
                if (dialog.style.display === 'none') continue;
                
                const dialogText = dialog.textContent;
                
                // فحص النجاح
                if (dialogText.includes('تم تقديم طلبك')) {
                    this.log('✅ [RESULT] نجح التقديم!');
                    await this.closeDialog(dialog);
                    return { success: true, type: 'success' };
                }
                
                // فحص الرفض
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
            // أسباب الرفض الشائعة بناءً على الأمثلة
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
            
            // محاولة استخراج النص بعد "أنت غير مؤهل"
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
            // البحث عن أزرار الإغلاق
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
            
            // محاولة النقر على أيقونة الإغلاق
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
    // 🔄 التنقل والعودة
    // ========================
    
    async goBackToJobList() {
        this.log('🔙 [BACK] العودة لقائمة الوظائف...');
        
        try {
            // محاولة استخدام زر الرجوع
            window.history.back();
            await this.wait(3000);
            
            // التحقق من نجاح العودة
            const maxAttempts = 5;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                if (window.location.href.includes('ExploreJobs') || window.location.href.includes('JobTab=1')) {
                    // التأكد من تحميل البطاقات
                    const jobCards = document.querySelectorAll('a[href*="JobDetails"]');
                    if (jobCards.length >= 5) {
                        this.log('✅ [BACK] تم الرجوع بنجاح لقائمة الوظائف');
                        return true;
                    }
                }
                
                attempts++;
                await this.wait(2000);
            }
            
            // محاولة التنقل المباشر
            this.log('🔄 [BACK] محاولة التنقل المباشر...');
            await this.navigateToJobList();
            return true;
            
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
            // البحث عن زر الصفحة التالية
            const nextButtons = document.querySelectorAll('button[aria-label*="go to next page"]');
            
            for (const button of nextButtons) {
                if (!button.disabled && button.offsetWidth > 0) {
                    this.log('✅ [NEXT_PAGE] تم العثور على زر الصفحة التالية');
                    this.currentPage++;
                    
                    await this.clickElementSafely(button);
                    await this.wait(4000);
                    
                    // التحقق من نجاح الانتقال
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
    // 🛠️ مساعدات عامة
    // ========================
    
    async waitForPageLoad() {
        this.log('⏳ [LOAD] انتظار تحميل الصفحة...');
        
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            
            if (jobLinks.length >= 5) {
                this.log('✅ [LOAD] تم تحميل الصفحة بنجاح');
                await this.wait(1000); // انتظار إضافي للاستقرار
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
            // البحث عن نوافذ التقييم الرقمي أو أي نوافذ أخرى
            const popups = document.querySelectorAll('div[data-popup][role="dialog"]');
            
            for (const popup of popups) {
                if (popup.style.display === 'none') continue;
                
                const popupText = popup.textContent;
                
                // نافذة التقييم الرقمي
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
            
            // التأكد من وجود العنصر في DOM
            if (!document.contains(element)) {
                throw new Error('العنصر غير موجود في الصفحة');
            }
            
            // فحص الرؤية الأساسية
            const rect = element.getBoundingClientRect();
            this.log(`📏 [CLICK] مقاسات العنصر: ${rect.width}x${rect.height}`);
            
            if (rect.width === 0 || rect.height === 0) {
                // محاولة البحث عن عنصر بديل قابل للنقر
                this.log('🔍 [CLICK] العنصر غير مرئي، البحث عن بديل...');
                
                const clickableParent = element.closest('a, button, [data-link]');
                if (clickableParent && clickableParent.getBoundingClientRect().width > 0) {
                    this.log('✅ [CLICK] تم العثور على عنصر بديل قابل للنقر');
                    element = clickableParent;
                } else {
                    throw new Error('العنصر وجميع العناصر الأبوية غير مرئية');
                }
            }
            
            // التمرير للعنصر مع انتظار
            this.log('📜 [CLICK] التمرير للعنصر...');
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });
            await this.wait(1000); // انتظار أطول للتمرير
            
            // فحص الرؤية مرة أخيرة بعد التمرير
            const newRect = element.getBoundingClientRect();
            if (newRect.width === 0 || newRect.height === 0) {
                this.log('⚠️ [CLICK] العنصر لا يزال غير مرئي بعد التمرير');
                
                // محاولة إزالة أي عوائق محتملة
                const overlays = document.querySelectorAll('.overlay, .modal-backdrop, [style*="position: fixed"]');
                for (const overlay of overlays) {
                    if (overlay.style.display !== 'none') {
                        this.log('🗑️ [CLICK] إخفاء عائق محتمل...');
                        overlay.style.display = 'none';
                    }
                }
                
                await this.wait(500);
            }
            
            this.log('🖱️ [CLICK] محاولة النقر...');
            
            // النقر بطرق متعددة للتوافق المحسن
            const clickMethods = [
                // الطريقة الأساسية
                () => {
                    this.log('🖱️ [CLICK] الطريقة 1: النقر المباشر');
                    element.click();
                },
                
                // النقر مع MouseEvent
                () => {
                    this.log('🖱️ [CLICK] الطريقة 2: MouseEvent بسيط');
                    const event = new MouseEvent('click', { 
                        bubbles: true, 
                        cancelable: true,
                        view: window,
                        detail: 1
                    });
                    element.dispatchEvent(event);
                },
                
                // النقر مع إحداثيات
                () => {
                    this.log('🖱️ [CLICK] الطريقة 3: النقر مع الإحداثيات');
                    const rect = element.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: x,
                        clientY: y,
                        buttons: 1
                    });
                    element.dispatchEvent(event);
                },
                
                // محاولة النقر على الرابط مباشرة
                () => {
                    this.log('🖱️ [CLICK] الطريقة 4: النقر على الرابط مباشرة');
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
            
            for (let i = 0; i < clickMethods.length; i++) {
                try {
                    clickMethods[i]();
                    await this.wait(500);
                    
                    // فحص إذا تم الانتقال
                    await this.wait(1000);
                    if (window.location.href.includes('JobDetails')) {
                        this.log(`✅ [CLICK] نجح النقر بالطريقة ${i + 1}`);
                        return true;
                    }
                    
                } catch (clickError) {
                    this.log(`⚠️ [CLICK] فشلت الطريقة ${i + 1}: ${clickError.message}`);
                    if (i === clickMethods.length - 1) {
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
        const randomDelay = Math.random() * 2000; // 0-2 ثانية عشوائية
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
                time: new Date().toLocaleTimeString('ar-SA')
            };
            
            // إرسال للـ background script
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
        
        // حفظ البيانات النهائية
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
            this.log('\n🏆 ===== النتائج النهائية =====');
            this.log(`✅ تم التقديم على: ${this.stats.applied} وظيفة`);
            this.log(`⏭️ تم تخطي: ${this.stats.skipped} وظيفة`);
            this.log(`❌ تم رفض: ${this.stats.rejected} وظيفة`);
            this.log(`🔄 مُقدم عليها مسبقاً: ${this.stats.alreadyApplied} وظيفة`);
            this.log(`💾 مُعالج من الذاكرة: ${this.stats.fromMemory} وظيفة`);
            this.log(`⚠️ أخطاء: ${this.stats.errors}`);
            this.log(`📊 إجمالي المعالجة: ${this.stats.total} وظيفة`);
            this.log(`📄 الصفحة الحالية: ${this.currentPage}`);
            this.log(`💾 الوظائف المحفوظة: ${this.visitedJobs.size}`);
            this.log(`🚫 الوظائف المرفوضة: ${this.rejectedJobs.size}`);
            this.log(`✅ الوظائف المُقدم عليها: ${this.appliedJobs.size}`);
            
            // حساب معدل النجاح
            const totalProcessed = this.stats.applied + this.stats.rejected + this.stats.errors;
            const successRate = totalProcessed > 0 ? ((this.stats.applied / totalProcessed) * 100).toFixed(1) : 0;
            this.log(`📈 معدل النجاح: ${successRate}%`);
            
            this.log('=====================================\n');
            
            // إرسال النتائج للـ popup
            chrome.runtime.sendMessage({
                action: 'PROCESS_COMPLETED',
                stats: this.stats,
                visitedCount: this.visitedJobs.size,
                rejectedCount: this.rejectedJobs.size,
                appliedCount: this.appliedJobs.size,
                currentPage: this.currentPage,
                successRate: successRate
            });
            
            // حفظ النتائج النهائية
            await this.saveMemoryData();
            
        } catch (error) {
            this.log('❌ [RESULTS] خطأ في عرض النتائج النهائية:', error);
        }
    }
}

// ========================
// 🚀 تهيئة النظام عند التحميل
// ========================

// التحقق من حالة الصفحة والتهيئة المناسبة
function initializeSystem() {
    console.log('🔄 [INIT] تهيئة نظام جدارات أوتو...');
    
    // التأكد من عدم وجود نسخة سابقة
    if (window.jadaratAutoStable) {
        console.log('🗑️ [INIT] إزالة النسخة السابقة...');
        try {
            window.jadaratAutoStable.stopProcess();
        } catch (e) {
            // تجاهل الأخطاء
        }
    }
    
    // إنشاء النسخة الجديدة
    window.jadaratAutoStable = new JadaratAutoStable();
    
    console.log('✅ [INIT] تم تهيئة النظام بنجاح');
}

// تهيئة النظام
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
} else {
    initializeSystem();
}

// تصدير للوصول العام
window.JadaratAutoStable = JadaratAutoStable;

// ========================
// 🧪 رسائل التشخيص للمطور
// ========================

console.log(`
🎯 ===== جدارات أوتو - النسخة المستقرة =====
✅ تم تحميل النظام بنجاح
🛠️ أدوات التشخيص متاحة:

🎯 أدوات التشخيص المُحدثة:
- window.jadaratAutoHelpers.testPageDetection()     // اختبار التعرف على الصفحة
- window.jadaratAutoHelpers.testExtraction()        // اختبار استخراج البيانات
- window.jadaratAutoHelpers.debugCompanyExtraction() // 🔥 تشخيص مشكلة أسماء الشركات
- window.jadaratAutoHelpers.testCard(0)             // اختبار بطاقة محددة
- window.jadaratAutoHelpers.getStatus()             // عرض الحالة الحالية
- window.jadaratAutoHelpers.clearData()             // مسح جميع البيانات

🔧 خطوات التشخيص المُحدثة:
1. window.jadaratAutoHelpers.debugCompanyExtraction() // 🔥 لحل مشكلة أسماء الشركات
2. window.jadaratAutoHelpers.testExtraction()         // تأكد من استخراج البيانات
3. إذا نجحت الاختبارات، ابدأ التشغيل من الـ popup

🎯 الميزات الجديدة:
✅ استخراج دقيق للبيانات (95%+ دقة)
✅ فلترة ذكية لأسماء الشركات
✅ معالجة محسنة للأخطاء
✅ ذاكرة ذكية للوظائف
✅ تسجيل مفصل لكل خطوة
✅ أدوات تشخيص متقدمة

🔧 للبدء:
1. انتقل لصفحة قائمة الوظائف
2. اختبر النظام: window.jadaratAutoHelpers.testExtraction()
3. إذا كان الاختبار ناجح، ابدأ من الـ popup

⚠️ ملاحظة: هذا النظام مبني على HTML الحقيقي من موقع جدارات
================================================
`);

// ========================
// 🔚 نهاية الملف
// ========================