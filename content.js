// جدارات أوتو - Content Script المُحسن والمُصحح بالكامل
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى الذكي المحسن والمصحح');

// منع التكرارة
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
        this.visitedJobs = new Set();  // قائمة الوظائف المزارة (الأهم - لمنع التكرار)
        this.rejectedJobs = new Set(); // قائمة الوظائف المرفوضة (للإحصائيات)
        
        this.loadVisitedJobs();  // تحميل قائمة الوظائف المزارة
        this.loadRejectedJobs(); // تحميل قائمة الوظائف المرفوضة

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
// نظام إدارة ذاكرة الوظائف
// ===============================





// ===============================
// نظام إدارة الوظائف المرفوضة
// ===============================

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

// 🆕 تسجيل وظيفة كمزارة فور الدخول عليها
// 📝 تسجيل محسن للوظائف المزارة مع بيانات تفصيلية
markJobAsVisited(jobCard) {
    try {
        const jobIds = this.generateJobIdentifiers(jobCard);
        const jobData = this.extractJobDataFromHTML(jobCard);
        
        this.debugLog(`📝 تسجيل وظيفة كمزارة:`);
        this.debugLog(`   📋 العنوان: ${jobData.title}`);
        this.debugLog(`   🏢 الشركة: ${jobData.company}`);
        this.debugLog(`   🏙️ المدينة: ${jobData.city || 'غير محدد'}`);
        this.debugLog(`   📊 نسبة التوافق: ${jobData.matchingScore || 'غير محدد'}`);
        this.debugLog(`   📅 تاريخ النشر: ${jobData.publishDate || 'غير محدد'}`);
        
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
        
        // عرض المعرفات المحفوظة للتأكد
        this.debugLog(`🔐 المعرفات المحفوظة:`);
        for (let i = 0; i < Math.min(jobIds.length, 3); i++) {
            const id = jobIds[i];
            const type = i === 0 ? 'أساسي' : i === 1 ? 'ثانوي' : 'احتياطي';
            this.debugLog(`   ${i + 1}. ${type}: ${id.substring(0, 50)}...`);
        }
        
        // حفظ فوري في التخزين
        this.saveVisitedJobs();
        
        // التأكد من الحفظ
        setTimeout(() => {
            if (this.isJobVisited(jobCard)) {
                this.debugLog(`✅ تأكيد: تم حفظ الوظيفة بنجاح في الذاكرة`);
            } else {
                this.debugLog(`❌ تحذير: فشل في حفظ الوظيفة في الذاكرة!`);
            }
        }, 1000);
        
    } catch (error) {
        this.debugLog('❌ خطأ في تسجيل الوظيفة كمزارة:', error);
        
        // حفظ طوارئ بمعرف بسيط
        const emergencyId = `emergency_${jobCard.title}_${Date.now()}`;
        this.visitedJobs.add(emergencyId);
        this.saveVisitedJobs();
        this.debugLog(`🚨 تم حفظ معرف طوارئ: ${emergencyId}`);
    }
}

// 🆕 فحص إذا كانت الوظيفة مزارة سابقاً
// 🔍 فحص محسن للوظائف المزارة مع تفاصيل أكثر
isJobVisited(jobCard) {
    try {
        const jobIds = this.generateJobIdentifiers(jobCard);
        const jobData = this.extractJobDataFromHTML(jobCard);
        
        this.debugLog(`🔍 فحص زيارة الوظيفة: ${jobData.title} | ${jobData.company} | ${jobData.city}`);
        
        // فحص كل معرف مع إظهار أيهم تطابق
        for (let i = 0; i < jobIds.length; i++) {
            const id = jobIds[i];
            if (this.visitedJobs.has(id)) {
                this.debugLog(`🚫 وظيفة مزارة سابقاً!`);
                this.debugLog(`   📝 العنوان: ${jobData.title}`);
                this.debugLog(`   🏢 الشركة: ${jobData.company}`);
                this.debugLog(`   🏙️ المدينة: ${jobData.city}`);
                this.debugLog(`   🔑 المعرف المطابق: ${id.substring(0, 40)}...`);
                this.debugLog(`   📊 المرتبة: ${i + 1}/${jobIds.length} (${i === 0 ? 'أساسي' : i === 1 ? 'ثانوي' : 'احتياطي'})`);
                return true;
            }
        }
        
        this.debugLog(`✅ وظيفة جديدة غير مزارة: ${jobData.title} | ${jobData.company}`);
        this.debugLog(`🔑 سيتم إنشاء ${jobIds.length} معرف جديد لحفظها`);
        return false;
        
    } catch (error) {
        this.debugLog('❌ خطأ في فحص زيارة الوظيفة:', error);
        // في حالة الخطأ، نعتبرها غير مزارة لتجنب تفويت وظائف
        return false;
    }
}

// 🆕 توليد معرفات شاملة للوظيفة (أقوى من النظام السابق)
// 🆕 توليد معرفات موثوقة مبنية على البيانات الحقيقية
generateJobIdentifiers(jobCard) {
    const identifiers = [];
    
    try {
        // استخراج البيانات الشاملة أولاً
        const jobData = this.extractJobDataFromHTML(jobCard);
        
        this.debugLog(`🔑 توليد معرفات للوظيفة:`, {
            title: jobData.title,
            company: jobData.company,
            city: jobData.city,
            matching: jobData.matchingScore
        });

        // تنظيف النصوص للاستخدام في المعرفات
        const cleanTitle = this.cleanTextForId(jobData.title);
        const cleanCompany = this.cleanTextForId(jobData.company);
        const cleanCity = this.cleanTextForId(jobData.city);

        // المعرف الأساسي: شركة + وظيفة + مدينة (الأقوى والأوثق)
        if (cleanCompany && cleanTitle && cleanCity) {
            const primaryId = `${cleanCompany}_${cleanTitle}_${cleanCity}`;
            identifiers.push(primaryId);
            this.debugLog(`🔑 معرف أساسي: ${primaryId}`);
        }

        // المعرف الثانوي: شركة + وظيفة (بدون مدينة)
        if (cleanCompany && cleanTitle) {
            const secondaryId = `${cleanCompany}_${cleanTitle}`;
            identifiers.push(secondaryId);
            this.debugLog(`🔑 معرف ثانوي: ${secondaryId}`);
        }

        // المعرف الاحتياطي: عنوان الوظيفة + نسبة التوافق
        if (cleanTitle && jobData.matchingScore) {
            const cleanScore = jobData.matchingScore.replace(/[^\d]/g, '');
            const backupId = `title_${cleanTitle}_score_${cleanScore}`;
            identifiers.push(backupId);
            this.debugLog(`🔑 معرف احتياطي: ${backupId}`);
        }

        // معرف بتاريخ النشر (فريد جداً)
        if (cleanCompany && cleanTitle && jobData.publishDate) {
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
        if (cleanCompany && cleanCompany !== 'unknown_company') {
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
        this.debugLog('❌ خطأ في توليد المعرفات الجديدة:', error);
        return [`error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`];
    }
}

// دالة مساعدة لتنظيف النصوص
cleanTextForId(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .trim()
        .replace(/[^\w\u0600-\u06FF]/g, '_')  // استبدال الرموز بـ _
        .replace(/_+/g, '_')                  // دمج _ المتكررة
        .replace(/^_|_$/g, '')                // إزالة _ من البداية والنهاية
        .toLowerCase();
}


// ===============================
// نظام إدارة الوظائف المرفوضة (محسن)
// ===============================

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



// 🆕 فحص إذا كانت الوظيفة مزارة سابقاً


// 🆕 توليد معرفات شاملة للوظيفة (أقوى من النظام السابق)



// ===============================
// نظام إدارة الوظائف المرفوضة (محسن)
// ===============================

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



// ===============================
// نظام إدارة الوظائف المرفوضة (محسن)
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

getJobUniqueId(jobLink) {
    try {
        const url = jobLink.href || jobLink;
        
        // طريقة 1: من parameter Param (الأساسية)
        const paramMatch = url.match(/Param=([^&]+)/);
        if (paramMatch) {
            this.debugLog(`🔍 معرف من Param: ${paramMatch[1].substring(0, 15)}...`);
            return paramMatch[1];
        }
        
        // طريقة 2: من JobDetails مع معرفات طويلة
        const jobDetailsMatch = url.match(/JobDetails.*?([A-Za-z0-9]{20,})/);
        if (jobDetailsMatch) {
            this.debugLog(`🔍 معرف من JobDetails: ${jobDetailsMatch[1].substring(0, 15)}...`);
            return jobDetailsMatch[1];
        }
        
        // طريقة 3: أي معرف طويل (15+ أحرف)
        const longIdMatch = url.match(/([A-Za-z0-9]{15,})/);
        if (longIdMatch) {
            this.debugLog(`🔍 معرف طويل: ${longIdMatch[1].substring(0, 15)}...`);
            return longIdMatch[1];
        }
        
        this.debugLog(`❌ لم يوجد معرف في URL: ${url.substring(0, 50)}...`);
        return null;
        
    } catch (error) {
        this.debugLog(`❌ خطأ في استخراج المعرف:`, error);
        return null;
    }
}
// دالة تحسين jobCard لاستخراج المعرف الصحيح

addJobToRejected(jobCard) {
    const jobLink = jobCard.link;
    let jobParam = null;
    
    this.debugLog(`📝 محاولة حفظ وظيفة مرفوضة: ${jobCard.title}`);
    
    // طريقة 1: من الرابط مباشرة
    if (jobLink && jobLink.href) {
        jobParam = this.getJobUniqueId(jobLink);
        this.debugLog(`🔗 معرف من الرابط: ${jobParam ? jobParam.substring(0, 15) + '...' : 'فارغ'}`);
    } 
    // طريقة 2: من URL الحالي (للوظيفة الحالية)
    else {
        const currentUrl = window.location.href;
        jobParam = this.getJobUniqueId({ href: currentUrl });
        this.debugLog(`🌐 معرف من URL الحالي: ${jobParam ? jobParam.substring(0, 15) + '...' : 'فارغ'}`);
    }
    
    // طريقة 3: من عنوان الوظيفة كبديل ثابت
    if (!jobParam && jobCard.title) {
        jobParam = `title_${btoa(jobCard.title).replace(/[^A-Za-z0-9]/g, '').substring(0, 20)}`;
        this.debugLog(`📝 معرف من العنوان: ${jobParam.substring(0, 15)}...`);
    }
    
    // طريقة 4: معرف طوارئ (لا ينبغي الوصول لهنا)
    if (!jobParam) {
        jobParam = `emergency_${Date.now()}`;
        this.debugLog(`🚨 معرف طوارئ: ${jobParam}`);
    }

    if (jobParam) {
        this.rejectedJobs.add(jobParam);
        this.saveRejectedJobs();
        this.debugLog(`🚫 تم إضافة وظيفة للمرفوضة: ${jobCard.title} (${jobParam.substring(0, 20)}...)`);
        this.debugLog(`📊 إجمالي الوظائف المرفوضة: ${this.rejectedJobs.size}`);
    } else {
        this.debugLog(`❌ فشل في استخراج معرف الوظيفة: ${jobCard.title}`);
    }
}



async clearRejectedJobs() {
    if (confirm('هل أنت متأكد من مسح جميع الوظائف المرفوضة؟\n\n⚠️ هذا سيمسح فقط قائمة الوظائف المرفوضة وليس الوظائف المزارة')) {
        try {
            this.sendMessageFireAndForget({ action: 'CLEAR_REJECTED_JOBS' });
            this.showNotification('تم مسح قائمة الوظائف المرفوضة');
        } catch (error) {
            console.error('Error clearing rejected jobs:', error);
            this.showError('خطأ في مسح الوظائف المرفوضة');
        }
    }
}

// 🆕 دالة جديدة لمسح الوظائف المزارة
async clearVisitedJobs() {
    if (confirm('هل أنت متأكد من مسح جميع الوظائف المزارة؟\n\n⚠️ هذا سيجعل الإضافة تدخل لجميع الوظائف مرة أخرى!')) {
        try {
            this.sendMessageFireAndForget({ action: 'CLEAR_VISITED_JOBS' });
            this.showNotification('تم مسح قائمة الوظائف المزارة');
        } catch (error) {
            console.error('Error clearing visited jobs:', error);
            this.showError('خطأ في مسح الوظائف المزارة');
        }
    }
}

// 🆕 دالة لمسح جميع بيانات الوظائف
async clearAllJobData() {
    if (confirm('هل أنت متأكد من مسح جميع بيانات الوظائف؟\n\n⚠️ هذا سيمسح:\n- الوظائف المزارة\n- الوظائف المرفوضة\n- بيانات الرفض')) {
        try {
            this.sendMessageFireAndForget({ action: 'CLEAR_ALL_JOB_DATA' });
            await chrome.runtime.sendMessage({ action: 'CLEAR_REJECTION_DATA' });
            this.showNotification('تم مسح جميع بيانات الوظائف');
        } catch (error) {
            console.error('Error clearing all job data:', error);
            this.showError('خطأ في مسح جميع البيانات');
        }
    }
}

        // 🔧 نظام التشخيص المتقدم
        debugLog(message, ...args) {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
            const fullMessage = `[${timestamp}] 🎯 ${message}`;
            
            console.log(fullMessage, ...args);
            
            // حفظ في تاريخ التشخيص
            if (window.jadaratAutoDebug) {
                window.jadaratAutoDebug.logs.push({
                    timestamp: new Date().toISOString(),
                    message: fullMessage,
                    args: args
                });
                
                // الاحتفاظ بآخر 1000 رسالة فقط
                if (window.jadaratAutoDebug.logs.length > 1000) {
                    window.jadaratAutoDebug.logs = window.jadaratAutoDebug.logs.slice(-1000);
                }
            }
        }

        // 🚀 نظام الانتظار التكيفي الأساسي
        async waitForCondition(conditionFn, options = {}) {
            const {
                maxWaitTime = 30000,
                interval = 500,
                debugName = 'حالة غير محددة',
                timeoutMessage = 'انتهت مهلة الانتظار'
            } = options;

            const startTime = Date.now();
            let attemptCount = 0;

            this.debugLog(`⏳ بدء انتظار: ${debugName} (حد أقصى: ${maxWaitTime/1000}ث)`);

            return new Promise((resolve, reject) => {
                const checkCondition = () => {
                    attemptCount++;
                    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

                    try {
                        const result = conditionFn();
                        
                        if (result) {
                            this.debugStats.successfulWaits++;
                            this.debugStats.totalWaitTime += Date.now() - startTime;
                            this.debugLog(`✅ ${debugName}: تم بنجاح في ${elapsedTime}ث بعد ${attemptCount} محاولة`);
                            resolve(result);
                            return;
                        }

                        if (Date.now() - startTime >= maxWaitTime) {
                            this.debugStats.failedWaits++;
                            this.debugLog(`❌ ${debugName}: ${timeoutMessage} بعد ${elapsedTime}ث و ${attemptCount} محاولة`);
                            reject(new Error(`${timeoutMessage}: ${debugName}`));
                            return;
                        }

                        // لوج التقدم كل 10 محاولات
                        if (attemptCount % 10 === 0) {
                            this.debugLog(`⏳ ${debugName}: المحاولة ${attemptCount}, الوقت المنقضي: ${elapsedTime}ث`);
                        }

                        setTimeout(checkCondition, interval);

                    } catch (error) {
                        this.debugStats.failedWaits++;
                        this.debugLog(`❌ خطأ في ${debugName}:`, error.message);
                        reject(error);
                    }
                };

                setTimeout(checkCondition, 100);
            });
        }

        // 🎯 انتظار تحميل الوظائف
        async waitForJobsToLoad() {
            this.debugLog('🔍 انتظار تحميل قائمة الوظائف المحسن...');
            
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 60; // 60 ثانية للتحميل
                let observer;
                
                const checkJobsLoaded = () => {
                    attempts++;
                    
                    const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
                    const hasContent = document.body.textContent.length > 5000; // رفع الحد الأدنى
                    const pageReady = document.readyState === 'complete';
                    const hasJobContainer = document.querySelector('[data-list]') || 
                                           document.querySelector('.list') ||
                                           document.querySelector('[data-container]');
                    
                    // فحص أن المحتوى ليس فقط "JavaScript is required"
                    const contentText = document.body.textContent;
                    const hasRealContent = !contentText.includes('JavaScript is required') || 
                                          contentText.length > 3000;
                    
                    this.debugLog(`📊 فحص التحميل - محاولة ${attempts}/${maxAttempts}:
                        - روابط الوظائف: ${jobLinks.length}
                        - طول المحتوى: ${document.body.textContent.length}
                        - الصفحة جاهزة: ${pageReady}
                        - حاوي الوظائف: ${!!hasJobContainer}
                        - محتوى حقيقي: ${hasRealContent}`);
                    
                    const isLoaded = jobLinks.length > 0 && 
                                    hasContent && 
                                    pageReady && 
                                    hasJobContainer && 
                                    hasRealContent;
                    
                    if (isLoaded) {
                        this.debugLog(`✅ تحميل قائمة الوظائف: تم بنجاح في ${attempts}ث - وجد ${jobLinks.length} وظيفة`);
                        
                        if (observer) observer.disconnect();
                        
                        // انتظار إضافي للاستقرار
                        setTimeout(() => {
                            resolve(true);
                        }, 2000);
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        this.debugLog(`❌ انتهت محاولات تحميل قائمة الوظائف بعد ${maxAttempts}ث`);
                        if (observer) observer.disconnect();
                        reject(new Error('فشل في تحميل قائمة الوظائف'));
                        return;
                    }
                    
                    // لوج التقدم كل 15 محاولة
                    if (attempts % 15 === 0) {
                        this.debugLog(`⏳ انتظار الوظائف: ${attempts}/${maxAttempts} - وجد ${jobLinks.length} وظيفة`);
                    }
                    
                    // مواصلة المراقبة
                    setTimeout(checkJobsLoaded, 1000);
                };
                
                // مراقبة تغييرات DOM للاستجابة السريعة
                observer = new MutationObserver((mutations) => {
                    let hasSignificantChange = false;
                    for (const mutation of mutations) {
                        if (mutation.addedNodes.length > 0) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === 1 && // Element node
                                    (node.tagName === 'A' || 
                                     node.querySelector && node.querySelector('a[href*="JobDetails"]'))) {
                                    hasSignificantChange = true;
                                    break;
                                }
                            }
                        }
                        if (hasSignificantChange) break;
                    }
                    
                    if (hasSignificantChange) {
                        setTimeout(checkJobsLoaded, 500);
                    }
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: false
                });
                
                // بدء المراقبة
                setTimeout(checkJobsLoaded, 1000);
            });
        }

        // ⚡ انتظار جاهزية صفحة تفاصيل الوظيفة
        async waitForJobDetailsToLoad() {
            this.debugLog('📄 انتظار تحميل تفاصيل الوظيفة مع مراقبة تلقائية...');
            
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 40; // 40 ثانية حد أقصى
                let observer;
                
                const checkContent = () => {
                    attempts++;
                    
                    // فحص شامل للمحتوى
                    const hasJobTitle = document.querySelector('span.heading5, .heading5');
                    const hasJobBlock = document.querySelector('[data-block="Job.ApplyJob"]') || 
                                       document.querySelector('button[data-button]');
                    const hasJobContent = document.body.textContent.includes('الوصف الوظيفي') ||
                                         document.body.textContent.includes('نوع العمل') ||
                                         document.body.textContent.includes('الرقم التعريفي');
                    const contentLength = document.body.textContent.length;
                    const pageReady = document.readyState === 'complete';
                    const urlCorrect = window.location.href.includes('JobDetails');
                    
                    // شروط النجاح المحسنة
                    const isReady = hasJobTitle && hasJobContent && contentLength > 2000 && pageReady && urlCorrect;
                    
                    if (isReady) {
                        this.debugLog(`✅ تحميل تفاصيل الوظيفة: تم بنجاح في ${(attempts * 0.5).toFixed(1)}ث`);
                        
                        if (observer) observer.disconnect();
                        
                        // انتظار إضافي قصير للاستقرار
                        setTimeout(() => {
                            resolve(true);
                        }, 1500);
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        this.debugLog(`❌ انتهت محاولات تحميل التفاصيل بعد ${maxAttempts * 0.5}ث`);
                        if (observer) observer.disconnect();
                        reject(new Error('فشل في تحميل تفاصيل الوظيفة'));
                        return;
                    }
                    
                    // لوج التقدم كل 10 محاولات
                    if (attempts % 10 === 0) {
                        this.debugLog(`⏳ تحميل التفاصيل: محاولة ${attempts}/${maxAttempts} - المحتوى: ${contentLength} أحرف`);
                    }
                    
                    // مواصلة المراقبة
                    setTimeout(checkContent, 500);
                };
                
                // مراقبة تغييرات DOM للاستجابة السريعة
                observer = new MutationObserver(() => {
                    // إعادة فحص عند تغيير المحتوى
                    setTimeout(checkContent, 100);
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: false
                });
                
                // بدء المراقبة
                setTimeout(checkContent, 300);
            });
        }

        // 🔗 انتظار التنقل التكيفي
        async waitForNavigationAdaptive(initialUrl = null) {
            const startUrl = initialUrl || window.location.href;
            this.debugLog(`🔄 انتظار التنقل من: ${startUrl}`);
            
            return await this.waitForCondition(() => {
                const urlChanged = window.location.href !== startUrl;
                const pageReady = document.readyState === 'complete';
                const hasContent = document.body.textContent.length > 500;
                
                return urlChanged && pageReady && hasContent;
            }, {
                maxWaitTime: 15000,
                interval : 800,
                debugName: 'التنقل بين الصفحات',
                timeoutMessage: 'فشل في التنقل'
            });
        }

        // 🎯 العثور على أزرار التقديم المحتملة والنقر
        async findAndClickSubmitButton() {
            this.debugLog('🔍 البحث التلقائي والنقر فور التحميل...');
            
            // انتظار قصير جداً للاستقرار
            await this.wait(1000);
            
            // البحث الفوري عن الأزرار
            const possibleButtons = this.getAllPossibleSubmitButtons();
            
            if (possibleButtons.length === 0) {
                this.debugLog('🎯 لم توجد أزرار واضحة، البحث في كل العناصر...');
                return await this.tryClickAnySubmitElement();
            }
            
            this.debugLog(`📋 تم العثور على ${possibleButtons.length} زر محتمل - النقر فوراً`);
            
            // جرب النقر على كل زر بدون انتظار طويل
            for (let i = 0; i < possibleButtons.length; i++) {
                const button = possibleButtons[i];
                this.debugLog(`🎯 نقر فوري على الزر ${i + 1}: "${button.textContent.trim()}"`);
                
                const clickResult = await this.tryClickAndCheckResult(button);
                if (clickResult.success) {
                    this.debugLog(`✅ نجح النقر الفوري على الزر ${i + 1}!`);
                    return clickResult;
                }
                
                // انتظار قصير جداً بين المحاولات
                await this.wait(300);
            }
            
            this.debugLog('❌ فشل في جميع أزرار التقديم، محاولة البحث الشامل...');
            return await this.tryClickAnySubmitElement();
        }

getAllPossibleSubmitButtons() {
            this.debugLog('🔍 البحث في HTML الفعلي للموقع...');
            
            // البحث المحسن حسب بنية الموقع الفعلية
            const submitSelectors = [
                'div[data-block="Job.ApplyJob"] button',
                'button[data-button].btn.btn-primary',
                'button.btn.btn-primary[type="button"]',
                'button.btn-primary'
            ];
            
            const possibleButtons = [];
            
            // جرب المحددات المباشرة أولاً
            for (const selector of submitSelectors) {
                try {
                    const buttons = document.querySelectorAll(selector);
                    for (const button of buttons) {
                        if (this.couldBeSubmitButton(button)) {
                            possibleButtons.push(button);
                            this.debugLog(`✅ وجد زر باستخدام: ${selector}`);
                        }
                    }
                } catch (error) {
                    this.debugLog(`⚠️ خطأ في selector: ${selector}`);
                }
            }
            
            // إذا لم نجد شيء، ابحث في كل الأزرار
            if (possibleButtons.length === 0) {
                this.debugLog('🔍 لم توجد أزرار مباشرة، البحث الشامل...');
                
                const allButtons = document.querySelectorAll('button, input[type="submit"], a[role="button"]');
                
                for (const button of allButtons) {
                    if (this.couldBeSubmitButton(button)) {
                        possibleButtons.push(button);
                    }
                }
            }
            
            this.debugLog(`📊 إجمالي الأزرار المحتملة: ${possibleButtons.length}`);
            
            // ترتيب حسب الأولوية
            return this.sortButtonsByPriority(possibleButtons);
        }

        couldBeSubmitButton(element) {
            if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
                return false;
            }
            
            const text = (element.textContent || element.value || element.title || '').trim();
            const className = element.className || '';
            
            // النصوص المحتملة
            const submitTexts = ['تقديم', 'أقدم', 'قدم الآن', 'تقدم', 'Apply', 'Submit'];
            const hasSubmitText = submitTexts.some(submitText => text.includes(submitText));
            
            // الفئات المحتملة
            const submitClasses = ['btn-primary', 'submit', 'apply'];
            const hasSubmitClass = submitClasses.some(cls => className.includes(cls));
            
            return hasSubmitText || hasSubmitClass;
        }

        sortButtonsByPriority(buttons) {
            return buttons.sort((a, b) => {
                const aText = a.textContent.trim();
                const bText = b.textContent.trim();
                const aClass = a.className || '';
                const bClass = b.className || '';
                
                // أولوية عالية: "تقديم" بالضبط + btn-primary
                if (aText === 'تقديم' && aClass.includes('btn-primary')) return -1;
                if (bText === 'تقديم' && bClass.includes('btn-primary')) return 1;
                
                // أولوية متوسطة: "تقديم" بالضبط
                if (aText === 'تقديم') return -1;
                if (bText === 'تقديم') return 1;
                
                // أولوية منخفضة: يحتوي على "تقديم"
                if (aText.includes('تقديم')) return -1;
                if (bText.includes('تقديم')) return 1;
                
                return 0;
            });
        }

        // 🎯 نقر وفحص النتيجة
        async tryClickAndCheckResult(button) {
            try {
                this.debugStats.clickAttempts++;
                
                // نقر مباشر
                this.debugLog(`👆 النقر على: "${button.textContent.trim()}"`);
                await this.clickElementAdaptive(button);
                
                // انتظار قصير للاستجابة
                await this.wait(2000);
                
                // فحص سريع: هل ظهرت نافذة تأكيد؟
                const hasConfirmationModal = this.checkForConfirmationModal();
                if (hasConfirmationModal) {
                    this.debugStats.successfulClicks++;
                    return { success: true, nextStep: 'confirmation' };
                }
                
                // فحص سريع: هل ظهرت نافذة نتيجة مباشرة؟
                const hasResultModal = this.checkForResultModal();
                if (hasResultModal) {
                    this.debugStats.successfulClicks++;
                    return { success: true, nextStep: 'result' };
                }
                
                // فحص: هل تغير شيء في الصفحة؟
                const pageChanged = this.detectPageChange();
                if (pageChanged) {
                    this.debugStats.successfulClicks++;
                    return { success: true, nextStep: 'page_change' };
                }
                
                // لا توجد استجابة واضحة
                return { success: false, reason: 'لا توجد استجابة للنقر' };
                
            } catch (error) {
                this.debugLog(`❌ خطأ في النقر:`, error.message);
                return { success: false, error: error.message };
            }
        }

        checkForConfirmationModal() {
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    if (text.includes('هل أنت متأكد') || text.includes('تأكيد') || text.includes('متأكد من التقديم')) {
                        return true;
                    }
                }
            }
            return false;
        }

        checkForResultModal() {
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    if (text.includes('تم التقديم بنجاح') || text.includes('عذراً') || text.includes('لا يمكنك التقديم')) {
                        return true;
                    }
                }
            }
            return false;
        }

        detectPageChange() {
            // فحص تغييرات في الصفحة تدل على نجاح النقر
            const pageText = document.body.textContent;
            
            // فحص مؤشرات التقديم الناجح
            const successIndicators = [
                'تم التقديم بنجاح',
                'تم التقديم على هذه الوظيفة',
                'طلب مقدم',
                'تقديم مكتمل'
            ];
            
            // فحص وجود زر استعراض بدون CSS selector خاطئ
            const allButtons = document.querySelectorAll('button, a');
            let hasReviewButton = false;
            for (const btn of allButtons) {
                const btnText = btn.textContent.trim();
                if (btnText.includes('استعراض طلب التقديم') || btnText.includes('استعراض الطلب')) {
                    hasReviewButton = true;
                    break;
                }
            }
            
            return successIndicators.some(indicator => pageText.includes(indicator)) || hasReviewButton;
        }

        // 🔄 انتظار نتائج التقديم (كل 5 ثوان)
        async waitForApplicationResult() {
            this.debugLog('⏳ انتظار نتائج التقديم...');
            
            // فحص كل 5 ثوان للنوافذ المنبثقة
            for (let attempt = 1; attempt <= 6; attempt++) {
                this.debugLog(`🔍 فحص النتائج - محاولة ${attempt}/6`);
                
                // فحص نافذة النجاح
                const successModal = this.findSuccessModal();
                if (successModal) {
                    this.debugLog('✅ تم العثور على نافذة النجاح');
                    await this.closeModal(successModal);
                    return { success: true, type: 'success' };
                }
                
                // فحص نافذة الرفض
                const rejectionModal = this.findRejectionModal();
                if (rejectionModal) {
                    const reason = this.extractRejectionReason(rejectionModal.textContent);
                    this.debugLog(`❌ تم العثور على نافذة الرفض: ${reason}`);
                    await this.closeModal(rejectionModal);
                    return { success: false, type: 'rejection', reason: reason };
                }
                
                // فحص: هل تم التقديم بطريقة أخرى؟
                if (this.detectApplicationSubmitted()) {
                    this.debugLog('✅ تم اكتشاف التقديم الناجح من الصفحة');
                    return { success: true, type: 'submitted' };
                }
                
                // انتظار 5 ثوان قبل الفحص التالي
                if (attempt < 6) {
                    await this.wait(5000);
                }
            }
            
            this.debugLog('⚠️ انتهت مهلة انتظار النتائج');
            return { success: false, type: 'timeout', reason: 'انتهت مهلة انتظار النتائج' };
        }

        findSuccessModal() {
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    if (text.includes('تم التقديم بنجاح') || text.includes('نجح التقديم') || text.includes('تم بنجاح')) {
                        return dialog;
                    }
                }
            }
            return null;
        }

        findRejectionModal() {
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                    const text = dialog.textContent;
                    if (text.includes('عذراً') || text.includes('لا يمكنك التقديم') || text.includes('غير مؤهل')) {
                        return dialog;
                    }
                }
            }
            return null;
        }

        detectApplicationSubmitted() {
            const pageText = document.body.textContent;
            const appliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم على هذه الوظيفة',
                'طلب مقدم',
                'تقديم مكتمل'
            ];
            
            return appliedIndicators.some(indicator => pageText.includes(indicator));
        }

        async closeModal(modal) {
            const closeButtons = modal.querySelectorAll('button, a');
            for (const btn of closeButtons) {
                const text = btn.textContent.trim().toLowerCase();
                if (text === 'إغلاق' || text === 'موافق' || text === 'اغلاق') {
                    await this.clickElementAdaptive(btn);
                    await this.wait(1000);
                    return;
                }
            }
            
            // جرب آخر زر إذا لم نجد زر إغلاق واضح
            const allButtons = modal.querySelectorAll('button');
            if (allButtons.length > 0) {
                await this.clickElementAdaptive(allButtons[allButtons.length - 1]);
                await this.wait(1000);
            }
        }

        // 🎯 نقر محسن مع انتظار الجاهزية
        async clickElementAdaptive(element) {
            if (!element) {
                throw new Error('العنصر غير موجود');
            }
            
            this.debugLog(`🎯 تحضير النقر على: ${element.tagName}`);
            
            // انتظار جاهزية العنصر
            await this.waitForCondition(() => {
                return element.offsetWidth > 0 && 
                       element.offsetHeight > 0 &&
                       !element.disabled && 
                       element.style.pointerEvents !== 'none' &&
                       element.style.visibility !== 'hidden';
            }, {
                maxWaitTime: 5000,
                interval: 200,
                debugName: 'جاهزية العنصر للنقر',
                timeoutMessage: 'العنصر غير جاهز للنقر'
            });
            
            const currentUrl = window.location.href;
            
            // تحضير العنصر للنقر
            if (element.tagName === 'A') {
                element.removeAttribute('target');
                element.target = '_self';
            }
            
            // التمرير للعنصر
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            await this.wait(800);
            
            try {
                // جرب النقر المباشر أولاً
                this.debugLog('👆 محاولة النقر المباشر');
                element.click();
                
                await this.wait(2000);
                
                // فحص النجاح
                if (this.hasClickSucceeded(currentUrl)) {
                    this.debugLog('✅ نجح النقر المباشر');
                    return true;
                }
                
                // جرب التنقل المباشر للروابط
                if (element.href && element.tagName === 'A') {
                    this.debugLog('🔗 محاولة التنقل المباشر');
                    window.location.href = element.href;
                    await this.wait(2000);
                    
                    if (this.hasClickSucceeded(currentUrl)) {
                        this.debugLog('✅ نجح التنقل المباشر');
                        return true;
                    }
                }
                
                // جرب الأحداث المتعددة
                this.debugLog('🎯 محاولة الأحداث المتعددة');
                const events = ['mousedown', 'mouseup', 'click'];
                for (const eventType of events) {
                    const event = new MouseEvent(eventType, {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        button: 0
                    });
                    element.dispatchEvent(event);
                    await this.wait(300);
                }
                
                await this.wait(2000);
                
                if (this.hasClickSucceeded(currentUrl)) {
                    this.debugLog('✅ نجحت الأحداث المتعددة');
                    return true;
                }
                
                // جرب النقر على العنصر الأب
                if (element.parentElement) {
                    this.debugLog('🎯 محاولة النقر على العنصر الأب');
                    const parentLink = element.closest('a');
                    if (parentLink && parentLink !== element) {
                        parentLink.click();
                        await this.wait(2000);
                        
                        if (this.hasClickSucceeded(currentUrl)) {
                            this.debugLog('✅ نجح النقر على العنصر الأب');
                            return true;
                        }
                    }
                }
                
                this.debugLog('❌ فشل في جميع محاولات النقر');
                return false;
                
            } catch (error) {
                this.debugLog('❌ خطأ في النقر المتقدم:', error.message);
                throw error;
            }
        }

        hasClickSucceeded(initialUrl) {
            // للروابط: تحقق من تغير URL
            if (window.location.href !== initialUrl) {
                return true;
            }
            
            // للأزرار: تحقق من ظهور نوافذ أو تغيير المحتوى
            if (this.checkForConfirmationModal() || this.checkForResultModal()) {
                return true;
            }
            
            // فحص تغيير عام في الصفحة
            if (this.detectPageChange()) {
                return true;
            }
            
            return false;
        }

        // 🔧 دوال الانتظار المحسنة الأخرى
        async waitForModal(modalType = 'any') {
            this.debugLog(`🔍 انتظار النافذة المنبثقة: ${modalType}`);
            
            return await this.waitForCondition(() => {
                const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
                
                for (const dialog of dialogs) {
                    if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                        const text = dialog.textContent;
                        
                        switch (modalType) {
                            case 'confirmation':
                                if (text.includes('هل أنت متأكد') || text.includes('تأكيد')) {
                                    return dialog;
                                }
                                break;
                            case 'result':
                                if (text.includes('تم التقديم') || text.includes('عذراً')) {
                                    return dialog;
                                }
                                break;
                            case 'any':
                            default:
                                return dialog;
                        }
                    }
                }
                return false;
            }, {
                maxWaitTime: modalType === 'result' ? 30000 : 10000,
                interval: 300,
                debugName: `النافذة المنبثقة (${modalType})`,
                timeoutMessage: `لم تظهر النافذة المطلوبة (${modalType})`
            });
        }

        async waitForPageLoad() {
            this.debugLog('⏳ انتظار تحميل عام للصفحة');
            
            return await this.waitForCondition(() => {
                const readyState = document.readyState === 'complete';
                const hasContent = document.body.textContent.length > 800;
                const hasElements = document.querySelectorAll('button, a, input').length > 3;
                
                return readyState && hasContent && hasElements;
            }, {
                maxWaitTime: 15000,
                interval: 500,
                debugName: 'تحميل الصفحة العام',
                timeoutMessage: 'فشل في تحميل الصفحة'
            });
        }

        // باقي الدوال الأصلية مع تحسينات الانتظار...
        
        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sendResponse);
                return true;
            });
        }

        checkPageType() {
            const url = window.location.href;
            this.debugLog('🔍 تحليل الصفحة الحالية:', url);
            
            if (document.readyState !== 'complete') {
                this.debugLog('⏳ الصفحة لم تكتمل التحميل بعد، الانتظار...');
                setTimeout(() => this.checkPageType(), 2000);
                return;
            }
            
            const pageText = document.body.textContent || '';
            const pageHTML = document.body.innerHTML || '';
            
            this.debugLog('📄 محتوى الصفحة:', {
                textLength: pageText.length,
                htmlLength: pageHTML.length,
                firstText: pageText.substring(0, 200)
            });
            
            // فحص صفحة تفاصيل الوظيفة أولاً
            if (url.includes('JobDetails')) {
                this.debugLog('🔍 URL يحتوي على JobDetails، فحص المحتوى...');
                
                if (pageText.length < 2000) {
                    this.debugLog('⚠️ المحتوى قصير جداً، انتظار إضافي...');
                    this.debugLog(`📊 طول المحتوى الحالي: ${pageText.length} (المطلوب: 2000+)`);
                    setTimeout(() => this.checkPageType(), 8000);
                    return;
                }
                
                if (this.analyzeJobDetailsPage()) {
                    this.pageType = 'jobDetails';
                    this.debugLog('✅ تم تأكيد صفحة تفاصيل الوظيفة');
                    return;
                }
                
                this.debugLog('⚠️ فشل في تحليل صفحة JobDetails، محاولة أخرى...');
                setTimeout(() => this.checkPageType(), 5000);
                return;
            }
            
            // فحص صفحة قائمة الوظائف
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 3;
            const hasPagination = document.querySelector('button[aria-label*="next page"], .pagination') ||
                                 pageHTML.includes('pagination');
            
            this.debugLog(`📊 تحليل عام للصفحة:
                - روابط متعددة: ${hasMultipleJobs} (${jobLinks.length})
                - صفحات: ${hasPagination}
                - URL: ${url}`);
            
            if (hasMultipleJobs || hasPagination || 
                url.includes('ExploreJobs') || 
                url.includes('JobTab=1')) {
                this.pageType = 'jobList';
                this.debugLog('📋 صفحة قائمة الوظائف مؤكدة');
                this.analyzeJobListPage();
                
            } else if (url.includes('jadarat.sa') && 
                      (pageText.includes('البحث عن الوظائف') || pageText.includes('الوظائف المتاحة'))) {
                this.pageType = 'home';
                this.debugLog('🏠 الصفحة الرئيسية مكتشفة');
                
            } else {
                this.pageType = 'unknown';
                this.debugLog(`❓ نوع صفحة غير محدد:
                    - URL: ${url}
                    - طول النص: ${pageText.length}
                    - روابط: ${jobLinks.length}`);
                
                if (pageText.length < 1000) {
                    setTimeout(() => this.checkPageType(), 8000);
                }
            }
        }

        analyzeJobDetailsPage() {
            const pageText = document.body.textContent || '';
            
            const strongIndicators = [
                'الوصف الوظيفي',
                'نوع العمل',
                'الراتب',
                'المؤهلات',
                'الرقم التعريفي'
            ];
            
            const additionalIndicators = [
                'المنطقة',
                'الجنس',
                'الخبرة',
                'تاريخ النشر',
                'شركة',
                'مؤسسة'
            ];
            
            let strongScore = 0;
            let additionalScore = 0;
            const foundIndicators = [];
            
            for (const indicator of strongIndicators) {
                if (pageText.includes(indicator)) {
                    strongScore++;
                    foundIndicators.push(indicator);
                }
            }
            
            for (const indicator of additionalIndicators) {
                if (pageText.includes(indicator)) {
                    additionalScore++;
                    foundIndicators.push(indicator);
                }
            }
            
            const hasJobContent = pageText.includes('وظيفة') || pageText.includes('تقديم');
            
            this.debugLog(`📊 تحليل صفحة JobDetails المحسن:
                - نقاط قوية: ${strongScore}/${strongIndicators.length}
                - نقاط إضافية: ${additionalScore}/${additionalIndicators.length}
                - المؤشرات الموجودة: [${foundIndicators.join(', ')}]
                - محتوى وظيفي: ${hasJobContent}
                - طول النص: ${pageText.length}`);
            
            const isJobDetailsPage = (
                strongScore >= 2 ||
                (strongScore >= 1 && additionalScore >= 2) ||
                (hasJobContent && pageText.length > 800)
            );
            
            if (isJobDetailsPage) {
                const jobTitle = this.extractCurrentJobTitleImproved();
                const isAlreadyApplied = this.checkIfCurrentJobApplied();
                
                this.debugLog(`📝 وظيفة حالية: ${jobTitle}`);
                this.debugLog(`📊 حالة التقديم: ${isAlreadyApplied ? 'مقدم عليها' : 'لم يتم التقديم'}`);
                
                this.resumeData = {
                    type: 'jobDetails',
                    jobTitle: jobTitle,
                    isApplied: isAlreadyApplied,
                    url: window.location.href
                };
                
                return true;
            }
            
            return false;
        }

        extractCurrentJobTitleImproved() {
            const titleSelectors = [
                'span.heading5',
                '.heading5',
                'h1', 'h2', 'h3',
                '.job-title',
                '[data-block*="JobTitle"]',
                '.page-title',
                '.heading4',
                'span[data-expression]',
                'span[style*="font-size"]',
                'div[style*="font-weight: bold"]'
            ];
            
            for (const selector of titleSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (element && element.textContent.trim()) {
                        const title = element.textContent.trim();
                        if (this.isValidJobTitle(title)) {
                            this.debugLog(`✅ وجد عنوان باستخدام ${selector}: ${title}`);
                            return title;
                        }
                    }
                }
            }
            
            const pageText = document.body.textContent || '';
            const lines = pageText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            for (const line of lines) {
                if (this.isValidJobTitle(line) && line.length > 10 && line.length < 100) {
                    const unwantedWords = ['تسجيل', 'دخول', 'بحث', 'قائمة', 'صفحة', 'موقع'];
                    const hasUnwantedWords = unwantedWords.some(word => line.includes(word));
                    
                    if (!hasUnwantedWords) {
                        this.debugLog(`✅ وجد عنوان من النص: ${line}`);
                        return line;
                    }
                }
            }
            
            const idElements = document.querySelectorAll('*');
            for (const element of idElements) {
                if (element.textContent.includes('الرقم التعريفي')) {
                    const parent = element.closest('div, section, article');
                    if (parent) {
                        const titleInParent = this.findTitleInElement(parent);
                        if (titleInParent) {
                            this.debugLog(`✅ وجد عنوان بالقرب من الرقم التعريفي: ${titleInParent}`);
                            return titleInParent;
                        }
                    }
                }
            }
            
            this.debugLog('⚠️ لم يتم العثور على عنوان واضح للوظيفة');
            return 'وظيفة غير محددة';
        }

        isValidJobTitle(text) {
            if (!text || typeof text !== 'string') return false;
            
            text = text.trim();
            
            const minLength = 5;
            const maxLength = 150;
            const isValidLength = text.length >= minLength && text.length <= maxLength;
            
            const isNotOnlyNumbers = !/^\d+$/.test(text);
            const isNotOnlySymbols = !/^[^\w\u0600-\u06FF]+$/.test(text);
            
            const commonTexts = [
                'تفاصيل', 'معلومات', 'صفحة', 'موقع', 'جدارات',
                'تسجيل الدخول', 'بحث', 'قائمة', 'الرئيسية'
            ];
            const isNotCommonText = !commonTexts.some(common => text === common);
            
            const hasValidChars = /[\u0600-\u06FF\w]/.test(text);
            
            return isValidLength && isNotOnlyNumbers && isNotOnlySymbols && 
                   isNotCommonText && hasValidChars;
        }

        findTitleInElement(element) {
            const textNodes = this.getTextNodes(element);
            for (const node of textNodes) {
                const text = node.textContent.trim();
                if (this.isValidJobTitle(text)) {
                    return text;
                }
            }
            return null;
        }

        getTextNodes(element) {
            const textNodes = [];
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        return node.textContent.trim().length > 0 ? 
                               NodeFilter.FILTER_ACCEPT : 
                               NodeFilter.FILTER_REJECT;
                    }
                }
            );
            
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            return textNodes;
        }

        checkIfCurrentJobApplied() {
            const appliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم على هذه الوظيفة',
                'طلب مقدم',
                'تم التقدم',
                'مُقدم عليها',
                'تقديم مكتمل',
                'مقدم سابقاً'
            ];
            
            const pageText = document.body.textContent || '';
            
            for (const indicator of appliedIndicators) {
                if (pageText.includes(indicator)) {
                    this.debugLog(`✅ وجد مؤشر التقديم المسبق: ${indicator}`);
                    return true;
                }
            }
            
            const reviewButtons = document.querySelectorAll('button, a');
            for (const button of reviewButtons) {
                const text = button.textContent.trim();
                if (text.includes('استعراض طلب التقديم') || text.includes('استعراض الطلب')) {
                    this.debugLog('✅ وجد زر "استعراض طلب التقديم"');
                    return true;
                }
            }
            
            this.debugLog('❌ لم يتم العثور على مؤشرات التقديم المسبق');
            return false;
        }

        analyzeJobListPage() {
            this.currentPage = this.extractCurrentPageNumber();
            const totalJobs = document.querySelectorAll('a[href*="JobDetails"]').length;
            
            this.debugLog(`📊 الصفحة الحالية: ${this.currentPage}`);
            this.debugLog(`📋 عدد الوظائف في الصفحة: ${totalJobs}`);
            
            this.resumeData = {
                type: 'jobList',
                currentPage: this.currentPage,
                totalJobs: totalJobs,
                url: window.location.href
            };
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
            this.debugLog('📨 استلام رسالة:', message.action);
            
            try {
                switch (message.action) {
                    case 'PING':
                        const pingResponse = { 
                            status: 'active', 
                            pageType: this.pageType,
                            url: window.location.href,
                            timestamp: Date.now(),
                            debugStats: this.debugStats
                        };
                        sendResponse(pingResponse);
                        break;
                        
                    case 'START_AUTOMATION':
                        sendResponse({ success: true, message: 'بدء الأتمتة...' });
                        
                        setTimeout(async () => {
                            try {
                                this.settings = message.settings || this.settings;
                                this.debugLog('🚀 بدء الأتمتة مع الإعدادات:', this.settings);
                                await this.startSmartAutomation();
                            } catch (error) {
                                this.debugLog('❌ خطأ في بدء الأتمتة:', error);
                                this.sendMessage('AUTOMATION_ERROR', { error: error.message });
                            }
                        }, 100);
                        break;
                        
                    case 'PAUSE_AUTOMATION':
                        sendResponse({ success: true });
                        this.pauseAutomation();
                        break;
                        
                    case 'STOP_AUTOMATION':
                        sendResponse({ success: true });
                        this.stopAutomation();
                        break;
                        case 'CLEAR_REJECTED_JOBS':
                    await this.clearRejectedJobs();
                    sendResponse({ success: true });
                    break;

                case 'GET_REJECTED_COUNT':
                    sendResponse({ count: this.rejectedJobs.size });
                    break;

                // 🆕 دعم إدارة الوظائف المزارة
                case 'CLEAR_VISITED_JOBS':
                    await this.clearVisitedJobs();
                    sendResponse({ success: true });
                    break;

                case 'GET_VISITED_COUNT':
                    sendResponse({ count: this.visitedJobs.size });
                    break;

                case 'CLEAR_ALL_JOB_DATA':
                    await this.clearVisitedJobs();
                    await this.clearRejectedJobs();
                    sendResponse({ success: true });
                    break;

                case 'GET_JOB_STATISTICS':
                    const stats = {
                        visitedJobs: this.visitedJobs.size,
                        rejectedJobs: this.rejectedJobs.size,
                        appliedJobs: this.stats.applied || 0,
                        skippedJobs: this.stats.skipped || 0,
                        totalJobs: this.stats.total || 0
                    };
                    sendResponse({ statistics: stats });
                    break;
                    
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                this.debugLog('❌ خطأ في معالجة الرسالة:', error);
                sendResponse({ success: false, error: error.message });
            }
        }

        pauseAutomation() {
            this.debugLog('⏸️ إيقاف مؤقت');
            this.isPaused = true;
            this.showIndicator('⏸️ متوقف مؤقتاً', '#ffc107');
        }

        stopAutomation() {
            this.debugLog('⏹️ إيقاف نهائي');
            this.isRunning = false;
            this.isPaused = false;
            this.hideIndicator();
        }

        async startSmartAutomation() {
            this.debugLog('🧠 بدء الأتمتة الذكية');
            
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
                        this.showIndicator('❌ صفحة غير مدعومة', '#ff4545', 5000);
                }
            } catch (error) {
                this.debugLog('❌ خطأ في البدء الذكي:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        checkLoginStatus() {
            const loginIndicators = ['تسجيل الدخول', 'دخول', 'Login'];
            const allButtons = document.querySelectorAll('button, a');
            
            for (const btn of allButtons) {
                const text = btn.textContent.trim();
                const isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0;
                
                if (isVisible && loginIndicators.some(indicator => text.includes(indicator))) {
                    if (!btn.href || btn.href.includes('login') || btn.href.includes('signin')) {
                        this.debugLog('❌ المستخدم غير مسجل دخول');
                        return false;
                    }
                }
            }
            
            this.debugLog('✅ المستخدم مسجل دخول');
            return true;
        }

        async startFromJobDetails() {
            this.debugLog('📄 البدء من صفحة تفاصيل الوظيفة');
            
            const jobTitle = this.resumeData?.jobTitle || this.extractCurrentJobTitleImproved();
            
            this.showIndicator(`🔍 معالجة: ${jobTitle}`, '#ffc107');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 10, 
                text: `معالجة الوظيفة الحالية: ${jobTitle}` 
            });

            try {
                const result = await this.processCurrentJob();
                
                if (result.completed) {
                    this.debugLog('✅ تمت معالجة الوظيفة الحالية بنجاح');
                    
                    this.showIndicator('✅ تم! سأعود للقائمة وأكمل باقي الوظائف', '#00ff88', 3000);
                    
                    await this.goBackToJobList();
                    await this.waitForPageLoad();
                    await this.checkPageTypeWithWait();
                    
                    if (this.pageType === 'jobList') {
                        this.debugLog('📋 عدت لقائمة الوظائف، سأكمل باقي الوظائف...');
                        
                        this.sendMessage('UPDATE_PROGRESS', { 
                            progress: 20, 
                            text: 'عدت لقائمة الوظائف، أكمل باقي الوظائف...' 
                        });
                        
                        this.debugLog('⏳ انتظار 3 ثواني قبل متابعة باقي الوظائف...');
                        await this.wait(3000);
                        
                        await this.processCurrentPage();
                    } else {
                        this.debugLog('⚠️ لم أعد لقائمة الوظائف، محاولة التنقل المباشر...');
                        await this.navigateToJobListDirect();
                    }
                } else {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: result.error || 'فشل في معالجة الوظيفة الحالية' 
                    });
                }
                
            } catch (error) {
                this.debugLog('❌ خطأ في startFromJobDetails:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

async processCurrentJob() {
    try {
        const jobTitle = this.resumeData?.jobTitle || this.extractCurrentJobTitleImproved();
        
        this.debugLog(`📝 معالجة الوظيفة الحالية: ${jobTitle}`);
        
        this.sendMessage('UPDATE_CURRENT_JOB', { 
            jobTitle: jobTitle, 
            status: 'processing' 
        });

        await this.handlePopups();
        await this.wait(2000);
        
        const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
        
        if (alreadyApplied) {
            this.debugLog('⏭️ تم التخطي - مُقدم عليها مسبقاً');
            
            this.stats.skipped++;
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobTitle, 
                status: 'skipped' 
            });
            
        } else {
            this.debugLog('📝 بدء عملية التقديم...');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 50, 
                text: 'جاري التقديم على الوظيفة...' 
            });
            
            this.debugLog('🚀 بدء عملية التقديم الفعلية...');
            const applicationResult = await this.applyForJobImproved();
            this.debugLog('📊 نتيجة التقديم:', applicationResult);

            // معالجة النتيجة مباشرة بدون jobCard معقد
            if (applicationResult && (applicationResult.success || applicationResult.type === 'rejection')) {
                if (applicationResult.success) {
                    this.stats.applied++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'success' 
                    });
                    this.debugLog('✅ تم التقديم بنجاح');
                    
                } else if (applicationResult.type === 'rejection') {
                    this.stats.rejected = (this.stats.rejected || 0) + 1;
                    
                    // حفظ الوظيفة المرفوضة بطريقة مبسطة
                    const currentUrl = window.location.href;
                    const jobParam = this.getJobUniqueId({ href: currentUrl });
                    
                    if (jobParam) {
                        this.rejectedJobs.add(jobParam);
                        this.saveRejectedJobs();
                        this.debugLog(`🚫 تم حفظ وظيفة مرفوضة: ${jobTitle} - ${jobParam.substring(0, 15)}...`);
                    }
                    
                    // حفظ بيانات الرفض للتصدير
                    this.saveRejectionData(jobTitle, applicationResult.reason);
                    
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'rejected',
                        reason: applicationResult.reason
                    });
                    this.debugLog('❌ تم رفض التقديم وحفظ في قائمة المرفوضة:', applicationResult.reason);
                }
                
                this.debugLog('✅ تم التعامل مع نتيجة التقديم');
            } else {
                this.debugLog('⚠️ لم يتم التقديم بشكل صحيح، تسجيل كتخطي');
                this.stats.skipped++;
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'skipped',
                    reason: 'فشل في التقديم'
                });
            }
        }

        this.stats.total++;
        this.sendMessage('UPDATE_STATS', { stats: this.stats });
        
        this.sendMessage('UPDATE_PROGRESS', { 
            progress: 80, 
            text: 'تمت معالجة الوظيفة الحالية' 
        });
        
        return { completed: true };

    } catch (error) {
        this.debugLog('❌ خطأ في معالجة الوظيفة الحالية:', error);
        return { completed: false, error: error.message };
    }
}

        // 🚀 عملية التقديم المحسنة الرئيسية
        async applyForJobImproved() {
            this.debugLog('📝 بدء عملية التقديم المحسنة الجديدة');
            
            try {
                await this.wait(2000);
                
                // الخطوة 1: العثور على زر التقديم والنقر عليه
                this.debugLog('🎯 البحث عن زر التقديم والنقر...');
                const clickResult = await this.findAndClickSubmitButton();
                
                if (!clickResult.success) {
                    this.debugLog('❌ فشل في النقر على زر التقديم:', clickResult.reason);
                    return { success: false, reason: clickResult.reason };
                }

                this.debugLog(`✅ نجح النقر! المرحلة التالية: ${clickResult.nextStep}`);
                
                // الخطوة 2: التعامل مع المرحلة التالية
                if (clickResult.nextStep === 'confirmation') {
                    this.debugLog('📋 التعامل مع نافذة التأكيد...');
                    const confirmResult = await this.handleConfirmationModalImproved();
                    
                    if (!confirmResult.success) {
                        this.debugLog('❌ فشل في التعامل مع نافذة التأكيد');
                        return { success: false, reason: 'فشل في التأكيد' };
                    }
                    
                    this.debugLog('✅ تم التأكيد بنجاح');
                }
                
                // الخطوة 3: انتظار النتائج
                this.debugLog('⏳ انتظار نتائج التقديم...');
                const result = await this.waitForApplicationResult();
                
                this.debugLog('📊 النتيجة النهائية:', result);
                return result;

            } catch (error) {
                this.debugLog('❌ خطأ في التقديم المحسن:', error);
                return { success: false, reason: error.message };
            }
        }

        // 📋 معالجة نافذة التأكيد المحسنة
        async handleConfirmationModalImproved() {
            this.debugLog('🔍 البحث عن نافذة التأكيد...');
            
            try {
                const confirmModal = await this.waitForModal('confirmation');
                
                if (!confirmModal) {
                    this.debugLog('⚠️ لم يتم العثور على نافذة التأكيد');
                    return { success: false, reason: 'لم توجد نافذة التأكيد' };
                }
                
                this.debugLog('✅ تم العثور على نافذة التأكيد');
                
                // البحث عن زر التأكيد
                const confirmButtons = confirmModal.querySelectorAll('button, a, input[type="button"]');
                
                for (const btn of confirmButtons) {
                    const btnText = (btn.textContent || btn.value || '').trim();
                    this.debugLog(`🔍 زر في النافذة: "${btnText}"`);
                    
                    if (btnText === 'تقديم' || btnText === 'تأكيد' || btnText === 'موافق') {
                        this.debugLog(`✅ النقر على زر التأكيد: ${btnText}`);
                        await this.clickElementAdaptive(btn);
                        await this.wait(2000);
                        return { success: true };
                    }
                }
                
                this.debugLog('❌ لم يتم العثور على زر التأكيد المناسب');
                return { success: false, reason: 'لم يوجد زر التأكيد' };
                
            } catch (error) {
                this.debugLog('❌ خطأ في معالجة نافذة التأكيد:', error);
                return { success: false, reason: error.message };
            }
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
        async tryClickAnySubmitElement() {
            this.debugLog('🔍 البحث الشامل في جميع العناصر عن نص "تقديم"...');
            
            // البحث في كل العناصر المرئية
            const allElements = document.querySelectorAll('*');
            
            for (const element of allElements) {
                const text = element.textContent ? element.textContent.trim() : '';
                const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
                const isClickable = element.tagName === 'BUTTON' || 
                                   element.tagName === 'A' || 
                                   element.getAttribute('role') === 'button' ||
                                   element.style.cursor === 'pointer';
                
                if (isVisible && isClickable && text && (
                    text === 'تقديم' || 
                    text.includes('استعراض طلب التقديم') ||
                    text.includes('استعراض الطلب')
                )) {
                    this.debugLog(`🎯 وجد عنصر مناسب: ${element.tagName} - "${text}"`);
                    
                    const clickResult = await this.tryClickAndCheckResult(element);
                    if (clickResult.success) {
                        return clickResult;
                    }
                    
                    await this.wait(300);
                }
            }
            
            this.debugLog('❌ لم يوجد أي عنصر قابل للنقر');
            return { success: false, reason: 'لم يوجد أي عنصر قابل للنقر' };
        }
findElementsByText(selector) {
            // دالة مساعدة للبحث بـ :contains() بدون CSS
            const parts = selector.match(/^(\w+):contains\("([^"]+)"\)$/);
            if (!parts) return [];
            
            const tagName = parts[1].toUpperCase();
            const searchText = parts[2];
            
            const elements = document.querySelectorAll(tagName);
            const results = [];
            
            for (const element of elements) {
                if (element.textContent && element.textContent.includes(searchText)) {
                    results.push(element);
                }
            }
            
            return results;
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
                this.debugLog('❌ خطأ في حفظ بيانات الرفض:', error);
            }
        }

        sendMessage(action, data = {}) {
            try {
                const message = { action, ...data };
                
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        this.debugLog('❌ خطأ في إرسال الرسالة:', chrome.runtime.lastError);
                    }
                });
            } catch (error) {
                this.debugLog('❌ خطأ في إرسال الرسالة:', error);
            }
        }

        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async checkPageTypeWithWait() {
            let attempts = 0;
            const maxAttempts = 5;
            
            while (attempts < maxAttempts) {
                this.checkPageType();
                
                if (this.pageType && this.pageType !== 'unknown') {
                    this.debugLog(`✅ تم تحديد نوع الصفحة: ${this.pageType}`);
                    return;
                }
                
                attempts++;
                this.debugLog(`⏳ محاولة ${attempts}/${maxAttempts} لتحديد نوع الصفحة...`);
                await this.wait(2000);
            }
            
            this.debugLog('⚠️ فشل في تحديد نوع الصفحة، استخدام النوع الافتراضي');
            this.pageType = 'unknown';
        }

        async handlePopups() {
            this.debugLog('🔍 فحص النوافذ المنبثقة');
            
            await this.wait(2000);
            
            const popups = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const popup of popups) {
                if (popup.offsetWidth > 0 && popup.offsetHeight > 0) {
                    this.debugLog('💬 تم العثور على نافذة منبثقة');
                    
                    const buttons = popup.querySelectorAll('button, a');
                    for (const btn of buttons) {
                        const btnText = btn.textContent.trim();
                        if (btnText.includes('موافق') || 
                            btnText.includes('إغلاق') ||
                            btnText.includes('×')) {
                            
                            this.debugLog('🚫 إغلاق النافذة المنبثقة');
                            await this.clickElementAdaptive(btn);
                            await this.wait(2000);
                            return;
                        }
                    }
                }
            }
        }

        async checkIfAlreadyAppliedInDetails() {
            this.debugLog('🔍 فحص حالة التقديم في التفاصيل');
            
            await this.wait(2000);
            
            const pageText = document.body.textContent || '';
            
            const appliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم على هذه الوظيفة',
                'طلب مقدم',
                'تم التقدم',
                'مُقدم عليها',
                'تقديم مكتمل'
            ];
            
            for (const indicator of appliedIndicators) {
                if (pageText.includes(indicator)) {
                    this.debugLog(`✅ وجد مؤشر التقديم المسبق: ${indicator}`);
                    return true;
                }
            }
            
            const allButtons = document.querySelectorAll('button, a');
            
            for (const button of allButtons) {
                const text = button.textContent.trim();
                if (text.includes('استعراض طلب التقديم') || text.includes('استعراض الطلب')) {
                    this.debugLog('✅ وجد زر "استعراض طلب التقديم"');
                    return true;
                }
            }
            
            this.debugLog('❌ لم يتم العثور على مؤشرات التقديم المسبق');
            return false;
        }

        async goBackToJobList() {
    this.debugLog('🔙 العودة المحسنة لقائمة الوظائف واستكمال المعالجة...');
    
    const currentUrl = window.location.href;
    this.debugLog(`📍 URL الحالي: ${currentUrl}`);
    
    // حفظ معلومات الصفحة الحالية
    const savedPageInfo = {
        currentPage: this.currentPage,
        currentJobIndex: this.currentJobIndex,
        totalJobs: this.totalJobs
    };
    
    try {
        // الطريقة 1: العودة بـ history.back()
        this.debugLog('🔄 محاولة العودة بـ history.back()');
        window.history.back();
        
        // انتظار التنقل
        await this.waitForCondition(() => {
            return window.location.href !== currentUrl && !window.location.href.includes('JobDetails');
        }, {
            maxWaitTime: 8000,
            interval: 500,
            debugName: 'العودة من التفاصيل',
            timeoutMessage: 'فشل في العودة'
        });
        
        this.debugLog('✅ تم العودة بنجاح');
        
    } catch (error) {
        this.debugLog('❌ فشل في العودة، محاولة التنقل المباشر...');
        
        // الطريقة 2: التنقل المباشر
        const jobListUrl = `https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1&page=${savedPageInfo.currentPage}`;
        window.location.href = jobListUrl;
        
        await this.waitForCondition(() => {
            return window.location.href.includes('ExploreJobs') || window.location.href.includes('JobTab=1');
        }, {
            maxWaitTime: 10000,
            interval: 500,
            debugName: 'التنقل المباشر للقائمة',
            timeoutMessage: 'فشل في التنقل المباشر'
        });
    }
    
    // انتظار تحميل كامل مع إعادة محاولة
    this.debugLog('⏳ انتظار تحميل كامل لقائمة الوظائف...');
    
    let loadSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            this.debugLog(`🔄 محاولة تحميل ${attempt}/3`);
            
            await this.waitForJobsToLoad();
            await this.wait(2000); // انتظار إضافي للاستقرار
            
            // فحص عدد الوظائف
            const jobCount = document.querySelectorAll('a[href*="JobDetails"]').length;
            this.debugLog(`📊 عدد الوظائف بعد العودة: ${jobCount}`);
            
            if (jobCount > 0) {
                loadSuccess = true;
                this.debugLog('✅ تحميل قائمة الوظائف نجح');
                break;
            } else {
                this.debugLog('⚠️ لا توجد وظائف، إعادة تحميل...');
                if (attempt < 3) {
                    window.location.reload();
                    await this.wait(8000);
                }
            }
            
        } catch (error) {
            this.debugLog(`❌ فشلت محاولة التحميل ${attempt}: ${error.message}`);
            if (attempt < 3) {
                window.location.reload();
                await this.wait(8000);
            }
        }
    }
    
    if (!loadSuccess) {
        throw new Error('فشل في تحميل قائمة الوظائف نهائياً');
    }
    
    // استعادة معلومات الصفحة
    this.currentPage = savedPageInfo.currentPage;
    this.currentJobIndex = savedPageInfo.currentJobIndex;
    this.totalJobs = savedPageInfo.totalJobs;
    
    // تحديث نوع الصفحة
    this.checkPageType();
    
    // **الجزء المهم: استكمال معالجة باقي الوظائف**
    this.debugLog('🚀 استكمال معالجة باقي الوظائف في الصفحة...');
    
    // انتظار قصير ثم استكمال
    await this.wait(3000);
    
    // استكمال من النقطة الصحيحة
    await this.continueProcessingCurrentPage();
    
    return true;
}


async continueProcessingCurrentPage() {
    try {
        this.debugLog('🔄 استكمال معالجة الصفحة الحالية مع فحص دقيق...');
        
        // التأكد من أننا في قائمة الوظائف
        if (this.pageType !== 'jobList') {
            this.debugLog('⚠️ لسنا في قائمة الوظائف، تحديد نوع الصفحة...');
            await this.checkPageTypeWithWait();
            
            if (this.pageType !== 'jobList') {
                this.debugLog('❌ ما زلنا لسنا في قائمة الوظائف، محاولة العودة...');
                window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                await this.wait(8000);
                await this.waitForJobsToLoad();
                this.checkPageType();
            }
        }
        
        // انتظار تحميل إضافي
        await this.waitForJobsToLoad();
        
        // الحصول على قائمة الوظائف المحدثة
const jobCards = await this.getJobCards();
        this.debugLog(`📋 وجد ${jobCards.length} وظيفة متاحة للمعالجة`);
        
        if (jobCards.length === 0) {
            this.debugLog('⚠️ لا توجد وظائف متبقية، الانتقال للصفحة التالية...');
            await this.goToNextPage();
            return;
        }
        
        // **التحديث المهم: البدء من الوظيفة التالية وليس من البداية**
        let startIndex = this.currentJobIndex; // البدء من الفهرس الحالي
        this.debugLog(`📍 استكمال من الوظيفة رقم ${startIndex + 1}/${jobCards.length}`);
        
        // التأكد من أن الفهرس صحيح
        if (startIndex >= jobCards.length) {
            this.debugLog('✅ تم الانتهاء من جميع وظائف هذه الصفحة');
            this.currentJobIndex = 0; // إعادة تعيين للصفحة التالية
            await this.goToNextPage();
            return;
        }
        
        // معالجة باقي الوظائف من النقطة الصحيحة
        for (let i = startIndex; i < jobCards.length; i++) {
            if (!this.isRunning || this.isPaused) {
                this.debugLog('🛑 تم إيقاف العملية أثناء المعالجة');
                return;
            }
            
            const jobCard = jobCards[i];
            this.debugLog(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
            
            // تحديث الفهرس الحالي
            this.currentJobIndex = i;
            
            const success = await this.processJobWithRetry(jobCard, i + 1);
            
            if (!success) {
                this.debugLog(`⚠️ فشل في الوظيفة ${i + 1}، الانتقال للتالية`);
            }
            
            // تحديث التقدم
            const progress = ((i + 1) / jobCards.length) * 100;
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: progress, 
                text: `الوظيفة ${i + 1}/${jobCards.length}` 
            });

            // انتظار عشوائي بين الوظائف
            await this.wait(this.getRandomDelay());
        }
        
        // انتهت الصفحة، الانتقال للتالية
        this.debugLog('✅ انتهت معالجة الصفحة، الانتقال للصفحة التالية...');
        this.currentJobIndex = 0; // إعادة تعيين للصفحة الجديدة
        await this.goToNextPage();
        
    } catch (error) {
        this.debugLog('❌ خطأ في استكمال معالجة الصفحة:', error);
        this.sendMessage('AUTOMATION_ERROR', { 
            error: error.message 
        });
    }
}

        async navigateToJobListDirect() {
            this.debugLog('🔄 التنقل المباشر لقائمة الوظائف...');
            
            try {
                const jobListUrls = [
                    'https://jadarat.sa/Jadarat/ExploreJobs',
                    'https://jadarat.sa/Jadarat/?JobTab=1',
                    window.location.origin + '/Jadarat/ExploreJobs'
                ];
                
                const targetUrl = jobListUrls[0];
                this.debugLog('🔗 التنقل إلى:', targetUrl);
                
                window.location.href = targetUrl;
                
                await this.waitForNavigationAdaptive();
                await this.waitForPageLoad();
                await this.checkPageTypeWithWait();
                
                if (this.pageType === 'jobList') {
                    this.debugLog('✅ نجح التنقل لقائمة الوظائف');
                    await this.processCurrentPage();
                } else {
                    throw new Error('فشل في التنقل لقائمة الوظائف');
                }
                
            } catch (error) {
                this.debugLog('❌ خطأ في التنقل المباشر:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'فشل في التنقل لقائمة الوظائف' 
                });
            }
        }

        async startFromJobList() {
            this.debugLog('📋 البدء من قائمة الوظائف');
            
            const pageInfo = this.resumeData || {};
            const currentPage = pageInfo.currentPage || 1;
            
            this.showIndicator(`🚀 العمل في الصفحة ${currentPage}`, '#00ff88');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 0, 
                text: `بدء المعالجة من الصفحة ${currentPage}` 
            });

            await this.processCurrentPage();
        }

        async processCurrentPage() {
            if (!this.isRunning || this.isPaused) return;

            try {
                this.debugLog('🔄 معالجة الصفحة الحالية مع فحص شامل');
                
                // التأكد من أننا في المكان الصحيح
                if (!window.location.href.includes('ExploreJobs') && !window.location.href.includes('JobTab=1')) {
                    this.debugLog('⚠️ لسنا في قائمة الوظائف، التنقل...');
                    window.location.href = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
                    await this.wait(8000);
                }
                
                // انتظار التحميل مع مراقبة مكثفة
                await this.waitForJobsToLoad();
                
                // فحص إضافي للوظائف
                let jobCards = await this.getJobCards();                this.totalJobs = jobCards.length;

                this.debugLog(`💼 تم العثور على ${this.totalJobs} وظيفة`);

                // إذا لم نجد وظائف، جرب إعادة التحميل
                if (this.totalJobs === 0) {
                    this.debugLog('⚠️ لم توجد وظائف، إعادة تحميل وفحص...');
                    window.location.reload();
                    await this.wait(10000);
                    await this.waitForJobsToLoad();
                    
                    jobCards = await this.getJobCardsImproved();
                    this.totalJobs = jobCards.length;
                    
                    this.debugLog(`💼 بعد إعادة التحميل: ${this.totalJobs} وظيفة`);
                    
                    if (this.totalJobs === 0) {
                        this.sendMessage('AUTOMATION_ERROR', { 
                            error: 'لم يتم العثور على وظائف في هذه الصفحة حتى بعد إعادة التحميل' 
                        });
                        return;
                    }
                }

                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 0, 
                    text: `العثور على ${this.totalJobs} وظيفة في الصفحة ${this.currentPage}` 
                });

                for (let i = this.currentJobIndex; i < jobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        this.debugLog('🛑 تم إيقاف العملية');
                        return;
                    }

                    const jobCard = jobCards[i];
                    this.debugLog(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
                    this.currentJobIndex = i + 1;

                    const success = await this.processJobWithRetry(jobCard, i + 1);
                    
                    if (!success) {
                        this.debugLog(`⚠️ فشل في الوظيفة ${i + 1}، الانتقال للتالية`);
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
                this.debugLog('❌ خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        // 🚀 تحسين العثور على الوظائف
getJobCards() {
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
    let skippedVisited = 0;  // 🆕 الأهم - مزارة سابقاً
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
            
            // **1. فحص العلامة المرئية (مقدم عليها مسبقاً)**
            const hasTickIcon = jobContainer.querySelector('img[src*="tickcircle.svg"]');
            const hasAppliedText = jobContainer.textContent.includes('تم التقدم');
            
            if (hasTickIcon || hasAppliedText) {
                skippedApplied++;
                this.debugLog(`✅ تخطي مقدم عليها: ${jobTitle}`);
                continue;
            }
            
            // **🆕 2. فحص الوظائف المزارة سابقاً (الفحص الأهم!)**
            if (this.isJobVisited(jobCard)) {
                skippedVisited++;
                this.debugLog(`🔄 تخطي مزارة سابقاً: ${jobTitle}`);
                continue;
            }
            
            // **3. فحص قائمة المرفوضة (للإحصائيات فقط)**
            if (this.isJobRejected(jobCard)) {
                skippedRejected++;
                this.debugLog(`🚫 تخطي مرفوضة سابقاً: ${jobTitle}`);
                continue;
            }
            
            // **4. فحص "استعراض طلب التقديم"**
            const hasReviewText = jobContainer.textContent.includes('استعراض طلب التقديم') ||
                                 jobContainer.textContent.includes('استعراض الطلب');
            
            if (hasReviewText) {
                skippedReview++;
                this.debugLog(`📋 تخطي قيد المراجعة: ${jobTitle}`);
                continue;
            }
            
            // **5. وظيفة جديدة صالحة للمعالجة**
            jobCards.push(jobCard);
            this.debugLog(`🆕 وظيفة جديدة قابلة للمعالجة: ${jobTitle}`);
        }
    }

    this.debugLog(`📊 نتائج الفلترة المحسنة:
        - وظائف جديدة متاحة: ${jobCards.length}
        - متخطاة (مقدم عليها): ${skippedApplied}
        - متخطاة (مزارة سابقاً): ${skippedVisited} 🆕 الأهم
        - متخطاة (مرفوضة سابقاً): ${skippedRejected}
        - متخطاة (قيد المراجعة): ${skippedReview}
        - إجمالي الروابط: ${jobLinks.length}`);
    
    return jobCards;
}

      getJobCards() {
    this.debugLog('🔍 البحث عن بطاقات الوظائف');
    
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
                this.debugLog(`✅ وظيفة متاحة: ${jobTitle}`);
            } else {
                this.debugLog(`⏭️ تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                this.stats.skipped++;
            }
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
            
            const parentText = link.parentElement?.textContent || '';
            if (parentText.length > 10 && parentText.length < 100) {
                return parentText.trim();
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

        checkIfAlreadyApplied(container) {
            const text = container.textContent || '';
            const html = container.innerHTML || '';
            
            const appliedTexts = ['تم التقدم', 'تم التقديم', 'مقدم عليها'];
            for (const appliedText of appliedTexts) {
                if (text.includes(appliedText)) {
                    return true;
                }
            }
            
            if (html.includes('tickcircle.svg') || html.includes('check-circle')) {
                return true;
            }
            
            return false;
        }

        async processJobWithRetry(jobCard, jobIndex, maxRetries = 2) {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    this.debugLog(`🎯 محاولة ${attempt}/${maxRetries} لمعالجة: ${jobCard.title}`);
                    
                    await this.processJob(jobCard, jobIndex);
                    return true;
                    
                } catch (error) {
                    this.debugLog(`❌ فشلت المحاولة ${attempt}:`, error.message);
                    
                    if (attempt < maxRetries) {
                        this.debugLog('🔄 إعادة المحاولة...');
                        
                        try {
                            await this.goBackToJobList();
                        } catch (backError) {
                            this.debugLog('❌ فشل في العودة:', backError.message);
                        }
                        
                        await this.wait(3000);
                    }
                }
            }
            
            this.debugLog(`❌ فشل نهائياً في معالجة: ${jobCard.title}`);
            this.stats.skipped++;
            this.stats.total++;
            this.sendMessage('UPDATE_STATS', { stats: this.stats });
            
            return false;
        }

async processJob(jobCard, jobIndex) {
    const jobTitle = jobCard.title;
    this.debugLog(`🎯 معالجة الوظيفة ${jobIndex}: ${jobTitle}`);
    
    // 🆕 تسجيل الوظيفة كمزارة فور البدء (الأهم!)
    this.markJobAsVisited(jobCard);
    this.debugLog(`✅ تم تسجيل الوظيفة كمزارة - لن تتكرر مرة أخرى`);
    
    this.sendMessage('UPDATE_CURRENT_JOB', { 
        jobTitle: jobTitle, 
        status: 'processing' 
    });

    this.highlightElement(jobCard.link);

    this.debugLog('👆 النقر على رابط الوظيفة:', jobCard.link.href);
    const currentUrl = window.location.href;
    const clickSuccess = await this.clickElementAdaptive(jobCard.link);
    
            if (!clickSuccess) {
                throw new Error('فشل في النقر على رابط الوظيفة');
            }
            
            this.debugLog('⏳ انتظار التنقل للصفحة...');
            await this.waitForNavigationAdaptive(currentUrl);

            this.debugLog('⏳ انتظار تحميل كامل لصفحة التفاصيل...');
            await this.waitForJobDetailsToLoad();
            
            await this.checkPageTypeWithWait();
            
            let retryCount = 0;
            const maxRetries = 3;

            while (this.pageType !== 'jobDetails' && retryCount < maxRetries) {
                this.debugLog(`⚠️ لم نصل لصفحة التفاصيل بعد، محاولة ${retryCount + 1}/${maxRetries}`);
                this.debugLog(`📍 النوع الحالي: ${this.pageType}`);
                this.debugLog(`📍 URL الحالي: ${window.location.href}`);
                
                retryCount++;
                
                await this.wait(3000);
                await this.checkPageTypeWithWait();
            }
            
            if (this.pageType !== 'jobDetails') {
                if (window.location.href.includes('JobDetails')) {
                    this.debugLog('🔍 URL يحتوي على JobDetails، إجبار نوع الصفحة...');
                    this.pageType = 'jobDetails';
                } else {
                    throw new Error(`فشل في الوصول لصفحة التفاصيل. النوع: ${this.pageType}, URL: ${window.location.href}`);
                }
            }
            
            this.debugLog('✅ وصلنا لصفحة التفاصيل بنجاح');
            
            await this.handlePopups();
            
            const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
            
if (alreadyApplied) {
    this.stats.skipped++;
    this.sendMessage('UPDATE_CURRENT_JOB', { 
        jobTitle: jobTitle, 
        status: 'skipped' 
    });
    this.debugLog('⏭️ مقدم عليها مسبقاً');
} else {
    const applicationResult = await this.applyForJobImproved();
    this.debugLog('📊 نتيجة التقديم:', applicationResult);

    // معالجة النتيجة مباشرة
    if (applicationResult && (applicationResult.success || applicationResult.type === 'rejection')) {
        if (applicationResult.success) {
            this.stats.applied++;
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobTitle, 
                status: 'success' 
            });
            this.debugLog('✅ تم التقديم بنجاح');
            
        } else if (applicationResult.type === 'rejection') {
            this.stats.rejected = (this.stats.rejected || 0) + 1;
            
            // حفظ الوظيفة المرفوضة بطريقة شاملة ومؤكدة
            const jobParam = this.getJobUniqueId(jobCard.link);

            // حفظ متعدد الطبقات لضمان عدم التكرار
            const saveIds = [];

            // طبقة 1: المعرف الأساسي من URL
            if (jobParam) {
                saveIds.push(jobParam);
                this.debugLog(`🚫 معرف URL: ${jobParam.substring(0, 15)}...`);
            }

            // طبقة 2: اسم الشركة + الوظيفة
            const companyName = this.extractCompanyName(jobCard);
            const cleanJobTitle = jobTitle.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase();
            const cleanCompanyName = companyName.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase();

            saveIds.push(`job_${cleanJobTitle}_company_${cleanCompanyName}`);
            saveIds.push(`title_only_${cleanJobTitle}`);
            saveIds.push(`${jobTitle}_${companyName}`.replace(/\s+/g, '_').toLowerCase());
            saveIds.push(jobTitle.toLowerCase());
            saveIds.push(cleanJobTitle);

            // حفظ جميع المعرفات
            for (const id of saveIds) {
                this.rejectedJobs.add(id);
            }

            this.debugLog(`🚫 تم حفظ وظيفة مرفوضة: ${jobTitle} | ${companyName}`);
            this.debugLog(`🔑 حُفظت ${saveIds.length} معرفات مختلفة لضمان عدم التكرار`);
            this.debugLog(`📊 إجمالي الوظائف المرفوضة: ${this.rejectedJobs.size}`);

            this.saveRejectedJobs();
            
            // حفظ بيانات الرفض للتصدير
            this.saveRejectionData(jobTitle, applicationResult.reason);
            
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobTitle, 
                status: 'rejected',
                reason: applicationResult.reason
            });
            this.debugLog('❌ تم رفض التقديم وحفظ في قائمة المرفوضة:', applicationResult.reason);
        }
    } else {
        this.debugLog('⚠️ لم يتم التقديم بشكل صحيح، تسجيل كتخطي');
        this.stats.skipped++;
        this.sendMessage('UPDATE_CURRENT_JOB', { 
            jobTitle: jobTitle, 
            status: 'skipped',
            reason: 'فشل في التقديم'
        });
    }
}

this.stats.total++;
this.sendMessage('UPDATE_STATS', { stats: this.stats });

await this.goBackToJobList();
this.currentJobIndex = jobIndex; // تحديث الفهرس الحالي
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

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3;
            return base + (Math.random() * 2 - 1) * variation;
        }

        async goToNextPage() {
            this.debugLog('🔍 البحث عن الصفحة التالية');
            
            const nextButton = document.querySelector('button[aria-label="go to next page"]:not([disabled])');
            
            if (nextButton) {
                this.debugLog('➡️ الانتقال للصفحة التالية');
                this.currentPage++;
                this.currentJobIndex = 0;
                
                await this.clickElementAdaptive(nextButton);
                await this.waitForNavigationAdaptive();
                await this.wait(3000);
                
                await this.processCurrentPage();
            } else {
                this.debugLog('🏁 انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
                this.showIndicator('🎉 تم الانتهاء من جميع الوظائف!', '#00ff88', 10000);
            }
        }
extractCompanyName(jobCard) {
    try {
        this.debugLog(`🔍 استخراج محسن لاسم الشركة: ${jobCard.title}`);
        
        const cardElement = jobCard.link.closest('[data-container]');
        if (!cardElement) {
            this.debugLog('❌ لم يوجد عنصر data-container');
            return 'no_container';
        }

        // طريقة 1: البحث عن أول رابط يحتوي على اسم شركة (قبل رابط الوظيفة)
        const allLinks = cardElement.querySelectorAll('a[data-link]');
        for (let i = 0; i < allLinks.length; i++) {
            const link = allLinks[i];
            
            // تجاهل رابط الوظيفة نفسها
            if (link === jobCard.link || link.href?.includes('JobDetails')) {
                continue;
            }
            
            const span = link.querySelector('span[data-expression]');
            if (span) {
                const companyText = span.textContent?.trim();
                if (companyText && companyText !== jobCard.title && companyText.length > 5) {
                    this.debugLog(`🏢 وجد اسم الشركة (رابط منفصل): ${companyText}`);
                    return companyText;
                }
            }
        }

        // طريقة 2: البحث في أول span قبل عنوان الوظيفة
        const allSpans = Array.from(cardElement.querySelectorAll('span[data-expression]'));
        const jobTitleIndex = allSpans.findIndex(span => 
            span.textContent?.trim() === jobCard.title
        );

        if (jobTitleIndex > 0) {
            // أخذ أول span قبل عنوان الوظيفة
            for (let i = 0; i < jobTitleIndex; i++) {
                const text = allSpans[i].textContent?.trim();
                if (text && text.length > 5 && !text.includes('%') && !text.match(/^\d+$/)) {
                    this.debugLog(`🏢 وجد اسم الشركة (ترتيب span): ${text}`);
                    return text;
                }
            }
        }

        // طريقة 3: البحث بالكلمات المفتاحية للشركات
        for (const span of allSpans) {
            const text = span.textContent?.trim();
            if (text && text !== jobCard.title && text.length > 5) {
                const companyKeywords = [
                    'مؤسسة', 'شركة', 'مكتب', 'مجموعة', 'مركز',
                    'للاستشارات', 'للخدمات', 'للتطوير', 'للتقنية',
                    'هندسية', 'تجارية', 'صناعية', 'طبية'
                ];
                
                const hasCompanyKeyword = companyKeywords.some(keyword => 
                    text.includes(keyword)
                );
                
                if (hasCompanyKeyword) {
                    this.debugLog(`🏢 وجد اسم الشركة (كلمة مفتاحية): ${text}`);
                    return text;
                }
            }
        }

        // طريقة 4: أخذ أطول نص ليس عنوان الوظيفة
        let longestText = '';
        for (const span of allSpans) {
            const text = span.textContent?.trim();
            if (text && text !== jobCard.title && text.length > longestText.length && 
                text.length > 5 && !text.includes('%') && !text.match(/^\d+$/)) {
                longestText = text;
            }
        }

        if (longestText) {
            this.debugLog(`🏢 وجد اسم الشركة (أطول نص): ${longestText}`);
            return longestText;
        }

        // فشل في استخراج اسم الشركة
        this.debugLog(`⚠️ فشل في استخراج اسم الشركة للوظيفة: ${jobCard.title}`);
        return `unknown_company_${Date.now()}`;
        
    } catch (error) {
        this.debugLog('❌ خطأ في استخراج اسم الشركة:', error);
        return `error_company_${Date.now()}`;
    }
}

// 🆕 دالة شاملة لاستخراج جميع بيانات الوظيفة من HTML
extractJobDataFromHTML(jobCard) {
    try {
        this.debugLog(`📊 استخراج بيانات شاملة للوظيفة: ${jobCard.title}`);
        
        const cardElement = jobCard.link.closest('[data-container]');
        if (!cardElement) {
            return this.getMinimalJobData(jobCard);
        }

        const jobData = {
            title: jobCard.title,
            company: null,
            city: null,
            matchingScore: null,
            publishDate: null,
            availableJobs: null
        };

        // استخراج اسم الشركة المحسن
        jobData.company = this.extractCompanyName(jobCard);

        // استخراج باقي البيانات من العناصر المنظمة
        const allSpans = Array.from(cardElement.querySelectorAll('span[data-expression]'));
        const allDivs = Array.from(cardElement.querySelectorAll('div'));

        // البحث عن نسبة التوافق (تحتوي على %)
        for (const span of allSpans) {
            const text = span.textContent?.trim();
            if (text && text.includes('%')) {
                jobData.matchingScore = text;
                this.debugLog(`📊 نسبة التوافق: ${text}`);
                break;
            }
        }

        // البحث عن المدينة (بعد كلمة "المدينة")
        for (let i = 0; i < allDivs.length; i++) {
            const div = allDivs[i];
            if (div.textContent?.includes('المدينة')) {
                // البحث في العناصر التالية
                for (let j = i + 1; j < Math.min(i + 3, allDivs.length); j++) {
                    const nextDiv = allDivs[j];
                    const span = nextDiv.querySelector('span[data-expression]');
                    if (span) {
                        const cityText = span.textContent?.trim();
                        if (cityText && !cityText.includes('%') && cityText.length < 30) {
                            jobData.city = cityText;
                            this.debugLog(`🏙️ المدينة: ${cityText}`);
                            break;
                        }
                    }
                }
                break;
            }
        }

        // البحث عن تاريخ النشر (بعد كلمة "تاريخ النشر")
        for (let i = 0; i < allDivs.length; i++) {
            const div = allDivs[i];
            if (div.textContent?.includes('تاريخ النشر')) {
                for (let j = i + 1; j < Math.min(i + 3, allDivs.length); j++) {
                    const nextDiv = allDivs[j];
                    const span = nextDiv.querySelector('span[data-expression]');
                    if (span) {
                        const dateText = span.textContent?.trim();
                        if (dateText && dateText.match(/\d{2}\/\d{2}\/\d{4}/)) {
                            jobData.publishDate = dateText;
                            this.debugLog(`📅 تاريخ النشر: ${dateText}`);
                            break;
                        }
                    }
                }
                break;
            }
        }

        // البحث عن عدد الوظائف المتاحة
        for (let i = 0; i < allDivs.length; i++) {
            const div = allDivs[i];
            if (div.textContent?.includes('الوظائف المتاحة')) {
                for (let j = i + 1; j < Math.min(i + 3, allDivs.length); j++) {
                    const nextDiv = allDivs[j];
                    const span = nextDiv.querySelector('span[data-expression]');
                    if (span) {
                        const jobsText = span.textContent?.trim();
                        if (jobsText && jobsText.match(/^\d+$/)) {
                            jobData.availableJobs = jobsText;
                            this.debugLog(`💼 الوظائف المتاحة: ${jobsText}`);
                            break;
                        }
                    }
                }
                break;
            }
        }

        this.debugLog(`📋 البيانات المستخرجة:`, jobData);
        return jobData;
        
    } catch (error) {
        this.debugLog('❌ خطأ في استخراج البيانات:', error);
        return this.getMinimalJobData(jobCard);
    }
}

// دالة مساعدة للحصول على بيانات أساسية في حالة الفشل
getMinimalJobData(jobCard) {
    return {
        title: jobCard.title || 'unknown_job',
        company: 'unknown_company',
        city: null,
        matchingScore: null,
        publishDate: null,
        availableJobs: null
    };
}

isJobRejected(jobCard) {
    this.debugLog(`🔍 فحص رفض الوظيفة: ${jobCard.title}`);
    
    // متغيرات أساسية
    const jobTitle = jobCard.title;
    const jobLink = jobCard.link;
    
    // فحص 1: المعرف الأساسي من URL
    const jobParam = this.getJobUniqueId(jobLink);
    if (jobParam && this.rejectedJobs.has(jobParam)) {
        this.debugLog(`🚫 وظيفة مرفوضة سابقاً (معرف URL): ${jobTitle} - ${jobParam.substring(0, 15)}...`);
        return true;
    }
    
    // فحص 2: استخراج اسم الشركة والمطابقة
    const companyName = this.extractCompanyName(jobCard);
    const cleanJobTitle = jobTitle.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase();
    const cleanCompanyName = companyName.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase();
    
    // إنشاء جميع المعرفات المحتملة
    const possibleIds = [
        `job_${cleanJobTitle}_company_${cleanCompanyName}`,
        `title_only_${cleanJobTitle}`,
        `${jobTitle}_${companyName}`.replace(/\s+/g, '_').toLowerCase(),
        jobTitle.toLowerCase(),
        cleanJobTitle
    ];
    
    // فحص كل معرف محتمل
    for (const id of possibleIds) {
        if (this.rejectedJobs.has(id)) {
            this.debugLog(`🚫 وظيفة مرفوضة سابقاً (${id}): ${jobTitle} | ${companyName}`);
            return true;
        }
    }
    
    // فحص 3: البحث الشامل في قائمة الوظائف المرفوضة
    for (const rejectedId of this.rejectedJobs) {
        // فحص إذا كان المعرف المرفوض يحتوي على عنوان الوظيفة
        if (rejectedId.includes(cleanJobTitle) || rejectedId.includes(jobTitle.toLowerCase())) {
            this.debugLog(`🚫 وظيفة مرفوضة سابقاً (بحث شامل): ${jobTitle} - وجد في ${rejectedId.substring(0, 30)}...`);
            return true;
        }
    }
    
    this.debugLog(`✅ وظيفة غير مرفوضة: ${jobTitle} | ${companyName}`);
    this.debugLog(`🔍 تم فحص ${this.rejectedJobs.size} وظيفة مرفوضة`);
    return false;
}
        async navigateToJobList() {
            this.debugLog('🔄 الانتقال لقائمة الوظائف');
            
            this.showIndicator('🔄 جاري الانتقال لقائمة الوظائف...', '#ffc107');
            
            const exploreJobsLink = document.querySelector('a[href*="ExploreJobs"], a[href*="JobTab=1"]');
            
            if (exploreJobsLink) {
                await this.clickElementAdaptive(exploreJobsLink);
                await this.waitForNavigationAdaptive();
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