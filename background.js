// جدارات أوتو - Background Service Worker المُحسن

class JadaratAutoBackground {
    constructor() {
        this.initializeListeners();
    }

    initializeListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle messages from popup and content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Handle tab updates to detect navigation
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });

        // Handle browser action click (if popup is disabled)
        chrome.action.onClicked.addListener((tab) => {
            this.handleActionClick(tab);
        });
    }

    handleInstallation(details) {
        if (details.reason === 'install') {
            // First time installation
            this.setDefaultSettings();
            console.log('جدارات أوتو تم تثبيته بنجاح');
        } else if (details.reason === 'update') {
            // Extension updated
            this.migrateSettings(details.previousVersion);
            console.log(`جدارات أوتو تم تحديثه من ${details.previousVersion} إلى ${chrome.runtime.getManifest().version}`);
        }
    }

    async setDefaultSettings() {
        const defaultSettings = {
            delayTime: 3,
            mode: 'normal',
            soundEnabled: true,
            stats: {
                applied: 0,
                skipped: 0,
                rejected: 0,
                total: 0
            },
            rejectionData: [],
            isFirstRun: true
        };

        try {
            await chrome.storage.local.set(defaultSettings);
        } catch (error) {
            console.error('Error setting default settings:', error);
        }
    }

    async migrateSettings(previousVersion) {
        try {
            const currentSettings = await chrome.storage.local.get();
            
            // Add any new settings that might be missing
            const updatedSettings = {
                ...currentSettings,
                version: chrome.runtime.getManifest().version
            };

            // Add rejection data array if not exists
            if (!updatedSettings.rejectionData) {
                updatedSettings.rejectionData = [];
            }

            // Add rejected stat if not exists
            if (updatedSettings.stats && !updatedSettings.stats.rejected) {
                updatedSettings.stats.rejected = 0;
            }

            await chrome.storage.local.set(updatedSettings);
        } catch (error) {
            console.error('Error migrating settings:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'GET_EXTENSION_STATUS':
                    sendResponse({ status: 'active', version: chrome.runtime.getManifest().version });
                    break;

                case 'CREATE_NOTIFICATION':
                    await this.createNotification(message.options);
                    break;

                case 'LOG_ACTIVITY':
                    await this.logActivity(message.activity);
                    break;

                case 'SAVE_REJECTION_DATA':
                    await this.saveRejectionData(message.rejectionData);
                    break;

                case 'GET_REJECTION_DATA':
                    const rejectionData = await this.getRejectionData();
                    sendResponse({ rejectionData });
                    break;

                case 'EXPORT_REJECTION_DATA':
                    const exportData = await this.exportRejectionDataToCSV();
                    sendResponse({ exportData });
                    break;

                case 'CLEAR_REJECTION_DATA':
                    await this.clearRejectionData();
                    sendResponse({ success: true });
                    break;

                case 'CHECK_PERMISSIONS':
                    const hasPermissions = await this.checkPermissions();
                    sendResponse({ hasPermissions });
                    break;
case 'CLEAR_REJECTED_JOBS':
    await chrome.storage.local.remove(['rejectedJobs']);
    sendResponse({ success: true });
    break;

case 'GET_REJECTED_COUNT':
    const rejectedJobs = await chrome.storage.local.get(['rejectedJobs']);
    const count = rejectedJobs.rejectedJobs ? rejectedJobs.rejectedJobs.length : 0;
    sendResponse({ count });
    break;
    
                default:
                    // Forward message to appropriate tab
                    if (sender.tab) {
                        this.forwardMessageToPopup(message, sender.tab.id);
                    }
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    async saveRejectionData(rejectionData) {
        try {
            console.log('حفظ بيانات الرفض:', rejectionData);
            
            // Get existing rejection data
            const result = await chrome.storage.local.get(['rejectionData']);
            const existingData = result.rejectionData || [];
            
            // Add new rejection data
            existingData.push(rejectionData);
            
            // Keep only last 1000 rejections to prevent storage bloat
            if (existingData.length > 1000) {
                existingData.splice(0, existingData.length - 1000);
            }
            
            // Save back to storage
            await chrome.storage.local.set({ rejectionData: existingData });
            
            console.log(`تم حفظ بيانات الرفض. إجمالي الرفض: ${existingData.length}`);
            
        } catch (error) {
            console.error('Error saving rejection data:', error);
        }
    }

    async getRejectionData() {
        try {
            const result = await chrome.storage.local.get(['rejectionData']);
            return result.rejectionData || [];
        } catch (error) {
            console.error('Error getting rejection data:', error);
            return [];
        }
    }

    async exportRejectionDataToCSV() {
        try {
            const rejectionData = await this.getRejectionData();
            
            if (rejectionData.length === 0) {
                return { success: false, message: 'لا توجد بيانات رفض للتصدير' };
            }
            
            // Create CSV header
            const csvHeader = 'التاريخ,الوقت,عنوان الوظيفة,سبب الرفض\n';
            
            // Create CSV content
            const csvContent = rejectionData.map(item => {
                return `"${item.date}","${item.time}","${item.jobTitle}","${item.reason}"`;
            }).join('\n');
            
            const fullCSV = csvHeader + csvContent;
            
            // Create blob and download URL
            // Create blob and download URL
// Create blob and download URL
const blob = new Blob(['\ufeff' + fullCSV], { type: 'text/csv;charset=utf-8;' });
const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + fullCSV);            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `jadarat_rejections_${timestamp}.csv`;
            
            return {
                success: true,
                url: url,
                filename: filename,
                count: rejectionData.length
            };
            
        } catch (error) {
            console.error('Error exporting rejection data:', error);
            return { success: false, message: 'خطأ في تصدير البيانات' };
        }
    }

    async clearRejectionData() {
        try {
            await chrome.storage.local.set({ rejectionData: [] });
            console.log('تم مسح بيانات الرفض');
        } catch (error) {
            console.error('Error clearing rejection data:', error);
        }
    }

    handleTabUpdate(tabId, changeInfo, tab) {
        // Check if navigated to Jadarat website
        if (changeInfo.status === 'complete' && tab.url && tab.url.includes('jadarat.sa')) {
            // Inject content script if needed
            this.ensureContentScriptInjected(tabId);
        }
    }

    async ensureContentScriptInjected(tabId) {
        try {
            // Try to ping the content script
            const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
            if (!response) {
                // Content script not responding, inject it
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
            }
        } catch (error) {
            // Content script not injected, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
            } catch (injectionError) {
                console.error('Error injecting content script:', injectionError);
            }
        }
    }

    handleActionClick(tab) {
        // Open popup programmatically if needed
        if (tab.url && tab.url.includes('jadarat.sa')) {
            chrome.action.openPopup();
        } else {
            // Show notification to navigate to Jadarat
            this.createNotification({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'جدارات أوتو',
                message: 'يرجى الانتقال إلى موقع جدارات (jadarat.sa) لاستخدام الإضافة'
            });
        }
    }

    async createNotification(options) {
        const defaultOptions = {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'جدارات أوتو'
        };

        const notificationOptions = { ...defaultOptions, ...options };
        
        try {
            const notificationId = await chrome.notifications.create(notificationOptions);
            // Auto-clear notification after 5 seconds
            setTimeout(() => {
                chrome.notifications.clear(notificationId);
            }, 5000);
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    async logActivity(activity) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                ...activity
            };

            // Get existing logs
            const result = await chrome.storage.local.get(['activityLogs']);
            const logs = result.activityLogs || [];
            
            // Add new log
            logs.push(logEntry);
            
            // Keep only last 100 logs to prevent storage bloat
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }

            // Save back to storage
            await chrome.storage.local.set({ activityLogs: logs });
            
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    async checkPermissions() {
        try {
            const permissions = await chrome.permissions.getAll();
            const requiredPermissions = ['activeTab', 'storage', 'scripting'];
            
            return requiredPermissions.every(permission => 
                permissions.permissions.includes(permission)
            );
        } catch (error) {
            console.error('Error checking permissions:', error);
            return false;
        }
    }

    forwardMessageToPopup(message, tabId) {
        // Try to send message to popup if it's open
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup not open, store message for later
            this.storeMessageForPopup(message, tabId);
        });
    }

    async storeMessageForPopup(message, tabId) {
        try {
            const result = await chrome.storage.local.get(['pendingMessages']);
            const pendingMessages = result.pendingMessages || [];
            
            pendingMessages.push({
                message,
                tabId,
                timestamp: Date.now()
            });

            // Keep only recent messages (last hour)
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            const recentMessages = pendingMessages.filter(
                msg => msg.timestamp > oneHourAgo
            );

            await chrome.storage.local.set({ pendingMessages: recentMessages });
        } catch (error) {
            console.error('Error storing message for popup:', error);
        }
    }

    // Cleanup method
    async cleanup() {
        try {
            // Clean old data
            const result = await chrome.storage.local.get();
            const cleanedData = {};

            // Keep only recent and relevant data
            Object.keys(result).forEach(key => {
                if (key === 'activityLogs') {
                    // Keep only logs from last 7 days
                    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    cleanedData[key] = result[key].filter(
                        log => new Date(log.timestamp).getTime() > weekAgo
                    );
                } else if (key === 'pendingMessages') {
                    // Keep only messages from last hour
                    const hourAgo = Date.now() - (60 * 60 * 1000);
                    cleanedData[key] = result[key].filter(
                        msg => msg.timestamp > hourAgo
                    );
                } else if (key === 'rejectionData') {
                    // Keep rejection data but limit to last 1000 entries
                    if (result[key] && result[key].length > 1000) {
                        cleanedData[key] = result[key].slice(-1000);
                    } else {
                        cleanedData[key] = result[key];
                    }
                } else {
                    // Keep other data as is
                    cleanedData[key] = result[key];
                }
            });

            await chrome.storage.local.clear();
            await chrome.storage.local.set(cleanedData);
            
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Initialize background script
const jadaratAutoBackground = new JadaratAutoBackground();

// Periodic cleanup (every 6 hours)
setInterval(() => {
    jadaratAutoBackground.cleanup();
}, 6 * 60 * 60 * 1000);