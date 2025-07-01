// جدارات أوتو - إصدار مبسط للطوارئ
console.log('🎯 جدارات أوتو: بدء تحميل المحتوى');

// منع التكرار
if (window.jadaratAutoLoaded) {
    console.log('جدارات أوتو: محمل مسبقاً');
} else {
    window.jadaratAutoLoaded = true;
    
    // فئة مبسطة
    class JadaratAuto {
        constructor() {
            this.isRunning = false;
            this.stats = { applied: 0, skipped: 0, total: 0 };
            this.setupListeners();
            console.log('جدارات أوتو: تم التهيئة بنجاح');
        }
        
        setupListeners() {
            chrome.runtime.onMessage.addListener((msg, sender, reply) => {
                console.log('رسالة مستلمة:', msg.action);
                
                if (msg.action === 'PING') {
                    reply({ status: 'active' });
                    return;
                }
                
                if (msg.action === 'START_AUTOMATION') {
                    this.startWork();
                    reply({ success: true });
                    return;
                }
                
                reply({ success: false });
            });
        }
        
        async startWork() {
            console.log('بدء العمل...');
            this.isRunning = true;
            
            // البحث عن الوظائف
            const jobs = document.querySelectorAll('a[href*="JobDetails"]');
            console.log('تم العثور على', jobs.length, 'وظيفة');
            
            if (jobs.length === 0) {
                this.sendUpdate('لم يتم العثور على وظائف');
                return;
            }
            
            // معالجة كل وظيفة
            for (let i = 0; i < jobs.length && this.isRunning; i++) {
                try {
                    await this.processJob(jobs[i], i + 1);
                    await this.wait(3000);
                } catch (error) {
                    console.error('خطأ في الوظيفة', i + 1, ':', error);
                }
            }
            
            this.sendUpdate('انتهى العمل');
        }
        
        async processJob(jobLink, index) {
            const title = this.getJobTitle(jobLink);
            console.log(`معالجة الوظيفة ${index}: ${title}`);
            
            // فحص التقديم المسبق
            const container = jobLink.closest('[data-container]');
            if (container && container.textContent.includes('تم التقدم')) {
                console.log('تم تخطي - مقدم عليها مسبقاً');
                this.stats.skipped++;
                return;
            }
            
            // النقر على الوظيفة
            this.clickJob(jobLink);
            await this.wait(3000);
            
            // البحث عن زر التقديم
            const submitBtn = this.findSubmitButton();
            if (submitBtn) {
                console.log('تم العثور على زر التقديم');
                submitBtn.click();
                await this.wait(2000);
                
                // التعامل مع النوافذ
                this.handleDialogs();
                await this.wait(2000);
                
                this.stats.applied++;
                console.log('تم التقديم بنجاح');
            } else {
                console.log('لم يتم العثور على زر التقديم');
                this.stats.skipped++;
            }
            
            // العودة للخلف
            window.history.back();
            await this.wait(3000);
            
            this.stats.total++;
            this.sendStats();
        }
        
        getJobTitle(link) {
            const titleEl = link.querySelector('span') || link;
            return titleEl.textContent.trim().substring(0, 50) || 'وظيفة';
        }
        
        clickJob(link) {
            // إزالة target الجديد
            link.removeAttribute('target');
            link.target = '_self';
            
            // النقر
            try {
                link.click();
            } catch (e) {
                window.location.href = link.href;
            }
        }
        
        findSubmitButton() {
            const buttons = document.querySelectorAll('button, input[type="submit"]');
            
            for (const btn of buttons) {
                const text = btn.textContent || btn.value || '';
                if (text.includes('تقديم') && btn.offsetWidth > 0 && !btn.disabled) {
                    return btn;
                }
            }
            
            return null;
        }
        
        handleDialogs() {
            const dialogs = document.querySelectorAll('[role="dialog"], .modal');
            
            for (const dialog of dialogs) {
                if (dialog.offsetWidth > 0) {
                    const buttons = dialog.querySelectorAll('button');
                    
                    // البحث عن زر التأكيد
                    for (const btn of buttons) {
                        if (btn.textContent.includes('تقديم') || 
                            btn.textContent.includes('موافق')) {
                            btn.click();
                            return;
                        }
                    }
                }
            }
        }
        
        sendUpdate(message) {
            try {
                chrome.runtime.sendMessage({
                    action: 'UPDATE_PROGRESS',
                    text: message
                });
            } catch (e) {
                console.log('رسالة:', message);
            }
        }
        
        sendStats() {
            try {
                chrome.runtime.sendMessage({
                    action: 'UPDATE_STATS',
                    stats: this.stats
                });
            } catch (e) {
                console.log('إحصائيات:', this.stats);
            }
        }
        
        async wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }
    
    // إنشاء الكائن
    window.jadaratAuto = new JadaratAuto();
    console.log('✅ جدارات أوتو: جاهز للعمل');
}