// Jadarat Auto - Simplified Background Service Worker

class JadaratAutoBackground {
    constructor() {
        this.initializeListeners();
    }

    initializeListeners() {
        // Handle extension installation or update
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle messages from other parts of the extension
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    handleInstallation(details) {
        if (details.reason === 'install') {
            console.log('Jadarat Auto installed successfully.');
            this.setDefaultSettings();
        } else if (details.reason === 'update') {
            console.log(`Jadarat Auto updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
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
            rejectionData: []
        };

        try {
            await chrome.storage.local.set(defaultSettings);
        } catch (error) {
            console.error('Error setting default settings:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'SAVE_REJECTION_DATA':
                    await this.saveRejectionData(message.rejectionData);
                    sendResponse({ success: true });
                    break;
                case 'EXPORT_REJECTION_DATA':
                    const exportData = await this.exportRejectionDataToCSV();
                    sendResponse({ exportData });
                    break;
                case 'CLEAR_REJECTION_DATA':
                    await this.clearRejectionData();
                    sendResponse({ success: true });
                    break;
                default:
                    // This background script does not handle other messages.
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async saveRejectionData(rejectionData) {
        try {
            const result = await chrome.storage.local.get(['rejectionData']);
            const existingData = result.rejectionData || [];
            existingData.push(rejectionData);
            if (existingData.length > 1000) {
                existingData.splice(0, existingData.length - 1000);
            }
            await chrome.storage.local.set({ rejectionData: existingData });
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
                return { success: false, message: 'No rejection data to export.' };
            }
            const csvHeader = 'Date,Time,Job Title,Rejection Reason\n';
            const csvContent = rejectionData.map(item => {
                return `"${item.date}","${item.time}","${item.jobTitle}","${item.reason}"`;
            }).join('\n');
            const fullCSV = csvHeader + csvContent;
            const blob = new Blob(['\ufeff' + fullCSV], { type: 'text/csv;charset=utf-8;' });
            const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\ufeff' + fullCSV);
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
            return { success: false, message: 'Error exporting data.' };
        }
    }

    async clearRejectionData() {
        try {
            await chrome.storage.local.set({ rejectionData: [] });
            console.log('Rejection data cleared.');
        } catch (error) {
            console.error('Error clearing rejection data:', error);
        }
    }
}

// Initialize background script
new JadaratAutoBackground();
