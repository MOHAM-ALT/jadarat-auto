// جدارات أوتو - Content Script المُصحح والمحسن بالكامل
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى الذكي المحدث');

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

            this.currentPage = 1;
            this.currentJobIndex = 0;
            this.totalJobs = 0;
            this.resumeData = null;
            
            this.initializeListeners();
            this.checkPageType();
            this.addVisualIndicator();
            
            console.log('✅ جدارات أوتو: تم التهيئة بنجاح - النسخة المصححة');
        }

        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sendResponse);
                return true; // Keep message channel open
            });
        }

        checkPageType() {
            const url = window.location.href;
            console.log('🔍 تحليل الصفحة الحالية:', url);
            
            if (document.readyState !== 'complete') {
                console.log('⏳ الصفحة لم تكتمل التحميل بعد، الانتظار...');
                setTimeout(() => this.checkPageType(), 2000);
                return;
            }
            
            const pageText = document.body.textContent || '';
            const pageHTML = document.body.innerHTML || '';
            
            console.log('📄 محتوى الصفحة:', {
                textLength: pageText.length,
                htmlLength: pageHTML.length,
                firstText: pageText.substring(0, 200)
            });
            
            // فحص صفحة تفاصيل الوظيفة أولاً
            if (url.includes('JobDetails')) {
                console.log('🔍 URL يحتوي على JobDetails، فحص المحتوى...');
                
                if (pageText.length < 1200) {
    console.log('⚠️ المحتوى قصير جداً، انتظار إضافي...');
    console.log(`📊 طول المحتوى الحالي: ${pageText.length} (المطلوب: 1200+)`);
    setTimeout(() => this.checkPageType(), 5000); // زيادة وقت الانتظار
    return;
}
                
                // فحص مؤشرات صفحة التفاصيل المحدثة
                if (this.analyzeJobDetailsPage()) {
                    this.pageType = 'jobDetails';
                    console.log('✅ تم تأكيد صفحة تفاصيل الوظيفة');
                    return;
                }
                
                console.log('⚠️ فشل في تحليل صفحة JobDetails، محاولة أخرى...');
                setTimeout(() => this.checkPageType(), 5000);
                return;
            }
            
            // فحص صفحة قائمة الوظائف
            const jobLinks = document.querySelectorAll('a[href*="JobDetails"]');
            const hasMultipleJobs = jobLinks.length >= 3;
            const hasPagination = document.querySelector('button[aria-label*="next page"], .pagination') ||
                                 pageHTML.includes('pagination');
            
            console.log(`📊 تحليل عام للصفحة:
                - روابط متعددة: ${hasMultipleJobs} (${jobLinks.length})
                - صفحات: ${hasPagination}
                - URL: ${url}`);
            
            if (hasMultipleJobs || hasPagination || 
                url.includes('ExploreJobs') || 
                url.includes('JobTab=1')) {
                this.pageType = 'jobList';
                console.log('📋 صفحة قائمة الوظائف مؤكدة');
                this.analyzeJobListPage();
                
            } else if (url.includes('jadarat.sa') && 
                      (pageText.includes('البحث عن الوظائف') || pageText.includes('الوظائف المتاحة'))) {
                this.pageType = 'home';
                console.log('🏠 الصفحة الرئيسية مكتشفة');
                
            } else {
                this.pageType = 'unknown';
                console.log(`❓ نوع صفحة غير محدد:
                    - URL: ${url}
                    - طول النص: ${pageText.length}
                    - روابط: ${jobLinks.length}`);
                
                if (pageText.length < 1000) {
                    setTimeout(() => this.checkPageType(), 8000);
                }
            }
        }

        analyzeJobDetailsPage() {
            // تحليل محسن لصفحة تفاصيل الوظيفة
            const pageText = document.body.textContent || '';
            
            // مؤشرات قوية لصفحة التفاصيل
            const strongIndicators = [
                'الوصف الوظيفي',
                'نوع العمل',
                'الراتب',
                'المؤهلات',
                'الرقم التعريفي'
            ];
            
            // مؤشرات إضافية
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
            
            // حساب النقاط القوية
            for (const indicator of strongIndicators) {
                if (pageText.includes(indicator)) {
                    strongScore++;
                    foundIndicators.push(indicator);
                }
            }
            
            // حساب النقاط الإضافية
            for (const indicator of additionalIndicators) {
                if (pageText.includes(indicator)) {
                    additionalScore++;
                    foundIndicators.push(indicator);
                }
            }
            
            // فحص وجود زر التقديم أو عناصر التقديم
            const submitButton = this.findSubmitButtonImproved();
            const hasJobContent = pageText.includes('وظيفة') || pageText.includes('تقديم');
            
            console.log(`📊 تحليل صفحة JobDetails المحسن:
                - نقاط قوية: ${strongScore}/${strongIndicators.length}
                - نقاط إضافية: ${additionalScore}/${additionalIndicators.length}
                - المؤشرات الموجودة: [${foundIndicators.join(', ')}]
                - زر التقديم: ${!!submitButton}
                - محتوى وظيفي: ${hasJobContent}
                - طول النص: ${pageText.length}`);
            
            // شروط القبول المحسنة
            const isJobDetailsPage = (
                strongScore >= 2 ||  // على الأقل مؤشرين قويين
                (strongScore >= 1 && additionalScore >= 2) ||  // مؤشر قوي + مؤشرين إضافيين
                submitButton ||  // وجود زر تقديم
                (hasJobContent && pageText.length > 800)  // محتوى وظيفي كافي
            );
            
            if (isJobDetailsPage) {
                // حفظ تحليل الصفحة
                const jobTitle = this.extractCurrentJobTitleImproved();
                const isAlreadyApplied = this.checkIfCurrentJobApplied();
                
                console.log(`📝 وظيفة حالية: ${jobTitle}`);
                console.log(`📊 حالة التقديم: ${isAlreadyApplied ? 'مقدم عليها' : 'لم يتم التقديم'}`);
                
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
            // محددات محسنة حسب البنية الفعلية الجديدة
            const titleSelectors = [
                // المحددات الأساسية
                'span.heading5',
                '.heading5',
                
                // محددات احتياطية
                'h1', 'h2', 'h3',
                '.job-title',
                '[data-block*="JobTitle"]',
                '.page-title',
                
                // محددات عامة
                '.heading4',
                'span[data-expression]',
                
                // البحث في العناوين الكبيرة
                'span[style*="font-size"]',
                'div[style*="font-weight: bold"]'
            ];
            
            // محاولة العثور على العنوان باستخدام المحددات
            for (const selector of titleSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (element && element.textContent.trim()) {
                        const title = element.textContent.trim();
                        // فحص جودة العنوان
                        if (this.isValidJobTitle(title)) {
                            console.log(`✅ وجد عنوان باستخدام ${selector}: ${title}`);
                            return title;
                        }
                    }
                }
            }
            
            // البحث في النص المرئي للصفحة
            const pageText = document.body.textContent || '';
            const lines = pageText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            for (const line of lines) {
                if (this.isValidJobTitle(line) && line.length > 10 && line.length < 100) {
                    // تجاهل الخطوط التي تحتوي على كلمات غير مرغوبة
                    const unwantedWords = ['تسجيل', 'دخول', 'بحث', 'قائمة', 'صفحة', 'موقع'];
                    const hasUnwantedWords = unwantedWords.some(word => line.includes(word));
                    
                    if (!hasUnwantedWords) {
                        console.log(`✅ وجد عنوان من النص: ${line}`);
                        return line;
                    }
                }
            }
            
            // البحث عن العنوان بالقرب من "الرقم التعريفي"
            const idElements = document.querySelectorAll('*');
            for (const element of idElements) {
                if (element.textContent.includes('الرقم التعريفي')) {
                    const parent = element.closest('div, section, article');
                    if (parent) {
                        const titleInParent = this.findTitleInElement(parent);
                        if (titleInParent) {
                            console.log(`✅ وجد عنوان بالقرب من الرقم التعريفي: ${titleInParent}`);
                            return titleInParent;
                        }
                    }
                }
            }
            
            console.log('⚠️ لم يتم العثور على عنوان واضح للوظيفة');
            return 'وظيفة غير محددة';
        }

        isValidJobTitle(text) {
            if (!text || typeof text !== 'string') return false;
            
            text = text.trim();
            
            // فحوصات الجودة
            const minLength = 5;
            const maxLength = 150;
            const isValidLength = text.length >= minLength && text.length <= maxLength;
            
            // تجاهل النصوص التي تحتوي فقط على أرقام أو رموز
            const isNotOnlyNumbers = !/^\d+$/.test(text);
            const isNotOnlySymbols = !/^[^\w\u0600-\u06FF]+$/.test(text);
            
            // تجاهل النصوص الشائعة غير المفيدة
            const commonTexts = [
                'تفاصيل',
                'معلومات',
                'صفحة',
                'موقع',
                'جدارات',
                'تسجيل الدخول',
                'بحث',
                'قائمة',
                'الرئيسية'
            ];
            const isNotCommonText = !commonTexts.some(common => text === common);
            
            // يجب أن يحتوي على أحرف عربية أو إنجليزية
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

        findSubmitButtonImproved() {
            console.log('🔍 البحث المحسن عن زر التقديم');
            
            
            // البحث المباشر بمحددات محسنة
            const buttonSelectors = [
                // المحددات الأساسية
                'button.btn.btn-primary',
                'button[data-button]',
                'button.btn',
                'input[type="submit"]',
                'a.btn',
                
                // محددات احتياطية
                'button[class*="submit"]',
                'button[class*="apply"]',
                'input[value*="تقديم"]',
                'a[title*="تقديم"]'
            ];
            
            // جرب المحددات المباشرة أولاً
            for (const selector of buttonSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    if (this.isSubmitButton(element)) {
                        console.log('✅ عثر على زر التقديم باستخدام:', selector);
                        return element;
                    }
                }
            }
            
            // البحث الشامل في جميع الأزرار والروابط
            console.log('🔍 البحث الشامل في جميع العناصر التفاعلية...');
            const allInteractive = document.querySelectorAll(
                'button, input[type="submit"], input[type="button"], a, [role="button"]'
            );
            
            for (const element of allInteractive) {
                if (this.isSubmitButton(element)) {
                    console.log('✅ تم العثور على زر التقديم (بحث شامل):', element);
                    return element;
                }
            }
            
            // لوج تشخيصي
            this.logAvailableButtons();
            
            console.log('❌ لم يتم العثور على زر التقديم');
            return null;
        }

        isSubmitButton(element) {
            if (!element) return false;
            
            // فحص الرؤية والتفاعل
            const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
            const isEnabled = !element.disabled && !element.classList.contains('disabled');
            
            if (!isVisible || !isEnabled) return false;
            
            // فحص النص
            const text = (element.textContent || element.value || element.title || '').trim();
            
            // النصوص المقبولة للتقديم
            const submitTexts = ['تقديم', 'أقدم', 'قدم الآن', 'تقدم', 'Apply', 'Submit'];
            const isSubmitText = submitTexts.some(submitText => text === submitText);
            
            if (isSubmitText) {
                return true;
            }
            
            // فحص أجزاء من النص
            const partialTexts = ['تقديم', 'apply'];
            const hasPartialText = partialTexts.some(partial => 
                text.toLowerCase().includes(partial.toLowerCase())
            );
            
            // فحص الفئات والخصائص
            const className = element.className || '';
            const hasSubmitClass = className.includes('submit') || 
                                  className.includes('apply') || 
                                  className.includes('btn-primary');
            
            return hasPartialText && hasSubmitClass;
        }

        logAvailableButtons() {
            console.log('🔍 الأزرار والعناصر التفاعلية المتاحة في الصفحة:');
            const allInteractive = document.querySelectorAll(
                'button, input[type="submit"], input[type="button"], a[href], [role="button"]'
            );
            
            allInteractive.forEach((element, index) => {
                if (element.offsetWidth > 0 && element.offsetHeight > 0) {
                    const text = (element.textContent || element.value || element.title || '').trim();
                    if (text.length > 0 && text.length < 50) {
                        console.log(`عنصر ${index}: "${text}" - enabled: ${!element.disabled} - classes: ${element.className}`);
                    }
                }
            });
        }

        checkIfCurrentJobApplied() {
            // فحص محسن لحالة التقديم في صفحة التفاصيل
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
            
            // فحص النص
            for (const indicator of appliedIndicators) {
                if (pageText.includes(indicator)) {
                    console.log(`✅ وجد مؤشر التقديم المسبق: ${indicator}`);
                    return true;
                }
            }
            
            // فحص أزرار الاستعراض
            const reviewButtons = document.querySelectorAll('button, a');
            for (const button of reviewButtons) {
                const text = button.textContent.trim();
                if (text.includes('استعراض طلب التقديم') || text.includes('استعراض الطلب')) {
                    console.log('✅ وجد زر "استعراض طلب التقديم"');
                    return true;
                }
            }
            
            // فحص حالة زر التقديم
            const submitButton = this.findSubmitButtonImproved();
            if (submitButton) {
                const isDisabled = submitButton.disabled || 
                                 submitButton.classList.contains('disabled') ||
                                 submitButton.getAttribute('aria-disabled') === 'true';
                
                if (isDisabled) {
                    console.log('✅ زر التقديم معطل - قد يكون مُقدم عليها');
                    return true;
                }
            }
            
            console.log('❌ لم يتم العثور على مؤشرات التقديم المسبق');
            return false;
        }

        analyzeJobListPage() {
            // تحليل صفحة قائمة الوظائف
            this.currentPage = this.extractCurrentPageNumber();
            const totalJobs = document.querySelectorAll('a[href*="JobDetails"]').length;
            
            console.log(`📊 الصفحة الحالية: ${this.currentPage}`);
            console.log(`📋 عدد الوظائف في الصفحة: ${totalJobs}`);
            
            this.resumeData = {
                type: 'jobList',
                currentPage: this.currentPage,
                totalJobs: totalJobs,
                url: window.location.href
            };
        }

        extractCurrentPageNumber() {
            // استخراج رقم الصفحة الحالية
            const activePageBtn = document.querySelector('.pagination-button.is--active, .pagination .active');
            if (activePageBtn) {
                const pageNum = parseInt(activePageBtn.textContent.trim());
                if (!isNaN(pageNum)) {
                    return pageNum;
                }
            }
            
            // البحث في URL
            const urlMatch = window.location.href.match(/page[=:](\d+)/i);
            if (urlMatch) {
                return parseInt(urlMatch[1]);
            }
            
            return 1; // افتراضي
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

        // إصلاح دالة handleMessage في content.js
async handleMessage(message, sendResponse) {
    console.log('📨 استلام رسالة:', message.action);
    
    try {
        switch (message.action) {
            case 'PING':
                // رد فوري للـ ping
                const pingResponse = { 
                    status: 'active', 
                    pageType: this.pageType,
                    url: window.location.href,
                    timestamp: Date.now()
                };
                sendResponse(pingResponse);
                break;
                
            case 'START_AUTOMATION':
                // للأوامر الطويلة، أرسل رد فوري ثم نفذ العملية
                sendResponse({ success: true, message: 'بدء الأتمتة...' });
                
                // تنفيذ العملية بشكل منفصل
                setTimeout(async () => {
                    try {
                        this.settings = message.settings || this.settings;
                        console.log('🚀 بدء الأتمتة مع الإعدادات:', this.settings);
                        await this.startSmartAutomation();
                    } catch (error) {
                        console.error('❌ خطأ في بدء الأتمتة:', error);
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
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('❌ خطأ في معالجة الرسالة:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    // لا نعيد true هنا لتجنب إبقاء القناة مفتوحة
}

        pauseAutomation() {
            console.log('⏸️ إيقاف مؤقت');
            this.isPaused = true;
            this.showIndicator('⏸️ متوقف مؤقتاً', '#ffc107');
        }

        stopAutomation() {
            console.log('⏹️ إيقاف نهائي');
            this.isRunning = false;
            this.isPaused = false;
            this.hideIndicator();
        }

        async startSmartAutomation() {
            console.log('🧠 بدء الأتمتة الذكية');
            
            // فحص تسجيل الدخول
            if (!this.checkLoginStatus()) {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: '⚠️ يجب تسجيل الدخول أولاً' 
                });
                this.showIndicator('⚠️ غير مسجل دخول', '#ff4545', 5000);
                return;
            }
            
            this.isRunning = true;
            this.isPaused = false;
            
            // البدء الذكي حسب نوع الصفحة
            await this.smartStart();
        }

        async smartStart() {
            console.log(`🎯 البدء الذكي - نوع الصفحة: ${this.pageType}`);
            
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
                console.error('❌ خطأ في البدء الذكي:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        checkLoginStatus() {
            // فحص تسجيل الدخول المحسن
            const loginIndicators = ['تسجيل الدخول', 'دخول', 'Login'];
            const pageText = document.body.textContent || '';
            
            // إذا وجد نص تسجيل الدخول في مكان بارز، فالمستخدم غير مسجل
            const allButtons = document.querySelectorAll('button, a');
            
            for (const btn of allButtons) {
                const text = btn.textContent.trim();
                const isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0;
                
                if (isVisible && loginIndicators.some(indicator => text.includes(indicator))) {
                    // تأكد أنه ليس رابط لصفحة أخرى
                    if (!btn.href || btn.href.includes('login') || btn.href.includes('signin')) {
                        console.log('❌ المستخدم غير مسجل دخول');
                        return false;
                    }
                }
            }
            
            console.log('✅ المستخدم مسجل دخول');
            return true;
        }

        // باقي الدوال (startFromJobDetails, startFromJobList, إلخ) تبقى كما هي
        // سأضعها في تحديث منفصل لتوفير المساحة

        async startFromJobDetails() {
            console.log('📄 البدء من صفحة تفاصيل الوظيفة');
            
            const jobTitle = this.resumeData?.jobTitle || this.extractCurrentJobTitleImproved();
            
            this.showIndicator(`🔍 معالجة: ${jobTitle}`, '#ffc107');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 10, 
                text: `معالجة الوظيفة الحالية: ${jobTitle}` 
            });

            try {
                const result = await this.processCurrentJob();
                
                if (result.completed) {
                    console.log('✅ تمت معالجة الوظيفة الحالية بنجاح');
                    
                    this.showIndicator('✅ تم! سأعود للقائمة وأكمل باقي الوظائف', '#00ff88', 3000);
                    
                    await this.goBackToJobList();
                    await this.waitForContentToLoad();
                    await this.checkPageTypeWithWait();
                    
                    if (this.pageType === 'jobList') {
                        console.log('📋 عدت لقائمة الوظائف، سأكمل باقي الوظائف...');
                        
                        this.sendMessage('UPDATE_PROGRESS', { 
                            progress: 20, 
                            text: 'عدت لقائمة الوظائف، أكمل باقي الوظائف...' 
                        });
                        
                        await this.processCurrentPage();
                    } else {
                        console.log('⚠️ لم أعد لقائمة الوظائف، محاولة التنقل المباشر...');
                        await this.navigateToJobListDirect();
                    }
                } else {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: result.error || 'فشل في معالجة الوظيفة الحالية' 
                    });
                }
                
            } catch (error) {
                console.error('❌ خطأ في startFromJobDetails:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        async processCurrentJob() {
            try {
                const jobTitle = this.resumeData?.jobTitle || this.extractCurrentJobTitleImproved();
                
                console.log(`📝 معالجة الوظيفة الحالية: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                await this.handlePopups();
                await this.wait(2000);
                
                const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                
                if (alreadyApplied) {
                    console.log('⏭️ تم التخطي - مُقدم عليها مسبقاً');
                    
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'skipped' 
                    });
                    
                } else {
                    console.log('📝 بدء عملية التقديم...');
                    
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: 50, 
                        text: 'جاري التقديم على الوظيفة...' 
                    });
                    
                    const applicationResult = await this.applyForJobWithRetry();
                    this.handleApplicationResult(applicationResult, jobTitle);
                }

                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 80, 
                    text: 'تمت معالجة الوظيفة الحالية' 
                });
                
                return { completed: true };

            } catch (error) {
                console.error('❌ خطأ في معالجة الوظيفة الحالية:', error);
                return { completed: false, error: error.message };
            }
        }

        // دوال أخرى ضرورية
        sendMessage(action, data = {}) {
            try {
                const message = { action, ...data };
                
                chrome.runtime.sendMessage(message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('❌ خطأ في إرسال الرسالة:', chrome.runtime.lastError);
                    }
                });
            } catch (error) {
                console.error('❌ خطأ في إرسال الرسالة:', error);
            }
        }

        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async waitForContentToLoad() {
            console.log('⏳ انتظار تحميل المحتوى...');
            
            let attempts = 0;
            const maxAttempts = 20;
            
            while (attempts < maxAttempts) {
                if (document.readyState === 'complete') {
                    const contentLength = document.body.textContent.length;
                    const hasBasicElements = document.querySelectorAll('button, a, input').length > 5;
                    
                    if (contentLength > 1500 && hasBasicElements) {
                        console.log('✅ تم تحميل المحتوى بنجاح');
                        return true;
                    }
                }
                
                attempts++;
                console.log(`⏳ محاولة تحميل ${attempts}/${maxAttempts}...`);
                await this.wait(3000);
            }
            
            console.log('⚠️ انتهت محاولات انتظار التحميل');
            return false;
        }

        async checkPageTypeWithWait() {
            let attempts = 0;
            const maxAttempts = 5;
            
            while (attempts < maxAttempts) {
                this.checkPageType();
                
                if (this.pageType && this.pageType !== 'unknown') {
                    console.log(`✅ تم تحديد نوع الصفحة: ${this.pageType}`);
                    return;
                }
                
                attempts++;
                console.log(`⏳ محاولة ${attempts}/${maxAttempts} لتحديد نوع الصفحة...`);
                await this.wait(2000);
            }
            
            console.log('⚠️ فشل في تحديد نوع الصفحة، استخدام النوع الافتراضي');
            this.pageType = 'unknown';
        }

        async handlePopups() {
            console.log('🔍 فحص النوافذ المنبثقة');
            
            await this.wait(2000);
            
            const popups = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const popup of popups) {
                if (popup.offsetWidth > 0 && popup.offsetHeight > 0) {
                    console.log('💬 تم العثور على نافذة منبثقة');
                    
                    const buttons = popup.querySelectorAll('button, a');
                    for (const btn of buttons) {
                        const btnText = btn.textContent.trim();
                        if (btnText.includes('موافق') || 
                            btnText.includes('إغلاق') ||
                            btnText.includes('×')) {
                            
                            console.log('🚫 إغلاق النافذة المنبثقة');
                            await this.clickElementImproved(btn);
                            await this.wait(2000);
                            return;
                        }
                    }
                }
            }
        }

        async checkIfAlreadyAppliedInDetails() {
            console.log('🔍 فحص حالة التقديم في التفاصيل');
            
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
                    console.log(`✅ وجد مؤشر التقديم المسبق: ${indicator}`);
                    return true;
                }
            }
            
            const allButtons = document.querySelectorAll('button, a');
            
            for (const button of allButtons) {
                const text = button.textContent.trim();
                if (text.includes('استعراض طلب التقديم') || text.includes('استعراض الطلب')) {
                    console.log('✅ وجد زر "استعراض طلب التقديم"');
                    return true;
                }
            }
            
            const submitButton = this.findSubmitButtonImproved();
            if (submitButton && (submitButton.disabled || submitButton.classList.contains('disabled'))) {
                console.log('✅ زر التقديم معطل - قد يكون مُقدم عليها');
                return true;
            }
            
            console.log('❌ لم يتم العثور على مؤشرات التقديم المسبق');
            return false;
        }

        async applyForJobWithRetry(maxRetries = 2) {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📝 محاولة التقديم ${attempt}/${maxRetries}`);
                    
                    const result = await this.applyForJob();
                    
                    if (result.success || result.type === 'rejection') {
                        return result;
                    }
                    
                    if (attempt < maxRetries) {
                        console.log('🔄 إعادة محاولة التقديم...');
                        await this.wait(3000);
                    }
                    
                } catch (error) {
                    console.error(`❌ خطأ في محاولة التقديم ${attempt}:`, error);
                    if (attempt === maxRetries) {
                        return { success: false, reason: error.message };
                    }
                }
            }
            
            return { success: false, reason: 'فشل في جميع محاولات التقديم' };
        }

        async applyForJob() {
            console.log('📝 بدء عملية التقديم المحسنة');
            
            try {
                await this.wait(2000);
                
                const submitButton = this.findSubmitButtonImproved();
                
                if (!submitButton) {
                    console.log('❌ لم يتم العثور على زر التقديم');
                    return { success: false, reason: 'لم يتم العثور على زر التقديم' };
                }

                console.log('✅ تم العثور على زر التقديم:', submitButton);
                console.log('👆 النقر على زر التقديم...');
                
                await this.clickElementImproved(submitButton);
                
                console.log('⏳ انتظار نافذة التأكيد...');
                await this.wait(3000);
                
                const confirmResult = await this.handleConfirmationDialog();
                if (!confirmResult) {
                    console.log('⚠️ لم يتم العثور على نافذة التأكيد، ربما تم التقديم مباشرة');
                } else {
                    console.log('✅ تم التعامل مع نافذة التأكيد');
                }
                
                console.log('⏳ انتظار نافذة النتيجة...');
                await this.wait(4000);
                
                const result = await this.handleResultDialog();
                
                console.log('📊 نتيجة التقديم:', result);
                return result;

            } catch (error) {
                console.error('❌ خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        async handleConfirmationDialog() {
            console.log('🔍 البحث المحسن عن نافذة التأكيد');
            
            let attempts = 0;
            const maxAttempts = 5;
            
            while (attempts < maxAttempts) {
                const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], .popup');
                
                for (const dialog of dialogs) {
                    if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                        const text = dialog.textContent;
                        
                        console.log('💬 نافذة منبثقة موجودة:', text.substring(0, 100));
                        
                        if (text.includes('هل أنت متأكد') || text.includes('تأكيد') || text.includes('متأكد من التقديم')) {
                            console.log('✅ تم العثور على نافذة التأكيد');
                            
                            const buttons = dialog.querySelectorAll('button, a, input[type="button"]');
                            for (const btn of buttons) {
                                const btnText = (btn.textContent || btn.value || '').trim();
                                console.log('🔍 زر في النافذة:', btnText);
                                
                                if (btnText === 'تقديم' || btnText === 'تأكيد' || btnText === 'موافق') {
                                    console.log('✅ النقر على زر التأكيد:', btnText);
                                    await this.clickElementImproved(btn);
                                    await this.wait(2000);
                                    return true;
                                }
                            }
                        }
                    }
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`⏳ محاولة ${attempts}/${maxAttempts} للعثور على نافذة التأكيد...`);
                    await this.wait(2000);
                }
            }
            
            console.log('⚠️ لم يتم العثور على نافذة التأكيد');
            return false;
        }

        async handleResultDialog() {
            console.log('🔍 البحث المحسن عن نافذة النتيجة');
            
            let attempts = 0;
            const maxAttempts = 8;
            
            while (attempts < maxAttempts) {
                const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], .popup');
                
                for (const dialog of dialogs) {
                    if (dialog.offsetWidth > 0 && dialog.offsetHeight > 0) {
                        const text = dialog.textContent;
                        
                        console.log('💬 فحص نافذة النتيجة:', text.substring(0, 150));
                        
                        if (text.includes('تم التقديم بنجاح') || text.includes('نجح التقديم') || text.includes('تم بنجاح')) {
                            console.log('✅ تم التقديم بنجاح!');
                            
                            const closeButton = this.findCloseButton(dialog);
                            if (closeButton) {
                                await this.clickElementImproved(closeButton);
                                await this.wait(2000);
                            }
                            
                            return { success: true, reason: 'تم التقديم بنجاح' };
                        }
                        
                        else if (text.includes('عذراً') || text.includes('لا يمكنك التقديم') || text.includes('غير مؤهل') || text.includes('لا يطابق')) {
                            console.log('❌ تم رفض التقديم');
                            
                            const rejectionReason = this.extractRejectionReason(text);
                            console.log('📋 سبب الرفض:', rejectionReason);
                            
                            const closeButton = this.findCloseButton(dialog);
                            if (closeButton) {
                                await this.clickElementImproved(closeButton);
                                await this.wait(2000);
                            }
                            
                            return { 
                                success: false, 
                                reason: rejectionReason,
                                type: 'rejection' 
                            };
                        }
                    }
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    console.log(`⏳ محاولة ${attempts}/${maxAttempts} للعثور على نافذة النتيجة...`);
                    await this.wait(2000);
                }
            }
            
            console.log('⚠️ لم يتم العثور على نافذة نتيجة واضحة');
            return { success: false, reason: 'لم يتم العثور على نتيجة واضحة', type: 'unknown' };
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

        findCloseButton(dialog) {
            const buttons = dialog.querySelectorAll('button');
            
            for (const btn of buttons) {
                const text = btn.textContent.trim().toLowerCase();
                if (text === 'إغلاق' || text === 'اغلاق' || text === 'موافق') {
                    return btn;
                }
            }
            
            return buttons[buttons.length - 1];
        }

        handleApplicationResult(result, jobTitle) {
            if (result.success) {
                this.stats.applied++;
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'success' 
                });
                console.log('✅ تم التقديم بنجاح');
                
            } else if (result.type === 'rejection') {
                this.stats.rejected = (this.stats.rejected || 0) + 1;
                this.saveRejectionData(jobTitle, result.reason);
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'rejected',
                    reason: result.reason
                });
                console.log('❌ تم رفض التقديم:', result.reason);
                
            } else {
                this.stats.skipped++;
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'error',
                    reason: result.reason
                });
                console.log('⚠️ فشل التقديم:', result.reason);
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
                console.error('❌ خطأ في حفظ بيانات الرفض:', error);
            }
        }

        async clickElementImproved(element) {
            if (!element) return false;
            
            try {
                const currentUrl = window.location.href;
                console.log('🎯 URL الحالي:', currentUrl);
                
                if (element.tagName === 'A') {
                    element.removeAttribute('target');
                    element.target = '_self';
                    console.log('🔗 رابط الوظيفة:', element.href);
                }
                
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                await this.wait(3000);
                
                const stopPropagation = (e) => {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                };
                
                document.addEventListener('click', stopPropagation, { capture: true, once: true });
                
                if (element.href && element.tagName === 'A') {
                    console.log('🎯 التنقل المباشر للرابط');
                    window.location.href = element.href;
                    return true;
                }
                
                console.log('🎯 محاولة النقر العادي');
                element.click();
                
                await this.wait(2000);
                
                if (window.location.href !== currentUrl) {
                    console.log('✅ تم التنقل بنجاح');
                    return true;
                }
                
                console.log('⚠️ لم يتغير URL، جرب طرق أخرى');
                
                const events = ['mousedown', 'mouseup', 'click'];
                for (const eventType of events) {
                    const event = new MouseEvent(eventType, {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        button: 0
                    });
                    element.dispatchEvent(event);
                    await this.wait(500);
                }
                
                await this.wait(2000);
                
                if (window.location.href !== currentUrl) {
                    console.log('✅ تم التنقل بعد الأحداث المتعددة');
                    return true;
                }
                
                if (element.parentElement) {
                    console.log('🎯 محاولة النقر على العنصر الأب');
                    const parentLink = element.closest('a');
                    if (parentLink && parentLink !== element) {
                        parentLink.click();
                        await this.wait(2000);
                        
                        if (window.location.href !== currentUrl) {
                            console.log('✅ تم التنقل عبر العنصر الأب');
                            return true;
                        }
                    }
                }
                
                console.log('❌ فشل في جميع محاولات النقر');
                return false;
                
            } catch (error) {
                console.error('❌ خطأ في النقر المحسن:', error);
                return false;
            }
        }

async goBackToJobList() {
    console.log('🔙 العودة لقائمة الوظائف');
    
    const backButton = document.querySelector('button[aria-label*="back"], .back-button, [class*="back"]');
    if (backButton && backButton.offsetWidth > 0) {
        await this.clickElementImproved(backButton);
    } else {
        window.history.back();
    }
    
    await this.waitForNavigationImproved();
    await this.wait(4000);
    
    this.checkPageType();
    
    if (this.pageType === 'jobList') {
        console.log('✅ تم العودة بنجاح');
        window.scrollTo(0, 0);
        
        // 🚀 الإضافة الجديدة: استكمال معالجة باقي الوظائف
        if (this.isRunning && !this.isPaused) {
            console.log('🔄 استكمال معالجة باقي الوظائف في نفس الصفحة...');
            await this.wait(2000);
            await this.continueProcessingCurrentPage();
        }
    } else {
        console.log('⚠️ قد تكون العودة لم تنجح، محاولة التنقل المباشر');
        const exploreJobsLink = document.querySelector('a[href*="ExploreJobs"], a[href*="JobTab=1"]');
        if (exploreJobsLink) {
            await this.clickElementImproved(exploreJobsLink);
            await this.waitForNavigationImproved();
            await this.wait(3000);
            this.checkPageType();
            
            // 🚀 الإضافة الجديدة: استكمال بعد التنقل المباشر
            if (this.pageType === 'jobList' && this.isRunning && !this.isPaused) {
                console.log('🔄 استكمال معالجة بعد التنقل المباشر...');
                await this.wait(2000);
                await this.continueProcessingCurrentPage();
            }
        }
    }
}
async continueProcessingCurrentPage() {
    try {
        console.log('🔄 استكمال معالجة الصفحة الحالية...');
        
        // التأكد من تحميل المحتوى
        await this.waitForContentToLoad();
        
        // الحصول على قائمة الوظائف المحدثة
        const jobCards = this.getJobCardsWithRetry();
        console.log(`📋 وجد ${jobCards.length} وظيفة في الصفحة`);
        
        if (jobCards.length === 0) {
            console.log('⚠️ لا توجد وظائف متبقية، الانتقال للصفحة التالية...');
            await this.goToNextPage();
            return;
        }
        
        // العثور على الوظيفة التالية التي لم يتم معالجتها
        for (let i = this.currentJobIndex; i < jobCards.length; i++) {
            if (!this.isRunning || this.isPaused) {
                console.log('🛑 تم إيقاف العملية أثناء المعالجة');
                return;
            }
            
            const jobCard = jobCards[i];
            console.log(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
            
            // تحديث المؤشر الحالي
            this.currentJobIndex = i + 1;
            
            const success = await this.processJobWithRetry(jobCard, i + 1);
            
            if (!success) {
                console.log(`⚠️ فشل في الوظيفة ${i + 1}، الانتقال للتالية`);
            }
            
            const progress = ((i + 1) / jobCards.length) * 100;
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: progress, 
                text: `الوظيفة ${i + 1}/${jobCards.length}` 
            });

            await this.wait(this.getRandomDelay());
        }
        
        // إعادة تعيين المؤشر
        this.currentJobIndex = 0;
        
        // الانتقال للصفحة التالية
        console.log('✅ انتهت معالجة الصفحة، الانتقال للصفحة التالية...');
        await this.goToNextPage();
        
    } catch (error) {
        console.error('❌ خطأ في استكمال معالجة الصفحة:', error);
        this.sendMessage('AUTOMATION_ERROR', { 
            error: error.message 
        });
    }
}

        async waitForNavigationImproved() {
            console.log('⏳ انتظار التنقل المحسن...');
            
            const initialUrl = window.location.href;
            let attempts = 0;
            const maxAttempts = 15;
            
            return new Promise((resolve) => {
                const checkNavigation = () => {
                    attempts++;
                    const currentUrl = window.location.href;
                    
                    if (currentUrl !== initialUrl) {
                        console.log('✅ تم التنقل من:', initialUrl);
                        console.log('✅ إلى:', currentUrl);
                        
                        setTimeout(() => {
                            resolve(true);
                        }, 2000);
                        return;
                    }
                    
                    if (document.readyState === 'complete') {
                        const contentLength = document.body.textContent.length;
                        if (contentLength > 500) {
                            console.log('✅ تم تحميل محتوى كافي');
                            resolve(true);
                            return;
                        }
                    }
                    
                    if (attempts >= maxAttempts) {
                        console.log('⚠️ انتهت محاولات انتظار التنقل');
                        resolve(false);
                        return;
                    }
                    
                    setTimeout(checkNavigation, 2000);
                };
                
                setTimeout(checkNavigation, 1000);
            });
        }
async waitForJobDetailsFullLoad() {
    console.log('⏳ انتظار التحميل الكامل لصفحة التفاصيل...');
    
    let attempts = 0;
    const maxAttempts = 20; // زيادة عدد المحاولات
    
    while (attempts < maxAttempts) {
        attempts++;
        
        // انتظار أطول بين كل فحص
        await this.wait(3000);
        
        console.log(`🔍 فحص التحميل - محاولة ${attempts}/${maxAttempts}`);
        
        // فحص URL أولاً
        if (!window.location.href.includes('JobDetails')) {
            console.log('❌ لم نصل لصفحة التفاصيل بعد');
            continue;
        }
        
        // فحص طول المحتوى
        const contentLength = document.body.textContent.length;
        console.log(`📄 طول المحتوى الحالي: ${contentLength}`);
        
        if (contentLength < 1500) {
            console.log('⏳ المحتوى قصير، انتظار أكثر...');
            continue;
        }
        
        // فحص وجود العناصر المهمة
        const hasJobTitle = document.querySelector('span.heading5, .heading5');
        const hasJobContent = document.body.textContent.includes('الوصف الوظيفي');
        const pageReady = document.readyState === 'complete';
        
        console.log(`🔍 فحص العناصر:
            - عنوان الوظيفة: ${!!hasJobTitle}
            - محتوى الوظيفة: ${hasJobContent}
            - الصفحة مكتملة: ${pageReady}
            - طول المحتوى: ${contentLength}`);
        
        if (hasJobTitle && hasJobContent && pageReady && contentLength > 1500) {
            console.log('✅ تم تحميل صفحة التفاصيل بالكامل!');
            
            // انتظار إضافي للتأكد من تحميل الأزرار
            await this.wait(4000);
            console.log('✅ انتظار إضافي مكتمل');
            return true;
        }
        
        console.log(`⏳ لم يكتمل التحميل بعد، محاولة ${attempts}/${maxAttempts}`);
    }
    
    console.log('⚠️ انتهت محاولات انتظار التحميل الكامل');
    // حتى لو فشل، امنح وقت إضافي وحاول المتابعة
    await this.wait(5000);
    return false;
}
        async navigateToJobListDirect() {
            console.log('🔄 التنقل المباشر لقائمة الوظائف...');
            
            try {
                const jobListUrls = [
                    'https://jadarat.sa/Jadarat/ExploreJobs',
                    'https://jadarat.sa/Jadarat/?JobTab=1',
                    window.location.origin + '/Jadarat/ExploreJobs'
                ];
                
                const targetUrl = jobListUrls[0];
                console.log('🔗 التنقل إلى:', targetUrl);
                
                window.location.href = targetUrl;
                
                await this.waitForNavigationImproved();
                await this.waitForContentToLoad();
                await this.checkPageTypeWithWait();
                
                if (this.pageType === 'jobList') {
                    console.log('✅ نجح التنقل لقائمة الوظائف');
                    await this.processCurrentPage();
                } else {
                    throw new Error('فشل في التنقل لقائمة الوظائف');
                }
                
            } catch (error) {
                console.error('❌ خطأ في التنقل المباشر:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'فشل في التنقل لقائمة الوظائف' 
                });
            }
        }

        async startFromJobList() {
            console.log('📋 البدء من قائمة الوظائف');
            
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
                console.log('🔄 معالجة الصفحة الحالية');
                
                await this.wait(4000);
                
                const jobCards = this.getJobCardsWithRetry();
                this.totalJobs = jobCards.length;

                console.log(`💼 تم العثور على ${this.totalJobs} وظيفة`);

                if (this.totalJobs === 0) {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'لم يتم العثور على وظائف في هذه الصفحة' 
                    });
                    return;
                }

                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 0, 
                    text: `العثور على ${this.totalJobs} وظيفة في الصفحة ${this.currentPage}` 
                });

            for (let i = this.currentJobIndex; i < jobCards.length; i++) {                    if (!this.isRunning || this.isPaused) {
                        console.log('🛑 تم إيقاف العملية');
                        return;
                    }

                    const jobCard = jobCards[i];
                    console.log(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
                    this.currentJobIndex = i + 1;

                    const success = await this.processJobWithRetry(jobCard, i + 1);
                    
                    if (!success) {
                        console.log(`⚠️ فشل في الوظيفة ${i + 1}، الانتقال للتالية`);
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
                console.error('❌ خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        getJobCardsWithRetry(maxRetries = 3) {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                console.log(`🔍 محاولة كشف الوظائف ${attempt}/${maxRetries}`);
                
                const jobCards = this.getJobCards();
                
                if (jobCards.length > 0) {
                    console.log(`✅ تم العثور على ${jobCards.length} وظيفة`);
                    return jobCards;
                }
                
                console.log(`⚠️ لم يتم العثور على وظائف في المحاولة ${attempt}`);
                
                if (attempt < maxRetries) {
                    setTimeout(() => {
                        window.scrollTo(0, document.body.scrollHeight / 2);
                    }, 1000 * attempt);
                }
            }
            
            return [];
        }

        getJobCards() {
            console.log('🔍 البحث عن بطاقات الوظائف');
            
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
                    console.log(`🔗 تم العثور على ${jobLinks.length} رابط باستخدام: ${selector}`);
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
                        console.log(`✅ وظيفة متاحة: ${jobTitle}`);
                    } else {
                        console.log(`⏭️ تخطي وظيفة مُقدم عليها: ${jobTitle}`);
                        this.stats.skipped++;
                    }
                }
            }

            console.log(`📊 المجموع: ${jobCards.length} وظيفة متاحة للتقديم`);
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
                    console.log(`🎯 محاولة ${attempt}/${maxRetries} لمعالجة: ${jobCard.title}`);
                    
                    await this.processJob(jobCard, jobIndex);
                    return true;
                    
                } catch (error) {
                    console.error(`❌ فشلت المحاولة ${attempt}:`, error.message);
                    
                    if (attempt < maxRetries) {
                        console.log('🔄 إعادة المحاولة...');
                        
                        try {
                            await this.goBackToJobList();
                        } catch (backError) {
                            console.error('❌ فشل في العودة:', backError.message);
                        }
                        
                        await this.wait(3000);
                    }
                }
            }
            
            console.error(`❌ فشل نهائياً في معالجة: ${jobCard.title}`);
            this.stats.skipped++;
            this.stats.total++;
            this.sendMessage('UPDATE_STATS', { stats: this.stats });
            
            return false;
        }

        async processJob(jobCard, jobIndex) {
            const jobTitle = jobCard.title;
            console.log(`🎯 معالجة الوظيفة ${jobIndex}: ${jobTitle}`);
            
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobTitle, 
                status: 'processing' 
            });

            this.highlightElement(jobCard.link);

            console.log('👆 النقر على رابط الوظيفة:', jobCard.link.href);
            const clickSuccess = await this.clickElementImproved(jobCard.link);
            
            if (!clickSuccess) {
                throw new Error('فشل في النقر على رابط الوظيفة');
            }
            
            console.log('⏳ انتظار التنقل للصفحة...');
await this.waitForNavigationImproved();

// 🚀 إضافة انتظار محسن لتحميل صفحة التفاصيل
console.log('⏳ انتظار تحميل كامل لصفحة التفاصيل...');
await this.waitForJobDetailsFullLoad();
// 🚀 إضافة انتظار محسن لتحميل صفحة التفاصيل
        // فحص إضافي للتأكد من التحميل الكامل
console.log('🔍 فحص نهائي للتحميل...');
const finalContentLength = document.body.textContent.length;
console.log(`📊 طول المحتوى النهائي: ${finalContentLength}`);

if (finalContentLength < 1500) {
    console.log('⚠️ المحتوى لا يزال قصير، انتظار إضافي...');
    await this.wait(8000); // انتظار طويل
    await this.checkPageTypeWithWait();
}

            let retryCount = 0;
            const maxRetries = 5;

            while (this.pageType !== 'jobDetails' && retryCount < maxRetries) {
                console.log(`⚠️ لم نصل لصفحة التفاصيل بعد، محاولة ${retryCount + 1}/${maxRetries}`);
                console.log(`📍 النوع الحالي: ${this.pageType}`);
                console.log(`📍 URL الحالي: ${window.location.href}`);
                
                retryCount++;
                
                await this.wait(3000);
                
                await this.checkPageTypeWithWait();
                
                if (this.pageType !== 'jobDetails' && retryCount < maxRetries) {
                    console.log('🔄 إعادة محاولة النقر...');
                    
                    if (window.location.href.includes('JobDetails')) {
                        window.history.back();
                        await this.wait(3000);
                    }
                    
                    const jobCards = this.getJobCardsWithRetry();
                    const targetJob = jobCards.find(job => job.title === jobTitle);
                    
                    if (targetJob) {
                        await this.clickElementImproved(targetJob.link);
                        await this.waitForNavigationImproved();
                        await this.waitForContentToLoad();
                    }
                }
            }
            
            if (this.pageType !== 'jobDetails') {
                console.log(`❌ فشل في الوصول لصفحة التفاصيل بعد ${maxRetries} محاولات`);
                console.log(`📍 النوع النهائي: ${this.pageType}`);
                console.log(`📍 URL النهائي: ${window.location.href}`);
                
                if (window.location.href.includes('JobDetails')) {
                    console.log('🔍 URL يحتوي على JobDetails، إجبار نوع الصفحة...');
                    this.pageType = 'jobDetails';
                } else {
                    throw new Error(`فشل في الوصول لصفحة التفاصيل. النوع: ${this.pageType}, URL: ${window.location.href}`);
                }
            }
            
            console.log('✅ وصلنا لصفحة التفاصيل بنجاح');
            
            await this.handlePopups();
            
            const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
            
            if (alreadyApplied) {
                this.stats.skipped++;
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'skipped' 
                });
                console.log('⏭️ مقدم عليها مسبقاً');
            } else {
                const result = await this.applyForJobWithRetry();
                this.handleApplicationResult(result, jobTitle);
            }

            this.stats.total++;
            this.sendMessage('UPDATE_STATS', { stats: this.stats });

            await this.goBackToJobList();
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
            console.log('🔍 البحث عن الصفحة التالية');
            
            const nextButton = document.querySelector('button[aria-label="go to next page"]:not([disabled])');
            
            if (nextButton) {
                console.log('➡️ الانتقال للصفحة التالية');
                this.currentPage++;

                this.currentJobIndex = 0; // إعادة تعيين مؤشر الوظائف للصفحة الجديدة
                await this.clickElementImproved(nextButton);
                await this.waitForNavigationImproved();
                await this.wait(5000);
                
                await this.processCurrentPage();
            } else {
                console.log('🏁 انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
                this.showIndicator('🎉 تم الانتهاء من جميع الوظائف!', '#00ff88', 10000);
            }
        }

        async navigateToJobList() {
            console.log('🔄 الانتقال لقائمة الوظائف');
            
            this.showIndicator('🔄 جاري الانتقال لقائمة الوظائف...', '#ffc107');
            
            const exploreJobsLink = document.querySelector('a[href*="ExploreJobs"], a[href*="JobTab=1"]');
            
            if (exploreJobsLink) {
                await this.clickElementImproved(exploreJobsLink);
                await this.waitForNavigationImproved();
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

// ========== دوال محسنة للأتمتة الكاملة ==========
    
    // إضافة دالة البحث المحسن عن الوظائف
    window.jadaratAutoContent.getJobCardsWithRealWait = async function() {
        console.log('🔍 🔍 بدء البحث الشامل عن الوظائف...');
        
        // انتظار أطول لتحميل كامل
        for (let waitTime = 5; waitTime <= 20; waitTime += 5) {
            console.log(`⏳ انتظار ${waitTime} ثانية لتحميل الوظائف...`);
            await this.wait(waitTime * 1000);
            
            // تجربة scroll متعدد لتحفيز التحميل
            console.log('📜 تحفيز تحميل المحتوى...');
            window.scrollTo(0, 0);
            await this.wait(1000);
            window.scrollTo(0, document.body.scrollHeight);
            await this.wait(2000);
            window.scrollTo(0, document.body.scrollHeight / 2);
            await this.wait(2000);
            window.scrollTo(0, 0);
            await this.wait(2000);
            
            const jobCards = this.findJobsEverywhere();
            
            if (jobCards.length > 0) {
                console.log(`✅ ✅ وجدت ${jobCards.length} وظيفة بعد ${waitTime} ثانية!`);
                return jobCards;
            }
            
            console.log(`⚠️ لا توجد وظائف بعد ${waitTime} ثانية، جرب انتظار أطول...`);
        }
        
        console.log('❌ فشل في العثور على وظائف نهائياً');
        return [];
    };

    // إضافة دالة البحث الشامل
    window.jadaratAutoContent.findJobsEverywhere = function() {
        console.log('🔍 البحث الشامل في جميع أنحاء الصفحة...');
        
        const jobCards = [];
        
        // قائمة شاملة من المحددات المحتملة
        const allSelectors = [
            'a[href*="JobDetails"]',
            'a[href*="Param="]',
            'a[data-link*="Job"]',
            'a[href*="/Jadarat/JobDetails"]',
            'a[href*="IsFromJobfair=false"]',
            'a[href*="JobTab=1"]'
        ];
        
        console.log('🔍 جربة جميع المحددات...');
        
        for (const selector of allSelectors) {
            try {
                const links = document.querySelectorAll(selector);
                console.log(`🔗 المحدد "${selector}": ${links.length} رابط`);
                
                for (const link of links) {
                    if (this.isJobLinkValid(link)) {
                        const jobData = this.createJobDataFromLink(link);
                        if (jobData) {
                            jobCards.push(jobData);
                        }
                    }
                }
                
                if (jobCards.length > 0) {
                    console.log(`✅ وجدت وظائف باستخدام: ${selector}`);
                    break;
                }
            } catch (error) {
                console.log(`⚠️ خطأ في المحدد ${selector}:`, error.message);
            }
        }
        
        // تنظيف المكررات
        const uniqueJobs = this.removeDuplicateJobs(jobCards);
        
        console.log(`📊 النتيجة النهائية: ${uniqueJobs.length} وظيفة فريدة`);
        return uniqueJobs;
    };

    // فحص صحة رابط الوظيفة
    window.jadaratAutoContent.isJobLinkValid = function(link) {
        if (!link.href) return false;
        
        const href = link.href.toLowerCase();
        
        if (!href.includes('jadarat.sa')) return false;
        
        const jobIndicators = ['jobdetails', 'param=', 'job'];
        const hasJobIndicator = jobIndicators.some(indicator => 
            href.includes(indicator.toLowerCase())
        );
        
        return hasJobIndicator;
    };

    // إنشاء بيانات الوظيفة
    window.jadaratAutoContent.createJobDataFromLink = function(link) {
        try {
            const title = this.getJobTitle(link);
            const container = this.findJobContainer(link);
            const isApplied = this.checkIfAlreadyApplied(container || link);
            
            return {
                link: link,
                title: title,
                href: link.href,
                container: container,
                isApplied: isApplied
            };
        } catch (error) {
            console.error('❌ خطأ في إنشاء بيانات الوظيفة:', error);
            return null;
        }
    };

    // إزالة الوظائف المكررة  
    window.jadaratAutoContent.removeDuplicateJobs = function(jobCards) {
        const seen = new Set();
        return jobCards.filter(job => {
            const key = job.href || job.title;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    };

    // دالة العودة المؤكدة لقائمة الوظائف
    window.jadaratAutoContent.returnToJobListComplete = async function() {
        console.log('🔙 🔙 العودة المؤكدة لقائمة الوظائف...');
        
        try {
            // طريقة 1: history.back()
            if (window.location.href.includes('JobDetails')) {
                console.log('🔙 استخدام history.back()');
                window.history.back();
                await this.wait(4000);
            }
            
            // فحص إذا عدنا لقائمة الوظائف
            if (window.location.href.includes('ExploreJobs')) {
                console.log('✅ عدنا لقائمة الوظائف بنجاح');
                await this.wait(3000);
                
                // 🚀 الجزء المهم: استكمال معالجة باقي الوظائف
                if (this.isRunning && !this.isPaused) {
                    console.log('🔄 🔄 استكمال معالجة باقي الوظائف...');
                    await this.processRemainingJobs();
                }
                return true;
            }
            
            // طريقة 2: التنقل المباشر
            console.log('🔄 التنقل المباشر لقائمة الوظائف...');
            const exploreJobsUrl = 'https://jadarat.sa/Jadarat/ExploreJobs';
            window.location.href = exploreJobsUrl;
            await this.wait(6000);
            
            // التأكد من التحميل
            await this.waitForJobListPageLoad();
            
            // 🚀 استكمال المعالجة بعد التنقل المباشر
            if (this.isRunning && !this.isPaused) {
                console.log('🔄 🔄 استكمال المعالجة بعد التنقل المباشر...');
                await this.processRemainingJobs();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في العودة لقائمة الوظائف:', error);
            return false;
        }
    };

    // معالجة باقي الوظائف
    window.jadaratAutoContent.processRemainingJobs = async function() {
        try {
            console.log('🔄 بدء معالجة باقي الوظائف...');
            
            // التأكد من تحميل المحتوى
            await this.waitForContentToLoad();
            
            // الحصول على قائمة الوظائف المحدثة
            const jobCards = await this.getJobCardsWithRealWait();
            console.log(`📋 وجد ${jobCards.length} وظيفة في الصفحة`);
            
            if (jobCards.length === 0) {
                console.log('⚠️ لا توجد وظائف متبقية، الانتقال للصفحة التالية...');
                await this.goToNextPage();
                return;
            }
            
            // العثور على الوظيفة التالية التي لم يتم معالجتها
            let nextJobIndex = this.currentJobIndex || 0;
            
            for (let i = nextJobIndex; i < jobCards.length; i++) {
                if (!this.isRunning || this.isPaused) {
                    console.log('🛑 تم إيقاف العملية أثناء المعالجة');
                    return;
                }
                
                const jobCard = jobCards[i];
                console.log(`📝 معالجة الوظيفة ${i + 1}/${jobCards.length}: ${jobCard.title}`);
                
                // تحديث المؤشر الحالي
                this.currentJobIndex = i + 1;
                
                const success = await this.processJobWithRetry(jobCard, i + 1);
                
                if (!success) {
                    console.log(`⚠️ فشل في الوظيفة ${i + 1}، الانتقال للتالية`);
                }
                
                const progress = ((i + 1) / jobCards.length) * 100;
                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: progress, 
                    text: `الوظيفة ${i + 1}/${jobCards.length}` 
                });

                await this.wait(this.getRandomDelay());
            }
            
            // إعادة تعيين المؤشر
            this.currentJobIndex = 0;
            
            // الانتقال للصفحة التالية
            console.log('✅ انتهت معالجة الصفحة، الانتقال للصفحة التالية...');
            await this.goToNextPage();
            
        } catch (error) {
            console.error('❌ خطأ في معالجة باقي الوظائف:', error);
            this.sendMessage('AUTOMATION_ERROR', { 
                error: error.message 
            });
        }
    };

    // انتظار تحميل قائمة الوظائف
    window.jadaratAutoContent.waitForJobListPageLoad = async function() {
        console.log('⏳ انتظار تحميل قائمة الوظائف...');
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            await this.wait(3000);
            attempts++;
            
            if (window.location.href.includes('ExploreJobs')) {
                const contentLength = document.body.textContent.length;
                if (contentLength > 800) {
                    console.log('✅ تم تحميل قائمة الوظائف');
                    return true;
                }
            }
            
            console.log(`⏳ محاولة ${attempts}/${maxAttempts}...`);
        }
        
        return false;
    };
}