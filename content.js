// جدارات أوتو - Content Script
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
            
            if (url.includes('/ExploreJobs') || url.includes('JobTab=1')) {
                this.pageType = 'jobList';
                console.log('جدارات أوتو: صفحة قائمة الوظائف');
            } else if (url.includes('/JobDetails') || url.includes('JobTab=2')) {
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
            
            if (this.pageType !== 'jobList') {
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'يجب أن تكون في صفحة البحث عن الوظائف' 
                });
                return;
            }

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
            console.log('جدارات أوتو: البحث عن بطاقات الوظائف');
            
            const selectors = [
                'div[class*="job"]',
                'div[class*="card"]',
                'article',
                '.row .col',
                'div[onclick*="JobDetails"]',
                'a[href*="JobDetails"]',
                'div[class*="item"]',
                'li[class*="job"]',
                'tr[onclick]',
                'div[style*="cursor: pointer"]'
            ];

            let jobCards = [];
            
            for (const selector of selectors) {
                try {
                    const elements = Array.from(document.querySelectorAll(selector));
                    console.log(`جدارات أوتو: ${selector} وجد ${elements.length} عنصر`);
                    
                    if (elements.length > 0) {
                        const filtered = elements.filter(card => {
                            const text = card.textContent || '';
                            const html = card.innerHTML || '';
                            
                            const hasJobContent = (
                                text.includes('شركة') ||
                                text.includes('الراتب') ||
                                text.includes('المدينة') ||
                                text.includes('الرياض') ||
                                text.includes('جدة') ||
                                text.includes('الدمام') ||
                                text.includes('ريال') ||
                                text.includes('أخصائي') ||
                                text.includes('مساعد') ||
                                text.includes('مدير') ||
                                text.includes('محاسب') ||
                                text.includes('سكرتير') ||
                                /\d+\s*(ريال|سعودي)/.test(text)
                            );
                            
                            const hasClickable = (
                                card.onclick ||
                                card.getAttribute('onclick') ||
                                card.querySelector('a[href*="JobDetails"]') ||
                                card.querySelector('a[href*="job"]') ||
                                html.includes('JobDetails') ||
                                html.includes('onclick')
                            );
                            
                            const hasContent = text.trim().length > 20;
                            
                            return hasJobContent && hasClickable && hasContent;
                        });
                        
                        if (filtered.length > 0) {
                            jobCards = filtered;
                            console.log(`جدارات أوتو: تم تصفية ${jobCards.length} بطاقة وظيفة صالحة باستخدام ${selector}`);
                            break;
                        }
                    }
                } catch (e) {
                    console.log(`جدارات أوتو: خطأ في المحدد ${selector}:`, e);
                }
            }

            if (jobCards.length === 0) {
                console.log('جدارات أوتو: استخدام البحث البديل الشامل');
                
                const allElements = document.querySelectorAll('*');
                const candidates = [];
                
                for (const el of allElements) {
                    const text = el.textContent || '';
                    const isClickable = el.onclick || el.querySelector('a') || el.tagName === 'A';
                    
                    if (isClickable && text.length > 30 && text.length < 500) {
                        const jobKeywords = [
                            'أخصائي', 'مساعد', 'مدير', 'سكرتير', 'محاسب', 
                            'مطور', 'مهندس', 'مصمم', 'خدمة عملاء', 'موارد بشرية',
                            'شركة', 'راتب', 'ريال', 'الرياض', 'جدة', 'الدمام'
                        ];
                        
                        const hasKeywords = jobKeywords.some(keyword => text.includes(keyword));
                        
                        if (hasKeywords) {
                            candidates.push(el);
                        }
                    }
                }
                
                jobCards = candidates.sort((a, b) => {
                    const scoreA = this.calculateJobScore(a.textContent);
                    const scoreB = this.calculateJobScore(b.textContent);
                    return scoreB - scoreA;
                }).slice(0, 15);
                
                console.log(`جدارات أوتو: البحث البديل وجد ${jobCards.length} مرشح محتمل`);
            }

            jobCards = jobCards.filter((card, index, self) => {
                return index === self.findIndex(c => c.textContent === card.textContent);
            });

            console.log(`جدارات أوتو: النتيجة النهائية: ${jobCards.length} وظيفة`);
            
            jobCards.slice(0, 3).forEach((card, i) => {
                console.log(`جدارات أوتو: وظيفة ${i + 1}:`, this.extractJobTitle(card));
            });

            return jobCards.slice(0, 20);
        }

        calculateJobScore(text) {
            let score = 0;
            
            const importantKeywords = {
                'أخصائي': 10, 'مساعد': 8, 'مدير': 9, 'سكرتير': 7, 'محاسب': 8,
                'مطور': 9, 'مهندس': 9, 'مصمم': 7, 'شركة': 5, 'راتب': 6,
                'ريال': 4, 'سعودي': 3, 'الرياض': 3, 'جدة': 3, 'الدمام': 3
            };
            
            for (const [keyword, points] of Object.entries(importantKeywords)) {
                if (text.includes(keyword)) {
                    score += points;
                }
            }
            
            if (text.length < 50 || text.length > 800) {
                score -= 5;
            }
            
            return score;
        }

        async processJob(jobCard, jobIndex) {
            try {
                const jobTitle = this.extractJobTitle(jobCard);
                console.log(`جدارات أوتو: معالجة الوظيفة: ${jobTitle}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: jobTitle, 
                    status: 'processing' 
                });

                let clicked = false;
                
                const link = jobCard.querySelector('a[href*="JobDetails"]');
                if (link) {
                    console.log('جدارات أوتو: النقر على الرابط');
                    this.clickElement(link);
                    clicked = true;
                } else if (jobCard.onclick) {
                    console.log('جدارات أوتو: تنفيذ onclick');
                    jobCard.click();
                    clicked = true;
                } else if (jobCard.getAttribute('onclick')) {
                    console.log('جدارات أوتو: تنفيذ onclick attribute');
                    eval(jobCard.getAttribute('onclick'));
                    clicked = true;
                } else {
                    console.log('جدارات أوتو: النقر على البطاقة');
                    this.clickElement(jobCard);
                    clicked = true;
                }
                
                if (!clicked) {
                    throw new Error('لا يمكن النقر على الوظيفة');
                }
                
                await this.delay(3000);
                
                const isJobDetailsPage = window.location.href.includes('JobDetails') || 
                                        document.querySelector('[class*="modal"], [role="dialog"]');
                
                if (isJobDetailsPage) {
                    await this.handleDigitalExperiencePopup();
                    
                    const alreadyApplied = await this.checkIfAlreadyApplied();
                    
                    if (alreadyApplied) {
                        this.stats.skipped++;
                        this.sendMessage('UPDATE_CURRENT_JOB', { 
                            jobTitle: jobTitle, 
                            status: 'skipped' 
                        });
                        
                        console.log('جدارات أوتو: تم التخطي - مُقدم عليها مسبقاً');
                    } else {
                        const applicationResult = await this.applyForJob();
                        
                        if (applicationResult.success) {
                            this.stats.applied++;
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'success' 
                            });
                            console.log('جدارات أوتو: تم التقديم بنجاح');
                        } else {
                            this.stats.skipped++;
                            this.sendMessage('UPDATE_CURRENT_JOB', { 
                                jobTitle: jobTitle, 
                                status: 'error' 
                            });
                            console.log('جدارات أوتو: فشل التقديم');
                        }
                    }

                    this.stats.total++;
                    this.sendMessage('UPDATE_STATS', { stats: this.stats });

                    await this.goBackToJobList();
                } else {
                    throw new Error('لم يتم فتح صفحة تفاصيل الوظيفة');
                }

            } catch (error) {
                console.error('جدارات أوتو: خطأ في معالجة الوظيفة:', error);
                this.stats.skipped++;
                this.stats.total++;
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: 'خطأ في المعالجة', 
                    status: 'error' 
                });
                
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                try {
                    await this.goBackToJobList();
                } catch (backError) {
                    console.error('جدارات أوتو: خطأ في العودة:', backError);
                }
            }
        }

        extractJobTitle(jobCard) {
            const titleSelectors = [
                'h3', 'h4', 'h5',
                '.job-title', '[class*="title"]',
                '.card-title', '[class*="card-title"]',
                'strong', 'b',
                'a[href*="JobDetails"]'
            ];

            for (const selector of titleSelectors) {
                const titleElement = jobCard.querySelector(selector);
                if (titleElement && titleElement.textContent.trim()) {
                    let title = titleElement.textContent.trim();
                    title = title.replace(/\s+/g, ' ').substring(0, 100);
                    if (title.length > 10) {
                        return title;
                    }
                }
            }

            const text = jobCard.textContent.trim();
            const lines = text.split('\n').filter(line => line.trim().length > 5);
            
            for (const line of lines) {
                const cleanLine = line.trim();
                if (cleanLine.includes('أخصائي') || 
                    cleanLine.includes('مساعد') || 
                    cleanLine.includes('مدير') ||
                    cleanLine.includes('سكرتير') ||
                    cleanLine.includes('محاسب')) {
                    return cleanLine.substring(0, 100);
                }
            }

            return lines[0]?.trim().substring(0, 50) || 'وظيفة غير محددة';
        }

        async handleDigitalExperiencePopup() {
            console.log('جدارات أوتو: فحص نافذة التقييم الرقمي');
            
            await this.delay(1500);
            
            const popupSelectors = [
                '[role="dialog"]',
                '.modal-dialog',
                '.modal',
                '.popup',
                '.overlay',
                '[class*="modal"]',
                '[class*="popup"]',
                '[class*="dialog"]'
            ];

            let popup = null;
            
            for (const selector of popupSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    if (el.textContent.includes('تجربتك الرقمية') || 
                        el.textContent.includes('تقييم') ||
                        el.textContent.includes('استبيان')) {
                        popup = el;
                        console.log('جدارات أوتو: تم العثور على نافذة التقييم');
                        break;
                    }
                }
                if (popup) break;
            }

            if (popup) {
                const closeSelectors = [
                    'button[aria-label*="إغلاق"]',
                    '.close',
                    '[class*="close"]',
                    '[data-dismiss]',
                    'button[type="button"]'
                ];

                let closeButton = null;
                
                for (const selector of closeSelectors) {
                    closeButton = popup.querySelector(selector);
                    if (closeButton) break;
                }

                if (!closeButton) {
                    const buttons = popup.querySelectorAll('button');
                    for (const button of buttons) {
                        const text = button.textContent.trim();
                        if (text.includes('إغلاق') || 
                            text.includes('×') || 
                            text.includes('close') ||
                            text === '×') {
                            closeButton = button;
                            break;
                        }
                    }
                }

                if (closeButton) {
                    console.log('جدارات أوتو: إغلاق نافذة التقييم');
                    this.clickElement(closeButton);
                    await this.delay(1000);
                } else {
                    console.log('جدارات أوتو: لم يتم العثور على زر الإغلاق');
                    document.body.click();
                    await this.delay(500);
                }
            }
        }

        async checkIfAlreadyApplied() {
            console.log('جدارات أوتو: فحص حالة التقديم');
            
            await this.delay(2000);
            
            const pageText = document.body.textContent;
            
            const alreadyAppliedIndicators = [
                'استعراض طلب التقديم',
                'تم التقديم',
                'تم التقدم',
                'مُقدم عليها',
                'تم تقديم الطلب'
            ];

            for (const indicator of alreadyAppliedIndicators) {
                if (pageText.includes(indicator)) {
                    console.log(`جدارات أوتو: تم العثور على مؤشر: ${indicator}`);
                    return true;
                }
            }

            const submitButton = this.findSubmitButton();
            const hasSubmitButton = !!submitButton;
            
            console.log(`جدارات أوتو: وجود زر التقديم: ${hasSubmitButton}`);
            
            return !hasSubmitButton;
        }

        findSubmitButton() {
            const submitSelectors = [
                'input[value*="تقديم"]',
                'a[href*="تقديم"]',
                '[class*="submit"]',
                '[class*="apply"]',
                '[id*="submit"]',
                '[id*="apply"]'
            ];

            for (const selector of submitSelectors) {
                const button = document.querySelector(selector);
                if (button && button.style.display !== 'none') {
                    return button;
                }
            }

            const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
            
            for (const button of allButtons) {
                const text = (button.textContent || button.value || '').trim();
                const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0 && 
                                window.getComputedStyle(button).display !== 'none';
                
                if (isVisible && (
                    text.includes('تقديم') || 
                    text.includes('تطبيق') ||
                    text.includes('apply') ||
                    button.className.includes('submit') ||
                    button.className.includes('apply')
                )) {
                    return button;
                }
            }

            return null;
        }

        async applyForJob() {
            console.log('جدارات أوتو: بدء عملية التقديم');
            
            try {
                const submitButton = this.findSubmitButton();
                
                if (!submitButton) {
                    console.log('جدارات أوتو: لم يتم العثور على زر التقديم');
                    return { success: false, reason: 'لم يتم العثور على زر التقديم' };
                }

                console.log('جدارات أوتو: النقر على زر التقديم');
                this.clickElement(submitButton);
                
                await this.delay(2000);
                
                await this.handleConfirmationDialog();
                
                await this.delay(3000);
                
                const result = await this.handleResultDialog();
                
                return result;

            } catch (error) {
                console.error('جدارات أوتو: خطأ في التقديم:', error);
                return { success: false, reason: error.message };
            }
        }

        async handleConfirmationDialog() {
            console.log('جدارات أوتو: التعامل مع نافذة التأكيد');
            
            const dialogSelectors = [
                '[role="dialog"]',
                '.modal',
                '.popup',
                '[class*="modal"]',
                '[class*="dialog"]'
            ];

            let dialog = null;
            
            for (const selector of dialogSelectors) {
                const dialogs = document.querySelectorAll(selector);
                for (const d of dialogs) {
                    if (d.textContent.includes('متأكد من التقديم') || 
                        d.textContent.includes('تأكيد التقديم') ||
                        d.textContent.includes('هل تريد')) {
                        dialog = d;
                        break;
                    }
                }
                if (dialog) break;
            }
            
            if (dialog) {
                console.log('جدارات أوتو: تم العثور على نافذة التأكيد');
                
                const buttons = dialog.querySelectorAll('button');
                
                for (const button of buttons) {
                    const text = button.textContent.trim();
                    if (text.includes('تقديم') && !text.includes('إلغاء') && !text.includes('إغلاق')) {
                        console.log('جدارات أوتو: تأكيد التقديم');
                        this.clickElement(button);
                        break;
                    }
                }
            }
            
            await this.delay(1500);
        }

        async handleResultDialog() {
            console.log('جدارات أوتو: التعامل مع نافذة النتيجة');
            
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"]');
            let success = false;
            
            for (const dialog of dialogs) {
                const text = dialog.textContent;
                
                if (text.includes('تم التقديم بنجاح') || 
                    text.includes('تم إرسال') ||
                    text.includes('نجح')) {
                    console.log('جدارات أوتو: التقديم نجح');
                    success = true;
                } else if (text.includes('لا يمكنك التقديم') || 
                          text.includes('عذراً') ||
                          text.includes('فشل') ||
                          text.includes('خطأ')) {
                    console.log('جدارات أوتو: التقديم فشل');
                    success = false;
                }
                
                const closeButtons = dialog.querySelectorAll('button');
                for (const button of closeButtons) {
                    const buttonText = button.textContent.trim();
                    if (buttonText.includes('إغلاق') || 
                        buttonText.includes('موافق') ||
                        buttonText.includes('OK') ||
                        buttonText === '×') {
                        console.log('جدارات أوتو: إغلاق نافذة النتيجة');
                        this.clickElement(button);
                        break;
                    }
                }
                
                if (text.includes('تم التقديم') || text.includes('لا يمكنك') || text.includes('عذراً')) {
                    break;
                }
            }
            
            await this.delay(1000);
            return { success: success };
        }

        async goBackToJobList() {
            console.log('جدارات أوتو: العودة لقائمة الوظائف');
            
            window.history.back();
            
            await this.waitForNavigation();
            
            await this.delay(3000);
            window.scrollTo(0, 0);
            
            await this.delay(2000);
            
            console.log('جدارات أوتو: تم العودة لقائمة الوظائف');
        }

        async goToNextPage() {
            console.log('جدارات أوتو: الانتقال للصفحة التالية');
            
        async goToNextPage() {
            console.log('جدارات أوتو: الانتقال للصفحة التالية');
            
            const nextSelectors = [
                '.pagination .next:not(.disabled)',
                '.pagination li:last-child a',
                '[aria-label*="Next"]:not([disabled])',
                '[aria-label*="التالي"]:not([disabled])',
                '.page-next:not([disabled])',
                '[class*="next"]:not([disabled])'
            ];

            let nextButton = null;
            
            for (const selector of nextSelectors) {
                nextButton = document.querySelector(selector);
                if (nextButton && !nextButton.disabled && 
                    nextButton.offsetWidth > 0 && nextButton.offsetHeight > 0) {
                    break;
                }
                nextButton = null;
            }

            if (!nextButton) {
                const currentPageNum = this.currentPage + 1;
                const pageNumbers = document.querySelectorAll('.pagination a, .pagination button');
                
                for (const pageEl of pageNumbers) {
                    if (pageEl.textContent.trim() === currentPageNum.toString()) {
                        nextButton = pageEl;
                        break;
                    }
                }
            }

            if (!nextButton) {
                const allButtons = document.querySelectorAll('button, a');
                for (const button of allButtons) {
                    const text = button.textContent.trim();
                    if (text.includes('التالي') && !button.disabled) {
                        nextButton = button;
                        break;
                    }
                }
            }

            if (nextButton) {
                console.log('جدارات أوتو: تم العثور على زر الصفحة التالية');
                this.currentPage++;
                this.currentJobIndex = 0;
                
                this.clickElement(nextButton);
                await this.waitForNavigation();
                await this.delay(3000);
                
                await this.processCurrentPage();
            } else {
                console.log('جدارات أوتو: انتهت جميع الصفحات');
                this.sendMessage('AUTOMATION_COMPLETED');
                this.hideIndicator();
            }
        }

        clickElement(element) {
            if (element) {
                console.log('جدارات أوتو: النقر على العنصر:', element);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                const originalStyle = element.style.cssText;
                element.style.cssText += 'border: 3px solid #00d4ff !important; background: rgba(0, 212, 255, 0.1) !important;';
                
                setTimeout(() => {
                    element.style.cssText = originalStyle;
                }, 1000);
                
                try {
                    element.click();
                } catch (e) {
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
            const variation = base * 0.3;
            return base + (Math.random() * 2 - 1) * variation;
        }

        async waitForNavigation() {
            return new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 50;
                
                const checkForChange = () => {
                    attempts++;
                    if (document.readyState === 'complete' || attempts >= maxAttempts) {
                        setTimeout(resolve, 500);
                    } else {
                        setTimeout(checkForChange, 100);
                    }
                };
                checkForChange();
            });
        }

        saveCurrentPosition() {
            const position = {
                page: this.currentPage,
                jobIndex: this.currentJobIndex,
                stats: this.stats,
                url: window.location.href
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

    // إنشاء متغير عام للمحتوى
    let jadaratAutoContent = null;

    function initializeContent() {
        try {
            if (!jadaratAutoContent) {
                jadaratAutoContent = new JadaratAutoContent();
                console.log('جدارات أوتو: تم تهيئة المحتوى بنجاح');
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
                }
            }, 1000);
        }
    });

    observer.observe(document, { subtree: true, childList: true });

})();// جدارات أوتو - Content Script
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
        
        if (url.includes('/ExploreJobs') || url.includes('JobTab=1')) {
            this.pageType = 'jobList';
            console.log('جدارات أوتو: صفحة قائمة الوظائف');
        } else if (url.includes('/JobDetails') || url.includes('JobTab=2')) {
            this.pageType = 'jobDetails';
            console.log('جدارات أوتو: صفحة تفاصيل الوظيفة');
        } else {
            this.pageType = 'unknown';
            console.log('جدارات أوتو: صفحة غير معروفة');
        }
    }

    addVisualIndicator() {
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
    }

    async startAutomation() {
        console.log('جدارات أوتو: بدء الأتمتة');
        
        if (this.pageType !== 'jobList') {
            this.sendMessage('AUTOMATION_ERROR', { 
                error: 'يجب أن تكون في صفحة البحث عن الوظائف' 
            });
            return;
        }

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
        console.log('جدارات أوتو: البحث عن بطاقات الوظائف');
        
        const selectors = [
            'div[class*="job"]',
            'div[class*="card"]',
            'article',
            '.row .col',
            'div[onclick*="JobDetails"]',
            'a[href*="JobDetails"]',
            'div[class*="item"]',
            'li[class*="job"]',
            'tr[onclick]',
            'div[style*="cursor: pointer"]'
        ];

        let jobCards = [];
        
        for (const selector of selectors) {
            try {
                const elements = Array.from(document.querySelectorAll(selector));
                console.log(`جدارات أوتو: ${selector} وجد ${elements.length} عنصر`);
                
                if (elements.length > 0) {
                    const filtered = elements.filter(card => {
                        const text = card.textContent || '';
                        const html = card.innerHTML || '';
                        
                        const hasJobContent = (
                            text.includes('شركة') ||
                            text.includes('الراتب') ||
                            text.includes('المدينة') ||
                            text.includes('الرياض') ||
                            text.includes('جدة') ||
                            text.includes('الدمام') ||
                            text.includes('ريال') ||
                            text.includes('أخصائي') ||
                            text.includes('مساعد') ||
                            text.includes('مدير') ||
                            text.includes('محاسب') ||
                            text.includes('سكرتير') ||
                            /\d+\s*(ريال|سعودي)/.test(text)
                        );
                        
                        const hasClickable = (
                            card.onclick ||
                            card.getAttribute('onclick') ||
                            card.querySelector('a[href*="JobDetails"]') ||
                            card.querySelector('a[href*="job"]') ||
                            html.includes('JobDetails') ||
                            html.includes('onclick')
                        );
                        
                        const hasContent = text.trim().length > 20;
                        
                        return hasJobContent && hasClickable && hasContent;
                    });
                    
                    if (filtered.length > 0) {
                        jobCards = filtered;
                        console.log(`جدارات أوتو: تم تصفية ${jobCards.length} بطاقة وظيفة صالحة باستخدام ${selector}`);
                        break;
                    }
                }
            } catch (e) {
                console.log(`جدارات أوتو: خطأ في المحدد ${selector}:`, e);
            }
        }

        if (jobCards.length === 0) {
            console.log('جدارات أوتو: استخدام البحث البديل الشامل');
            
            const allElements = document.querySelectorAll('*');
            const candidates = [];
            
            for (const el of allElements) {
                const text = el.textContent || '';
                const isClickable = el.onclick || el.querySelector('a') || el.tagName === 'A';
                
                if (isClickable && text.length > 30 && text.length < 500) {
                    const jobKeywords = [
                        'أخصائي', 'مساعد', 'مدير', 'سكرتير', 'محاسب', 
                        'مطور', 'مهندس', 'مصمم', 'خدمة عملاء', 'موارد بشرية',
                        'شركة', 'راتب', 'ريال', 'الرياض', 'جدة', 'الدمام'
                    ];
                    
                    const hasKeywords = jobKeywords.some(keyword => text.includes(keyword));
                    
                    if (hasKeywords) {
                        candidates.push(el);
                    }
                }
            }
            
            jobCards = candidates.sort((a, b) => {
                const scoreA = this.calculateJobScore(a.textContent);
                const scoreB = this.calculateJobScore(b.textContent);
                return scoreB - scoreA;
            }).slice(0, 15);
            
            console.log(`جدارات أوتو: البحث البديل وجد ${jobCards.length} مرشح محتمل`);
        }

        jobCards = jobCards.filter((card, index, self) => {
            return index === self.findIndex(c => c.textContent === card.textContent);
        });

        console.log(`جدارات أوتو: النتيجة النهائية: ${jobCards.length} وظيفة`);
        
        jobCards.slice(0, 3).forEach((card, i) => {
            console.log(`جدارات أوتو: وظيفة ${i + 1}:`, this.extractJobTitle(card));
        });

        return jobCards.slice(0, 20);
    }

    calculateJobScore(text) {
        let score = 0;
        
        const importantKeywords = {
            'أخصائي': 10, 'مساعد': 8, 'مدير': 9, 'سكرتير': 7, 'محاسب': 8,
            'مطور': 9, 'مهندس': 9, 'مصمم': 7, 'شركة': 5, 'راتب': 6,
            'ريال': 4, 'سعودي': 3, 'الرياض': 3, 'جدة': 3, 'الدمام': 3
        };
        
        for (const [keyword, points] of Object.entries(importantKeywords)) {
            if (text.includes(keyword)) {
                score += points;
            }
        }
        
        if (text.length < 50 || text.length > 800) {
            score -= 5;
        }
        
        return score;
    }

    async processJob(jobCard, jobIndex) {
        try {
            const jobTitle = this.extractJobTitle(jobCard);
            console.log(`جدارات أوتو: معالجة الوظيفة: ${jobTitle}`);
            
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: jobTitle, 
                status: 'processing' 
            });

            let clicked = false;
            
            const link = jobCard.querySelector('a[href*="JobDetails"]');
            if (link) {
                console.log('جدارات أوتو: النقر على الرابط');
                this.clickElement(link);
                clicked = true;
            } else if (jobCard.onclick) {
                console.log('جدارات أوتو: تنفيذ onclick');
                jobCard.click();
                clicked = true;
            } else if (jobCard.getAttribute('onclick')) {
                console.log('جدارات أوتو: تنفيذ onclick attribute');
                eval(jobCard.getAttribute('onclick'));
                clicked = true;
            } else {
                console.log('جدارات أوتو: النقر على البطاقة');
                this.clickElement(jobCard);
                clicked = true;
            }
            
            if (!clicked) {
                throw new Error('لا يمكن النقر على الوظيفة');
            }
            
            await this.delay(3000);
            
            const isJobDetailsPage = window.location.href.includes('JobDetails') || 
                                    document.querySelector('[class*="modal"], [role="dialog"]');
            
            if (isJobDetailsPage) {
                await this.handleDigitalExperiencePopup();
                
                const alreadyApplied = await this.checkIfAlreadyApplied();
                
                if (alreadyApplied) {
                    this.stats.skipped++;
                    this.sendMessage('UPDATE_CURRENT_JOB', { 
                        jobTitle: jobTitle, 
                        status: 'skipped' 
                    });
                    
                    console.log('جدارات أوتو: تم التخطي - مُقدم عليها مسبقاً');
                } else {
                    const applicationResult = await this.applyForJob();
                    
                    if (applicationResult.success) {
                        this.stats.applied++;
                        this.sendMessage('UPDATE_CURRENT_JOB', { 
                            jobTitle: jobTitle, 
                            status: 'success' 
                        });
                        console.log('جدارات أوتو: تم التقديم بنجاح');
                    } else {
                        this.stats.skipped++;
                        this.sendMessage('UPDATE_CURRENT_JOB', { 
                            jobTitle: jobTitle, 
                            status: 'error' 
                        });
                        console.log('جدارات أوتو: فشل التقديم');
                    }
                }

                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });

                await this.goBackToJobList();
            } else {
                throw new Error('لم يتم فتح صفحة تفاصيل الوظيفة');
            }

        } catch (error) {
            console.error('جدارات أوتو: خطأ في معالجة الوظيفة:', error);
            this.stats.skipped++;
            this.stats.total++;
            
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: 'خطأ في المعالجة', 
                status: 'error' 
            });
            
            this.sendMessage('UPDATE_STATS', { stats: this.stats });
            
            try {
                await this.goBackToJobList();
            } catch (backError) {
                console.error('جدارات أوتو: خطأ في العودة:', backError);
            }
        }
    }

    extractJobTitle(jobCard) {
        const titleSelectors = [
            'h3', 'h4', 'h5',
            '.job-title', '[class*="title"]',
            '.card-title', '[class*="card-title"]',
            'strong', 'b',
            'a[href*="JobDetails"]'
        ];

        for (const selector of titleSelectors) {
            const titleElement = jobCard.querySelector(selector);
            if (titleElement && titleElement.textContent.trim()) {
                let title = titleElement.textContent.trim();
                title = title.replace(/\s+/g, ' ').substring(0, 100);
                if (title.length > 10) {
                    return title;
                }
            }
        }

        const text = jobCard.textContent.trim();
        const lines = text.split('\n').filter(line => line.trim().length > 5);
        
        for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.includes('أخصائي') || 
                cleanLine.includes('مساعد') || 
                cleanLine.includes('مدير') ||
                cleanLine.includes('سكرتير') ||
                cleanLine.includes('محاسب')) {
                return cleanLine.substring(0, 100);
            }
        }

        return lines[0]?.trim().substring(0, 50) || 'وظيفة غير محددة';
    }

    async handleDigitalExperiencePopup() {
        console.log('جدارات أوتو: فحص نافذة التقييم الرقمي');
        
        await this.delay(1500);
        
        const popupSelectors = [
            '[role="dialog"]',
            '.modal-dialog',
            '.modal',
            '.popup',
            '.overlay',
            '[class*="modal"]',
            '[class*="popup"]',
            '[class*="dialog"]'
        ];

        let popup = null;
        
        for (const selector of popupSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                if (el.textContent.includes('تجربتك الرقمية') || 
                    el.textContent.includes('تقييم') ||
                    el.textContent.includes('استبيان')) {
                    popup = el;
                    console.log('جدارات أوتو: تم العثور على نافذة التقييم');
                    break;
                }
            }
            if (popup) break;
        }

        if (popup) {
            const closeSelectors = [
                'button[aria-label*="إغلاق"]',
                '.close',
                '[class*="close"]',
                '[data-dismiss]',
                'button[type="button"]'
            ];

            let closeButton = null;
            
            for (const selector of closeSelectors) {
                closeButton = popup.querySelector(selector);
                if (closeButton) break;
            }

            if (!closeButton) {
                const buttons = popup.querySelectorAll('button');
                for (const button of buttons) {
                    const text = button.textContent.trim();
                    if (text.includes('إغلاق') || 
                        text.includes('×') || 
                        text.includes('close') ||
                        text === '×') {
                        closeButton = button;
                        break;
                    }
                }
            }

            if (closeButton) {
                console.log('جدارات أوتو: إغلاق نافذة التقييم');
                this.clickElement(closeButton);
                await this.delay(1000);
            } else {
                console.log('جدارات أوتو: لم يتم العثور على زر الإغلاق');
                document.body.click();
                await this.delay(500);
            }
        }
    }

    async checkIfAlreadyApplied() {
        console.log('جدارات أوتو: فحص حالة التقديم');
        
        await this.delay(2000);
        
        const pageText = document.body.textContent;
        
        const alreadyAppliedIndicators = [
            'استعراض طلب التقديم',
            'تم التقديم',
            'تم التقدم',
            'مُقدم عليها',
            'تم تقديم الطلب'
        ];

        for (const indicator of alreadyAppliedIndicators) {
            if (pageText.includes(indicator)) {
                console.log(`جدارات أوتو: تم العثور على مؤشر: ${indicator}`);
                return true;
            }
        }

        const submitButton = this.findSubmitButton();
        const hasSubmitButton = !!submitButton;
        
        console.log(`جدارات أوتو: وجود زر التقديم: ${hasSubmitButton}`);
        
        return !hasSubmitButton;
    }

    findSubmitButton() {
        const submitSelectors = [
            'input[value*="تقديم"]',
            'a[href*="تقديم"]',
            '[class*="submit"]',
            '[class*="apply"]',
            '[id*="submit"]',
            '[id*="apply"]'
        ];

        for (const selector of submitSelectors) {
            const button = document.querySelector(selector);
            if (button && button.style.display !== 'none') {
                return button;
            }
        }

        const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"], a');
        
        for (const button of allButtons) {
            const text = (button.textContent || button.value || '').trim();
            const isVisible = button.offsetWidth > 0 && button.offsetHeight > 0 && 
                            window.getComputedStyle(button).display !== 'none';
            
            if (isVisible && (
                text.includes('تقديم') || 
                text.includes('تطبيق') ||
                text.includes('apply') ||
                button.className.includes('submit') ||
                button.className.includes('apply')
            )) {
                return button;
            }
        }

        return null;
    }

    async applyForJob() {
        console.log('جدارات أوتو: بدء عملية التقديم');
        
        try {
            const submitButton = this.findSubmitButton();
            
            if (!submitButton) {
                console.log('جدارات أوتو: لم يتم العثور على زر التقديم');
                return { success: false, reason: 'لم يتم العثور على زر التقديم' };
            }

            console.log('جدارات أوتو: النقر على زر التقديم');
            this.clickElement(submitButton);
            
            await this.delay(2000);
            
            await this.handleConfirmationDialog();
            
            await this.delay(3000);
            
            const result = await this.handleResultDialog();
            
            return result;

        } catch (error) {
            console.error('جدارات أوتو: خطأ في التقديم:', error);
            return { success: false, reason: error.message };
        }
    }

    async handleConfirmationDialog() {
        console.log('جدارات أوتو: التعامل مع نافذة التأكيد');
        
        const dialogSelectors = [
            '[role="dialog"]',
            '.modal',
            '.popup',
            '[class*="modal"]',
            '[class*="dialog"]'
        ];

        let dialog = null;
        
        for (const selector of dialogSelectors) {
            const dialogs = document.querySelectorAll(selector);
            for (const d of dialogs) {
                if (d.textContent.includes('متأكد من التقديم') || 
                    d.textContent.includes('تأكيد التقديم') ||
                    d.textContent.includes('هل تريد')) {
                    dialog = d;
                    break;
                }
            }
            if (dialog) break;
        }
        
        if (dialog) {
            console.log('جدارات أوتو: تم العثور على نافذة التأكيد');
            
            const buttons = dialog.querySelectorAll('button');
            
            for (const button of buttons) {
                const text = button.textContent.trim();
                if (text.includes('تقديم') && !text.includes('إلغاء') && !text.includes('إغلاق')) {
                    console.log('جدارات أوتو: تأكيد التقديم');
                    this.clickElement(button);
                    break;
                }
            }
        }
        
        await this.delay(1500);
    }

    async handleResultDialog() {
        console.log('جدارات أوتو: التعامل مع نافذة النتيجة');
        
        const dialogs = document.querySelectorAll('[role="dialog"], .modal, .popup, [class*="modal"]');
        let success = false;
        
        for (const dialog of dialogs) {
            const text = dialog.textContent;
            
            if (text.includes('تم التقديم بنجاح') || 
                text.includes('تم إرسال') ||
                text.includes('نجح')) {
                console.log('جدارات أوتو: التقديم نجح');
                success = true;
            } else if (text.includes('لا يمكنك التقديم') || 
                      text.includes('عذراً') ||
                      text.includes('فشل') ||
                      text.includes('خطأ')) {
                console.log('جدارات أوتو: التقديم فشل');
                success = false;
            }
            
            const closeButtons = dialog.querySelectorAll('button');
            for (const button of closeButtons) {
                const buttonText = button.textContent.trim();
                if (buttonText.includes('إغلاق') || 
                    buttonText.includes('موافق') ||
                    buttonText.includes('OK') ||
                    buttonText === '×') {
                    console.log('جدارات أوتو: إغلاق نافذة النتيجة');
                    this.clickElement(button);
                    break;
                }
            }
            
            if (text.includes('تم التقديم') || text.includes('لا يمكنك') || text.includes('عذراً')) {
                break;
            }
        }
        
        await this.delay(1000);
        return { success: success };
    }

    async goBackToJobList() {
        console.log('جدارات أوتو: العودة لقائمة الوظائف');
        
        window.history.back();
        
        await this.waitForNavigation();
        
        await this.delay(3000);
        window.scrollTo(0, 0);
        
        await this.delay(2000);
        
        console.log('جدارات أوتو: تم العودة لقائمة الوظائف');
    }

    async goToNextPage() {
        console.log('جدارات أوتو: الانتقال للصفحة التالية');
        
        const nextSelectors = [
            '.pagination .next:not(.disabled)',
            '.pagination li:last-child a',
            '[aria-label*="Next"]:not([disabled])',
            '[aria-label*="التالي"]:not([disabled])',
            '.page-next:not([disabled])',
            '[class*="next"]:not([disabled])'
        ];

        let nextButton = null;
        
        for (const selector of nextSelectors) {
            nextButton = document.querySelector(selector);
            if (nextButton && !nextButton.disabled && 
                nextButton.offsetWidth > 0 && nextButton.offsetHeight > 0) {
                break;
            }
            nextButton = null;
        }

        if (!nextButton) {
            const currentPageNum = this.currentPage + 1;
            const pageNumbers = document.querySelectorAll('.pagination a, .pagination button');
            
            for (const pageEl of pageNumbers) {
                if (pageEl.textContent.trim() === currentPageNum.toString()) {
                    nextButton = pageEl;
                    break;
                }
            }
        }

        if (!nextButton) {
            const allButtons = document.querySelectorAll('button, a');
            for (const button of allButtons) {
                const text = button.textContent.trim();
                if (text.includes('التالي') && !button.disabled) {
                    nextButton = button;
                    break;
                }
            }
        }

        if (nextButton) {
            console.log('جدارات أوتو: تم العثور على زر الصفحة التالية');
            this.currentPage++;
            this.currentJobIndex = 0;
            
            this.clickElement(nextButton);
            await this.waitForNavigation();
            await this.delay(3000);
            
            await this.processCurrentPage();
        } else {
            console.log('جدارات أوتو: انتهت جميع الصفحات');
            this.sendMessage('AUTOMATION_COMPLETED');
            this.hideIndicator();
        }
    }

    clickElement(element) {
        if (element) {
            console.log('جدارات أوتو: النقر على العنصر:', element);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            const originalStyle = element.style.cssText;
            element.style.cssText += 'border: 3px solid #00d4ff !important; background: rgba(0, 212, 255, 0.1) !important;';
            
            setTimeout(() => {
                element.style.cssText = originalStyle;
            }, 1000);
            
            try {
                element.click();
            } catch (e) {
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
        const variation = base * 0.3;
        return base + (Math.random() * 2 - 1) * variation;
    }

    async waitForNavigation() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkForChange = () => {
                attempts++;
                if (document.readyState === 'complete' || attempts >= maxAttempts) {
                    setTimeout(resolve, 500);
                } else {
                    setTimeout(checkForChange, 100);
                }
            };
            checkForChange();
        });
    }

    saveCurrentPosition() {
        const position = {
            page: this.currentPage,
            jobIndex: this.currentJobIndex,
            stats: this.stats,
            url: window.location.href
        };
        
        console.log('جدارات أوتو: حفظ الموقع الحالي:', position);
        this.sendMessage('SAVE_POSITION', { position });
    }

    sendMessage(action, data = {}) {
        chrome.runtime.sendMessage({
            action: action,
            ...data
        }).catch(error => {
            console.error('جدارات أوتو: خطأ في إرسال الرسالة:', error);
        });
    }
}

let jadaratAutoContent = null;

function initializeContent() {
    if (!jadaratAutoContent) {
        jadaratAutoContent = new JadaratAutoContent();
        console.log('جدارات أوتو: تم تهيئة المحتوى');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContent);
} else {
    initializeContent();
}

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log('جدارات أوتو: تغيير الصفحة المكتشف');
        setTimeout(initializeContent, 1000);
    }
}).observe(document, { subtree: true, childList: true });