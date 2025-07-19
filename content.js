console.log('🛡️ [JadaratAuto] content.js loaded');
if (window.JadaratAutoStable) {
    console.log("JadaratAutoStable is already running.");
} else {
    console.log('🚀 [JadaratAuto] Initializing JadaratAutoStable...');
    class JadaratAutoStable {
        constructor() {
            this.stats = {
                applied: 0,
                alreadyApplied: 0,
                rejected: 0,
                skipped: 0,
                fromMemory: 0,
                total: 0,
                errors: 0
            };
            this.visitedJobs = new Set();
            this.appliedJobs = new Set();
            this.rejectedJobs = new Set();
            this.shouldStop = false;
            this.isPaused = false;
            this.currentCardIndex = 0;
            this.currentPage = 1;

            this.init();
        }

        async init() {
            // Main loop
            while (!this.shouldStop) {
                console.log("🔍 [DETECT] Checking current page type...");

                const pageType = this.detectPageType();

                if (pageType === 'home') {
                    console.log("🏠 [HOME] You are on the home page - navigating to job list");
                    await this.navigateToJobList();

                } else if (pageType === 'jobDetails') {
                    console.log("📄 [DETAILS] You are on a job details page - returning to job list");
                    await this.goBackToJobList();

                } else if (pageType === 'jobList') {
                    console.log("📋 [LIST] You are on the job list - starting processing");
                    const hasMoreJobs = await this.processJobListPage();

                    if (!hasMoreJobs) {
                        console.log("📄 [PAGINATION] No more cards on this page - looking for next page");
                        const movedToNext = await this.moveToNextPage();
                        if (!movedToNext) {
                            console.log("🏁 [FINAL] All pages finished - stopping");
                            break;
                        }
                    }

                } else {
                    console.log("❌ [UNKNOWN] Unknown page type - stopping");
                    break;
                }
            }
        }

        detectPageType() {
            const url = window.location.href;
            if (url.includes("JobDetails")) {
                return 'jobDetails';
            } else if (url.includes("ExploreJobs")) {
                return 'jobList';
            } else {
                return 'home';
            }
        }

        async navigateToJobList() {
            const jobListUrl = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
            window.location.href = jobListUrl;
            await this.wait(5000);
        }

        async goBackToJobList() {
            console.log("🔙 [RETURN] Returning to job list...");
            const jobListUrl = 'https://jadarat.sa/Jadarat/ExploreJobs?JobTab=1';
            console.log(`🔄 [NAVIGATE] Navigating directly to: ${jobListUrl}`);
            window.location.href = jobListUrl;
            await this.wait(5000); // Wait for page to load
            console.log("✅ [RETURN_SUCCESS] Successfully returned to job list");
        }

        async processJobListPage() {
            console.log("⏳ [LOADING] Waiting for job cards to load...");

            let jobCards = [];
            for (let attempt = 1; attempt <= 20; attempt++) {
                console.log(`🔍 [SCAN] Attempt ${attempt}/20 to find cards`);
                jobCards = this.getAllJobCards();
                if (jobCards.length > 0) {
                    console.log(`✅ [FOUND] Found ${jobCards.length} job cards`);
                    break;
                }
                await this.wait(1500);
            }

            if (jobCards.length === 0) {
                console.log("⚠️ [EMPTY] No cards on this page - moving to next page");
                return false;
            }

            for (let i = this.currentCardIndex; i < jobCards.length; i++) {
                if (this.shouldStop) break;

                this.currentCardIndex = i;
                console.log(`\n🎯 [CARD] Processing card ${i + 1}/${jobCards.length}`);

                await this.processIndividualJob(jobCards[i]);

                if (i < jobCards.length - 1) {
                    const delayTime = 3000 + (Math.random() * 2000);
                    console.log(`⏳ [DELAY] Waiting ${Math.round(delayTime / 1000)} seconds before next card`);
                    await this.wait(delayTime);
                }

                if ((i + 1) % 3 === 0) {
                    console.log("💾 [SAVE] Saving data every 3 cards");
                    await this.saveMemoryData();
                }
            }
            this.currentCardIndex = 0;
            return false;
        }

        getAllJobCards() {
            return Array.from(document.querySelectorAll('div[data-container] a[data-link][href*="/Jadarat/JobDetails"]'));
        }

        async processIndividualJob(jobCardElement) {
            console.log("🔬 [EXTRACT] Extracting card data...");
            const jobData = this.extractJobDataFromElement(jobCardElement);

            if (jobData.alreadyApplied) {
                console.log("✅ [APPLIED_CARD] Found 'Applied' icon on card - skipping");
                this.appliedJobs.add(jobData.id);
                this.stats.alreadyApplied++;
                await this.saveMemoryData();
                return 'already_applied_list';
            }

            if (this.visitedJobs.has(jobData.id)) {
                console.log("🔄 [MEMORY] This job has been visited from memory - skipping");
                this.stats.fromMemory++;
                this.stats.skipped++;
                return 'visited_from_memory';
            }

            if (this.appliedJobs.has(jobData.id)) {
                console.log("✅ [MEMORY] Applied from memory - skipping");
                this.stats.fromMemory++;
                this.stats.alreadyApplied++;
                return 'applied_from_memory';
            }

            if (this.rejectedJobs.has(jobData.id)) {
                console.log("❌ [MEMORY] Rejected from memory - skipping permanently");
                this.stats.fromMemory++;
                this.stats.rejected++;
                return 'rejected_from_memory';
            }

            console.log("🆕 [NEW] New job - starting full processing");
            const result = await this.processNewJob(jobData);

            this.visitedJobs.add(jobData.id);
            this.stats.total++;

            return result;
        }

        extractJobDataFromElement(jobCardElement) {
            const jobCardContainer = jobCardElement.closest('div[data-container]');
            const jobTitleElement = jobCardContainer.querySelector('span.heading4');
            const companyElement = jobCardContainer.querySelector('a[data-link] > span');
            const locationElement = jobCardContainer.querySelector('.osui-tooltip__content span');
            const matchingScoreElement = jobCardContainer.querySelector('span.matching_score');
            const publishDateElement = jobCardContainer.querySelector('.font-bold.font-size-base');
            const alreadyAppliedElement = jobCardContainer.querySelector('img[src*="tickcircle.svg"]');

            const jobData = {
                id: jobCardElement.href,
                element: jobCardElement,
                title: jobTitleElement ? jobTitleElement.innerText.trim() : 'N/A',
                company: companyElement ? companyElement.innerText.trim() : 'N/A',
                location: locationElement ? locationElement.innerText.trim() : 'N/A',
                matchingScore: matchingScoreElement ? matchingScoreElement.innerText.trim() : 'N/A',
                publishDate: publishDateElement ? publishDateElement.innerText.trim() : 'N/A',
                alreadyApplied: !!alreadyAppliedElement,
            };
            console.log(`📝 [DATA] Title: "${jobData.title}"`);
            console.log(`🏢 [DATA] Company: "${jobData.company}"`);
            console.log(`📍 [DATA] Location: "${jobData.location}"`);
            console.log(`📊 [DATA] Matching: "${jobData.matchingScore || 'Not specified'}"`);
            console.log(`📅 [DATA] Date: "${jobData.publishDate || 'Not specified'}"`);

            return jobData;
        }


        async processNewJob(jobData) {
            try {
                console.log("🖱️ [CLICK] Clicking job link...");
                await this.clickElementSafely(jobData.element);

                console.log("⏳ [NAVIGATION] Waiting for details page to load...");
                const navigationSuccess = await this.waitForNavigationToDetails();

                if (!navigationSuccess) {
                    console.log("❌ [NAV_FAILED] Failed to load details page");
                    this.stats.errors++;
                    await this.handleError();
                    return 'navigation_failed';
                }

                console.log("✅ [NAV_SUCCESS] Successfully loaded details page");

                console.log("🗑️ [POPUP] Checking and closing popups...");
                await this.handleAnyPopups();

                console.log("🔍 [BUTTON] Looking for application buttons...");
                const buttonCheck = await this.checkButtonsInDetails();

                if (buttonCheck.type === 'already_applied') {
                    console.log("✅ [APPLIED_DETAILS] Found 'Review Application' button - already applied");
                    this.appliedJobs.add(jobData.id);
                    this.stats.alreadyApplied++;
                    await this.saveMemoryData();
                    await this.goBackToJobList();
                    return 'already_applied_details';
                }

                if (buttonCheck.type === 'can_apply') {
                    console.log("🎯 [CAN_APPLY] Found 'Apply' button - starting application process");
                    const applicationResult = await this.attemptApplication();

                    if (applicationResult.success) {
                        console.log("🎉 [SUCCESS] Application successful!");
                        this.appliedJobs.add(jobData.id);
                        this.stats.applied++;
                    } else {
                        console.log(`❌ [REJECTED] Application rejected: ${applicationResult.reason}`);
                        this.rejectedJobs.add(jobData.id);
                        this.stats.rejected++;
                        await this.saveRejectionData(jobData, applicationResult.reason);
                    }

                    await this.saveMemoryData();
                    await this.goBackToJobList();
                    return applicationResult.success ? 'applied_success' : 'applied_rejected';
                }

                if (buttonCheck.type === 'no_button') {
                    console.log("⚠️ [NO_BUTTON] No suitable button found - returning to list");
                    await this.goBackToJobList();
                    return 'no_suitable_button';
                }

            } catch (error) {
                console.log(`❌ [ERROR] Error processing job: ${error.message}`);
                this.stats.errors++;
                await this.handleError();
                return 'error';
            }
        }

        async clickElementSafely(element) {
            for (let i = 1; i <= 4; i++) {
                try {
                    console.log(`Trying click method ${i} of 4`);
                    switch (i) {
                        case 1:
                            element.click();
                            break;
                        case 2:
                            element.dispatchEvent(new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            }));
                            break;
                        case 3:
                            element.focus();
                            element.click();
                            break;
                        case 4:
                            window.location.href = element.href;
                            break;
                    }
                    return;
                } catch (e) {
                    console.error(`Click method ${i} failed`, e);
                }
            }
        }

        async waitForNavigationToDetails() {
            for (let i = 0; i < 15; i++) {
                await this.wait(1000);
                if (document.querySelector('div[data-container*="columns-small-right"]')) {
                    return true;
                }
            }
            return false;
        }

        async handleAnyPopups() {
            const popups = document.querySelectorAll('div[data-popup][role="dialog"]');
            for (const popup of popups) {
                if (popup.style.display !== 'none') {
                    const closeButton = popup.querySelector('button.btn');
                    if (closeButton) {
                        await this.clickElementSafely(closeButton);
                    }
                }
            }
        }

        async checkButtonsInDetails() {
            const applyButton = document.querySelector('button.btn-primary:not(:disabled)');
            if (applyButton) {
                if (applyButton.innerText.includes('استعراض طلب التقديم')) {
                    return {
                        type: 'already_applied'
                    };
                }
                if (applyButton.innerText.includes('تقديم')) {
                    return {
                        type: 'can_apply'
                    };
                }
            }
            return {
                type: 'no_button'
            };
        }

        async attemptApplication() {
            // 1. Click "Apply" button
            console.log("🖱️ [APPLY] Clicking 'Apply' button...");
            const submitButton = await this.findSubmitButton();
            if(!submitButton) {
                return { success: false, type: 'timeout', reason: 'Submit button not found' };
            }
            await this.clickElementSafely(submitButton);
            await this.wait(2000);

            // 2. Handle confirmation dialog
            console.log("⏳ [CONFIRM] Waiting for confirmation dialog...");
            for (let attempt = 1; attempt <= 10; attempt++) {
                console.log(`🔍 [CONFIRM] Attempt ${attempt}/10 to find confirmation dialog`);
                const confirmDialog = document.querySelector('div[data-popup][role="dialog"]');
                if (confirmDialog && confirmDialog.textContent.includes('هل أنت متأكد')) {
                    console.log("✅ [CONFIRM_FOUND] Found confirmation dialog");
                    const confirmButton = confirmDialog.querySelector('button.btn-primary');
                    if (confirmButton && confirmButton.textContent.trim() === 'تقديم') {
                        console.log("🖱️ [CONFIRM_CLICK] Clicking confirmation button...");
                        await this.clickElementSafely(confirmButton);
                        await this.wait(3000);
                        break;
                    }
                }
                await this.wait(1000);
            }

            // 3. Handle result dialog
            console.log("⏳ [RESULT] Waiting for result dialog...");
            for (let attempt = 1; attempt <= 20; attempt++) {
                console.log(`🔍 [RESULT] Attempt ${attempt}/20 to find result dialog`);
                const resultDialogs = document.querySelectorAll('div[data-popup][role="dialog"]');

                for (const dialog of resultDialogs) {
                    if (dialog.style.display === 'none') continue;

                    const dialogText = dialog.textContent;

                    if (dialogText.includes('تم تقديم طلبك')) {
                        console.log("🎉 [SUCCESS] Application successful!");
                        await this.closeDialog(dialog);
                        return {
                            success: true,
                            type: 'success'
                        };
                    }

                    if (dialogText.includes('عذراً ، لا يمكنك التقديم')) {
                        console.log("❌ [REJECTED] Application rejected");
                        const reason = this.extractRejectionReason(dialogText);
                        console.log(`📝 [REASON] Rejection reason: "${reason}"`);
                        await this.closeDialog(dialog);
                        return {
                            success: false,
                            type: 'rejection',
                            reason: reason
                        };
                    }
                }
                await this.wait(1000);
            }

            console.log("⚠️ [TIMEOUT] Timed out waiting for result dialog");
            return {
                success: false,
                type: 'timeout',
                reason: 'Timeout'
            };
        }

        async findSubmitButton() {
            for (let i = 0; i < 10; i++) {
                const submitButton = document.querySelector('button.btn-primary.btn-small');
                if(submitButton && submitButton.innerText.includes('تقديم')){
                    return submitButton;
                }
                await this.wait(500);
            }
            return null;
        }

        extractRejectionReason(dialogText) {
            const match = dialogText.match(/أنت غير مؤهل لهذه الوظيفة، (.*)/);
            return match ? match[1] : 'Unknown reason';
        }

        async closeDialog(dialog) {
            const closeButton = dialog.querySelector('button.btn-primary');
            if (closeButton) {
                await this.clickElementSafely(closeButton);
            }
        }


        async moveToNextPage() {
            console.log("📄 [NEXT_PAGE] Looking for next page...");

            // Check pagination info
            const paginationInfo = document.querySelector('.pagination-counter');
            if (paginationInfo) {
                const text = paginationInfo.textContent;
                console.log(`📊 [PAGINATION] Pagination info: "${text}"`);
                const match = text.match(/(\d+)\s+الى\s+(\d+)\s+من\s+(\d+)/);
                if (match) {
                    const [_, start, end, total] = match;
                    console.log(`📊 [ANALYSIS] From ${start} to ${end} of ${total} items`);
                    if (parseInt(end) >= parseInt(total)) {
                        console.log("🏁 [LAST_PAGE] This is the last page - all jobs finished");
                        await this.displayFinalResults();
                        return false;
                    }
                }
            }

            // Find next page button
            const nextButtons = document.querySelectorAll('button[aria-label*="go to next page"]');
            for (const button of nextButtons) {
                if (!button.disabled && button.offsetWidth > 0) {
                    console.log("✅ [NEXT_FOUND] Found next page button");
                    this.currentPage++;
                    await this.clickElementSafely(button);
                    await this.wait(4000);
                    await this.waitForPageLoad();
                    console.log(`📄 [NEXT_SUCCESS] Moved to page ${this.currentPage}`);
                    return true;
                }
            }

            console.log("🏁 [NO_NEXT] No next page - all pages finished");
            await this.displayFinalResults();
            return false;
        }

        async waitForPageLoad() {
            // A simple way to wait for page to be "ready"
            await this.wait(2000);
        }

        async handleError() {
            console.log("❌ [ERROR_HANDLER] Starting error handling...");
            console.log("🔄 [RELOAD] Reloading page...");
            window.location.reload();
            await this.wait(5000);
            const pageType = this.detectPageType();
            console.log(`🔍 [POST_RELOAD] Page type after reload: ${pageType}`);

            if (pageType === 'jobDetails') {
                console.log("📄 [RECOVER] We are on a details page - returning to list");
                await this.goBackToJobList();
            } else if (pageType === 'jobList') {
                console.log("📋 [RECOVER] We are on the job list - waiting 3 seconds then continuing");
                await this.wait(3000);
            } else {
                console.log("❌ [FATAL] Unknown page - stopping work permanently");
                await this.saveMemoryData();
                this.stopProcess();
                return false;
            }
            return true;
        }

        async saveMemoryData() {
            const data = {
                visitedJobs: Array.from(this.visitedJobs),
                appliedJobs: Array.from(this.appliedJobs),
                rejectedJobs: Array.from(this.rejectedJobs),
                stats: this.stats
            };
            await chrome.storage.local.set({
                jadaratAutoData: data
            });
        }

        async saveRejectionData(jobData, reason) {
            const rejectionDetails = {
                title: jobData.title,
                company: jobData.company,
                reason: reason,
                date: new Date().toISOString()
            };
            const {
                rejectedJobsData = []
            } = await chrome.storage.local.get('rejectedJobsData');
            rejectedJobsData.push(rejectionDetails);
            await chrome.storage.local.set({
                rejectedJobsData
            });
        }

        async displayFinalResults() {
            console.log("🏁 [FINAL_JOB] Finished last job on last page");
            this.playSimpleNotificationSound();
            const message = `Finished all available jobs.
        Total jobs visited: ${this.visitedJobs.size}
        Successfully applied: ${this.stats.applied}
        You can now export the report.`;
            this.showCompletionMessage(message);
            this.enableExportButton();
        }

        playSimpleNotificationSound() {
            const audio = new Audio(chrome.runtime.getURL("notification.mp3"));
            audio.play();
        }

        showCompletionMessage(message) {
            alert(message);
        }

        enableExportButton() {
            // This would interact with the popup's DOM, which is not directly accessible.
            // We'll send a message to the popup to enable the button.
            chrome.runtime.sendMessage({
                action: "enableExport"
            });
        }

        stopProcess() {
            this.shouldStop = true;
        }

        pauseProcess() {
            this.isPaused = true;
        }

        resumeProcess() {
            this.isPaused = false;
        }


        wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    window.JadaratAutoStable = new JadaratAutoStable();
}
