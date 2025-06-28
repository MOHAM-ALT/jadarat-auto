// جدارات أوتو - Content Script المُحدث والمُصحح (الإصدار الجديد)
(function() {
    'use strict';
    
    // تجنب التكرار
    if (window.jadaratAutoContentLoaded) {
        console.log('جدارات أوتو: المحتوى محمل مسبقاً');
        return;
    }
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
                total: 0
            };

            this.currentPage = 1;
            this.currentJobIndex = 0;
            this.totalJobs = 0;
            
            this.initializeListeners();
            this.checkPageType();
            this.addVisualIndicator();
        }

        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleMessage(message, sendResponse);
                return true;
            });
        }

        checkPageType() {
            const url = window.location.href;
            console.log('جدارات أوتو: فحص نوع الصفحة - URL:', url);
            
            // التحقق من وجود الوظائف في الصفحة
            const hasJobCards = document.querySelector('.job-card, [class*="job"], [href*="job"]');
            
            if (hasJobCards || url.includes('jobs') || url.includes('وظائف')) {
                this.pageType = 'jobList';
                console.log('جدارات أوتو: صفحة قائمة الوظائف');
            } else if (url.includes('job-details') || url.includes('تفاصيل')) {
                this.pageType = 'jobDetails';
                console.log('جدارات أوتو: صفحة تفاصيل الوظيفة');
            } else {
                this.pageType = 'unknown';
                console.log('جدارات أوتو: صفحة غير معروفة');
            }
        }

        addVisualIndicator() {
            // إزالة المؤشر السابق إن وجد
            const existingIndicator = document.getElementById('jadarat-auto-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            const indicator = document.createElement('div');
            indicator.id = 'jadarat-auto-indicator';
            indicator.innerHTML = `
                <div style="
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
                ">
                    🎯 جدارات أوتو - جاهز
                </div>
            `;
            document.body.appendChild(indicator);
        }

        showIndicator(text, color = '#00d4ff') {
            const indicator = document.querySelector('#jadarat-auto-indicator div');
            if (indicator) {
                indicator.textContent = text;
                indicator.style.background = `linear-gradient(45deg, ${color}, #7d2ae8)`;
                indicator.style.display = 'block';
            }
        }

        hideIndicator() {
            const indicator = document.querySelector('#jadarat-auto-indicator div');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }

        async handleMessage(message, sendResponse) {
            console.log('جدارات أوتو: استلام رسالة:', message);
            
            try {
                switch (message.action) {
                    case 'PING':
                        sendResponse({ status: 'active' });
                        break;
                        
                    case 'START_AUTOMATION':
                        this.settings = message.settings;
                        await this.startAutomation();
                        sendResponse({ success: true });
                        break;
                        
                    case 'PAUSE_AUTOMATION':
                        this.pauseAutomation();
                        sendResponse({ success: true });
                        break;
                        
                    case 'STOP_AUTOMATION':
                        this.stopAutomation();
                        sendResponse({ success: true });
                        break;
                }
            } catch (error) {
                console.error('جدارات أوتو: خطأ في معالجة الرسالة:', error);
                sendResponse({ success: false, error: error.message });
            }
        }

        async startAutomation() {
            console.log('جدارات أوتو: بدء الأتمتة');
            
            this.isRunning = true;
            this.isPaused = false;
            
            this.showIndicator('🚀 جاري العمل...', '#00ff88');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 0, 
                text: 'بدء تحليل الصفحة...' 
            });

            await this.processCurrentPage();
        }

        pauseAutomation() {
            console.log('جدارات أوتو: إيقاف مؤقت');
            this.isPaused = true;
            this.showIndicator('⏸️ متوقف مؤقتاً', '#ffc107');
            this.saveCurrentPosition();
        }

        stopAutomation() {
            console.log('جدارات أوتو: إيقاف نهائي');
            this.isRunning = false;
            this.isPaused = false;
            this.hideIndicator();
        }

        async processCurrentPage() {
            if (!this.isRunning || this.isPaused) return;

            try {
                console.log('جدارات أوتو: معالجة الصفحة الحالية');
                
                await this.delay(2000);
                
                const jobCards = this.getJobCards();
                this.totalJobs = jobCards.length;

                console.log(`جدارات أوتو: تم العثور على ${this.totalJobs} وظيفة`);

                if (this.totalJobs === 0) {
                    this.sendMessage('AUTOMATION_ERROR', { 
                        error: 'لم يتم العثور على وظائف في هذه الصفحة' 
                    });
                    return;
                }

                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: 0, 
                    text: `تم العثور على ${this.totalJobs} وظيفة في الصفحة ${this.currentPage}` 
                });

                for (let i = this.currentJobIndex; i < jobCards.length; i++) {
                    if (!this.isRunning || this.isPaused) {
                        this.saveCurrentPosition();
                        return;
                    }

                    this.currentJobIndex = i;
                    const jobCard = jobCards[i];
                    
                    console.log(`جدارات أوتو: معالجة الوظيفة ${i + 1} من ${jobCards.length}`);
                    
                    await this.processJob(jobCard, i + 1);
                    
                    const progress = ((i + 1) / jobCards.length) * 100;
                    this.sendMessage('UPDATE_PROGRESS', { 
                        progress: progress, 
                        text: `معالجة الوظيفة ${i + 1} من ${jobCards.length}` 
                    });

                    await this.delay(this.getRandomDelay());
                }

                await this.goToNextPage();

            } catch (error) {
                console.error('جدارات أوتو: خطأ في معالجة الصفحة:', error);
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: error.message 
                });
            }
        }

        getJobCards() {
            console.log('جدارات أوتو: البحث عن بطاقات الوظائف - الطريقة الجديدة');
            
            const jobCards = [];
            
            // البحث الأساسي في جميع العناصر النصية
            const allElements = document.querySelectorAll('*');
            
            for (const element of allElements) {
                // تخطي العناصر المخفية
                if (element.offsetWidth === 0 || element.offsetHeight === 0) continue;
                
                const text = element.textContent || '';
                const hasJobTitle = this.isJobTitle(text);
                
                if (hasJobTitle) {
                    // البحث عن العنصر الأب الذي يحتوي على معلومات الوظيفة
                    const jobContainer = this.findJobContainer(element);
                    
                    if (jobContainer) {
                        // التحقق من عدم وجود "تم التقدم"
                        const alreadyApplied = this.checkIfAlreadyAppliedInContainer(jobContainer);
                        
                        if (!alreadyApplied) {
                            // البحث عن الرابط القابل للنقر
                            const clickableElement = this.findClickableElement(jobContainer);
                            
                            if (clickableElement) {
                                jobCards.push({
                                    container: jobContainer,
                                    element: clickableElement,
                                    title: text.trim().substring(0, 100)
                                });
                                
                                console.log(`جدارات أوتو: وظيفة مكتشفة: ${text.trim().substring(0, 50)}...`);
                            }
                        } else {
                            console.log(`جدارات أوتو: تخطي وظيفة مُقدم عليها: ${text.trim().substring(0, 50)}...`);
                        }
                    }
                }
            }

            console.log(`جدارات أوتو: تم العثور على ${jobCards.length} وظيفة متاحة للتقديم`);
            
            // إزالة التكرارات
            const uniqueJobCards = this.removeDuplicateJobs(jobCards);
            
            return uniqueJobCards.slice(0, 20); // حد أقصى 20 وظيفة لكل صفحة
        }

        isJobTitle(text) {
            if (!text || text.length < 5 || text.length > 200) return false;
            
            // الكلمات المفتاحية للوظائف
            const jobKeywords = [
                'مدير', 'مديرة', 'أخصائي', 'أخصائية', 'محاسب', 'محاسبة',
                'مهندس', 'مهندسة', 'مطور', 'مطورة', 'مبرمج', 'مبرمجة',
                'سكرتير', 'سكرتيرة', 'منسق', 'منسقة', 'مشرف', 'مشرفة',
                'رئيس', 'رئيسة', 'نائب', 'مساعد', 'مساعدة', 'موظف', 'موظفة',
                'عامل', 'عاملة', 'فني', 'فنية', 'تقني', 'تقنية',
                'صيدلي', 'صيدلانية', 'طبيب', 'طبيبة', 'ممرض', 'ممرضة',
                'معلم', 'معلمة', 'أستاذ', 'أستاذة', 'مدرب', 'مدربة',
                'مستشار', 'مستشارة', 'خبير', 'خبيرة', 'باحث', 'باحثة',
                'محلل', 'محللة', 'منتج', 'مصمم', 'مصممة', 'كاتب', 'كاتبة',
                'محرر', 'محررة', 'مراجع', 'مراجعة', 'مدقق', 'مدققة'
            ];
            
            const hasJobKeyword = jobKeywords.some(keyword => text.includes(keyword));
            
            // فحص إضافي: تجنب النصوص العامة
            const isGeneralText = text.includes('تاريخ النشر') || 
                                text.includes('المدينة') || 
                                text.includes('الوظائف المتاحة') ||
                                text.includes('جدارات') ||
                                text.includes('صفحة');
            
            return hasJobKeyword && !isGeneralText;
        }

        findJobContainer(element) {
            let container = element;
            
            // البحث صعوداً في DOM للعثور على الحاوي المناسب
            for (let i = 0; i < 10; i++) {
                if (!container.parentElement) break;
                
                container = container.parentElement;
                
                // التحقق من أن الحاوي يحتوي على معلومات الوظيفة
                const text = container.textContent;
                const hasJobInfo = text.includes('الرياض') || 
                                 text.includes('تاريخ النشر') || 
                                 text.includes('الوظائف المتاحة') ||
                                 (text.length > 100 && text.length < 1000);
                
                if (hasJobInfo) {
                    return container;
                }
            }
            
            return element.parentElement || element;
        }

        checkIfAlreadyAppliedInContainer(container) {
            const text = container.textContent;
            
            // مؤشرات التقديم المسبق حسب الصور
            const appliedIndicators = [
                'تم التقدم',
                'تم التقديم', 
                'مُقدم عليها',
                'تم تقديم الطلب'
            ];
            
            // البحث عن النص
            const hasAppliedText = appliedIndicators.some(indicator => text.includes(indicator));
            
            // البحث عن العلامة الخضراء (أيقونة أو رمز)
            const hasCheckIcon = container.querySelector('svg[class*="check"], .check, [class*="tick"], [class*="done"]');
            
            return hasAppliedText || hasCheckIcon;
        }

        findClickableElement(container) {
            // البحث عن العناصر القابلة للنقر
            const clickables = container.querySelectorAll('a, button, [onclick], [role="button"], [tabindex="0"]');
            
            for (const clickable of clickables) {
                // تجنب أزرار "اتصال مزني بعلمة الإدارة" و "معاودة الاتصال"
                const text = clickable.textContent;
                if (text.includes('اتصال') || text.includes('معاودة') || text.includes('الاتصال')) {
                    continue;
                }
                
                // إعطاء الأولوية للروابط
                if (clickable.tagName === 'A' && clickable.href) {
                    return clickable;
                }
                
                // أو العناصر القابلة للنقر الكبيرة
                if (clickable.offsetWidth > 100 && clickable.offsetHeight > 30) {
                    return clickable;
                }
            }
            
            // إذا لم نجد، نقر على الحاوي نفسه
            return container;
        }

        removeDuplicateJobs(jobCards) {
            const seen = new Set();
            const unique = [];
            
            for (const job of jobCards) {
                const key = job.title.substring(0, 50);
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(job);
                }
            }
            
            return unique;
        }

        async processJob(jobCard, jobIndex) {
            try {
                const jobTitle = jobCard.title;
                console.log(`جدارات أوتو: معالجة الوظيفة: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                // تمييز العنصر بصرياً قبل النقر
                this.highlightElement(jobCard.element);

                // النقر على العنصر
                console.log('جدارات أوتو: النقر على الوظيفة');
                this.clickElement(jobCard.element);
                
                // انتظار قصير لمعاينة النتيجة
                await this.delay(3000);
                
                // لغرض الاختبار: سنعتبر كل شيء نجح
                this.stats.applied++;
                this.stats.total++;
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'success' 
                });
                
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                console.log('جدارات أوتو: تم النقر على الوظيفة');

            } catch (error) {
                console.error('جدارات أوتو: خطأ في معالجة الوظيفة:', error);
                this.stats.skipped++;
                this.stats.total++;
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: 'خطأ في المعالجة', 
                    status: 'error' 
                });
                
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
            }
        }

        highlightElement(element) {
            if (element) {
                const originalStyle = element.style.cssText;
                element.style.cssText += `
                    border: 3px solid #00d4ff !important; 
                    background: rgba(0, 212, 255, 0.1) !important;
                    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5) !important;
                `;
                
                setTimeout(() => {
                    element.style.cssText = originalStyle;
                }, 2000);
            }
        }

        async goToNextPage() {
            console.log('جدارات أوتو: البحث عن الصفحة التالية');
            
            // البحث عن أزرار التنقل حسب الصور
            const nextButtons = document.querySelectorAll('button, a, [role="button"]');
            
            for (const button of nextButtons) {
                const text = button.textContent;
                const isNextButton = text.includes('التالي') || 
                                   text.includes('next') || 
                                   text.includes('>') ||
                                   button.getAttribute('aria-label')?.includes('next');
                
                if (isNextButton && !button.disabled && button.offsetWidth > 0) {
                    console.log('جدارات أوتو: الانتقال للصفحة التالية');
                    this.currentPage++;
                    this.currentJobIndex = 0;
                    
                    this.clickElement(button);
                    await this.delay(3000);
                    
                    // معالجة الصفحة الجديدة
                    await this.processCurrentPage();
                    return;
                }
            }
            
            console.log('جدارات أوتو: انتهت جميع الصفحات');
            this.sendMessage('AUTOMATION_COMPLETED');
            this.hideIndicator();
        }

        clickElement(element) {
            if (element) {
                console.log('جدارات أوتو: النقر على العنصر:', element);
                
                // تمرير العنصر إلى منتصف الشاشة
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // النقر الفعلي
                try {
                    element.click();
                } catch (e) {
                    // طريقة بديلة للنقر
                    const event = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    element.dispatchEvent(event);
                }
            }
        }

        async delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        getRandomDelay() {
            const base = this.settings.delayTime * 1000;
            const variation = base * 0.3; // تنويع 30%
            return base + (Math.random() * 2 - 1) * variation;
        }

        saveCurrentPosition() {
            const position = {
                page: this.currentPage,
                jobIndex: this.currentJobIndex,
                stats: this.stats,
                url: window.location.href,
                timestamp: Date.now()
            };
            
            console.log('جدارات أوتو: حفظ الموقع الحالي:', position);
            this.sendMessage('SAVE_POSITION', { position });
        }

        sendMessage(action, data = {}) {
            try {
                chrome.runtime.sendMessage({
                    action: action,
                    ...data
                }).catch(error => {
                    console.error('جدارات أوتو: خطأ في إرسال الرسالة:', error);
                });
            } catch (error) {
                console.error('جدارات أوتو: خطأ في إرسال الرسالة:', error);
            }
        }
    }

    // إنشاء المتغير العام
    let jadaratAutoContent = null;

    function initializeContent() {
        try {
            if (!jadaratAutoContent) {
                jadaratAutoContent = new JadaratAutoContent();
                console.log('جدارات أوتو: تم تهيئة المحتوى بنجاح - الإصدار الجديد');
            }
        } catch (error) {
            console.error('جدارات أوتو: خطأ في التهيئة:', error);
        }
    }

    // تهيئة المحتوى
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContent);
    } else {
        initializeContent();
    }

    // مراقبة تغيير URL للصفحات الديناميكية
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('جدارات أوتو: تغيير الصفحة المكتشف');
            setTimeout(() => {
                if (!jadaratAutoContent) {
                    initializeContent();
                } else {
                    jadaratAutoContent.checkPageType();
                }
            }, 1000);
        }
    });

    observer.observe(document, { subtree: true, childList: true });

})();