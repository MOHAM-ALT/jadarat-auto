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
                
                if (pageText.length < 500) {
                    console.log('⚠️ المحتوى قصير جداً، انتظار إضافي...');
                    setTimeout(() => this.checkPageType(), 3000);
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

        // ==================== الدوال المحسنة الجديدة ====================

        // إصلاح البحث عن الوظائف مع انتظار أطول
        async getJobCardsWithRealWait() {
            console.log('🔍 🔍 بدء البحث الشامل عن الوظائف...');
            
            // انتظار أطول لتحميل كامل
            for (let waitTime = 5; waitTime <= 25; waitTime += 5) {
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
                
                // تجربة النقر على أي فلاتر أو أزرار "عرض المزيد"
                this.tryActivateFilters();
            }
            
            console.log('❌ فشل في العثور على وظائف نهائياً');
            return [];
        }

        // بحث شامل في كل مكان ممكن
        findJobsEverywhere() {
            console.log('🔍 البحث الشامل في جميع أنحاء الصفحة...');
            
            const jobCards = [];
            
            // قائمة شاملة من المحددات المحتملة
            const allSelectors = [
                // المحددات الأساسية المحتملة
                'a[href*="JobDetails"]',
                'a[href*="Param="]',
                'a[data-link*="Job"]',
                
                // محددات احتياطية
                'a[href*="/Jadarat/JobDetails"]',
                'a[href*="IsFromJobfair=false"]',
                'a[href*="JobTab=1"]',
                'a[href*="jadarat.sa"][href*="Job"]',
                
                // محددات عامة للوظائف
                '.job-card a',
                '.job-item a', 
                '.job-listing a',
                '[class*="job"] a',
                '[class*="card"] a',
                '[data-job] a',
                '[data-link] a',
                
                // محددات أكثر عمومية
                'div[class*="container"] a',
                'section a',
                'article a',
                'ul a',
                'li a'
            ];
            
            console.log('🔍 جربة جميع المحددات...');
            
            for (const selector of allSelectors) {
                try {
                    const links = document.querySelectorAll(selector);
                    console.log(`🔗 المحدد "${selector}": ${links.length} رابط`);
                    
                    for (const link of links) {
                        if (this.isJobLink(link)) {
                            const jobData = this.createJobData(link);
                            if (jobData) {
                                jobCards.push(jobData);
                            }
                        }
                    }
                    
                    if (jobCards.length > 0) {
                        console.log(`✅ وجدت وظائف باستخدام: ${selector}`);
                        break; // توقف عند أول محدد ناجح
                    }
                } catch (error) {
                    console.log(`⚠️ خطأ في المحدد ${selector}:`, error.message);
                }
            }
            
            // إذا لم نجد شيء، بحث يدوي في كل رابط
            if (jobCards.length === 0) {
                console.log('🔍 البحث اليدوي في جميع الروابط...');
                const allLinks = document.querySelectorAll('a[href]');
                console.log(`🔗 فحص ${allLinks.length} رابط...`);
                
                for (const link of allLinks) {
                    if (this.isJobLink(link)) {
                        const jobData = this.createJobData(link);
                        if (jobData) {
                            jobCards.push(jobData);
                        }
                    }
                }
            }
            
            // تنظيف المكررات
            const uniqueJobs = this.removeDuplicateJobs(jobCards);
            
            console.log(`📊 النتيجة النهائية: ${uniqueJobs.length} وظيفة فريدة`);
            return uniqueJobs;
        }

        // فحص إذا كان الرابط وظيفة
        isJobLink(link) {
            if (!link.href) return false;
            
            const href = link.href.toLowerCase();
            
            // يجب أن يحتوي على jadarat.sa
            if (!href.includes('jadarat.sa')) return false;
            
            // يجب أن يحتوي على مؤشرات الوظائف
            const jobIndicators = [
                'jobdetails',
                'param=',
                'job',
                'isfromjobfair=false'
            ];
            
            const hasJobIndicator = jobIndicators.some(indicator => 
                href.includes(indicator.toLowerCase())
            );
            
            if (!hasJobIndicator) return false;
            
            // تجاهل الروابط غير المفيدة
            const excludePatterns = [
                'javascript:',
                'mailto:',
                'tel:',
                '#',
                'void(0)'
            ];
            
            const shouldExclude = excludePatterns.some(pattern => 
                href.includes(pattern)
            );
            
            return !shouldExclude;
        }

        // إنشاء بيانات الوظيفة
        createJobData(link) {
            try {
                const title = this.extractJobTitle(link);
                const container = this.findJobContainer(link);
                const isApplied = this.checkIfApplied(container || link);
                
                return {
                    link: link,
                    title: title,
                    href: link.href,
                    container: container,
                    isApplied: isApplied,
                    isValid: true,
                    timestamp: Date.now()
                };
            } catch (error) {
                console.error('❌ خطأ في إنشاء بيانات الوظيفة:', error);
                return null;
            }
        }

        // استخراج عنوان الوظيفة
        extractJobTitle(link) {
            // جرب عدة طرق للحصول على العنوان
            const titleSources = [
                () => link.querySelector('span.heading4, .heading4, span[data-expression]')?.textContent?.trim(),
                () => link.querySelector('span, h1, h2, h3, h4, h5')?.textContent?.trim(),
                () => link.textContent?.trim(),
                () => link.title?.trim(),
                () => link.getAttribute('aria-label')?.trim(),
                () => link.closest('[data-container], .job-card')?.querySelector('span, h1, h2, h3, h4, h5')?.textContent?.trim()
            ];
            
            for (const getTitle of titleSources) {
                try {
                    const title = getTitle();
                    if (title && title.length > 5 && title.length < 100 && 
                        !title.includes('جدارات') && !title.includes('©')) {
                        return title;
                    }
                } catch (error) {
                    // تجاهل الأخطاء واجرب الطريقة التالية
                }
            }
            
            return `وظيفة رقم ${Date.now()}`;
        }

        // البحث عن حاوي الوظيفة
        findJobContainer(link) {
            const containerSelectors = [
                '[data-container]',
                '.job-card',
                '.job-item',
                '.card',
                'li',
                'div'
            ];
            
            for (const selector of containerSelectors) {
                const container = link.closest(selector);
                if (container && container !== link) {
                    return container;
                }
            }
            
            return link.parentElement;
        }

        // فحص التقديم المسبق
        checkIfApplied(element) {
            if (!element) return false;
            
            const text = element.textContent || '';
            const html = element.innerHTML || '';
            
            const appliedKeywords = ['تم التقدم', 'تم التقديم', 'مقدم عليها', 'مُسجل'];
            const appliedIcons = ['tickcircle', 'check-circle', 'checkmark'];
            
            return appliedKeywords.some(keyword => text.includes(keyword)) ||
                   appliedIcons.some(icon => html.includes(icon));
        }

        // إزالة الوظائف المكررة
        removeDuplicateJobs(jobCards) {
            const seen = new Set();
            return jobCards.filter(job => {
                const key = job.href || job.title;
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
        }

        // تجربة تفعيل الفلاتر
        tryActivateFilters() {
            console.log('🔍 محاولة تفعيل الفلاتر...');
            
            const filterButtons = document.querySelectorAll(
                'button, [class*="filter"] button'
            );
            
            filterButtons.forEach(btn => {
                const text = btn.textContent?.trim() || '';
                if ((text.includes('عرض') || text.includes('تطبيق') || text.includes('فلتر')) &&
                    btn.offsetWidth > 0 && !btn.disabled) {
                    console.log('🔘 النقر على فلتر:', text);
                    btn.click();
                }
            });
        }

        // دالة معالجة الصفحة المحسنة
        async processCurrentPageComplete() {
            if (!this.isRunning || this.isPaused) {
                console.log('🛑 العملية متوقفة');
                return;
            }

            try {
                console.log('🚀 🚀 بدء معالجة الصفحة الكاملة');
                
                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 10, 
                    text: `جاري تحليل الصفحة ${this.currentPage}...` 
                });

                // البحث الشامل عن الوظائف
                const jobCards = await this.getJobCardsWithRealWait();
                
                if (jobCards.length === 0) {
                    console.log('⚠️ لا توجد وظائف في هذه الصفحة، الانتقال للتالية...');
                    await this.moveToNextPage();
                    return;
                }

                console.log(`💼 💼 بدء معالجة ${jobCards.length} وظيفة في الصفحة ${this.currentPage}`);
                
                // إحصائيات الصفحة
                let pageStats = {
                    processed: 0,
                    successful: 0,
                    failed: 0,
                    skipped: 0
                };

                // معالجة كل وظيفة بالتتابع
                for (let i = 0; i < jobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        console.log('🛑 تم إيقاف العملية');
                        return;
                    }

                    const jobCard = jobCards[i];
                    const jobNumber = i + 1;
                    
                    console.log(`\n🎯 🎯 ========== الوظيفة ${jobNumber}/${jobCards.length} ==========`);
                    console.log(`📝 المعالجة: ${jobCard.title}`);
                    
                    pageStats.processed++;
                    
                    // تحديث التقدم
                    const progress = (i / jobCards.length) * 100;
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: progress, 
                        text: `الصفحة ${this.currentPage}: ${jobNumber}/${jobCards.length} - ${jobCard.title}` 
                    });
                    
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobCard.title, 
                        status: 'processing' 
                    });

                    // تخطي الوظائف المُقدم عليها
                    if (jobCard.isApplied) {
                        console.log('⏭️ تخطي - مُقدم عليها مسبقاً');
                        pageStats.skipped++;
                        this.stats.skipped++;
                        this.stats.total++;
                        continue;
                    }

                    // معالجة الوظيفة
                    const result = await this.processOneJobCompletely(jobCard, jobNumber);
                    
                    if (result.success) {
                        pageStats.successful++;
                        console.log(`✅ ✅ نجحت الوظيفة ${jobNumber}`);
                    } else {
                        pageStats.failed++;
                        console.log(`❌ ❌ فشلت الوظيفة ${jobNumber}: ${result.error}`);
                    }

                    // انتظار بين الوظائف
                    console.log('⏳ انتظار قبل الوظيفة التالية...');
                    await this.wait(this.getRandomDelay());
                }

                // ملخص الصفحة
                console.log(`\n📊 📊 ملخص الصفحة ${this.currentPage}:`);
                console.log(`   📝 معالج: ${pageStats.processed}`);
                console.log(`   ✅ نجح: ${pageStats.successful}`);
                console.log(`   ❌ فشل: ${pageStats.failed}`);
                console.log(`   ⏭️ تخطي: ${pageStats.skipped}`);

                // إرسال الإحصائيات المحدثة
                this.sendMessage('UPDATE_STATS', { stats: this.stats });

                // الانتقال للصفحة التالية
                console.log('➡️ محاولة الانتقال للصفحة التالية...');
                await this.moveToNextPage();

            } catch (error) {
                console.error('❌ ❌ خطأ خطير في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: `خطأ في الصفحة ${this.currentPage}: ${error.message}` 
                });
            }
        }

        // معالجة وظيفة واحدة بالكامل
        async processOneJobCompletely(jobCard, jobNumber) {
            const maxRetries = 2;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`\n🔄 المحاولة ${attempt}/${maxRetries} للوظيفة ${jobNumber}`);
                    
                    // الانتقال لصفحة التفاصيل
                    const navigationResult = await this.navigateToJobDetails(jobCard);
                    if (!navigationResult.success) {
                        console.log(`❌ فشل التنقل: ${navigationResult.error}`);
                        continue;
                    }
                    
                    // معالجة التقديم
                    const applicationResult = await this.handleJobApplication(jobCard.title);
                    
                    // العودة لقائمة الوظائف
                    await this.returnToJobListForSure();
                    
                    if (applicationResult.success) {
                        return { success: true };
                    } else {
                        console.log(`⚠️ فشل التقديم في المحاولة ${attempt}: ${applicationResult.error}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ خطأ في المحاولة ${attempt}:`, error.message);
                    await this.returnToJobListForSure();
                }
            }
            
            // فشل نهائي
            this.stats.skipped++;
            this.stats.total++;
            return { success: false, error: 'فشل في جميع المحاولات' };
        }

        // التنقل لصفحة التفاصيل
        async navigateToJobDetails(jobCard) {
            try {
                console.log('🎯 الانتقال لصفحة التفاصيل...');
                
                // تمييز الوظيفة
                this.highlightElement(jobCard.link);
                
                const currentUrl = window.location.href;
                
                // النقر على الرابط
                console.log('👆 النقر على رابط الوظيفة...');
                
                // طرق متعددة للنقر
                const clickMethods = [
                    () => jobCard.link.click(),
                    () => {
                        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
                        jobCard.link.dispatchEvent(event);
                    },
                    () => {
                        if (jobCard.link.href) {
                            window.location.href = jobCard.link.href;
                        }
                    }
                ];
                
                let navigationSuccess = false;
                
                for (const clickMethod of clickMethods) {
                    try {
                        clickMethod();
                        await this.wait(4000);
                        
                        if (window.location.href !== currentUrl) {
                            console.log('✅ نجح التنقل');
                            navigationSuccess = true;
                            break;
                        }
                    } catch (error) {
                        console.log('⚠️ فشلت طريقة نقر، جرب التالية...');
                    }
                }
                
                if (!navigationSuccess) {
                    return { success: false, error: 'فشل في النقر والتنقل' };
                }
                
                // انتظار تحميل صفحة التفاصيل
                await this.waitForJobDetailsPage();
                
                return { success: true };
                
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        // انتظار تحميل صفحة التفاصيل
        async waitForJobDetailsPage() {
            console.log('⏳ انتظار تحميل صفحة التفاصيل...');
            
            let attempts = 0;
            const maxAttempts = 15;
            
            while (attempts < maxAttempts) {
                await this.wait(2000);
                attempts++;
                
                // فحص URL
                if (window.location.href.includes('JobDetails')) {
                    console.log('✅ URL صحيح لصفحة التفاصيل');
                    
                    // فحص المحتوى
                    const contentLength = document.body.textContent.length;
                    if (contentLength > 1000) {
                        console.log('✅ تم تحميل محتوى كافي');
                        
                        // فحص وجود المحتوى المطلوب
                        await this.wait(3000); // انتظار إضافي للتأكد
                        return true;
                    }
                }
                
                console.log(`⏳ محاولة ${attempts}/${maxAttempts}...`);
            }
            
            console.log('⚠️ انتهت محاولات انتظار صفحة التفاصيل');
            return false;
        }

        // معالجة التقديم
        async handleJobApplication(jobTitle) {
            try {
                console.log('📝 بدء معالجة التقديم...');
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });
                
                // فحص التقديم المسبق
                await this.handlePopups();
                await this.wait(2000);
                
                const alreadyApplied = await this.checkIfAlreadyAppliedInDetails();
                
                if (alreadyApplied) {
                    console.log('⏭️ مُقدم عليها مسبقاً في صفحة التفاصيل');
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'skipped' 
                    });
                    return { success: true, type: 'skipped' };
                }

                // محاولة التقديم
                const applicationResult = await this.applyForJobWithRetry();
                this.handleApplicationResult(applicationResult, jobTitle);
                
                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                return { success: true, type: 'applied', result: applicationResult };
                
            } catch (error) {
                console.error('❌ خطأ في معالجة التقديم:', error);
                return { success: false, error: error.message };
            }
        }

        // العودة المؤكدة لقائمة الوظائف
        async returnToJobListForSure() {
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
                    return true;
                }
                
                // طريقة 2: التنقل المباشر
                console.log('🔄 التنقل المباشر لقائمة الوظائف...');
                const exploreJobsUrl = 'https://jadarat.sa/Jadarat/ExploreJobs';
                window.location.href = exploreJobsUrl;
                await this.wait(6000);
                
                // التأكد من التحميل
                await this.waitForJobListPage();
                
                return true;
                
            } catch (error) {
                console.error('❌ خطأ في العودة لقائمة الوظائف:', error);
                return false;
            }
        }

        // انتظار تحميل قائمة الوظائف
        async waitForJobListPage() {
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
        }

        // الانتقال للصفحة التالية
        async moveToNextPage() {
            console.log('➡️ ➡️ البحث عن الصفحة التالية...');
            
            try {
                // البحث عن زر التالي
                const nextButtonSelectors = [
                    'button[aria-label*="next page"]:not([disabled])',
                    'button[aria-label*="التالي"]:not([disabled])',
                    '.pagination button:not([disabled])',
                    'button:not([disabled])',
                    'a[class*="next"]'
                ];
                
                let nextButton = null;
                
                for (const selector of nextButtonSelectors) {
                    const buttons = document.querySelectorAll(selector);
                    for (const btn of buttons) {
                        const text = btn.textContent?.trim() || '';
                        if ((text.includes('>') || text.includes('التالي') || 
                             btn.getAttribute('aria-label')?.includes('next')) && 
                            !btn.disabled && btn.offsetWidth > 0) {
                            nextButton = btn;
                            break;
                        }
                    }
                    
                    if (nextButton) {
                        console.log(`✅ وجد زر التالي: ${selector}`);
                        break;
                    }
                }
                
                if (nextButton) {
                    console.log(`➡️ الانتقال للصفحة ${this.currentPage + 1}`);
                    this.currentPage++;
                    
                    // النقر على زر التالي
                    nextButton.click();
                    await this.wait(6000);
                    
                    // التأكد من التحميل
                    await this.waitForJobListPage();
                    
                    // معالجة الصفحة الجديدة
                    await this.processCurrentPageComplete();
                    
                } else {
                    console.log('🏁 🏁 انتهت جميع الصفحات!');
                    this.finishAutomation();
                }
                
            } catch (error) {
                console.error('❌ خطأ في الانتقال للصفحة التالية:', error);
                this.finishAutomation();
            }
        }

        // إنهاء الأتمتة
        finishAutomation() {
            console.log('🎉 🎉 تمت الأتمتة الكاملة بنجاح!');
            
            const summary = `
📊 النتائج النهائية:
✅ تم التقديم: ${this.stats.applied}
❌ تم الرفض: ${this.stats.rejected}
⏭️ تم التخطي: ${this.stats.skipped}
📊 إجمالي الوظائف: ${this.stats.total}
📄 عدد الصفحات: ${this.currentPage}
            `;
            
            console.log(summary);
            
            this.sendMessage('AUTOMATION_COMPLETED');
            this.hideIndicator();
            this.showIndicator('🎉 انتهت الأتمتة الكاملة!', '#00ff88', 15000);
        }

        // ==================== الدوال الأصلية المحسنة ====================
    }}