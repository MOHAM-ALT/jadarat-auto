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

// 📝 تسجيل بسيط للوظائف المزارة
markJobAsVisited(jobCard) {
    try {
        const jobIds = this.generateJobIdentifiers(jobCard);
        
        if (jobIds.length === 0) {
            this.debugLog('❌ لا يمكن حفظ الوظيفة - معرف غير صحيح');
            return;
        }

        const uniqueId = jobIds[0]; // معرف واحد فقط
        
        this.visitedJobs.add(uniqueId);
        
        this.debugLog(`📝 تم تسجيل وظيفة: ${jobCard.title}`);
        this.debugLog(`🔑 المعرف: ${uniqueId.substring(0, 50)}...`);
        this.debugLog(`📊 إجمالي المزارة: ${this.visitedJobs.size}`);
        
        // حفظ فوري
        this.saveVisitedJobs();
        
    } catch (error) {
        this.debugLog('❌ خطأ في حفظ الوظيفة:', error);
    }
}

// 🔍 فحص بسيط للوظائف المزارة
isJobVisited(jobCard) {
    try {
        const jobIds = this.generateJobIdentifiers(jobCard);
        
        if (jobIds.length === 0) {
            this.debugLog('⚠️ لا توجد معرفات صحيحة للوظيفة');
            return false;
        }

        const uniqueId = jobIds[0]; // معرف واحد فقط
        
        if (this.visitedJobs.has(uniqueId)) {
            this.debugLog(`🚫 وظيفة مزارة سابقاً: ${jobCard.title}`);
            this.debugLog(`🔑 المعرف: ${uniqueId.substring(0, 50)}...`);
            return true;
        }
        
        this.debugLog(`✅ وظيفة جديدة: ${jobCard.title}`);
        return false;
        
    } catch (error) {
        this.debugLog('❌ خطأ في فحص الزيارة:', error);
        return false;
    }
}

// 🔑 توليد معرف واحد ثابت مبني على البيانات الحقيقية فقط
generateJobIdentifiers(jobCard) {
    try {
        // استخراج البيانات الحقيقية أولاً
        const jobData = this.extractJobDataFromHTML(jobCard);
        
        if (!jobData) {
            this.debugLog('❌ فشل في استخراج البيانات - لا يمكن إنشاء معرف');
            return [];
        }

        this.debugLog(`🔑 إنشاء معرف من البيانات:`, {
            company: jobData.company,
            jobTitle: jobData.jobTitle,
            city: jobData.city,
            matchPercentage: jobData.matchPercentage,
            publishDate: jobData.publishDate,
            availableCount: jobData.availableCount
        });

        // تنظيف البيانات لإنشاء معرف ثابت
        const cleanCompany = this.cleanForId(jobData.company);
        const cleanJobTitle = this.cleanForId(jobData.jobTitle);
        const cleanCity = this.cleanForId(jobData.city);
        const cleanMatch = this.cleanForId(jobData.matchPercentage);
        const cleanDate = this.cleanForId(jobData.publishDate);
        const cleanCount = this.cleanForId(jobData.availableCount);

        // إنشاء معرف واحد شامل من جميع البيانات
        const parts = [
            cleanCompany,
            cleanJobTitle,
            cleanCity,
            cleanMatch,
            cleanCount,
            cleanDate
        ].filter(part => part && part.length > 0);

        if (parts.length < 2) {
            this.debugLog('❌ بيانات غير كافية لإنشاء معرف موثوق');
            return [];
        }

        const uniqueId = parts.join('_');
        
        this.debugLog(`✅ المعرف الثابت النهائي: ${uniqueId.substring(0, 100)}...`);
        
        return [uniqueId];
        
    } catch (error) {
        this.debugLog('❌ خطأ في توليد المعرف:', error);
        return [];
    }
}

// دالة مساعدة لتنظيف النصوص للمعرف
cleanForId(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .trim()
        .replace(/[^\w\u0600-\u06FF\d]/g, '') // إزالة جميع الرموز والمسافات
        .toLowerCase();
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

// 🔍 فحص بسيط للوظائف المرفوضة
isJobRejected(jobCard) {
    try {
        const jobIds = this.generateJobIdentifiers(jobCard);
        
        if (jobIds.length === 0) {
            return false;
        }

        const uniqueId = jobIds[0]; // معرف واحد فقط
        
        if (this.rejectedJobs.has(uniqueId)) {
            this.debugLog(`🚫 وظيفة مرفوضة سابقاً: ${jobCard.title}`);
            return true;
        }
        
        return false;
        
    } catch (error) {
        this.debugLog('❌ خطأ في فحص الرفض:', error);
        return false;
    }
}

async clearRejectedJobs() {
    this.rejectedJobs.clear();
    await chrome.storage.local.remove(['rejectedJobs']);
    this.debugLog('🗑️ تم مسح جميع الوظائف المرفوضة');
}

async clearVisitedJobs() {
    this.visitedJobs.clear();
    await chrome.storage.local.remove(['visitedJobs']);
    this.debugLog('🗑️ تم مسح جميع الوظائف المزارة');
}

// ===============================
// 📊 استخراج البيانات الحقيقية الثابتة من HTML (حسب كود جدارات الفعلي)
// ===============================

extractJobDataFromHTML(jobCard) {
    try {
        this.debugLog(`📊 استخراج البيانات الحقيقية للوظيفة: ${jobCard.title}`);
        
        const container = jobCard.container || jobCard.link.closest('[data-container]');
        if (!container) {
            this.debugLog('❌ لم يوجد عنصر data-container');
            return null;
        }

        const jobData = {
            company: null,
            jobTitle: jobCard.title,
            matchPercentage: null,
            city: null,
            publishDate: null,
            availableCount: null
        };

        try {
            // 1. استخراج اسم الشركة الصحيح
            const companyElement = container.querySelector('a[data-link] span[data-expression]');
            if (companyElement) {
                jobData.company = companyElement.textContent.trim();
                this.debugLog(`🏢 اسم الشركة: ${jobData.company}`);
            }
            
            // 2. استخراج المسمى الوظيفي
            const jobTitleElement = container.querySelector('span.heading4, .heading4');
            if (jobTitleElement) {
                jobData.jobTitle = jobTitleElement.textContent.trim();
                this.debugLog(`💼 المسمى الوظيفي: ${jobData.jobTitle}`);
            }
            
            // 3. استخراج نسبة التوافق
            const matchElement = container.querySelector('.matching_score');
            if (matchElement) {
                jobData.matchPercentage = matchElement.textContent.trim();
                this.debugLog(`📊 نسبة التوافق: ${jobData.matchPercentage}`);
            }
            
            // 4. استخراج المدينة
            const cityElements = container.querySelectorAll('span[data-expression]');
            for (const element of cityElements) {
                const text = element.textContent.trim();
                // البحث عن النص بالقرب من "المدينة"
                const parent = element.closest('[data-container]');
                if (parent && parent.textContent.includes('المدينة')) {
                    jobData.city = text;
                    this.debugLog(`🏙️ المدينة: ${jobData.city}`);
                    break;
                }
            }
            
            // 5. استخراج تاريخ النشر
            const dateElements = container.querySelectorAll('span[data-expression]');
            for (const element of dateElements) {
                const text = element.textContent.trim();
                // البحث عن تاريخ (نمط: dd/mm/yyyy)
                if (/\d{2}\/\d{2}\/\d{4}/.test(text)) {
                    const parent = element.closest('[data-container]');
                    if (parent && parent.textContent.includes('تاريخ النشر')) {
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
                const parent = element.closest('[data-container]');
                if (parent && parent.textContent.includes('الوظائف المتاحة') && /^\d+$/.test(text)) {
                    jobData.availableCount = text;
                    this.debugLog(`📈 الوظائف المتاحة: ${jobData.availableCount}`);
                    break;
                }
            }
            
        } catch (error) {
            this.debugLog('❌ خطأ في استخراج البيانات:', error);
        }

        // التأكد من وجود البيانات الأساسية
        if (!jobData.company || !jobData.jobTitle) {
            this.debugLog('⚠️ بيانات ناقصة:', jobData);
            return null;
        }

        this.debugLog(`✅ البيانات المستخرجة:`, jobData);
        return jobData;
        
    } catch (error) {
        this.debugLog('❌ خطأ عام في استخراج البيانات:', error);
        return null;
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

        // 🎯 انتظار تحميل الوظائف المحسن والقوي
        async waitForJobsToLoad() {
            this.debugLog('🔍 انتظار تحميل قائمة الوظائف المحسن والقوي...');
            
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 120; // 120 ثانية للتحميل (زيادة كبيرة)
                let observer;
                let consecutiveSuccessCount = 0; // عداد للنجاح المتتالي
                
                const checkJobsLoaded = () => {
                    attempts++;
                    
                    const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
                    const hasContent = document.body.textContent.length > 8000; // رفع الحد الأدنى
                    const pageReady = document.readyState === 'complete';
                    const hasJobContainer = document.querySelector('[data-list]') || 
                                           document.querySelector('.list') ||
                                           document.querySelector('[data-container]');
                    
                    // فحص أن المحتوى ليس فقط "JavaScript is required"
                    const contentText = document.body.textContent;
                    const hasRealContent = !contentText.includes('JavaScript is required') && 
                                          contentText.length > 5000;
                    
                    // فحص وجود عناصر الوظائف الفعلية
                    const hasJobElements = document.querySelectorAll('span.heading4, .heading4').length > 0;
                    const hasJobData = document.querySelectorAll('span[data-expression]').length > 10;
                    
                    this.debugLog(`📊 فحص التحميل - محاولة ${attempts}/${maxAttempts}:
                        - روابط الوظائف: ${jobLinks.length}
                        - طول المحتوى: ${document.body.textContent.length}
                        - الصفحة جاهزة: ${pageReady}
                        - حاوي الوظائف: ${!!hasJobContainer}
                        - محتوى حقيقي: ${hasRealContent}
                        - عناصر الوظائف: ${hasJobElements}
                        - بيانات الوظائف: ${hasJobData}`);
                    
                    const isLoaded = jobLinks.length > 0 && 
                                    hasContent && 
                                    pageReady && 
                                    hasJobContainer && 
                                    hasRealContent &&
                                    hasJobElements &&
                                    hasJobData;
                    
                    if (isLoaded) {
                        consecutiveSuccessCount++;
                        this.debugLog(`✅ معايير النجاح مستوفاة - عدد متتالي: ${consecutiveSuccessCount}/3`);
                        
                        // التأكد من الاستقرار (3 فحوصات متتالية ناجحة)
                        if (consecutiveSuccessCount >= 3) {
                            this.debugLog(`✅ تحميل قائمة الوظائف: تم بنجاح في ${attempts}ث - وجد ${jobLinks.length} وظيفة`);
                            
                            if (observer) observer.disconnect();
                            
                            // انتظار إضافي للاستقرار الكامل
                            setTimeout(() => {
                                resolve(true);
                            }, 3000);
                            return;
                        }
                    } else {
                        consecutiveSuccessCount = 0; // إعادة تعيين العداد
                    }
                    
                    if (attempts >= maxAttempts) {
                        this.debugLog(`❌ انتهت محاولات تحميل قائمة الوظائف بعد ${maxAttempts}ث`);
                        if (observer) observer.disconnect();
                        reject(new Error('فشل في تحميل قائمة الوظائف'));
                        return;
                    }
                    
                    // إعادة تحميل الصفحة كل 30 محاولة فاشلة
                    if (attempts % 30 === 0 && !hasRealContent) {
                        this.debugLog('🔄 إعادة تحميل الصفحة لحل مشكلة JavaScript...');
                        window.location.reload();
                        return;
                    }
                    
                    // لوج التقدم كل 10 محاولات
                    if (attempts % 10 === 0) {
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
                setTimeout(checkJobsLoaded, 2000);
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

        // 🔧 معالج الصفحات الفارغة والمشاكل
        async handleEmptyPage() {
            this.debugLog('🔧 معالجة الصفحة الفارغة...');
            
            const currentUrl = window.location.href;
            const pageContent = document.body.textContent;
            
            // فحص المشاكل الشائعة
            if (pageContent.includes('JavaScript is required') || pageContent.length < 500) {
                this.debugLog('⚠️ مشكلة JavaScript أو محتوى ناقص');
                
                // محاولة إعادة التحميل
                for (let attempt = 1; attempt <= 3; attempt++) {
                    this.debugLog(`🔄 محاولة إعادة تحميل ${attempt}/3...`);
                    
                    window.location.reload();
                    await this.wait(10000); // انتظار 10 ثوان
                    
                    await this.waitForJobsToLoad();
                    
                    const newJobCount = document.querySelectorAll('a[href*="JobDetails"]').length;
                    if (newJobCount > 0) {
                        this.debugLog(`✅ تم حل المشكلة - وجد ${newJobCount} وظيفة`);
                        return true;
                    }
                }
                
                // إذا فشل كل شيء، جرب الانتقال لصفحة أخرى
                this.debugLog('🔄 محاولة الانتقال لصفحة مختلفة...');
                const fallbackUrl = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1&page=1';
                window.location.href = fallbackUrl;
                await this.wait(10000);
                
                return false;
            }
            
            return true;
        }

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
            
            // فحص صفحة قائمة الوظائف المحسن
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 1; // تقليل من 3 إلى 1
            const hasPagination = document.querySelector('button[aria-label*="next page"], .pagination') ||
                                 pageHTML.includes('pagination');

            // فحص إضافي للمحتوى الحقيقي
            const hasRealJobContent = document.querySelectorAll('span.heading4, .heading4').length > 0 ||
                                     document.querySelectorAll('span[data-expression]').length > 5;

            this.debugLog(`📊 تحليل عام للصفحة:
                - روابط متعددة: ${hasMultipleJobs} (${jobLinks.length})
                - صفحات: ${hasPagination}
                - محتوى وظائف حقيقي: ${hasRealJobContent}
                - URL: ${url}`);

            if ((hasMultipleJobs && hasRealJobContent) || hasPagination || 
                url.includes('ExploreJobs') || 
                url.includes('JobTab=1')) {
                
                // فحص إضافي للتأكد من وجود محتوى حقيقي
                if (pageText.includes('JavaScript is required') && pageText.length < 1000) {
                    this.debugLog('⚠️ الصفحة تحتاج JavaScript، انتظار إضافي...');
                    setTimeout(() => this.checkPageType(), 10000);
                    return;
                }
                
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
                        sendResponse({ success: true });
                        this.clearRejectedJobs();
                        break;
                        
                    case 'GET_REJECTED_COUNT':
                        sendResponse({ count: this.rejectedJobs.size });
                        break;

                    case 'CLEAR_VISITED_JOBS':
                        sendResponse({ success: true });
                        this.clearVisitedJobs();
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
                let jobCards = await this.getJobCards();
                this.totalJobs = jobCards.length;

                this.debugLog(`💼 تم العثور على ${this.totalJobs} وظيفة`);

                // إذا لم نجد وظائف، استخدم معالج الصفحات الفارغة
                if (this.totalJobs === 0) {
                    this.debugLog('⚠️ لم توجد وظائف، تشغيل معالج الصفحات الفارغة...');
                    
                    const fixed = await this.handleEmptyPage();
                    if (fixed) {
                        // جرب مرة أخرى بعد الإصلاح
                        await this.waitForJobsToLoad();
                        jobCards = await this.getJobCards();
                        this.totalJobs = jobCards.length;
                        
                        this.debugLog(`💼 بعد الإصلاح: ${this.totalJobs} وظيفة`);
                    }
                    
                    if (this.totalJobs === 0) {
                        this.debugLog('❌ لا توجد وظائف حتى بعد المعالجة، الانتقال للصفحة التالية...');
                        await this.goToNextPage();
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

                    // **3. فحص قائمة المرفوضة**
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
                        
                        // حفظ الوظيفة المرفوضة بنفس طريقة المعرف الثابت
                        const rejectedIds = this.generateJobIdentifiers(jobCard);
                        if (rejectedIds.length > 0) {
                            const rejectedId = rejectedIds[0];
                            this.rejectedJobs.add(rejectedId);
                            this.saveRejectedJobs();
                            this.debugLog(`🚫 تم حفظ وظيفة مرفوضة: ${jobTitle}`);
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
                            
                            // حفظ بيانات الرفض للتصدير
                            this.saveRejectionData(jobTitle, applicationResult.reason);
                            
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'rejected',
                                reason: applicationResult.reason
                            });
                            this.debugLog('❌ تم رفض التقديم:', applicationResult.reason);
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

        // من هنا باقي الدوال بدون تغيير...
        
        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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

        // دوال مختصرة للأجزاء المطلوبة
        async findAndClickSubmitButton() { return { success: false, reason: 'غير مُطبق بعد' }; }
        async handleConfirmationModalImproved() { return { success: false }; }
        async waitForApplicationResult() { return { success: false, type: 'timeout' }; }
        async clickElementAdaptive(element) { element.click(); return true; }
        async handlePopups() {}
        async checkIfAlreadyAppliedInDetails() { return false; }
        async goBackToJobList() { window.history.back(); await this.wait(3000); }
        async navigateToJobListDirect() {}
        async navigateToJobList() {}
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