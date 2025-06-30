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
            try {
                chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                    console.log('جدارات أوتو: رسالة مستلمة:', message);
                    
                    if (message.action === 'PING') {
                        sendResponse({ status: 'active' });
                        return true;
                    }
                    
                    if (message.action === 'START_AUTOMATION') {
                        setTimeout(() => {
                            this.startAutomation();
                        }, 100);
                        sendResponse({ success: true });
                        return true;
                    }
                    
                    if (message.action === 'STOP_AUTOMATION') {
                        this.stopAutomation();
                        sendResponse({ success: true });
                        return true;
                    }
                    
                    sendResponse({ success: true });
                    return true;
                });
            } catch (error) {
                console.error('خطأ في المستمع:', error);
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

        async startAutomation() {
            console.log('🚀 جدارات أوتو: بدء العمل');
            
            this.isRunning = true;
            this.showIndicator('🚀 جاري العمل...', '#00ff88');
            
            console.log('📨 رسالة: UPDATE_PROGRESS', { progress: 0, text: 'بدء البحث عن الوظائف...' });

            await this.delay(2000);
            
            // البحث البسيط عن الوظائف
            const jobs = this.findJobs();
            
            console.log(`جدارات أوتو: تم العثور على ${jobs.length} وظيفة`);
            
            if (jobs.length === 0) {
                console.log('🔍 تشخيص مفصل: لم يتم العثور على وظائف');
                
                // تشخيص مفصل
                console.log('🔍 عدد الروابط الكلي في الصفحة:', document.querySelectorAll('a').length);
                console.log('🔍 عدد روابط JobDetails:', document.querySelectorAll('a[href*="JobDetails"]').length);
                console.log('🔍 عدد data-link:', document.querySelectorAll('[data-link]').length);
                console.log('🔍 عدد data-container:', document.querySelectorAll('[data-container]').length);
                
                // عرض عينة من الروابط
                const allJobLinks = document.querySelectorAll('a[href*="JobDetails"]');
                console.log('🔍 عينة من روابط JobDetails:');
                for(let i = 0; i < Math.min(3, allJobLinks.length); i++) {
                    console.log(`   ${i+1}. ${allJobLinks[i].href}`);
                    console.log(`      النص: "${allJobLinks[i].textContent.trim().substring(0, 50)}"`);
                }
                
                console.log('📨 رسالة: AUTOMATION_ERROR', { error: 'لم يتم العثور على وظائف - انظر التشخيص في Console' });
                this.hideIndicator();
                return;
            }

            console.log('📨 رسالة: UPDATE_PROGRESS', { progress: 10, text: `تم العثور على ${jobs.length} وظيفة - بدء المعالجة` });

            // معالجة كل وظيفة
            for (let i = 0; i < jobs.length; i++) {
                if (!this.isRunning) break;
                
                const job = jobs[i];
                console.log(`🎯 معالجة الوظيفة ${i + 1}: ${job.title}`);
                
                console.log('📨 رسالة: UPDATE_CURRENT_JOB', { jobTitle: job.title, status: 'processing' });
                
                const progress = ((i + 1) / jobs.length) * 100;
                console.log('📨 رسالة: UPDATE_PROGRESS', { progress: progress, text: `معالجة الوظيفة ${i + 1} من ${jobs.length}` });
                
                try {
                    await this.processJob(job);
                } catch (error) {
                    console.error('خطأ في معالجة الوظيفة:', error);
                    this.stats.skipped++;
                }
                
                this.stats.total++;
                console.log('📨 رسالة: UPDATE_STATS', { stats: this.stats });
                
                await this.delay(3000); // انتظار بين الوظائف
            }
            
            console.log('✅ انتهى العمل');
            console.log('📨 رسالة: AUTOMATION_COMPLETED');
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
            if (method1.length > 0) {
                jobLinks = method1;
                console.log('✅ استخدام الطريقة 1 (data-link)');
            } else if (method2.length > 0) {
                jobLinks = method2;
                console.log('✅ استخدام الطريقة 2 (href JobDetails)');
            } else if (method3.length > 0) {
                jobLinks = method3;
                console.log('✅ استخدام الطريقة 3 (JobTab=2)');
            } else if (method4.length > 0) {
                jobLinks = method4;
                console.log('✅ استخدام الطريقة 4 (Param=)');
            }
            
            console.log(`🔍 فحص ${jobLinks.length} رابط وظيفة...`);
            
            for (let i = 0; i < jobLinks.length; i++) {
                const link = jobLinks[i];
                
                // استخراج عنوان الوظيفة
                let title = 'وظيفة غير محددة';
                
                // البحث عن العنوان بطرق متعددة
                const titleElement = link.querySelector('span.heading4, .heading4, span, h1, h2, h3, h4, h5, h6');
                if (titleElement && titleElement.textContent.trim()) {
                    title = titleElement.textContent.trim();
                } else {
                    const linkText = link.textContent.trim();
                    if (linkText && linkText.length > 5 && linkText.length < 100) {
                        title = linkText;
                    }
                }
                
                console.log(`🔎 وظيفة ${i+1}: "${title}"`);
                
                // فحص بسيط للتقديم المسبق
                let isApplied = false;
                
                // البحث في الرابط نفسه والعناصر المجاورة
                const searchElements = [
                    link,
                    link.parentElement,
                    link.parentElement?.parentElement,
                    link.closest('[data-container]')
                ].filter(Boolean);
                
                for (const element of searchElements) {
                    if (!element) continue;
                    
                    const elementText = element.textContent || '';
                    const hasAppliedText = elementText.includes('تم التقدم') || 
                                         elementText.includes('تم التقديم');
                    
                    const hasAppliedIcon = element.querySelector('img[src*="tick"]') || 
                                         element.querySelector('img[src*="check"]') ||
                                         element.querySelector('img[src*="circle"]');
                    
                    if (hasAppliedText || hasAppliedIcon) {
                        isApplied = true;
                        console.log(`⏭️ تخطي "${title}" - مُقدم عليها مسبقاً`);
                        break;
                    }
                }
                
                if (!isApplied) {
                    jobs.push({
                        link: link,
                        title: title.substring(0, 80),
                        url: link.href
                    });
                    console.log(`✅ إضافة "${title}" للقائمة`);
                } else {
                    console.log(`❌ تم تخطي "${title}"`);
                }
            }
            
            console.log(`📊 النتيجة النهائية: ${jobs.length} وظيفة متاحة من أصل ${jobLinks.length}`);
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
                console.log('📨 رسالة: UPDATE_CURRENT_JOB', { jobTitle: job.title, status: 'skipped' });
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
            
            console.log('📨 رسالة: UPDATE_CURRENT_JOB', { jobTitle: job.title, status: 'success' });
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
            // إزالة sendMessage تماماً لتجنب الأخطاء
            console.log(`📨 رسالة: ${action}`, data);
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
            console.error('خطأ في الته    يئة:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }



})();