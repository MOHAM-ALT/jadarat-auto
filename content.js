// جدارات أوتو - النسخة البسيطة العاملة 100%
(function() {
    'use strict';
    
    if (window.jadaratAutoContentLoaded) {
        return;
    }
    window.jadaratAutoContentLoaded = true;

    class JadaratAutoContent {
        constructor() {
            this.isRunning = false;
            this.stats = { applied: 0, skipped: 0, total: 0 };
            this.currentJobIndex = 0;
            
            this.initializeListeners();
            this.addVisualIndicator();
            
            console.log('جدارات أوتو: تم التهيئة بنجاح');
        }

        initializeListeners() {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('جدارات أوتو: رسالة مستلمة:', message);
                
                if (message.action === 'PING') {
                    sendResponse({ status: 'active' });
                    return;
                }
                
                if (message.action === 'START_AUTOMATION') {
                    this.startAutomation();
                    sendResponse({ success: true });
                    return;
                }
                
                if (message.action === 'STOP_AUTOMATION') {
                    this.stopAutomation();
                    sendResponse({ success: true });
                    return;
                }
            });
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

        async startAutomation() {
            console.log('🚀 جدارات أوتو: بدء العمل');
            
            this.isRunning = true;
            this.showIndicator('🚀 جاري العمل...', '#00ff88');
            
            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 0, 
                text: 'بدء البحث عن الوظائف...' 
            });

            await this.delay(2000);
            
            // البحث البسيط عن الوظائف
            const jobs = this.findJobs();
            
            console.log(`جدارات أوتو: تم العثور على ${jobs.length} وظيفة`);
            
            if (jobs.length === 0) {
                console.log('🔍 تشخيص: لم يتم العثور على وظائف');
                console.log('عدد الروابط في الصفحة:', document.querySelectorAll('a').length);
                console.log('عدد روابط JobDetails:', document.querySelectorAll('a[href*="JobDetails"]').length);
                console.log('عدد data-link:', document.querySelectorAll('[data-link]').length);
                
                this.sendMessage('AUTOMATION_ERROR', { 
                    error: 'لم يتم العثور على وظائف - تأكد من أنك في صفحة قائمة الوظائف' 
                });
                return;
            }

            this.sendMessage('UPDATE_PROGRESS', { 
                progress: 10, 
                text: `تم العثور على ${jobs.length} وظيفة - بدء المعالجة` 
            });

            // معالجة كل وظيفة
            for (let i = 0; i < jobs.length; i++) {
                if (!this.isRunning) break;
                
                const job = jobs[i];
                console.log(`🎯 معالجة الوظيفة ${i + 1}: ${job.title}`);
                
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: job.title, 
                    status: 'processing' 
                });
                
                const progress = ((i + 1) / jobs.length) * 100;
                this.sendMessage('UPDATE_PROGRESS', { 
                    progress: progress, 
                    text: `معالجة الوظيفة ${i + 1} من ${jobs.length}` 
                });
                
                try {
                    await this.processJob(job);
                } catch (error) {
                    console.error('خطأ في معالجة الوظيفة:', error);
                    this.stats.skipped++;
                }
                
                this.stats.total++;
                this.sendMessage('UPDATE_STATS', { stats: this.stats });
                
                await this.delay(3000); // انتظار بين الوظائف
            }
            
            console.log('✅ انتهى العمل');
            this.sendMessage('AUTOMATION_COMPLETED');
            this.hideIndicator();
        }

        findJobs() {
            console.log('🔍 البحث عن الوظائف...');
            
            const jobs = [];
            
            // طريقة 1: البحث بـ data-link + JobDetails
            const method1 = document.querySelectorAll('a[data-link][href*="JobDetails"]');
            console.log('الطريقة 1 - data-link + JobDetails:', method1.length);
            
            // طريقة 2: البحث بـ href فقط
            const method2 = document.querySelectorAll('a[href*="/Jadarat/JobDetails"]');
            console.log('الطريقة 2 - href JobDetails:', method2.length);
            
            // طريقة 3: البحث بـ JobTab=2
            const method3 = document.querySelectorAll('a[href*="JobTab=2"]');
            console.log('الطريقة 3 - JobTab=2:', method3.length);
            
            // طريقة 4: البحث بـ Param=
            const method4 = document.querySelectorAll('a[href*="Param="]');
            console.log('الطريقة 4 - Param=:', method4.length);
            
            // استخدام أفضل طريقة
            let jobLinks = [];
            if (method1.length > 0) jobLinks = method1;
            else if (method2.length > 0) jobLinks = method2;
            else if (method3.length > 0) jobLinks = method3;
            else if (method4.length > 0) jobLinks = method4;
            
            console.log(`✅ استخدام الطريقة التي وجدت ${jobLinks.length} وظيفة`);
            
            for (const link of jobLinks) {
                // استخراج عنوان الوظيفة
                let title = 'وظيفة غير محددة';
                
                // البحث عن العنوان في العنصر نفسه
                const titleInLink = link.textContent.trim();
                if (titleInLink && titleInLink.length > 5 && titleInLink.length < 100) {
                    title = titleInLink;
                }
                
                // البحث عن العنوان في العناصر الفرعية
                const titleElement = link.querySelector('span, h1, h2, h3, h4, h5, h6');
                if (titleElement && titleElement.textContent.trim()) {
                    title = titleElement.textContent.trim();
                }
                
                // التحقق من عدم التقديم المسبق
                const parent = link.closest('[data-container]') || link.parentElement;
                const isApplied = parent && (
                    parent.textContent.includes('تم التقدم') ||
                    parent.textContent.includes('تم التقديم') ||
                    parent.querySelector('img[src*="tick"]')
                );
                
                if (!isApplied) {
                    jobs.push({
                        link: link,
                        title: title.substring(0, 80),
                        url: link.href
                    });
                } else {
                    console.log('⏭️ تخطي وظيفة مُقدم عليها:', title.substring(0, 50));
                }
            }
            
            return jobs;
        }

        async processJob(job) {
            console.log(`🎯 معالجة: ${job.title}`);
            
            // تمييز الوظيفة
            job.link.style.cssText += 'border: 3px solid #00ff00 !important; background: rgba(0,255,0,0.1) !important;';
            
            // النقر على الوظيفة
            job.link.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            
            job.link.click();
            
            // انتظار تحميل صفحة التفاصيل
            await this.delay(4000);
            
            // البحث عن زر التقديم
            const submitButton = this.findSubmitButton();
            
            if (!submitButton) {
                console.log('❌ لم يتم العثور على زر التقديم');
                this.sendMessage('UPDATE_CURRENT_JOB', { 
                    jobTitle: job.title, 
                    status: 'skipped' 
                });
                this.stats.skipped++;
                
                // العودة
                window.history.back();
                await this.delay(3000);
                return;
            }
            
            console.log('✅ تم العثور على زر التقديم');
            
            // النقر على زر التقديم
            submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.delay(1000);
            
            submitButton.click();
            
            // انتظار النوافذ المنبثقة
            await this.delay(3000);
            
            // التعامل مع النوافذ
            await this.handleDialogs();
            
            this.sendMessage('UPDATE_CURRENT_JOB', { 
                jobTitle: job.title, 
                status: 'success' 
            });
            this.stats.applied++;
            
            console.log('✅ تم التقديم بنجاح');
            
            // العودة لقائمة الوظائف
            await this.delay(2000);
            window.history.back();
            await this.delay(3000);
        }

        findSubmitButton() {
            const buttons = document.querySelectorAll('button, input[type="submit"], a');
            
            for (const btn of buttons) {
                const text = (btn.textContent || btn.value || '').trim();
                const isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0;
                
                if (isVisible && text.includes('تقديم') && !text.includes('استعراض')) {
                    console.log('🎯 زر التقديم:', text);
                    btn.style.cssText += 'border: 3px solid #ff0000 !important;';
                    return btn;
                }
            }
            
            return null;
        }

        async handleDialogs() {
            console.log('🔍 البحث عن النوافذ المنبثقة...');
            
            await this.delay(2000);
            
            // البحث عن النوافذ
            const dialogs = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0) {
                    const text = dialog.textContent;
                    console.log('📝 نافذة مكتشفة:', text.substring(0, 100));
                    
                    // نافذة التأكيد
                    if (text.includes('متأكد') || text.includes('تقديم')) {
                        const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(b => 
                            b.textContent.trim() === 'تقديم'
                        );
                        
                        if (confirmBtn) {
                            console.log('✅ النقر على تأكيد التقديم');
                            confirmBtn.click();
                            await this.delay(3000);
                        }
                    }
                    
                    // نافذة النجاح
                    if (text.includes('تم التقديم بنجاح')) {
                        const closeBtn = Array.from(dialog.querySelectorAll('button')).find(b => 
                            b.textContent.includes('اغلاق') || b.textContent.includes('إغلاق')
                        );
                        
                        if (closeBtn) {
                            console.log('✅ إغلاق نافذة النجاح');
                            closeBtn.click();
                            await this.delay(1000);
                        }
                    }
                }
            }
        }

        stopAutomation() {
            this.isRunning = false;
            this.hideIndicator();
            console.log('🛑 تم إيقاف العمل');
        }

        async delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        sendMessage(action, data = {}) {
            try {
                chrome.runtime.sendMessage({ action, ...data });
            } catch (error) {
                console.error('خطأ في الرسالة:', error);
            }
        }
    }

    // التهيئة
    let jadaratAutoContent = null;

    function init() {
        try {
            if (!jadaratAutoContent) {
                jadaratAutoContent = new JadaratAutoContent();
            }
        } catch (error) {
            console.error('خطأ في التهيئة:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();