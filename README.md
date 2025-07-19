📋 الوصف الدقيق والنهائي لنظام جدارات أوتو
🎯 المفهوم الصحيح
نظام يتنقل في موقع جدارات، يقرأ بطاقات الوظائف بالتسلسل، ويقدم على الوظائف الجديدة مع العودة للخلف بعد كل تقديم لمتابعة باقي الوظائف.





🎯 الشجرة الرئيسية - دورة النظام الكاملة
mermaidgraph TD
    START[🚀 بدء النظام] --> DETECT[🔍 فحص نوع الصفحة]
    
    DETECT --> PAGE_TYPE{📍 أي نوع من الصفحات؟}
    
    %% أنواع الصفحات الأساسية
    PAGE_TYPE -->|🏠 الرئيسية| HOME_ACTION[📍 LOG: أنت في الصفحة الرئيسية]
    PAGE_TYPE -->|📄 تفاصيل وظيفة| DETAILS_ACTION[📍 LOG: أنت في صفحة تفاصيل]
    PAGE_TYPE -->|📋 قائمة الوظائف| LIST_ACTION[📍 LOG: أنت في قائمة الوظائف]
    PAGE_TYPE -->|❓ غير معروفة| UNKNOWN_ACTION[📍 LOG: نوع صفحة غير معروف]
    
    %% معالجة كل نوع صفحة
    HOME_ACTION --> NAVIGATE_TO_LIST[🔄 الانتقال لقائمة الوظائف]
    DETAILS_ACTION --> GO_BACK[🔙 العودة لقائمة الوظائف فوراً]
    LIST_ACTION --> PROCESS_LIST[⚡ بدء معالجة القائمة]
    UNKNOWN_ACTION --> STOP_SYSTEM[🛑 إيقاف العمل نهائياً]
    
    %% تدفق المعالجة
    NAVIGATE_TO_LIST --> WAIT_LOAD[⏳ انتظار التحميل]
    GO_BACK --> WAIT_LOAD
    WAIT_LOAD --> PROCESS_LIST
    
    %% معالجة قائمة الوظائف
    PROCESS_LIST --> CARDS_FOUND{📊 وجدت بطاقات؟}
    CARDS_FOUND -->|❌ لا| NEXT_PAGE[➡️ البحث عن الصفحة التالية]
    CARDS_FOUND -->|✅ نعم| PROCESS_CARDS[🔄 معالجة البطاقات بالتسلسل]
    
    %% معالجة البطاقات
    PROCESS_CARDS --> CARD_LOOP[🎯 حلقة معالجة البطاقات]
    CARD_LOOP --> MORE_CARDS{🔄 توجد بطاقات أخرى؟}
    MORE_CARDS -->|✅ نعم| CARD_LOOP
    MORE_CARDS -->|❌ لا| NEXT_PAGE
    
    %% الانتقال للصفحة التالية
    NEXT_PAGE --> HAS_NEXT{📄 توجد صفحة تالية؟}
    HAS_NEXT -->|✅ نعم| MOVE_NEXT[➡️ الانتقال للصفحة التالية]
    HAS_NEXT -->|❌ لا| FINAL_END[🏁 الانتهاء النهائي]
    
    %% العودة للحلقة الرئيسية
    MOVE_NEXT --> WAIT_LOAD
    
    %% النهاية
    FINAL_END --> SHOW_RESULTS[🎊 عرض النتائج النهائية]
    STOP_SYSTEM --> SAVE_DATA[💾 حفظ البيانات]
    SAVE_DATA --> END[🔚 انتهاء]
    SHOW_RESULTS --> END

🎴 شجرة معالجة البطاقة الفردية
mermaidgraph TD
    CARD_START[🎯 بدء معالجة البطاقة] --> EXTRACT[🔬 استخراج البيانات]
    
    EXTRACT --> EXTRACT_SUCCESS{📝 نجح الاستخراج؟}
    EXTRACT_SUCCESS -->|❌ فشل| LOG_EXTRACT_ERROR[📍 LOG: فشل استخراج البيانات]
    EXTRACT_SUCCESS -->|✅ نجح| LOG_DATA[📍 LOG: عرض البيانات المستخرجة]
    
    LOG_EXTRACT_ERROR --> NEXT_CARD[➡️ الانتقال للبطاقة التالية]
    
    LOG_DATA --> CHECK_APPLIED_CARD[✅ فحص أيقونة تم التقدم في البطاقة]
    CHECK_APPLIED_CARD --> APPLIED_IN_CARD{🔍 وجدت أيقونة تم التقدم؟}
    
    APPLIED_IN_CARD -->|✅ نعم| LOG_APPLIED_CARD[📍 LOG: وجدت أيقونة تم التقدم - تخطي]
    APPLIED_IN_CARD -->|❌ لا| CHECK_MEMORY[🧠 فحص الذاكرة]
    
    LOG_APPLIED_CARD --> SAVE_APPLIED[💾 حفظ في قائمة المُقدم عليها]
    SAVE_APPLIED --> NEXT_CARD
    
    %% فحص الذاكرة
    CHECK_MEMORY --> VISITED_CHECK{🔍 موجودة في قائمة المزارة؟}
    VISITED_CHECK -->|✅ نعم| LOG_VISITED[📍 LOG: مزارة من الذاكرة - تخطي]
    VISITED_CHECK -->|❌ لا| APPLIED_CHECK{🔍 موجودة في قائمة المُقدم عليها؟}
    
    LOG_VISITED --> NEXT_CARD
    
    APPLIED_CHECK -->|✅ نعم| LOG_APPLIED_MEM[📍 LOG: مُقدم عليها من الذاكرة - تخطي]
    APPLIED_CHECK -->|❌ لا| REJECTED_CHECK{🔍 موجودة في قائمة المرفوضة؟}
    
    LOG_APPLIED_MEM --> NEXT_CARD
    
    REJECTED_CHECK -->|✅ نعم| LOG_REJECTED_MEM[📍 LOG: مرفوضة من الذاكرة - تخطي نهائياً]
    REJECTED_CHECK -->|❌ لا| NEW_JOB[🆕 وظيفة جديدة]
    
    LOG_REJECTED_MEM --> NEXT_CARD
    
    %% معالجة وظيفة جديدة
    NEW_JOB --> LOG_NEW[📍 LOG: وظيفة جديدة - بدء المعالجة الكاملة]
    LOG_NEW --> PROCESS_NEW[🔄 المعالجة الكاملة]
    PROCESS_NEW --> ADD_VISITED[💾 إضافة لقائمة المزارة]
    ADD_VISITED --> NEXT_CARD

🆕 شجرة المعالجة الكاملة للوظيفة الجديدة
mermaidgraph TD
    NEW_START[🆕 بدء المعالجة الكاملة] --> CLICK_LINK[🖱️ النقر على رابط الوظيفة]
    
    CLICK_LINK --> CLICK_SUCCESS{🔍 نجح النقر؟}
    CLICK_SUCCESS -->|❌ فشل| TRY_METHODS[🔄 تجربة 4 طرق نقر مختلفة]
    CLICK_SUCCESS -->|✅ نجح| WAIT_DETAILS[⏳ انتظار تحميل صفحة التفاصيل]
    
    TRY_METHODS --> ALL_FAILED{❌ فشلت جميع الطرق؟}
    ALL_FAILED -->|✅ نعم| HANDLE_ERROR[⚠️ معالجة خطأ النقر]
    ALL_FAILED -->|❌ لا| WAIT_DETAILS
    
    WAIT_DETAILS --> DETAILS_LOADED{📄 تم تحميل التفاصيل؟}
    DETAILS_LOADED -->|❌ لا| LOG_NAV_FAILED[📍 LOG: فشل تحميل صفحة التفاصيل]
    DETAILS_LOADED -->|✅ نعم| LOG_NAV_SUCCESS[📍 LOG: تم تحميل التفاصيل بنجاح]
    
    LOG_NAV_FAILED --> HANDLE_ERROR
    
    LOG_NAV_SUCCESS --> CLOSE_POPUPS[🗑️ إغلاق النوافذ المنبثقة]
    CLOSE_POPUPS --> CHECK_BUTTONS[🔍 فحص أزرار التقديم]
    
    CHECK_BUTTONS --> BUTTON_TYPE{🔘 نوع الزر الموجود؟}
    
    BUTTON_TYPE -->|📋 استعراض طلب التقديم| FOUND_REVIEW[✅ وجد زر استعراض]
    BUTTON_TYPE -->|🎯 تقديم| FOUND_SUBMIT[🎯 وجد زر تقديم]
    BUTTON_TYPE -->|❌ لا يوجد زر مناسب| NO_BUTTON[⚠️ لا يوجد زر]
    
    %% معالجة زر الاستعراض
    FOUND_REVIEW --> LOG_ALREADY_APPLIED[📍 LOG: مُقدم مسبقاً]
    LOG_ALREADY_APPLIED --> SAVE_APPLIED_DETAILS[💾 حفظ في المُقدم عليها]
    SAVE_APPLIED_DETAILS --> GO_BACK_APPLIED[🔙 العودة للقائمة]
    
    %% معالجة عدم وجود زر
    NO_BUTTON --> LOG_NO_BUTTON[📍 LOG: لا يوجد زر مناسب]
    LOG_NO_BUTTON --> GO_BACK_NO_BUTTON[🔙 العودة للقائمة]
    
    %% معالجة زر التقديم
    FOUND_SUBMIT --> LOG_CAN_APPLY[📍 LOG: وجد زر تقديم - بدء التقديم]
    LOG_CAN_APPLY --> ATTEMPT_APPLICATION[📝 محاولة التقديم]
    
    %% نتائج التقديم
    ATTEMPT_APPLICATION --> APP_RESULT{📊 نتيجة التقديم؟}
    APP_RESULT -->|🎉 نجح| APP_SUCCESS[✅ نجح التقديم]
    APP_RESULT -->|❌ رُفض| APP_REJECTED[❌ رُفض التقديم]
    APP_RESULT -->|⏰ انتهت المهلة| APP_TIMEOUT[⏰ انتهت مهلة الانتظار]
    
    %% معالجة نتائج التقديم
    APP_SUCCESS --> LOG_SUCCESS[📍 LOG: تم التقديم بنجاح]
    APP_SUCCESS --> SAVE_SUCCESS[💾 حفظ في المُقدم عليها بنجاح]
    
    APP_REJECTED --> LOG_REJECTED[📍 LOG: تم رفض التقديم مع السبب]
    APP_REJECTED --> SAVE_REJECTED[💾 حفظ في المرفوضة مع التفاصيل]
    
    APP_TIMEOUT --> LOG_TIMEOUT[📍 LOG: انتهت مهلة انتظار النتيجة]
    APP_TIMEOUT --> HANDLE_ERROR
    
    %% العودة النهائية
    SAVE_SUCCESS --> GO_BACK_SUCCESS[🔙 العودة للقائمة - إجبارية]
    SAVE_REJECTED --> GO_BACK_REJECTED[🔙 العودة للقائمة - إجبارية]
    GO_BACK_APPLIED --> RETURN_RESULT[📤 إرجاع النتيجة]
    GO_BACK_NO_BUTTON --> RETURN_RESULT
    GO_BACK_SUCCESS --> RETURN_RESULT
    GO_BACK_REJECTED --> RETURN_RESULT
    HANDLE_ERROR --> RETURN_RESULT

📝 شجرة عملية التقديم التفصيلية
mermaidgraph TD
    APPLY_START[📝 بدء عملية التقديم] --> CLICK_SUBMIT[🖱️ النقر على زر تقديم]
    
    CLICK_SUBMIT --> WAIT_CONFIRM[⏳ انتظار نافذة التأكيد]
    WAIT_CONFIRM --> CONFIRM_FOUND{💬 وجدت نافذة التأكيد؟}
    
    CONFIRM_FOUND -->|❌ لا - بعد 10 ثوانٍ| CONFIRM_TIMEOUT[⏰ انتهت مهلة نافذة التأكيد]
    CONFIRM_FOUND -->|✅ نعم| LOG_CONFIRM_FOUND[📍 LOG: وجدت نافذة التأكيد]
    
    LOG_CONFIRM_FOUND --> CLICK_CONFIRM[🖱️ النقر على زر التأكيد]
    CLICK_CONFIRM --> WAIT_RESULT[⏳ انتظار نافذة النتيجة]
    
    WAIT_RESULT --> RESULT_CHECK[🔍 فحص نوافذ النتيجة]
    RESULT_CHECK --> RESULT_TYPE{📊 نوع النتيجة؟}
    
    RESULT_TYPE -->|🎉 تم تقديم طلبك| SUCCESS_DIALOG[✅ نافذة النجاح]
    RESULT_TYPE -->|❌ عذراً لا يمكنك التقديم| REJECT_DIALOG[❌ نافذة الرفض]
    RESULT_TYPE -->|⏰ لا توجد نافذة بعد 20 ثانية| RESULT_TIMEOUT[⏰ انتهت مهلة النتيجة]
    
    %% معالجة النجاح
    SUCCESS_DIALOG --> LOG_SUCCESS_FOUND[📍 LOG: تم التقديم بنجاح]
    LOG_SUCCESS_FOUND --> CLOSE_SUCCESS[🚪 إغلاق نافذة النجاح]
    CLOSE_SUCCESS --> RETURN_SUCCESS[📤 إرجاع: نجح التقديم]
    
    %% معالجة الرفض
    REJECT_DIALOG --> LOG_REJECT_FOUND[📍 LOG: تم رفض التقديم]
    LOG_REJECT_FOUND --> EXTRACT_REASON[📝 استخراج سبب الرفض]
    EXTRACT_REASON --> LOG_REASON[📍 LOG: سبب الرفض]
    LOG_REASON --> CLOSE_REJECT[🚪 إغلاق نافذة الرفض]
    CLOSE_REJECT --> RETURN_REJECT[📤 إرجاع: تم الرفض مع السبب]
    
    %% معالجة انتهاء المهلة
    CONFIRM_TIMEOUT --> RETURN_TIMEOUT[📤 إرجاع: انتهت مهلة التأكيد]
    RESULT_TIMEOUT --> LOG_RESULT_TIMEOUT[📍 LOG: انتهت مهلة انتظار النتيجة]
    LOG_RESULT_TIMEOUT --> RETURN_TIMEOUT

📄 شجرة الانتقال للصفحة التالية
mermaidgraph TD
    NEXT_START[📄 البحث عن الصفحة التالية] --> CHECK_PAGINATION[📊 فحص معلومات التصفح]
    
    CHECK_PAGINATION --> PAGINATION_INFO{📊 وجدت معلومات التصفح؟}
    PAGINATION_INFO -->|❌ لا| SEARCH_BUTTON[🔍 البحث المباشر عن زر التالي]
    PAGINATION_INFO -->|✅ نعم| ANALYZE_PAGINATION[📊 تحليل المعلومات]
    
    ANALYZE_PAGINATION --> IS_LAST{🏁 هذه آخر صفحة؟}
    IS_LAST -->|✅ نعم - الأرقام متساوية| LOG_LAST_PAGE[📍 LOG: هذه آخر صفحة]
    IS_LAST -->|❌ لا| SEARCH_BUTTON
    
    LOG_LAST_PAGE --> DISPLAY_FINAL[🎊 عرض النتائج النهائية]
    DISPLAY_FINAL --> RETURN_FALSE[📤 إرجاع: لا توجد صفحة تالية]
    
    SEARCH_BUTTON --> BUTTON_FOUND{🔍 وجد زر الصفحة التالية؟}
    BUTTON_FOUND -->|❌ لا أو معطل| LOG_NO_NEXT[📍 LOG: لا توجد صفحة تالية]
    BUTTON_FOUND -->|✅ نعم وفعال| LOG_NEXT_FOUND[📍 LOG: وجد زر الصفحة التالية]
    
    LOG_NO_NEXT --> DISPLAY_FINAL
    
    LOG_NEXT_FOUND --> CLICK_NEXT[🖱️ النقر على زر التالي]
    CLICK_NEXT --> WAIT_NEW_PAGE[⏳ انتظار تحميل الصفحة الجديدة]
    WAIT_NEW_PAGE --> INCREMENT_PAGE[📊 زيادة رقم الصفحة]
    INCREMENT_PAGE --> LOG_NEXT_SUCCESS[📍 LOG: تم الانتقال للصفحة الجديدة]
    LOG_NEXT_SUCCESS --> RETURN_TRUE[📤 إرجاع: تم الانتقال بنجاح]

⚠️ شجرة معالجة الأخطاء
mermaidgraph TD
    ERROR_START[⚠️ حدث خطأ] --> LOG_ERROR[📍 LOG: بدء معالجة الخطأ]
    
    LOG_ERROR --> RELOAD_PAGE[🔄 إعادة تحميل الصفحة]
    RELOAD_PAGE --> WAIT_RELOAD[⏳ انتظار إعادة التحميل]
    WAIT_RELOAD --> DETECT_AFTER[🔍 فحص نوع الصفحة بعد إعادة التحميل]
    
    DETECT_AFTER --> PAGE_AFTER{📍 نوع الصفحة بعد التحميل؟}
    
    PAGE_AFTER -->|📄 صفحة تفاصيل| LOG_DETAILS_RECOVERY[📍 LOG: نحن في صفحة تفاصيل]
    PAGE_AFTER -->|📋 قائمة الوظائف| LOG_LIST_RECOVERY[📍 LOG: نحن في قائمة الوظائف]
    PAGE_AFTER -->|❓ صفحة غير معروفة| LOG_UNKNOWN_RECOVERY[📍 LOG: صفحة غير معروفة]
    
    LOG_DETAILS_RECOVERY --> GO_BACK_RECOVERY[🔙 العودة للقائمة]
    GO_BACK_RECOVERY --> RETURN_SUCCESS_RECOVERY[📤 إرجاع: تم التعافي بنجاح]
    
    LOG_LIST_RECOVERY --> WAIT_CONTINUE[⏳ انتظار 3 ثوانٍ]
    WAIT_CONTINUE --> CONTINUE_PROCESS[▶️ متابعة المعالجة]
    CONTINUE_PROCESS --> RETURN_SUCCESS_RECOVERY
    
    LOG_UNKNOWN_RECOVERY --> SAVE_BEFORE_STOP[💾 حفظ البيانات قبل التوقف]
    SAVE_BEFORE_STOP --> STOP_PROCESS[🛑 إيقاف العمل نهائياً]
    STOP_PROCESS --> RETURN_FATAL[📤 إرجاع: خطأ قاتل]

🔄 شجرة نظام الإيقاف والاستئناف
mermaidgraph TD
    CONTROL_START[🎮 أمر التحكم] --> CONTROL_TYPE{🎮 نوع الأمر؟}
    
    CONTROL_TYPE -->|⏸️ إيقاف مؤقت| PAUSE_ACTION[⏸️ تنفيذ الإيقاف المؤقت]
    CONTROL_TYPE -->|🛑 إيقاف نهائي| STOP_ACTION[🛑 تنفيذ الإيقاف النهائي]
    CONTROL_TYPE -->|▶️ استئناف| RESUME_ACTION[▶️ تنفيذ الاستئناف]
    
    %% الإيقاف المؤقت
    PAUSE_ACTION --> LOG_PAUSE[📍 LOG: إيقاف مؤقت - حفظ الموقع]
    LOG_PAUSE --> SAVE_POSITION[💾 حفظ الموقع الحالي]
    SAVE_POSITION --> LOG_POSITION[📍 LOG: تم حفظ الموقع]
    LOG_POSITION --> PAUSE_COMPLETE[⏸️ اكتمال الإيقاف المؤقت]
    
    %% الإيقاف النهائي
    STOP_ACTION --> LOG_STOP[📍 LOG: إيقاف نهائي - عدم حفظ الموقع]
    LOG_STOP --> CLEAR_PAUSE_DATA[🗑️ مسح بيانات الإيقاف المؤقت]
    CLEAR_PAUSE_DATA --> SAVE_FINAL_DATA[💾 حفظ البيانات النهائية فقط]
    SAVE_FINAL_DATA --> LOG_STOP_CLEAR[📍 LOG: تم مسح بيانات الإيقاف]
    LOG_STOP_CLEAR --> STOP_COMPLETE[🛑 اكتمال الإيقاف النهائي]
    
    %% الاستئناف
    RESUME_ACTION --> CHECK_PAUSE_DATA[🔍 فحص بيانات الإيقاف المؤقت]
    CHECK_PAUSE_DATA --> HAS_PAUSE_DATA{💾 توجد بيانات إيقاف؟}
    
    HAS_PAUSE_DATA -->|✅ نعم| LOG_RESUME[📍 LOG: استئناف من الإيقاف المؤقت]
    HAS_PAUSE_DATA -->|❌ لا| LOG_NEW_START[📍 LOG: بدء جديد]
    
    LOG_RESUME --> RESTORE_POSITION[🔄 استعادة الموقع المحفوظ]
    RESTORE_POSITION --> LOG_RESTORE[📍 LOG: العودة للموقع المحفوظ]
    LOG_RESTORE --> RESUME_FROM_SAVED[▶️ الاستئناف من النقطة المحفوظة]
    
    LOG_NEW_START --> START_FROM_BEGINNING[🎯 البدء من البطاقة الأولى]
    START_FROM_BEGINNING --> LOG_AVOID_MEMORY[📍 LOG: سيتم تجنب الوظائف من الذاكرة]
    LOG_AVOID_MEMORY --> RESUME_NEW[▶️ الاستئناف كبداية جديدة]

🧠 شجرة إدارة الذاكرة
mermaidgraph TD
    MEMORY_START[🧠 عملية متعلقة بالذاكرة] --> MEMORY_ACTION{🎯 نوع العملية؟}
    
    MEMORY_ACTION -->|💾 حفظ وظيفة| SAVE_JOB[💾 حفظ في الذاكرة]
    MEMORY_ACTION -->|🔍 فحص وظيفة| CHECK_JOB[🔍 فحص الذاكرة]
    MEMORY_ACTION -->|🗑️ مسح البيانات| CLEAR_MEMORY[🗑️ مسح الذاكرة]
    
    %% حفظ الوظيفة
    SAVE_JOB --> SAVE_TYPE{📋 في أي قائمة؟}
    SAVE_TYPE -->|📚 مزارة| ADD_VISITED[➕ إضافة لقائمة المزارة]
    SAVE_TYPE -->|✅ مُقدم عليها| ADD_APPLIED[➕ إضافة لقائمة المُقدم عليها]
    SAVE_TYPE -->|❌ مرفوضة| ADD_REJECTED[➕ إضافة لقائمة المرفوضة]
    
    ADD_VISITED --> SAVE_TO_STORAGE[💾 حفظ في التخزين المحلي]
    ADD_APPLIED --> SAVE_TO_STORAGE
    ADD_REJECTED --> SAVE_REJECTION_DETAILS[💾 حفظ تفاصيل الرفض]
    SAVE_REJECTION_DETAILS --> SAVE_TO_STORAGE
    
    %% فحص الوظيفة
    CHECK_JOB --> CHECK_VISITED{🔍 في قائمة المزارة؟}
    CHECK_VISITED -->|✅ نعم| RETURN_VISITED[📤 إرجاع: مزارة]
    CHECK_VISITED -->|❌ لا| CHECK_APPLIED{🔍 في قائمة المُقدم عليها؟}
    
    CHECK_APPLIED -->|✅ نعم| RETURN_APPLIED[📤 إرجاع: مُقدم عليها]
    CHECK_APPLIED -->|❌ لا| CHECK_REJECTED{🔍 في قائمة المرفوضة؟}
    
    CHECK_REJECTED -->|✅ نعم| RETURN_REJECTED[📤 إرجاع: مرفوضة]
    CHECK_REJECTED -->|❌ لا| RETURN_NEW[📤 إرجاع: جديدة]
    
    %% مسح الذاكرة
    CLEAR_MEMORY --> CONFIRM_CLEAR{⚠️ تأكيد المسح؟}
    CONFIRM_CLEAR -->|❌ لا| CANCEL_CLEAR[🚫 إلغاء المسح]
    CONFIRM_CLEAR -->|✅ نعم| CLEAR_ALL_LISTS[🗑️ مسح جميع القوائم]
    
    CLEAR_ALL_LISTS --> CLEAR_STORAGE[🗑️ مسح التخزين المحلي]
    CLEAR_STORAGE --> LOG_CLEARED[📍 LOG: تم مسح جميع البيانات]
    LOG_CLEARED --> MEMORY_CLEARED[✅ اكتمال المسح]
    

🔄 الحلقة الرئيسية الصحيحة
javascriptwhile (!shouldStop) {
    📍 console: "🔍 [DETECT] فحص نوع الصفحة الحالية..."
    
    const pageType = detectPageType();
    
    if (pageType === 'home') {
        📍 console: "🏠 [HOME] أنت في الصفحة الرئيسية - اذهب إلى قائمة الوظائف"
        await navigateToJobList();
        
    } else if (pageType === 'jobDetails') {
        📍 console: "📄 [DETAILS] أنت في صفحة تفاصيل - العودة لقائمة الوظائف"
        await goBackToJobList();
        
    } else if (pageType === 'jobList') {
        📍 console: "📋 [LIST] أنت في قائمة الوظائف - بدء المعالجة"
        const hasMoreJobs = await processJobListPage();
        
        if (!hasMoreJobs) {
            📍 console: "📄 [PAGINATION] انتهت البطاقات في هذه الصفحة - البحث عن الصفحة التالية"
            const movedToNext = await moveToNextPage();
            if (!movedToNext) {
                📍 console: "🏁 [FINAL] انتهت جميع الصفحات - إنهاء العمل"
                break;
            }
        }
        
    } else {
        📍 console: "❌ [UNKNOWN] نوع صفحة غير معروف - إيقاف العمل"
        break;
    }
}

📋 معالجة قائمة الوظائف - الصحيحة
javascriptasync function processJobListPage() {
    📍 console: "⏳ [LOADING] انتظار تحميل بطاقات الوظائف..."
    
    // انتظار تحميل البطاقات (حتى 20 محاولة × 1.5 ثانية = 30 ثانية)
    let jobCards = [];
    for (let attempt = 1; attempt <= 20; attempt++) {
        📍 console: `🔍 [SCAN] محاولة ${attempt}/20 للعثور على البطاقات`
        
        jobCards = getAllJobCards();
        if (jobCards.length > 0) {
            📍 console: `✅ [FOUND] تم العثور على ${jobCards.length} بطاقة وظيفة`
            break;
        }
        await wait(1500);
    }
    
    if (jobCards.length === 0) {
        📍 console: "⚠️ [EMPTY] لا توجد بطاقات في هذه الصفحة - الانتقال للصفحة التالية"
        return false; // إشارة للانتقال للصفحة التالية
    }
    
    // معالجة كل بطاقة بالتسلسل
    for (let i = 0; i < jobCards.length; i++) {
        if (shouldStop) break;
        
        currentCardIndex = i + 1;
        📍 console: `\n🎯 [CARD] بدء معالجة البطاقة ${currentCardIndex}/${jobCards.length}`
        
        await processIndividualJob(jobCards[i]);
        
        // انتظار بين البطاقات (3 ثابت + 0-2 عشوائي = 3-5 ثواني)
        if (i < jobCards.length - 1) {
            const delayTime = 3000 + (Math.random() * 2000);
            📍 console: `⏳ [DELAY] انتظار ${Math.round(delayTime/1000)} ثانية قبل البطاقة التالية`
            await wait(delayTime);
        }
        
        // حفظ البيانات كل 3 بطاقات
        if ((i + 1) % 3 === 0) {
            📍 console: "💾 [SAVE] حفظ البيانات كل 3 بطاقات"
            await saveMemoryData();
        }
    }
    
    📍 console: "✅ [COMPLETE] انتهت جميع البطاقات في هذه الصفحة"
    return false; // إشارة للانتقال للصفحة التالية
}

🎴 معالجة البطاقة الفردية - الدقيقة
javascriptasync function processIndividualJob(jobCard) {
    // 1️⃣ استخراج البيانات
    📍 console: "🔬 [EXTRACT] استخراج بيانات البطاقة..."
    const jobData = extractJobDataFromHTML(jobCard);
    
    📍 console: `📝 [DATA] العنوان: "${jobData.title}"`
    📍 console: `🏢 [DATA] الشركة: "${jobData.company}"`
    📍 console: `📍 [DATA] الموقع: "${jobData.location}"`
    📍 console: `📊 [DATA] التوافق: "${jobData.matchingScore || 'غير محدد'}"`
    📍 console: `📅 [DATA] التاريخ: "${jobData.publishDate || 'غير محدد'}"`
    
    // 2️⃣ فحص "تم التقدم" في البطاقة نفسها
    if (jobData.alreadyApplied) {
        📍 console: "✅ [APPLIED_CARD] وجدت أيقونة 'تم التقدم' في البطاقة - تخطي"
        appliedJobs.add(jobData.id);
        stats.alreadyApplied++;
        await saveMemoryData();
        return 'already_applied_list';
    }
    
    // 3️⃣ فحص الذاكرة
    if (visitedJobs.has(jobData.id)) {
        📍 console: "🔄 [MEMORY] هذه الوظيفة مزارة من الذاكرة - تخطي"
        stats.fromMemory++;
        stats.skipped++;
        return 'visited_from_memory';
    }
    
    if (appliedJobs.has(jobData.id)) {
        📍 console: "✅ [MEMORY] مُقدم عليها من الذاكرة - تخطي"
        stats.fromMemory++;
        stats.alreadyApplied++;
        return 'applied_from_memory';
    }
    
    if (rejectedJobs.has(jobData.id)) {
        📍 console: "❌ [MEMORY] مرفوضة من الذاكرة - تخطي نهائياً"
        stats.fromMemory++;
        stats.rejected++;
        return 'rejected_from_memory';
    }
    
    // 4️⃣ وظيفة جديدة - معالجة كاملة
    📍 console: "🆕 [NEW] وظيفة جديدة - بدء المعالجة الكاملة"
    const result = await processNewJob(jobData);
    
    // 5️⃣ تسجيل الزيارة في الذاكرة
    visitedJobs.add(jobData.id);
    stats.total++;
    
    return result;
}

🆕 معالجة الوظيفة الجديدة - الصحيحة
javascriptasync function processNewJob(jobData) {
    try {
        // 1️⃣ النقر على الرابط
        📍 console: "🖱️ [CLICK] النقر على رابط الوظيفة..."
        await clickElementSafely(jobData.element);
        
        // 2️⃣ انتظار تحميل صفحة التفاصيل (حتى 15 ثانية)
        📍 console: "⏳ [NAVIGATION] انتظار تحميل صفحة التفاصيل..."
        const navigationSuccess = await waitForNavigationToDetails();
        
        if (!navigationSuccess) {
            📍 console: "❌ [NAV_FAILED] فشل في تحميل صفحة التفاصيل"
            stats.errors++;
            await handleError(); // إعادة تحميل وتعافي
            return 'navigation_failed';
        }
        
        📍 console: "✅ [NAV_SUCCESS] تم تحميل صفحة التفاصيل بنجاح"
        
        // 3️⃣ معالجة النوافذ المنبثقة (تقييم/استطلاع)
        📍 console: "🗑️ [POPUP] فحص وإغلاق النوافذ المنبثقة..."
        await handleAnyPopups();
        
        // 4️⃣ فحص نوع الزر في صفحة التفاصيل
        📍 console: "🔍 [BUTTON] البحث عن أزرار التقديم..."
        const buttonCheck = await checkButtonsInDetails();
        
        if (buttonCheck.type === 'already_applied') {
            📍 console: "✅ [APPLIED_DETAILS] وجد زر 'استعراض طلب التقديم' - مُقدم مسبقاً"
            appliedJobs.add(jobData.id);
            stats.alreadyApplied++;
            await saveMemoryData();
            await goBackToJobList();
            return 'already_applied_details';
        }
        
        if (buttonCheck.type === 'can_apply') {
            📍 console: "🎯 [CAN_APPLY] وجد زر 'تقديم' - بدء عملية التقديم"
            const applicationResult = await attemptApplication();
            
            if (applicationResult.success) {
                📍 console: "🎉 [SUCCESS] تم التقديم بنجاح!"
                appliedJobs.add(jobData.id);
                stats.applied++;
            } else {
                📍 console: `❌ [REJECTED] تم رفض التقديم: ${applicationResult.reason}`
                rejectedJobs.add(jobData.id);
                stats.rejected++;
                await saveRejectionData(jobData, applicationResult.reason);
            }
            
            await saveMemoryData();
            await goBackToJobList(); // **العودة للخلف بعد كل تقديم**
            return applicationResult.success ? 'applied_success' : 'applied_rejected';
        }
        
        if (buttonCheck.type === 'no_button') {
            📍 console: "⚠️ [NO_BUTTON] لا يوجد زر مناسب - العودة للقائمة"
            await goBackToJobList();
            return 'no_suitable_button';
        }
        
    } catch (error) {
        📍 console: `❌ [ERROR] خطأ في معالجة الوظيفة: ${error.message}`
        stats.errors++;
        await handleError();
        return 'error';
    }
}

🔙 العودة للقائمة - نقطة مهمة
javascriptasync function goBackToJobList() {
    📍 console: "🔙 [RETURN] العودة لقائمة الوظائف..."
    
    // الطريقة الوحيدة المضمونة - التنقل المباشر
    const jobListUrl = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
    📍 console: `🔄 [NAVIGATE] التنقل المباشر إلى: ${jobListUrl}`
    
    window.location.href = jobListUrl;
    await wait(5000); // انتظار التحميل
    
    📍 console: "✅ [RETURN_SUCCESS] تم العودة لقائمة الوظائف بنجاح"
    
    // **هنا نكمل من حيث توقفنا - نفس الصفحة، البطاقة التالية**
}

🎯 عملية التقديم - التفاصيل الدقيقة
javascriptasync function attemptApplication() {
    // 1️⃣ النقر على زر "تقديم"
    📍 console: "🖱️ [APPLY] النقر على زر 'تقديم'..."
    const submitButton = await findSubmitButton();
    await clickElementSafely(submitButton);
    await wait(2000);
    
    // 2️⃣ معالجة نافذة التأكيد
    📍 console: "⏳ [CONFIRM] انتظار نافذة التأكيد..."
    
    for (let attempt = 1; attempt <= 10; attempt++) {
        📍 console: `🔍 [CONFIRM] محاولة ${attempt}/10 للعثور على نافذة التأكيد`
        
        const confirmDialog = document.querySelector('div[data-popup][role="dialog"]');
        if (confirmDialog && confirmDialog.textContent.includes('هل أنت متأكد')) {
            📍 console: "✅ [CONFIRM_FOUND] وجدت نافذة التأكيد"
            
            const confirmButton = confirmDialog.querySelector('button[data-button]');
            if (confirmButton && confirmButton.textContent.trim() === 'تقديم') {
                📍 console: "🖱️ [CONFIRM_CLICK] النقر على زر التأكيد..."
                await clickElementSafely(confirmButton);
                await wait(3000);
                break;
            }
        }
        await wait(1000);
    }
    
    // 3️⃣ معالجة نافذة النتيجة
    📍 console: "⏳ [RESULT] انتظار نافذة النتيجة..."
    
    for (let attempt = 1; attempt <= 20; attempt++) {
        📍 console: `🔍 [RESULT] محاولة ${attempt}/20 للعثور على نافذة النتيجة`
        
        const resultDialogs = document.querySelectorAll('div[data-popup][role="dialog"]');
        
        for (const dialog of resultDialogs) {
            if (dialog.style.display === 'none') continue;
            
            const dialogText = dialog.textContent;
            
            if (dialogText.includes('تم تقديم طلبك')) {
                📍 console: "🎉 [SUCCESS] تم التقديم بنجاح!"
                await closeDialog(dialog);
                return { success: true, type: 'success' };
            }
            
            if (dialogText.includes('عذراً ، لا يمكنك التقديم')) {
                📍 console: "❌ [REJECTED] تم رفض التقديم"
                
                const reason = extractRejectionReason(dialogText);
                📍 console: `📝 [REASON] سبب الرفض: "${reason}"`
                
                await closeDialog(dialog);
                return { success: false, type: 'rejection', reason: reason };
            }
        }
        await wait(1000);
    }
    
    📍 console: "⚠️ [TIMEOUT] انتهت مهلة انتظار نافذة النتيجة"
    return { success: false, type: 'timeout', reason: 'انتهت المهلة' };
}

📄 الانتقال للصفحة التالية - الطريقة الصحيحة
javascriptasync function moveToNextPage() {
    📍 console: "📄 [NEXT_PAGE] البحث عن الصفحة التالية..."
    
    // فحص معلومات التصفح لمعرفة الوضع الحالي
    const paginationInfo = document.querySelector('.pagination-counter');
    if (paginationInfo) {
        const text = paginationInfo.textContent;
        📍 console: `📊 [PAGINATION] معلومات التصفح: "${text}"`
        
        // مثال: "171 الى 180 من 186 عنصر"
        const match = text.match(/(\d+)\s+الى\s+(\d+)\s+من\s+(\d+)/);
        if (match) {
            const [_, start, end, total] = match;
            📍 console: `📊 [ANALYSIS] من ${start} إلى ${end} من أصل ${total} عنصر`
            
            if (parseInt(end) >= parseInt(total)) {
                📍 console: "🏁 [LAST_PAGE] هذه آخر صفحة - انتهت جميع الوظائف"
                await displayFinalResults();
                return false;
            }
        }
    }
    
    // البحث عن زر "الصفحة التالية"
    const nextButtons = document.querySelectorAll('button[aria-label*="go to next page"]');
    
    for (const button of nextButtons) {
        if (!button.disabled && button.offsetWidth > 0) {
            📍 console: "✅ [NEXT_FOUND] وجد زر الصفحة التالية"
            currentPage++;
            
            await clickElementSafely(button);
            await wait(4000);
            await waitForPageLoad();
            
            📍 console: `📄 [NEXT_SUCCESS] تم الانتقال للصفحة ${currentPage}`
            return true;
        }
    }
    
    📍 console: "🏁 [NO_NEXT] لا توجد صفحة تالية - انتهت جميع الصفحات"
    await displayFinalResults();
    return false;
}

⚠️ معالجة الأخطاء - النهج الصحيح
javascriptasync function handleError() {
    📍 console: "❌ [ERROR_HANDLER] بدء معالجة الخطأ..."
    
    // إعادة تحميل الصفحة
    📍 console: "🔄 [RELOAD] إعادة تحميل الصفحة..."
    window.location.reload();
    await wait(5000);
    
    // فحص الوضع بعد إعادة التحميل
    const pageType = detectPageType();
    📍 console: `🔍 [POST_RELOAD] نوع الصفحة بعد إعادة التحميل: ${pageType}`
    
    if (pageType === 'jobDetails') {
        📍 console: "📄 [RECOVER] نحن في صفحة تفاصيل - العودة للقائمة"
        await goBackToJobList();
        
    } else if (pageType === 'jobList') {
        📍 console: "📋 [RECOVER] نحن في قائمة الوظائف - انتظار 3 ثواني ثم المتابعة"
        await wait(3000);
        // سيكمل من البطاقة الأولى في الصفحة الحالية مع تجنب المزارة
        
    } else {
        📍 console: "❌ [FATAL] صفحة غير معروفة - إيقاف العمل نهائياً"
        await saveMemoryData();
        stopProcess();
        return false;
    }
    
    return true;
}

🔄 الإيقاف المؤقت والنهائي - التوضيح الصحيح
الإيقاف المؤقت (Pause):
javascript// عند الإيقاف المؤقت
📍 console: "⏸️ [PAUSE] إيقاف مؤقت - حفظ الموقع الحالي"

const pauseData = {
    currentPage: currentPage,           // مثلاً: 5
    currentCardIndex: currentCardIndex, // مثلاً: 7
    isPaused: true
};

await chrome.storage.local.set({ pauseData: pauseData });
📍 console: `💾 [PAUSE_SAVE] تم حفظ الموقع: صفحة ${currentPage}, بطاقة ${currentCardIndex}`

// عند الاستئناف
📍 console: "▶️ [RESUME] استئناف من الإيقاف المؤقت"

const stored = await chrome.storage.local.get(['pauseData']);
if (stored.pauseData?.isPaused) {
    currentPage = stored.pauseData.currentPage;
    currentCardIndex = stored.pauseData.currentCardIndex;
    
    📍 console: `🔄 [RESUME] العودة للصفحة ${currentPage}, البطاقة ${currentCardIndex}`
    // سيكمل من نفس البطاقة التي توقف عندها
}
الإيقاف النهائي (Stop):
javascript// عند الإيقاف النهائي
📍 console: "🛑 [STOP] إيقاف نهائي - عدم حفظ الموقع"

// حذف أي بيانات إيقاف مؤقت
await chrome.storage.local.remove(['pauseData']);
📍 console: "🗑️ [STOP_CLEAR] تم مسح بيانات الإيقاف المؤقت"

// حفظ البيانات النهائية فقط
await saveMemoryData();

// عند البدء من جديد بعد الإيقاف النهائي
📍 console: "🔄 [RESTART] بدء جديد - من البطاقة الأولى في الصفحة الحالية"
currentCardIndex = 0; // بدء من البطاقة الأولى

// لكن سيتجنب الوظائف المزارة من الذاكرة
📍 console: `🧠 [MEMORY] سيتم تجنب ${visitedJobs.size} وظيفة مزارة من الذاكرة`

🏁 الانتهاء النهائي - السيناريو الكامل
javascript// عند الانتهاء من آخر وظيفة في آخر صفحة
📍 console: "🏁 [FINAL_JOB] انتهت آخر وظيفة في آخر صفحة"

// العودة من صفحة التفاصيل للقائمة (إجباري)
📍 console: "🔙 [FINAL_RETURN] العودة لقائمة الوظائف للمرة الأخيرة"
await goBackToJobList();

// إصدار صوت بسيط
📍 console: "🔊 [SOUND] إصدار صوت التنبيه"
playSimpleNotificationSound();

// عرض الرسالة النهائية
📍 console: "📢 [MESSAGE] عرض رسالة الانتهاء"
const message = `تم الانتهاء من جميع الوظائف المتاحة
إجمالي الوظائف المزارة: ${visitedJobs.size}
تم التقديم بنجاح: ${stats.applied}
يمكنك الآن استخراج التقرير`;

showCompletionMessage(message);

// إتاحة استخراج التقرير
📍 console: "📥 [EXPORT] التقرير جاهز للاستخراج"
enableExportButton();

📊 عدد البطاقات الصحيح
javascript// في كل صفحة عادية
📍 console: "📊 [CARDS] الصفحات العادية تحتوي على 10 بطاقات"

// في الصفحة الأخيرة
📍 console: "📊 [LAST_CARDS] الصفحة الأخيرة قد تحتوي على 10 بطاقات أو أقل"

// مثال عملي من ملف HTML الذي أرسلته:
// الصفحة 18: من 171 إلى 180 (10 بطاقات)
// الصفحة 19: من 181 إلى 186 (6 بطاقات فقط)

if (currentPage === totalPages) {
    📍 console: `📊 [FINAL_PAGE] الصفحة الأخيرة قد تحتوي على أقل من 10 بطاقات`
}

🎯 الحقائق المطلقة - بدون أخطاء
1. حول العودة للخلف:

✅ يوجد عودة للخلف - بعد كل تقديم للعودة لقائمة الوظائف
✅ لا يوجد عودة للوراء - لا يعود لوظيفة سابقة أو صفحة سابقة في التتابع

2. حول عدد البطاقات:

✅ الصفحات العادية: 10 بطاقات
✅ الصفحة الأخيرة: 10 بطاقات أو أقل (حسب العدد المتبقي)

3. حول الصفحة الرئيسية:

✅ الرسالة الصحيحة: "🏠 [HOME] أنت في الصفحة الرئيسية - اذهب إلى قائمة الوظائف"

4. حول فشل العثور على الأزرار:

✅ بعد محاولتين: إيقاف العمل + حفظ البيانات + رسالة console فقط

5. حول الذاكرة:

✅ الوظائف المرفوضة: تخطي نهائي حتى لو تغيرت الخبرة
✅ لا تنظيف: إلا بزر مسح البيانات

6. حول Console Log:

✅ كل خطوة مُسجلة للمساعدة في التشخيص
✅ لا تنظيف أبداً للرسائل

هذا هو الوصف الصحيح والدقيق 100% بدون أخطاء! 
نص يغطي جميع نقاط المشروعEdit📋 الوصف النصي الكامل لنظام جدارات أوتو
🎯 المفهوم العام
النظام عبارة عن روبوت تصفح يتنقل في موقع جدارات السعودي، يقرأ بطاقات الوظائف واحدة تلو الأخرى بالتسلسل، ويقدم على الوظائف الجديدة تلقائياً. بعد كل تقديم، يعود للخلف لقائمة الوظائف لمتابعة باقي الوظائف في نفس الصفحة.

🔄 الحلقة الرئيسية للنظام
النظام يعمل في حلقة مستمرة تتكرر حتى ينتهي من جميع الوظائف أو يتم إيقافه. في كل دورة من هذه الحلقة، يحدث التالي:
خطوة 1: فحص نوع الصفحة الحالية
النظام يفحص الرابط الحالي ليحدد في أي نوع من الصفحات هو موجود:
إذا كان في الصفحة الرئيسية:

يسجل رسالة: "أنت في الصفحة الرئيسية - اذهب إلى قائمة الوظائف"
ينتقل لصفحة قائمة الوظائف
ينتظر التحميل

إذا كان في صفحة تفاصيل وظيفة:

يسجل رسالة: "أنت في صفحة تفاصيل - العودة لقائمة الوظائف"
يعود فوراً لقائمة الوظائف
ينتظر التحميل

إذا كان في صفحة قائمة الوظائف:

يسجل رسالة: "أنت في قائمة الوظائف - بدء المعالجة"
يبدأ معالجة بطاقات الوظائف في هذه الصفحة

إذا كان في صفحة غير معروفة:

يسجل رسالة: "نوع صفحة غير معروف - إيقاف العمل"
يوقف العمل نهائياً


📋 معالجة صفحة قائمة الوظائف
عندما يكون النظام في صفحة قائمة الوظائف، يحدث التالي:
مرحلة 1: انتظار تحميل البطاقات

النظام ينتظر تحميل بطاقات الوظائف في الصفحة
يحاول العثور على البطاقات حتى 20 مرة
بين كل محاولة ينتظر ثانية ونصف
إجمالي وقت الانتظار الأقصى: 30 ثانية
يسجل رسالة في كل محاولة: "محاولة X من 20 للعثور على البطاقات"

مرحلة 2: جمع بطاقات الوظائف

النظام يبحث عن جميع روابط الوظائف في الصفحة
يحاول العثور على الحاوي الخاص بكل بطاقة
يسجل رسالة لكل بطاقة: "فحص الرابط X من Y"
النتيجة النهائية: قائمة بجميع البطاقات الجاهزة للمعالجة

مرحلة 3: معالجة البطاقات بالتسلسل

النظام يعالج البطاقات واحدة تلو الأخرى
لا يعالج أكثر من بطاقة واحدة في نفس الوقت
بين كل بطاقة والتي تليها، ينتظر من 3 إلى 5 ثوانٍ
كل 3 بطاقات، يحفظ البيانات في الذاكرة
يسجل رسالة لكل بطاقة: "بدء معالجة البطاقة X من Y"

مرحلة 4: الانتهاء من الصفحة

عندما ينتهي من جميع البطاقات في الصفحة الحالية
يسجل رسالة: "انتهت جميع البطاقات في هذه الصفحة"
ينتقل للبحث عن الصفحة التالية


🎴 معالجة البطاقة الفردية
لكل بطاقة وظيفة، يحدث التالي بالتسلسل:
خطوة 1: استخراج البيانات
النظام يستخرج المعلومات التالية من البطاقة:

عنوان الوظيفة: مثل "مطور ويب" أو "محاسب"
اسم الشركة: مثل "شركة التقنية المتقدمة"
الموقع: مثل "الرياض" أو "جدة"
نسبة التوافق: مثل "85%" (إن وجدت)
تاريخ النشر: مثل "15/01/2025" (إن وجد)
حالة التقديم: هل يوجد أيقونة "تم التقدم" في البطاقة

خطوة 2: فحص حالة التقديم في البطاقة
النظام يبحث عن أيقونة وردية دائرية مع علامة صح ونص "تم التقدم":

إذا وجدها: يسجل "وجدت أيقونة تم التقدم في البطاقة - تخطي"
يحفظ هذه الوظيفة في قائمة الوظائف المُقدم عليها
ينتقل فوراً للبطاقة التالية بدون النقر على هذه البطاقة

خطوة 3: فحص الذاكرة
النظام يفحص ثلاث قوائم محفوظة في الذاكرة:
قائمة الوظائف المزارة:

إذا كانت هذه الوظيفة موجودة في هذه القائمة
يسجل "هذه الوظيفة مزارة من الذاكرة - تخطي"
ينتقل للبطاقة التالية

قائمة الوظائف المُقدم عليها:

إذا كانت هذه الوظيفة موجودة في هذه القائمة
يسجل "مُقدم عليها من الذاكرة - تخطي"
ينتقل للبطاقة التالية

قائمة الوظائف المرفوضة:

إذا كانت هذه الوظيفة موجودة في هذه القائمة
يسجل "مرفوضة من الذاكرة - تخطي نهائياً"
ينتقل للبطاقة التالية
ملاحظة مهمة: حتى لو تغيرت خبرة المستخدم، لن يعيد التقديم على الوظائف المرفوضة

خطوة 4: وظيفة جديدة
إذا لم تكن الوظيفة في أي من القوائم السابقة:

يسجل "وظيفة جديدة - بدء المعالجة الكاملة"
يبدأ المعالجة الكاملة لهذه الوظيفة
يضيف هذه الوظيفة لقائمة الوظائف المزارة


🆕 المعالجة الكاملة للوظيفة الجديدة
عندما يواجه النظام وظيفة جديدة، يحدث التالي:
مرحلة 1: النقر على الرابط

النظام ينقر على رابط الوظيفة
يجرب 4 طرق مختلفة للنقر إذا فشلت الأولى
يسجل رسالة لكل محاولة: "تجربة الطريقة X من 4"
إذا نجح النقر، ينتقل لصفحة تفاصيل الوظيفة

مرحلة 2: انتظار تحميل صفحة التفاصيل

ينتظر حتى 15 ثانية لتحميل صفحة التفاصيل
يتأكد من وجود عناصر معينة تدل على اكتمال التحميل
يسجل رسالة كل ثانية: "محاولة X من 15 للتأكد من تحميل التفاصيل"
إذا فشل التحميل، يعالج الخطأ بإعادة تحميل الصفحة

مرحلة 3: إغلاق النوافذ المنبثقة

يبحث عن نوافذ التقييم أو الاستطلاع
يغلقها تلقائياً إذا وجدها
يسجل رسالة: "فحص وإغلاق النوافذ المنبثقة"

مرحلة 4: فحص أزرار التقديم
النظام يبحث عن الأزرار في صفحة التفاصيل:
زر "استعراض طلب التقديم":

إذا وجد هذا الزر، معناه أن المستخدم قدم على هذه الوظيفة مسبقاً
يسجل "وجد زر استعراض طلب التقديم - مُقدم مسبقاً"
يحفظ الوظيفة في قائمة المُقدم عليها
يعود لقائمة الوظائف فوراً

زر "تقديم":

إذا وجد هذا الزر، معناه أنه يمكن التقديم على الوظيفة
يسجل "وجد زر تقديم - بدء عملية التقديم"
يبدأ عملية التقديم

لا يوجد زر مناسب:

إذا لم يجد أي من الزرين السابقين
يسجل "لا يوجد زر مناسب - العودة للقائمة"
يعود لقائمة الوظائف

مرحلة 5: عملية التقديم
إذا وجد زر "تقديم"، يحدث التالي:
الخطوة 1 - النقر على زر التقديم:

ينقر على زر "تقديم"
ينتظر ثانيتين

الخطوة 2 - نافذة التأكيد:

تظهر نافذة تسأل: "هل أنت متأكد من التقديم على وظيفة [اسم الوظيفة]؟"
النظام يبحث عن هذه النافذة حتى 10 ثوانٍ
عندما يجدها، ينقر على زر "تقديم" في النافذة
ينتظر 3 ثوانٍ

الخطوة 3 - نافذة النتيجة:
النظام ينتظر نافذة النتيجة حتى 20 ثانية، والنتائج المحتملة:
نجح التقديم:

تظهر رسالة: "تم تقديم طلبك"
النظام يسجل "تم التقديم بنجاح"
يحفظ الوظيفة في قائمة الوظائف المُقدم عليها بنجاح
يغلق النافذة

فشل التقديم:

تظهر رسالة: "عذراً، لا يمكنك التقديم"
مع ذكر السبب مثل: "الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب"
النظام يسجل "تم رفض التقديم" مع ذكر السبب
يحفظ الوظيفة في قائمة الوظائف المرفوضة
يحفظ تفاصيل الرفض (اسم الوظيفة، الشركة، السبب، التاريخ، الوقت)
يغلق النافذة

انتهاء المهلة:

إذا لم تظهر أي نافذة خلال 20 ثانية
يسجل "انتهت مهلة انتظار نافذة النتيجة"
يعتبر العملية فاشلة

مرحلة 6: العودة لقائمة الوظائف
هذه المرحلة إجبارية بعد كل تقديم:

النظام يعود لقائمة الوظائف بغض النظر عن نتيجة التقديم
يستخدم التنقل المباشر لضمان العودة
ينتظر 5 ثوانٍ للتأكد من التحميل
يسجل "تم العودة لقائمة الوظائف بنجاح"
يحفظ البيانات في الذاكرة
بعد العودة، يكمل من البطاقة التالية في نفس الصفحة


📄 الانتقال للصفحة التالية
عندما ينتهي النظام من جميع البطاقات في الصفحة الحالية:
فحص وضع التصفح

النظام يقرأ معلومات التصفح في أسفل الصفحة
مثال: "171 الى 180 من 186 عنصر"
يحلل هذه المعلومات ليعرف إذا كانت هناك صفحات أخرى

البحث عن زر الصفحة التالية

يبحث عن زر "الصفحة التالية"
يتأكد أن الزر غير معطل ومرئي

إذا وجد الزر:

يسجل "وجد زر الصفحة التالية"
ينقر على الزر
ينتظر 4 ثوانٍ لتحميل الصفحة الجديدة
يسجل "تم الانتقال للصفحة X"
يبدأ معالجة البطاقات في الصفحة الجديدة من البطاقة الأولى

إذا لم يجد الزر أو كان معطلاً:

يسجل "لا توجد صفحة تالية - انتهت جميع الصفحات"
ينتقل لمرحلة الانتهاء النهائي


📊 عدد البطاقات في كل صفحة
الصفحات العادية:

تحتوي على 10 بطاقات وظيفة بالضبط
النظام يعالجها جميعاً بالتسلسل

الصفحة الأخيرة:

قد تحتوي على 10 بطاقات أو أقل
حسب العدد المتبقي من الوظائف
مثال: إذا كان المجموع 186 وظيفة، الصفحة الأخيرة ستحتوي على 6 بطاقات فقط


⚠️ معالجة الأخطاء
عندما يحدث خطأ تقني في النظام:
إعادة تحميل الصفحة

النظام يعيد تحميل الصفحة الحالية
ينتظر 5 ثوانٍ للتحميل
يسجل "إعادة تحميل الصفحة بسبب الخطأ"

فحص الوضع بعد إعادة التحميل
إذا أصبح في صفحة تفاصيل:

يسجل "نحن في صفحة تفاصيل - العودة للقائمة"
يعود لقائمة الوظائف

إذا أصبح في صفحة قائمة الوظائف:

يسجل "نحن في قائمة الوظائف - انتظار 3 ثوانٍ ثم المتابعة"
ينتظر 3 ثوانٍ ثم يكمل المعالجة
يبدأ من البطاقة الأولى في الصفحة الحالية
لكن سيتجنب الوظائف المزارة من الذاكرة

إذا أصبح في صفحة غير معروفة:

يسجل "صفحة غير معروفة - إيقاف العمل نهائياً"
يحفظ البيانات
يوقف العمل

فشل العثور على الأزرار
إذا فشل النظام في العثور على أزرار التقديم بعد محاولتين:

يسجل "انتهت جميع المحاولات للعثور على الأزرار المطلوبة"
يحفظ البيانات قبل التوقف
يوقف العمل نهائياً
يعرض رسالة خطأ في console فقط


🔄 الإيقاف المؤقت والنهائي
الإيقاف المؤقت (Pause)
عند الإيقاف:

النظام يحفظ الموقع الحالي (رقم الصفحة ورقم البطاقة)
مثال: صفحة 5، بطاقة 7
يسجل "إيقاف مؤقت - حفظ الموقع الحالي"
يحفظ هذه المعلومات في ذاكرة المتصفح

عند الاستئناف:

النظام يقرأ الموقع المحفوظ
يسجل "استئناف من الإيقاف المؤقت"
يعود لنفس الصفحة ونفس البطاقة التي توقف عندها
يكمل المعالجة من حيث توقف

الإيقاف النهائي (Stop)
عند الإيقاف:

النظام لا يحفظ الموقع الحالي
يسجل "إيقاف نهائي - عدم حفظ الموقع"
يحفظ فقط البيانات النهائية (الإحصائيات والذاكرة)
يمسح أي بيانات إيقاف مؤقت موجودة

عند البدء من جديد:

يبدأ من البطاقة الأولى في الصفحة الحالية
يسجل "بدء جديد - من البطاقة الأولى في الصفحة الحالية"
لكن سيتجنب الوظائف الموجودة في الذاكرة
يسجل "سيتم تجنب X وظيفة مزارة من الذاكرة"


🏁 الانتهاء النهائي
عندما ينتهي النظام من آخر وظيفة في آخر صفحة:
العودة الأخيرة

إذا كان في صفحة تفاصيل الوظيفة الأخيرة
يعود لقائمة الوظائف كالمعتاد
يسجل "العودة لقائمة الوظائف للمرة الأخيرة"

إصدار الصوت

النظام يصدر صوت تنبيه بسيط
يسجل "إصدار صوت التنبيه"

عرض الرسالة النهائية
النظام يعرض رسالة تحتوي على:

"تم الانتهاء من جميع الوظائف المتاحة"
إجمالي الوظائف المزارة
عدد الوظائف المُقدم عليها بنجاح
"يمكنك الآن استخراج التقرير"

إتاحة التقرير

النظام يفعل زر استخراج التقرير
يسجل "التقرير جاهز للاستخراج"


📊 محتويات التقرير القابل للتصدير
التقرير يحتوي على أربعة أقسام رئيسية:
القسم الأول: الوظائف المُقدم عليها بنجاح
لكل وظيفة:

اسم الوظيفة
اسم الشركة
تاريخ ووقت التقديم
حالة: "تم التقديم بنجاح"

القسم الثاني: الوظائف المُقدم عليها مسبقاً
لكل وظيفة:

اسم الوظيفة
اسم الشركة
حالة: "مُقدم عليها مسبقاً"

القسم الثالث: الوظائف المرفوضة مع التفاصيل
لكل وظيفة مرفوضة:

اسم الوظيفة
اسم الشركة
سبب الرفض التفصيلي
تاريخ ووقت الرفض

القسم الرابع: الإحصائيات الشاملة

إجمالي الوظائف المُقدم عليها بنجاح
إجمالي الوظائف المرفوضة
إجمالي الوظائف المتخطاة
إجمالي الوظائف المُقدم عليها مسبقاً
معدل نجاح التقديم (نسبة مئوية)
متوسط الوقت لكل وظيفة
الوقت الإجمالي للعملية
تاريخ ووقت بدء وانتهاء العملية


🧠 إدارة الذاكرة
النظام يحتفظ بثلاث قوائم في ذاكرة المتصفح:
قائمة الوظائف المزارة

تحتوي على جميع الوظائف التي زارها النظام
لا يعود لزيارتها مرة أخرى
تبقى محفوظة حتى يقوم المستخدم بمسحها يدوياً

قائمة الوظائف المُقدم عليها

تحتوي على الوظائف المُقدم عليها بنجاح
والوظائف المُقدم عليها مسبقاً
لا يعيد التقديم عليها

قائمة الوظائف المرفوضة

تحتوي على الوظائف التي تم رفض التقديم عليها
لا يعيد التقديم عليها حتى لو تغيرت خبرة المستخدم
تبقى محفوظة حتى يقوم المستخدم بمسحها يدوياً

حفظ البيانات

البيانات تُحفظ بعد كل عملية تقديم
تُحفظ كل 3 بطاقات كإجراء احترازي
تُحفظ عند أي خطأ أو إيقاف


📝 رسائل Console المفصلة
النظام يسجل رسالة في console لكل خطوة يقوم بها:
رسائل الفحص

"فحص نوع الصفحة الحالية"
"محاولة X من Y للعثور على البطاقات"
"فحص الرابط X من Y"

رسائل النجاح

"تم العثور على X بطاقة وظيفة"
"تم التقديم بنجاح"
"تم العودة لقائمة الوظائف بنجاح"

رسائل التخطي

"وجدت أيقونة تم التقدم في البطاقة - تخطي"
"هذه الوظيفة مزارة من الذاكرة - تخطي"
"مرفوضة من الذاكرة - تخطي نهائياً"

رسائل الأخطاء

"فشل في تحميل صفحة التفاصيل"
"انتهت مهلة انتظار نافذة النتيجة"
"لا يوجد زر مناسب - العودة للقائمة"

قاعدة مهمة

لا يتم مسح أو تنظيف رسائل console أبداً
جميع الرسائل تبقى لمساعدة في تشخيص أي مشاكل
كل رسالة تحتوي على الوقت والتصنيف والتفاصيل


🎯 سيناريوهات عملية شاملة
سيناريو 1: جلسة عادية

المستخدم يبدأ النظام وهو في صفحة قائمة الوظائف الصفحة 1
النظام يجد 10 بطاقات في الصفحة الأولى
البطاقة الأولى: "مطور ويب" - وظيفة جديدة - ينقر عليها - يقدم - نجح التقديم - يعود للقائمة
البطاقة الثانية: "محاسب" - وظيفة جديدة - ينقر عليها - يقدم - تم الرفض - يعود للقائمة
البطاقة الثالثة: "مهندس" - يوجد أيقونة "تم التقدم" - يتخطاها بدون نقر
يكمل باقي البطاقات...
ينتهي من الصفحة الأولى - ينتقل للصفحة الثانية
يكرر نفس العملية حتى آخر صفحة
ينتهي - يصدر صوت - يعرض النتائج - يفعل زر التقرير

سيناريو 2: إيقاف مؤقت واستئناف

النظام يعمل في الصفحة 3، البطاقة 6
المستخدم يضغط إيقاف مؤقت
النظام يحفظ الموقع: صفحة 3، بطاقة 6
بعد ساعة، المستخدم يضغط استئناف
النظام يعود لصفحة 3، البطاقة 6
يكمل من حي
يكمل من حيث توقف بالضبط - البطاقة 6 في الصفحة 3
7. يعالج البطاقة 6، ثم 7، ثم 8، حتى ينتهي من الصفحة 3
8. ينتقل للصفحة 4 ويكمل العمل طبيعياً
سيناريو 3: إيقاف نهائي وإعادة بدء

النظام يعمل في الصفحة 5، البطاقة 8
المستخدم يضغط إيقاف نهائي
النظام لا يحفظ الموقع، يحفظ فقط الذاكرة والإحصائيات
في اليوم التالي، المستخدم في الصفحة 7 ويريد البدء
النظام يبدأ من البطاقة الأولى في الصفحة 7
لكن يتجنب الوظائف المحفوظة في الذاكرة من الجلسة السابقة
مثلاً: البطاقة 1 في الصفحة 7 كانت مزارة مسبقاً - يتخطاها
البطاقة 2 جديدة - يعالجها

سيناريو 4: حدوث خطأ تقني

النظام في الصفحة 4، البطاقة 3
ينقر على رابط الوظيفة
تحدث مشكلة في الشبكة - لا تُحمل صفحة التفاصيل
النظام ينتظر 15 ثانية - لا تُحمل
يعيد تحميل الصفحة
يجد نفسه في صفحة قائمة الوظائف
يبدأ من البطاقة الأولى في الصفحة 4
يتجنب البطاقات 1 و 2 لأنها في الذاكرة
يعالج البطاقة 3 مرة أخرى

سيناريو 5: آخر صفحة بعدد أقل من البطاقات

النظام وصل للصفحة 19 (آخر صفحة)
هذه الصفحة تحتوي على 6 بطاقات فقط (من 181 إلى 186)
يعالج البطاقات 1، 2، 3، 4، 5 عادي
البطاقة 6 (الأخيرة): ينقر عليها - يقدم - نجح التقديم - يعود للقائمة
ينتهي من البطاقة 6 - يبحث عن الصفحة التالية
لا يجد زر "الصفحة التالية" أو الزر معطل
يدرك أنه انتهى من جميع الوظائف
يصدر صوت التنبيه
يعرض رسالة الانتهاء مع الإحصائيات

سيناريو 6: وظيفة لا تحتوي على أزرار

النظام ينقر على وظيفة جديدة
يصل لصفحة التفاصيل
لا يجد زر "تقديم" ولا زر "استعراض طلب التقديم"
يحاول البحث عن الأزرار مرتين
لا يجد أي زر مناسب
يسجل "لا يوجد زر مناسب"
يعود لقائمة الوظائف
ينتقل للبطاقة التالية

سيناريو 7: فشل العثور على الأزرار نهائياً

النظام يواجه مشكلة تقنية في موقع جدارات
لا يستطيع العثور على أزرار التقديم في عدة وظائف متتالية
بعد المحاولة الثانية للعثور على الأزرار
يسجل "انتهت جميع المحاولات للعثور على الأزرار المطلوبة"
يحفظ جميع البيانات التي جمعها حتى الآن
يوقف العمل نهائياً
يعرض رسالة خطأ في console


🔧 الفروق المهمة والتوضيحات
الفرق بين العودة للخلف والعودة للوراء
العودة للخلف (مسموحة ومطلوبة):

بعد كل تقديم، النظام يعود من صفحة التفاصيل لقائمة الوظائف
هذا جزء أساسي من عملية النظام

العودة للوراء (غير مسموحة):

النظام لا يعود لبطاقة سابقة في نفس الصفحة
لا يعود لصفحة سابقة
الاتجاه العام للأمام: بطاقة تلو بطاقة، صفحة تلو صفحة

الفرق بين الإيقاف المؤقت والنهائي
الإيقاف المؤقت:

يحفظ الموقع الدقيق (صفحة + بطاقة)
عند الاستئناف، يكمل من نفس النقطة
مفيد للراحة أو انقطاع مؤقت

الإيقاف النهائي:

لا يحفظ الموقع
عند البدء من جديد، يبدأ من البطاقة الأولى في الصفحة الحالية
لكن يتجنب الوظائف المحفوظة في الذاكرة

حفظ البيانات وتوقيته
الحفظ الفوري:

بعد كل نتيجة تقديم (نجح/رفض)
عند اكتشاف وظيفة "تم التقدم عليها"
عند أي خطأ قبل محاولة الإصلاح

الحفظ الدوري:

كل 3 بطاقات كإجراء احترازي
عند الإيقاف (مؤقت أو نهائي)
عند انتهاء كل صفحة

الذاكرة والتخطي
قواعد التخطي:

أي وظيفة في قائمة الوظائف المزارة = تخطي
أي وظيفة في قائمة الوظائف المُقدم عليها = تخطي
أي وظيفة في قائمة الوظائف المرفوضة = تخطي نهائي (حتى لو تغيرت الخبرة)
أي وظيفة بها أيقونة "تم التقدم" في البطاقة = تخطي + إضافة للقائمة

استمرارية الذاكرة:

البيانات تبقى محفوظة بين الجلسات
لا تُمسح إلا بأمر المستخدم من زر مسح البيانات
تساعد في تجنب إعادة معالجة نفس الوظائف


📊 التوقيتات والانتظار
الانتظار بين البطاقات

وقت ثابت: 3 ثوانٍ
وقت عشوائي إضافي: 0-2 ثانية
إجمالي: 3-5 ثوانٍ بين كل بطاقة والتي تليها
الهدف: تجنب الحمل الزائد على الموقع

انتظار تحميل الصفحات

صفحة قائمة الوظائف: حتى 30 ثانية (20 محاولة × 1.5 ثانية)
صفحة تفاصيل الوظيفة: حتى 15 ثانية (15 محاولة × 1 ثانية)
نافذة التأكيد: حتى 10 ثوانٍ
نافذة النتيجة: حتى 20 ثانية

التأخير بعد الأحداث

بعد النقر على رابط الوظيفة: ثانيتان
بعد النقر على زر التقديم: ثانيتان
بعد النقر على زر التأكيد: 3 ثوانٍ
بعد الانتقال لصفحة جديدة: 4-5 ثوانٍ
بعد العودة لقائمة الوظائف: 5 ثوانٍ


🎯 الهدف النهائي للنظام
النظام مصمم لتحقيق الأهداف التالية:
الكفاءة

معالجة أكبر عدد من الوظائف في أقل وقت ممكن
تجنب إعادة معالجة الوظائف المُعالجة مسبقاً
العمل بشكل مستمر دون تدخل المستخدم

الدقة

استخراج بيانات دقيقة من كل وظيفة
تسجيل أسباب الرفض التفصيلية
حفظ جميع الإحصائيات بدقة

الموثوقية

التعافي من الأخطاء التقنية تلقائياً
حفظ البيانات باستمرار لتجنب فقدانها
توفير معلومات تشخيصية مفصلة

سهولة الاستخدام

عمل تلقائي بالكامل بعد البدء
إمكانية الإيقاف والاستئناف
تقرير مفصل قابل للتصدير

هذا هو الوصف النصي الكامل والدقيق لنظام جدارات أوتو بجميع تفاصيله وحالاته وسيناريوهاته المحتملة. النظام مصمم ليكون ذكياً وموثوقاً وفعالاً في أتمتة عملية التقديم على الوظائف في موقع جدارات السعودي



📋 وصف العناصر المستخرجة من HTML موقع جدارات
🎯 نظرة عامة
هذه العناصر مستخرجة من HTML موقع جدارات وتمثل جميع المكونات الأساسية التي يحتاجها نظام جدارات أوتو للتنقل والتفاعل مع الموقع. البيانات المذكورة (مثل أسماء الشركات والوظائف) هي أمثلة فقط وقد تختلف في الواقع.



 بطاقة وظيفة عادية (لم يتم التقديم عليها):
html<span data-expression="" class="heading4 OSFillParent">أخصائي تدريب وتطوير موارد بشرية</span>
<span data-expression="">معهد الفاو المتقدم العالي للتدريب</span>
<span data-expression="">الرياض</span>
<span data-expression="">%90</span>
<span data-expression="">21/04/2025</span>
 بطاقة وظيفة مُقدم عليها:
html<img src="/Jadarat/img/UEP_Resources.tickcircle.svg">
<span class="text-primary">تم التقدم</span>
 صفحة تفاصيل الوظيفة:
html<button data-button="" class="btn btn-primary btn-small">تقديم</button>
<!-- أو -->
<button data-button="" class="btn btn-primary btn-small">استعراض طلب التقديم</button>
 النوافذ المنبثقة:
html<!-- نافذة التأكيد -->
<span class="heading6">هل أنت متأكد من التقديم على وظيفة أخصائي تدريب وتطوير موارد بشرية ؟</span>
<button data-button="" class="btn-primary btn">تقديم</button>

<!-- نافذة الرفض -->
<span class="heading6">عذراً ، لا يمكنك التقديم</span>
<span data-expression="">أنت غير مؤهل لهذه الوظيفة، الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب</span>



 هيكل بطاقة الوظيفة الكاملة:
html<!-- الحاوي الرئيسي لكل بطاقة -->
<div data-container="">
  <!-- اسم الشركة -->
  <a data-link="" href="#"><span data-expression="">شركة مفروشات العبداللطيف</span></a>
  
  <!-- رابط الوظيفة والعنوان -->
  <a data-link="" href="/Jadarat/JobDetails?...Param=...">
    <span data-expression="" class="heading4 OSFillParent">كاتب موارد بشرية</span>
  </a>
  
  <!-- نسبة التوافق -->
  <span data-expression="" class="matching_score OSFillParent">%63</span>
  
  <!-- المدينة -->
  <div class="osui-tooltip__content">
    <span data-expression="">الرياض</span>
  </div>
  
  <!-- عدد الوظائف المتاحة -->
  <span data-expression="" class="font-bold font-size-base OSFillParent">1</span>
  
  <!-- تاريخ النشر -->
  <span data-expression="" class="font-bold font-size-base OSFillParent">13/07/2025</span>
  
  <!-- أيقونة التقديم المسبق (إن وجدت) -->
  <img src="/Jadarat/img/UEP_Resources.tickcircle.svg">
  <span class="text-primary">تم التقدم</span>
</div>
 نظام التصفح:
html<!-- عداد الصفحات -->
<div class="pagination-counter">
  <span data-expression="">41</span> الى 
  <span data-expression="">50</span> من 
  <span data-expression="">181</span> عنصر
</div>

<!-- أزرار التنقل -->
<button data-button="" aria-label="go to previous page">
<button data-button="" aria-label="go to next page">
<button data-button="" aria-label="page 19, is last page">

<!-- الصفحة الحالية -->
<input type="number" value="5"> of <span data-expression="">19</span> صفحة

 أزرار صفحة التفاصيل:
html<!-- زر التقديم (وظيفة جديدة) -->
<button data-button="" class="btn btn-primary btn-small auto-width OSFillParent">تقديم</button>

<!-- زر الاستعراض (مُقدم مسبقاً) -->
<button data-button="" class="btn btn-primary btn-small auto-width OSFillParent">استعراض طلب التقديم</button>
 نافذة التأكيد:
html<div data-popup="" class="popup-dialog" role="dialog" id="ApplyConfirmationMessage">
  <span class="heading6">هل أنت متأكد من التقديم على وظيفة كاتب موارد بشرية ؟</span>
  <button data-button="" class="btn-primary btn">تقديم</button>
  <button data-button="" class="btn">إغلاق</button>
</div>
 نافذة النجاح:
html<div data-popup="" class="popup-dialog" role="dialog" id="AppliedSuccess">
  <i class="icon icon-hrdf-circle-tick fa fa-check fa-2x"></i>
  <span class="heading6">تم التقديم بنجاح</span>
  <span>عزيزي المستفيد تم تقديم طلبكم للفرصة الوظيفيّة...</span>
  <button data-button="" class="btn-primary btn">اغلاق</button>
</div>
 نافذة الرفض:
html<div data-popup="" class="popup-dialog" role="dialog" id="AppliedFailed">
  <i class="icon icon-hrdf-circle-x fa fa-times-circle-o fa-2x"></i>
  <span class="heading6">عذراً ، لا يمكنك التقديم</span>
  <span>أنت غير مؤهل لهذه الوظيفة، الملف الشخصي لا يطابق شرط المؤهل التعليمي المطلوب</span>
  <button data-button="" class="btn-primary btn">إغلاق</button>
</div>

 العنصر المميز الوحيد لصفحة التفاصيل:
html<!-- هذا العنصر يظهر فقط في صفحة تفاصيل الوظيفة -->
<div data-container="" class="columns columns-small-right gutter-base tablet-break-all phone-break-all display-flex align-items-center">

  
  <!-- عنوان الوظيفة -->
  <span data-expression="" class="heading5">أخصائي تدريب وتطوير موارد بشرية</span>
  
  <!-- نسبة التوافق -->
  <span data-expression="" class="matching_score OSFillParent">%90</span>
  
  <!-- اسم الشركة -->
  <span data-expression="">معهد الفاو المتقدم العالي للتدريب</span>
  
  <!-- تاريخ نهاية الإعلان -->
  <span class="gray-l-color font-400">تاريخ نهاية الإعلان:</span>
  <span data-expression="" class="gray-l-color font-400">20/07/2025</span>
  
  <!-- زر التقديم أو الاستعراض -->
  <button data-button="" class="btn btn-primary btn-small auto-width OSFillParent">تقديم</button>
</div>
 مؤشر اكتمال التحميل:
html<!-- هذا الكلاس يظهر بعد اكتمال تحميل الصفحة -->
<html class="desktop landscape windows is-rtl" style="--footer-height: 186px;">

مؤشرات آخر صفحة:
html<!-- عداد الصفحات يظهر نفس الرقم 3 مرات -->
<span data-expression="">181</span> الى 
<span data-expression="">181</span> من 
<span data-expression="">181</span> عنصر

<!-- الصفحة الحالية -->
<input type="number" value="19"> of <span data-expression="">19</span> صفحة

<!-- زر "التالي" معطل -->
<button data-button="" class="pagination-button" type="button" disabled="" aria-label="go to next page">

<!-- الزر الحالي يحمل تسمية خاصة -->
<button data-button="" class="pagination-button is--active" aria-label="page 19, current page, is last page">
 وظيفة واحدة فقط:
html<!-- وظيفة واحدة: "مدير عمليات موارد بشرية" -->
<span data-expression="" class="heading4 OSFillParent">مدير عمليات موارد بشرية</span>
<!-- شركة: "شركة صالح هادي صالح ال حيدر وشريكه" -->
<span data-expression="">شركة صالح هادي صالح ال حيدر وشريكه</span>
