// Content script for Parapania Auction Tracker Extension

class AuctionTracker {
    constructor() {
        this.lastPrices = {};
        this.lastMaxPrice = null;
        this.lastAuctionKey = null;
        this.isTracking = false;
        this.widget = null;
        
        // Strategy configurations
        this.waitingHours = {
            0.85: 1,
            0.70: 2,
            0.55: 3,
            0.40: 4,
            0.30: 8,
            0.20: 16
        };
        
        this.ratios = [0.85, 0.70, 0.55, 0.40, 0.30, 0.20];
        
        this.init();
    }

    init() {
        console.log('Parapania Auction Tracker initialized');
        
        // Remove any existing widgets first
        this.removeOldWidgets();
        
        // Create new widget
        this.createWidget();
        
        // Start tracking if on auction page
        this.checkAndStartTracking();
        
        // Monitor page changes
        this.observePageChanges();
    }

    removeOldWidgets() {
        // Remove all possible old widgets
        const oldWidgets = document.querySelectorAll('#parapania-auction-widget, [id*="parapania"], [class*="auction-widget"]');
        oldWidgets.forEach(widget => widget.remove());
    }

    createWidget() {
        // Create widget container
        this.widget = document.createElement('div');
        this.widget.id = 'parapania-auction-widget';
        this.widget.innerHTML = `
            <style>
                #parapania-auction-widget {
                    position: fixed !important;
                    top: 80px !important;
                    right: 20px !important;
                    width: 320px !important;
                    min-width: 280px !important;
                    max-width: 500px !important;
                    min-height: 250px !important;
                    max-height: 700px !important;
                    background: white !important;
                    border: 2px solid #00796b !important;
                    border-radius: 12px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
                    z-index: 999999 !important;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                    font-size: 12px !important;
                    user-select: none !important;
                    overflow: hidden !important;
                    resize: both !important;
                }
                
                .widget-header {
                    position: relative !important;
                    background: linear-gradient(135deg, #00796b, #004d40) !important;
                    color: white !important;
                    padding: 8px 12px !important;
                    cursor: move !important;
                    display: flex !important;
                    justify-content: flex-end !important;
                    align-items: center !important;
                }
                
                .widget-title {
                    position: absolute !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    font-weight: bold !important;
                    font-size: 14px !important;
                }
                
                .widget-controls {
                    display: flex !important;
                    gap: 5px !important;
                }
                
                .widget-btn {
                    background: rgba(255,255,255,0.2) !important;
                    border: none !important;
                    color: white !important;
                    width: 20px !important;
                    height: 20px !important;
                    border-radius: 3px !important;
                    cursor: pointer !important;
                    font-size: 12px !important;
                }
                
                .widget-btn:hover {
                    background: rgba(255,255,255,0.3) !important;
                }
                
                .widget-content {
                    padding: 12px !important;
                    height: calc(100% - 36px) !important;
                    overflow-y: auto !important;
                }
                
                .company-section {
                    text-align: center !important;
                    margin-bottom: 10px !important;
                }
                
                .company-info {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    gap: 8px !important;
                    margin-bottom: 8px !important;
                }
                
                .company-name {
                    font-weight: bold !important;
                    color: #00796b !important;
                    font-size: 14px !important;
                }
                
                .company-flag {
                    width: 20px !important;
                    height: 15px !important;
                    object-fit: cover !important;
                    border-radius: 2px !important;
                }
                
                .auction-image-container {
                    text-align: center !important;
                    margin: 10px 0 !important;
                }
                
                .auction-image {
                    max-width: 100px !important;
                    max-height: 100px !important;
                    border-radius: 8px !important;
                    border: 2px solid #ddd !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                }
                
                .auction-title-section {
                    text-align: center !important;
                    margin: 10px 0 !important;
                    padding: 8px !important;
                    background: #f8f9fa !important;
                    border-radius: 6px !important;
                }
                
                .auction-title {
                    font-weight: bold !important;
                    color: #00796b !important;
                    font-size: 15px !important;
                    margin-bottom: 4px !important;
                    line-height: 1.2 !important;
                }
                
                .participant-info {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    gap: 4px !important;
                    font-size: 12px !important;
                    color: #666 !important;
                }
                
                .participant-icon {
                    font-size: 14px !important;
                }
                
                .max-price {
                    text-align: center !important;
                    margin: 8px 0 !important;
                    padding: 4px !important;
                    background: #fff5f5 !important;
                    border-radius: 8px !important;
                    border: 1px solid #ffcdd2 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: center !important;
                    min-height: 60px !important;
                }
                
                .max-price-label {
                    font-size: 12px !important;
                    color: #666 !important;
                    margin-bottom: 4px !important;
                    text-align: center !important;
                    display: block !important;
                    width: 100% !important;
                }
                
                .max-price-value {
                    font-size: 22px !important;
                    font-weight: bold !important;
                    color: #d32f2f !important;
                    text-align: center !important;
                    display: block !important;
                    width: 100% !important;
                    margin: 0 auto !important;
                }
                
                .strategy-section {
                    margin-bottom: 12px !important;
                }
                
                .strategy-section h4 {
                    margin: 8px 0 8px 0 !important;
                    color: #00796b !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 5px !important;
                }
                
                .strategy-list {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 4px !important;
                }
                
                .strategy-item {
                    cursor: pointer !important;
                    background: #f5f5f5 !important;
                    border-radius: 6px !important;
                    padding: 8px 10px !important;
                    border-left: 4px solid #2196f3 !important;
                    transition: transform 0.2s, box-shadow 0.2s !important;
                }

                .strategy-list .strategy-item:first-child {
                    border: 2px solid #FFD700 !important;
                    border-left: 4px solid #FFD700 !important;
                    background: linear-gradient(135deg, #FFFACD, #F0E68C) !important;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.2) !important;
                    animation: glow-pulse 2s ease-in-out infinite alternate !important;
                    transform: scale(1.01) !important;
                }

                @keyframes glow-pulse {
                    0% {
                        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3), 0 0 16px rgba(255, 215, 0, 0.15) !important;
                    }
                    100% {
                        box-shadow: 0 0 12px rgba(255, 215, 0, 0.5), 0 0 24px rgba(255, 215, 0, 0.25) !important;
                    }
                }
                
                .strategy-item:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                }
                
                .strategy-content {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    gap: 10px !important;
                }
                
                .strategy-left {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }
                
                .strategy-label {
                    font-size: 11px !important;
                    color: #666 !important;
                }
                
                .strategy-percentage {
                    font-weight: bold !important;
                    color: #2196f3 !important;
                    font-size: 14px !important;
                }
                
                .strategy-price {
                    font-size: 16px !important;
                    font-weight: bold !important;
                    color: #ff5722 !important;
                }
                
                .strategy-wait-time {
                    background: #e3f2fd !important;
                    color: #1976d2 !important;
                    padding: 2px 8px !important;
                    border-radius: 12px !important;
                    font-size: 10px !important;
                    font-weight: 500 !important;
                }
                
                .cups-section {
                    margin-bottom: 10px !important;
                    background: #f8f9fa !important;
                    padding: 10px !important;
                    border-radius: 8px !important;
                }
                
                .cups-section h4 {
                    margin: 0 0 8px 0 !important;
                    color: #00796b !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 5px !important;
                }
                
                .cups-info {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 4px !important;
                }
                
                .cup-item {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                    padding: 4px 8px !important;
                    border-radius: 6px !important;
                    font-size: 11px !important;
                }
                
                .cup-item.gold {
                    background: linear-gradient(135deg, #ffd700, #ffed4e) !important;
                    color: #b8860b !important;
                    border: 1px solid #daa520 !important;
                }
                
                .cup-item.silver {
                    background: linear-gradient(135deg, #c0c0c0, #e8e8e8) !important;
                    color: #696969 !important;
                    border: 1px solid #a9a9a9 !important;
                }
                
                .cup-item.bronze {
                    background: linear-gradient(135deg, #cd7f32, #daa520) !important;
                    color: #8b4513 !important;
                    border: 1px solid #b8860b !important;
                }
                
                .cup-icon {
                    font-size: 16px !important;
                }
                
                .cup-text {
                    font-weight: 500 !important;
                }
                
                .no-auction {
                    text-align: center !important;
                    padding: 40px 20px !important;
                    color: #666 !important;
                }
                
                .empty-icon {
                    font-size: 48px !important;
                    margin-bottom: 16px !important;
                }
                
                .widget-minimized {
                    height: 36px !important;
                    min-height: 36px !important;
                    max-height: 36px !important;
                    resize: none !important;
                }
                
                .widget-minimized .widget-content {
                    display: none !important;
                }
                
                /* Scrollbar styling */
                .widget-content::-webkit-scrollbar {
                    width: 6px !important;
                }
                
                .widget-content::-webkit-scrollbar-track {
                    background: #f1f1f1 !important;
                    border-radius: 3px !important;
                }
                
                .widget-content::-webkit-scrollbar-thumb {
                    background: #00796b !important;
                    border-radius: 3px !important;
                }
                
                .widget-content::-webkit-scrollbar-thumb:hover {
                    background: #004d40 !important;
                }
            </style>
            
            <div class="widget-header">
                <div class="widget-title">🏆 İhale Takipçisi 🏆</div>
                <div class="widget-controls">
                    <button class="widget-btn" id="minimize-btn">−</button>
                    <button class="widget-btn" id="close-btn">×</button>
                </div>
            </div>
            
            <div class="widget-content">
                <div id="widget-auction-content" class="auction-content">
                    <div class="no-auction">
                        <div class="empty-icon">📋</div>
                        <div><strong>Aktif İhale Bulunamadı</strong></div>
                        <div style="margin-top: 8px; font-size: 11px;">Parapania sitesinde ihale sayfasına gidin</div>
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(this.widget);

        // Make draggable
        this.makeDraggable();

        // Add event listeners
        this.setupWidgetEvents();

        // Load saved position and size
        this.loadWidgetSettings();
    }

    makeDraggable() {
        const header = this.widget.querySelector('.widget-header');
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        header.addEventListener('mousedown', (e) => {
            // Only drag if not clicking on buttons
            if (e.target.classList.contains('widget-btn')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(window.getComputedStyle(this.widget).left, 10);
            startTop = parseInt(window.getComputedStyle(this.widget).top, 10);
            
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const newLeft = startLeft + e.clientX - startX;
            const newTop = startTop + e.clientY - startY;
            
            this.widget.style.setProperty('left',  `${newLeft}px`, 'important');
            this.widget.style.setProperty('top',   `${newTop}px`,  'important');
            this.widget.style.setProperty('right', 'auto',         'important');
            this.widget.style.setProperty('bottom','auto',         'important');

            this.widget.style.right = 'auto';
            this.widget.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';
                this.saveWidgetSettings();
            }
        });
    }

    setupWidgetEvents() {
        // Minimize button
        const minimizeBtn = this.widget.querySelector('#minimize-btn');
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.widget.classList.toggle('widget-minimized');
            minimizeBtn.textContent = this.widget.classList.contains('widget-minimized') ? '+' : '−';
            this.saveWidgetSettings();
        });

        // Close button
        const closeBtn = this.widget.querySelector('#close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.widget.style.display = 'none';
            this.saveWidgetSettings();
        });

        // Prevent widget clicks from propagating
        this.widget.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Save size when resizing
        const resizeObserver = new ResizeObserver(() => {
            this.saveWidgetSettings();
        });
        resizeObserver.observe(this.widget);
    }

    saveWidgetSettings() {
        const rect = this.widget.getBoundingClientRect();
        const settings = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            minimized: this.widget.classList.contains('widget-minimized'),
            visible: this.widget.style.display !== 'none'
        };
        localStorage.setItem('parapania-widget-settings', JSON.stringify(settings));
    }

    loadWidgetSettings() {
        const saved = localStorage.getItem('parapania-widget-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            
            this.widget.style.left = settings.left + 'px';
            this.widget.style.top = settings.top + 'px';
            this.widget.style.width = settings.width + 'px';
            this.widget.style.height = settings.height + 'px';
            this.widget.style.right = 'auto';
            this.widget.style.bottom = 'auto';
            
            if (settings.minimized) {
                this.widget.classList.add('widget-minimized');
                this.widget.querySelector('#minimize-btn').textContent = '+';
            }
            
            if (!settings.visible) {
                this.widget.style.display = 'none';
            }
        }
    }

    checkAndStartTracking() {
        const auctionElement = document.querySelector("#ihale");
        if (auctionElement) {
            this.startTracking();
        }
    }

    startTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        console.log('Auction tracking started');
        
        // Show widget
        this.widget.style.display = 'block';
        
        // Track auction data every 10ms (like original code)
        this.trackingInterval = setInterval(() => {
            this.trackAuction();
        }, 10);
    }

    stopTracking() {
        if (!this.isTracking) return;
        
        this.isTracking = false;
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }
        console.log('Auction tracking stopped');
    }

    observePageChanges() {
        const observer = new MutationObserver(() => {
            this.checkAndStartTracking();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    getAuctionData() {
        try {
            // Original selectors from your code
            const priceElement = document.querySelector("#ihale > div:nth-child(2) > div:nth-child(4) > b");
            if (!priceElement) return null;

            const priceText = priceElement.textContent.trim();
            const maxPrice = parseFloat(priceText.replace(/\./g, "").replace(",", "."));
            
            if (isNaN(maxPrice)) return null;

            // Auction info (product name + stock)
            const auctionInfoElement = document.querySelector("#ihale > div:nth-child(2) > div:nth-child(3)");
            const auctionInfo = auctionInfoElement ? auctionInfoElement.textContent.trim() : "İhale bilgisi yok";

            // Company name
            const companyElement = document.querySelector("#ihale > div:nth-child(2) > div.yb-1.mx-auto.mt-2");
            const companyName = companyElement ? companyElement.textContent.trim() : "Şirket bilgisi yok";

            // Company flag
            const flagElement = document.querySelector("#ihale > div:nth-child(2) > div.yb-1.mx-auto.mt-2 > img");
            const flagSrc = flagElement ? flagElement.src : null;

            // Participant count
            const participantElement = document.querySelector("#ihale > div.vstack.gap-2.position-absolute.mt-2.top-0.end-0.me-2.mt-1.z-1 > div.uyeler.border.border-secondary-subtle.full-radius.w30.h40.position-relative.custom-tooltip > span");
            const participantCount = participantElement ? participantElement.textContent.trim() : "0";

            // Get auction image
            const imageElement = document.querySelector("#ihale > div:nth-child(2) > div.ihale-resim.position-relative.w40.mx-auto.my-2 > img");
            const imageSrc = imageElement ? imageElement.src : null;

            return {
                maxPrice: maxPrice,
                auctionInfo: auctionInfo,
                companyName: companyName,
                flagSrc: flagSrc,
                participantCount: participantCount,
                imageSrc: imageSrc,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('Error getting auction data:', error);
            return null;
        }
    }

    trackAuction() {
        const auctionData = this.getAuctionData();
        if (!auctionData) {
            this.updateWidgetNoAuction();
            return;
        }

        const auctionKey = `${auctionData.auctionInfo}||${auctionData.participantCount}`;
        
        // Check if auction changed or price updated (like original code)
        if (auctionKey !== this.lastAuctionKey || auctionData.maxPrice !== this.lastMaxPrice) {
            this.lastPrices = {};
            this.lastMaxPrice = auctionData.maxPrice;
            this.lastAuctionKey = auctionKey;

            // Console output (original code)
            console.clear();
            console.log(`%c${auctionData.auctionInfo} - Katılımcı: ${auctionData.participantCount}`, "font-weight: bold; font-size: 20px; color: #00796b;");
            console.log(`%cMaksimum Teklif Fiyatı: %c${auctionData.maxPrice.toFixed(2)} ₺`,
                "font-weight: normal; color: gray;",
                "font-weight: bold; font-size: 18px; color: #d32f2f;"
            );

            // Update widget
            this.updateWidget(auctionData);
        }

        // Track price changes for each ratio (like original code)
        let priceUpdated = false;
        this.ratios.forEach(ratio => {
            const targetPrice = auctionData.maxPrice * ratio;
            const roundedPrice = Math.round((targetPrice + Number.EPSILON) * 100) / 100;

            if (this.lastPrices[ratio] !== roundedPrice) {
                // Console output (original code)
                const saat = this.waitingHours[ratio];
                console.log(
                    `%cTeklif fiyatı (%c${(ratio*100).toFixed(0)}%): %c${roundedPrice.toFixed(2)}%c ₺ %c${saat} saat`,
                    "font-weight: normal; color: gray;",
                    "font-weight: bold; color: #2196f3;",
                    "font-weight: bold; font-size: 18px; color: #ff5722; text-decoration: underline;",
                    "font-weight: bold; font-size: 18px; color: #ff5722;",
                    "font-weight: normal; color: gray;"
                );
                
                this.lastPrices[ratio] = roundedPrice;
                priceUpdated = true;
            }
        });

        if (priceUpdated) {
            console.log("%c-------------------------------", "color: #999;");
            this.updateWidget(auctionData);
        }
    }

    updateWidget(auctionData) {
        const content = this.widget.querySelector('#widget-auction-content');
        
        let strategiesHtml = '';
        this.ratios.forEach(ratio => {
            const targetPrice = auctionData.maxPrice * ratio;
            const roundedPrice = Math.round((targetPrice + Number.EPSILON) * 100) / 100;
            const waitHours = this.waitingHours[ratio];
            
            strategiesHtml += `
                <div class="strategy-item">
                    <div class="strategy-content">
                        <div class="strategy-left">
                            <span class="strategy-label">Teklif fiyatı</span>
                            <span class="strategy-percentage">(${(ratio * 100).toFixed(0)}%):</span>
                            <span class="strategy-price">
                            ${roundedPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </div>
                        <span class="strategy-wait-time">${waitHours} saat</span>
                    </div>
                </div>
            `;
        });

        // Company info HTML
        const companyHtml = `
            <div class="company-section">
                <div class="company-info">
                    <span class="company-name">${auctionData.companyName}</span>
                    ${auctionData.flagSrc ? `<img src="${auctionData.flagSrc}" alt="Flag" class="company-flag" />` : ''}
                </div>
            </div>
        `;

        // Image HTML
        const imageHtml = auctionData.imageSrc ? 
            `<div class="auction-image-container">
                <img src="${auctionData.imageSrc}" alt="İhale Resmi" class="auction-image" />
            </div>` : '';

        content.innerHTML = `
            ${companyHtml}
            
            ${imageHtml}
            
            <div class="auction-title-section">
                <div class="auction-title">${auctionData.auctionInfo}</div>
                <div class="participant-info">
                    <span class="participant-icon">👥</span>
                    <span>${auctionData.participantCount} katılımcı</span>
                </div>
            </div>
            
            <div class="max-price">
                <div class="max-price-label">Maksimum Teklif</div>
                <div class="max-price-value">${auctionData.maxPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</div>
            </div>
            
            <div class="strategy-section">
                <h4>📊 Fiyat Önerileri</h4>
                <div class="strategy-list">
                    ${strategiesHtml}
                </div>
            </div>
            
            <div class="cups-section">
                <h4>🏆 Kupa Sistemi</h4>
                <div class="cups-info">
                    <div class="cup-item gold">
                        <span class="cup-icon">🥇</span>
                        <span class="cup-text">Altın: %85+ (10 puan)</span>
                    </div>
                    <div class="cup-item silver">
                        <span class="cup-icon">🥈</span>
                        <span class="cup-text">Gümüş: %70+ (5 puan)</span>
                    </div>
                    <div class="cup-item bronze">
                        <span class="cup-icon">🥉</span>
                        <span class="cup-text">Bronz: %55+ (1 puan)</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateWidgetNoAuction() {
        const content = this.widget.querySelector('#widget-auction-content');
        content.innerHTML = `
            <div class="no-auction">
                <div class="empty-icon">📋</div>
                <div><strong>Aktif İhale Bulunamadı</strong></div>
                <div style="margin-top: 8px; font-size: 11px;">Parapania sitesinde ihale sayfasına gidin</div>
            </div>
        `;
    }
}



// Initialize auction tracker when page loads
if (document.readyState === 'loading') {
    
    document.addEventListener('DOMContentLoaded', () => {
        new AuctionTracker();
    });
    
} else {
    new AuctionTracker();
}